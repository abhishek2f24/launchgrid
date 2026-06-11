'use client';

import { useState, useRef } from 'react';
import { JourneyNav } from '@/components/signup-journey/JourneyNav';
import { GrainOverlay } from '@/components/ui-landing/GrainOverlay';
import { Footer } from '@/components/signup-journey/Footer';

export default function SupportPage() {
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const nameRef = useRef<HTMLInputElement>(null);
  const emailRef = useRef<HTMLInputElement>(null);
  const messageRef = useRef<HTMLTextAreaElement>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const name = nameRef.current?.value?.trim() || '';
    const email = emailRef.current?.value?.trim() || '';
    const message = messageRef.current?.value?.trim() || '';

    try {
      const res = await fetch('/api/support/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, message }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to send message');
      }

      setSubmitted(true);
    } catch (err: any) {
      setError(err.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="theme-marketing min-h-screen bg-[var(--color-mark-base)] text-[var(--color-mark-primary)] flex flex-col antialiased relative selection:bg-[var(--color-mark-ink)] selection:text-[var(--color-mark-inverse)]">
      <GrainOverlay />
      <JourneyNav />

      <main className="flex-1 w-full pt-32 pb-24">
        <div className="max-w-xl mx-auto px-6">

          {/* Header */}
          <div className="text-center mb-12">
            <span className="font-mono text-xs uppercase tracking-widest text-[var(--color-mark-muted)] mb-3 block">
              Help Center
            </span>
            <h1 className="font-playfair text-4xl font-bold text-[var(--color-mark-ink)] leading-tight mb-4">
              How can we help you today?
            </h1>
            <p className="font-inter text-sm text-[var(--color-mark-secondary)]">
              Have questions about your subscription, store domain, or delivery setup? Get in touch with our support team.
            </p>
          </div>

          {/* Contact Form */}
          <div className="bg-white border border-[var(--color-mark-default)] rounded-[2rem] p-8 md:p-10 shadow-[0_8px_32px_rgba(26,26,24,0.02)]">
            {submitted ? (
              <div className="text-center py-8">
                <span className="text-4xl mb-4 block">✉️</span>
                <h3 className="font-playfair text-xl font-bold text-[var(--color-mark-ink)] mb-2">Message Received</h3>
                <p className="font-inter text-xs md:text-sm text-[var(--color-mark-secondary)] leading-relaxed">
                  Thank you for reaching out. We have opened a support ticket and will get back to you within 2–4 hours. Check your inbox for a confirmation email.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label className="block font-inter font-bold text-xs uppercase text-[var(--color-mark-ink)] mb-2">
                    Full Name
                  </label>
                  <input
                    ref={nameRef}
                    type="text"
                    required
                    placeholder="Rahul Sharma"
                    className="w-full px-4 py-3 rounded-xl border border-[var(--color-mark-default)] focus:border-[var(--color-mark-ink)] focus:outline-none font-inter text-sm"
                  />
                </div>

                <div>
                  <label className="block font-inter font-bold text-xs uppercase text-[var(--color-mark-ink)] mb-2">
                    Email Address
                  </label>
                  <input
                    ref={emailRef}
                    type="email"
                    required
                    placeholder="rahul@example.com"
                    className="w-full px-4 py-3 rounded-xl border border-[var(--color-mark-default)] focus:border-[var(--color-mark-ink)] focus:outline-none font-inter text-sm"
                  />
                </div>

                <div>
                  <label className="block font-inter font-bold text-xs uppercase text-[var(--color-mark-ink)] mb-2">
                    Message / Question
                  </label>
                  <textarea
                    ref={messageRef}
                    rows={4}
                    required
                    placeholder="Describe your issue or question..."
                    className="w-full px-4 py-3 rounded-xl border border-[var(--color-mark-default)] focus:border-[var(--color-mark-ink)] focus:outline-none font-inter text-sm resize-none"
                  />
                </div>

                {error && (
                  <p className="font-inter text-xs text-red-600 bg-red-50 border border-red-100 rounded-lg px-4 py-2">
                    {error}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-[var(--color-mark-ink)] text-white font-inter text-xs font-bold py-4 px-6 rounded-full hover:bg-black transition-all shadow-md disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {loading ? 'Sending…' : 'Submit Request'}
                </button>
              </form>
            )}
          </div>

          {/* Quick Contact Links */}
          <div className="mt-8 text-center">
            <p className="font-inter text-xs text-[var(--color-mark-secondary)]">
              Prefer direct email? Reach out to us at{' '}
              <a href="mailto:support@launchgrid.in" className="font-bold underline text-[var(--color-mark-ink)]">
                support@launchgrid.in
              </a>
            </p>
          </div>

        </div>
      </main>

      <Footer />
    </div>
  );
}
