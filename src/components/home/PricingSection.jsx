"use client";

import React, { useState, useEffect } from "react";
import { Check } from "lucide-react";
import { apiService } from "@/lib/api";

const PricingSection = () => {
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchPlans = async () => {
      try {
        setLoading(true);
        const response = await apiService.getPlans(true); // Fetch only active plans
        if (response.success && response.plans) {
          // Transform API data to match component structure, including all plan fields
          const transformedPlans = response.plans.map((plan) => {
            const currency = plan.currency || 'USD';
            const currencySymbol = currency === 'INR' ? '₹' : '$';
            const priceDisplay = plan.price === 0 || plan.price === null 
              ? "Custom" 
              : `${currencySymbol}${plan.price.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
            
            return {
              id: plan.id,
              name: plan.name,
              price: priceDisplay,
              period: plan.billing_cycle === 'yearly' ? 'per year' : 'per month',
              description: plan.description || '',
              features: plan.features || [],
              cta: plan.price === 0 || plan.price === null ? "Talk to Sales" : "Start Trial",
              highlighted: plan.is_popular || false,
              currency: currency,
              // Include all plan data for dynamic display
              credits_per_month: plan.credits_per_month,
              max_projects: plan.max_projects,
              ai_features_enabled: plan.ai_features_enabled,
              custom_settings: plan.custom_settings || {},
              original_price: plan.original_price,
            };
          });
          setPlans(transformedPlans);
        }
      } catch (err) {
        console.error('Failed to fetch plans:', err);
        setError(err.message);
        // Fallback to empty array on error
        setPlans([]);
      } finally {
        setLoading(false);
      }
    };

    fetchPlans();
  }, []);

  if (loading) {
    return (
      <section id="pricing" className="py-12 lg:py-16 bg-white">
        <div className="max-w-screen-2xl mx-auto px-6 lg:px-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading pricing plans...</p>
          </div>
        </div>
      </section>
    );
  }

  if (error && plans.length === 0) {
    return (
      <section id="pricing" className="py-12 lg:py-16 bg-white">
        <div className="max-w-screen-2xl mx-auto px-6 lg:px-12">
          <div className="text-center">
            <p className="text-red-600">Failed to load pricing plans. Please try again later.</p>
          </div>
        </div>
      </section>
    );
  }

  if (plans.length === 0) {
    return null; // Don't show pricing section if no plans available
  }

  return (
    <section id="pricing" className="py-12 lg:py-16 bg-white">
      <div className="max-w-screen-2xl mx-auto px-6 lg:px-12">
        {/* Header */}
        <div className="text-center mb-16">
          <h2 className="text-3xl lg:text-4xl font-extrabold text-gray-900 mb-4">
            Simple, transparent pricing
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Choose the plan that fits your creative needs.
          </p>
        </div>

        {/* Plans Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {plans.map((plan, index) => (
            <div
              key={plan.id || index}
              className={`relative p-6 rounded-2xl border shadow-lg transition-transform ${
                plan.highlighted
                  ? "border-purple-600 scale-105 bg-gradient-to-b from-purple-50 to-white"
                  : "border-gray-200 bg-white"
              }`}
            >
              {plan.highlighted && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-purple-600 text-white px-4 py-1 rounded-full text-sm font-medium shadow-lg">
                  Most Popular
                </div>
              )}

              {/* Plan Header */}
              <div className="text-center pb-8">
                <h3 className="text-2xl font-semibold mb-2 text-gray-900">{plan.name}</h3>
                <div className="mb-2">
                  <span className="text-4xl font-bold text-gray-900">{plan.price}</span>
                  <span className="text-gray-500 ml-2">/{plan.period}</span>
                </div>
                {plan.description && (
                  <p className="text-sm text-gray-500">{plan.description}</p>
                )}
              </div>

              {/* Features */}
              <div className="space-y-6">
                {plan.features && plan.features.length > 0 && (
                  <ul className="space-y-3">
                    {plan.features.map((feature, i) => (
                      <li key={i} className="flex items-start gap-3">
                        <Check className="w-5 h-5 text-purple-600 mt-0.5 flex-shrink-0" />
                        <span className="text-gray-700">{feature}</span>
                      </li>
                    ))}
                  </ul>
                )}

                {/* Display custom settings dynamically from plan data */}
                {plan.custom_settings && typeof plan.custom_settings === 'object' && Object.keys(plan.custom_settings).length > 0 && (
                  <div className="border-t border-gray-200 pt-4 space-y-2">
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Additional Details</p>
                    {Object.entries(plan.custom_settings).map(([key, value]) => (
                      <div key={key} className="flex items-center gap-2 text-sm text-gray-700">
                        <Check className="w-4 h-4 text-purple-600 flex-shrink-0" />
                        <span>
                          <strong>{String(key).replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}:</strong> {String(value)}
                        </span>
                      </div>
                    ))}
                  </div>
                )}

                {/* CTA Button */}
                <button
                  className={`w-full py-2 rounded-md font-medium transition-colors ${
                    plan.highlighted
                      ? "bg-purple-600 text-white hover:bg-purple-700"
                      : "border border-gray-300 text-gray-900 hover:bg-gray-100"
                  }`}
                >
                  {plan.cta}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default PricingSection;
