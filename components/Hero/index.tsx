
import { motion } from 'framer-motion';
import { ArrowRight, Gem, ChevronUp, ChevronDown } from 'lucide-react';
import Link from "next/link"

const Hero = () => {

  // Sample price data for popups
  const priceData = [
    { symbol: "suiBTC", price: "$94,213", change: "+4.2%", isUp: true },
    { symbol: "suiS&P", price: "$4,782.16", change: "+2.4%", isUp: true },
    { symbol: "suiGLD", price: "$2,341.75", change: "-0.8%", isUp: false },
    { symbol: "suiUSD", price: "$1.002", change: "+0.1%", isUp: true },
    { symbol: "suiCRUD", price: "$87.33", change: "-1.2%", isUp: false },
    { symbol: "suiBTC", price: "$64,213", change: "+1.8%", isUp: true },
    { symbol: "suiETH", price: "$3,021", change: "-0.5%", isUp: false }
  ];

  return (
    <div className="relative w-full overflow-hidden  py-20">
      {/* Subtle background elements */}
      <div className="absolute inset-0 overflow-hidden">
        {/* Animated market line */}
        <svg className="absolute w-full h-64 bottom-0 left-0 opacity-10" viewBox="0 0 1000 200" preserveAspectRatio="none">
          <motion.path
            d="M0,100 C150,30 350,150 500,80 C650,10 850,120 1000,50"
            fill="none"
            stroke="url(#lineGradient)"
            strokeWidth="2"
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ pathLength: 1, opacity: 0.7 }}
            transition={{ duration: 3, ease: "easeInOut" }}
          />
          <defs>
            <linearGradient id="lineGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#60a5fa" />
              <stop offset="50%" stopColor="#8b5cf6" />
              <stop offset="100%" stopColor="#34d399" />
            </linearGradient>
          </defs>
        </svg>

        {/* Soft gradient blobs */}
        <motion.div
          className="absolute w-96 h-96 rounded-full bg-blue-600/5 blur-3xl"
          style={{ top: '-20%', right: '-10%' }}
          animate={{
            scale: [1, 1.1, 1],
            opacity: [0.3, 0.4, 0.3],
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />

        <motion.div
          className="absolute w-96 h-96 rounded-full bg-purple-600/5 blur-3xl"
          style={{ bottom: '-30%', left: '-10%' }}
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.2, 0.3, 0.2],
          }}
          transition={{
            duration: 10,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 1
          }}
        />
      </div>

      <div className="max-w-7xl mx-auto px-4 md:px-10 relative z-10">
        <div className="flex flex-col md:flex-row items-center justify-between gap-12">
          {/* Left column - content */}
          <div className="w-full md:w-1/2 space-y-6">
            <motion.h1
              className="text-4xl md:text-5xl lg:text-6xl font-bold text-white leading-tight"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              Smarter Synthetic Assets on Sui
            </motion.h1>

            <motion.p
              className="text-slate-400 text-md md:text-xl max-w-xl"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              Access global markets through decentralized synthetic assets on Sui with up to 4x leverage and AI-optimized risk parameters for capital-efficient
            </motion.p>

            <motion.div
              className="flex flex-wrap gap-4 pt-2"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <Link href="/trade">
                <button className="px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-500 text-white font-medium rounded-lg flex items-center gap-2 hover:shadow-lg hover:shadow-blue-500/20 transition-all">
                  Trade Now
                  <ArrowRight size={16} />
                </button>
              </Link>

              <Link href="https://github.com/tamago-labs/suisynth-xyz" target="_blank">
                <button className="px-6 py-3 bg-slate-800 text-white font-medium rounded-lg hover:bg-slate-700 transition-all">
                  Learn More
                </button>
              </Link>
            </motion.div>

            {/* Featured assets row */}
            <motion.div
              className="pt-6"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.3 }}
            >
              <div className="text-slate-400 text-sm mb-2">Featured Synthetic Assets</div>
              <div className="grid grid-cols-3 gap-4">
                {priceData.slice(0, 3).map((asset, i) => (
                  <motion.div
                    key={asset.symbol}
                    className="bg-slate-800/50 backdrop-blur-sm rounded-lg border border-slate-700/50 px-3 py-2"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: 0.4 + (i * 0.1) }}
                  >
                    <div className="text-slate-400 text-xs">{asset.symbol}</div>
                    <div className="text-white font-mono font-medium text-sm">{asset.price}</div>
                    <div className={`flex items-center text-xs ${asset.isUp ? 'text-green-400' : 'text-red-400'}`}>
                      {asset.isUp ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                      {asset.change}
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </div>

          {/* Right column - visualization with price popups */}
          <div className="w-full md:w-1/2 flex justify-center">
            <div className="relative w-full max-w-md aspect-square">


              {/* Animated price popups */}
              {priceData.map((asset, i) => (
                <motion.div
                  key={`price-${i}`}
                  className={`absolute rounded-lg ${asset.isUp ? 'bg-green-500/10 border-green-500/30' : 'bg-red-500/10 border-red-500/30'} border backdrop-blur-sm px-4 py-2 shadow-lg`}
                  style={{
                    // Distribute randomly around the central element
                    left: `${15 + (i % 3) * 30}%`,
                    top: `${15 + Math.floor(i / 3) * 30}%`,
                    zIndex: 5
                  }}
                  initial={{ opacity: 0, scale: 0.5 }}
                  animate={{
                    opacity: [0, 1, 1, 0],
                    scale: [0.5, 1, 1, 0.5],
                    y: [20, 0, 0, -20]
                  }}
                  transition={{
                    duration: 5,
                    times: [0, 0.1, 0.9, 1],
                    repeat: Infinity,
                    delay: i * 2.5,
                    repeatDelay: 10
                  }}
                >
                  <div className="flex items-center justify-between">
                    <div className="text-white font-medium">{asset.symbol}</div>
                    <div className={`flex items-center ${asset.isUp ? 'text-green-400' : 'text-red-400'}`}>
                      {asset.isUp ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                    </div>
                  </div>
                  <div className="text-white text-2xl font-mono font-bold mt-1">{asset.price}</div>
                  <div className={`text-xs mt-1 ${asset.isUp ? 'text-green-400' : 'text-red-400'}`}>
                    {asset.change}
                  </div>
                </motion.div>
              ))}

              {/* Connection lines from central hub to price cards */}
              {priceData.map((asset, i) => {
                const x1 = 50;
                const y1 = 50;
                const x2 = 15 + (i % 3) * 30;
                const y2 = 15 + Math.floor(i / 3) * 30;

                return (
                  <svg key={`line-${i}`} className="absolute top-0 left-0 w-full h-full z-0">
                    <motion.line
                      x1={`${x1}%`}
                      y1={`${y1}%`}
                      x2={`${x2}%`}
                      y2={`${y2}%`}
                      stroke={asset.isUp ? "#4ade80" : "#f87171"}
                      strokeWidth="1"
                      strokeDasharray="5,5"
                      initial={{ opacity: 0 }}
                      animate={{
                        opacity: [0, 0.3, 0.3, 0],
                      }}
                      transition={{
                        duration: 5,
                        times: [0, 0.1, 0.9, 1],
                        repeat: Infinity,
                        delay: i * 2.5,
                        repeatDelay: 10
                      }}
                    />
                  </svg>
                );
              })}

              {/* Subtle grid background */}
              <div className="absolute inset-0 -z-10">
                {[...Array(5)].map((_, i) => (
                  <div
                    key={`grid-h-${i}`}
                    className="absolute w-full h-px bg-slate-800/50"
                    style={{ top: `${20 + i * 20}%` }}
                  />
                ))}

                {[...Array(5)].map((_, i) => (
                  <div
                    key={`grid-v-${i}`}
                    className="absolute h-full w-px bg-slate-800/50"
                    style={{ left: `${20 + i * 20}%` }}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Hero