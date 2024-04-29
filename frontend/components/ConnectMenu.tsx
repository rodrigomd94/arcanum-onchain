"use client"

import * as React from "react"

import { Button } from "@/components/ui/button"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import MiddleEllipsis from "react-middle-ellipsis"
import { useWalletContext } from "@/contexts/WalletContext"
import { useRouter } from "next/router"

export function ConnectMenu() {
    const { walletAddress, disconnectWallet } = useWalletContext();
    const router = useRouter();
    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button key={walletAddress} variant="ghost" className="middle-ellipsis w-40">
                    <MiddleEllipsis>
                        <span>
                            {walletAddress}
                        </span>
                    </MiddleEllipsis>
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => disconnectWallet()}>
                    Disconnect
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => router.push('/my-books')}>
                    My books
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    )
}
