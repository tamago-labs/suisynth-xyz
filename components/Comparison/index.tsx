"use client"

import React from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, DollarSign, Clock, XCircle, CheckCircle, ArrowRight } from 'lucide-react';


const ComparisonContainer = () => {



    return (
        <section className="relative py-24  ">
            {/* Background gradient effects */}

            <div className="absolute top-40 right-20 w-72 h-72 bg-blue-500/5 rounded-full blur-3xl" />
            <div className="absolute bottom-40 left-20 w-72 h-72 bg-purple-500/5 rounded-full blur-3xl" />

            <div className="max-w-7xl mx-auto px-6 md:px-10 relative z-10">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5 }}
                    className="text-center mb-16"
                >
                    <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
                        SuiSynth vs Perpetuals
                    </h2>
                    <div className="h-1 w-24 bg-gradient-to-r from-blue-500 to-purple-500 mx-auto rounded-full mb-6" />
                    <p className="text-xl text-slate-300 max-w-3xl mx-auto">
                    Unlike perps, SuiSynth uses a lending model. You gain leveraged exposure to assets like BTC without paying in recurring costs
                    </p>
                </motion.div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12">
                    {/* Left Column - Traditional Platforms */}
                    <motion.div
                        initial={{ opacity: 0, x: -30 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.5, delay: 0.2 }}
                        className="bg-slate-800/50 backdrop-blur-sm rounded-xl border border-slate-700/50 p-6 md:p-8"
                    >
                        <div className="flex items-start gap-4">
                            <div className="w-12 h-12 rounded-lg bg-red-500/20 flex items-center justify-center shrink-0">
                                <XCircle className="text-red-500" size={24} />
                            </div>
                            <div>
                                <h3 className="text-xl font-bold text-white mb-2">Traditional Perpetuals</h3>
                                <p className="text-slate-400 mb-6">
                                    Perpetual swap platforms use complex funding rate mechanisms that can add unpredictable costs to your positions.
                                </p>
                            </div>
                        </div>

                        {/* Animation for recurring fees */}
                        <div className="relative h-64 bg-slate-700/30 rounded-lg overflow-hidden mb-6">
                            <div className="absolute top-4 left-4 right-4 flex justify-between items-center">
                                <span className="text-sm text-slate-400">Position Value</span>
                                <span className="text-sm text-slate-300">$10,000</span>
                            </div>

                            {/* Animated graph line */}
                            <svg className="absolute w-full h-full top-0 left-0" viewBox="0 0 100 60" preserveAspectRatio="none">
                                <motion.path
                                    d="M0,15 L10,14 L20,16 L30,13 L40,17 L50,12 L60,18 L70,14 L80,15 L90,13 L100,16"
                                    stroke="rgba(239, 68, 68, 0.8)"
                                    strokeWidth="1"
                                    fill="none"
                                    initial={{ pathLength: 0 }}
                                    whileInView={{ pathLength: 1 }}
                                    viewport={{ once: true }}
                                    transition={{ duration: 1.5, delay: 0.5 }}
                                />
                            </svg>

                            {/* Recurring fee markers */}
                            {[20, 40, 60, 80].map((position, i) => (
                                <motion.div
                                    key={i}
                                    className="absolute w-8 h-8 rounded-full bg-red-500/20 flex items-center justify-center border border-red-500/50"
                                    style={{ left: `${position}%`, top: '50%' }}
                                    initial={{ opacity: 0, y: -20 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    viewport={{ once: true }}
                                    transition={{ duration: 0.3, delay: 0.8 + (i * 0.2) }}
                                >
                                    <DollarSign size={14} className="text-red-400" />
                                </motion.div>
                            ))}

                            {/* Fee costs */}
                            <motion.div
                                className="absolute bottom-4 left-4 right-4 bg-red-500/10 border border-red-500/30 rounded-lg p-3"
                                initial={{ opacity: 0, y: 10 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ duration: 0.4, delay: 1.5 }}
                            >
                                <div className="flex items-center gap-2 text-sm">
                                    <Clock className="text-red-400" size={16} />
                                    <span className="text-red-400">8-Hour Funding Rate: 0.01%</span>
                                </div>
                                <div className="mt-2 flex justify-between text-xs">
                                    <span className="text-slate-400">Monthly Cost (est.):</span>
                                    <span className="text-red-400">$300.00</span>
                                </div>
                            </motion.div>
                        </div>

                        <div className="space-y-3">
                            <div className="flex items-start gap-2">
                                <div className="w-5 h-5 rounded-full bg-red-500/20 flex items-center justify-center shrink-0 mt-0.5">
                                    <XCircle className="text-red-500" size={12} />
                                </div>
                                <div className="text-sm text-slate-400">
                                    Recurring funding rates charged every 8 hours
                                </div>
                            </div>
                            <div className="flex items-start gap-2">
                                <div className="w-5 h-5 rounded-full bg-red-500/20 flex items-center justify-center shrink-0 mt-0.5">
                                    <XCircle className="text-red-500" size={12} />
                                </div>
                                <div className="text-sm text-slate-400">
                                    Rates fluctuate based on market conditions
                                </div>
                            </div>
                            <div className="flex items-start gap-2">
                                <div className="w-5 h-5 rounded-full bg-red-500/20 flex items-center justify-center shrink-0 mt-0.5">
                                    <XCircle className="text-red-500" size={12} />
                                </div>
                                <div className="text-sm text-slate-400">
                                    Long-term positions become increasingly expensive
                                </div>
                            </div>
                        </div>
                    </motion.div>

                    {/* Right Column - SuiSynth */}
                    <motion.div
                        initial={{ opacity: 0, x: 30 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.5, delay: 0.4 }}
                        className="bg-slate-800/50 backdrop-blur-sm rounded-xl border border-slate-700/50 p-6 md:p-8"
                    >
                        <div className="flex items-start gap-4">
                            <div className="w-12 h-12 rounded-lg bg-green-500/20 flex items-center justify-center shrink-0">
                                <CheckCircle className="text-green-500" size={24} />
                            </div>
                            <div>
                                <h3 className="text-xl font-bold text-white mb-2">SuiSynth Advantage</h3>
                                <p className="text-slate-400 mb-6">
                                    Our lending pool model lets you borrow synthetic assets with a one-time interest rate, making costs predictable and often lower.
                                </p>
                            </div>
                        </div>

                        {/* Animation for one-time fee */}
                        <div className="relative  h-64 bg-slate-700/30 rounded-lg overflow-hidden mb-6">
                            <div className="absolute top-4 left-4 right-4 flex justify-between items-center">
                                <span className="text-sm text-slate-400">Position Value</span>
                                <span className="text-sm text-slate-300">$10,000</span>
                            </div>

                            {/* Animated graph line */}
                            <svg className="absolute w-full h-full top-0 left-0" viewBox="0 0 100 60" preserveAspectRatio="none">
                                <motion.path
                                    d="M0,30 L10,28 L20,25 L30,22 L40,24 L50,20 L60,18 L70,16 L80,14 L90,12 L100,10"
                                    stroke="rgba(34, 197, 94, 0.8)"
                                    strokeWidth="1"
                                    fill="none"
                                    initial={{ pathLength: 0 }}
                                    whileInView={{ pathLength: 1 }}
                                    viewport={{ once: true }}
                                    transition={{ duration: 1.5, delay: 0.5 }}
                                />
                            </svg>

                            {/* One-time fee marker */}
                            <motion.div
                                className="absolute w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center border border-green-500/50"
                                style={{ left: '5%', top: '45%' }}
                                initial={{ opacity: 0, scale: 0.5 }}
                                whileInView={{ opacity: 1, scale: 1 }}
                                viewport={{ once: true }}
                                transition={{ duration: 0.4, delay: 0.8 }}
                            >
                                <DollarSign size={18} className="text-green-400" />
                            </motion.div>

                            {/* Fee information */}
                            <motion.div
                                className="absolute bottom-4 left-4 right-4 bg-green-500/10 border border-green-500/30 rounded-lg p-3"
                                initial={{ opacity: 0, y: 10 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ duration: 0.4, delay: 1.5 }}
                            >
                                <div className="flex items-center gap-2 text-sm">
                                    <TrendingUp className="text-green-400" size={16} />
                                    <span className="text-green-400">One-Time Borrow Interest: 3.2% APR</span>
                                </div>
                                <div className="mt-2 flex justify-between text-xs">
                                    <span className="text-slate-400">Monthly Cost (30-day position):</span>
                                    <span className="text-green-400">$80.00</span>
                                </div>
                            </motion.div>
                        </div>

                        <div className="space-y-3">
                            <div className="flex items-start gap-2">
                                <div className="w-5 h-5 rounded-full bg-green-500/20 flex items-center justify-center shrink-0 mt-0.5">
                                    <CheckCircle className="text-green-500" size={12} />
                                </div>
                                <div className="text-sm text-slate-400">
                                    Only pay interest on borrowed amount at a predictable APR
                                </div>
                            </div>
                            <div className="flex items-start gap-2">
                                <div className="w-5 h-5 rounded-full bg-green-500/20 flex items-center justify-center shrink-0 mt-0.5">
                                    <CheckCircle className="text-green-500" size={12} />
                                </div>
                                <div className="text-sm text-slate-400">
                                    No surprise fees or hidden costs over time
                                </div>
                            </div>
                            <div className="flex items-start gap-2">
                                <div className="w-5 h-5 rounded-full bg-green-500/20 flex items-center justify-center shrink-0 mt-0.5">
                                    <CheckCircle className="text-green-500" size={12} />
                                </div>
                                <div className="text-sm text-slate-400">
                                    Ideal for medium to long-term position holders
                                </div>
                            </div>
                        </div>
                    </motion.div>
                </div>

                {/* Bottom CTA */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5, delay: 0.6 }}
                    className="mt-16 text-center"
                >
                    <button className="px-8 py-3 bg-gradient-to-r from-blue-500 to-purple-500 text-white font-medium rounded-lg flex items-center gap-2 hover:shadow-lg hover:shadow-blue-500/20 transition-all mx-auto">
                        Trade Now
                        <ArrowRight size={18} />
                    </button>
                </motion.div>
            </div>
        </section>
    );
};

export default ComparisonContainer