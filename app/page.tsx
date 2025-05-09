"use client";

import { useState, useEffect, useRef } from "react";

import { motion } from 'framer-motion';
import Hero from "@/components/Hero";
// import Banner from "@/components/Banner";
import KeyFeatures from "@/components/KeyFeatures";
import HowItWorks from "@/components/HowItWorks";
import CTASection from "@/components/CTA";
import Comparison from "@/components/Comparison";
import FAQSection from "@/components/FAQ";

export default function App() {
   
  return (
    <main>
       <Hero/>
       <KeyFeatures/>
       <HowItWorks/>
       <Comparison/>
       <FAQSection/>
       {/* <CTASection/> */}
       <div className="h-[80px]"/>
    </main>
  );
}
