import React from 'react';
import { motion } from 'framer-motion';
import { Bitcoin, TrendingUp, Database, BarChart4, Mail, ArrowRight, LogIn } from 'lucide-react';

const KeyFeaturesSection = () => {
  const features = [
    {
      icon: <Bitcoin className="h-6 w-6" />,
      title: "Synthetic Asset Exposure",
      description: "Access asset prices like BTC directly on Sui blockchain. Borrow synthetic assets against your collateral, gain leveraged exposure and cash out profits.",
      delay: 0.1
    },
    {
      icon: <TrendingUp className="h-6 w-6" />,
      title: "Leverage Up to 4x",
      description: "Amplify your market exposure with up to 4x leverage. Open larger positions with less capital and maximize potential returns when your outlook is correct.",
      delay: 0.2
    },
    {
      icon: <Database className="h-6 w-6" />,
      title: "Multi-Collateral Support",
      description: "Mint or borrow using various stablecoins as collateral. Diversify your strategy and use your preferred stablecoins to back positions.",
      delay: 0.3
    },
    {
      icon: <BarChart4 className="h-6 w-6" />,
      title: "Pyth Oracle Integration",
      description: "Reliable price feeds from Pyth Network ensure synthetic assets accurately tracks real asset prices for more secure and transparent trading.",
      delay: 0.4
    },
    {
        icon: <LogIn className="h-6 w-6" />,
        title: "Onboard with zkLogin",
        description: "Use familiar logins to access DeFi instantly with zkLogin. Start trading synthetic assets with trading leverage through a seamless flow.",
        delay: 0.5
      },
    {
      icon: <Mail className="h-6 w-6" />,
      title: "AI-Powered Email Alerts",
      description: "Receive intelligent email notifications to your zkLogin account about liquidation risks and alert you before your health factor gets critical.",
      delay: 0.6
    }
  ];

  return (
    <section className="relative py-20 overflow-hidden"> 

      <div className="max-w-7xl mx-auto px-6 md:px-10 relative z-10">
        {/* Section header */}
        <div className="text-center mb-16">
          <motion.h2 
            className="text-3xl md:text-4xl font-bold text-white mb-4"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            Key Features
          </motion.h2>
          <motion.div 
            className="h-1 w-24 bg-gradient-to-r from-blue-500 to-purple-500 mx-auto rounded-full"
            initial={{ opacity: 0, width: 0 }}
            whileInView={{ opacity: 1, width: 96 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.2 }}
          />
        </div>

        {/* Features grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <motion.div
              key={index}
              className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-6 border border-slate-700/50 hover:border-blue-500/50 transition-all duration-300 group"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: feature.delay }}
            >
              <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-blue-600/30 via-purple-500/30 to-blue-400/30 flex items-center justify-center mb-4 text-blue-400 group-hover:text-white transition-colors duration-300">
                {feature.icon}
              </div>
              <h3 className="text-xl font-semibold text-white mb-3">{feature.title}</h3>
              <p className="text-slate-400">{feature.description}</p>
            </motion.div>
          ))}
        </div>

        {/* CTA button */}
        {/* <motion.div 
          className="mt-12 text-center"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.6 }}
        >
          <button className="px-8 py-3 bg-gradient-to-r from-blue-500 to-purple-500 text-white font-medium rounded-lg flex items-center gap-2 hover:shadow-lg hover:shadow-blue-500/20 transition-all mx-auto">
            Explore Features
            <ArrowRight size={16} />
          </button>
        </motion.div> */}
      </div>
    </section>
  );
};

export default KeyFeaturesSection;