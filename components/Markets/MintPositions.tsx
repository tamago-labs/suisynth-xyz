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
    AlertTriangle
} from 'lucide-react';
import { useState } from 'react';

const MintPositions = ({ mintPositions, poolData, handleAddCollateral, handleBurn }: any) => {



    return (
        <>
            <h4 className="text-sm font-medium text-slate-400 mb-3">Minted Positions</h4>

            {mintPositions.length > 0 ? (
                <div className="space-y-3">
                    {mintPositions.map((position: any, index: number) => {

                        const collateralValue = (position.collateralAmount * (position.collateralType === "SUI" ? poolData?.prices?.SUI : 1))
                        const entryPrice = collateralValue / (position.debtAmount / (100 / 150))
                        const debtValue = poolData ? position.debtAmount * poolData.prices.BTC : 1

                        const collateralRatio = (collateralValue / debtValue) * 100

                        // Calculate health status based on collateral ratio
                        const getHealthStatus = (ratio: any) => {
                            if (ratio >= 180) return { status: 'Safe', color: 'text-green-400', bg: 'bg-green-500/20' };
                            if (ratio >= 150) return { status: 'Healthy', color: 'text-blue-400', bg: 'bg-blue-500/20' };
                            if (ratio >= 130) return { status: 'Caution', color: 'text-yellow-400', bg: 'bg-yellow-500/20' };
                            return { status: 'At Risk', color: 'text-red-400', bg: 'bg-red-500/20' };
                        };

                        // Calculate liquidation price (simplified formula)
                        const liquidationPrice = entryPrice * (position.minCollateralRatio || 120) / collateralRatio;

                        // Get health status
                        const health = getHealthStatus(collateralRatio);

                        // Calculate distance to liquidation
                        const distanceToLiquidation = poolData && ((poolData.prices.BTC - liquidationPrice) / poolData.prices.BTC) * 100;

                        return (
                            <div
                                key={index}
                                className="bg-slate-700/50 rounded-lg p-4 border border-slate-600/50"
                            >
                                <div className="flex justify-between items-center mb-3">
                                    <div className="flex items-center gap-2">
                                        <div className="w-8 h-8 rounded-full bg-orange-500/20 flex items-center justify-center">
                                            <Bitcoin className="text-orange-500" size={16} />
                                        </div>
                                        <div>
                                            <div className="font-medium">suiBTC</div>
                                            <div className="flex items-center gap-1 text-xs">
                                                <span className={health.color}>●</span>
                                                <span className="text-slate-400">{health.status}</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Collateral badge moved to the right */}
                                    <div className={`px-3 py-1.5 rounded-lg text-xs font-medium ${position.collateralType === 'USDC' ? 'bg-blue-500/20 text-blue-400' : 'bg-cyan-500/20 text-cyan-400'
                                        }`}>
                                        {position.collateralType} Collateral
                                    </div>
                                </div>

                                {/* C-Ratio indicator */}
                                <div className="mb-3">
                                    <div className="flex justify-between text-xs mb-1">
                                        <span className="text-slate-400">Collateral Ratio</span>
                                        <span className={health.color}>{collateralRatio.toLocaleString()}%</span>
                                    </div>
                                    <div className="w-full h-2 bg-slate-600 rounded-full overflow-hidden">
                                        <div className="h-full bg-gradient-to-r from-red-500 via-yellow-500 to-green-500" style={{ width: `${Math.min(100, collateralRatio / 2)}%` }} />
                                    </div>
                                    <div className="flex justify-between text-xs mt-1">
                                        <span className="text-slate-500">Min: {position.minCollateralRatio || 120}%</span>
                                        <span className="text-slate-500">Safe: 180%+</span>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                                    <div>
                                        <div className="text-slate-400 text-xs">Collateral</div>
                                        <div>{position.collateralAmount || position.collateral} {position.collateralType}</div>
                                    </div>
                                    <div>
                                        <div className="text-slate-400 text-xs">Minted</div>
                                        <div>{position.debtAmount || position.minted} suiBTC</div>
                                    </div>
                                    <div>
                                        <div className="text-slate-400 text-xs">Current Price</div>
                                        <div>${poolData?.prices?.BTC.toLocaleString()}</div>
                                    </div>
                                    <div>
                                        <div className="text-slate-400 text-xs">Liquidation Price</div>
                                        <div className="text-red-400">${liquidationPrice.toLocaleString()}</div>
                                    </div>
                                </div>

                                {/* Liquidation warning if getting close */}
                                {distanceToLiquidation < 15 && (
                                    <div className="mt-3 p-2 rounded-lg bg-red-500/10 border border-red-500/20 flex items-center gap-2">
                                        <AlertTriangle size={16} className="text-red-400" />
                                        <div className="text-xs text-red-400">
                                            {distanceToLiquidation.toFixed(1)}% from liquidation price
                                        </div>
                                    </div>
                                )}

                                <div className="mt-4 pt-4 border-t border-slate-600/50">
                                    <div className="flex gap-2">
                                        <button
                                            className="flex-1 py-2 text-xs bg-slate-600 hover:bg-slate-500 rounded-md transition-colors"
                                            onClick={() => handleAddCollateral({
                                                ...position,
                                                collateralValue,
                                                entryPrice,
                                                debtValue,
                                                collateralRatio,
                                                liquidationPrice,
                                                health
                                            })}
                                        >
                                            Add Collateral
                                        </button>
                                        <button
                                            className="flex-1 py-2 text-xs bg-red-500/20 text-red-400 hover:bg-red-500/30 rounded-md transition-colors"
                                            onClick={() => handleBurn({
                                                ...position,
                                                collateralValue,
                                                entryPrice,
                                                debtValue,
                                                collateralRatio,
                                                liquidationPrice,
                                                health
                                            })}
                                        >
                                            Burn & Reclaim
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )
                    })}
                </div>
            ) : (
                <div className="text-center py-6 bg-slate-800/50 rounded-lg">
                    <Layers size={32} className="text-slate-500 mx-auto mb-2" />
                    <p className="text-slate-400">No minted positions found</p>
                    <button className="mt-3 px-4 py-2 bg-blue-500/20 text-blue-400 text-sm rounded-md hover:bg-blue-500/30 transition-colors">
                        Mint Your First Position
                    </button>
                </div>
            )}
        </>
    )
}


export default MintPositions