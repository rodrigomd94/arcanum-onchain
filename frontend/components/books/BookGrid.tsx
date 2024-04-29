import { TokenInfo } from "@/types/cardano";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import TokenCard from "./TokenCard";
import { ScrollArea } from "../ui/scroll-area";
import { useBookContext } from "@/contexts/BookContext";
import { isScrollBottom } from "@/utils/scroll";

export default function BookGrid({ assets, type }: { assets: TokenInfo[], type: "user" | "contract" | "trade" }) {
    const { fetchNextContractPage, isFetchingContractBooks, fetchNextUserPage, isFetchingUserBooks } = useBookContext();

    const handleScroll = (e: any) => {
        if (isScrollBottom(e)) {
            //setPage(page + 1);
            if(type === "user" || type === "trade"){
                fetchNextUserPage();
            } else{
                fetchNextContractPage();
            }
        }
    }
    return (
        <div className="h-full w-full">
            <ScrollArea onScrollCapture={handleScroll} className="h-full rounded-md border p-2">
                <div className="h-full grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 md:gap-8 px-4 md:px-6 py-12">
                    {
                        assets?.map((token, index) => (
                            <div key={index}>
                                <TokenCard type={type} token={token} />
                            </div>
                        ))

                    }
                </div>
                {((isFetchingUserBooks && (type === "user" || type === "trade")) || (isFetchingContractBooks && type === "contract")) ? <div>Loading...</div> : null}
                {!isFetchingContractBooks && !isFetchingUserBooks && assets.length==0 ? <div>No Books found...</div> : null}

            </ScrollArea>
        </div >
    )
}