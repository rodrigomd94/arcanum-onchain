import Image from "next/image";
import { Inter } from "next/font/google";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import CardanoWalletSelection from "@/components/wallet/CardanoWalletSelection";
import { ConnectDialog } from "@/components/wallet/ConnectDialog";
import { useWalletContext } from "@/contexts/WalletContext";
import { Button } from "@/components/ui/button";
import MiddleEllipsis from 'react-middle-ellipsis';
import { Navbar } from "@/components/Navbar";
import BookGrid from "@/components/books/BookGrid";
import { useBookContext } from "@/contexts/BookContext";
import { Input } from "@/components/ui/input";
import { useEffect, useState } from "react";
const inter = Inter({ subsets: ["latin"] });

export default function Home() {
  //const { balance } = useWalletContext();
  const { userBooks, findBooks } = useBookContext();
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [filteredBooks, setFilteredBooks] = useState(userBooks);

  const onSearch = async () => {
    setFilteredBooks(await findBooks(searchTerm, "user"));
  }
  useEffect(() => {
    if (searchTerm === "") {
      setFilteredBooks(userBooks);
    }
  }, [userBooks])
  return (
    <div className="container">
      <Navbar />
      <div className="flex flex-row gap-2">
        <Input placeholder="Search for books" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
        <Button onClick={onSearch}>Search</Button>
      </div>
      <div className="flex flex-col items-center justify-center h-screen py-2">
        {filteredBooks && <BookGrid type="user" assets={filteredBooks} />}
      </div>
    </div>
  );
}
