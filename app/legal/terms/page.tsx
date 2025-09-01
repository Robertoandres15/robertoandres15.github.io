"use client"

export default function TermsOfService() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 p-4">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white/10 backdrop-blur-md rounded-xl p-8 border border-white/20">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-white mb-2">Terms of Service</h1>
            <div className="text-slate-300 space-y-1">
              <p>Effective Date: [Insert Date]</p>
              <p>Last Updated: [Insert Date]</p>
            </div>
          </div>

          <div className="prose prose-invert max-w-none space-y-6 text-slate-200">
            <p>
              Welcome to Reel Friends ("App"), operated by [Your Company Name] ("we," "us," or "our"). By accessing or
              using Reel Friends, you agree to these Terms & Conditions ("Terms"). If you do not agree, do not use the
              App.
            </p>

            <section>
              <h2 className="text-xl font-semibold text-white mb-3">1. Eligibility</h2>
              <ul className="space-y-2 list-disc list-inside">
                <li>
                  You must be at least 13 years old (or the minimum digital consent age in your country) to use Reel
                  Friends.
                </li>
                <li>By using the App, you represent that you meet this requirement.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-white mb-3">2. Your Account</h2>
              <ul className="space-y-2 list-disc list-inside">
                <li>You are responsible for keeping your login details secure.</li>
                <li>You agree to provide accurate information when creating your account.</li>
                <li>We may suspend or terminate your account if you violate these Terms.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-white mb-3">3. Use of the App</h2>
              <p className="mb-2">You agree not to:</p>
              <ul className="space-y-2 list-disc list-inside">
                <li>Use the App for illegal purposes.</li>
                <li>Post or share content that is offensive, defamatory, infringing, or harmful.</li>
                <li>Attempt to hack, reverse-engineer, or disrupt the App.</li>
              </ul>
              <p className="mt-2">We may remove content or restrict access at our discretion.</p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-white mb-3">4. Content Ownership</h2>
              <div className="space-y-3">
                <div>
                  <h3 className="font-semibold text-white">Your Content:</h3>
                  <p>
                    You retain ownership of the content you create or share. By submitting content, you grant us a
                    worldwide, non-exclusive, royalty-free license to use, display, and distribute it inside the App for
                    functionality.
                  </p>
                </div>
                <div>
                  <h3 className="font-semibold text-white">Our Content:</h3>
                  <p>
                    All trademarks, branding, software, and design belong to us. You may not copy or use them without
                    permission.
                  </p>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-white mb-3">5. Advertising & Communications</h2>
              <ul className="space-y-2 list-disc list-inside">
                <li>We may use your data to show you advertising only inside the App (never sold to third parties).</li>
                <li>
                  We may send you emails about account updates, changes to these Terms, or marketing. You may opt out of
                  marketing but not essential service notices.
                </li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-white mb-3">6. Disclaimer of Warranties</h2>
              <p>
                The App is provided "as is" and "as available." We make no warranties of any kind, whether express or
                implied, including but not limited to fitness for a particular purpose, reliability, accuracy, or
                availability. Use is at your own risk.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-white mb-3">7. Limitation of Liability</h2>
              <p className="mb-2">To the fullest extent permitted by law:</p>
              <ul className="space-y-2 list-disc list-inside">
                <li>
                  We are not liable for any direct, indirect, incidental, consequential, special, or exemplary damages
                  of any kind whatsoever arising from your use or inability to use the App.
                </li>
                <li>
                  We will not be responsible for any losses, claims, or costs, and we will not pay anything out of
                  pocket under any circumstance.
                </li>
                <li>You agree that your sole and exclusive remedy for any issue with the App is to stop using it.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-white mb-3">8. Indemnification</h2>
              <p>
                You agree to indemnify and hold us harmless from claims, damages, or expenses (including attorneys'
                fees) related to your use of the App or violation of these Terms.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-white mb-3">9. Termination</h2>
              <p>
                We may suspend or terminate your account at any time, for any reason, without notice. After termination,
                your right to use the App ends immediately.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-white mb-3">10. Governing Law</h2>
              <p>
                These Terms are governed by the laws of [Insert State/Country, e.g., Florida, USA], without regard to
                conflict-of-law principles. Disputes will be resolved in the courts of that jurisdiction.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-white mb-3">11. Changes to These Terms</h2>
              <p>
                We may update these Terms at any time. We'll notify you by email or in-App notice. Continued use after
                changes means you accept the new Terms.
              </p>
            </section>
          </div>

          <div className="mt-8 pt-6 border-t border-white/20">
            <button
              onClick={() => window.history.back()}
              className="px-6 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
            >
              Back to Settings
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
