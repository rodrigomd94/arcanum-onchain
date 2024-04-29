import { Blockfrost, Lucid, WalletApi } from "lucid-cardano";
import React, { createContext, useContext, useEffect, useState } from "react";
import { get } from "http";
import { getBooksByAddress, getCardanoAssetsByAddress } from "@/utils/cardano";
import { BookBalance, TokenBalance } from "../types/cardano";
import { bookPolicies } from "@/utils/constants";

export const WalletContext = createContext<{
    walletName: string,
    walletAddress:string,
    walletApi: WalletApi | null,
    lucid: Lucid | null,
    connected: boolean,
    connectWallet: (walletName: string) => void,
    disconnectWallet: () => void,
    balance: BookBalance | null
}>({
    walletName: "",
    walletAddress:"",
    walletApi: null,
    connected: false,
    lucid: null,
    connectWallet: (walletName: string) => { },
    disconnectWallet: () => { },
    balance: { balance: 0n, books:[]}
});

export const useWalletContext = () => {
    return useContext(WalletContext);
}


export const WalletProvider = ({ children }: { children: React.ReactNode }) => {
    const [walletName, setWalletName] = useState<string>("");
    const [walletApi, setWalletApi] = useState<WalletApi | null>(null);
    const [lucid, setLucid] = useState<Lucid | null>(null);
    const [connected, setConnected] = useState<boolean>(false);
    const [balance, setBalance] = useState<BookBalance | null>({ balance: 0n, books:[] });
    const [walletAddress, setWalletAddress] = useState<string>("");
    //const { logout: web3authLogout, web3AuthAPI, walletAddress, login: web3auth!.fullLogin, loggedIn, getAccounts, getBalance, isLoading } = useWeb3Auth();

    const connectWallet = async (walletName: string) => {
        console.log("connecting wallet")
        setWalletName(walletName);
        const walletApi = await window.cardano[walletName].enable();
        setWalletApi(walletApi);
        Lucid.new(new Blockfrost(process.env.NEXT_PUBLIC_BLOCKFROST_URL as string, process.env.NEXT_PUBLIC_BLOCKFROST_PROJECT_ID as string)).then(async (lucid) => {
            lucid.selectWallet(walletApi);
            const address = await lucid.wallet.address();
          // const address = "addr1q8y4ldg2e5nuyst5ty4gdp8e62fgkgv7cc73qd7f0f4e4m42djal9l8tpqzqwquae69t2dyjdzss7mxmrmnwv7mthd4s837f5f"
            setWalletAddress(address);
            setLucid(lucid);
           // const cardanoBalance = await getBooksByAddress(address, {policies:bookPolicies});
            //setBalance( cardanoBalance);
        });
        console.log(window)
        setConnected(true);
        localStorage.setItem("walletName", walletName);
        localStorage.setItem("connected", "true");
    }

    const disconnectWallet = () => {
        console.log("disconnecting wallet")
        setConnected(false);
        setWalletName("");
        setWalletAddress("");
        setWalletApi(null);
        localStorage.removeItem("walletName");
        localStorage.removeItem("connected");
    }

    /* if(isWeb3AuthNotInstantiated || !web3auth) return (
        <WalletContext.Provider value={{ walletName, walletApi, blockchain, lucid, connectWallet, connected, addresses, disconnectWallet, setBlockchain, balance }}>
            {children}
        </WalletContext.Provider>
    ); */

    useEffect(() => {
        const walletName = localStorage.getItem("walletName");
        if (walletName ) {
            connectWallet(walletName);
            //setWalletName(walletName);
        }
    }, [])

    

    return (
        <WalletContext.Provider value={{ walletName, walletApi, lucid, connectWallet, connected, disconnectWallet, balance, walletAddress }}>
            {children}
        </WalletContext.Provider>
    )
}