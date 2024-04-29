import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useWalletContext } from "@/contexts/WalletContext"
import { useState } from "react"
import CardanoWalletSelection from "./CardanoWalletSelection"
import { ArrowLeft, Loader2 } from "lucide-react"

export function ConnectDialog({ text }: { text: string | React.ReactNode }) {
    const { connectWallet, walletName } = useWalletContext();

    //const { login: web3authLogin, isLoading: isWeb3AuthLoading } = useWeb3Auth();
    return (
        <Dialog  >
            <DialogTrigger asChild>
                <Button>
                    {text}
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px] justify-center text-center content-center">
                <DialogHeader className="text-center justify-center content-center" >
                    <DialogTitle className="text-center" >Connect to Arcanum</DialogTitle>
                    <DialogDescription className="text-center" >
                        Choose your login method
                    </DialogDescription>
                </DialogHeader>

                <CardanoWalletSelection />

            </DialogContent>
        </Dialog>
    )
}
