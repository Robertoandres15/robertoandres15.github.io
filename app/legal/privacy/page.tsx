"use client"

import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import { useRouter } from "next/navigation"

export default function PrivacyPolicyPage() {
  const router = useRouter()

  return (
    <div className="min-h-screen bg-slate-900 text-white">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Button variant="ghost" size="sm" onClick={() => router.back()} className="text-slate-400 hover:text-white">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-white">Privacy Policy</h1>
            <p className="text-slate-400 mt-1">Effective Date: 9/1/2025 | Last Updated: 9/1/2025</p>
          </div>
        </div>

        {/* Content */}
        <div className="prose prose-invert max-w-none">
          <div className="bg-slate-800/50 rounded-lg p-6 mb-6">
            <p className="text-slate-300 leading-relaxed">
              This Privacy Policy explains how Reel Friends ("we," "us," "our") collects, uses, and protects your
              information when you use our mobile application ("App").
            </p>
          </div>

          <div className="space-y-8">
            <section>
              <h2 className="text-xl font-semibold text-purple-400 mb-4">1. Information We Collect</h2>
              <div className="text-slate-300 space-y-3">
                <p>We may collect:</p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>
                    <strong>Account Information:</strong> Name, username, email address, profile details.
                  </li>
                  <li>
                    <strong>Usage Information:</strong> Movies you search, lists you create, and in-app activity.
                  </li>
                  <li>
                    <strong>Device Information:</strong> IP address, device type, operating system.
                  </li>
                  <li>
                    <strong>Communications:</strong> Emails or messages you send us.
                  </li>
                </ul>
              </div>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-purple-400 mb-4">2. How We Use Your Information</h2>
              <div className="text-slate-300 space-y-3">
                <p>We use your information to:</p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>Provide and improve the App's functionality.</li>
                  <li>Personalize your in-app experience, including showing ads only within the app.</li>
                  <li>Send you service-related emails (account updates, security notices).</li>
                  <li>Send you promotional emails about new features and offers (you may opt out at any time).</li>
                </ul>
              </div>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-purple-400 mb-4">3. Sharing of Information</h2>
              <div className="text-slate-300 space-y-3">
                <p>We do not sell your personal information to third parties. We may share data only with:</p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>Service providers who help us operate the App (e.g., cloud hosting, analytics).</li>
                  <li>Legal authorities if required by law.</li>
                </ul>
              </div>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-purple-400 mb-4">4. Data Retention</h2>
              <p className="text-slate-300">
                We retain your information as long as you maintain an account. You may request deletion of your account
                and associated data by contacting us at [Insert Email].
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-purple-400 mb-4">5. Security</h2>
              <p className="text-slate-300">
                We use reasonable safeguards (encryption, access controls) to protect your information, but no system is
                100% secure.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-purple-400 mb-4">6. Your Rights</h2>
              <p className="text-slate-300">
                Depending on your location, you may have rights to access, update, or delete your personal information.
                Contact us at [Insert Email] to exercise these rights.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-purple-400 mb-4">7. Children's Privacy</h2>
              <p className="text-slate-300">
                We do not knowingly collect data from children under 13. If we discover such data, we will delete it
                immediately.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-purple-400 mb-4">8. Changes to This Privacy Policy</h2>
              <p className="text-slate-300">
                We may update this Privacy Policy from time to time. If changes are material, we will notify you by
                email or in-app notice.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-purple-400 mb-4">9. Contact Us</h2>
              <p className="text-slate-300">
                If you have questions about this Privacy Policy or your data, please contact us at:{" "}
                <a href="mailto:wittysticker@gmail.com" className="text-purple-400 hover:text-purple-300 underline">
                  wittysticker@gmail.com
                </a>
              </p>
            </section>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-12 pt-8 border-t border-slate-700">
          <div className="flex justify-between items-center">
            <p className="text-slate-400 text-sm">© 2025 Reel Friends. All rights reserved.</p>
            <Button
              variant="outline"
              onClick={() => router.push("/settings")}
              className="border-purple-600 text-purple-400 hover:bg-purple-600 hover:text-white"
            >
              Back to Settings
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
