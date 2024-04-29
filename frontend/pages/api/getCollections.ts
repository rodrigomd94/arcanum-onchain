// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import { BookCollection } from "@/types/bookio";
import { getBookPolicies } from "@/utils/bookio";
import type { NextApiRequest, NextApiResponse } from "next";


export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse<BookCollection[]>,
) {
    const response = await fetch(`https://api.book.io/api/v0/collections`);
    const data = await response.json();
    const cardanoPolicies: {policyId: string, description: string}[] = data.data.filter((collection:any) => collection.blockchain === "cardano").map((collection:any) => ({policyId:collection.collection_id, description:collection.description}));
    res.status(200).json(cardanoPolicies);
}
