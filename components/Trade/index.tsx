"use client"

import React, { useEffect, useCallback, useContext, useState, useReducer } from 'react';
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
  RefreshCw,
  AlertTriangle
} from 'lucide-react';
import WalletPanel from '../Wallet';
import { AccountContext } from '@/hooks/useAccount';
import useMarket from '@/hooks/useMarket';
import { useWallet } from '@suiet/wallet-kit'
import PriceChart from "./PriceChart"

const TradeContainer = () => {

  const { borrow, listActivePositions, cashOut, repay, addMoreCollateral } = useMarket()

  const [values, dispatch] = useReducer(
    (curVal: any, newVal: any) => ({ ...curVal, ...newVal }),
    {
      loading: false,
      errorMessage: undefined,
      tick: 1,
      errorCashout: undefined,
      errorAddCollateral: undefined,
      errorRepay: undefined
    }
  )

  const { errorMessage, loading, tick, errorCashout, errorRepay, errorAddCollateral } = values

  const wallet = useWallet()
  const { account, connected } = wallet
  const address = account && account?.address
  const isTestnet = connected && account && account.chains && account.chains[0] === "sui:testnet" ? true : false

  const { poolData, balances } = useContext(AccountContext)

  // State
  const [collateralType, setCollateralType] = useState<any>('USDC');
  const [showCollateralSelector, setShowCollateralSelector] = useState(false);
  const [collateralAmount, setCollateralAmount] = useState<any>('');
  const [leverage, setLeverage] = useState(3); // Default to 3x as in example
  const [showPositions, setShowPositions] = useState(true);
  const [showLiquidationModal, setShowLiquidationModal] = useState(false);

  const [cashOutAmount, setCashOutAmount] = useState<any>('');
  const [showCashOutModal, setShowCashOutModal] = useState(false);
  const [selectedPosition, setSelectedPosition] = useState<any>(null);
  const [activePositions, setActivePositions] = useState<any>([])
  const [currentPrice, setCurrentPrice] = useState(0);

  const [showAddCollateralModal, setShowAddCollateralModal] = useState<boolean>(false);
  const [showClosePositionModal, setShowClosePositionModal] = useState<boolean>(false);
  const [closePositionStep, setClosePositionStep] = useState<number>(1);
  const [additionalCollateral, setAdditionalCollateral] = useState<any>('');
  const [repayAmount, setRepayAmount] = useState<any>('');

  const increaseTick = useCallback(() => {
    dispatch({
      tick: tick + 1
    })
  }, [tick])

  useEffect(() => {
    if (address && isTestnet) {
      listActivePositions(address).then(setActivePositions)
    }

  }, [address, isTestnet, tick])


  const borrowedAmount = calculateBorrowedAmount(collateralType, collateralAmount, poolData, leverage);
  const positionDetails = calculatePositionDetails(collateralType, collateralAmount, poolData, leverage);

  // Handle cash out calculation
  const calculateCashOut = (position: any, percentage: any) => {
    if (!position) return null;

    const cashOutCollateral = (position.collateral * percentage) / 100;
    const cashOutProfit = (position.btcProfit * percentage) / 100;

    return {
      collateralReturn: cashOutCollateral,
      profitBTC: cashOutProfit
    };
  };


  const onBorrow = useCallback(async () => {

    dispatch({
      errorMessage: undefined
    })

    const amount = parseFloat(collateralAmount)

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

      await borrow(
        amount,
        collateralType,
        leverage
      )

      setTimeout(() => {
        increaseTick()
      }, 2000)

    } catch (error: any) {
      console.log(error)
      dispatch({
        errorMessage: `${error.message}`
      })
    }
    dispatch({
      loading: false
    })

  }, [leverage, collateralAmount, collateralType, borrow])


  const onRepay = useCallback(async () => {

    dispatch({
      errorRepay: undefined
    })

    dispatch({
      loading: true
    })

    try {

      await repay(
        Number(repayAmount),
        selectedPosition.collateralType
      )

      setShowClosePositionModal(false)
      setShowAddCollateralModal(false)

      setTimeout(() => {
        increaseTick()
      }, 2000)

    } catch (error: any) {
      console.log(error)
      dispatch({
        errorRepay: `${error.message}`
      })
    }
    dispatch({
      loading: false
    })

  }, [repayAmount, selectedPosition, repay])

  const onAddCollateral = useCallback(async () => {

    dispatch({
      errorAddCollateral: undefined
    })

    dispatch({
      loading: true
    })

    try {

      await addMoreCollateral(
        Number(additionalCollateral),
        selectedPosition.collateralType
      )

      setShowClosePositionModal(false)
      setShowAddCollateralModal(false)

      setTimeout(() => {
        increaseTick()
      }, 2000)

    } catch (error: any) {
      console.log(error)
      dispatch({
        errorAddCollateral: `${error.message}`
      })
    }
    dispatch({
      loading: false
    })

  }, [addMoreCollateral, selectedPosition, additionalCollateral])

  const onCashout = useCallback(async () => {

    dispatch({
      errorCashout: undefined
    })

    dispatch({
      loading: true
    })
    try {

      await cashOut(
        cashOutAmount / 100,
        selectedPosition.collateralType
      )

      setShowCashOutModal(false)

      setTimeout(() => {
        increaseTick()
      }, 2000)

    } catch (error: any) {
      console.log(error)
      dispatch({
        errorCashout: `${error.message}`
      })
    }
    dispatch({
      loading: false
    })

  }, [cashOutAmount, selectedPosition, cashOut])

  const utilizationRate = poolData ? ((poolData.lendingPool.totalBorrowed * 100) / poolData.lendingPool.totalSupplied) : 0

  return (
    <div className="min-h-screen  text-white">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8">Trade</h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">


          {/* Trade Panel - Left Column */}
          <div className="lg:col-span-2">

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <PriceChart
                currentPrice={currentPrice}
                setCurrentPrice={setCurrentPrice}
              />
            </motion.div>

            <div className="p-4 mt-6 bg-green-500/10 border border-green-500/20 rounded-lg mb-6">
              <div className="flex items-start gap-3">
                <Info size={20} className="text-green-400 mt-0.5" />
                <div>
                  <h4 className="font-medium text-green-400">Frictionless Leveraged Trading</h4>
                  <p className="text-slate-300 text-sm mt-1">
                    Open a leveraged long position on suiBTC with no funding rates and no liquid order books. Pay interest only when you repay the loan.
                  </p>
                </div>
              </div>
            </div>

            <motion.div
              className="bg-slate-800/50 mt-6 backdrop-blur-sm rounded-xl border border-slate-700/50 p-6"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.2 }}
            >
              <h2 className="text-xl font-bold mb-6">Leverage Trading</h2>



              {/* Trade form */}
              <div className="space-y-6">
                {/* Collateral type selector */}
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
                            <DollarSign className="text-blue-500" size={14} />
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
                        {["USDC", "SUI"].map(type => (
                          <button
                            key={type}
                            className="w-full flex items-center gap-2 p-3 hover:bg-slate-600 transition-colors"
                            onClick={() => {
                              setCollateralType(type);
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
                    <span className="text-slate-500">
                      Balance: {(balances && balances.length > 0) ? collateralType === 'USDC' ? (balances[1]).toLocaleString() : (balances[0]).toLocaleString() : 0} {collateralType}
                    </span>
                  </div>
                </div>

                {/* Collateral amount */}
                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-2">
                    Collateral Amount ({collateralType})
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      className="w-full bg-slate-700 rounded-lg p-3 text-white focus:outline-none focus:ring-2 focus:ring-green-500"
                      placeholder="0.00"
                      value={collateralAmount}
                      onChange={(e) => setCollateralAmount(e.target.value)}
                    />
                  </div>
                  <div className="flex justify-between text-xs mt-1">
                    <span className="text-slate-500">
                      {collateralType === 'USDC'
                        ? `Value: $${parseFloat(collateralAmount || "0").toLocaleString()}`
                        : `Value: $${(parseFloat(collateralAmount || "0") * (poolData ? poolData.prices.SUI : 1)).toLocaleString()}`}
                    </span>
                    {/* <span className="text-slate-500">
                      Min: {collateralType === 'USDC' ? '10' : '2'} {collateralType}
                    </span> */}
                  </div>
                </div>

                {/* Leverage slider */}
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <label className="text-sm font-medium text-slate-400">
                      Leverage
                    </label>
                    <span className="text-white font-bold">{leverage}x</span>
                  </div>

                  <input
                    type="range"
                    min="1"
                    max="4"
                    step="0.1"
                    value={leverage}
                    onChange={(e) => setLeverage(parseFloat(e.target.value))}
                    className="w-full h-2 bg-slate-700 rounded-full appearance-none cursor-pointer"
                  // style={{
                  //   backgroundImage: `linear-gradient(to right, rgb(34, 197, 94) 0%, rgb(234, 179, 8) ${(leverage / 4) * 100}%, rgb(51, 65, 85) ${(leverage / 4) * 100}%)`
                  // }}
                  />

                  <div className="flex justify-between text-xs mt-1 text-slate-500">
                    <span>1x</span>
                    <span>2x</span>
                    <span>3x</span>
                    <span>4x</span>
                  </div>
                </div>

                {/* Position details */}
                {collateralAmount && parseFloat(collateralAmount) > 0 && (
                  <div className="bg-slate-700/50 rounded-lg p-4 space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-400">Position Size</span>
                      <span>
                        ${((positionDetails?.positionSizeUSD || 0) * (2 / 3)).toLocaleString()} ({leverage}x)
                      </span>
                    </div>

                    <div className="flex justify-between text-sm">
                      <span className="text-slate-400">Borrowed Amount</span>
                      <span>{(borrowedAmount * (2 / 3)).toFixed(8)} suiBTC</span>
                    </div>

                    {/* <div className="flex justify-between text-sm">
                      <span className="text-slate-400">Entry Price</span>
                      <span>${poolData ? poolData?.prices?.BTC.toLocaleString() : 0}</span>
                    </div> */}

                    {/* Calculate dynamic liquidation threshold based on leverage */}
                    {(() => {
                      const baseThreshold = 120;
                      const leverageMultiplier = leverage;
                      const adjustedThreshold = baseThreshold + ((leverageMultiplier - 1) * 5); // 500 basis points (5%) per leverage multiple

                      return (
                        <div className="flex justify-between text-sm">
                          <span className="text-slate-400">Liquidation Threshold</span>
                          <div className="flex items-center">
                            <span className="text-yellow-400">{adjustedThreshold}%</span>
                            <button onClick={() => setShowLiquidationModal(true)} className="ml-1 text-slate-500 hover:text-slate-300">
                              <Info size={14} />
                            </button>
                          </div>
                        </div>
                      );
                    })()}

                    {/* Add liquidation warning for higher leverage */}
                    {leverage > 2 && (
                      <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-2 mt-2">
                        <div className="flex gap-2 text-xs">
                          <div className="shrink-0 mt-0.5">
                            <Info size={12} className="text-yellow-500" />
                          </div>
                          <div className="text-yellow-400">
                            Higher leverage ({leverage}x) increases your liquidation threshold to {(() => {
                              const baseThreshold = 120;
                              const leverageMultiplier = leverage;
                              return baseThreshold + ((leverageMultiplier - 1) * 5);
                            })()}%.
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Action button */}
                <button
                  onClick={onBorrow}
                  className="w-full py-3 bg-gradient-to-r from-green-500 to-cyan-500 text-white font-medium rounded-lg flex items-center justify-center gap-2 hover:shadow-lg hover:shadow-green-500/20 transition-all"
                  disabled={loading || !collateralAmount || parseFloat(collateralAmount) <= 0}
                >
                  {loading
                    ?
                    <RefreshCw
                      className='mx-auto animate-spin'
                    />
                    :
                    <>
                      Open Long Position
                      <TrendingUp size={18} />
                    </>
                  }
                </button>

                {errorMessage && (
                  <p className="text-sm text-center mt-2 text-white">
                    {errorMessage}
                  </p>
                )}

              </div>
            </motion.div>

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
                <h3 className="font-semibold">Active Positions</h3>
                <button className="text-slate-400">
                  {showPositions ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                </button>
              </div>

              {showPositions && (
                <div className="mt-4">
                  {activePositions.length > 0 ? (
                    <div className="space-y-4">
                      {activePositions.map((position: any, index: number) => {


                        let pnl = 0
                        let changes = 0
                        let entrySize = 0
                        let currentSize = 0
                        let hfactor = 100

                        if (currentPrice) {
                          const entryValue = Number(position.borrowedAmount) * Number(position.entryBtcPrice)
                          const currentValue = Number(position.borrowedAmount) * Number(currentPrice)
                          pnl = currentValue - entryValue
                          changes = Math.abs(100 - ((currentValue / entryValue) * 100))
                          entrySize = entryValue
                          currentSize = currentValue

                          if (poolData) {
                            const { healthFactor }: any = calculatePositionDetails(position.collateralType, position.collateralAmount, poolData, position.leverage, Number(currentPrice), Number(position.borrowedAmount));
                            hfactor = healthFactor
                          }
                        }

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
                                  <div className="text-xs text-slate-400">
                                    SuiSynth suiBTC Token
                                  </div>
                                </div>
                              </div>
                              <div className={`px-2 py-1 rounded-md text-xs font-medium ${pnl >= 0 ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                                {pnl >= 0 ? '+' : ''}{pnl.toLocaleString()} {position.collateralType} ({Number(changes).toFixed(2)}%)
                              </div>
                            </div>

                            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
                              <div>
                                <div className="text-slate-400 text-xs">Collateral</div>
                                <div>{position.collateralAmount} {position.collateralType}</div>
                              </div>
                              <div>
                                <div className="text-slate-400 text-xs">Leverage</div>
                                <div>{position.leverage}x Long</div>
                              </div>
                              <div>
                                <div className="text-slate-400 text-xs">Current Price</div>
                                <div>${(currentPrice).toLocaleString()}</div>
                              </div>
                              <div>
                                <div className="text-slate-400 text-xs">Entry Position Size</div>
                                <div>${entrySize.toLocaleString()}</div>
                              </div>
                              <div>
                                <div className="text-slate-400 text-xs">Current Position Price</div>
                                <div>${currentSize.toLocaleString()}</div>
                              </div>

                              <div>
                                <div className="text-slate-400 text-xs">Health Factor</div>
                                <div className="text-green-400">{hfactor.toFixed(2)}%</div>
                              </div>
                            </div>
                            <div className="flex gap-2 mt-4">
                              <button onClick={() => {
                                setSelectedPosition({
                                  ...position,
                                  healthFactor: hfactor
                                })
                                setShowAddCollateralModal(true)
                              }} className="flex-1 py-2  bg-blue-500 hover:bg-blue-600 text-white rounded-md text-sm transition-colors">
                                Add Collateral
                              </button>
                              <button
                                className="flex-1 py-2 bg-green-500/20 text-green-400 hover:bg-green-500/30 rounded-md text-sm transition-colors"
                                onClick={() => {
                                  setSelectedPosition({
                                    ...position,
                                    pnl,
                                    pnlInBTC: pnl / currentPrice
                                  });
                                  setShowCashOutModal(true);
                                }}
                              >
                                Cash Out
                              </button>
                              <button onClick={() => {
                                setSelectedPosition({
                                  ...position,
                                  healthFactor: hfactor
                                })
                                setShowClosePositionModal(true);
                                setClosePositionStep(1);
                              }} className="flex-1 py-2 bg-slate-600 hover:bg-slate-500 rounded-md text-sm transition-colors">
                                Repay Loan
                              </button>
                            </div>

                            {/* Position Size in suiBTC */}
                            {/* <div className="mt-3 pt-3 border-t border-slate-600/50">
                              <div className="flex justify-between text-xs">
                                <span className="text-slate-400">Position Size in suiBTC:</span>
                                <span className="text-slate-400">{position.borrowedAmount.toFixed(8)} suiBTC </span>
                              </div>
                            </div> */}
                            {/* BTC Profit Display */}
                            <div className="mt-3 pt-3 border-t border-slate-600/50">
                              <div className="flex justify-between text-xs">
                                <span className="text-slate-400">Profit in suiBTC:</span>
                                <span className="text-green-400">{pnl > 0 ? (pnl / currentPrice).toFixed(8) : 0} suiBTC</span>
                              </div>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  ) : (<div className="text-center py-6">
                    <AlertCircle size={32} className="text-slate-500 mx-auto mb-2" />
                    <p className="text-slate-400">No active positions found</p>
                  </div>
                  )}
                </div>
              )}
            </motion.div>
          </div>

          <div className="space-y-6">



            {/* Asset Card */}
            <motion.div
              className="bg-slate-800/50 backdrop-blur-sm rounded-xl border border-slate-700/50 p-6"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <h3 className="font-semibold">Pool Information</h3>

              <div className="grid grid-cols-2 gap-4 mt-4">
                <div className="bg-slate-700/50 rounded-lg p-3">
                  <div className="text-xs text-slate-400 mb-1">Available Liquidity</div>
                  <div className="font-semibold">{Number(poolData ? (poolData.lendingPool.totalSupplied - poolData.lendingPool.totalBorrowed) : 0).toLocaleString()} suiBTC</div>
                </div>

                <div className="bg-slate-700/50 rounded-lg p-3">
                  <div className="text-xs text-slate-400 mb-1">Borrow APR</div>
                  <div className="font-semibold text-yellow-400">
                    {Number(poolData?.lendingPool?.borrowRate || 0).toFixed(2)} %
                  </div>
                </div>

                <div className="bg-slate-700/50 rounded-lg p-3">
                  <div className="text-xs text-slate-400 mb-1">Total Borrowed</div>
                  <div className="font-semibold">{Number(poolData?.lendingPool?.totalBorrowed || 0).toLocaleString()} suiBTC</div>
                </div>

                <div className="bg-slate-700/50 rounded-lg p-3">
                  <div className="text-xs text-slate-400 mb-1">Max Leverage</div>
                  <div className="font-semibold">4x</div>
                </div>
              </div>

              <div className="mt-6">
                <div className="flex justify-between text-sm text-slate-400 mb-2">
                  <span>Utilization</span>
                  <span>{utilizationRate.toFixed(2)}%</span>
                </div>
                <div className="w-full h-3 bg-slate-700 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-green-500 to-yellow-500 rounded-full"
                    style={{ width: `${utilizationRate}%` }}
                  />
                </div>
                <div className="flex justify-between text-xs mt-1">
                  <span className="text-slate-500">0%</span>
                  <span className="text-slate-500">100%</span>
                </div>
              </div>


            </motion.div>

            {/* Wallet */}
            <WalletPanel />
          </div>

        </div>
      </div>

      {/* Liquidation Info Modal */}
      {showLiquidationModal && (
        <div className="fixed inset-0 bg-slate-900/80 flex items-center justify-center z-50 backdrop-blur-sm">
          <motion.div
            className="bg-slate-800 rounded-xl border border-slate-700 p-6 max-w-md w-full mx-4"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.2 }}
          >
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold">Liquidation Explained</h3>
              <button
                onClick={() => setShowLiquidationModal(false)}
                className="text-slate-400 hover:text-white"
              >
                &times;
              </button>
            </div>

            <div className="space-y-4">
              <p className="text-slate-300">
                Liquidation occurs when your position's health factor falls below the minimum threshold.
              </p>

              <div className="bg-red-500/10 rounded-lg p-3 border border-red-500/20">
                <h4 className="font-medium text-red-400 mb-1">How Liquidation Works</h4>
                <p className="text-slate-300 text-sm">
                  When your position is liquidated:
                </p>
                <ul className="text-sm text-slate-400 list-disc pl-5 mt-2 space-y-1">
                  <li>Your position is automatically closed</li>
                  <li>A liquidation fee is applied (typically 5-10%)</li>
                  <li>Remaining collateral is returned to your wallet</li>
                </ul>
              </div>

              <div className="bg-yellow-500/10 rounded-lg p-3 border border-yellow-500/20">
                <h4 className="font-medium text-yellow-400 mb-1">Avoiding Liquidation</h4>
                <p className="text-slate-300 text-sm">
                  To prevent liquidation:
                </p>
                <ul className="text-sm text-slate-400 list-disc pl-5 mt-2 space-y-1">
                  <li>Add more collateral to increase your health factor</li>
                  <li>Close part of your position to reduce risk</li>
                  <li>Monitor price movements and react accordingly</li>
                </ul>
              </div>

              <div className="pt-4">
                <button
                  onClick={() => setShowLiquidationModal(false)}
                  className="w-full py-2 bg-blue-500 hover:bg-blue-600 rounded-lg transition-colors"
                >
                  I Understand
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {/* Cash Out Modal */}
      {showCashOutModal && selectedPosition && (
        <div className="fixed inset-0 bg-slate-900/80 flex items-center justify-center z-50 backdrop-blur-sm">
          <motion.div
            className="bg-slate-800 rounded-xl border border-slate-700 p-6 max-w-md w-full mx-4"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.2 }}
          >
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold">Cash Out Position</h3>
              <button
                onClick={() => setShowCashOutModal(false)}
                className="text-slate-400 hover:text-white"
              >
                &times;
              </button>
            </div>

            <div className="space-y-4">
              <p className="text-slate-300">
                Specify how much of your position you want to cash out. You'll receive both your collateral and any accrued profits.
              </p>

              <div className="bg-slate-700/50 rounded-lg p-4">
                <h4 className="font-medium text-white mb-3">Position Summary</h4>
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
                    <span className="text-slate-400">Profit in suiBTC:</span>
                    <span className="text-green-400">{(selectedPosition.pnlInBTC).toFixed(8)}</span>
                  </div>{/*
                  <div className="flex justify-between">
                    <span className="text-slate-400">USD Value:</span>
                    <span>${(selectedPosition.collateral + selectedPosition.pnl).toFixed(2)}</span>
                  </div> */}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-400 mb-2">
                  Percentage to Cash Out
                </label>
                <div className="relative">
                  <input
                    type="number"
                    className="w-full bg-slate-700 rounded-lg p-3 text-white focus:outline-none focus:ring-2 focus:ring-yellow-500"
                    placeholder="50"
                    min="1"
                    max="100"
                    value={cashOutAmount}
                    onChange={(e) => setCashOutAmount(e.target.value)}
                  />
                  <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400">
                    %
                  </span>
                </div>

                <div className="flex justify-between mt-1 text-xs text-slate-500">
                  <button onClick={() => setCashOutAmount("25")}>25%</button>
                  <button onClick={() => setCashOutAmount("50")}>50%</button>
                  <button onClick={() => setCashOutAmount("75")}>75%</button>
                  <button onClick={() => setCashOutAmount("100")}>100%</button>
                </div>
              </div>

              {cashOutAmount && parseFloat(cashOutAmount) > 0 && (
                <div className="bg-yellow-500/10 rounded-lg p-3 border border-yellow-500/20">
                  <h4 className="font-medium text-yellow-400 mb-2">You Will Receive</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Collateral Return:</span>
                      <span>
                        {(selectedPosition.collateralAmount * parseFloat(cashOutAmount) / 100).toFixed(2)} {selectedPosition.collateralType}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Profit in suiBTC:</span>
                      <span className="text-green-400">
                        {((selectedPosition.pnlInBTC > 0 ? (selectedPosition.pnlInBTC) : 0) * parseFloat(cashOutAmount) / 100).toFixed(8)} suiBTC
                      </span>
                    </div>
                  </div>
                </div>
              )}

              <div className="pt-4 flex gap-3">
                <button
                  onClick={onCashout}
                  className="w-1/2 py-2 bg-green-500/20 text-green-400 hover:bg-green-500/30 font-medium rounded-lg transition-colors"
                  disabled={loading || !cashOutAmount || parseFloat(cashOutAmount) <= 0 || parseFloat(cashOutAmount) > 100}
                >

                  {loading
                    ?
                    <RefreshCw
                      className='mx-auto animate-spin'
                    />
                    :
                    <>
                      Confirm Cash Out
                    </>
                  }

                </button>
                <button
                  onClick={() => setShowCashOutModal(false)}
                  className="w-1/2 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg transition-colors"
                >
                  Cancel
                </button>
              </div>
              {errorCashout && (
                <p className="text-sm text-center mt-2 text-white">
                  {errorCashout}
                </p>
              )}
            </div>
          </motion.div>
        </div>
      )}

      {/* Position Management Modal - Handles both Add Collateral and Close Position */}
      {(showAddCollateralModal || showClosePositionModal) && selectedPosition && (
        <div className="fixed inset-0 bg-slate-900/80 flex items-center justify-center z-50 backdrop-blur-sm">
          <motion.div
            className="bg-slate-800 rounded-xl border border-slate-700 p-6 max-w-md w-full mx-4"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.2 }}
          >
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold">
                {showAddCollateralModal ? "Add Collateral" :
                  closePositionStep === 1 ? "Repay Loan" : "Close Position"}
              </h3>
              <button
                onClick={() => {
                  setShowAddCollateralModal(false);
                  setShowClosePositionModal(false);
                  setClosePositionStep(1);
                  setAdditionalCollateral("");
                  setRepayAmount("");
                }}
                className="text-slate-400 hover:text-white"
              >
                &times;
              </button>
            </div>

            <div className="space-y-4">
              {/* Position Summary - shown in all modes */}
              <div className="bg-slate-700/50 rounded-lg p-4">
                <h4 className="font-medium text-white mb-3">Position Summary</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Asset:</span>
                    <span>suiBTC</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Collateral:</span>
                    <span>{selectedPosition.collateralAmount} {selectedPosition.collateralType}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Borrowed Amount:</span>
                    <span>{selectedPosition.borrowedAmount} suiBTC</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Health Factor:</span>
                    <span className="text-green-400">{selectedPosition.healthFactor.toFixed(2) || "100"}%</span>
                  </div>
                </div>
              </div>

              {/* Add Collateral Form */}
              {showAddCollateralModal && (
                <>
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
                      <button
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-blue-400 hover:text-blue-300"
                        onClick={() => {
                          const balance = selectedPosition.collateralType === 'USDC' ?
                            (balances && balances.length > 0 ? balances[1] : 0) :
                            (balances && balances.length > 0 ? balances[0] : 0);
                          setAdditionalCollateral(balance.toString());
                        }}
                      >
                        MAX
                      </button>
                    </div>
                    <div className="text-xs mt-1 text-slate-500">
                      Balance: {selectedPosition.collateralType === 'USDC' ?
                        (balances && balances.length > 0 ? balances[1] : 0).toLocaleString() :
                        (balances && balances.length > 0 ? balances[0] : 0).toLocaleString()} {selectedPosition.collateralType}
                    </div>
                  </div>

                  {additionalCollateral && parseFloat(additionalCollateral) > 0 && (
                    <div className="bg-blue-500/10 rounded-lg p-3 border border-blue-500/20">
                      <h4 className="font-medium text-blue-400 mb-2">New Position Details</h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-slate-400">New Collateral:</span>
                          <span>
                            {(parseFloat(selectedPosition.collateralAmount) + parseFloat(additionalCollateral)).toFixed(
                              selectedPosition.collateralType === 'USDC' ? 2 : 4
                            )} {selectedPosition.collateralType}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-400">New Health Factor:</span>
                          <span className="text-green-400">
                            {/* Simplified calculation - would be more accurate in real implementation */}
                            {Math.min(200, Math.floor((parseFloat(selectedPosition.healthFactor) || 100) * (1 + parseFloat(additionalCollateral) / parseFloat(selectedPosition.collateralAmount))))}%
                          </span>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="pt-4 flex gap-3">
                    <button
                      onClick={onAddCollateral}
                      className="w-1/2 py-3 bg-blue-500 hover:bg-blue-600 text-white font-medium rounded-lg transition-colors"
                      disabled={loading || !additionalCollateral || parseFloat(additionalCollateral) <= 0}
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
                      onClick={() => {
                        setShowAddCollateralModal(false);
                        setAdditionalCollateral("");
                      }}
                      className="w-1/2 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg transition-colors"
                    >
                      Cancel
                    </button>
                  </div>

                  {errorAddCollateral && (
                    <p className="text-sm text-center mt-2 text-white">
                      {errorAddCollateral}
                    </p>
                  )}

                </>
              )}

              {/* Close Position - Step 1: Repay Debt */}
              {showClosePositionModal && closePositionStep === 1 && (
                <>
                  {/* <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-3 mb-3">
                    <div className="flex items-start gap-2">
                      <Info size={16} className="text-yellow-400 mt-1 shrink-0" />
                      <div className="text-sm text-slate-300">
                        <p>Closing a position is a two-step process:</p>
                        <p className="mt-1 font-medium text-yellow-400">Step 1: Repay borrowed suiBTC</p>
                        <p className="mt-1">Step 2: Withdraw your collateral and profits</p>
                      </div>
                    </div>
                  </div> */}

                  <div>
                    <label className="block text-sm font-medium text-slate-400 mb-2">
                      Repay Amount (suiBTC)
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        className="w-full bg-slate-700 rounded-lg p-3 text-white focus:outline-none focus:ring-2 focus:ring-yellow-500"
                        placeholder="0.00000000"
                        value={repayAmount}
                        onChange={(e) => setRepayAmount(e.target.value)}
                      />
                      <button
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-yellow-400 hover:text-yellow-300"
                        onClick={() => setRepayAmount(selectedPosition.borrowedAmount.toString())}
                      >
                        MAX
                      </button>
                    </div>
                    <div className="text-xs mt-1 text-slate-500 flex justify-between">
                      {/* <span>Balance: {(balances && balances.length > 0 ? balances[2] : 0).toLocaleString()} suiBTC</span> */}
                      <span>Outstanding Debt: {selectedPosition.borrowedAmount} suiBTC</span>
                    </div>
                  </div>

                  {/* Warning if user doesn't have enough suiBTC */}
                  {/* {repayAmount && parseFloat(repayAmount) > 0 && parseFloat(repayAmount) > (balances && balances.length > 0 ? balances[2] : 0) && (
                    <div className="bg-red-500/10 rounded-lg p-3 border border-red-500/20">
                      <div className="flex items-start gap-2">
                        <AlertTriangle size={16} className="text-red-400 mt-0.5 shrink-0" />
                        <div className="text-sm text-red-400">
                          You don't have enough suiBTC to repay this amount. Please acquire more suiBTC or repay a smaller amount.
                        </div>
                      </div>
                    </div>
                  )} */}

                  {/* Option to buy more suiBTC if needed */}
                  {/* {repayAmount && parseFloat(repayAmount) > 0 && parseFloat(repayAmount) > (balances && balances.length > 0 ? balances[2] : 0) && (
                    <button className="w-full py-2 mt-2 bg-slate-700 hover:bg-slate-600 text-sm rounded-lg transition-colors">
                      Get more suiBTC from DEX
                    </button>
                  )} */}

                  <div className="pt-4 flex gap-3">
                    <button
                      onClick={onRepay}
                      className="w-full py-3 bg-yellow-500 hover:bg-yellow-600 text-white font-medium rounded-lg transition-colors"
                      disabled={loading || !repayAmount || parseFloat(repayAmount) <= 0}
                    >

                      {loading
                        ?
                        <RefreshCw
                          className='mx-auto animate-spin'
                        />
                        :
                        <>
                          Repay
                        </>
                      }

                    </button>
                  </div>
                  {errorRepay && (
                    <p className="text-sm text-center mt-2 text-white">
                      {errorRepay}
                    </p>
                  )}

                </>
              )}

              {/* Close Position - Step 2: Withdraw Collateral */}
              {showClosePositionModal && closePositionStep === 2 && (
                <>
                  <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-3 mb-3">
                    <div className="flex items-start gap-2">
                      <Info size={16} className="text-green-400 mt-1 shrink-0" />
                      <div className="text-sm text-slate-300">
                        <p className="mt-1 text-green-400 font-medium">Step 2: Withdraw your collateral and profits</p>
                        <p className="mt-1">Your debt has been repaid. You can now withdraw your collateral and any profits earned.</p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-slate-700/30 rounded-lg p-4">
                    <h4 className="font-medium text-white mb-3">Available to Withdraw</h4>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-slate-400">Original Collateral:</span>
                        <span>{selectedPosition.collateralAmount} {selectedPosition.collateralType}</span>
                      </div>
                      {selectedPosition.pnl && selectedPosition.pnl > 0 && (
                        <div className="flex justify-between">
                          <span className="text-slate-400">Profit:</span>
                          <span className="text-green-400">{selectedPosition.pnl.toFixed(4)} {selectedPosition.collateralType}</span>
                        </div>
                      )}
                      <div className="pt-2 border-t border-slate-600">
                        <div className="flex justify-between font-medium">
                          <span className="text-white">Total to Receive:</span>
                          <span>{(parseFloat(selectedPosition.collateralAmount) + (selectedPosition.pnl || 0)).toFixed(4)} {selectedPosition.collateralType}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="pt-4 flex gap-3">
                    <button
                      onClick={() => {
                        // Call withdraw function
                        console.log(`Withdrawing collateral and profits for position ${selectedPosition.id}`);
                        setShowClosePositionModal(false);
                        setClosePositionStep(1);
                      }}
                      className="w-full py-3 bg-green-500 hover:bg-green-600 text-white font-medium rounded-lg transition-colors"
                    >
                      Withdraw & Close Position
                    </button>
                  </div>
                </>
              )}
            </div>
          </motion.div>
        </div>
      )}


    </div>
  );
};

// Calculate position details
const calculatePositionDetails = (collateralType: string, collateralAmount: any, poolData: any, leverage: any, currentPrice: any = undefined, borrowedAmount: any = undefined) => {
  if (!collateralAmount) return null;
  if (!poolData) return null;

  const collateralValueUSD = collateralType === 'USDC'
    ? parseFloat(collateralAmount)
    : parseFloat(collateralAmount) * poolData.prices.SUI;

  const currentBTCPrice = currentPrice || poolData.prices.BTC

  const positionSizeUSD = collateralValueUSD * leverage;
  const borrowedBTC = borrowedAmount || (positionSizeUSD / currentBTCPrice)

  // Calculate health factor: (collateral value / borrowed value) * 100
  const healthFactor = (collateralValueUSD / (borrowedBTC * currentBTCPrice)) * leverage * 100;

  // Calculate liquidation price: price at which health factor reaches minimum
  const minHealthFactor = 120;
  const liquidationPrice = (collateralValueUSD / borrowedBTC) * (minHealthFactor / 100) / leverage;

  return {
    positionSizeUSD,
    borrowedBTC,
    healthFactor,
    liquidationPrice
  };
};

// Calculate borrowed amount based on collateral and leverage
const calculateBorrowedAmount = (collateralType: string, collateralAmount: any, poolData: any, leverage: any, currentPrice: any = undefined) => {
  if (!collateralAmount) return 0;
  if (!poolData) return 0;

  const currentBTCPrice = currentPrice || poolData.prices.BTC

  const collateralValueUSD = collateralType === 'USDC'
    ? parseFloat(collateralAmount)
    : parseFloat(collateralAmount) * poolData.prices.SUI;

  const positionSizeUSD = collateralValueUSD * leverage;

  return positionSizeUSD / currentBTCPrice;
};

export default TradeContainer