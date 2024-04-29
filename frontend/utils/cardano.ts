import { BookBalance, CardanoAddressInfo, TokenBalance, TokenInfo } from "../types/cardano"
import { fromLabel } from 'lucid-cardano'



export const tokenNameFromUnit = (unit: string) => unit === 'lovelace' ? 'ADA' : tokenNameFromAssetName(unit.replace(unit.slice(0, 56), ""))//Buffer.from(unit.replace(unit.slice(0, 56), ""), "hex").toString("ascii")
export const tokenNameFromAssetName = (assetName: string) => assetName == 'lovelace' ? 'ADA ' : (() => {
    const label = fromLabel(assetName.slice(0, 8));
    const name = (() => {
        const hexName = Number.isInteger(label) ? Buffer.from(assetName.slice(8), "hex").toString("ascii") : Buffer.from(assetName, "hex").toString("ascii");
        return hexName || null;
    })();
    return Number.isInteger(label) ? `(${label}) ${name}` : name
    //Buffer.from(assetName, "hex").toString("ascii")
})()


export const getCardanoAddressInfo = async (address: string): Promise<CardanoAddressInfo> => {
    const result = await fetch(
        `${process.env.NEXT_PUBLIC_BLOCKFROST_URL}/addresses/${address}`,
        {
            headers: {
                project_id: process.env.NEXT_PUBLIC_BLOCKFROST_PROJECT_ID as string,
                "Content-Type": "application/json",
            },
        },
    ).then((res) => res.json());

    if (result.error) {
        if (result.status_code === 400) throw new Error("Invalid Request");
        else if (result.status_code === 500) throw new Error("Internal Error");
        // else address not found because it's a new address
        else {
            return {
                address: address,
                amount: [],
                stake_address: "",
                type: "byron",
                script: false
            }
        }
        // else return Buffer.from(C.Value.new(C.BigNum.from_str('0')).to_bytes()).toString('hex');
    }
    return result
}


const convertMetadataPropToString = (src: any) => {
    if (typeof src === 'string') return src;
    else if (Array.isArray(src)) return src.join('');
    return null;
};

const linkToSrc = (link: string, base64 = false) => {
    const base64regex =
        /^([0-9a-zA-Z+/]{4})*(([0-9a-zA-Z+/]{2}==)|([0-9a-zA-Z+/]{3}=))?$/;
    if (link.startsWith('https://')) return link;
    else if (link.startsWith('ipfs://'))
        return (
            'https://ipfs.io/ipfs/' +
            link.split('ipfs://')[1].split('ipfs/').slice(-1)[0]
        );
    else if (
        (link.startsWith('Qm') && link.length === 46) ||
        (link.startsWith('baf') && link.length === 59)
    ) {
        return 'https://ipfs.io/ipfs/' + link;
    } else if (base64 && base64regex.test(link))
        return 'data:image/png;base64,' + link;
    else if (link.startsWith('data:image')) return link;
    return null;
};


const fromAssetUnit = (unit: string) => {
    const policyId = unit.slice(0, 56);
    const label = fromLabel(unit.slice(56, 64));
    const name = (() => {
        const hexName = Number.isInteger(label) ? unit.slice(64) : unit.slice(56);
        return unit.length === 56 ? '' : hexName || null;
    })();
    return { policyId, name, label };
}

async function batchProcess(items: any, batchSize: number, processFunction: any) {
    let result: any = [];
    for (let i = 0; i < items.length; i += batchSize) {
        const batch = items.slice(i, i + batchSize);
        const batchResults = await Promise.all(batch.map((item: any) => processFunction(item)));
        result = result.concat(batchResults);
    }
    return result;
}
export const getCardanoAssetsByAddress = async (address: string, options?: { ignoreDetails?: boolean, page?: number, pageLength?: number, policies?: string[] }) => {
    const allNFTs: any = []
    const ignoreDetails = options && options.ignoreDetails ? options.ignoreDetails : false
    const page = options && options.page ? options.page : 1
    const pageLength = options && options.pageLength ? options.pageLength : 30
    var addressInfo: TokenBalance = { NFTs: [], FTs: [] }

    const data = await getCardanoAddressInfo(address)
    if (data && data.amount && data.amount.length > 0) {
        const fungible: TokenInfo[] = [];
        const NFT: TokenInfo[] = [];

        const batchSize = 5; // Adjust the batch size according to the rate limit
        const slicedData = options && options.page ? data.amount.slice((page - 1) * (pageLength || 30), page * (pageLength || 30)) : data.amount
        const assetDetailsPromises = slicedData?.filter((asset: any) => asset.unit !== 'lovelace' && !ignoreDetails)
            .filter((asset: any) => !options?.policies || options.policies.includes(asset.unit.slice(0, 56)))
            .map((asset: any) => () => fetch(`${process.env.NEXT_PUBLIC_BLOCKFROST_URL}/assets/${asset.unit}`, {
                headers: {
                    project_id: process.env.NEXT_PUBLIC_BLOCKFROST_PROJECT_ID as string,
                    'Content-Type': 'application/json'
                }
            }).then(res => res.json()).catch(e => console.log("error fetching asset", e)));

        const assetDetails = await batchProcess(assetDetailsPromises, batchSize, (promise: any) => promise());
        for (let i = 0; i < assetDetails.length; i++) {
            const asset = assetDetails[i];
            // const asset = data.amount[i];
            if (asset) {
                const { policyId, name, label } = fromAssetUnit(asset.asset);
                const hasNFTOnchainMetadata = asset.onchain_metadata &&
                    ((asset.onchain_metadata.version === 2 &&
                        asset.onchain_metadata?.[`0x${policyId}`]?.[`0x${name}`]) ||
                        asset.onchain_metadata);
                const meta = asset.onchain_metadata;

                const isNFT = Number(asset.quantity) == 1 && (hasNFTOnchainMetadata && !label) || label === 222;
                const isFungible = asset.mint_or_burn_count > 1 || !asset.onchain_metadata?.image;

                const image =
                    (meta &&
                        meta.image &&
                        linkToSrc(convertMetadataPropToString(meta.image) || '')) ||
                    (asset.metadata &&
                        asset.metadata.logo &&
                        linkToSrc(asset.metadata.logo, true)) ||
                    '';
                (!isNFT ? fungible : NFT).push({
                    amount: BigInt(data.amount.find((a: any) => a.unit === asset.asset)?.quantity || 0),
                    existingAmount: BigInt(asset.quantity),
                    name: tokenNameFromAssetName(asset.asset_name || "")!,
                    tokenId: asset.asset,
                    metadata: { image, name: meta?.extraAttributes["Book Title"] || asset.metadata?.name || meta?.name, description: asset.metadata?.description || meta?.description, authors: asset.metadata?.authors || meta?.authors || [], },
                    decimals: asset.metadata?.decimals,
                    symbol: asset.metadata?.ticker ? asset.metadata?.ticker : meta?.symbol ? meta?.symbol : tokenNameFromAssetName(asset.asset_name || "")!,

                });

                /* if (meta) {
                    allNFTs.push(asset);
                } */
            }
        }

        addressInfo.NFTs = NFT
        addressInfo.FTs = fungible
        const lovelaceAsset = data.amount.find((asset: any) => asset.unit === 'lovelace');
        if (lovelaceAsset) {
            addressInfo.balance = BigInt(lovelaceAsset.quantity);
        }

    }
    /* const count = data.amount? data.amount.length : 0
    addressInfo.count = count */
    console.log({ addressInfo });
    return addressInfo;
}



export const getBooksByAddress = async (address: string, options?: { ignoreDetails?: boolean, page?: number, pageLength?: number, policies?: string[] }) => {
    const allNFTs: any = []
    const ignoreDetails = options && options.ignoreDetails ? options.ignoreDetails : false
    const page = options && options.page ? options.page : 1
    const pageLength = options && options.pageLength ? options.pageLength : 30
    var addressInfo: BookBalance = { books: [] }
    const data = await getCardanoAddressInfo(address)
    if (data && data.amount && data.amount.length > 0) {
        const books: TokenInfo[] = [];
        const batchSize = 5; // Adjust the batch size according to the rate limit
        let slicedData = data.amount
            .filter((asset: any) => asset.unit != "lovelace" && (!options?.policies || options.policies.includes(asset.unit.slice(0, 56) )))

        const booksWithUniquePolicy = slicedData.reduce((acc: any, asset: any) => {
            if (!acc.find((a: any) => a.unit.slice(0, 56) === asset.unit.slice(0, 56))) {
                acc.push(asset)
            } else {
                //find the asset with the same policy and add the quantity to the existing one
                const existingAsset = acc.find((a: any) => a.unit.slice(0, 56) === asset.unit.slice(0, 56))
                existingAsset.quantity = (BigInt(existingAsset.quantity) + BigInt(asset.quantity)).toString().replace(/^0+/, '')
            }
            return acc
        }, [])
        const slicedBooksWithUniquePolicy = options && options.page ?
            booksWithUniquePolicy.slice((page - 1) * (pageLength || 30), page * (pageLength || 30))
            : booksWithUniquePolicy
       // slicedData = slicedData
        
        const assetDetailsPromises = slicedBooksWithUniquePolicy
            .map((asset: any) => () => fetch(`${process.env.NEXT_PUBLIC_BLOCKFROST_URL}/assets/${asset.unit}`, {
                headers: {
                    project_id: process.env.NEXT_PUBLIC_BLOCKFROST_PROJECT_ID as string,
                    'Content-Type': 'application/json'
                }
            }).then(res => res.json()).catch(e => console.log("error fetching asset", e)));

        const assetDetails = await batchProcess(assetDetailsPromises, batchSize, (promise: any) => promise());

        for (let i = 0; i < assetDetails.length; i++) {
            const asset = assetDetails[i];
            // const asset = data.amount[i];
            if (asset) {
                const { policyId, name, label } = fromAssetUnit(asset.asset);
                const meta = asset.onchain_metadata;

                const image =
                    (meta &&
                        meta.image &&
                        linkToSrc(convertMetadataPropToString(meta.image) || '')) ||
                    (asset.metadata &&
                        asset.metadata.logo &&
                        linkToSrc(asset.metadata.logo, true)) ||
                    '';

                books.push({
                    amount: BigInt(data.amount.find((a: any) => a.unit === asset.asset)?.quantity || 0),
                    existingAmount: BigInt(asset.quantity),
                    name: tokenNameFromAssetName(asset.asset_name || "")!,
                    tokenId: asset.asset,
                    metadata: { image, name: meta.extraAttributes ? meta?.extraAttributes["Book Title"] : asset.metadata?.name || meta?.name, description: asset.metadata?.description || meta?.description, authors: asset.metadata?.authors || meta?.authors || [], },
                    decimals: asset.metadata?.decimals,
                    symbol: asset.metadata?.ticker ? asset.metadata?.ticker : meta?.symbol ? meta?.symbol : tokenNameFromAssetName(asset.asset_name || "")!,

                });

            }

        }
        addressInfo.books = books
        const lovelaceAsset = data.amount.find((asset: any) => asset.unit === 'lovelace');
        if (lovelaceAsset) {
            addressInfo.balance = BigInt(lovelaceAsset.quantity);
        }
    }
    /* const count = data.amount? data.amount.length : 0
    addressInfo.count = count */
    console.log({ addressInfo });
    return addressInfo;
}