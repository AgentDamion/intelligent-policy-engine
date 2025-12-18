import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

const DataProcessing = () => {
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
          <h1 className="text-3xl font-bold text-foreground mb-2">Data Processing Agreement</h1>
          <p className="text-muted-foreground">Last updated: {new Date().toLocaleDateString()}</p>
        </div>

        <div className="prose prose-lg max-w-none">
          <div className="space-y-6 text-foreground">
            <section>
              <h2 className="text-2xl font-semibold mb-4">1. Purpose and Scope</h2>
              <p className="mb-4">
                This Data Processing Agreement ("DPA") governs the processing of personal data by AI Comply 
                in connection with AI governance and compliance services provided to you as the Data Controller.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">2. Definitions</h2>
              <ul className="list-disc pl-6 mb-4 space-y-2">
                <li><strong>Data Controller:</strong> The organization using AI Comply services</li>
                <li><strong>Data Processor:</strong> AI Comply acting on behalf of the Data Controller</li>
                <li><strong>Personal Data:</strong> Any information relating to an identified or identifiable natural person</li>
                <li><strong>Processing:</strong> Any operation performed on personal data</li>
                <li><strong>Data Subject:</strong> The individual to whom personal data relates</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">3. Nature and Purpose of Processing</h2>
              <p className="mb-4">AI Comply processes personal data for the following purposes:</p>
              <ul className="list-disc pl-6 mb-4 space-y-2">
                <li>AI tool usage tracking and compliance monitoring</li>
                <li>Risk assessment and governance reporting</li>
                <li>User authentication and access management</li>
                <li>Audit trail generation and compliance documentation</li>
                <li>Platform analytics and performance optimization</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">4. Categories of Data Subjects</h2>
              <ul className="list-disc pl-6 mb-4 space-y-2">
                <li>Employees and contractors of the Data Controller</li>
                <li>Users of AI tools within the organization</li>
                <li>Third-party collaborators and partners</li>
                <li>Individuals mentioned in AI governance documentation</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">5. Categories of Personal Data</h2>
              <ul className="list-disc pl-6 mb-4 space-y-2">
                <li>Identity information (name, email, job title)</li>
                <li>Professional information (department, role, responsibilities)</li>
                <li>Usage data (AI tool interactions, compliance decisions)</li>
                <li>Technical data (IP addresses, device information, logs)</li>
                <li>Communication data (messages, comments, collaboration records)</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">6. Security Measures</h2>
              <p className="mb-4">AI Comply implements appropriate technical and organizational measures:</p>
              <ul className="list-disc pl-6 mb-4 space-y-2">
                <li>Encryption of data in transit and at rest</li>
                <li>Access controls and authentication mechanisms</li>
                <li>Regular security assessments and audits</li>
                <li>Staff training on data protection</li>
                <li>Incident response and breach notification procedures</li>
                <li>Data backup and recovery systems</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">7. Sub-processors</h2>
              <p className="mb-4">
                AI Comply may engage sub-processors to assist in providing services. All sub-processors are bound by 
                data protection obligations equivalent to those in this DPA.
              </p>
              <p className="mb-4">Current sub-processors include:</p>
              <ul className="list-disc pl-6 mb-4 space-y-2">
                <li>Cloud infrastructure providers (AWS, Google Cloud, Azure)</li>
                <li>Authentication services (Supabase Auth)</li>
                <li>Analytics and monitoring services</li>
                <li>Customer support platforms</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">8. Data Subject Rights</h2>
              <p className="mb-4">
                AI Comply will assist the Data Controller in responding to data subject requests, including:
              </p>
              <ul className="list-disc pl-6 mb-4 space-y-2">
                <li>Right of access</li>
                <li>Right to rectification</li>
                <li>Right to erasure</li>
                <li>Right to restrict processing</li>
                <li>Right to data portability</li>
                <li>Right to object</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">9. Data Transfers</h2>
              <p className="mb-4">
                Personal data may be transferred to countries outside the EEA. AI Comply ensures appropriate 
                safeguards are in place, including:
              </p>
              <ul className="list-disc pl-6 mb-4 space-y-2">
                <li>Standard Contractual Clauses (SCCs)</li>
                <li>Adequacy decisions by the European Commission</li>
                <li>Certification schemes and codes of conduct</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">10. Data Retention</h2>
              <p className="mb-4">
                Personal data will be retained only for as long as necessary for the purposes outlined in this DPA, 
                unless longer retention is required by law or for legitimate business purposes.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">11. Breach Notification</h2>
              <p className="mb-4">
                AI Comply will notify the Data Controller without undue delay upon becoming aware of a personal data breach, 
                and within 72 hours where feasible.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">12. Audits and Compliance</h2>
              <p className="mb-4">
                AI Comply will make available to the Data Controller information necessary to demonstrate compliance 
                with data protection obligations and allow for audits and inspections.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">13. Contact Information</h2>
              <p className="mb-4">
                For questions about this Data Processing Agreement, please contact our Data Protection Officer at dpo@aicomply.io.
              </p>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DataProcessing;