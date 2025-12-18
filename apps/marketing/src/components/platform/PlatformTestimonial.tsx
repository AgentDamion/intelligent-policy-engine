
import React from 'react';
import { Star, Quote } from 'lucide-react';

const PlatformTestimonial = () => {
  const testimonial = {
    content: "The platform transformed our entire AI governance process. What used to take our team weeks now happens in minutes, and we have complete visibility into every decision. The human-in-the-loop approach gives us confidence that nothing slips through the cracks.",
    author: "Dr. Michael Rodriguez",
    role: "Head of AI Ethics & Compliance",
    company: "MedTech Innovations",
    avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face"
  };

  return (
    <section className="py-16 lg:py-24 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-2xl p-8 lg:p-12 shadow-sm">
          <div className="max-w-4xl mx-auto">
            <div className="flex items-center justify-center mb-6">
              <Quote className="h-12 w-12 text-teal mb-4" />
            </div>
            
            <blockquote className="text-2xl lg:text-3xl font-medium text-gray-900 text-center mb-8 leading-relaxed">
              "{testimonial.content}"
            </blockquote>
            
            <div className="flex items-center justify-center space-x-4">
              <img
                src={testimonial.avatar}
                alt={testimonial.author}
                className="w-16 h-16 rounded-full object-cover"
              />
              <div className="text-left">
                <div className="font-semibold text-gray-900">{testimonial.author}</div>
                <div className="text-gray-600">{testimonial.role}</div>
                <div className="text-teal font-medium">{testimonial.company}</div>
              </div>
            </div>
            
            <div className="flex items-center justify-center mt-6">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="h-5 w-5 text-yellow-400 fill-current" />
              ))}
              <span className="ml-2 text-gray-600">5.0 out of 5</span>
            </div>
          </div>
        </div>

        {/* Pricing Teaser */}
        <div className="mt-16 text-center">
          <div className="bg-gradient-to-r from-teal/10 to-orange/10 rounded-xl p-8 max-w-2xl mx-auto">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">
              Ready to Get Started?
            </h3>
            <p className="text-gray-600 mb-6">
              Flexible pricing plans for teams of all sizes, from startups to enterprise.
            </p>
            <button className="text-teal font-medium hover:text-teal/80 transition-colors">
              View Pricing Plans →
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default PlatformTestimonial;
