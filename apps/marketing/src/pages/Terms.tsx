import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

const Terms = () => {
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
          <h1 className="text-3xl font-bold text-foreground mb-2">Terms of Service</h1>
          <p className="text-muted-foreground">Last updated: {new Date().toLocaleDateString()}</p>
        </div>

        <div className="prose prose-lg max-w-none">
          <div className="space-y-6 text-foreground">
            <section>
              <h2 className="text-2xl font-semibold mb-4">1. Acceptance of Terms</h2>
              <p className="mb-4">
                By accessing or using AI Comply ("Service"), you agree to be bound by these Terms of Service ("Terms"). 
                If you disagree with any part of these terms, you may not access the Service.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">2. Description of Service</h2>
              <p className="mb-4">
                AI Comply is a comprehensive AI Tools Compliance, Governance and Management platform that helps organizations:
              </p>
              <ul className="list-disc pl-6 mb-4 space-y-2">
                <li>Track and manage AI tool usage across their organization</li>
                <li>Ensure compliance with AI governance policies</li>
                <li>Monitor and assess risks associated with AI tools</li>
                <li>Generate compliance reports and audit trails</li>
                <li>Collaborate on AI governance decisions</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">3. User Accounts</h2>
              <p className="mb-4">
                When you create an account with us, you must provide information that is accurate, complete, and current at all times. 
                You are responsible for safeguarding the password and for all activities that occur under your account.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">4. Acceptable Use</h2>
              <p className="mb-4">
                You may use our Service only for lawful purposes and in accordance with these Terms. You agree not to use the Service:
              </p>
              <ul className="list-disc pl-6 mb-4 space-y-2">
                <li>In any way that violates any applicable federal, state, local, or international law or regulation</li>
                <li>To transmit, or procure the sending of, any advertising or promotional material, or any other form of similar solicitation</li>
                <li>To impersonate or attempt to impersonate the Company, a Company employee, another user, or any other person or entity</li>
                <li>To engage in any other conduct that restricts or inhibits anyone's use or enjoyment of the Service</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">5. Data and Privacy</h2>
              <p className="mb-4">
                Your privacy is important to us. Please review our Privacy Policy, which also governs your use of the Service, 
                to understand our practices regarding the collection and use of your information.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">6. Intellectual Property Rights</h2>
              <p className="mb-4">
                The Service and its original content, features, and functionality are and will remain the exclusive property of 
                AI Comply and its licensors. The Service is protected by copyright, trademark, and other laws.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">7. Termination</h2>
              <p className="mb-4">
                We may terminate or suspend your account immediately, without prior notice or liability, for any reason whatsoever, 
                including without limitation if you breach the Terms.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">8. Limitation of Liability</h2>
              <p className="mb-4">
                In no event shall AI Comply, nor its directors, employees, partners, agents, suppliers, or affiliates, 
                be liable for any indirect, incidental, special, consequential, or punitive damages, including without limitation, 
                loss of profits, data, use, goodwill, or other intangible losses.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">9. Changes to Terms</h2>
              <p className="mb-4">
                We reserve the right, at our sole discretion, to modify or replace these Terms at any time. 
                If a revision is material, we will try to provide at least 30 days notice prior to any new terms taking effect.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">10. Contact Information</h2>
              <p className="mb-4">
                If you have any questions about these Terms of Service, please contact us at legal@aicomply.io.
              </p>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Terms;