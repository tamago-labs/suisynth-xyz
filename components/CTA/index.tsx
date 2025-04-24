import React from 'react';
import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';

const CTASection = () => {
  return (
    <section className="relative py-20 overflow-hidden"> 
      {/* Subtle background blur elements */}
      <div className="absolute top-1/4 right-1/4 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl" />
      <div className="absolute bottom-1/4 left-1/3 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl" />
      
      <div className="max-w-5xl mx-auto px-6 md:px-10 relative z-10">
        <motion.div 
          className="bg-slate-800/70 backdrop-blur-xl rounded-2xl border border-slate-700/50 p-8 md:p-12 text-center"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
            Ready to Experience Synthetic Assets on Sui?
          </h2>
          
          <p className="text-slate-300 text-lg max-w-2xl mx-auto mb-8">
            Join the revolution in decentralized finance with AI-powered insights and up to 4x leverage on synthetic assets.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <motion.button 
              className="px-8 py-4 bg-gradient-to-r from-blue-500 to-purple-500 text-white font-medium rounded-lg flex items-center justify-center gap-2 hover:shadow-lg hover:shadow-blue-500/20 transition-all"
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.98 }}
            >
              Launch App
              <ArrowRight size={18} />
            </motion.button>
            
            <motion.button 
              className="px-8 py-4 bg-slate-700 text-white font-medium rounded-lg hover:bg-slate-600 transition-all flex items-center justify-center gap-2"
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.98 }}
            >
              View Documentation
            </motion.button>
          </div>
          
          <p className="text-slate-400 mt-8">
            Start with as little as 100 USDC and gain exposure to global markets
          </p>
        </motion.div>
      </div>
    </section>
  );
};

export default CTASection;