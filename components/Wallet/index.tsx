

import React, { useEffect, useState, useCallback, useContext } from 'react';
import { motion } from 'framer-motion';
import {
    Bitcoin,
    DollarSign,
    TrendingUp,
    ArrowRight,
    Info,
    Percent,
    ChevronDown,
    ChevronUp,
    Shield,
    AlertCircle,
    BarChart2,
    Wallet,
    Droplet,
    X,
    RefreshCcw,
    RefreshCw
} from 'lucide-react';
import { useWallet } from '@suiet/wallet-kit';
import useMarket from '@/hooks/useMarket';
import { AccountContext } from '@/hooks/useAccount';

const WalletPanel = () => {

    const { balances } = useContext(AccountContext)

    const { faucet } = useMarket()

    const wallet = useWallet()
    const { account, connected } = wallet
    const address = account && account?.address
    const isTestnet = connected && account && account.chains && account.chains[0] === "sui:testnet" ? true : false

    const [modal, setModal] = useState<boolean>(false)
    const [recipient, setRecipient] = useState<any>()
    const [loading, setLoading] = useState<boolean>(false)
    const [errorMessage, setErrorMessage] = useState<any>(undefined)

    useEffect(() => {
        setRecipient(address)
    }, [address])

    const onMint = useCallback(async () => {

        setErrorMessage(undefined)

        if (!recipient || recipient.length !== 66) {
            setErrorMessage("Invalid address")
            return
        }

        setLoading(true)
        try {
            await faucet(recipient)
            setModal(false)
        } catch (error: any) {
            console.log(error) 
            setErrorMessage(`${error.message}`)
        }
        setLoading(false)
    }, [recipient, address, isTestnet, faucet])

    return (
        <>
            <motion.div
                className="bg-slate-800/50 backdrop-blur-sm rounded-xl border border-slate-700/50 p-6"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.1 }}
            >
                <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold">Your Wallet</h3>
                    <button onClick={() => setModal(true)} className="text-xs cursor-pointer text-blue-400 px-2 py-1 rounded-md bg-blue-500/10">
                        Faucet
                    </button>
                </div>

                <div className="space-y-3">
                    <div className="flex justify-between items-center">
                        <div className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded-full bg-blue-500/20 flex items-center justify-center">
                                <DollarSign className="text-blue-500" size={14} />
                            </div>
                            <span>USDC</span>
                        </div>
                        <div className="font-mono">
                        {balances && balances[1] && Number(balances[1]).toLocaleString()}
                        </div>
                    </div>

                    <div className="flex justify-between items-center">
                        <div className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded-full bg-cyan-500/20 flex items-center justify-center">
                                <Droplet className="text-cyan-500" size={14} />
                            </div>
                            <span>SUI</span>
                        </div>
                        <div className="font-mono">
                            {balances && balances[0] && Number(balances[0]).toLocaleString()}
                        </div>
                    </div>

                    <div className="flex justify-between items-center">
                        <div className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded-full bg-orange-500/20 flex items-center justify-center">
                                <Bitcoin className="text-orange-500" size={14} />
                            </div>
                            <span>suiBTC</span>
                        </div>
                        <div className="font-mono">0</div>
                    </div>
                </div>
            </motion.div>
            {/* Faucet Modal */}
            {modal && (
                <div className="fixed inset-0 bg-slate-900/80 flex items-center justify-center z-50 backdrop-blur-sm">
                    <motion.div
                        className="bg-slate-800 rounded-xl border border-slate-700 p-6 max-w-lg w-full mx-4"
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.2 }}
                    >
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-xl font-bold">USDC Faucet</h3>
                            <button
                                onClick={() => setModal(false)}
                                className="text-slate-400 hover:text-white"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <div className="space-y-4">


                            <div className="mb-6">
                                <label className="block text-gray-300 mb-2">Your Wallet Address</label>
                                <div className="relative">
                                    <input
                                        type="text"
                                        className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 text-white"
                                        placeholder="Enter wallet address"
                                        value={recipient}
                                        onChange={(e) => setRecipient(e.target.value)}
                                    />
                                </div>
                                <div className="text-sm text-gray-400 mt-2">
                                    Balance: {balances && balances[1] && Number(balances[1]).toLocaleString()} USDC
                                </div>
                            </div>



                            <div className="pt-0 flex gap-3">
                                <button
                                    disabled={loading}
                                    onClick={onMint}
                                    className="w-1/2 py-2 bg-blue-500  text-white font-medium rounded-lg transition-colors"

                                >
                                    {loading
                                        ?
                                        <RefreshCw
                                            className='mx-auto animate-spin'
                                        />
                                        :
                                        <>
                                            Send 20 USDC
                                        </>
                                    }

                                </button>
                                <button
                                    onClick={() => setModal(false)}
                                    className="w-1/2 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg transition-colors"
                                >
                                    Cancel
                                </button>

                            </div>

                            {errorMessage && (
                                <p className="text-sm text-center mt-2 text-white">
                                    {errorMessage}
                                </p>
                            )}

                        </div>
                    </motion.div>
                </div>
            )}

        </>
    )
}

export default WalletPanel