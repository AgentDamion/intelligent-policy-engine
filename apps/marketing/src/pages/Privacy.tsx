import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

const Privacy = () => {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="mb-8">
          <Link to="/">
            <Button variant="ghost" className="mb-4">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Home
            </Button>
          </Link>
          <h1 className="text-3xl font-bold text-foreground mb-2">Privacy Policy</h1>
          <p className="text-muted-foreground">Last updated: {new Date().toLocaleDateString()}</p>
        </div>

        <div className="prose prose-lg max-w-none">
          <div className="space-y-6 text-foreground">
            <section>
              <h2 className="text-2xl font-semibold mb-4">1. Information We Collect</h2>
              <p className="mb-4">
                We collect information you provide directly to us, such as when you create an account, 
                use our services, or contact us for support.
              </p>
              
              <h3 className="text-xl font-semibold mb-3">Personal Information</h3>
              <ul className="list-disc pl-6 mb-4 space-y-2">
                <li>Name and contact information (email, phone number)</li>
                <li>Account credentials and authentication information</li>
                <li>Profile information and preferences</li>
                <li>Payment and billing information</li>
              </ul>

              <h3 className="text-xl font-semibold mb-3">Usage Information</h3>
              <ul className="list-disc pl-6 mb-4 space-y-2">
                <li>AI tool usage data and compliance metrics</li>
                <li>Platform interaction logs and analytics</li>
                <li>Communication and collaboration data</li>
                <li>Technical data (IP address, browser type, device information)</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">2. How We Use Your Information</h2>
              <p className="mb-4">We use the information we collect to:</p>
              <ul className="list-disc pl-6 mb-4 space-y-2">
                <li>Provide, maintain, and improve our AI compliance platform</li>
                <li>Process transactions and send related information</li>
                <li>Send technical notices, updates, and security alerts</li>
                <li>Respond to your comments, questions, and customer service requests</li>
                <li>Generate compliance reports and analytics</li>
                <li>Detect, investigate, and prevent fraudulent transactions and other illegal activities</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">3. Information Sharing and Disclosure</h2>
              <p className="mb-4">
                We do not sell, trade, or otherwise transfer your personal information to third parties without your consent, 
                except as described in this policy:
              </p>
              <ul className="list-disc pl-6 mb-4 space-y-2">
                <li>With your explicit consent</li>
                <li>To comply with legal obligations</li>
                <li>To protect our rights and prevent fraud</li>
                <li>With service providers who assist in our operations</li>
                <li>In connection with a merger, acquisition, or sale of assets</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">4. Data Security</h2>
              <p className="mb-4">
                We implement appropriate technical and organizational measures to protect your personal information against 
                unauthorized or unlawful processing, accidental loss, destruction, or damage.
              </p>
              <ul className="list-disc pl-6 mb-4 space-y-2">
                <li>End-to-end encryption for sensitive data</li>
                <li>Regular security audits and penetration testing</li>
                <li>Access controls and authentication measures</li>
                <li>Secure data centers and infrastructure</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">5. Data Retention</h2>
              <p className="mb-4">
                We retain your personal information for as long as necessary to provide our services, 
                comply with legal obligations, resolve disputes, and enforce our agreements.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">6. Your Rights</h2>
              <p className="mb-4">Depending on your location, you may have the following rights:</p>
              <ul className="list-disc pl-6 mb-4 space-y-2">
                <li>Access to your personal information</li>
                <li>Correction of inaccurate information</li>
                <li>Deletion of your personal information</li>
                <li>Restriction of processing</li>
                <li>Data portability</li>
                <li>Objection to processing</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">7. International Transfers</h2>
              <p className="mb-4">
                Your information may be transferred to and processed in countries other than your country of residence. 
                We ensure appropriate safeguards are in place to protect your information.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">8. Changes to This Policy</h2>
              <p className="mb-4">
                We may update this Privacy Policy from time to time. We will notify you of any changes by posting 
                the new Privacy Policy on this page and updating the "Last updated" date.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">9. Contact Us</h2>
              <p className="mb-4">
                If you have any questions about this Privacy Policy, please contact us at privacy@aicomply.io.
              </p>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Privacy;