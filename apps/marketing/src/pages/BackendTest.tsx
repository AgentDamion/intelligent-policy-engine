import React from 'react';
import Navigation from '@/components/Navigation';
import BackendTest from '@/components/BackendTest';
import Footer from '@/components/Footer';

const BackendTestPage = () => {
  return (
    <div className="min-h-screen bg-white">
      <Navigation />
      <div className="pt-20 pb-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h1 className="text-4xl lg:text-6xl font-bold text-gray-900 mb-6">
              Backend Connection Test
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Test connectivity between Lovable and your Cursor backend running on localhost:3000
            </p>
          </div>
          <BackendTest />
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default BackendTestPage;