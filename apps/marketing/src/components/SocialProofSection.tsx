
import React from 'react';
import { Star, Quote } from 'lucide-react';

const SocialProofSection = () => {
  const testimonial = {
    content: "aicomplyr.io transformed our compliance process from a 3-week bottleneck to streamlined workflows. The human-in-the-loop approach—people decide; platform documents and orchestrates—gives us complete confidence in every decision.",
    author: "Sarah Chen",
    role: "Chief Compliance Officer",
    company: "FinTech Innovations Ltd",
    avatar: "https://images.unsplash.com/photo-1494790108755-2616b612b789?w=150&h=150&fit=crop&crop=face"
  };

  const companies = [
    "TechCorp", "Financial Partners", "Healthcare Plus", "RegTech Solutions", "Compliance Pro"
  ];

  return (
    <section className="py-16 lg:py-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Testimonial */}
        <div className="bg-gradient-to-r from-teal/5 to-orange/5 rounded-2xl p-8 lg:p-12 mb-16">
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

        {/* Company logos */}
        <div className="text-center">
          <p className="text-gray-500 mb-8 text-sm uppercase tracking-wide font-medium">
            Trusted by Leading Companies
          </p>
          <div className="flex flex-wrap items-center justify-center gap-8 lg:gap-12">
            {companies.map((company, index) => (
              <div
                key={index}
                className="text-gray-400 font-semibold text-lg lg:text-xl hover:text-gray-600 transition-colors duration-200"
              >
                {company}
              </div>
            ))}
          </div>
        </div>

        {/* Stats */}
        <div className="mt-16 grid md:grid-cols-3 gap-8 text-center">
          <div className="p-6">
            <div className="text-4xl font-bold text-teal mb-2">500+</div>
            <div className="text-gray-600">Companies Trust Us</div>
          </div>
          <div className="p-6">
            <div className="text-4xl font-bold text-orange mb-2">99.7%</div>
            <div className="text-gray-600">Accuracy Rate</div>
          </div>
          <div className="p-6">
            <div className="text-4xl font-bold text-gray-700 mb-2">24/7</div>
            <div className="text-gray-600">AI Monitoring</div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default SocialProofSection;
