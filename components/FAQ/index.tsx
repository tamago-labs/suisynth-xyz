"use client"

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { ChevronDown, ChevronUp, Github, Twitter } from 'lucide-react';

const FAQSection = () => {
    // State to track which FAQ items are open
    const [openItems, setOpenItems] = useState([0]); // First item open by default

    // Toggle FAQ item
    const toggleItem = (index: any) => {
        if (openItems.includes(index)) {
            setOpenItems(openItems.filter(item => item !== index));
        } else {
            setOpenItems([...openItems, index]);
        }
    };

    // FAQ data
    const faqItems = [
        {
            question: "What are synthetic assets?",
            answer: "Synthetic assets are tokenized derivatives that mimic the value of other assets without requiring you to own the underlying asset. SuiSynth allows you to gain price exposure to assets like BTC without actually holding BTC, all within the Sui ecosystem."
        },
        {
            question: "How does leverage work on SuiSynth?",
            answer: "SuiSynth offers up to 4x leverage through our lending pool model. You provide collateral (USDC or SUI), and borrow synthetic assets worth up to 4 times your collateral value. The higher your leverage, the higher your liquidation threshold will be, as it's adjusted by 5% for each multiple of leverage."
        },
        {
            question: "What's the advantage over perpetual exchanges?",
            answer: "Unlike perpetual exchanges that charge recurring funding rates every 8 hours, SuiSynth uses a simple borrowing model with a predictable APR. This makes costs transparent and often lower, especially for medium to long-term positions."
        },
        {
            question: "How are prices determined?",
            answer: "SuiSynth uses Switchboard Oracle to provide accurate and manipulation-resistant price feeds. These oracles aggregate data from multiple sources to ensure the prices of our synthetic assets closely track their real-world counterparts."
        },
        {
            question: "What collateral types are supported?",
            answer: "Currently, SuiSynth supports USDC and SUI as collateral for minting synthetic assets or opening leveraged positions. We plan to expand to additional collateral types in the future."
        },
        {
            question: "How do AI-optimized risk parameters work?",
            answer: "SuiSynth uses AI to dynamically adjust key risk parameters, such as the optimal utilization ratio for the lending pool and the collateralization ratio for synthetic asset issuance. It integrates with a counterpart AI agent from Sui MCP, which observes external data sources like websites and insights then updates smart contracts directly via the MCP protocol."
        },
        {
            question: "What happens if I get liquidated?",
            answer: "If your position's health factor falls below the liquidation threshold, it becomes eligible for liquidation. During liquidation, your position is closed, a liquidation fee is applied, and the remaining collateral is returned to your wallet. To avoid liquidation, maintain a healthy collateral ratio by adding more collateral or reducing your position size."
        }
    ];

    return (
        <section className="relative py-20 ">

            <div className="max-w-6xl mx-auto px-6 relative z-10">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5 }}
                    className="text-center mb-12"
                >
                    <h2 className="text-3xl font-bold text-white mb-4">Frequently Asked Questions</h2>
                    <div className="h-1 w-24 bg-gradient-to-r from-blue-500 to-purple-500 mx-auto rounded-full" />
                </motion.div>

                <div className="space-y-4">
                    {faqItems.map((item, index) => (
                        <motion.div
                            key={index}
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.5, delay: index * 0.05 }}
                            className="bg-slate-800/50 backdrop-blur-sm rounded-xl border border-slate-700/50 overflow-hidden"
                        >
                            <button
                                className="w-full py-5 cursor-pointer px-6 flex justify-between items-center text-left focus:outline-none"
                                onClick={() => toggleItem(index)}
                            >
                                <span className="font-medium text-white">{item.question}</span>
                                {openItems.includes(index) ? (
                                    <ChevronUp className="text-slate-400" size={18} />
                                ) : (
                                    <ChevronDown className="text-slate-400" size={18} />
                                )}
                            </button>

                            {openItems.includes(index) && (
                                <div className="py-3 px-6 pb-5 border-t border-slate-700/50">
                                    <p className="text-slate-300">{item.answer}</p>
                                </div>
                            )}
                        </motion.div>
                    ))}
                </div>

                {/* Call to Action */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5, delay: 0.5 }}
                    className="mt-12 text-center"
                >
                    <p className="text-slate-300 mb-6">
                        Still have questions? Join our community to learn more.
                    </p>

                    <div className="flex flex-wrap justify-center gap-4">
                        <a
                            href="https://github.com/suisynth"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 px-6 py-3 bg-slate-800 hover:bg-slate-700 text-white rounded-lg transition-colors"
                        >
                            <Github size={18} />
                            <span>Github</span>
                        </a>

                        <a
                            href="https://twitter.com/suisynth"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 px-6 py-3 bg-slate-800 hover:bg-slate-700 text-white rounded-lg transition-colors"
                        >
                            <Twitter size={18} />
                            <span>Twitter</span>
                        </a>
                    </div>
                </motion.div>

            </div>
        </section>
    );
};

export default FAQSection;