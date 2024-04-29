"use client"

import * as React from "react"
import Link from "next/link"

import { cn } from "@/lib/utils"
import {
    NavigationMenu,
    NavigationMenuContent,
    NavigationMenuItem,
    NavigationMenuLink,
    NavigationMenuList,
    NavigationMenuTrigger,
    navigationMenuTriggerStyle,
} from "@/components/ui/navigation-menu"
import { Button } from "./ui/button"
import { ThemeToggle } from "./ui/ThemeToggle"
import { ConnectDialog } from "./wallet/ConnectDialog"
import { useWalletContext } from "@/contexts/WalletContext"
import MiddleEllipsis from "react-middle-ellipsis"
import { ConnectMenu } from "./ConnectMenu"
import { Avatar, AvatarImage } from "./ui/avatar"

export function Navbar() {
    const { connected, walletAddress, connectWallet, lucid, walletName } = useWalletContext();
    return (
        <NavigationMenu >
            <div className="w-screen p-2">
                <NavigationMenuList className="w-full flex flex-row justify-between px-4">
                    <div className="flex flex-row space-x-0">
                        {/* <NavigationMenuItem >
                            <Sidenav />
                        </NavigationMenuItem> */}
                        <NavigationMenuItem>
                            <Link href="/home" legacyBehavior passHref>
                                <NavigationMenuLink className={navigationMenuTriggerStyle()}>
                                    <Avatar >
                                        <AvatarImage  src={"./arcanum.webp"} />
                                    </Avatar>
                                    Arcanum
                                </NavigationMenuLink>
                            </Link>
                        </NavigationMenuItem>
                    </div>

                    <div className="hidden md:flex flex-row space-x-0">
                        <NavigationMenuItem>
                            <div className="p-3 block m-0">
                                {connected ?
                                    <ConnectMenu />
                                    :
                                    <ConnectDialog text="Connect" />}
                            </div>
                        </NavigationMenuItem>
                        <NavigationMenuItem>
                            <div className="p-3 block m-0">
                                <ThemeToggle />
                            </div>
                        </NavigationMenuItem>
                        {/* <NavigationMenuItem>
                            <div className="p-3 block m-0">
                                <ThemeToggle />
                            </div>
                        </NavigationMenuItem> */}
                    </div>
                </NavigationMenuList>
            </div>
        </NavigationMenu>
    )
}

const ListItem = React.forwardRef<
    React.ElementRef<"a">,
    React.ComponentPropsWithoutRef<"a">
>(({ className, title, children, ...props }, ref) => {
    return (
        <li>
            <NavigationMenuLink asChild>
                <a
                    ref={ref}
                    className={cn(
                        "block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground",
                        className
                    )}
                    {...props}
                >
                    <div className="text-sm font-medium leading-none">{title}</div>
                    <p className="line-clamp-2 text-sm leading-snug text-muted-foreground">
                        {children}
                    </p>
                </a>
            </NavigationMenuLink>
        </li>
    )
})
ListItem.displayName = "ListItem"
