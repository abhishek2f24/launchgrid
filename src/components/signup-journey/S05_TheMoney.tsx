'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { ChapterLabel } from '../ui-landing/ChapterLabel';
import { EditorialHeadline } from '../ui-landing/EditorialHeadline';
import { SectionReveal } from '../ui-landing/SectionReveal';

export default function S05_TheMoney() {
  const [orders, setOrders] = useState(350);
  const [revenuePerOrder, setRevenuePerOrder] = useState(300);
  
  const revenue = orders * revenuePerOrder;

  return (
    <section className="py-32 w-full bg-[var(--color-mark-subtle)] border-t border-[var(--color-mark-default)]">
      <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-2 gap-16 lg:gap-24 items-center">
        
        {/* Left Column */}
        <SectionReveal>
          <ChapterLabel chapter="Chapter 04" label="What could your first month look like?" className="!items-start" />
          <EditorialHeadline text={"Not a dream.\nA calculation."} size="lg" className="mb-6" />
          
          <p className="font-inter text-[var(--color-mark-secondary)] text-lg leading-relaxed mb-8">
            Dropshipping is simple math.<br/>
            Orders × Revenue Per Order = Monthly Revenue.<br/>
            Here's what your first month could actually look like.
          </p>
          
          <p className="font-inter text-xs text-[var(--color-mark-muted)]">
            * Based on typical LaunchGrid merchant performance.<br/>
            Results vary. Not a guarantee.
          </p>
        </SectionReveal>

        {/* Right Column: Calculator */}
        <SectionReveal delay={0.2}>
          <div className="bg-white rounded-[2rem] border border-[var(--color-mark-default)] shadow-[0_32px_80px_rgba(26,26,24,0.08)] p-8 md:p-12">
            
            <div className="flex flex-col gap-10">
              {/* Slider 1: Orders */}
              <div className="flex flex-col gap-4">
                <div className="flex items-center justify-between">
                  <label className="font-inter font-bold text-xs tracking-widest uppercase text-[var(--color-mark-secondary)]">Orders Per Month</label>
                  <span className="font-inter font-bold text-[var(--color-mark-ink)]">{orders}</span>
                </div>
                <input 
                  type="range" min="10" max="1000" step="10" 
                  value={orders} onChange={(e) => setOrders(Number(e.target.value))}
                  className="w-full accent-[var(--color-mark-ink)] h-1 bg-[var(--color-mark-muted)] rounded-lg appearance-none cursor-pointer"
                />
              </div>

              {/* Slider 2: Revenue Per Order */}
              <div className="flex flex-col gap-4">
                <div className="flex items-center justify-between">
                  <label className="font-inter font-bold text-xs tracking-widest uppercase text-[var(--color-mark-secondary)]">Revenue Per Order</label>
                  <span className="font-inter font-bold text-[var(--color-mark-ink)]">₹{revenuePerOrder}</span>
                </div>
                <input 
                  type="range" min="100" max="1000" step="50" 
                  value={revenuePerOrder} onChange={(e) => setRevenuePerOrder(Number(e.target.value))}
                  className="w-full accent-[var(--color-mark-ink)] h-1 bg-[var(--color-mark-muted)] rounded-lg appearance-none cursor-pointer"
                />
              </div>

              <div className="h-px w-full bg-[var(--color-mark-default)] my-2" />

              {/* Result — direct display, no spring animation to avoid wrong intermediate values */}
              <div className="text-center py-4">
                <div className="font-inter text-[var(--color-mark-secondary)] text-sm font-medium mb-2 uppercase tracking-widest">Monthly Revenue</div>
                <motion.div
                  key={revenue}
                  initial={{ scale: 1.08, opacity: 0.6 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                  className="font-playfair text-[3.5rem] md:text-[4.5rem] font-bold text-[var(--color-mark-green)] leading-none"
                >
                  ₹{revenue.toLocaleString('en-IN')}
                </motion.div>
              </div>

              {/* Presets */}
              <div className="flex items-center justify-center gap-3">
                <PresetBtn label="100 Orders" onClick={() => { setOrders(100); setRevenuePerOrder(300); }} />
                <PresetBtn label="500 Orders" onClick={() => { setOrders(500); setRevenuePerOrder(300); }} />
                <PresetBtn label="1000 Orders" onClick={() => { setOrders(1000); setRevenuePerOrder(300); }} />
              </div>
            </div>
            
          </div>
        </SectionReveal>
      </div>
    </section>
  );
}

function PresetBtn({ label, onClick }: { label: string, onClick: () => void }) {
  return (
    <button 
      onClick={onClick}
      className="px-4 py-2 rounded-full border border-[var(--color-mark-ink)] text-[var(--color-mark-ink)] font-inter text-xs font-bold hover:bg-[var(--color-mark-ink)] hover:text-white transition-colors"
    >
      {label}
    </button>
  );
}
