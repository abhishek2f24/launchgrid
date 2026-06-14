'use client';

import { useState } from 'react';
import Link from 'next/link';
import { JourneyNav } from '@/components/signup-journey/JourneyNav';
import { GrainOverlay } from '@/components/ui-landing/GrainOverlay';
import { Footer } from '@/components/signup-journey/Footer';
import { motion } from 'framer-motion';
import { MessageSquare, ArrowRight, Copy, Check, ExternalLink } from 'lucide-react';

export default function WhatsappMessageGeneratorPage() {
  const [countryCode, setCountryCode] = useState<string>('91');
  const [phoneNumber, setPhoneNumber] = useState<string>('9506212886');
  const [message, setMessage] = useState<string>('Hi LaunchGrid! I want to start my online store free trial.');
  const [copied, setCopied] = useState<boolean>(false);

  const cleanPhone = `${countryCode}${phoneNumber.replace(/\D/g, '')}`;
  const encodedText = encodeURIComponent(message);
  const waUrl = `https://wa.me/${cleanPhone}?text=${encodedText}`;

  const copyToClipboard = () => {
    navigator.clipboard.writeText(waUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="theme-marketing min-h-screen bg-[var(--color-mark-base)] text-[var(--color-mark-primary)] flex flex-col antialiased relative selection:bg-[var(--color-mark-ink)] selection:text-[var(--color-mark-inverse)]">
      <GrainOverlay />
      <JourneyNav />

      <main className="flex-1 w-full pt-32 pb-24">
        <div className="max-w-4xl mx-auto px-6">
          {/* Header */}
          <div className="text-center mb-12">
            <span className="font-mono text-xs uppercase tracking-widest text-[var(--color-mark-subtle-text)] bg-black/[0.04] px-3 py-1 rounded-full mb-3 inline-block font-semibold">
              Growth Utilities
            </span>
            <h1 className="font-playfair text-4xl md:text-5xl font-bold text-[var(--color-mark-ink)] leading-tight mb-4">
              WhatsApp Link Generator
            </h1>
            <p className="font-inter text-xs md:text-sm text-[var(--color-mark-secondary)] max-w-xl mx-auto leading-relaxed">
              Create instant click-to-chat links with custom pre-filled messages for your Instagram stories, website CTAs, and customer support channels.
            </p>
          </div>

          {/* Generator Tool UI */}
          <div className="bg-white rounded-[2.5rem] border border-[var(--color-mark-default)] p-6 md:p-10 shadow-[0_12px_40px_rgba(26,26,24,0.05)] mb-16">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12">
              
              {/* Inputs */}
              <div className="space-y-6">
                <div className="grid grid-cols-3 gap-4">
                  <div className="col-span-1">
                    <label className="block font-inter text-xs font-bold text-[var(--color-mark-ink)] uppercase tracking-wider mb-2.5">
                      Country Code
                    </label>
                    <input
                      type="text"
                      value={countryCode}
                      onChange={(e) => setCountryCode(e.target.value)}
                      className="block w-full px-4 py-3 bg-white border border-[var(--color-mark-default)] rounded-xl text-sm font-semibold focus:outline-none focus:ring-1 focus:ring-[var(--color-mark-ink)]"
                      placeholder="91"
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="block font-inter text-xs font-bold text-[var(--color-mark-ink)] uppercase tracking-wider mb-2.5">
                      WhatsApp Number
                    </label>
                    <input
                      type="text"
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      className="block w-full px-4 py-3 bg-white border border-[var(--color-mark-default)] rounded-xl text-sm font-semibold focus:outline-none focus:ring-1 focus:ring-[var(--color-mark-ink)]"
                      placeholder="9506212886"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-inter text-xs font-bold text-[var(--color-mark-ink)] uppercase tracking-wider mb-2.5">
                    Pre-filled Message
                  </label>
                  <textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    rows={4}
                    className="block w-full px-4 py-3 bg-white border border-[var(--color-mark-default)] rounded-xl text-sm font-semibold focus:outline-none focus:ring-1 focus:ring-[var(--color-mark-ink)] resize-none"
                    placeholder="Enter message here..."
                  />
                </div>
              </div>

              {/* Outputs */}
              <div className="bg-[var(--color-mark-subtle)] border border-[var(--color-mark-default)] rounded-[2rem] p-6 flex flex-col justify-between">
                <div className="space-y-4">
                  <p className="font-inter text-[10px] font-bold uppercase tracking-wider text-[var(--color-mark-subtle-text)] border-b border-[var(--color-mark-default)] pb-3">
                    Your Shareable Link
                  </p>

                  <div className="bg-white border border-[var(--color-mark-default)] rounded-xl p-4 font-mono text-[11px] break-all max-h-32 overflow-y-auto">
                    {waUrl}
                  </div>

                  <div className="flex gap-3 pt-2">
                    <button
                      onClick={copyToClipboard}
                      className="flex-1 flex justify-center items-center gap-2 bg-[var(--color-mark-ink)] text-white font-inter text-xs font-bold py-3 px-4 rounded-xl hover:bg-black transition-colors"
                    >
                      {copied ? (
                        <>
                          <Check className="w-4 h-4" /> Copied!
                        </>
                      ) : (
                        <>
                          <Copy className="w-4 h-4" /> Copy Link
                        </>
                      )}
                    </button>
                    <a
                      href={waUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex justify-center items-center gap-2 border border-[var(--color-mark-default)] bg-white text-[var(--color-mark-ink)] font-inter text-xs font-bold py-3 px-5 rounded-xl hover:bg-neutral-50 transition-colors"
                    >
                      Test <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>
                </div>

                <div className="mt-6 pt-4 border-t border-[var(--color-mark-default)] text-center text-[10px] text-[var(--color-mark-subtle-text)] leading-relaxed">
                  Use this link on Instagram Bio, Linktree, or website buttons to start quick sales chats.
                </div>
              </div>

            </div>
          </div>

          {/* SEO Content Section */}
          <article className="prose prose-neutral max-w-none text-[var(--color-mark-secondary)] font-inter text-xs leading-relaxed space-y-8">
            <section>
              <h2 className="font-playfair text-2xl font-bold text-[var(--color-mark-ink)] mb-4">How Do WhatsApp Click-to-Chat Links Work?</h2>
              <p className="mb-4">
                WhatsApp's "Click to Chat" feature allows you to start a chat with someone without having their phone number saved in your phone's address book. By generating a link using their custom API structure, your customers can tap a button and immediately open a chat window with your business, pre-loaded with a context message.
              </p>
            </section>

            <section>
              <h2 className="font-playfair text-2xl font-bold text-[var(--color-mark-ink)] mb-4">Benefits of WhatsApp links for D2C</h2>
              <ul className="list-disc pl-6 space-y-2 mt-2">
                <li><strong>Reduce Friction</strong>: Customers hate typing out introductions. Pre-filled messages (e.g. "I want to buy the blue kurta") tell you exactly what the customer wants, allowing for faster response rates.</li>
                <li><strong>Higher Conversion from Ads</strong>: Running Meta "Click to WhatsApp" campaigns redirects traffic directly to chat channels, proving highly effective for Indian lifestyle brands.</li>
                <li><strong>Instagram Bio Optimization</strong>: Putting a WhatsApp link in your Instagram bio allows social media followers to buy directly through chat messages.</li>
              </ul>
            </section>

            <section>
              <h2 className="font-playfair text-2xl font-bold text-[var(--color-mark-ink)] mb-4">Text Formatting on WhatsApp</h2>
              <div className="bg-white border border-[var(--color-mark-default)] rounded-[2rem] p-6 space-y-4 shadow-sm">
                <p>Make your pre-filled messages readable using standard markdown-style parameters:</p>
                <ul className="list-disc pl-6 space-y-2">
                  <li><strong>Bold Text</strong>: Wrap characters with asterisks: `*hello*` becomes <strong>hello</strong>.</li>
                  <li><strong>Italics Text</strong>: Wrap characters with underscores: `_hello_` becomes <em>hello</em>.</li>
                  <li><strong>Strikethrough</strong>: Wrap characters with tildes: `~hello~` becomes <span className="line-through">hello</span>.</li>
                </ul>
              </div>
            </section>

            <section>
              <h2 className="font-playfair text-2xl font-bold text-[var(--color-mark-ink)] mb-4">Frequently Asked Questions (FAQ)</h2>
              <div className="space-y-4">
                <div>
                  <p className="font-bold text-[var(--color-mark-ink)]">Q: Do WhatsApp links charge my account?</p>
                  <p>A: No. Generating and sharing basic click-to-chat links using the `wa.me` syntax is completely free and works globally on all WhatsApp configurations.</p>
                </div>
                <div>
                  <p className="font-bold text-[var(--color-mark-ink)]">Q: Do I need a WhatsApp Business account?</p>
                  <p>A: No. These links work for both standard personal WhatsApp accounts and WhatsApp Business profiles.</p>
                </div>
              </div>
            </section>

            {/* CTA */}
            <div className="bg-[var(--color-mark-subtle)] border border-[var(--color-mark-default)] rounded-[2rem] p-8 text-center mt-12">
              <h3 className="font-playfair text-xl font-bold text-[var(--color-mark-ink)] mb-3">
                Automate Your Customer Interactions Natively
              </h3>
              <p className="mb-6 max-w-xl mx-auto text-xs">
                LaunchGrid offers native WhatsApp integrations. Send automated order confirmations, share tracking details automatically, and configure recovery scripts directly on your own custom domain.
              </p>
              <Link
                href="/onboarding"
                className="inline-flex items-center gap-2 bg-[var(--color-mark-ink)] text-white font-inter text-xs font-bold py-3.5 px-8 rounded-full hover:bg-black transition-all shadow-md"
              >
                Launch Your Integrated Store <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </article>
        </div>
      </main>

      <Footer />
    </div>
  );
}
