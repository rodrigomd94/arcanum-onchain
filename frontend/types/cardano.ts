
export type TokenMetadata = {
    image: string,
    name: string,
    attributes?: string[],
    description: string,
    authors?: string[],
}
export type TokenInfo = {
    tokenAddress?: string, // for evm
    tokenId: string, // this corresponds to unit in cardano (policy ID + asset name), or just tokenID in evm
    token_hash?: string,
    amount: bigint,         //amount owned by the user?
    existingAmount?: bigint, //This is the existing on-chain supply of the token. quantity for cardano, amount for evm? 
    contract_type?: string,
    name: string,          //readable name
    decimals?: number,     //for fungible tokens?
    symbol?: string, // for fungible tokens?
    metadata?: TokenMetadata,
}

export type TokenBalance = {
    NFTs: TokenInfo[],
    FTs: TokenInfo[],
    balance?: bigint // amount of lovelaces, or wei, etc.
}

export type BookBalance = {
    books: TokenInfo[],
    balance?: bigint // amount of lovelaces, or wei, etc.
}

export type BlockfrostAmount = {
    unit: string,
    quantity: string,

}
export type BlockfrostUTXO={
    address: string,
    tx_hash: string,
    output_index: number,
    block: string,
    amount: BlockfrostAmount[],
    data_hash?: string,
    inline_datum?: string,
    reference_script_hash?: string,
}

export type BlockfrostAsset = {
    asset: string
    policy_id: string
    asset_name: string
    fingerprint: string
    quantity: string
    initial_tx_hash: string
    mint_or_burn_count: number,
    onchain_metadata: any,
    onchain_metadata_standard: string | null,
    metadata: any,
    readableName: string
  }
export type CardanoAddressInfo ={
    address: string,
    amount: BlockfrostAmount[],
    stake_address?: string,
    type: 'byron' | 'shelley',
    script: boolean,
}

export type BlockfrostTransaction = {
    tx_hash: string;
    tx_index:number,
    block_height: number;
    block_time: number;
}