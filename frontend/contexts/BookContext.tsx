import { Book, BookCollection } from "@/types/bookio";
import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { useWalletContext } from "./WalletContext";
import { getBooksByAddress } from "@/utils/cardano";
import { getBookPolicies } from "@/utils/bookio";
import { TokenInfo } from "@/types/cardano";
import { getContractAddress } from "@/utils/validators";

type BookContextType = {
    userBooks: Book[],
    contractBooks: Book[],
    collections: BookCollection[],
    cart: Book[],
    addBooksToCart: (book: Book, quantity: bigint) => void,
    removeBooksFromCart: (book: Book, quantity: bigint) => void,
    fetchNextUserPage: () => void,
    fetchNextContractPage: () => void,
    findBooks: (bookName: string, type: "user" | "contract") => Promise<TokenInfo[]>,
    isFetchingUserBooks: boolean,
    isFetchingContractBooks: boolean,
    booksToSend: Book[],
    setBooksToSend: (books: Book[]) => void,
    emptyCart: () => void

}
export const BookContext = createContext<BookContextType>({
    userBooks: [],
    contractBooks: [],
    collections: [],
    cart: [],
    addBooksToCart: (book: Book, quantity: bigint) => { },
    removeBooksFromCart: (book: Book, quanity: bigint) => { },
    fetchNextUserPage: () => { },
    fetchNextContractPage: () => { },
    findBooks: async (bookName: string, type: "user" | "contract") => [],
    isFetchingUserBooks: false,
    isFetchingContractBooks: false,
    booksToSend: [],
    setBooksToSend: (books: Book[]) => { },
    emptyCart: () => { }
});

export const useBookContext = () => {
    return useContext(BookContext);
}

const PAGE_LENGTH = 30;

export const BookProvider = ({ children }: { children: React.ReactNode }) => {
    const { lucid } = useWalletContext();
   // const contractAddress = "addr1q8y4ldg2e5nuyst5ty4gdp8e62fgkgv7cc73qd7f0f4e4m42djal9l8tpqzqwquae69t2dyjdzss7mxmrmnwv7mthd4s837f5f" //getContractAddress(lucid!);
    const contractAddress = getContractAddress(lucid!);
   const { walletAddress } = useWalletContext();
    const [booksToSend, setBooksToSend] = useState<Book[]>([]);
    console.log({ walletAddress })
    const [cart, setCart] = useState<Book[]>([]);
    const { data: collectionData } = useQuery({
        queryKey: ["bookPolicies"],
        queryFn: async () => {
            const policies = await getBookPolicies();
            return policies;
        },
        refetchOnWindowFocus: false
    })
    /* const {data:userBookData, refetch: refetchUserBooks} = useQuery({
        queryKey: ["userBooks", walletAddress],
        queryFn: async () => {
            const books = (await getBooksByAddress(walletAddress, {page:1,policies:collectionData?.map((collection:any) => collection.policyId)})).books;
            console.log({books})
            return books
        },
        enabled: !!(collectionData && walletAddress),
        refetchOnWindowFocus: false
    }) */

    const { isPending: isUserBooksPending, fetchNextPage: fetchNextUserPage, isFetching: isFetchingUserBooks, data: userBookData, isLoading: isLoadingUserBooks, error: userBookError } = useInfiniteQuery({
        queryKey: ['books', walletAddress],
        initialPageParam: 1,
        queryFn: async ({ pageParam }) => {
            const books = (await getBooksByAddress(walletAddress, { page: pageParam, pageLength: PAGE_LENGTH, policies: collectionData?.map((collection: any) => collection.policyId) })).books;
            return books//.sort((a, b) => a.metadata!.name.localeCompare(b.metadata?.name || ""));
        },
        refetchOnWindowFocus: false,
        getNextPageParam: (lastPage, allPages) => {
            if (lastPage && lastPage.length < PAGE_LENGTH) {
                return undefined;
            }
            return allPages.length + 1;  // Increment the page index for the next page
        }
    });

    const { isPending: isContractBooksPending, fetchNextPage: fetchNextContractPage, isFetching: isFetchingContractBooks, data: contractBookData, isLoading: isLoadingContractBooks, error: contractBookError, hasNextPage: contractHasNextPage } = useInfiniteQuery({
        queryKey: ['books', contractAddress],
        initialPageParam: 1,
        queryFn: async ({ pageParam }) => {
            const books = (await getBooksByAddress(contractAddress, { page: pageParam, pageLength: PAGE_LENGTH, policies: collectionData?.map((collection: any) => collection.policyId) })).books;
            return books//.sort((a, b) => a.metadata!.name.localeCompare(b.metadata?.name || ""));
        },
        refetchOnWindowFocus: false,
        getNextPageParam: (lastPage, allPages) => {
            if (lastPage && lastPage.length < PAGE_LENGTH) {
                return undefined;
            }
            return allPages.length + 1;  // Increment the page index for the next page
        }
    });
    const controllerRef = useRef<AbortController | null>(null);
    const findBooks = useCallback(async (bookName: string, type: "user" | "contract" | "trade") => {
        //const books
        // AbortController to manage cancellation
        if (controllerRef.current) {
            controllerRef.current.abort();  // Abort the previous request
        }
        controllerRef.current = new AbortController();  // Create a new controller for the new request
        const signal = controllerRef.current.signal;

        const d = type === "user" ? userBookData : contractBookData;
        if (bookName === "") return d?.pages.flat() || [];
        let books: TokenInfo[] = []
        let hasNext = true;
        const result = d?.pages.flat().filter(book => book.metadata?.name.toLowerCase().includes(bookName.toLowerCase())) || [];
        if (result.length > 0) {
            return result
        }
      
        while (contractHasNextPage && !signal.aborted ) {
            const next = (type === "user" || type === "trade") ? await fetchNextUserPage() : await fetchNextContractPage();
            if (signal.aborted) {
                // Early exit if the fetch has been aborted
                break;
            }
            await new Promise(resolve => setTimeout(resolve, 3000));
            if (next?.data?.pages && next?.data?.pages.length > 0) {
                const result = next?.data?.pages.flat().filter(book => book.metadata?.name.toLowerCase().includes(bookName.toLowerCase())) || [];
                if (result.length > 0) {
                    books = result;
                    break;
                }
            } else {
                break;
            }
        }
        return books;
    }
        , [userBookData, contractBookData])


    const addBooksToCart = (book: Book, quantity: bigint) => {
        const policyId = book.tokenId.slice(0, 56);

        const booksFound = contractBookData?.pages.flat().filter(b => b.tokenId.slice(0, 56) === policyId && !cart.find(c => c.tokenId === b.tokenId)) || [];
        if (booksFound.length >= Number(quantity)) {
            setCart([...cart, ...booksFound.slice(0, Number(quantity))]);
        } else {
            console.log("Book not found in contract books")
        }
    }

    const removeBooksFromCart = (book: Book, quantity: bigint) => {
        const policyId = book.tokenId.slice(0, 56);
        const booksFound = cart.filter(b => b.tokenId.slice(0, 56) === policyId);
        if (booksFound.length >= Number(quantity)) {
            setCart(cart.filter(b => b.tokenId !== book.tokenId).slice(0, Number(quantity)));
        } else {
            console.log("Book not found in cart")
        }
    }

    const emptyCart = () => {
        setCart([]);
    }

    return <BookContext.Provider value={{ userBooks: userBookData?.pages.flat() || [], contractBooks: contractBookData?.pages.flat() || [], collections: collectionData || [], cart, addBooksToCart, removeBooksFromCart, fetchNextUserPage, findBooks, isFetchingUserBooks, isFetchingContractBooks, fetchNextContractPage, booksToSend, setBooksToSend, emptyCart }}>
        {children}
    </BookContext.Provider>
}