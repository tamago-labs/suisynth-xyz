import React from 'react';
import { motion } from 'framer-motion';
import { Wallet, Coins, BarChart, ArrowRight, RefreshCcw, Download, DollarSign } from 'lucide-react';
import Link from 'next/link';

const HowItWorksSection = () => {

  const steps = [
    {
      icon: <Download className="h-8 w-8" />,
      title: "Deposit Collateral",
      description: "Supply assets to the lending pool as collateral, securing your position and enabling borrowing",
      delay: 0.1
    },
    {
      icon: <RefreshCcw className="h-8 w-8" />,
      title: "Borrow with 4x Leverage",
      description: "Borrow synthetic BTC with up to 4x leverage—no funding rates or order book required",
      delay: 0.2
    },
    {
      icon: <DollarSign className="h-8 w-8" />,
      title: "Cash Out Real Profits",
      description: "Repay your borrowed suiBTC and withdraw your collateral plus any profits in real assets",
      delay: 0.3
    }
  ];

  return (
    <section className="relative py-24 overflow-hidden">
      {/* Subtle gradient background */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-slate-800/20 to-transparent" />

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
            How It Works
          </motion.h2>
          <motion.div
            className="h-1 w-24 bg-gradient-to-r from-blue-500 to-purple-500 mx-auto rounded-full"
            initial={{ opacity: 0, width: 0 }}
            whileInView={{ opacity: 1, width: 96 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.2 }}
          />
          {/* <motion.p
            className="text-slate-400 max-w-2xl mx-auto mt-6"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            Live on Sui Testnet with suiBTC and more coming soon. Use your assets as collateral to mint or borrow synthetic tokens
          </motion.p> */}
          <p className="text-xl text-slate-300  mt-6 max-w-3xl mx-auto">
            Live on Sui Testnet with suiBTC and more coming soon
          </p>
        </div>

        {/* Steps */}
        <div className="flex flex-col md:flex-row justify-between items-center gap-8">
          {steps.map((step, index) => (
            <React.Fragment key={index}>
              <motion.div
                className="flex flex-col items-center text-center max-w-xs"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: step.delay }}
              >
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-600/20 via-purple-500/20 to-blue-400/20 border border-slate-700 flex items-center justify-center mb-6 text-blue-400">
                  {step.icon}
                </div>
                <h3 className="text-xl font-semibold text-white mb-3">{step.title}</h3>
                <p className="text-slate-400">{step.description}</p>
              </motion.div>

              {/* Arrow between steps */}
              {index < steps.length - 1 && (
                <motion.div
                  className="hidden md:block text-slate-600"
                  initial={{ opacity: 0 }}
                  whileInView={{ opacity: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: 0.4 }}
                >
                  <ArrowRight className="h-8 w-8" />
                </motion.div>
              )}
            </React.Fragment>
          ))}
        </div>

        {/* CTA button */}
        {/* <motion.div
          className="mt-16 text-center"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.6 }}
        >
          <Link href="https://github.com/tamago-labs/suisynth-xyz" target="_blank">
            <button className="px-8 py-3 bg-slate-800 text-white font-medium rounded-lg hover:bg-slate-700 transition-all">
              Learn More
            </button>
          </Link>
        </motion.div> */}
      </div>
    </section>
  );
};

export default HowItWorksSection;