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
import { ArrowLeft, Loader2 } from "lucide-react"
import { useBookContext } from "@/contexts/BookContext"
import BookGrid from "../books/BookGrid"

export function SelectUserBooksDialog({onClick}: {onClick?: (e:any) => void}){
    const { walletName, walletAddress } = useWalletContext();
    const { userBooks, findBooks, cart, addBooksToCart, removeBooksFromCart, emptyCart } = useBookContext();
    const [searchTerm, setSearchTerm] = useState<string>("");
    const [filteredBooks, setFilteredBooks] = useState(userBooks);
    const closeRef = useRef<HTMLButtonElement>(null);
    const onSearch = async () => {
        setFilteredBooks(await findBooks(searchTerm, "user"));
    }
    useEffect(() => {
        if (searchTerm === "") {
            setFilteredBooks(userBooks);
        }
    }, [userBooks])
    useEffect(()=>{
        if(cart.length === 0){
            closeRef.current?.click();
        }

    },[cart])
    
    const onClose = () => {

    }
    //const { login: web3authLogin, isLoading: isWeb3AuthLoading } = useWeb3Auth();
    return (
        <Dialog >
            <DialogTrigger asChild>
                <Button onClick={onClick} >
                    Take & Leave
                </Button>
            </DialogTrigger>
            <DialogContent className="min-w-[80vw] max-h-[80vh] h-[80vh] justify-even text-center content-center flex items-center flex-col">
                <DialogHeader className="text-center justify-center content-center" >
                    <DialogTitle className="text-center" >Select Book</DialogTitle>
                    <DialogDescription className="text-center" >
                        Select a book from your wallet to leave in exchange for another
                    </DialogDescription>
                </DialogHeader>
                <div className="h-2/3 flex flex-col items-center m-0">
                    <div className="flex w-full flex-row gap-2">
                        <Input placeholder="Search for books" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                        <Button onClick={onSearch}>Search</Button>
                    </div>
                    <div className="flex flex-col items-center justify-center py-2 h-full">
                        {!userBooks && <div>No books found</div>}
                        {filteredBooks && <BookGrid type="trade" assets={filteredBooks} />}
                    </div>
                    <DialogClose ref={closeRef} >
                        <Button onClick={emptyCart} variant="destructive">
                            Cancel
                        </Button>
                    </DialogClose>
                </div>
            </DialogContent>
        </Dialog>
    )
}
