export default function Terms() {
  return (
    <div className="flex-1 container mx-auto px-4 py-12 max-w-3xl">
      <h1 className="text-3xl font-bold mb-2">Terms of Service</h1>
      <p className="text-muted-foreground text-sm mb-8">Last updated: April 11, 2026</p>

      <div className="prose prose-invert max-w-none space-y-6 text-foreground/80 leading-relaxed">
        <section>
          <h2 className="text-xl font-semibold text-foreground mb-2">1. Acceptance of Terms</h2>
          <p>
            By creating an account or using TokSaver ("the Service"), you agree to these Terms of
            Service. If you do not agree, do not use the Service.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-foreground mb-2">2. Description of Service</h2>
          <p>
            TokSaver allows users to download publicly available TikTok videos for personal,
            non-commercial use. The Service is provided by NutterX Tech.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-foreground mb-2">3. Acceptable Use</h2>
          <p>You agree to use TokSaver only for lawful purposes. You must not:</p>
          <ul className="list-disc list-inside space-y-1 mt-2">
            <li>Download content you do not have the right to download.</li>
            <li>Use the Service to infringe on copyright or intellectual property rights.</li>
            <li>Attempt to reverse-engineer, scrape, or abuse the Service.</li>
            <li>Use the Service for any commercial redistribution of downloaded content.</li>
            <li>Create multiple accounts to bypass download limits.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-foreground mb-2">4. Intellectual Property</h2>
          <p>
            TokSaver does not host TikTok content. All videos remain the property of their original
            creators. Downloaded content should only be used for personal, private use in accordance
            with TikTok's terms and applicable copyright law.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-foreground mb-2">5. Subscriptions and Payments</h2>
          <p>
            Free accounts are subject to download limits. Pro subscriptions unlock higher limits.
            Subscription fees are billed as described on the Subscribe page. Refunds are handled
            on a case-by-case basis — contact us within 7 days of a charge if you have an issue.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-foreground mb-2">6. Account Termination</h2>
          <p>
            We reserve the right to suspend or terminate accounts that violate these terms, engage
            in abuse, or for any other reason at our discretion. You may delete your account at
            any time by contacting us.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-foreground mb-2">7. Disclaimer of Warranties</h2>
          <p>
            The Service is provided "as is" without warranties of any kind. We do not guarantee
            uninterrupted access or that all TikTok videos will be downloadable at all times.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-foreground mb-2">8. Limitation of Liability</h2>
          <p>
            To the maximum extent permitted by law, TokSaver shall not be liable for any indirect,
            incidental, or consequential damages arising from your use of the Service.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-foreground mb-2">9. Contact</h2>
          <p>
            For questions about these terms, email us at{" "}
            <a href="mailto:nutterxtech@gmail.com" className="text-primary hover:underline">
              nutterxtech@gmail.com
            </a>
            .
          </p>
        </section>
      </div>
    </div>
  );
}
