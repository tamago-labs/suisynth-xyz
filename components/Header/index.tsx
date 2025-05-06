"use client"

import { Loader } from "react-feather"
import { Gem } from "lucide-react"
import Link from "next/link"
import { usePathname } from 'next/navigation'
import {
    ConnectButton,
} from '@suiet/wallet-kit';

const Header = () => {

    const pathname = usePathname()

    return (
        <nav className="flex container mx-auto justify-between items-center mb-4">
            <div className="flex items-center">
                <Link href="/" >
                    <div className="ml-3 flex flex-col">
                        <span className="text-white text-2xl font-bold">SuiSynth</span>
                        <div className="h-0.5 w-24 bg-gradient-to-r from-blue-500 via-purple-500 to-cyan-400 rounded-full mt-0.5"></div>
                    </div>
                </Link>
            </div>

            <div className="hidden md:flex space-x-[70px] text-gray-300">
                <Link href="/dashboard" className={`hover:text-white transition-colors ${pathname === "/dashboard" && "text-white"}`}>
                    Dashboard
                </Link>
                <Link href="/trade" className={`hover:text-white transition-colors ${pathname === "/trade" && "text-white"}`}>
                    Trade
                </Link>
                <Link href="/markets" className={`hover:text-white transition-colors ${pathname === "/markets" && "text-white"}`}>
                    Markets
                </Link>
            </div>

            {/* <button className="px-6 py-2 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 text-white font-medium hover:shadow-lg hover:from-blue-600 hover:to-purple-700 transition-all">
                Connect Wallet
            </button> */}
            <div className="relative z-30">
                <ConnectButton style={{borderRadius: "0.5rem"}}>
                    Connect Wallet
                </ConnectButton>
            </div>

        </nav>
    )
}

export default Header