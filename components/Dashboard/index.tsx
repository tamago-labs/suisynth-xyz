"use client"


import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Bitcoin, 
  DollarSign, 
  TrendingUp, 
  TrendingDown,
  Wallet, 
  BarChart2, 
  PieChart,
  CircleDollarSign,
  ChevronDown, 
  ChevronUp, 
  Clock,
  Zap,
  AlertTriangle,
  Bell,
  Settings,
  Eye,
  EyeOff,
  Shield,
  History,
  ArrowRight,
  Info,
  CheckCircle,
  XCircle
} from 'lucide-react';

const DashboardContainer = () => {
  // States
  const [showAssets, setShowAssets] = useState(true);
  const [showAIAlerts, setShowAIAlerts] = useState(true);
  const [showPositions, setShowPositions] = useState(true);
  const [selectedTimeframe, setSelectedTimeframe] = useState('7d');
  const [showBalances, setShowBalances] = useState(true);
  const [showAlertModal, setShowAlertModal] = useState(false);
  const [selectedAlert, setSelectedAlert] = useState(null);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  
  // Mock data
  const userData = {
    totalValue: 12583.47,
    pnl24h: 342.18,
    pnlPct24h: 2.8,
    positionHealth: 'Healthy', // 'Healthy', 'Warning', 'Danger'
    portfolioAllocation: [
      { type: 'Collateral (USDC)', value: 5000, percentage: 39.7, color: 'bg-blue-500' },
      { type: 'Collateral (SUI)', value: 172.5, percentage: 13.7, color: 'bg-cyan-500' },
      { type: 'Supplied Assets', value: 851.36, percentage: 6.8, color: 'bg-purple-500' },
      { type: 'Borrowed Assets', value: 4225, percentage: 33.6, color: 'bg-green-500' },
      { type: 'Wallet', value: 777.75, percentage: 6.2, color: 'bg-amber-500' },
    ],
    walletBalances: {
      SUI: 10.5,
      USDC: 500,
      suiBTC: 0.005
    },
    assets: {
      suiBTC: 42567.89,
      change24h: 2.4
    }
  };
  
  // Mock positions data - combining all position types
  const allPositions = [
    {
      id: 'mint-1',
      type: 'Minted',
      asset: 'suiBTC',
      collateralType: 'USDC',
      collateral: 2000,
      minted: 0.03,
      collateralRatio: 157,
      entryPrice: 40000,
      currentPrice: 42567.89,
      liquidationPrice: 31850,
      health: 'Healthy', // 'Healthy', 'Warning', 'Danger'
      pnl: null // Mint positions don't have PnL
    },
    {
      id: 'mint-2',
      type: 'Minted',
      asset: 'suiBTC',
      collateralType: 'SUI',
      collateral: 30,
      minted: 0.004,
      collateralRatio: 165,
      entryPrice: 41200,
      currentPrice: 42567.89,
      liquidationPrice: 30909,
      health: 'Healthy',
      pnl: null
    },
    {
      id: 'supply-1',
      type: 'Supplied',
      asset: 'suiBTC',
      amount: 0.02,
      valueUSD: 851.36,
      apy: 5.8,
      suppliedAt: '2025-04-28',
      earned: 0.00012,
      earnedUSD: 5.11,
      health: 'Healthy',
      pnl: null
    },
    {
      id: 'borrow-1',
      type: 'Borrowed',
      asset: 'suiBTC',
      leverage: 3,
      collateralType: 'USDC',
      collateral: 1000,
      borrowed: 0.05,
      entryPrice: 40250.75,
      currentPrice: 42567.89,
      liquidationPrice: 36789.45,
      pnl: 57.12,
      pnlPercent: 11.42,
      health: 'Healthy'
    }
  ];
  
  // Mock AI alerts
  const aiAlerts = [
    {
      id: 'alert-1',
      type: 'warning',
      title: 'Position Approaching Liquidation',
      message: 'Your leveraged suiBTC position is approaching liquidation threshold as BTC price has dropped 5% in the last 6 hours.',
      positionId: 'borrow-1',
      timestamp: '2 hours ago',
      status: 'unread',
      recommendation: 'Consider adding more collateral to your position to increase the health factor and avoid potential liquidation.',
      suggestedAction: 'Add Collateral',
      marketMovement: '-5% in 6h',
      riskLevel: 'Medium'
    },
    {
      id: 'alert-2',
      type: 'info',
      title: 'Opportunity: Increasing APY',
      message: 'The supply APY for suiBTC has increased to 6.2% from 5.8% due to higher demand.',
      timestamp: '1 day ago',
      status: 'read',
      recommendation: 'Consider supplying more suiBTC to take advantage of the higher yield.',
      suggestedAction: 'Supply More',
      riskLevel: 'Low'
    },
    {
      id: 'alert-3',
      type: 'success',
      title: 'Profit Taking Opportunity',
      message: 'Your leveraged suiBTC position has gained 11.42% in value. Consider taking some profits.',
      positionId: 'borrow-1',
      timestamp: '4 hours ago',
      status: 'read',
      recommendation: 'Market momentum shows possible resistance at $43,000. Consider cashing out a portion of your position to secure profits.',
      suggestedAction: 'Cash Out Portion',
      riskLevel: 'Low'
    }
  ];
  
  // Mock portfolio history
  const portfolioHistory = {
    '24h': [12200, 12250, 12400, 12300, 12500, 12350, 12450, 12583.47],
    '7d': [11800, 12000, 11950, 12200, 12300, 12150, 12400, 12583.47],
    '30d': [10500, 11000, 10800, 11200, 11500, 11300, 12000, 12583.47],
    '90d': [9000, 9500, 10000, 10500, 11000, 11500, 12000, 12583.47]
  };
  
  // Handle opening the alert modal
  const handleAlertClick = (alert) => {
    setSelectedAlert(alert);
    setShowAlertModal(true);
    
    // Mark alert as read
    aiAlerts.forEach(a => {
      if (a.id === alert.id) {
        a.status = 'read';
      }
    });
  };
  
  // Calculate portfolio performance
  const calculatePerformance = (period) => {
    const history = portfolioHistory[period];
    if (!history || history.length < 2) return { value: 0, percentage: 0, isPositive: true };
    
    const startValue = history[0];
    const endValue = history[history.length - 1];
    const change = endValue - startValue;
    const percentage = (change / startValue) * 100;
    
    return {
      value: change.toFixed(2),
      percentage: percentage.toFixed(2),
      isPositive: change >= 0
    };
  };
  
  const selectedPerformance = calculatePerformance(selectedTimeframe);
  
  // Calculate unread alerts count
  const unreadAlertsCount = aiAlerts.filter(alert => alert.status === 'unread').length;
  
  return (
    <div className="min-h-screen bg-slate-900 text-white">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <div className="flex items-center gap-4">
            <button 
              className="relative bg-slate-800 p-2 rounded-lg hover:bg-slate-700 transition-colors"
              onClick={() => setShowSettingsModal(true)}
            >
              <Settings size={20} />
            </button>
            
            <button 
              className="relative bg-slate-800 p-2 rounded-lg hover:bg-slate-700 transition-colors"
            >
              <Bell size={20} />
              {unreadAlertsCount > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full text-xs flex items-center justify-center">
                  {unreadAlertsCount}
                </span>
              )}
            </button>
          </div>
        </div>
        
        {/* Top Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Total Value */}
          <motion.div 
            className="bg-slate-800/50 backdrop-blur-sm rounded-xl border border-slate-700/50 p-5"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-slate-400 text-sm">Total Value</h3>
                <div className="flex items-end gap-2 mt-1">
                  <div className="text-2xl font-bold">
                    ${showBalances ? userData.totalValue.toLocaleString() : '•••••'}
                  </div>
                  <button 
                    className="text-slate-500 p-1 hover:text-slate-300"
                    onClick={() => setShowBalances(!showBalances)}
                  >
                    {showBalances ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>
              <div className="p-2 rounded-lg bg-slate-700/50">
                <CircleDollarSign size={20} className="text-blue-400" />
              </div>
            </div>
            <div className="flex items-center gap-1 mt-2 text-sm">
              <div className={userData.pnl24h >= 0 ? 'text-green-400' : 'text-red-400'}>
                {userData.pnl24h >= 0 ? '+' : ''}{userData.pnl24h.toLocaleString()}
              </div>
              <div className={`text-xs ${userData.pnlPct24h >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                ({userData.pnlPct24h >= 0 ? '+' : ''}{userData.pnlPct24h}%)
              </div>
              <div className="text-slate-500 text-xs ml-1">24h</div>
            </div>
          </motion.div>
          
          {/* Portfolio Performance */}
          <motion.div 
            className="bg-slate-800/50 backdrop-blur-sm rounded-xl border border-slate-700/50 p-5"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.1 }}
          >
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-slate-400 text-sm">Portfolio Performance</h3>
                <div className="flex items-end gap-2 mt-1">
                  <div className={`text-2xl font-bold ${selectedPerformance.isPositive ? 'text-green-400' : 'text-red-400'}`}>
                    {selectedPerformance.isPositive ? '+' : ''}${showBalances ? selectedPerformance.value : '•••••'}
                  </div>
                </div>
              </div>
              <div className="p-2 rounded-lg bg-slate-700/50">
                <BarChart2 size={20} className="text-green-400" />
              </div>
            </div>
            <div className="flex items-center gap-1 mt-2">
              <div className={`text-sm ${selectedPerformance.isPositive ? 'text-green-400' : 'text-red-400'}`}>
                {selectedPerformance.isPositive ? '+' : ''}{selectedPerformance.percentage}%
              </div>
              <div className="flex gap-2 ml-auto text-xs">
                <button 
                  className={`px-2 py-1 rounded-md ${selectedTimeframe === '24h' ? 'bg-blue-500/20 text-blue-400' : 'text-slate-400 hover:text-slate-200'}`}
                  onClick={() => setSelectedTimeframe('24h')}
                >
                  24h
                </button>
                <button 
                  className={`px-2 py-1 rounded-md ${selectedTimeframe === '7d' ? 'bg-blue-500/20 text-blue-400' : 'text-slate-400 hover:text-slate-200'}`}
                  onClick={() => setSelectedTimeframe('7d')}
                >
                  7d
                </button>
                <button 
                  className={`px-2 py-1 rounded-md ${selectedTimeframe === '30d' ? 'bg-blue-500/20 text-blue-400' : 'text-slate-400 hover:text-slate-200'}`}
                  onClick={() => setSelectedTimeframe('30d')}
                >
                  30d
                </button>
              </div>
            </div>
          </motion.div>
          
          {/* Position Health */}
          <motion.div 
            className="bg-slate-800/50 backdrop-blur-sm rounded-xl border border-slate-700/50 p-5"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.2 }}
          >
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-slate-400 text-sm">Position Health</h3>
                <div className="flex items-end gap-2 mt-1">
                  <div className={`text-2xl font-bold ${
                    userData.positionHealth === 'Healthy' ? 'text-green-400' : 
                    userData.positionHealth === 'Warning' ? 'text-yellow-400' : 'text-red-400'
                  }`}>
                    {userData.positionHealth}
                  </div>
                </div>
              </div>
              <div className="p-2 rounded-lg bg-slate-700/50">
                <Shield size={20} className="text-green-400" />
              </div>
            </div>
            <div className="mt-2">
              <div className="w-full h-2 bg-slate-700 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-red-500 via-yellow-500 to-green-500 rounded-full" style={{ width: '85%' }} />
              </div>
              <div className="flex justify-between text-xs mt-1 text-slate-500">
                <span>Risky</span>
                <span>Safe</span>
              </div>
            </div>
          </motion.div>
          
          {/* AI Monitoring */}
          <motion.div 
            className="bg-slate-800/50 backdrop-blur-sm rounded-xl border border-slate-700/50 p-5"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.3 }}
          >
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-slate-400 text-sm">AI Monitoring</h3>
                <div className="flex items-end gap-2 mt-1">
                  <div className="text-2xl font-bold">
                    Active
                  </div>
                </div>
              </div>
              <div className="p-2 rounded-lg bg-slate-700/50">
                <Zap size={20} className="text-purple-400" />
              </div>
            </div>
            <div className="flex items-center gap-1 mt-2 text-sm">
              <div className="text-slate-400">{unreadAlertsCount} unread alerts</div>
              <button className="ml-auto text-xs text-blue-400 hover:text-blue-300">
                View All
              </button>
            </div>
          </motion.div>
        </div>
        
        {/* Main Content Sections */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Column 1 - Portfolio Chart & Assets */}
          <div className="lg:col-span-2 space-y-6">
            {/* Portfolio Chart */}
            <motion.div 
              className="bg-slate-800/50 backdrop-blur-sm rounded-xl border border-slate-700/50 p-6"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.4 }}
            >
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-semibold">Portfolio Value</h3>
                <div className="flex gap-2 text-xs">
                  <button 
                    className={`px-2 py-1 rounded-md ${selectedTimeframe === '24h' ? 'bg-blue-500/20 text-blue-400' : 'bg-slate-700 text-slate-400'}`}
                    onClick={() => setSelectedTimeframe('24h')}
                  >
                    24h
                  </button>
                  <button 
                    className={`px-2 py-1 rounded-md ${selectedTimeframe === '7d' ? 'bg-blue-500/20 text-blue-400' : 'bg-slate-700 text-slate-400'}`}
                    onClick={() => setSelectedTimeframe('7d')}
                  >
                    7d
                  </button>
                  <button 
                    className={`px-2 py-1 rounded-md ${selectedTimeframe === '30d' ? 'bg-blue-500/20 text-blue-400' : 'bg-slate-700 text-slate-400'}`}
                    onClick={() => setSelectedTimeframe('30d')}
                  >
                    30d
                  </button>
                  <button 
                    className={`px-2 py-1 rounded-md ${selectedTimeframe === '90d' ? 'bg-blue-500/20 text-blue-400' : 'bg-slate-700 text-slate-400'}`}
                    onClick={() => setSelectedTimeframe('90d')}
                  >
                    90d
                  </button>
                </div>
              </div>
              
              {/* Simple chart visualization */}
              <div className="h-64 w-full bg-slate-800/50 rounded-lg overflow-hidden">
                <svg viewBox="0 0 100 40" preserveAspectRatio="none" className="w-full h-full">
                  {/* Visualization depends on the selected timeframe */}
                  {selectedTimeframe === '24h' && (
                    <>
                      <path 
                        d="M0,20 L10,19 L20,18 L30,19 L40,18 L50,17 L60,16 L70,15 L80,14 L90,13 L100,12"
                        stroke="rgba(56, 189, 248, 0.8)"
                        strokeWidth="1.5"
                        fill="none"
                      />
                      <path 
                        d="M0,20 L10,19 L20,18 L30,19 L40,18 L50,17 L60,16 L70,15 L80,14 L90,13 L100,12 L100,40 L0,40 Z"
                        fill="rgba(56, 189, 248, 0.1)"
                      />
                    </>
                  )}
                  
                  {selectedTimeframe === '7d' && (
                    <>
                      <path 
                        d="M0,25 L15,23 L30,24 L45,21 L60,20 L75,22 L100,17"
                        stroke="rgba(56, 189, 248, 0.8)"
                        strokeWidth="1.5"
                        fill="none"
                      />
                      <path 
                        d="M0,25 L15,23 L30,24 L45,21 L60,20 L75,22 L100,17 L100,40 L0,40 Z"
                        fill="rgba(56, 189, 248, 0.1)"
                      />
                    </>
                  )}
                  
                  {selectedTimeframe === '30d' && (
                    <>
                      <path 
                        d="M0,30 L20,25 L40,27 L60,22 L80,18 L100,15"
                        stroke="rgba(56, 189, 248, 0.8)"
                        strokeWidth="1.5"
                        fill="none"
                      />
                      <path 
                        d="M0,30 L20,25 L40,27 L60,22 L80,18 L100,15 L100,40 L0,40 Z"
                        fill="rgba(56, 189, 248, 0.1)"
                      />
                    </>
                  )}
                  
                  {selectedTimeframe === '90d' && (
                    <>
                      <path 
                        d="M0,35 L20,32 L40,28 L60,24 L80,20 L100,15"
                        stroke="rgba(56, 189, 248, 0.8)"
                        strokeWidth="1.5"
                        fill="none"
                      />
                      <path 
                        d="M0,35 L20,32 L40,28 L60,24 L80,20 L100,15 L100,40 L0,40 Z"
                        fill="rgba(56, 189, 248, 0.1)"
                      />
                    </>
                  )}
                </svg>
              </div>
              
              <div className="flex justify-between mt-4 text-sm">
                <div>
                  <div className="text-slate-400">Start</div>
                  <div className="font-medium">${showBalances ? 
                    portfolioHistory[selectedTimeframe][0].toLocaleString() : '•••••'}</div>
                </div>
                <div className="text-center">
                  <div className="text-slate-400">Change</div>
                  <div className={`font-medium ${selectedPerformance.isPositive ? 'text-green-400' : 'text-red-400'}`}>
                    {selectedPerformance.isPositive ? '+' : ''}${showBalances ? selectedPerformance.value : '•••••'} ({selectedPerformance.percentage}%)
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-slate-400">Current</div>
                  <div className="font-medium">${showBalances ? 
                    portfolioHistory[selectedTimeframe][portfolioHistory[selectedTimeframe].length - 1].toLocaleString() : '•••••'}</div>
                </div>
              </div>
            </motion.div>
            
            {/* Your Assets */}
            <motion.div 
              className="bg-slate-800/50 backdrop-blur-sm rounded-xl border border-slate-700/50 p-6"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.5 }}
            >
              <div 
                className="flex justify-between items-center mb-4 cursor-pointer"
                onClick={() => setShowAssets(!showAssets)}
              >
                <h3 className="font-semibold">Your Assets</h3>
                <button className="text-slate-400">
                  {showAssets ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                </button>
              </div>
              
              {showAssets && (
                <div className="space-y-4">
                  {/* Portfolio Allocation */}
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <h4 className="text-slate-400">Portfolio Allocation</h4>
                      <div className="text-slate-400">${showBalances ? userData.totalValue.toLocaleString() : '•••••'}</div>
                    </div>
                    
                    <div className="space-y-2">
                      {userData.portfolioAllocation.map((item, i) => (
                        <div key={i} className="flex items-center gap-3">
                          <div className="w-full h-4 bg-slate-700 rounded-full overflow-hidden">
                            <div 
                              className={`h-full ${item.color}`}
                              style={{ width: `${item.percentage}%` }}
                            />
                          </div>
                          <div className="w-14 text-right text-sm">{item.percentage}%</div>
                        </div>
                      ))}
                    </div>
                    
                    <div className="grid grid-cols-2 gap-x-8 gap-y-2 mt-3 text-sm">
                      {userData.portfolioAllocation.map((item, i) => (
                        <div key={i} className="flex items-center gap-2">
                          <div className={`w-3 h-3 rounded-full ${item.color}`} />
                          <div className="text-slate-400">{item.type}</div>
                          <div className="ml-auto">${showBalances ? item.value.toLocaleString() : '•••••'}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  {/* Wallet Balances */}
                  <div className="pt-4 border-t border-slate-700">
                    <h4 className="text-slate-400 text-sm mb-3">Wallet Balances</h4>
                    
                    <div className="space-y-3">
                      <div className="flex justify-between items-center bg-slate-700/50 rounded-lg p-3">
                        <div className="flex items-center gap-2">
                          <div className="w-9 h-9 rounded-full bg-blue-500/20 flex items-center justify-center">
                            <DollarSign className="text-blue-500" size={18} />
                          </div>
                          <div>
                            <div className="font-medium">USDC</div>
                            <div className="text-slate-400 text-xs">Stablecoin</div>
                          </div>
                        </div>
                        <div className="flex flex-col items-end">
                          <div className="font-mono">{showBalances ? userData.walletBalances.USDC.toLocaleString() : '•••••'}</div>
                          <div className="text-slate-400 text-xs">${showBalances ? userData.walletBalances.USDC.toLocaleString() : '•••••'}</div>
                        </div>
                      </div>
                      
                      <div className="flex justify-between items-center bg-slate-700/50 rounded-lg p-3">
                        <div className="flex items-center gap-2">
                          <div className="w-9 h-9 rounded-full bg-cyan-500/20 flex items-center justify-center">
                            <Wallet className="text-cyan-500" size={18} />
                          </div>
                          <div>
                            <div className="font-medium">SUI</div>
                            <div className="text-slate-400 text-xs">Native Token</div>
                          </div>
                        </div>
                        <div className="flex flex-col items-end">
                          <div className="font-mono">{showBalances ? userData.walletBalances.SUI.toLocaleString() : '•••••'}</div>
                          <div className="text-slate-400 text-xs">${showBalances ? (userData.walletBalances.SUI * 5.75).toLocaleString() : '•••••'}</div>
                        </div>
                      </div>
                      
                      <div className="flex justify-between items-center bg-slate-700/50 rounded-lg p-3">
                        <div className="flex items-center gap-2">
                          <div className="w-9 h-9 rounded-full bg-orange-500/20 flex items-center justify-center">
                            <Bitcoin className="text-orange-500" size={18} />
                          </div>
                          <div>
                            <div className="font-medium">suiBTC</div>
                            <div className="text-slate-400 text-xs">Synthetic Asset</div>
                          </div>
                        </div>
                        <div className="flex flex-col items-end">
                          <div className="font-mono">{showBalances ? userData.walletBalances.suiBTC.toLocaleString() : '•••••'}</div>
                          <div className="text-slate-400 text-xs">${showBalances ? (userData.walletBalances.suiBTC * userData.assets.suiBTC).toLocaleString() : '•••••'}</div>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Market Data */}
                  <div className="pt-4 border-t border-slate-700">
                    <h4 className="text-slate-400 text-sm mb-3">Market Data</h4>
                    
                    <div className="space-y-3">
                      <div className="flex justify-between items-center bg-slate-700/50 rounded-lg p-3">
                        <div className="flex items-center gap-2">
                          <div className="w-9 h-9 rounded-full bg-orange-500/20 flex items-center justify-center">
                            <Bitcoin className="text-orange-500" size={18} />
                          </div>
                          <div>
                            <div className="font-medium">suiBTC</div>
                            <div className="text-slate-400 text-xs">Synthetic Bitcoin</div>
                          </div>
                        </div>
                        <div className="flex flex-col items-end">
                          <div className="font-mono">${userData.assets.suiBTC.toLocaleString()}</div>
                          <div className={`text-xs ${userData.assets.change24h >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                            {userData.assets.change24h >= 0 ? '+' : ''}{userData.assets.change24h}% (24h)
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
             
           
          </div>
          
          {/* Column 2 - Active Positions */}
          <div className="space-y-6">
            <motion.div 
              className="bg-slate-800/50 backdrop-blur-sm rounded-xl border border-slate-700/50 p-6"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.4 }}
            >
              <div 
                className="flex justify-between items-center mb-4 cursor-pointer"
                onClick={() => setShowPositions(!showPositions)}
              >
                <h3 className="font-semibold">Active Positions</h3>
                <div className="flex items-center gap-3">
                  <button className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1">
                    <History size={14} />
                    History
                  </button>
                  <button className="text-slate-400">
                    {showPositions ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                  </button>
                </div>
              </div>
              
              {showPositions && (
                <div className="space-y-6">
                  {allPositions.length > 0 ? (
                    <div>
                      {/* Group positions by type */}
                      
                      {/* Minted Positions */}
                      {allPositions.filter(p => p.type === 'Minted').length > 0 && (
                        <div className="mb-6">
                          <h4 className="text-sm font-medium text-slate-400 mb-3">Minted Positions</h4>
                          <div className="space-y-3">
                            {allPositions.filter(p => p.type === 'Minted').map((position) => (
                              <div 
                                key={position.id}
                                className="bg-slate-700/30 border border-slate-700/50 rounded-lg p-4"
                              >
                                <div className="flex justify-between items-center mb-3">
                                  <div className="flex items-center gap-2">
                                    <div className="w-8 h-8 rounded-full bg-orange-500/20 flex items-center justify-center">
                                      <Bitcoin className="text-orange-500" size={16} />
                                    </div>
                                    <div>
                                      <div className="font-medium">{position.asset}</div>
                                      <div className="text-xs text-slate-400">{position.type}</div>
                                    </div>
                                  </div>
                                  <div className={`px-2 py-1 rounded text-xs font-medium ${
                                    position.health === 'Healthy' ? 'bg-green-500/20 text-green-400' : 
                                    position.health === 'Warning' ? 'bg-yellow-500/20 text-yellow-400' : 
                                    'bg-red-500/20 text-red-400'
                                  }`}>
                                    {position.health}
                                  </div>
                                </div>
                                
                                <div className="grid grid-cols-2 gap-y-2 text-sm">
                                  <div>
                                    <div className="text-slate-400 text-xs">Collateral</div>
                                    <div>{position.collateral} {position.collateralType}</div>
                                  </div>
                                  <div>
                                    <div className="text-slate-400 text-xs">Minted</div>
                                    <div>{position.minted} {position.asset}</div>
                                  </div>
                                  <div>
                                    <div className="text-slate-400 text-xs">C-Ratio</div>
                                    <div className={position.collateralRatio >= 150 ? 'text-green-400' : 'text-yellow-400'}>
                                      {position.collateralRatio}%
                                    </div>
                                  </div>
                                  <div>
                                    <div className="text-slate-400 text-xs">Liquidation Price</div>
                                    <div className="text-red-400">${position.liquidationPrice.toLocaleString()}</div>
                                  </div>
                                </div>
                                
                                <div className="mt-3 pt-3 border-t border-slate-600/50">
                                  <button className="w-full py-2 text-xs bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 rounded-md transition-colors">
                                    Manage Position
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                      
                      {/* Supplied Positions */}
                      {allPositions.filter(p => p.type === 'Supplied').length > 0 && (
                        <div className="mb-6">
                          <h4 className="text-sm font-medium text-slate-400 mb-3">Supplied Positions</h4>
                          <div className="space-y-3">
                            {allPositions.filter(p => p.type === 'Supplied').map((position) => (
                              <div 
                                key={position.id}
                                className="bg-slate-700/30 border border-slate-700/50 rounded-lg p-4"
                              >
                                <div className="flex justify-between items-center mb-3">
                                  <div className="flex items-center gap-2">
                                    <div className="w-8 h-8 rounded-full bg-orange-500/20 flex items-center justify-center">
                                      <Bitcoin className="text-orange-500" size={16} />
                                    </div>
                                    <div>
                                      <div className="font-medium">{position.asset}</div>
                                      <div className="text-xs text-slate-400">{position.type}</div>
                                    </div>
                                  </div>
                                  <div className="bg-green-500/20 text-green-400 rounded px-2 py-1 text-xs font-medium">
                                    APY: {position.apy}%
                                  </div>
                                </div>
                                
                                <div className="grid grid-cols-2 gap-y-2 text-sm">
                                  <div>
                                    <div className="text-slate-400 text-xs">Amount</div>
                                    <div>{position.amount} {position.asset}</div>
                                  </div>
                                  <div>
                                    <div className="text-slate-400 text-xs">Value</div>
                                    <div>${position.valueUSD.toLocaleString()}</div>
                                  </div>
                                  <div>
                                    <div className="text-slate-400 text-xs">Earned</div>
                                    <div className="text-green-400">{position.earned} {position.asset}</div>
                                  </div>
                                  <div>
                                    <div className="text-slate-400 text-xs">USD Value</div>
                                    <div className="text-green-400">${position.earnedUSD.toLocaleString()}</div>
                                  </div>
                                </div>
                                
                                <div className="mt-3 pt-3 border-t border-slate-600/50">
                                  <button className="w-full py-2 text-xs bg-purple-500/20 text-purple-400 hover:bg-purple-500/30 rounded-md transition-colors">
                                    Manage Supply
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                      
                      {/* Borrowed Positions */}
                      {allPositions.filter(p => p.type === 'Borrowed').length > 0 && (
                        <div>
                          <h4 className="text-sm font-medium text-slate-400 mb-3">Leveraged Positions</h4>
                          <div className="space-y-3">
                            {allPositions.filter(p => p.type === 'Borrowed').map((position) => (
                              <div 
                                key={position.id}
                                className="bg-slate-700/30 border border-slate-700/50 rounded-lg p-4"
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
                                  <div className={`px-2 py-1 rounded text-xs font-medium ${position.pnl >= 0 ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                                    {position.pnl >= 0 ? '+' : ''}{position.pnl} USDC ({position.pnlPercent}%)
                                  </div>
                                </div>
                                
                                <div className="grid grid-cols-2 gap-y-2 text-sm">
                                  <div>
                                    <div className="text-slate-400 text-xs">Collateral</div>
                                    <div>{position.collateral} {position.collateralType}</div>
                                  </div>
                                  <div>
                                    <div className="text-slate-400 text-xs">Borrowed</div>
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
                                    <div className={`${
                                      position.health === 'Healthy' ? 'text-green-400' : 
                                      position.health === 'Warning' ? 'text-yellow-400' : 
                                      'text-red-400'
                                    }`}>
                                      {position.health}
                                    </div>
                                  </div>
                                  <div>
                                    <div className="text-slate-400 text-xs">Liquidation</div>
                                    <div className="text-red-400">${position.liquidationPrice.toLocaleString()}</div>
                                  </div>
                                </div>
                                
                                <div className="mt-3 pt-3 border-t border-slate-600/50">
                                  <button className="w-full py-2 text-xs bg-green-500/20 text-green-400 hover:bg-green-500/30 rounded-md transition-colors">
                                    Manage Position
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-slate-400">
                      <XCircle size={32} className="mx-auto mb-2" />
                      <p>No active positions found</p>
                      <div className="flex gap-3 justify-center mt-4">
                        <button className="px-3 py-2 text-xs bg-blue-500/20 text-blue-400 rounded-md hover:bg-blue-500/30 transition-colors">
                          Mint Assets
                        </button>
                        <button className="px-3 py-2 text-xs bg-green-500/20 text-green-400 rounded-md hover:bg-green-500/30 transition-colors">
                          Trade with Leverage
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </motion.div>
          </div>
        </div>
      </div>
      
      {/* Alert Detail Modal */}
      {showAlertModal && selectedAlert && (
        <div className="fixed inset-0 bg-slate-900/80 flex items-center justify-center z-50 backdrop-blur-sm">
          <motion.div 
            className="bg-slate-800 rounded-xl border border-slate-700 p-6 max-w-md w-full mx-4"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.2 }}
          >
            <div className="flex justify-between items-center mb-4">
              <div className="flex items-center gap-2">
                {selectedAlert.type === 'warning' ? (
                  <AlertTriangle size={20} className="text-yellow-500" />
                ) : selectedAlert.type === 'info' ? (
                  <Info size={20} className="text-blue-500" />
                ) : (
                  <CheckCircle size={20} className="text-green-500" />
                )}
                <h3 className="text-xl font-bold">{selectedAlert.title}</h3>
              </div>
              <button 
                onClick={() => setShowAlertModal(false)}
                className="text-slate-400 hover:text-white"
              >
                &times;
              </button>
            </div>
            
            <div className="space-y-4">
              <div className={`rounded-lg p-3 ${
                selectedAlert.type === 'warning' ? 'bg-yellow-500/10 border border-yellow-500/20' : 
                selectedAlert.type === 'info' ? 'bg-blue-500/10 border border-blue-500/20' : 
                'bg-green-500/10 border border-green-500/20'
              }`}>
                <p className="text-slate-300">{selectedAlert.message}</p>
                {selectedAlert.marketMovement && (
                  <div className="mt-2 text-sm flex items-center gap-2">
                    <span className="text-slate-400">Market Movement:</span>
                    <span className={selectedAlert.marketMovement.startsWith('-') ? 'text-red-400' : 'text-green-400'}>
                      {selectedAlert.marketMovement}
                    </span>
                  </div>
                )}
              </div>
              
              {selectedAlert.recommendation && (
                <div>
                  <h4 className="font-medium text-slate-300 mb-2">AI Recommendation</h4>
                  <p className="text-slate-400 text-sm">{selectedAlert.recommendation}</p>
                </div>
              )}
              
              <div className="flex items-center gap-2 text-xs">
                <Clock size={14} className="text-slate-500" />
                <span className="text-slate-500">{selectedAlert.timestamp}</span>
                {selectedAlert.riskLevel && (
                  <span className={`ml-auto px-2 py-1 rounded ${
                    selectedAlert.riskLevel === 'Low' ? 'bg-green-500/20 text-green-400' : 
                    selectedAlert.riskLevel === 'Medium' ? 'bg-yellow-500/20 text-yellow-400' : 
                    'bg-red-500/20 text-red-400'
                  }`}>
                    {selectedAlert.riskLevel} Risk
                  </span>
                )}
              </div>
              
              <div className="pt-4 flex gap-3">
                <button 
                  onClick={() => setShowAlertModal(false)}
                  className="w-1/2 py-3 bg-slate-700 hover:bg-slate-600 rounded-lg transition-colors text-sm"
                >
                  Dismiss
                </button>
                {selectedAlert.suggestedAction && (
                  <button 
                    className={`w-1/2 py-3 font-medium rounded-lg transition-colors text-sm ${
                      selectedAlert.type === 'warning' ? 'bg-yellow-500 hover:bg-yellow-600' : 
                      selectedAlert.type === 'info' ? 'bg-blue-500 hover:bg-blue-600' : 
                      'bg-green-500 hover:bg-green-600'
                    }`}
                  >
                    {selectedAlert.suggestedAction}
                    <ArrowRight size={16} className="inline ml-1" />
                  </button>
                )}
              </div>
            </div>
          </motion.div>
        </div>
      )}
      
      {/* Settings Modal */}
      {showSettingsModal && (
        <div className="fixed inset-0 bg-slate-900/80 flex items-center justify-center z-50 backdrop-blur-sm">
          <motion.div 
            className="bg-slate-800 rounded-xl border border-slate-700 p-6 max-w-md w-full mx-4"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.2 }}
          >
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold">AI Monitoring Settings</h3>
              <button 
                onClick={() => setShowSettingsModal(false)}
                className="text-slate-400 hover:text-white"
              >
                &times;
              </button>
            </div>
            
            <div className="space-y-6">
              <div className="space-y-4">
                <h4 className="font-medium text-slate-300">Alert Preferences</h4>
                
                <div className="flex items-center justify-between bg-slate-700/50 p-3 rounded-lg">
                  <div>
                    <div className="font-medium">Liquidation Risk Alerts</div>
                    <div className="text-slate-400 text-sm">Get notified when positions approach liquidation</div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" className="sr-only peer" defaultChecked />
                    <div className="w-11 h-6 bg-slate-600 rounded-full peer peer-checked:bg-blue-500 peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all"></div>
                  </label>
                </div>
                
                <div className="flex items-center justify-between bg-slate-700/50 p-3 rounded-lg">
                  <div>
                    <div className="font-medium">Price Movement Alerts</div>
                    <div className="text-slate-400 text-sm">Notify on significant market movements</div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" className="sr-only peer" defaultChecked />
                    <div className="w-11 h-6 bg-slate-600 rounded-full peer peer-checked:bg-blue-500 peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all"></div>
                  </label>
                </div>
                
                <div className="flex items-center justify-between bg-slate-700/50 p-3 rounded-lg">
                  <div>
                    <div className="font-medium">Profit Opportunity Alerts</div>
                    <div className="text-slate-400 text-sm">Get suggestions for taking profits</div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" className="sr-only peer" defaultChecked />
                    <div className="w-11 h-6 bg-slate-600 rounded-full peer peer-checked:bg-blue-500 peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all"></div>
                  </label>
                </div>
                
                <div className="flex items-center justify-between bg-slate-700/50 p-3 rounded-lg">
                  <div>
                    <div className="font-medium">Email Notifications</div>
                    <div className="text-slate-400 text-sm">Receive alerts via email</div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" className="sr-only peer" defaultChecked />
                    <div className="w-11 h-6 bg-slate-600 rounded-full peer peer-checked:bg-blue-500 peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all"></div>
                  </label>
                </div>
              </div>
              
              <div className="space-y-4">
                <h4 className="font-medium text-slate-300">Risk Thresholds</h4>
                
                <div>
                  <label className="block text-sm text-slate-400 mb-2">
                    Liquidation Warning Threshold (%)
                  </label>
                  <select className="w-full bg-slate-700 rounded-lg p-3 text-white focus:outline-none">
                    <option value="120">120% (Very Early Warning)</option>
                    <option value="115">115% (Early Warning)</option>
                    <option selected value="110">110% (Standard)</option>
                    <option value="105">105% (Close to Liquidation)</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm text-slate-400 mb-2">
                    Price Movement Alert Sensitivity
                  </label>
                  <select className="w-full bg-slate-700 rounded-lg p-3 text-white focus:outline-none">
                    <option value="high">High (±3% movements)</option>
                    <option selected value="medium">Medium (±5% movements)</option>
                    <option value="low">Low (±10% movements)</option>
                  </select>
                </div>
              </div>
              
              <div className="pt-4">
                <button 
                  onClick={() => setShowSettingsModal(false)}
                  className="w-full py-3 bg-blue-500 hover:bg-blue-600 rounded-lg transition-colors font-medium"
                >
                  Save Settings
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default DashboardContainer;