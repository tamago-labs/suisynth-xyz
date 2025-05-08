"use client"

import React, { useContext, useReducer, useCallback, useEffect, useState } from 'react';
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
  Shield,
  AlertTriangle
} from 'lucide-react';
import WalletPanel from "@/components/Wallet"
import AssetCard from './AssetCard';
import MintPanel from './Mint';
import SupplyPanel from './Supply';
import { useWallet } from '@suiet/wallet-kit';
import useMarket from '@/hooks/useMarket';
import { AccountContext } from '@/hooks/useAccount';
import MintPositions from './MintPositions';

const MarketsContainer = () => {


  const [values, dispatch] = useReducer(
    (curVal: any, newVal: any) => ({ ...curVal, ...newVal }),
    {
      loading: false,
      errorMessage: undefined,
      tick: 1
    }
  )

  const { loading, errorMessage, tick } = values

  const { poolData, balances } = useContext(AccountContext)

  const wallet = useWallet()
  const { account, connected } = wallet
  const address = account && account?.address
  const isTestnet = connected && account && account.chains && account.chains[0] === "sui:testnet" ? true : false

  const { listMintPositions, addCollateral, burn } = useMarket()

  const [mintPositions, setMintPositions] = useState<any>([])

  // State for selected collateral type 
  const [supplyAmount, setSupplyAmount] = useState('');
  const [withdrawAmount, setWithdrawAmount] = useState('');

  const [activeTab, setActiveTab] = useState('mint');
  const [showPositions, setShowPositions] = useState(true);

  // Modal states
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [showAddCollateralModal, setShowAddCollateralModal] = useState(false);
  const [additionalCollateral, setAdditionalCollateral] = useState<any>('');
  const [selectedPosition, setSelectedPosition] = useState<any>(null);
  const [showBurnModal, setShowBurnModal] = useState<boolean>(false);
  const [burnAmount, setBurnAmount] = useState<any>('');
  const [reclaimAmount, setReclaimAmount] = useState<any>('');

  // Mock data
  const marketData = {
    suiBTC: {
      price: 42567.89,
      change24h: 2.4,
      totalSupplied: 3.45,
      supplyAPY: 5.8,
      utilizationRate: 68,
      minCollateralRatio: 150,
    }
  };


  const supplyPositions = [
    {
      id: 'supply-1',
      asset: 'suiBTC',
      amount: 0.02,
      valueUSD: 851.36,
      apy: 5.8,
      suppliedAt: '2025-04-28'
    }
  ];

  useEffect(() => {
    if (address && isTestnet) {
      listMintPositions(address).then(setMintPositions)
    }

  }, [address, isTestnet, tick])


  // Handle position actions
  const handleAddCollateral = (position: any) => {
    setSelectedPosition(position);
    setShowAddCollateralModal(true);
  };

  const handleBurn = (position: any) => {
    setSelectedPosition(position);
    setShowBurnModal(true);
  };


  const executeAddCollateral = useCallback(async () => {

    dispatch({
      errorMessage: undefined
    })

    const amount = parseFloat(additionalCollateral)

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

      await addCollateral(amount, selectedPosition.collateralType)

      setShowAddCollateralModal(false);
      setAdditionalCollateral('');

      dispatch({
        tick: tick + 1,
        loading: false
      })

    } catch (error: any) {
      console.log(error)
      dispatch({
        errorMessage: `${error.message}`,
        loading: false
      })
    }

  }, [addCollateral, selectedPosition, additionalCollateral, poolData, tick])

  const executeBurn = useCallback(async () => {

    dispatch({
      errorMessage: undefined
    })


    const rAmount = parseFloat(reclaimAmount)
    const bAmount = parseFloat(burnAmount)

    if (bAmount === 0) {
      dispatch({
        errorMessage: "Invalid burn amount"
      })
      return
    }

    dispatch({
      loading: true
    })

    try {

      await burn(
        bAmount,
        selectedPosition.collateralType,
        rAmount
      )

      setShowBurnModal(false);
      setBurnAmount('');

      dispatch({
        tick: tick + 1,
        loading: false
      })

    } catch (error: any) {
      console.log(error)
      dispatch({
        errorMessage: `${error.message}`,
        loading: false
      })
    }

  }, [
    selectedPosition,
    reclaimAmount,
    burnAmount,
    tick,
    poolData,
    burn
  ])

  const handleWithdraw = (position: any) => {
    setSelectedPosition(position);
    setShowWithdrawModal(true);
  };

  const executeWithdraw = () => {
    // This would call your contract
    console.log(`Withdrawing ${withdrawAmount} ${selectedPosition.asset} from supply position`);
    setShowWithdrawModal(false);
    setWithdrawAmount('');
  };

  const newCRatio = (selectedPosition && reclaimAmount) ? Math.floor(selectedPosition.collateralRatio * (1 - parseFloat(reclaimAmount) / selectedPosition.collateralAmount)) : 150

  return (
    <div className="min-h-screen text-white">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8">Markets</h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Asset Info */}
          <div className="lg:col-span-1 space-y-6">
            {/* Asset Card */}
            <AssetCard
              marketData={marketData}
            />

            {/* Wallet Balances */}
            <WalletPanel

            />
          </div>

          {/* Right Column - Mint and Supply Actions */}
          <div className="lg:col-span-2">
            {/* Tabs */}
            <div className="flex mb-6">
              <button
                className={`px-6 py-3 text-sm font-medium rounded-t-lg ${activeTab === 'mint' ? 'bg-slate-800/70 text-white border-t border-l border-r border-slate-700/50' : 'bg-slate-800/30 text-slate-400'}`}
                onClick={() => setActiveTab('mint')}
              >
                <div className="flex items-center gap-2">
                  <Plus size={16} />
                  Mint Synthetic Assets
                </div>
              </button>
              <button
                className={`px-6 py-3 text-sm font-medium rounded-t-lg ${activeTab === 'supply' ? 'bg-slate-800/70 text-white border-t border-l border-r border-slate-700/50' : 'bg-slate-800/30 text-slate-400'}`}
                onClick={() => setActiveTab('supply')}
              >
                <div className="flex items-center gap-2">
                  <ArrowUpRight size={16} />
                  Supply to Lending Pool
                </div>
              </button>
            </div>

            {/* Mint Panel */}
            {activeTab === 'mint' && (
              <MintPanel

              />
            )}

            {/* Supply Panel */}
            {activeTab === 'supply' && (
              <SupplyPanel

              />
            )}

            {/* Active Positions */}
            <motion.div
              className="mt-6 bg-slate-800/50 backdrop-blur-sm rounded-xl border border-slate-700/50 p-6"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.3 }}
            >
              <div
                className="flex justify-between items-center cursor-pointer"
                onClick={() => setShowPositions(!showPositions)}
              >
                <h3 className="font-semibold">Your Positions</h3>
                <div className="flex items-center">
                  <button className="text-sm text-blue-400 hover:text-blue-300 flex items-center gap-1 mr-4">
                    <History size={14} />
                    History
                  </button>
                  <button className="text-slate-400">
                    {showPositions ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                  </button>
                </div>
              </div>

              {showPositions && (
                <div className="mt-4 space-y-6">
                  {/* Mint Positions */}
                  {activeTab === 'mint' && (
                    <MintPositions
                      mintPositions={mintPositions}
                      poolData={poolData}
                      handleAddCollateral={handleAddCollateral}
                      handleBurn={handleBurn}
                    />
                  )}

                  {/* Supply Positions */}
                  {activeTab === 'supply' && (
                    <div>
                      <h4 className="text-sm font-medium text-slate-400 mb-3">Supplied Assets</h4>

                      {supplyPositions.length > 0 ? (
                        <div className="space-y-3">
                          {supplyPositions.map(position => (
                            <div
                              key={position.id}
                              className="bg-slate-700/50 rounded-lg p-4 border border-slate-600/50"
                            >
                              <div className="flex justify-between items-center mb-3">
                                <div className="flex items-center gap-2">
                                  <div className="w-8 h-8 rounded-full bg-orange-500/20 flex items-center justify-center">
                                    <Bitcoin className="text-orange-500" size={16} />
                                  </div>
                                  <div>
                                    <div className="font-medium">{position.asset}</div>
                                    <div className="text-xs text-slate-400">Supplied</div>
                                  </div>
                                </div>
                                <div className="bg-green-500/20 text-green-400 rounded-lg px-2 py-1 text-xs font-medium">
                                  APY: {marketData.suiBTC.supplyAPY}%
                                </div>
                              </div>

                              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                                <div>
                                  <div className="text-slate-400 text-xs">Amount</div>
                                  <div>{position.amount} {position.asset}</div>
                                </div>
                                <div>
                                  <div className="text-slate-400 text-xs">Value</div>
                                  <div>${position.valueUSD.toLocaleString()}</div>
                                </div>
                                <div>
                                  <div className="text-slate-400 text-xs">Daily Yield</div>
                                  <div>{((position.amount * marketData.suiBTC.supplyAPY / 100) / 365).toFixed(8)} {position.asset}</div>
                                </div>
                                <div>
                                  <div className="text-slate-400 text-xs">Supplied On</div>
                                  <div>{position.suppliedAt}</div>
                                </div>
                              </div>

                              <div className="mt-4 pt-4 border-t border-slate-600/50">
                                <button
                                  className="w-full py-2 text-xs bg-purple-500/20 text-purple-400 hover:bg-purple-500/30 rounded-md transition-colors"
                                  onClick={() => handleWithdraw(position)}
                                >
                                  Withdraw
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-6 bg-slate-800/50 rounded-lg">
                          <ArrowUpRight size={32} className="text-slate-500 mx-auto mb-2" />
                          <p className="text-slate-400">No supplied assets found</p>
                          <button className="mt-3 px-4 py-2 bg-purple-500/20 text-purple-400 text-sm rounded-md hover:bg-purple-500/30 transition-colors">
                            Supply Your First Assets
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </motion.div>
          </div>
        </div>
      </div>

      {/* Add Collateral Modal */}
      {showAddCollateralModal && selectedPosition && (
        <div className="fixed inset-0 bg-slate-900/80 flex items-center justify-center z-50 backdrop-blur-sm">
          <motion.div
            className="bg-slate-800 rounded-xl border border-slate-700 p-6 max-w-md w-full mx-4"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.2 }}
          >
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold">Add Collateral</h3>
              <button
                onClick={() => setShowAddCollateralModal(false)}
                className="text-slate-400 hover:text-white"
              >
                <X size={20} />
              </button>
            </div>

            <div className="space-y-4">
              <div className="bg-slate-700/50 rounded-lg p-4">
                <h4 className="font-medium text-white mb-3">Position Information</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Asset:</span>
                    <span>suiBTC</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Current Collateral:</span>
                    <span>{selectedPosition.collateralAmount} {selectedPosition.collateralType}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Current Ratio:</span>
                    <span className={selectedPosition.collateralRatio >= 150 ? "text-green-400" : "text-yellow-400"}>
                      {selectedPosition.collateralRatio.toFixed(2)}%
                    </span>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-400 mb-2">
                  Additional Collateral ({selectedPosition.collateralType})
                </label>
                <div className="relative">
                  <input
                    type="number"
                    className="w-full bg-slate-700 rounded-lg p-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="0.00"
                    value={additionalCollateral}
                    onChange={(e) => setAdditionalCollateral(e.target.value)}
                  />
                </div>
                <div className="text-xs mt-1 text-slate-500">
                  Balance: {selectedPosition.collateralType === 'USDC' ?
                    balances.length > 0 ? balances[1].toLocaleString() : 0 :
                    balances.length > 0 ? balances[0].toLocaleString() : 0} {selectedPosition.collateralType}
                </div>
              </div>


              <div className="bg-blue-500/10 rounded-lg p-3 border border-blue-500/20">
                <h4 className="font-medium text-blue-400 mb-2">New Position Details</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-400">New Collateral:</span>
                    <span>
                      {(additionalCollateral ? selectedPosition.collateralAmount + parseFloat(additionalCollateral) : 0).toFixed(
                        selectedPosition.collateralType === 'USDC' ? 2 : 4
                      )} {selectedPosition.collateralType}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">New Collateral Ratio:</span>
                    <span className="text-green-400">
                      {/* Simplified calculation - would be more accurate in real implementation */}
                      {additionalCollateral ? Math.floor(selectedPosition.collateralRatio * (1 + parseFloat(additionalCollateral) / selectedPosition.collateralAmount)) : selectedPosition.collateralRatio.toFixed(2)}%
                    </span>
                  </div>
                </div>
              </div>

              <div className="pt-4 flex gap-3">
                <button
                  onClick={executeAddCollateral}
                  className="w-1/2 py-2 bg-blue-500 hover:bg-blue-600 text-white font-medium rounded-lg transition-colors"
                  disabled={!additionalCollateral || parseFloat(additionalCollateral) <= 0}
                >
                  {loading
                    ?
                    <RefreshCw
                      className='mx-auto animate-spin'
                    />
                    :
                    <>
                      Add Collateral
                    </>
                  }
                </button>
                <button
                  onClick={() => setShowAddCollateralModal(false)}
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

      {/* Withdraw Modal */}
      {showWithdrawModal && selectedPosition && (
        <div className="fixed inset-0 bg-slate-900/80 flex items-center justify-center z-50 backdrop-blur-sm">
          <motion.div
            className="bg-slate-800 rounded-xl border border-slate-700 p-6 max-w-md w-full mx-4"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.2 }}
          >
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold">Withdraw Assets</h3>
              <button
                onClick={() => setShowWithdrawModal(false)}
                className="text-slate-400 hover:text-white"
              >
                <X size={20} />
              </button>
            </div>

            <div className="space-y-4">
              <div className="bg-slate-700/50 rounded-lg p-4">
                <h4 className="font-medium text-white mb-3">Supply Information</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Asset:</span>
                    <span>{selectedPosition.asset}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Supplied Amount:</span>
                    <span>{selectedPosition.amount} {selectedPosition.asset}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Current Value:</span>
                    <span>${selectedPosition.valueUSD.toLocaleString()}</span>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-400 mb-2">
                  Withdraw Amount ({selectedPosition.asset})
                </label>
                <div className="relative">
                  <input
                    type="number"
                    className="w-full bg-slate-700 rounded-lg p-3 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                    placeholder="0.00000000"
                    value={withdrawAmount}
                    onChange={(e) => setWithdrawAmount(e.target.value)}
                  />
                  <button
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-purple-400 hover:text-purple-300"
                    onClick={() => setWithdrawAmount(selectedPosition.amount.toString())}
                  >
                    MAX
                  </button>
                </div>

                <div className="flex justify-between mt-1 text-xs text-slate-500">
                  <button onClick={() => setWithdrawAmount((selectedPosition.amount * 0.25).toFixed(8))}>25%</button>
                  <button onClick={() => setWithdrawAmount((selectedPosition.amount * 0.5).toFixed(8))}>50%</button>
                  <button onClick={() => setWithdrawAmount((selectedPosition.amount * 0.75).toFixed(8))}>75%</button>
                  <button onClick={() => setWithdrawAmount(selectedPosition.amount.toString())}>100%</button>
                </div>
              </div>

              {withdrawAmount && parseFloat(withdrawAmount) > 0 && (
                <div className="bg-purple-500/10 rounded-lg p-3 border border-purple-500/20">
                  <h4 className="font-medium text-purple-400 mb-2">After Withdrawal</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Remaining Supply:</span>
                      <span>
                        {Math.max(0, selectedPosition.amount - parseFloat(withdrawAmount)).toFixed(8)} {selectedPosition.asset}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Value to Receive:</span>
                      <span>
                        ${(parseFloat(withdrawAmount) * marketData.suiBTC.price).toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              <div className="pt-4 flex gap-3">
                <button
                  onClick={() => setShowWithdrawModal(false)}
                  className="w-1/2 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={executeWithdraw}
                  className="w-1/2 py-2 bg-purple-500 hover:bg-purple-600 text-white font-medium rounded-lg transition-colors"
                  disabled={!withdrawAmount || parseFloat(withdrawAmount) <= 0 || parseFloat(withdrawAmount) > selectedPosition.amount}
                >
                  Withdraw Assets
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {/* Burn Modal */}
      {showBurnModal && selectedPosition && (
        <div className="fixed inset-0 bg-slate-900/80 flex items-center justify-center z-50 backdrop-blur-sm">
          <motion.div
            className="bg-slate-800 rounded-xl border border-slate-700 p-6 max-w-md w-full mx-4"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.2 }}
          >
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold">Burn & Reclaim</h3>
              <button
                onClick={() => setShowBurnModal(false)}
                className="text-slate-400 hover:text-white"
              >
                <X size={20} />
              </button>
            </div>

            <div className="space-y-4">
              <div className="bg-slate-700/50 rounded-lg p-4">
                <h4 className="font-medium text-white mb-3">Position Information</h4>
                <div className="space-y-2 text-sm">
                  {/* <div className="flex justify-between">
                    <span className="text-slate-400">Asset:</span>
                    <span>suiBTC</span>
                  </div> */}
                  <div className="flex justify-between">
                    <span className="text-slate-400">Minted Amount:</span>
                    <span>{selectedPosition.debtAmount} suiBTC</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Total Collateral:</span>
                    <span>{selectedPosition.collateralAmount} {selectedPosition.collateralType}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Current C-Ratio:</span>
                    <span className={selectedPosition.collateralRatio >= 150 ? "text-green-400" : "text-yellow-400"}>
                      {selectedPosition.collateralRatio.toFixed(2)}%
                    </span>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-400 mb-2">
                  Burn Amount (suiBTC)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    className="w-full bg-slate-700 rounded-lg p-3 text-white focus:outline-none focus:ring-2 focus:ring-red-500"
                    placeholder="0.00000000"
                    value={burnAmount}
                    onChange={(e) => setBurnAmount(e.target.value)}
                  />
                </div>

                <div className="flex justify-between mt-1 text-xs text-slate-500">
                  {/* <button className='hover:text-white cursor-pointer' onClick={() => setBurnAmount(0)}>0%</button> */}
                  <button className='hover:text-white cursor-pointer' onClick={() => setBurnAmount((selectedPosition.debtAmount * 0.25).toFixed(8))}>25%</button>
                  <button className='hover:text-white cursor-pointer' onClick={() => setBurnAmount((selectedPosition.debtAmount * 0.5).toFixed(8))}>50%</button>
                  <button className='hover:text-white cursor-pointer' onClick={() => setBurnAmount((selectedPosition.debtAmount * 0.75).toFixed(8))}>75%</button>
                  <button className='hover:text-white cursor-pointer' onClick={() => setBurnAmount(selectedPosition.debtAmount.toString())}>100%</button>
                </div>
              </div>

              <>
                <div className="bg-blue-500/10 rounded-lg p-3 border border-blue-500/20">
                  <h4 className="font-medium text-blue-400 mb-2">Collateral to Reclaim</h4>

                  {/* Maximum available collateral to reclaim */}
                  {/* <div className="text-sm mb-3">
                    <div className="flex justify-between mb-1">
                      <span className="text-slate-400">Maximum Available:</span>
                      <span>
                        {burnAmount ? (selectedPosition.collateralAmount * parseFloat(burnAmount) / selectedPosition.debtAmount).toFixed(
                          selectedPosition.collateralType === 'USDC' ? 2 : 4
                        ) : 0} {selectedPosition.collateralType}
                      </span>
                    </div>
                    <div className="text-xs text-slate-500">
                      Based on the proportion of suiBTC being burned
                    </div>
                  </div> */}

                  {/* Collateral amount input */}
                  <div>
                    <label className="block text-sm font-medium text-slate-400 mb-2">
                      Reclaim Amount ({selectedPosition.collateralType})
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        className="w-full bg-slate-700 rounded-lg p-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="0.00"
                        value={reclaimAmount || ''}
                        onChange={(e) => setReclaimAmount(e.target.value)}
                      />
                    </div>

                    <div className="flex justify-between mt-1 text-xs text-slate-500">
                      <button className='hover:text-white cursor-pointer' onClick={() => {
                        setReclaimAmount(0);
                      }}>0%</button>
                      <button className='hover:text-white cursor-pointer' onClick={() => {
                        const maxReclaim = selectedPosition.collateralAmount * parseFloat(burnAmount) / selectedPosition.debtAmount;
                        setReclaimAmount((maxReclaim * 0.25).toFixed(selectedPosition.collateralType === 'USDC' ? 2 : 4));
                      }}>25%</button>
                      <button className='hover:text-white cursor-pointer' onClick={() => {
                        const maxReclaim = selectedPosition.collateralAmount * parseFloat(burnAmount) / selectedPosition.debtAmount;
                        setReclaimAmount((maxReclaim * 0.5).toFixed(selectedPosition.collateralType === 'USDC' ? 2 : 4));
                      }}>50%</button>
                      <button className='hover:text-white cursor-pointer' onClick={() => {
                        const maxReclaim = selectedPosition.collateralAmount * parseFloat(burnAmount) / selectedPosition.debtAmount;
                        setReclaimAmount((maxReclaim * 0.75).toFixed(selectedPosition.collateralType === 'USDC' ? 2 : 4));
                      }}>75%</button>
                      <button className='hover:text-white cursor-pointer' onClick={() => {
                        const maxReclaim = selectedPosition.collateralAmount * parseFloat(burnAmount) / selectedPosition.debtAmount;
                        setReclaimAmount(maxReclaim.toFixed(selectedPosition.collateralType === 'USDC' ? 2 : 4));
                      }}>100%</button>
                    </div>
                  </div>
                </div>

                <div className="bg-red-500/10 rounded-lg p-3 border border-red-500/20">
                  <h4 className="font-medium text-red-400 mb-2">After Burning</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Remaining Minted:</span>
                      <span>
                        {burnAmount ? Math.max(0, selectedPosition.debtAmount - parseFloat(burnAmount)).toFixed(8) : 0} suiBTC
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Remaining Collateral:</span>
                      <span>
                        {(selectedPosition.collateralAmount - (reclaimAmount || 0)).toFixed(
                          selectedPosition.collateralType === 'USDC' ? 2 : 4
                        )} {selectedPosition.collateralType}
                      </span>
                    </div>

                    {/* Only show new C-Ratio if there will be remaining minted assets */}
                    {selectedPosition.debtAmount - parseFloat(burnAmount) > 0 && (
                      <div className="flex justify-between">
                        <span className="text-slate-400">New C-Ratio:</span>
                        <span className={newCRatio >= 150 ? "text-green-400" : newCRatio >= 130 ? "text-yellow-400" : "text-red-400"}>
                          {newCRatio}%
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Warning for low C-Ratio */}
                  {newCRatio < 150 && selectedPosition.minted - parseFloat(burnAmount) > 0 && (
                    <div className="mt-2 flex items-start gap-2 text-xs">
                      <AlertTriangle size={14} className="text-yellow-500 shrink-0 mt-0.5" />
                      <span className="text-yellow-400">
                        Warning: New collateral ratio will be below the recommended 150%. This could increase liquidation risk.
                      </span>
                    </div>
                  )}
                </div>
              </>

              <div className="pt-4 flex gap-3">
                <button
                  onClick={executeBurn}
                  className="w-1/2 py-2 bg-red-500/80 hover:bg-red-600 text-white font-medium rounded-lg transition-colors"
                // disabled={
                //   loading || 
                //   !reclaimAmount ||
                //   parseFloat(reclaimAmount) <= 0 ||
                //   parseFloat(reclaimAmount) > (selectedPosition.collateralAmount * parseFloat(burnAmount) / selectedPosition.debtAmount) ||
                //   (newCRatio < 120 && selectedPosition.debtAmount - parseFloat(burnAmount) > 0)
                // }
                >
                  {loading
                    ?
                    <RefreshCw
                      className='mx-auto animate-spin'
                    />
                    :
                    <>
                      Burn & Reclaim
                    </>
                  }
                </button>
                <button
                  onClick={() => setShowBurnModal(false)}
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
    </div>
  );
};

export default MarketsContainer