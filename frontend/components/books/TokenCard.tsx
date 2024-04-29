import { TokenInfo } from "@/types/cardano";
import { Card, CardContent } from "../ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { Button } from "../ui/button";
import { divideBigIntByNumberPrecise, fNumber } from "@/utils/math";
import Link from "next/link";
import { useBookContext } from "@/contexts/BookContext";
import { Book } from "@/types/bookio";
import { DialogClose } from "../ui/dialog";
import { SelectUserBooksDialog } from "../trade/SelectUserBooksDialog";
import { TradeDialog } from "../trade/TradeDialog";
import { donateBooks } from "@/utils/validators";
import { useWalletContext } from "@/contexts/WalletContext";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useState } from "react";

export default function TokenCard({ token, type }: { token: TokenInfo, type?: "user" | "contract" | "trade" }) {
    const { cart, addBooksToCart, removeBooksFromCart, setBooksToSend, booksToSend } = useBookContext();
    const [isLoading, setIsLoading] = useState(false);
    const { lucid } = useWalletContext();
    const onTrade = (book: Book) => {
        setBooksToSend([...booksToSend, book]);
    }

    const onDonate = async (book: Book) => {
        console.log("Donating", book);
        setIsLoading(true);
        try {
            const txHash = await donateBooks(lucid!, { [book.tokenId]: 1n });
            console.log({ txHash });
            toast.success("Donation successful", {
                description: `txHash: ${txHash}`
            });
        } catch (e: any) {
            toast.error("Donation failed", {
                description: e.message ? e.message : e.info ? e.info : e.toString(),
            });
        }

        setIsLoading(false);
    }
    return (
        <div className="grid gap-4 shadow-md">
            <div className="relative group middle-ellipsis overflow-hidden max-h-2/3 justify-center content-center">
                <Link className="absolute " href="#">
                    <span className="sr-only">View book</span>
                </Link>
                <img
                    alt="Book Cover"
                    className="object-cover w-full aspect-[5/8] group-hover:opacity-50 transition-opacity rounded-md"
                    height={200}
                    src={token.metadata?.image || "https://via.placeholder.com/300"}
                    width={150}
                />
                <div className="p-2">
                    <h3 className="font-semibold text-lg">{token.metadata?.name}</h3>
                    <h3 className="font-semibold text-lg">{token.amount.toString()} available</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">by {token.metadata?.authors?.join(", ")}</p>
                    {/*  <Button className="w-full mt-4" variant="outline">
                        Add to Cart
                    </Button> */}
                    {
                        type === "contract" ? <SelectUserBooksDialog onClick={() => addBooksToCart(token, 1n)} key={token.tokenId} />
                            :
                            type === "user" ? <> {isLoading ? <Loader2 className="animate-spin" /> : <Button onClick={() => onDonate(token)} className="w-full mt-4" variant="outline">
                                Donate
                            </Button>}</> :
                                type === "trade" ?
                                    <div className="w-full mt-4">
                                        <TradeDialog onClick={() => setBooksToSend([token])} />
                                    </div>
                                    : null
                    }
                </div>
            </div>

        </div>
    )
}