
import { AccountContext } from '@/hooks/useAccount';
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
import { useContext } from 'react';

const AssetCard = ({ marketData }: any) => {

    const { poolData } = useContext(AccountContext)

    return (
        <motion.div
            className="bg-slate-800/50 backdrop-blur-sm rounded-xl border border-slate-700/50 p-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
        >
            <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-orange-500/20 flex items-center justify-center">
                    <Bitcoin className="text-orange-500" size={20} />
                </div>
                <div>
                    <h3 className="text-xl font-bold">suiBTC</h3>
                    <div className="flex items-center text-sm">
                        <span className="text-slate-400 mr-2">Price:</span>
                        <span className="font-mono">${poolData?.prices?.BTC.toLocaleString()}</span>
                        <span className={`ml-2 ${marketData.suiBTC.change24h >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                            {marketData.suiBTC.change24h >= 0 ? '+' : ''}{marketData.suiBTC.change24h}%
                        </span>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mt-6">
                <div className="bg-slate-700/50 rounded-lg p-3">
                    <div className="text-xs text-slate-400 mb-1">Total Supplied</div>
                    <div className="font-semibold">0 suiBTC</div>
                </div>

                <div className="bg-slate-700/50 rounded-lg p-3">
                    <div className="text-xs text-slate-400 mb-1">Supply APY</div>
                    <div className="font-semibold text-green-400">0%</div>
                </div>

                <div className="bg-slate-700/50 rounded-lg p-3">
                    <div className="text-xs text-slate-400 mb-1">Utilization</div>
                    <div className="font-semibold">0%</div>
                </div>

                <div className="bg-slate-700/50 rounded-lg p-3">
                    <div className="text-xs text-slate-400 mb-1">Min C-Ratio</div>
                    <div className="font-semibold">120%</div>
                </div>
            </div>

            <div className="mt-6">
                <div className="text-sm text-slate-400 mb-2">Utilization</div>
                <div className="w-full h-3 bg-slate-700 rounded-full overflow-hidden">
                    <div
                        className="h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-full"
                        style={{ width: `${marketData.suiBTC.utilizationRate}%` }}
                    />
                </div>
                <div className="flex justify-between text-xs mt-1">
                    <span className="text-slate-500">0%</span>
                    <span className="text-slate-500">100%</span>
                </div>
            </div>

        </motion.div>
    )
}

export default AssetCard