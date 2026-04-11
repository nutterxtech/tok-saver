export default function Privacy() {
  return (
    <div className="flex-1 container mx-auto px-4 py-12 max-w-3xl">
      <h1 className="text-3xl font-bold mb-2">Privacy Policy</h1>
      <p className="text-muted-foreground text-sm mb-8">Last updated: April 11, 2026</p>

      <div className="prose prose-invert max-w-none space-y-6 text-foreground/80 leading-relaxed">
        <section>
          <h2 className="text-xl font-semibold text-foreground mb-2">1. Who We Are</h2>
          <p>
            TokSaver ("we", "our", "us") is a web service that allows users to download TikTok videos
            without watermarks. We are operated by NutterX Tech and can be reached at{" "}
            <a href="mailto:nutterxtech@gmail.com" className="text-primary hover:underline">
              nutterxtech@gmail.com
            </a>
            .
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-foreground mb-2">2. Information We Collect</h2>
          <ul className="list-disc list-inside space-y-1">
            <li><strong>Account data:</strong> Name, email address, phone number, and password (stored as a secure hash — we never store your plain-text password).</li>
            <li><strong>Usage data:</strong> The TikTok URLs you submit for download, timestamps, and basic request logs.</li>
            <li><strong>Device data:</strong> Browser type, operating system, and IP address for security and abuse prevention.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-foreground mb-2">3. How We Use Your Information</h2>
          <ul className="list-disc list-inside space-y-1">
            <li>To create and manage your account.</li>
            <li>To process video download requests.</li>
            <li>To send transactional emails (e.g. email verification, password resets).</li>
            <li>To detect and prevent fraud and abuse.</li>
            <li>To improve our service.</li>
          </ul>
          <p className="mt-2">We do not sell your personal data to third parties.</p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-foreground mb-2">4. Phone Number</h2>
          <p>
            Your phone number is collected solely for account security and abuse prevention purposes.
            We do not use it for marketing or share it with third parties.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-foreground mb-2">5. Data Retention</h2>
          <p>
            We retain your account data for as long as your account is active. You may request
            deletion of your account and associated data at any time by emailing us.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-foreground mb-2">6. Security</h2>
          <p>
            We use industry-standard security practices including password hashing, HTTPS encryption,
            and email verification to protect your account. However, no system is 100% secure —
            please use a strong, unique password.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-foreground mb-2">7. Your Rights</h2>
          <p>
            You have the right to access, correct, or delete your personal data. To exercise these
            rights, contact us at{" "}
            <a href="mailto:nutterxtech@gmail.com" className="text-primary hover:underline">
              nutterxtech@gmail.com
            </a>
            .
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-foreground mb-2">8. Changes to This Policy</h2>
          <p>
            We may update this policy from time to time. Significant changes will be communicated
            via email or a notice on our site.
          </p>
        </section>
      </div>
    </div>
  );
}
