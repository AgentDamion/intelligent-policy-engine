import React from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Quote } from 'lucide-react';

const PremiumTestimonials = () => {
  const testimonials = [
    {
      quote: "aicomplyr.io turned our governance bottleneck into a competitive edge. We reduced approval cycles by 60% and saved over $12M in delayed launch costs.",
      author: "Sarah Chen",
      role: "Chief Digital Officer",
      company: "Fortune 500 Pharmaceutical"
    },
    {
      quote: "The zero-trust architecture and local deployment options were game-changers. We finally have enterprise-grade AI governance that regulators love.",
      author: "Michael Rodriguez",
      role: "VP Compliance",
      company: "Global Financial Services"
    },
    {
      quote: "By proving AI compliance upfront, we've become the preferred partner for regulated brands and grown our agency revenue by 30%.",
      author: "Emma Thompson",
      role: "Managing Director", 
      company: "Global Marketing Agency"
    }
  ];

  return (
    <section className="py-16 lg:py-24 bg-gradient-to-br from-slate-900 via-slate-800 to-blue-900 text-white relative overflow-hidden">
      {/* Background decorative elements */}
      <div className="absolute inset-0">
        <div className="absolute top-20 left-10 w-72 h-72 bg-gradient-to-r from-teal-500/10 to-cyan-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-gradient-to-r from-purple-500/10 to-pink-500/10 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-gradient-to-r from-yellow-500/5 to-orange-500/5 rounded-full blur-2xl" />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Section Header */}
        <div className="text-center mb-16">
          <motion.div 
            className="inline-flex items-center gap-2 brand-coral-gradient/20 backdrop-blur-sm border border-brand-coral/30 text-brand-coral px-6 py-3 rounded-full font-semibold text-sm mb-6"
            initial={{ opacity: 0, scale: 0.8 }}
            whileInView={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
          >
            <Quote className="w-4 h-4" />
            TRUSTED BY INDUSTRY LEADERS
          </motion.div>
          
          <motion.h2 
            className="text-3xl lg:text-4xl font-bold mb-4"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            Enterprise Success{' '}
            <span className="brand-gradient-text">
              Stories
            </span>
          </motion.h2>
          
          <motion.p 
            className="text-xl text-slate-300 max-w-3xl mx-auto"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            See how Fortune 500 companies transformed compliance into competitive advantage
          </motion.p>
        </div>

        {/* Testimonials Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {testimonials.map((testimonial, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: index * 0.2 }}
              whileHover={{ y: -8 }}
              className="group"
            >
              <Card className="h-full bg-white/10 backdrop-blur-lg border border-white/20 hover:border-white/30 transition-all duration-500 relative overflow-hidden angular-hover">
                {/* Glass morphism overlay */}
                <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                
                <CardContent className="p-8 relative z-10">
                  {/* Large quotation mark */}
                  <div className="relative mb-6">
                    <Quote 
                      className="w-16 h-16 text-transparent bg-gradient-to-r from-yellow-400 to-orange-500 bg-clip-text opacity-30 absolute -top-2 -left-2" 
                      style={{ 
                        fill: 'url(#gradient-quote)',
                        strokeWidth: 0
                      }}
                    />
                    <svg width="0" height="0">
                      <defs>
                        <linearGradient id="gradient-quote" x1="0%" y1="0%" x2="100%" y2="100%">
                          <stop offset="0%" stopColor="#fbbf24" />
                          <stop offset="100%" stopColor="#f59e0b" />
                        </linearGradient>
                      </defs>
                    </svg>
                    <Quote className="w-12 h-12 text-brand-coral relative z-10" />
                  </div>
                  
                  {/* Testimonial text */}
                  <blockquote className="text-white/90 text-lg leading-relaxed mb-8 italic font-light">
                    "{testimonial.quote}"
                  </blockquote>
                  
                  {/* Author information */}
                  <div className="mt-auto">
                    <div className="font-semibold text-lg mb-1 text-brand-coral">
                      {testimonial.author}
                    </div>
                    <div className="text-white/80 font-medium">
                      {testimonial.role}
                    </div>
                    <div className="text-white/60 text-sm mt-1">
                      {testimonial.company}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Security Badges */}
        <motion.div 
          className="mt-20 pt-12 border-t border-white/20"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.8 }}
        >
          <div className="text-center mb-8">
            <h3 className="text-xl font-semibold text-white/90 mb-2">
              Enterprise-Grade Security & Compliance
            </h3>
            <p className="text-white/60 text-sm">
              Trusted by the world's most regulated industries
            </p>
          </div>
          
          <div className="flex flex-wrap justify-center items-center gap-8">
            {[
              'SOC 2 Type II Certified',
              'HIPAA Compliant', 
              'ISO 27001 Certified',
              'GDPR Ready',
              'FedRAMP Authorized'
            ].map((badge, index) => (
              <motion.div 
                key={badge}
                className="flex items-center gap-2 text-sm text-white/70 bg-white/5 backdrop-blur-sm px-4 py-2 rounded-full border border-white/10"
                initial={{ opacity: 0, scale: 0.8 }}
                whileInView={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.4, delay: 0.9 + index * 0.1 }}
                whileHover={{ scale: 1.05 }}
              >
                <div className="w-2 h-2 bg-emerald-400 rounded-full"></div>
                {badge}
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default PremiumTestimonials;