'use client';

import { motion } from 'framer-motion';
import { ChapterLabel } from '../ui-landing/ChapterLabel';
import { AnimatedCounter } from '../ui-landing/AnimatedCounter';
import { SectionReveal } from '../ui-landing/SectionReveal';

export default function S07_LiveDemo() {
  return (
    <section className="py-32 w-full bg-[var(--color-mark-base)] relative overflow-hidden">
      <div className="max-w-5xl mx-auto px-6">
        
        <SectionReveal className="text-center mb-16">
          <ChapterLabel chapter="Chapter 06" label="The Reality" />
        </SectionReveal>

        <SectionReveal delay={0.2}>
          <div className="bg-[#1A1A18] rounded-[24px] shadow-[0_32px_80px_rgba(26,26,24,0.14)] overflow-hidden border border-white/10">
            {/* macOS Chrome Titlebar */}
            <div className="bg-white/5 border-b border-white/5 h-12 flex items-center px-4 relative">
              <div className="flex gap-2">
                <div className="w-3 h-3 rounded-full bg-red-500/80" />
                <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
                <div className="w-3 h-3 rounded-full bg-green-500/80" />
              </div>
              <div className="absolute left-1/2 -translate-x-1/2 flex items-center gap-2 px-3 py-1 bg-white/5 rounded-md">
                <svg className="w-3 h-3 text-white/40" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
                <span className="font-mono text-xs text-white/60">dashboard.launchgrid.in</span>
              </div>
            </div>

            {/* Dashboard Content */}
            <div className="p-8 md:p-12">
              
              {/* Top Metrics Row */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 mb-12">
                <MetricCard title="Revenue Today" value={4200} prefix="₹" delay={0.1} />
                <MetricCard title="Orders" value={12} delay={0.2} />
                <MetricCard title="Visitors" value={847} delay={0.3} />
                <MetricCard title="Conversion" value={1.4} suffix="%" decimals={1} delay={0.4} />
              </div>

              {/* Chart Area */}
              <div className="h-48 border border-white/5 bg-white/[0.02] rounded-xl flex items-center justify-center relative mb-12 p-6">
                <AnimatedChart />
              </div>

              {/* Recent Orders Table */}
              <div className="bg-white/[0.02] border border-white/5 rounded-xl overflow-hidden">
                <div className="px-6 py-4 border-b border-white/5 flex items-center justify-between">
                  <span className="font-inter font-bold text-xs uppercase tracking-widest text-white/40">Recent Activity</span>
                  {/* Honest label: this is a product demo, not a live feed */}
                  <div className="flex items-center gap-2 bg-white/5 px-2 py-1 rounded">
                    <span className="font-inter text-xs font-bold text-white/50 uppercase tracking-widest">Demo</span>
                  </div>
                </div>
                <div className="flex flex-col">
                  <OrderRow id="#001" item="Premium Wireless Headphones" amount="₹1,299" time="3 mins ago" delay={0.5} />
                  <OrderRow id="#002" item="Minimalist Smartwatch" amount="₹899" time="14 mins ago" delay={0.6} />
                  <OrderRow id="#003" item="Mechanical Keyboard" amount="₹649" time="1 hour ago" delay={0.7} />
                </div>
              </div>

              {/* Bottom Caption */}
              <div className="text-center mt-12">
                <span className="font-playfair italic text-white/40 text-sm">
                  Your dashboard could look like this on Day 14.
                </span>
              </div>

            </div>
          </div>
        </SectionReveal>

      </div>
    </section>
  );
}

function MetricCard({ title, value, prefix, suffix, decimals, delay }: any) {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay }}
      className="bg-white/[0.05] border border-white/[0.08] rounded-xl p-5"
    >
      <span className="block font-inter text-xs text-white/50 mb-2">{title}</span>
      <span className="block font-inter font-bold text-2xl text-white">
        <AnimatedCounter value={value} prefix={prefix} suffix={suffix} decimals={decimals} duration={1.5} />
      </span>
    </motion.div>
  );
}

function OrderRow({ id, item, amount, time, delay }: any) {
  return (
    <motion.div 
      initial={{ opacity: 0, x: -10 }}
      whileInView={{ opacity: 1, x: 0 }}
      viewport={{ once: true }}
      transition={{ delay }}
      className="px-6 py-4 flex items-center justify-between border-b border-white/5 last:border-0 hover:bg-white/[0.02] transition-colors cursor-default"
    >
      <div className="flex items-center gap-4">
        <span className="font-mono text-xs text-white/30">{id}</span>
        <span className="font-inter text-sm text-white/80">{item}</span>
      </div>
      <div className="flex items-center gap-6">
        <span className="font-inter font-medium text-sm text-white">{amount}</span>
        <span className="font-inter text-xs text-white/30 w-20 text-right">{time}</span>
      </div>
    </motion.div>
  );
}

function AnimatedChart() {
  const pathLength = "0.7"; 
  return (
    <div className="w-full h-full relative">
      <svg className="w-full h-full" viewBox="0 0 400 100" preserveAspectRatio="none">
        <motion.path
          d="M0,80 L50,70 L100,85 L150,50 L200,60 L250,30 L300,40 L350,15 L400,20"
          fill="none"
          stroke="#16A34A"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
          initial={{ pathLength: 0 }}
          whileInView={{ pathLength: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 1.5, ease: "easeOut" }}
        />
      </svg>
      {/* Decorative gradient below line */}
      <motion.div 
        className="absolute inset-0 bg-gradient-to-t from-[rgba(22,163,74,0.1)] to-transparent origin-bottom"
        initial={{ scaleY: 0, opacity: 0 }}
        whileInView={{ scaleY: 1, opacity: 1 }}
        viewport={{ once: true }}
        transition={{ delay: 1, duration: 1 }}
      />
    </div>
  );
}
