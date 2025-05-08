

import React, { useState, useReducer, useContext, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
    RefreshCw,
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
import { Droplet } from 'react-feather';
import { AccountContext } from '@/hooks/useAccount';
import HealthFactorBar from '../HeathFactorBar';
import useMarket from '@/hooks/useMarket';

const MintPanel = ({ increaseTick } : any) => {

    const { mint } = useMarket()

    const { balances, poolData } = useContext(AccountContext)

    const [values, dispatch] = useReducer(
        (curVal: any, newVal: any) => ({ ...curVal, ...newVal }),
        {
            collateralType: "USDC",
            mintAmount: 0,
            loading: false,
            errorMessage: undefined
        }
    )

    const { collateralType, mintAmount, errorMessage, loading } = values

    const [showCollateralSelector, setShowCollateralSelector] = useState(false);

    let maxMintAmount = 0
    let requiredCollateral = 0

    if (poolData && balances && balances.length > 0) {
        const collateralValue = collateralType === 'USDC'
            ? balances[1]
            : balances[0] * poolData.prices.SUI
        maxMintAmount = collateralValue / (150 / 100) / poolData.prices.BTC

        if (mintAmount > 0) {
            const usdValue = parseFloat(mintAmount) * poolData.prices.BTC;
            const requiredUsdCollateral = usdValue * (150 / 100);
            requiredCollateral = collateralType === 'USDC'
                ? requiredUsdCollateral
                : requiredUsdCollateral / (poolData.prices.SUI); // Convert to SUI
        }
    }

    const onMint = useCallback(async () => {

        dispatch({
            errorMessage: undefined
        })

        if (!mintAmount) {
            dispatch({
                errorMessage: "Invalid amount"
            })
            return
        }

        const usdValue = parseFloat(mintAmount) * poolData.prices.BTC;
        const requiredUsdCollateral = usdValue * (150 / 100);
        const requiredCollateral = collateralType === 'USDC'
            ? requiredUsdCollateral
            : requiredUsdCollateral / (poolData.prices.SUI); // Convert to SUI

        dispatch({
            loading: true
        })
        try {

            await mint(
                requiredCollateral,
                collateralType,
                mintAmount
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

    }, [mintAmount, collateralType, poolData, increaseTick])

    return (
        <motion.div
            className="bg-slate-800/50 backdrop-blur-sm rounded-xl border border-slate-700/50 p-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.2 }}
        >
            <div>
                <h3 className="text-xl font-bold mb-6">Mint Synthetic suiBTC</h3>
                <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg mb-6">
                    <div className="flex items-start gap-3">
                        <Info size={20} className="text-blue-400 mt-0.5" />
                        <div>
                            <h4 className="font-medium text-blue-400">Synthetic Asset Issuance</h4>
                            <p className="text-slate-300 text-sm mt-1">
                                You will mint synthetic BTC by providing collateral at a 150% ratio. You must maintain a collateral ratio above 120% to avoid liquidation.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Mint form */}
                <div className="space-y-6">
                    {/* Select collateral type */}
                    <div>
                        <label className="block text-sm font-medium text-slate-400 mb-2">
                            Collateral Type
                        </label>
                        <div className="relative">
                            <button
                                className="w-full flex items-center justify-between bg-slate-700 rounded-lg p-3 hover:bg-slate-600 transition-colors"
                                onClick={() => setShowCollateralSelector(!showCollateralSelector)}
                            >
                                <div className="flex items-center gap-2">
                                    <div className={`w-6 h-6 rounded-full ${collateralType === 'USDC' ? 'bg-blue-500/20' : 'bg-cyan-500/20'} flex items-center justify-center`}>
                                        {collateralType === 'USDC' ? (
                                            <DollarSign className="text-blue-400" size={14} />
                                        ) : (
                                            <Droplet className="text-cyan-500" size={14} />
                                        )}
                                    </div>
                                    <span>{collateralType}</span>
                                </div>
                                {showCollateralSelector ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                            </button>

                            {/* Dropdown */}
                            {showCollateralSelector && (
                                <div className="absolute top-full left-0 right-0 mt-1 bg-slate-700 rounded-lg overflow-hidden z-10 border border-slate-600">
                                    {["USDC", "SUI"].map((type) => (
                                        <button
                                            key={type}
                                            className="w-full flex items-center gap-2 p-3 hover:bg-slate-600 transition-colors"
                                            onClick={() => {
                                                dispatch({
                                                    collateralType: type
                                                })
                                                setShowCollateralSelector(false);
                                            }}
                                        >
                                            <div className={`w-6 h-6 rounded-full ${type === 'USDC' ? 'bg-blue-500/20' : 'bg-cyan-500/20'} flex items-center justify-center`}>
                                                {/* {type.icon} */}
                                                {type === 'USDC' ? (
                                                    <DollarSign className="text-blue-400" size={14} />
                                                ) : (
                                                    <Droplet className="text-cyan-500" size={14} />
                                                )}
                                            </div>
                                            <span>{type}</span>
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                        <div className="flex justify-between text-xs mt-1">
                            <span className="text-slate-500">Balance: {(balances && balances.length > 0) ? collateralType === 'USDC' ? (balances[1]).toLocaleString() : (balances[0]).toLocaleString() : 0} {collateralType}</span>
                        </div>
                    </div>

                    {/* Mint amount */}
                    <div>
                        <label className="block text-sm font-medium text-slate-400 mb-2">
                            Mint Amount (suiBTC)
                        </label>
                        <div className="relative">
                            <input
                                type="number"
                                className="w-full bg-slate-700 rounded-lg p-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder="0.00000000"
                                value={mintAmount}
                                onChange={(e) => {
                                    dispatch({
                                        mintAmount: Number(e.target.value)
                                    })
                                }}
                            />
                        </div>
                        <div className="flex justify-between text-xs mt-1">
                            <span className="text-slate-500">
                                Value: ${(mintAmount && poolData) ? (parseFloat(mintAmount) * poolData?.prices?.BTC).toLocaleString() : '0.00'}
                            </span>
                            <span className="text-slate-500">
                                Max: {maxMintAmount.toFixed(8)} suiBTC
                            </span>
                        </div>
                    </div>

                    {/* Collateral details */}
                    {(mintAmount && parseFloat(mintAmount) > 0) ? (
                        <div className="bg-slate-700/50 rounded-lg p-4 space-y-3">
                            <div className="flex justify-between text-sm">
                                <span className="text-slate-400">Required Collateral</span>
                                <span>{requiredCollateral.toFixed(collateralType === 'USDC' ? 2 : 6)} {collateralType}</span>
                            </div>

                            <div className="flex justify-between text-sm">
                                <span className="text-slate-400">Collateral Ratio</span>
                                <span>{150}%</span>
                            </div>
                            <HealthFactorBar
                                healthFactor={150}
                                liquidationThreshold={120}
                            />
                        </div>
                    ) : <></>}

                    {/* Action button */}
                    <button
                        onClick={onMint}
                        disabled={loading}
                        className="w-full py-3 bg-gradient-to-r from-blue-500 to-purple-500 text-white font-medium rounded-lg flex items-center justify-center gap-2 hover:shadow-lg hover:shadow-blue-500/20 transition-all"
                    >
                        {loading
                            ?
                            <RefreshCw
                                className='mx-auto animate-spin'
                            />
                            :
                            <>
                                Mint suiBTC
                                <ArrowRight size={18} />
                            </>
                        }

                    </button>

                    {errorMessage && (
                        <p className="text-sm text-center mt-2 text-white">
                            {errorMessage}
                        </p>
                    )}

                    {/* <div className="text-center text-xs text-slate-400">
                        <div className="flex items-center justify-center gap-1">
                            <Shield size={12} />
                            <span>Mint positions are monitored by AI for liquidation risk</span>
                        </div>
                    </div> */}
                </div>
            </div>
        </motion.div>
    )
}

export default MintPanel