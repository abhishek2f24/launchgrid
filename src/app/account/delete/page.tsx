import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Delete Account – LaunchGrid',
  description: 'How to permanently delete your LaunchGrid merchant account and associated data.',
};

export default function DeleteAccountPage() {
  return (
    <div className="min-h-screen bg-white text-black font-inter antialiased">
      <nav className="w-full p-6 border-b border-black/10 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded bg-black text-white flex items-center justify-center font-bold text-xs">
            LG
          </div>
          <span className="font-bold text-lg tracking-tight text-black">LaunchGrid</span>
        </Link>
        <Link href="/login" className="text-sm font-medium hover:underline">
          Sign in
        </Link>
      </nav>

      <main className="max-w-2xl mx-auto py-16 px-6">
        <h1 className="text-3xl font-extrabold text-black mb-2">Delete Your Account</h1>
        <p className="text-sm text-gray-500 mb-10">LaunchGrid · Last updated June 2026</p>

        <div className="space-y-10 text-[15px] leading-relaxed text-gray-800">

          <section>
            <h2 className="text-lg font-bold text-black mb-3">What gets deleted</h2>
            <ul className="space-y-2 list-none pl-0">
              {[
                'Your merchant account and login credentials',
                'Your store name, subdomain, and storefront',
                'All products, variants, and product images',
                'All orders and order history',
                'Payment configuration (UPI ID, Razorpay keys)',
                'Business details (business name, GSTIN, WhatsApp number)',
                'Push notification device registrations',
                'Store analytics and visitor event data',
              ].map((item) => (
                <li key={item} className="flex items-start gap-2">
                  <span className="mt-1 w-4 h-4 rounded-full bg-red-100 flex items-center justify-center shrink-0 text-red-600 text-[10px] font-bold">✕</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold text-black mb-3">What is retained</h2>
            <ul className="space-y-2 list-none pl-0">
              <li className="flex items-start gap-2">
                <span className="mt-1 w-4 h-4 rounded-full bg-amber-100 flex items-center justify-center shrink-0 text-amber-700 text-[10px] font-bold">!</span>
                <span>
                  <strong>Account data</strong> — retained for up to 90 days after deletion to resolve
                  disputes and legal obligations, then permanently erased.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-1 w-4 h-4 rounded-full bg-amber-100 flex items-center justify-center shrink-0 text-amber-700 text-[10px] font-bold">!</span>
                <span>
                  <strong>Order and financial records</strong> — may be retained beyond 90 days where
                  Indian tax law (GST) requires it (typically 6–8 years), in anonymised or
                  aggregated form only.
                </span>
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold text-black mb-4">How to delete your account</h2>

            <div className="mb-6">
              <p className="font-semibold text-black mb-3">Option 1 — Android app (fastest)</p>
              <ol className="space-y-3 list-none pl-0 counter-reset-none">
                {[
                  'Open the LaunchGrid app on your Android device.',
                  'Tap the Settings tab (bottom navigation).',
                  'Scroll to the Account section and tap Delete account.',
                  'Type DELETE in the confirmation field.',
                  'Tap Permanently delete my account.',
                ].map((step, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <span className="w-6 h-6 rounded-full bg-black text-white flex items-center justify-center shrink-0 text-xs font-extrabold mt-0.5">
                      {i + 1}
                    </span>
                    <span>{step}</span>
                  </li>
                ))}
              </ol>
            </div>

            <div>
              <p className="font-semibold text-black mb-3">Option 2 — Email request</p>
              <p>
                Send an email to{' '}
                <a href="mailto:privacy@launchgrid.in" className="font-semibold text-black underline">
                  privacy@launchgrid.in
                </a>{' '}
                with the subject line <strong>Account Deletion Request</strong> from the email
                address linked to your account. We will process the request within 7 business days
                and confirm by reply.
              </p>
            </div>
          </section>

          <section className="bg-gray-50 border border-gray-100 rounded-2xl p-6">
            <h2 className="text-base font-bold text-black mb-2">This action is permanent</h2>
            <p className="text-sm text-gray-600">
              Once your account is deleted it cannot be recovered. Your store URL will stop
              working immediately. If you have an active subscription, cancelling it separately
              via your payment provider will stop any future charges.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-black mb-2">Questions?</h2>
            <p>
              Write to{' '}
              <a href="mailto:privacy@launchgrid.in" className="font-semibold text-black underline">
                privacy@launchgrid.in
              </a>
              . We acknowledge all requests within 48 hours.
            </p>
          </section>

        </div>
      </main>
    </div>
  );
}
