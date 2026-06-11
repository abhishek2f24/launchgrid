export default function PrivacyPage() {
  return (
    <>
      <h1>Privacy Policy</h1>
      <p><strong>Effective Date:</strong> June 11, 2026</p>

      <h2>1. Who we are</h2>
      <p>LaunchGrid (&ldquo;we&rdquo;, &ldquo;us&rdquo;) provides an ecommerce platform that lets merchants create and operate online stores. This policy explains what data we collect, why, and your rights under the Digital Personal Data Protection Act, 2023 (DPDP Act).</p>

      <h2>2. Data we collect</h2>
      <p><strong>Merchant account data:</strong> name, email, password (hashed), business name, GSTIN (if provided), WhatsApp number, and payment configuration (UPI ID; Razorpay keys are stored encrypted).</p>
      <p><strong>Store visitor data (on merchant storefronts):</strong> anonymous usage events (page views, product views, cart activity), a random session identifier, referrer URL, and campaign (UTM) parameters. We do not require store visitors to create accounts.</p>
      <p><strong>Buyer order data:</strong> name, phone, email, and delivery address — collected at checkout solely to fulfil the order, and shared with the merchant you are buying from.</p>

      <h2>3. Roles under the DPDP Act</h2>
      <p>For merchant account data, LaunchGrid is the <strong>Data Fiduciary</strong>. For end-customer data collected through a merchant&apos;s store, LaunchGrid acts as a <strong>Data Processor</strong> on behalf of the merchant, who is the Data Fiduciary for their customers.</p>

      <h2>4. Cookies, analytics & advertising</h2>
      <p>We use essential cookies to keep you logged in. On our own marketing pages we use Google Tag Manager and analytics tools to understand how visitors use the site and to measure advertising campaigns. You can decline non-essential cookies via the consent banner.</p>
      <p><strong>Merchant storefronts:</strong> merchants may connect their own Meta Pixel or Google Analytics to their store. When a merchant enables these, standard ecommerce events (product views, cart adds, purchases) on that store are sent to the merchant&apos;s ad accounts under the merchant&apos;s own privacy responsibility. Look for the store&apos;s own privacy policy linked in its footer.</p>

      <h2>5. Third-party processors</h2>
      <p>We share data only with service providers needed to run the platform: Supabase (database hosting), Vercel (web hosting), Razorpay (payment processing), Resend (transactional email), and Sentry (error monitoring). Each processes data under contract and only on our instructions. We never sell personal data.</p>

      <h2>6. Retention</h2>
      <p>Account data is retained while your account is active and for up to 90 days after deletion to handle disputes and legal obligations. Order records may be retained longer where tax law (GST) requires it.</p>

      <h2>7. Your rights</h2>
      <p>You may request access, correction, or erasure of your personal data, withdraw consent, or nominate a representative, by writing to <strong>privacy@launchgrid.in</strong>. We respond within 30 days.</p>

      <h2>8. Grievance Officer</h2>
      <p>As required by the DPDP Act and IT Rules, grievances may be addressed to our Grievance Officer at <strong>grievance@launchgrid.in</strong>. We acknowledge complaints within 48 hours and resolve them within 30 days.</p>

      <h2>9. Changes</h2>
      <p>We will notify registered merchants by email of material changes to this policy. Continued use after changes take effect constitutes acceptance.</p>
    </>
  );
}
