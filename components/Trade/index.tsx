"use client"

import React, { useState } from 'react';
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
  Wallet
} from 'lucide-react';
import WalletPanel from '../Wallet';

const TradeContainer = () => {

  // State
  const [collateralType, setCollateralType] = useState('USDC');
  const [showCollateralSelector, setShowCollateralSelector] = useState(false);
  const [collateralAmount, setCollateralAmount] = useState('');
  const [leverage, setLeverage] = useState(3); // Default to 3x as in example
  const [showPositions, setShowPositions] = useState(true);
  const [showLiquidationModal, setShowLiquidationModal] = useState(false);
  const [cashOutAmount, setCashOutAmount] = useState('');
  const [showCashOutModal, setShowCashOutModal] = useState(false);
  const [selectedPosition, setSelectedPosition] = useState(null);

  // Mock data
  const marketData = {
    suiBTC: {
      price: 60000, // Updated to match test example
      change24h: 2.4,
      totalBorrowed: 1.28,
      borrowAPY: 3.2,
      utilizationRate: 68,
      minCollateralRatio: 110, // For borrowing - lower than mint ratio
      availableLiquidity: 3.45,
      maxLeverage: 4
    }
  };

  const walletBalances = {
    SUI: 10.5,
    USDC: 5000,
    suiBTC: 0.12
  };

  const collateralTypes = [
    { id: 'USDC', icon: <DollarSign size={16} />, color: 'bg-blue-500' },
    { id: 'SUI', icon: <Wallet size={16} />, color: 'bg-cyan-500' }
  ];

  // Active positions - including the example from your test case
  const activePositions = [
    {
      id: 'pos-1',
      asset: 'suiBTC',
      collateralType: 'USDC',
      collateral: 5, // USDC (showing remaining after 50% cash out)
      borrowed: 0.00025, // suiBTC
      leverage: 3,
      entryPrice: 60000,
      currentPrice: 72000,
      pnl: 0.8, // 20% profit on half of initial 10 USDC position (after cashing out)
      pnlPercent: 20,
      healthFactor: 182,
      liquidationPrice: 45000,
      btcProfit: 0.00004166 // as per test example
    }
  ];

  // Calculate borrowed amount based on collateral and leverage
  const calculateBorrowedAmount = () => {
    if (!collateralAmount) return 0;

    const collateralValueUSD = collateralType === 'USDC'
      ? parseFloat(collateralAmount)
      : parseFloat(collateralAmount) * 5.75; // Assuming SUI price is $5.75

    const positionSizeUSD = collateralValueUSD * leverage;

    return positionSizeUSD / marketData.suiBTC.price;
  };

  const borrowedAmount = calculateBorrowedAmount();

  // Calculate position details
  const calculatePositionDetails = () => {
    if (!collateralAmount) return null;

    const collateralValueUSD = collateralType === 'USDC'
      ? parseFloat(collateralAmount)
      : parseFloat(collateralAmount) * 5.75;

    const positionSizeUSD = collateralValueUSD * leverage;
    const borrowedBTC = positionSizeUSD / marketData.suiBTC.price;

    // Calculate health factor: (collateral value / borrowed value) * 100
    const healthFactor = (collateralValueUSD / (borrowedBTC * marketData.suiBTC.price)) * leverage * 100;

    // Calculate liquidation price: price at which health factor reaches minimum
    const minHealthFactor = marketData.suiBTC.minCollateralRatio;
    const liquidationPrice = (collateralValueUSD / borrowedBTC) * (minHealthFactor / 100) / leverage;

    return {
      positionSizeUSD,
      borrowedBTC,
      healthFactor,
      liquidationPrice
    };
  };

  const positionDetails = calculatePositionDetails();

  // Handle cash out calculation
  const calculateCashOut = (position, percentage) => {
    if (!position) return null;

    const cashOutCollateral = (position.collateral * percentage) / 100;
    const cashOutProfit = (position.btcProfit * percentage) / 100;

    return {
      collateralReturn: cashOutCollateral,
      profitBTC: cashOutProfit
    };
  };

  const handleCashOut = () => {
    // This would call your contract's cash_out_position function
    console.log(`Cashing out ${cashOutAmount}% of position ${selectedPosition?.id}`);
    setShowCashOutModal(false);
  };


  return (
    <div className="min-h-screen  text-white">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8">Trade</h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Market Info - Left Column */}
          <div className="space-y-6">
            {/* Asset Card */}
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
                    <span className="font-mono">${marketData.suiBTC.price.toLocaleString()}</span>
                    <span className={`ml-2 ${marketData.suiBTC.change24h >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                      {marketData.suiBTC.change24h >= 0 ? '+' : ''}{marketData.suiBTC.change24h}%
                    </span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mt-6">
                <div className="bg-slate-700/50 rounded-lg p-3">
                  <div className="text-xs text-slate-400 mb-1">Available Liquidity</div>
                  <div className="font-semibold">{marketData.suiBTC.availableLiquidity} suiBTC</div>
                </div>

                <div className="bg-slate-700/50 rounded-lg p-3">
                  <div className="text-xs text-slate-400 mb-1">Borrow APY</div>
                  <div className="font-semibold text-yellow-400">{marketData.suiBTC.borrowAPY}%</div>
                </div>

                <div className="bg-slate-700/50 rounded-lg p-3">
                  <div className="text-xs text-slate-400 mb-1">Total Borrowed</div>
                  <div className="font-semibold">{marketData.suiBTC.totalBorrowed} suiBTC</div>
                </div>

                <div className="bg-slate-700/50 rounded-lg p-3">
                  <div className="text-xs text-slate-400 mb-1">Max Leverage</div>
                  <div className="font-semibold">{marketData.suiBTC.maxLeverage}x</div>
                </div>
              </div>

              <div className="mt-6">
                <div className="flex justify-between text-sm text-slate-400 mb-2">
                  <span>Utilization</span>
                  <span>{marketData.suiBTC.utilizationRate}%</span>
                </div>
                <div className="w-full h-3 bg-slate-700 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-green-500 to-yellow-500 rounded-full"
                    style={{ width: `${marketData.suiBTC.utilizationRate}%` }}
                  />
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-700">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <BarChart2 size={16} className="text-slate-400" />
                    <span className="text-sm font-medium">Price Chart</span>
                  </div>
                  <div className="flex gap-2">
                    <button className="px-2 py-1 text-xs bg-slate-700 rounded-md text-slate-400">1D</button>
                    <button className="px-2 py-1 text-xs bg-blue-500/20 text-blue-400 rounded-md">1W</button>
                    <button className="px-2 py-1 text-xs bg-slate-700 rounded-md text-slate-400">1M</button>
                  </div>
                </div>

                {/* Simple placeholder chart */}
                <div className="mt-3 w-full h-32 bg-slate-800 rounded-lg overflow-hidden">
                  <svg viewBox="0 0 100 40" preserveAspectRatio="none" className="w-full h-full">
                    <path
                      d="M0,30 L10,28 L20,26 L30,24 L40,22 L50,18 L60,15 L70,13 L80,10 L90,8 L100,5"
                      stroke="rgba(96, 165, 250, 0.8)"
                      strokeWidth="1.5"
                      fill="none"
                    />
                    <path
                      d="M0,30 L10,28 L20,26 L30,24 L40,22 L50,18 L60,15 L70,13 L80,10 L90,8 L100,5 L100,40 L0,40 Z"
                      fill="rgba(96, 165, 250, 0.1)"
                    />
                  </svg>
                </div>
              </div>
            </motion.div>

            {/* Wallet */}
            <WalletPanel />
          </div>

          {/* Trade Panel - Right Column */}
          <div className="lg:col-span-2">
            <motion.div
              className="bg-slate-800/50 backdrop-blur-sm rounded-xl border border-slate-700/50 p-6"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.2 }}
            >
              <h2 className="text-xl font-bold mb-6">Leverage Trading</h2>

              <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-lg mb-6">
                <div className="flex items-start gap-3">
                  <Info size={20} className="text-green-400 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-green-400">Borrow from Lending Pool</h4>
                    <p className="text-slate-300 text-sm mt-1">
                      Open a leveraged long position on suiBTC by providing collateral and borrowing from the lending pool. Utilize up to {marketData.suiBTC.maxLeverage}x leverage to amplify your exposure.
                    </p>
                  </div>
                </div>
              </div>

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
                            <Wallet className="text-cyan-500" size={14} />
                          )}
                        </div>
                        <span>{collateralType}</span>
                      </div>
                      {showCollateralSelector ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                    </button>

                    {/* Dropdown */}
                    {showCollateralSelector && (
                      <div className="absolute top-full left-0 right-0 mt-1 bg-slate-700 rounded-lg overflow-hidden z-10 border border-slate-600">
                        {collateralTypes.map(type => (
                          <button
                            key={type.id}
                            className="w-full flex items-center gap-2 p-3 hover:bg-slate-600 transition-colors"
                            onClick={() => {
                              setCollateralType(type.id);
                              setShowCollateralSelector(false);
                            }}
                          >
                            <div className={`w-6 h-6 rounded-full ${type.id === 'USDC' ? 'bg-blue-500/20' : 'bg-cyan-500/20'} flex items-center justify-center`}>
                              {type.icon}
                            </div>
                            <span>{type.id}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="flex justify-between text-xs mt-1">
                    <span className="text-slate-500">
                      Balance: {collateralType === 'USDC' ? walletBalances.USDC.toLocaleString() : walletBalances.SUI.toLocaleString()} {collateralType}
                    </span>
                    <button
                      className="text-blue-400 hover:text-blue-300"
                      onClick={() => setCollateralAmount(collateralType === 'USDC' ? walletBalances.USDC.toString() : walletBalances.SUI.toString())}
                    >
                      Max
                    </button>
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
                    <button
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-green-400 hover:text-green-300"
                      onClick={() => setCollateralAmount(collateralType === 'USDC' ? walletBalances.USDC.toString() : walletBalances.SUI.toString())}
                    >
                      MAX
                    </button>
                  </div>
                  <div className="flex justify-between text-xs mt-1">
                    <span className="text-slate-500">
                      {collateralType === 'USDC'
                        ? `Value: $${parseFloat(collateralAmount || 0).toLocaleString()}`
                        : `Value: $${(parseFloat(collateralAmount || 0) * 5.75).toLocaleString()}`}
                    </span>
                    <span className="text-slate-500">
                      Min: {collateralType === 'USDC' ? '10' : '2'} {collateralType}
                    </span>
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
                    max={marketData.suiBTC.maxLeverage}
                    step="0.1"
                    value={leverage}
                    onChange={(e) => setLeverage(parseFloat(e.target.value))}
                    className="w-full h-2 bg-slate-700 rounded-full appearance-none cursor-pointer"
                    style={{
                      backgroundImage: `linear-gradient(to right, rgb(34, 197, 94) 0%, rgb(234, 179, 8) ${(leverage / marketData.suiBTC.maxLeverage) * 100}%, rgb(51, 65, 85) ${(leverage / marketData.suiBTC.maxLeverage) * 100}%)`
                    }}
                  />

                  <div className="flex justify-between text-xs mt-1 text-slate-500">
                    <span>1x</span>
                    <span>2x</span>
                    <span>3x</span>
                    <span>{marketData.suiBTC.maxLeverage}x</span>
                  </div>
                </div>

                {/* Position details */}
                {collateralAmount && parseFloat(collateralAmount) > 0 && (
                  <div className="bg-slate-700/50 rounded-lg p-4 space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-400">Position Size</span>
                      <span>
                        ${positionDetails?.positionSizeUSD.toLocaleString()} ({leverage}x)
                      </span>
                    </div>

                    <div className="flex justify-between text-sm">
                      <span className="text-slate-400">Borrowed Amount</span>
                      <span>{borrowedAmount.toFixed(8)} suiBTC</span>
                    </div>

                    <div className="flex justify-between text-sm">
                      <span className="text-slate-400">Entry Price</span>
                      <span>${marketData.suiBTC.price.toLocaleString()}</span>
                    </div>

                    <div className="flex justify-between text-sm">
                      <span className="text-slate-400">Liquidation Price</span>
                      <div className="flex items-center">
                        <span className="text-red-400">${positionDetails?.liquidationPrice.toLocaleString()}</span>
                        <button onClick={() => setShowLiquidationModal(true)} className="ml-1 text-slate-500 hover:text-slate-300">
                          <Info size={14} />
                        </button>
                      </div>
                    </div>

                    <div className="flex justify-between text-sm">
                      <span className="text-slate-400">Borrow APY</span>
                      <span>{marketData.suiBTC.borrowAPY}%</span>
                    </div>

                    <div className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <span>Health Factor</span>
                        <span className="text-green-400">{positionDetails?.healthFactor.toFixed(0)}%</span>
                      </div>
                      <div className="w-full h-2 bg-slate-600 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-red-500 via-yellow-500 to-green-500"
                          style={{ width: `${Math.min(100, (positionDetails?.healthFactor || 0) / 2)}%` }}
                        />
                      </div>
                      <div className="flex justify-between text-xs text-slate-500">
                        <span>Risky</span>
                        <span>Safe</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Action button */}
                <button
                  className="w-full py-3 bg-gradient-to-r from-green-500 to-cyan-500 text-white font-medium rounded-lg flex items-center justify-center gap-2 hover:shadow-lg hover:shadow-green-500/20 transition-all"
                  disabled={!collateralAmount || parseFloat(collateralAmount) <= 0 || parseFloat(collateralAmount) > (collateralType === 'USDC' ? walletBalances.USDC : walletBalances.SUI)}
                >
                  Open Long Position
                  <TrendingUp size={18} />
                </button>

                <div className="text-center text-xs text-slate-400">
                  <div className="flex items-center justify-center gap-1">
                    <Shield size={12} />
                    <span>All positions are monitored by AI for risk alerts</span>
                  </div>
                </div>
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
                      {activePositions.map(position => (
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
                                <div className="text-xs text-slate-400">{position.leverage}x Long</div>
                              </div>
                            </div>
                            <div className={`px-2 py-1 rounded-md text-xs font-medium ${position.pnl >= 0 ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                              {position.pnl >= 0 ? '+' : ''}{position.pnl} {position.collateralType} ({position.pnlPercent}%)
                            </div>
                          </div>

                          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
                            <div>
                              <div className="text-slate-400 text-xs">Collateral</div>
                              <div>{position.collateral} {position.collateralType}</div>
                            </div>
                            <div>
                              <div className="text-slate-400 text-xs">Size</div>
                              <div>{position.borrowed} {position.asset}</div>
                            </div>
                            <div>
                              <div className="text-slate-400 text-xs">Entry Price</div>
                              <div>${position.entryPrice.toLocaleString()}</div>
                            </div>
                            <div>
                              <div className="text-slate-400 text-xs">Current Price</div>
                              <div>${position.currentPrice.toLocaleString()}</div>
                            </div>
                            <div>
                              <div className="text-slate-400 text-xs">Health</div>
                              <div className="text-green-400">{position.healthFactor}%</div>
                            </div>
                            <div>
                              <div className="text-slate-400 text-xs">Liquidation</div>
                              <div className="text-red-400">${position.liquidationPrice.toLocaleString()}</div>
                            </div>
                          </div>

                          <div className="flex gap-2 mt-4">
                            <button className="flex-1 py-2 bg-slate-600 hover:bg-slate-500 rounded-md text-sm transition-colors">
                              Add Collateral
                            </button>
                            <button
                              className="flex-1 py-2 bg-yellow-500/20 text-yellow-400 hover:bg-yellow-500/30 rounded-md text-sm transition-colors"
                              onClick={() => {
                                setSelectedPosition(position);
                                setShowCashOutModal(true);
                              }}
                            >
                              Cash Out
                            </button>
                            <button className="flex-1 py-2 bg-green-500/20 text-green-400 hover:bg-green-500/30 rounded-md text-sm transition-colors">
                              Close Position
                            </button>
                          </div>

                          {/* BTC Profit Display */}
                          <div className="mt-3 pt-3 border-t border-slate-600/50">
                            <div className="flex justify-between text-xs">
                              <span className="text-slate-400">Profit in suiBTC:</span>
                              <span className="text-green-400">{position.btcProfit.toFixed(8)} suiBTC (${(position.btcProfit * position.currentPrice).toFixed(2)})</span>
                            </div>
                          </div>
                        </div>
                      ))}
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
                Liquidation occurs when your position's health factor falls below the minimum threshold (typically 110%).
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
                  <li>Set up AI alerts to notify you of risky levels</li>
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
                    <span>{selectedPosition.asset}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Current Collateral:</span>
                    <span>{selectedPosition.collateral} {selectedPosition.collateralType}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Profit in {selectedPosition.asset}:</span>
                    <span className="text-green-400">{selectedPosition.btcProfit.toFixed(8)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">USD Value:</span>
                    <span>${(selectedPosition.collateral + selectedPosition.pnl).toFixed(2)}</span>
                  </div>
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
                        {(selectedPosition.collateral * parseFloat(cashOutAmount) / 100).toFixed(2)} {selectedPosition.collateralType}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Profit in {selectedPosition.asset}:</span>
                      <span className="text-green-400">
                        {(selectedPosition.btcProfit * parseFloat(cashOutAmount) / 100).toFixed(8)} {selectedPosition.asset}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              <div className="pt-4 flex gap-3">
                <button
                  onClick={() => setShowCashOutModal(false)}
                  className="w-1/2 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCashOut}
                  className="w-1/2 py-2 bg-yellow-500 hover:bg-yellow-600 text-white font-medium rounded-lg transition-colors"
                  disabled={!cashOutAmount || parseFloat(cashOutAmount) <= 0 || parseFloat(cashOutAmount) > 100}
                >
                  Confirm Cash Out
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default TradeContainer