import React, { useCallback, useContext, useState, useReducer } from 'react';
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
    Shield,
    RefreshCw
} from 'lucide-react';
import { AccountContext } from '@/hooks/useAccount';
import useMarket from '@/hooks/useMarket';


const SupplyPanel = ({ increaseTick }: any) => {

    const { supply } = useMarket()

    const [values, dispatch] = useReducer(
        (curVal: any, newVal: any) => ({ ...curVal, ...newVal }),
        {
            loading: false,
            errorMessage: undefined
        }
    )

    const { errorMessage, loading } = values

    const [supplyAmount, setSupplyAmount] = useState<any>('');

    const { balances, poolData } = useContext(AccountContext)

    const onSupply = useCallback(async () => {

        dispatch({
            errorMessage: undefined
        })

        const amount = parseFloat(supplyAmount)

        if (amount === 0) {
            dispatch({
                errorMessage: "Invalid amount"
            })
            return
        }

        dispatch({
            loading: true
        })
        try {
            await supply(
                amount
            )
            increaseTick()
        } catch (error: any) {
            console.log(error)
            dispatch({
                errorMessage: `${error.message}`
            })
        }
        dispatch({
            loading: false
        })

    }, [supplyAmount, supply, increaseTick])

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
                                Supply your synthetic BTC to the lending pool to earn {poolData ? poolData?.lendingPool?.supplyRate : 0}% base APY. Additionally, by supplying, you're eligible to claim SYNTH governance tokens as rewards.
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
                                value={supplyAmount}
                                onChange={(e) => setSupplyAmount(e.target.value)}
                            />

                        </div>
                        <div className="flex justify-between text-xs mt-1">
                            <span className="text-slate-500">
                                Value: ${(poolData && supplyAmount) ? (parseFloat(supplyAmount) * poolData.prices.BTC).toLocaleString() : '0.00'}
                            </span>
                            <span className="text-slate-500">
                                Balance: {balances.length > 0 ? balances[2].toFixed(8) : 0} suiBTC
                            </span>
                        </div>
                    </div>

                    {/* Supply details */}
                    {(poolData && supplyAmount && parseFloat(supplyAmount) > 0) && (
                        <div className="bg-slate-700/50 rounded-lg p-4 space-y-3">
                            <div className="flex justify-between text-sm">
                                <span className="text-slate-400">APY</span>
                                <span className="text-green-400">
                                    {poolData?.lendingPool?.supplyRate}%
                                </span>
                            </div>

                            <div className="flex justify-between text-sm">
                                <span className="text-slate-400">Estimated Daily Earnings</span>
                                <span>
                                    {((parseFloat(supplyAmount) * (poolData ? poolData?.lendingPool?.supplyRate : 0) / 100) / 365).toFixed(8)} suiBTC
                                </span>
                            </div>

                            <div className="flex justify-between text-sm">
                                <span className="text-slate-400">Estimated Monthly Earnings</span>
                                <span>
                                    {((parseFloat(supplyAmount) * (poolData ? poolData?.lendingPool?.supplyRate : 0) / 100) / 12).toFixed(8)} suiBTC
                                </span>
                            </div>
                        </div>
                    )}

                    {/* Action button */}
                    <button
                        onClick={onSupply}
                        className="w-full py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-medium rounded-lg flex items-center justify-center gap-2 hover:shadow-lg hover:shadow-purple-500/20 transition-all"
                        disabled={loading || !supplyAmount || parseFloat(supplyAmount) <= 0}
                    >

                        {loading
                            ?
                            <RefreshCw
                                className='mx-auto animate-spin'
                            />
                            :
                            <>
                                Supply to Lending Pool
                                <ArrowRight size={18} />
                            </>
                        }
                    </button>

                    {errorMessage && (
                        <p className="text-sm text-center mt-2 text-white">
                            {errorMessage}
                        </p>
                    )}

                </div>
            </div>
        </motion.div>
    )
}

export default SupplyPanel