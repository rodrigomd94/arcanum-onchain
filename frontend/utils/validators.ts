import { C, Credential, Data, Lucid, Script, UTxO, generatePrivateKey, getAddressDetails } from "lucid-cardano";
import { OracleMain, TakeABookTakeABook } from "./plutus";

const ORACLE_TOKEN = "fdf2ab833eb1449a343a35e9bbbcb1a9f466688c6a0f31f0511e2b184f7261636c65546f6b656e"

const findBookUTXOs = async (lucid: Lucid, bookTokens: { [key: string]: bigint }, bookAddress: string) => {
    const allUTxOs = await lucid.utxosAt(bookAddress)
    console.log({ bookAddress })
    const collectedUTxOs: { utxo: UTxO, collectedBooks: number }[] = []
    const collectedAssets: { [key: string]: bigint } = {}
    for (let book of Object.keys(bookTokens)) {
        const bookUTxOs = allUTxOs.reduce((acc: { utxo: UTxO, collectedBooks: number }[], utxo) => {
            if (Object.keys(utxo.assets).includes(book)) {
                if (!collectedAssets[book] || collectedAssets[book] < bookTokens[book]) {
                    acc.push({ utxo, collectedBooks: Number(utxo.assets[book]) })
                }
                collectedAssets[book] = collectedAssets[book] ? collectedAssets[book] + BigInt(utxo.assets[book]) : BigInt(utxo.assets[book])
            }
            return acc
        }, [])
        //allUTxOs.reduce(utxo => Object.keys(utxo.assets).includes(book))
        collectedUTxOs.push(...bookUTxOs)
    }
    //console.log({ collectedUTxOs })
    return collectedUTxOs
}

export const calculateSendBack = (booksToReceive: { [key: string]: bigint }, collectedUTxOs: UTxO[]) => {
    const sendBack: {
        assets: {
            [key: string]: bigint
        },
        utxo: UTxO,
        datum: string
    }[] = []
    const allBookAssets = collectedUTxOs.reduce((acc: { [key: string]: bigint }, utxo) => {
        Object.keys(utxo.assets).filter(asset => Object.keys(booksToReceive).includes(asset)).forEach(token => {
            acc[token] = acc[token] ? acc[token] + BigInt(utxo.assets[token]) : BigInt(utxo.assets[token])
        })
        return acc
    }, {})
    console.log({ allBookAssets })
    for (let utxo of collectedUTxOs) {
        const assetsToReturn: { [key: string]: bigint } = {}
        for (let asset of Object.keys(utxo.assets)) {
            if (!Object.keys(booksToReceive).includes(asset) && asset !== "lovelace") {
                assetsToReturn[asset] = BigInt(utxo.assets[asset])
            } else if (asset !== "lovelace") {
                if (BigInt(utxo.assets[asset]) <= allBookAssets[asset]) {
                    allBookAssets[asset] = allBookAssets[asset] - BigInt(utxo.assets[asset])
                } else {
                    assetsToReturn[asset] = BigInt(utxo.assets[asset]) - allBookAssets[asset]
                    allBookAssets[asset] = 0n
                }
            }
        }
        if (Object.keys(assetsToReturn).length > 0) {
            const d: TakeABookTakeABook["_datum"] = { prevInput: { transactionId: { hash: utxo.txHash }, outputIndex: BigInt(utxo.outputIndex) } }
            const datum = Data.to(d, TakeABookTakeABook._datum)
            sendBack.push({ assets: assetsToReturn, utxo, datum: datum })
        }
    }
    return sendBack
}

export const getContractAddress = (lucid: Lucid) =>{
    const oraclePolicy = ORACLE_TOKEN.slice(0, 56)
    const validator = new TakeABookTakeABook(oraclePolicy)
    const validatorAddress = lucid?.utils.validatorToAddress(validator)
    return validatorAddress

}
export const addBooksToTx = (booksToSend: { [key: string]: bigint }, collectedUTxOs: { utxo: UTxO, collectedBooks: number }[]) => {
    const remainingBooks = { ...booksToSend }
    const sendData: { datum: string, books: { [key: string]: bigint } }[] = []
    for (let utxo of collectedUTxOs) {
        const assetsToSend: { [key: string]: bigint } = {}
        const d: TakeABookTakeABook["_datum"] = { prevInput: { transactionId: { hash: utxo.utxo.txHash }, outputIndex: BigInt(utxo.utxo.outputIndex) } }
        const datum = Data.to(d, TakeABookTakeABook._datum)

        const bookList = Object.keys(remainingBooks).filter(book => remainingBooks[book] > 0n)
        let counter = utxo.collectedBooks
        for (let book of bookList) {
            if (counter === 0) break
            if (remainingBooks[book] >= BigInt(counter)) {
                remainingBooks[book] = remainingBooks[book] - BigInt(counter)
                assetsToSend[book] = BigInt(counter)
                counter = 0
            } else {
                counter = counter - Number(remainingBooks[book])
                assetsToSend[book] = remainingBooks[book]
                remainingBooks[book] = 0n
            }

        }
        sendData.push({ datum, books: assetsToSend })
    }
    return sendData
}
export const swapBooks = async (lucid: Lucid, booksToReceive: { [key: string]: bigint }, booksToSend: { [key: string]: bigint }) => {
    const oracleAddress = lucid.utils.validatorToAddress(new OracleMain())


    const oracleUtxo = (await lucid.utxosAtWithUnit(oracleAddress, ORACLE_TOKEN)).find((utxo)=>{
        const datum = Data.from(utxo.datum!, OracleMain.datum)

        // TO DO: change this so that it finds multiple utxos if there are tokens with multiple policies
        return datum.allowedPolicies.includes(Object.keys(booksToReceive)[0].slice(0, 56))
    })
    if(!oracleUtxo) throw new Error("Oracle UTXO not found")
    const oracleDatum = Data.from(oracleUtxo.datum!, OracleMain.datum)
    const allowedPolicies = oracleDatum.allowedPolicies
    const validator = new TakeABookTakeABook(ORACLE_TOKEN.slice(0, 56))
    const validatorAddress = getContractAddress(lucid)
    const collectedUTxOs = await findBookUTXOs(lucid, booksToReceive, validatorAddress)
    const sendBack = calculateSendBack(booksToReceive, collectedUTxOs.map(utxo => utxo.utxo))
    //console.log({oracleUtxo, collectedUTxOs, sendBack})
    try {
        const tx = lucid.newTx()
            .readFrom([oracleUtxo])
            .collectFrom(collectedUTxOs.map(utxo => utxo.utxo), Data.void())
            .attachSpendingValidator(validator)
            .payToAddress(await lucid.wallet.address(), booksToReceive)
            .attachSpendingValidator(validator)

        const sendData = addBooksToTx(booksToSend, collectedUTxOs)
        for (let { datum, books } of sendData) {
            tx.payToContract(validatorAddress, { inline: datum }, books)
        }
        for (let { assets, utxo, datum } of sendBack) {
            tx.payToContract(validatorAddress, { inline: datum }, assets)
        }

        const txComplete = await tx.complete()
        const txSigned = await txComplete.sign().complete()
        const txHash = await txSigned.submit()
        return txHash
    } catch (e) {
        console.error("ERORRR", e)
    }

}


export const donateBooks = async (lucid: Lucid, booksToSend: { [key: string]: bigint }) => {
    const validatorAddress = getContractAddress(lucid)
    const depositDatum: TakeABookTakeABook["_datum"] = { prevInput: null }
    const depositData = Data.to(depositDatum, TakeABookTakeABook._datum)
    const tx = await lucid.newTx()
    .payToContract(validatorAddress, { inline: Data.to(depositDatum, TakeABookTakeABook._datum) }, booksToSend)
    .complete()
    const txSigned = await tx.sign().complete()
    const txHash = await txSigned.submit()
    return txHash

}