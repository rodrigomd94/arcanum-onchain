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
import { Data, getAddressDetails } from "lucid-cardano";
import { OracleMain } from "@/utils/plutus";
const inter = Inter({ subsets: ["latin"] });

export default function Home() {
  const { walletAddress, lucid, walletApi } = useWalletContext();
  const { contractBooks, findBooks, collections } = useBookContext();
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [filteredBooks, setFilteredBooks] = useState(contractBooks);
  console.log({contractBooks, filteredBooks})
  /* useEffect(() => {
    if (walletAddress && walletApi && lucid) {
      const tokenName = "OracleToken";
      const mintOracleToken = async () => {
        lucid?.selectWallet(walletApi)
        const { paymentCredential } = getAddressDetails(walletAddress);
        const nativeScript = lucid?.utils.nativeScriptFromJson({
          type: "all",
          scripts: [
            {
              type: "sig",
              keyHash: paymentCredential?.hash,
            }
          ]
        })
        const policy = lucid?.utils.mintingPolicyToId(nativeScript!);
        const nameHex = Buffer.from(tokenName).toString('hex');
        const unit = policy + nameHex;
        const allowedPolicies = collections.map((collection) => collection.policyId);
        console.log({ allowedPolicies })

        const oracleAddress = lucid?.utils.validatorToAddress(new OracleMain())
        // split allowedPolicies in groups of 20
        const chunks = allowedPolicies.reduce((resultArray: string[][], item, index) => {
          const chunkIndex = Math.floor(index / 20)
          if (!resultArray[chunkIndex]) {
            resultArray[chunkIndex] = [] // start a new chunk
          }
          resultArray[chunkIndex].push(item)
          return resultArray
        }
          , []);
        console.log({ chunks })
        let tx = lucid?.newTx()
          .attachMintingPolicy(nativeScript!)

        for (let allowedPolicies of chunks) {
          const d: OracleMain["datum"] = { updatedAt: BigInt(Date.now()), allowedPolicies }
          const oracleDatum = Data.to(d, OracleMain.datum)
          tx = tx.payToContract(oracleAddress!, { inline: oracleDatum }, { [unit]: 1n })
        }

        tx = tx.mintAssets({ [unit]: BigInt(chunks.length) })
        const mintTx = await (
          await (
            await tx!
              .complete()).sign().complete()
        ).submit();

        console.log({ mintTx, unit })
      }
      mintOracleToken();

    }

  }, [walletAddress]) */

  const onSearch = async () => {
    setFilteredBooks(await findBooks(searchTerm, "contract"));
  }
  useEffect(() => {
    if (searchTerm === "") {
      setFilteredBooks(contractBooks);
    }
  }, [contractBooks])
  return (
    <div className="container">
      <Navbar />
      <div className="flex flex-row gap-2">
        <Input placeholder="Search for books" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
        <Button onClick={onSearch}>Search</Button>
      </div>
      <div className="flex flex-col items-center justify-center h-screen py-2">
        {filteredBooks && <BookGrid type="contract" assets={filteredBooks} />}
      </div>
    </div>
  );
}
