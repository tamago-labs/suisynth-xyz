"use client"


import React, { useState, useEffect, useReducer, useContext, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  Coins,
  Clock,
  RefreshCw,
  Award,
  Info
} from 'lucide-react';
import Link from "next/link"
import useMarket from '@/hooks/useMarket';
import { useWallet } from '@suiet/wallet-kit';
import { AccountContext } from '@/hooks/useAccount';

const RewardsContainer = () => {

  const wallet = useWallet()
  const { account, connected } = wallet
  const address = account && account?.address
  const isTestnet = connected && account && account.chains && account.chains[0] === "sui:testnet" ? true : false

  const { listSupplyPositions, getPendingRewards, claim } = useMarket()
  const { poolData } = useContext(AccountContext)

  const [values, dispatch] = useReducer(
    (curVal: any, newVal: any) => ({ ...curVal, ...newVal }),
    {
      loading: false,
      errorMessage: undefined,
      tick: 1,
      suppliedAmount: 0,
      pendingAmount: 0
    }
  )

  const { loading, errorMessage, tick, suppliedAmount, pendingAmount } = values

  // States
  const [isClaimLoading, setIsClaimLoading] = useState(false);
  const [showInfoModal, setShowInfoModal] = useState(false);

  // Mock data - would be fetched from your smart contract
  const userData = {
    pendingRewards: 246.82, // SYNTH
    lastClaimTime: '2025-05-01T14:30:00',
    suppliedAmount: 0.35, // BTC
    supplyAPR: 5.8, // %
    rewardsAPR: 12.1, // %
    combinedAPR: 17.9, // %
  };

  useEffect(() => {
    if (address && isTestnet) {
      listSupplyPositions(address).then(
        (positions) => {
          const total = positions.reduce((output: number, item: any) => {
            return output + item.suppliedAmount
          }, 0)
          dispatch({
            suppliedAmount: total
          })
        }
      )
      getPendingRewards(address).then(
        (amount) => {
          dispatch({
            pendingAmount: Number(amount)
          })
        }
      )
    }

  }, [address, isTestnet, tick])

  // Format time ago
  const formatTimeAgo = (dateString: any) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.valueOf() - date.valueOf());
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      const diffHours = Math.floor(diffTime / (1000 * 60 * 60));
      if (diffHours === 0) {
        const diffMinutes = Math.floor(diffTime / (1000 * 60));
        return `${diffMinutes} minutes ago`;
      }
      return `${diffHours} hours ago`;
    } else if (diffDays === 1) {
      return 'Yesterday';
    } else {
      return `${diffDays} days ago`;
    }
  };

  // Handle claim rewards
  const handleClaimRewards = () => {
    setIsClaimLoading(true);

    // This would call your claim_governance_rewards function
    setTimeout(() => {
      setIsClaimLoading(false);
      // Would update state with new balances here
    }, 2000);
  };

  const onClaim = useCallback(async () => {

    if (!address) {
      return
    }

    setIsClaimLoading(true);

    try {

      await claim()

      setTimeout(() => {
        dispatch({
          tick: tick + 1
        })
      }, 2000)

    } catch (error: any) {
      console.log(error)
    }
    setIsClaimLoading(false);

  }, [address, isTestnet, claim, tick])

  return (
    <div className="min-h-screen  text-white">
      <div className="max-w-3xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8">Rewards</h1>

        {/* Main Rewards Card */}
        <motion.div
          className="bg-slate-800/50 backdrop-blur-sm rounded-xl border border-slate-700/50 p-6 mb-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center">
                <Coins className="text-white" size={24} />
              </div>
              <div>
                <h2 className="text-xl font-bold">SYNTH Rewards</h2>
                <p className="text-slate-400 text-sm">Earn rewards for supplying to the lending pool</p>
              </div>
            </div>
            <button
              className="flex items-center gap-1 text-sm text-blue-400 hover:text-blue-300"
              onClick={() => setShowInfoModal(true)}
            >
              <Info size={16} />
              <span>How it works</span>
            </button>
          </div>

          <div className="flex flex-col md:flex-row gap-6">
            {/* Pending Rewards */}
            <div className="bg-slate-700/30 rounded-lg p-4 flex-1">
              <h3 className="text-slate-400 text-sm mb-2">Pending Rewards</h3>
              <div className="flex items-end gap-2 mb-4">
                <div className="text-3xl font-bold">
                  {pendingAmount.toLocaleString()}
                </div>
                <div className="text-purple-400 text-lg font-semibold mb-0.5">SYNTH</div>
              </div>
              <div className="flex items-center justify-between text-sm">
                <div className="text-slate-400">≈ ${(pendingAmount * 0.00015).toLocaleString()}</div>
                {/*<div className="text-slate-400 flex items-center gap-1">
                  <Clock size={14} />
                  <span>Last claim: {formatTimeAgo(userData.lastClaimTime)}</span>
                </div>*/}
              </div>

              <button
                className={`mt-4 w-full py-3 rounded-lg font-medium flex items-center justify-center gap-2 transition-all ${isClaimLoading
                  ? 'bg-purple-500/50 cursor-not-allowed'
                  : pendingAmount > 0
                    ? 'bg-gradient-to-r from-purple-500 to-blue-500 hover:shadow-lg hover:shadow-purple-500/20'
                    : 'bg-slate-700 cursor-not-allowed text-slate-500'
                  }`}
                onClick={onClaim}
                disabled={isClaimLoading || pendingAmount === 0}
              >
                {isClaimLoading ? (
                  <>
                    <RefreshCw size={18} className="animate-spin" />
                    <span>Claiming...</span>
                  </>
                ) : (
                  <>
                    <span>Claim Rewards</span>
                  </>
                )}
              </button>
            </div>

            {/* Current Supply Stats */}
            <div className="bg-slate-700/30 rounded-lg p-4 flex-1">
              <h3 className="text-slate-400 text-sm mb-2">Your Supply</h3>
              <div className="flex items-end gap-2 mb-4">
                <div className="text-3xl font-bold">
                  {suppliedAmount.toFixed(6)}
                </div>
                <div className="text-orange-400 text-lg font-semibold mb-0.5">suiBTC</div>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">Supply APR:</span>
                  <span className="text-green-400">{poolData?.lendingPool?.supplyRate || "N/A"}%</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">Rewards APR:</span>
                  <span className="text-purple-400">{poolData?.rewardsApy || "N/A"}%</span>
                </div>
                <div className="flex justify-between text-sm font-medium">
                  <span className="text-slate-300">Combined APR:</span>
                  <span className="text-blue-400">{(poolData) ? (Number(poolData?.rewardsApy) + Number(poolData?.lendingPool?.supplyRate)).toFixed(2) : "N/A"}%</span>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Supply More CTA Card */}
        <motion.div
          className="bg-slate-800/50 backdrop-blur-sm rounded-xl border border-slate-700/50 p-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
        >
          <div className="flex flex-col sm:flex-row items-center gap-4">
            <div className="text-center sm:text-left">
              <h3 className="text-lg font-medium">Want to earn more rewards?</h3>
              <p className="text-slate-400 text-sm mt-1">
                Supply more assets to the lending pool to increase your SYNTH rewards.
              </p>
            </div>
            <Link href="/markets">
              <button className="px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg text-white font-medium whitespace-nowrap ml-auto">
                Supply Now
              </button>
            </Link>

          </div>
        </motion.div>
      </div>

      {/* Simple Info Modal */}
      {showInfoModal && (
        <div className="fixed inset-0 bg-slate-900/80 flex items-center justify-center z-50 backdrop-blur-sm">
          <motion.div
            className="bg-slate-800 rounded-xl border border-slate-700 p-6 max-w-md w-full mx-4"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.2 }}
          >
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold">How SYNTH Rewards Work</h3>
              <button
                onClick={() => setShowInfoModal(false)}
                className="text-slate-400 hover:text-white"
              >
                &times;
              </button>
            </div>

            <div className="space-y-4">
              <p className="text-slate-300">
                SYNTH tokens are governance tokens for the SuiSynth protocol. By supplying assets to the lending pool, you earn SYNTH rewards proportional to your contribution.
              </p>

              <div className="bg-slate-700/50 rounded-lg p-4 space-y-3">
                <h4 className="font-medium text-white">How to Earn</h4>
                <ul className="text-sm text-slate-300 space-y-2">
                  <li>• Supply suiBTC to the lending pool</li>
                  <li>• Rewards accrue continuously based on your supply amount</li>
                  <li>• Claim your SYNTH rewards anytime</li>
                  <li>• No lockup period or vesting schedule</li>
                </ul>
              </div>

              <div className="pt-4">
                <button
                  onClick={() => setShowInfoModal(false)}
                  className="w-full py-3 bg-gradient-to-r from-purple-500 to-blue-500 rounded-lg text-white font-medium"
                >
                  Got It
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default RewardsContainer;