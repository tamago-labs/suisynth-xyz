"use client"

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
import WalletPanel from "@/components/Wallet"

const MarketsContainer = () => {
  // State for selected collateral type
  const [collateralType, setCollateralType] = useState('USDC');
  const [mintAmount, setMintAmount] = useState('');
  const [supplyAmount, setSupplyAmount] = useState('');
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [showCollateralSelector, setShowCollateralSelector] = useState(false);
  const [activeTab, setActiveTab] = useState('mint');
  const [showPositions, setShowPositions] = useState(true);
  
  // Modal states
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [showAddCollateralModal, setShowAddCollateralModal] = useState(false);
  const [additionalCollateral, setAdditionalCollateral] = useState('');
  const [selectedPosition, setSelectedPosition] = useState(null);
  const [showBurnModal, setShowBurnModal] = useState(false);
  const [burnAmount, setBurnAmount] = useState('');
  
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
  
  const walletBalances = {
    SUI: 10.5,
    USDC: 5000,
    suiBTC: 0.12
  };
  
  // Mock positions
  const mintPositions = [
    {
      id: 'mint-1',
      asset: 'suiBTC',
      collateralType: 'USDC',
      collateral: 2000,
      minted: 0.03,
      collateralRatio: 157,
      entryPrice: 40000,
      currentPrice: 42567.89
    },
    {
      id: 'mint-2',
      asset: 'suiBTC',
      collateralType: 'SUI',
      collateral: 30,
      minted: 0.004,
      collateralRatio: 165,
      entryPrice: 41200,
      currentPrice: 42567.89
    }
  ];
  
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
  
  const collateralTypes = [
    { id: 'USDC', icon: <DollarSign size={16} />, color: 'bg-blue-500' },
    { id: 'SUI', icon: <Wallet size={16} />, color: 'bg-cyan-500' }
  ];
  
  // Helper to calculate max amount user can mint based on collateral
  const calculateMaxMint = (collateralAmount) => {
    // This would be replaced with actual calculation from your contract
    const collateralValue = collateralType === 'USDC' 
      ? collateralAmount 
      : collateralAmount * 5.75; // Mock SUI price
    
    return collateralValue / (marketData.suiBTC.minCollateralRatio / 100) / marketData.suiBTC.price;
  };
  
  // Calculate how much user can mint with current balance
  const maxMintAmount = calculateMaxMint(
    collateralType === 'USDC' ? walletBalances.USDC : walletBalances.SUI
  ).toFixed(8);
  
  // Calculate required collateral for entered amount
  const calculateRequiredCollateral = () => {
    if (!mintAmount) return 0;
    
    const usdValue = parseFloat(mintAmount) * marketData.suiBTC.price;
    const requiredUsdCollateral = usdValue * (marketData.suiBTC.minCollateralRatio / 100);
    
    return collateralType === 'USDC' 
      ? requiredUsdCollateral 
      : requiredUsdCollateral / 5.75; // Convert to SUI
  };
  
  const requiredCollateral = calculateRequiredCollateral();
  
  // Calculate current health ratio
  const calculateHealthRatio = () => {
    if (!mintAmount || mintAmount <= 0) return 0;
    return (marketData.suiBTC.minCollateralRatio / 100) * 100;
  };
  
  const healthRatio = calculateHealthRatio();
  
  // Handle position actions
  const handleAddCollateral = (position) => {
    setSelectedPosition(position);
    setShowAddCollateralModal(true);
  };
  
  const handleWithdraw = (position) => {
    setSelectedPosition(position);
    setShowWithdrawModal(true);
  };
  
  const handleBurn = (position) => {
    setSelectedPosition(position);
    setShowBurnModal(true);
  };
  
  const executeAddCollateral = () => {
    // This would call your contract
    console.log(`Adding ${additionalCollateral} ${selectedPosition.collateralType} to position ${selectedPosition.id}`);
    setShowAddCollateralModal(false);
    setAdditionalCollateral('');
  };
  
  const executeWithdraw = () => {
    // This would call your contract
    console.log(`Withdrawing ${withdrawAmount} ${selectedPosition.asset} from supply position`);
    setShowWithdrawModal(false);
    setWithdrawAmount('');
  };
  
  const executeBurn = () => {
    // This would call your contract
    console.log(`Burning ${burnAmount} ${selectedPosition.asset} from mint position ${selectedPosition.id}`);
    setShowBurnModal(false);
    setBurnAmount('');
  };
  
  return (
    <div className="min-h-screen text-white">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8">Markets</h1>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Asset Info */}
          <div className="lg:col-span-1 space-y-6">
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
                  <div className="text-xs text-slate-400 mb-1">Total Supplied</div>
                  <div className="font-semibold">{marketData.suiBTC.totalSupplied} suiBTC</div>
                </div>
                
                <div className="bg-slate-700/50 rounded-lg p-3">
                  <div className="text-xs text-slate-400 mb-1">Supply APY</div>
                  <div className="font-semibold text-green-400">{marketData.suiBTC.supplyAPY}%</div>
                </div>
                
                <div className="bg-slate-700/50 rounded-lg p-3">
                  <div className="text-xs text-slate-400 mb-1">Utilization</div>
                  <div className="font-semibold">{marketData.suiBTC.utilizationRate}%</div>
                </div>
                
                <div className="bg-slate-700/50 rounded-lg p-3">
                  <div className="text-xs text-slate-400 mb-1">Min C-Ratio</div>
                  <div className="font-semibold">{marketData.suiBTC.minCollateralRatio}%</div>
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
              
              <div className="mt-6">
                <h4 className="text-sm font-medium mb-3">Oracle Price Feed</h4>
                <div className="flex items-center gap-2 bg-slate-700/50 rounded-lg px-3 py-2">
                  <img 
                    src="/api/placeholder/20/20" 
                    alt="Pyth Network" 
                    className="w-5 h-5 rounded-full" 
                  />
                  <span className="text-sm">Pyth Network</span>
                  <span className="ml-auto text-xs text-slate-400">Last updated: 2 min ago</span>
                </div>
              </div>
            </motion.div>
            
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
                  <Layers size={16} />
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
                          Mint synthetic BTC by providing collateral. Your position must maintain a minimum collateralization ratio of {marketData.suiBTC.minCollateralRatio}% to avoid liquidation.
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
                        <span className="text-slate-500">Balance: {collateralType === 'USDC' ? walletBalances.USDC.toLocaleString() : walletBalances.SUI.toLocaleString()}</span>
                        <button className="text-blue-400 hover:text-blue-300">
                          Max
                        </button>
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
                          onChange={(e) => setMintAmount(e.target.value)}
                        />
                        <button 
                          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-blue-400 hover:text-blue-300"
                          onClick={() => setMintAmount(maxMintAmount)}
                        >
                          MAX
                        </button>
                      </div>
                      <div className="flex justify-between text-xs mt-1">
                        <span className="text-slate-500">
                          Value: ${mintAmount ? (parseFloat(mintAmount) * marketData.suiBTC.price).toLocaleString() : '0.00'}
                        </span>
                        <span className="text-slate-500">
                          Max: {maxMintAmount} suiBTC
                        </span>
                      </div>
                    </div>
                    
                    {/* Collateral details */}
                    {mintAmount && parseFloat(mintAmount) > 0 && (
                      <div className="bg-slate-700/50 rounded-lg p-4 space-y-3">
                        <div className="flex justify-between text-sm">
                          <span className="text-slate-400">Required Collateral</span>
                          <span>{requiredCollateral.toFixed(collateralType === 'USDC' ? 2 : 6)} {collateralType}</span>
                        </div>
                        
                        <div className="flex justify-between text-sm">
                          <span className="text-slate-400">Collateral Ratio</span>
                          <span>{marketData.suiBTC.minCollateralRatio}%</span>
                        </div>
                        
                        <div className="flex justify-between text-sm">
                          <span className="text-slate-400">Health Factor</span>
                          <span className="text-green-400">
                            {healthRatio.toFixed(2)}%
                          </span>
                        </div>
                        
                        <div className="space-y-1">
                          <div className="flex justify-between text-xs">
                            <span>Liquidation at</span>
                            <span>{(marketData.suiBTC.minCollateralRatio * 0.8).toFixed(0)}%</span>
                          </div>
                          <div className="w-full h-2 bg-slate-600 rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-gradient-to-r from-red-500 via-yellow-500 to-green-500"
                              style={{ width: '100%' }}
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
                      className="w-full py-3 bg-gradient-to-r from-blue-500 to-purple-500 text-white font-medium rounded-lg flex items-center justify-center gap-2 hover:shadow-lg hover:shadow-blue-500/20 transition-all"
                    >
                      Mint suiBTC
                      <ArrowRight size={18} />
                    </button>
                    
                    <div className="text-center text-xs text-slate-400">
                      <div className="flex items-center justify-center gap-1">
                        <Shield size={12} />
                        <span>Mint positions are monitored by AI for liquidation risk</span>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
            
            {/* Supply Panel */}
            {activeTab === 'supply' && (
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
                          Supply your synthetic BTC to the lending pool to earn {marketData.suiBTC.supplyAPY}% APY from borrowers who use leverage. You can withdraw your supplied assets anytime, subject to pool liquidity.
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
                        <button 
                          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-purple-400 hover:text-purple-300"
                          onClick={() => setSupplyAmount(walletBalances.suiBTC.toString())}
                        >
                          MAX
                        </button>
                      </div>
                      <div className="flex justify-between text-xs mt-1">
                        <span className="text-slate-500">
                          Value: ${supplyAmount ? (parseFloat(supplyAmount) * marketData.suiBTC.price).toLocaleString() : '0.00'}
                        </span>
                        <span className="text-slate-500">
                          Balance: {walletBalances.suiBTC.toLocaleString()} suiBTC
                        </span>
                      </div>
                    </div>
                    
                    {/* Supply details */}
                    {supplyAmount && parseFloat(supplyAmount) > 0 && (
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
                    )}
                    
                    {/* Action button */}
                    <button 
                      className="w-full py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-medium rounded-lg flex items-center justify-center gap-2 hover:shadow-lg hover:shadow-purple-500/20 transition-all"
                      disabled={!supplyAmount || parseFloat(supplyAmount) <= 0 || parseFloat(supplyAmount) > walletBalances.suiBTC}
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
                    <div>
                      <h4 className="text-sm font-medium text-slate-400 mb-3">Minted Positions</h4>
                      
                      {mintPositions.length > 0 ? (
                        <div className="space-y-3">
                          {mintPositions.map(position => (
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
                                    <div className="text-xs text-slate-400">Minted</div>
                                  </div>
                                </div>
                                <div className="bg-blue-500/20 text-blue-400 rounded-lg px-2 py-1 text-xs font-medium">
                                  C-Ratio: {position.collateralRatio}%
                                </div>
                              </div>
                              
                              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                                <div>
                                  <div className="text-slate-400 text-xs">Collateral</div>
                                  <div>{position.collateral} {position.collateralType}</div>
                                </div>
                                <div>
                                  <div className="text-slate-400 text-xs">Minted</div>
                                  <div>{position.minted} {position.asset}</div>
                                </div>
                                <div>
                                  <div className="text-slate-400 text-xs">Entry Price</div>
                                  <div>${position.entryPrice.toLocaleString()}</div>
                                </div>
                                <div>
                                  <div className="text-slate-400 text-xs">Current Price</div>
                                  <div>${position.currentPrice.toLocaleString()}</div>
                                </div>
                              </div>
                              
                              <div className="mt-4 pt-4 border-t border-slate-600/50">
                                <div className="flex gap-2">
                                  <button 
                                    className="flex-1 py-2 text-xs bg-slate-600 hover:bg-slate-500 rounded-md transition-colors"
                                    onClick={() => handleAddCollateral(position)}
                                  >
                                    Add Collateral
                                  </button>
                                  <button 
                                    className="flex-1 py-2 text-xs bg-red-500/20 text-red-400 hover:bg-red-500/30 rounded-md transition-colors"
                                    onClick={() => handleBurn(position)}
                                  >
                                    Burn & Reclaim
                                  </button>
                                </div>
                              </div>
                            </div>
                          ))}
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
                    </div>
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
                    <span>{selectedPosition.asset}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Current Collateral:</span>
                    <span>{selectedPosition.collateral} {selectedPosition.collateralType}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Current Ratio:</span>
                    <span className={selectedPosition.collateralRatio >= 150 ? "text-green-400" : "text-yellow-400"}>
                      {selectedPosition.collateralRatio}%
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
                  <button 
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-blue-400 hover:text-blue-300"
                    onClick={() => {
                      // Set to wallet balance of appropriate type
                      const balance = selectedPosition.collateralType === 'USDC' ? 
                        walletBalances.USDC : walletBalances.SUI;
                      setAdditionalCollateral(balance.toString());
                    }}
                  >
                    MAX
                  </button>
                </div>
                <div className="text-xs mt-1 text-slate-500">
                  Balance: {selectedPosition.collateralType === 'USDC' ? 
                    walletBalances.USDC.toLocaleString() : 
                    walletBalances.SUI.toLocaleString()} {selectedPosition.collateralType}
                </div>
              </div>
              
              {additionalCollateral && parseFloat(additionalCollateral) > 0 && (
                <div className="bg-blue-500/10 rounded-lg p-3 border border-blue-500/20">
                  <h4 className="font-medium text-blue-400 mb-2">New Position Details</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-slate-400">New Collateral:</span>
                      <span>
                        {(selectedPosition.collateral + parseFloat(additionalCollateral)).toFixed(
                          selectedPosition.collateralType === 'USDC' ? 2 : 4
                        )} {selectedPosition.collateralType}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">New Collateral Ratio:</span>
                      <span className="text-green-400">
                        {/* Simplified calculation - would be more accurate in real implementation */}
                        {Math.floor(selectedPosition.collateralRatio * (1 + parseFloat(additionalCollateral) / selectedPosition.collateral))}%
                      </span>
                    </div>
                  </div>
                </div>
              )}
              
              <div className="pt-4 flex gap-3">
                <button 
                  onClick={() => setShowAddCollateralModal(false)}
                  className="w-1/2 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button 
                  onClick={executeAddCollateral}
                  className="w-1/2 py-2 bg-blue-500 hover:bg-blue-600 text-white font-medium rounded-lg transition-colors"
                  disabled={!additionalCollateral || parseFloat(additionalCollateral) <= 0}
                >
                  Add Collateral
                </button>
              </div>
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
                  <div className="flex justify-between">
                    <span className="text-slate-400">Asset:</span>
                    <span>{selectedPosition.asset}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Minted Amount:</span>
                    <span>{selectedPosition.minted} {selectedPosition.asset}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Collateral:</span>
                    <span>{selectedPosition.collateral} {selectedPosition.collateralType}</span>
                  </div>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-2">
                  Burn Amount ({selectedPosition.asset})
                </label>
                <div className="relative">
                  <input
                    type="number"
                    className="w-full bg-slate-700 rounded-lg p-3 text-white focus:outline-none focus:ring-2 focus:ring-red-500"
                    placeholder="0.00000000"
                    value={burnAmount}
                    onChange={(e) => setBurnAmount(e.target.value)}
                  />
                  <button 
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-red-400 hover:text-red-300"
                    onClick={() => setBurnAmount(selectedPosition.minted.toString())}
                  >
                    MAX
                  </button>
                </div>
                
                <div className="flex justify-between mt-1 text-xs text-slate-500">
                  <button onClick={() => setBurnAmount((selectedPosition.minted * 0.25).toFixed(8))}>25%</button>
                  <button onClick={() => setBurnAmount((selectedPosition.minted * 0.5).toFixed(8))}>50%</button>
                  <button onClick={() => setBurnAmount((selectedPosition.minted * 0.75).toFixed(8))}>75%</button>
                  <button onClick={() => setBurnAmount(selectedPosition.minted.toString())}>100%</button>
                </div>
              </div>
              
              {burnAmount && parseFloat(burnAmount) > 0 && (
                <div className="bg-red-500/10 rounded-lg p-3 border border-red-500/20">
                  <h4 className="font-medium text-red-400 mb-2">After Burning</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Remaining Minted:</span>
                      <span>
                        {Math.max(0, selectedPosition.minted - parseFloat(burnAmount)).toFixed(8)} {selectedPosition.asset}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Collateral to Reclaim:</span>
                      <span>
                        {(selectedPosition.collateral * parseFloat(burnAmount) / selectedPosition.minted).toFixed(
                          selectedPosition.collateralType === 'USDC' ? 2 : 4
                        )} {selectedPosition.collateralType}
                      </span>
                    </div>
                  </div>
                </div>
              )}
              
              <div className="pt-4 flex gap-3">
                <button 
                  onClick={() => setShowBurnModal(false)}
                  className="w-1/2 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button 
                  onClick={executeBurn}
                  className="w-1/2 py-2 bg-red-500 hover:bg-red-600 text-white font-medium rounded-lg transition-colors"
                  disabled={!burnAmount || parseFloat(burnAmount) <= 0 || parseFloat(burnAmount) > selectedPosition.minted}
                >
                  Burn & Reclaim
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default MarketsContainer