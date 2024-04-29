import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogClose,
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
import { useEffect, useRef, useState } from "react"
import { ArrowLeft, ArrowRight, Loader2 } from "lucide-react"
import { useBookContext } from "@/contexts/BookContext"
import BookGrid from "../books/BookGrid"
import TokenCard from "../books/TokenCard"
import { Book } from "@/types/bookio"
import { swapBooks } from "@/utils/validators"
import { toast } from "sonner"

export function TradeDialog({ onClick }: { onClick?: (e: any) => void }) {
    const { cart, booksToSend, emptyCart, setBooksToSend } = useBookContext();
    const [isLoading, setIsLoading] = useState(false);
    const { lucid, walletApi } = useWalletContext();
    const closeRef = useRef<HTMLButtonElement>(null);
    const onConfirm = async () => {
        setIsLoading(true)
        try {
            lucid?.selectWallet(walletApi!)
            const toReceive = { [cart[0].tokenId]: 1n }
            const toSend = { [booksToSend[0].tokenId]: 1n }
            const txHash = await swapBooks(lucid!, toReceive, toSend)
            console.log({ txHash })
            closeRef.current?.click()
            toast.success("Trade successful",{
                description: `txHash: ${txHash}`
            })
            emptyCart()
        } catch (e: any) {
            toast.error("Trade failed", {
                description: e.message ? e.message : e.info ? e.info : e.toString(),
            })
        }
        setIsLoading(false)
    }
    //const { login: web3authLogin, isLoading: isWeb3AuthLoading } = useWeb3Auth();
    return (
        <Dialog >
            <DialogTrigger asChild>
                <Button onClick={onClick}  >
                    Select
                </Button>
            </DialogTrigger>
            <DialogContent className="min-w-[80vw] max-h-[80vh] h-[80vh] justify-even text-center content-center flex items-center flex-col">
                <DialogHeader className="text-center justify-center content-center" >
                    <DialogTitle className="text-center" >Swap</DialogTitle>
                    <DialogDescription className="text-center" >
                        Confirm your trade
                    </DialogDescription>
                </DialogHeader>
                <div className="h-2/3 flex flex-col  m-0">
                    <div className="flex gap-2 justify-center flex-col sm:flex-row items-center w-full content-center">
                        {cart.length > 0 && <div className="flex w-1/6 sm:w-2/12 flex-col gap-2">
                            <h2>You get</h2>
                            <TokenCard token={cart[0]} />
                        </div>}
                        <ArrowRight size={32} />
                        {booksToSend.length > 0 && <div className="flex w-1/6 sm:w-2/12 flex-col gap-2">
                            <h2>You leave</h2>
                            <TokenCard token={booksToSend[0] || []} />
                        </div>}
                    </div>
                    <div className="flex flex-row gap-2 w-full justify-center">
                        {isLoading ?
                            <Loader2 className="animate-spin"></Loader2>
                            : <Button onClick={onConfirm} >
                                Confirm
                            </Button>}
                        <DialogClose ref={closeRef} >
                            {!isLoading && <Button onClick={() => { setBooksToSend([]) }} variant="destructive">
                                Cancel
                            </Button>}
                        </DialogClose>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    )
}
