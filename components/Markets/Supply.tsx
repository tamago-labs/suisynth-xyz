import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
    Bitcoin,
    DollarSign,
    Wallet,
    ChevronDown,
    ChevronUp,
    ArrowRight,
    BarChart2,
    LineChart,
    History,
    Plus,
    Info,
    Layers,
    ArrowUpRight,
    Percent,
    AlertCircle,
    Trash,
    X,
    Shield
} from 'lucide-react';


const SupplyPanel = () => {
    return (
        <motion.div
            className="bg-slate-800/50 backdrop-blur-sm rounded-xl border border-slate-700/50 p-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.2 }}
        >
            <div>
                <h3 className="text-xl font-bold mb-6">Supply to Lending Pool</h3>

                <div className="p-4 bg-purple-500/10 border border-purple-500/20 rounded-lg mb-6">
                    <div className="flex items-start gap-3">
                        <Info size={20} className="text-purple-400 mt-0.5" />
                        <div>
                            <h4 className="font-medium text-purple-400">Lending Pool</h4>
                            <p className="text-slate-300 text-sm mt-1">
                                Supply your synthetic BTC to the lending pool to earn XXX% APY from borrowers who use leverage. You can withdraw your supplied assets anytime, subject to pool liquidity.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Supply form */}
                <div className="space-y-6">
                    {/* Supply amount */}
                    <div>
                        <label className="block text-sm font-medium text-slate-400 mb-2">
                            Supply Amount (suiBTC)
                        </label>
                        <div className="relative">
                            <input
                                type="number"
                                className="w-full bg-slate-700 rounded-lg p-3 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                                placeholder="0.00000000"
                            // value={supplyAmount}
                            // onChange={(e) => setSupplyAmount(e.target.value)}
                            />
                            <button
                                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-purple-400 hover:text-purple-300"
                            // onClick={() => setSupplyAmount(walletBalances.suiBTC.toString())}
                            >
                                MAX
                            </button>
                        </div>
                        <div className="flex justify-between text-xs mt-1">
                            <span className="text-slate-500">
                                {/* Value: ${supplyAmount ? (parseFloat(supplyAmount) * marketData.suiBTC.price).toLocaleString() : '0.00'} */}
                            </span>
                            <span className="text-slate-500">
                                {/* Balance: {walletBalances.suiBTC.toLocaleString()} suiBTC */}
                            </span>
                        </div>
                    </div>

                    {/* Supply details */}
                    {/* {supplyAmount && parseFloat(supplyAmount) > 0 && (
                        <div className="bg-slate-700/50 rounded-lg p-4 space-y-3">
                            <div className="flex justify-between text-sm">
                                <span className="text-slate-400">APY</span>
                                <span className="text-green-400">{marketData.suiBTC.supplyAPY}%</span>
                            </div>

                            <div className="flex justify-between text-sm">
                                <span className="text-slate-400">Estimated Daily Earnings</span>
                                <span>
                                    {((parseFloat(supplyAmount) * marketData.suiBTC.supplyAPY / 100) / 365).toFixed(8)} suiBTC
                                </span>
                            </div>

                            <div className="flex justify-between text-sm">
                                <span className="text-slate-400">Estimated Monthly Earnings</span>
                                <span>
                                    {((parseFloat(supplyAmount) * marketData.suiBTC.supplyAPY / 100) / 12).toFixed(8)} suiBTC
                                </span>
                            </div>
                        </div>
                    )} */}

                    {/* Action button */}
                    <button
                        className="w-full py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-medium rounded-lg flex items-center justify-center gap-2 hover:shadow-lg hover:shadow-purple-500/20 transition-all"
                    // disabled={!supplyAmount || parseFloat(supplyAmount) <= 0 || parseFloat(supplyAmount) > walletBalances.suiBTC}
                    >
                        Supply to Lending Pool
                        <ArrowRight size={18} />
                    </button>

                    <div className="text-center text-xs text-slate-400">
                        <div className="flex items-center justify-center gap-1">
                            <Info size={12} />
                            <span>You can withdraw your supplied assets at any time</span>
                        </div>
                    </div>
                </div>
            </div>
        </motion.div>
    )
}

export default SupplyPanel