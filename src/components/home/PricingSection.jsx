"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Check, Crown, Building2,Gem } from "lucide-react";
import { apiService } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";

const DEFAULT_CREDIT_OPTIONS = [
  { amount: 50, credits: 50 },
  { amount: 100, credits: 100 },
  { amount: 300, credits: 300 },
];

const BILLING_PAGE = "/dashboard/my-account/billing";

const PricingSection = () => {
  const router = useRouter();
  const { isAuthenticated } = useAuth();
  const [proPlan, setProPlan] = useState(null);
  const [enterprisePlan, setEnterprisePlan] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedCreditOption, setSelectedCreditOption] = useState(0);

  const handleProPayClick = () => {
    if (isAuthenticated) {
      router.push(BILLING_PAGE);
    } else {
      const loginUrl = `/signup?redirect=${encodeURIComponent(BILLING_PAGE)}`;
      router.push(loginUrl);
    }
  };

  useEffect(() => {
    const fetchPlans = async () => {
      try {
        setLoading(true);
        const response = await apiService.getPlans(true);
        if (response.success && response.plans) {
          const pro = response.plans.find((p) => (p.name || "").toLowerCase() === "pro");
          const enterprise = response.plans.find((p) => (p.name || "").toLowerCase() === "enterprise");
          setProPlan(pro || null);
          setEnterprisePlan(enterprise || null);
          setSelectedCreditOption(0);
        }
      } catch (err) {
        console.error("Failed to fetch plans:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchPlans();
  }, []);

  if (loading) {
    return (
      <section id="pricing" className="py-12 lg:py-16">
        <div className="max-w-screen-2xl mx-auto px-6 lg:px-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gold-solid mx-auto" />
            <p className="mt-4 text-muted-foreground">Loading pricing...</p>
          </div>
        </div>
      </section>
    );
  }

  if (error && !proPlan && !enterprisePlan) {
    return (
      <section id="pricing" className="py-12 lg:py-16">
        <div className="max-w-screen-2xl mx-auto px-6 lg:px-12">
          <div className="text-center">
            <p className="text-red-400">Failed to load pricing. Please try again later.</p>
          </div>
        </div>
      </section>
    );
  }

  const proCreditOptions = proPlan?.credit_options?.length
    ? proPlan.credit_options
    : proPlan?.custom_settings?.credit_options || DEFAULT_CREDIT_OPTIONS;
  const selectedOption = proCreditOptions[selectedCreditOption] || proCreditOptions[0];
  const proAmount = selectedOption?.amount ?? proPlan?.price ?? 50;
  const proCta = proPlan?.custom_settings?.cta_text || proPlan?.cta_text || "Pay";
  const enterpriseAmountDisplay = enterprisePlan?.custom_settings?.amount_display ?? enterprisePlan?.amount_display ?? "As you go";
  const enterpriseCta = enterprisePlan?.custom_settings?.cta_text ?? enterprisePlan?.cta_text ?? "Contact Sales";

  return (
    <section id="pricing" className="py-12 lg:py-16 bg-secondary/30">
      <div className="max-w-screen-2xl mx-auto px-6 lg:px-12">
        <div className="text-center mb-8 sm:mb-12 md:mb-16">
          <h2 className="text-2xl sm:text-3xl md:text-3xl lg:text-4xl font-extrabold text-foreground mb-3 sm:mb-4">
            Simple, transparent pricing
          </h2>
          <p className="text-sm sm:text-base md:text-lg text-muted-foreground max-w-2xl mx-auto px-2">
            Choose the plan that fits your needs.
          </p>
        </div>

        {/* Mobile: 1 column, Tablet: 2 columns, Desktop: 3 columns */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 md:gap-8 max-w-4xl mx-auto">
        {proPlan && (
            <div className="relative p-4 sm:p-5 md:p-6 rounded-xl sm:rounded-2xl border border-border bg-card shadow-lg hover:border-gold-muted transition-all">
              <div className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-4">
                <div className="p-2 sm:p-3 rounded-lg sm:rounded-xl bg-secondary flex-shrink-0">
                  <Crown className="text-gold-solid" size={20} />
                </div>
                <div>
                  <h3 className="text-lg sm:text-xl md:text-2xl font-semibold text-foreground">Free Plan</h3>
                  <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">For a limited time, you can get 5 credits for free.</p>
                </div>
              </div>

              <div className="mb-3 sm:mb-4">
                <span className="text-3xl sm:text-4xl font-bold text-foreground">Free</span>
                <span className="text-sm sm:text-base text-muted-foreground ml-2">for 5 credits</span>
              </div>

              <button
                className="w-full py-2.5 sm:py-3 rounded-lg font-semibold text-sm sm:text-base bg-gold-gradient text-primary-foreground hover:brightness-110 transition-all mb-3 sm:mb-4"
                onClick={() => (window.location.href = "/signup")}
              >
                Get Started
              </button>

              {proPlan.features && proPlan.features.length > 0 && (
                <ul className="space-y-2 sm:space-y-3 border-t border-border pt-3 sm:pt-4">
                    <li className="flex items-start gap-2 sm:gap-3">
                      <Check className="w-4 h-4 sm:w-5 sm:h-5 text-gold-solid mt-0.5 flex-shrink-0" />
                      <span className="text-sm sm:text-base text-muted-foreground">Explore the platform for free</span>
                    </li>
                    <li className="flex items-start gap-2 sm:gap-3">
                      <Check className="w-4 h-4 sm:w-5 sm:h-5 text-gold-solid mt-0.5 flex-shrink-0" />
                      <span className="text-sm sm:text-base text-muted-foreground"> Get 5 credits for free</span>
                    </li>
                    <li className="flex items-start gap-2 sm:gap-3">
                      <Check className="w-4 h-4 sm:w-5 sm:h-5 text-gold-solid mt-0.5 flex-shrink-0" />
                      <span className="text-sm sm:text-base text-muted-foreground">Get free image generation credits</span>
                    </li>
                    <li className="flex items-start gap-2 sm:gap-3">
                      <Check className="w-4 h-4 sm:w-5 sm:h-5 text-gold-solid mt-0.5 flex-shrink-0" />
                      <span className="text-sm sm:text-base text-muted-foreground">No credit card required</span>
                    </li>
                    {/* <li className="flex items-start gap-3">
                      <Check className="w-5 h-5 text-purple-600 mt-0.5 flex-shrink-0" />
                      <span className="text-gray-700"></span>
                    </li> */}
                  
                </ul>
              )}
              
            </div>
          )}


          {/* Pro Plan Card */}
          {proPlan && (
            <div className="relative p-4 sm:p-5 md:p-6 rounded-xl sm:rounded-2xl border border-gold-muted bg-card shadow-lg hover:shadow-xl transition-all">
              <div className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-4">
                <div className="p-2 sm:p-3 rounded-lg sm:rounded-xl bg-gold-gradient flex-shrink-0">
                  <Gem className="text-primary-foreground" size={20} />
                </div>
                <div>
                  <h3 className="text-lg sm:text-xl md:text-2xl font-semibold text-foreground">{proPlan.name}</h3>
                  {proPlan.description && (
                    <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">{proPlan.description}</p>
                  )}
                </div>
              </div>

              <div className="mb-3 sm:mb-4">
                <span className="text-3xl sm:text-4xl font-bold text-foreground">${proAmount}</span>
                <span className="text-sm sm:text-base text-muted-foreground ml-2">Fixed</span>
              </div>

              <button
                className="w-full py-2.5 sm:py-3 rounded-lg font-semibold text-sm sm:text-base bg-gold-gradient text-primary-foreground hover:brightness-110 transition-all mb-3 sm:mb-4"
                onClick={handleProPayClick}
              >
                {proCta}
              </button>
            

              <div className="mb-3 sm:mb-4">
                <label className="block text-xs sm:text-sm font-medium text-foreground mb-1.5 sm:mb-2">Choose credits</label>
                <select
                  value={selectedCreditOption}
                  onChange={(e) => setSelectedCreditOption(Number(e.target.value))}
                  className="w-full px-3 sm:px-4 py-2 text-sm sm:text-base border border-input rounded-lg bg-input text-foreground focus:ring-2 focus:ring-ring focus:border-transparent"
                >
                  {proCreditOptions.map((opt, index) => (
                    <option key={index} value={index}>
                      ${opt.amount} – {opt.credits} credits
                    </option>
                  ))}
                </select>
              </div>

              {proPlan.features && proPlan.features.length > 0 && (
                <ul className="space-y-2 sm:space-y-3 border-t border-border pt-3 sm:pt-4">
                  {proPlan.features.map((feature, i) => (
                    <li key={i} className="flex items-start gap-2 sm:gap-3">
                      <Check className="w-4 h-4 sm:w-5 sm:h-5 text-gold-solid mt-0.5 flex-shrink-0" />
                      <span className="text-sm sm:text-base text-muted-foreground">{feature}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}

          {/* Enterprise Plan Card */}
          {enterprisePlan && (
            <div className="relative p-4 sm:p-5 md:p-6 rounded-xl sm:rounded-2xl border border-border bg-card shadow-lg hover:border-gold-muted transition-all">
              <div className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-4">
                <div className="p-2 sm:p-3 rounded-lg sm:rounded-xl bg-secondary flex-shrink-0">
                  <Building2 className="text-gold-solid" size={20} />
                </div>
                <div>
                  <h3 className="text-lg sm:text-xl md:text-2xl font-semibold text-foreground">{enterprisePlan.name}</h3>
                  {enterprisePlan.description && (
                    <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">{enterprisePlan.description}</p>
                  )}
                </div>
              </div>

              <div className="mb-3 sm:mb-4">
                <span className="text-2xl sm:text-3xl font-bold text-foreground">{enterpriseAmountDisplay}</span>
              </div>

              <a
                href="/contact"
                className="w-full inline-block text-center py-2.5 sm:py-3 rounded-lg font-semibold text-sm sm:text-base border border-gold-muted text-gold-solid hover:bg-accent transition-colors mb-3 sm:mb-4"
              >
                {enterpriseCta}
              </a>

              {enterprisePlan.features && enterprisePlan.features.length > 0 && (
                <ul className="space-y-2 sm:space-y-3 border-t border-border pt-3 sm:pt-4">
                  {enterprisePlan.features.map((feature, i) => (
                    <li key={i} className="flex items-start gap-2 sm:gap-3">
                      <Check className="w-4 h-4 sm:w-5 sm:h-5 text-gold-solid mt-0.5 flex-shrink-0" />
                      <span className="text-sm sm:text-base text-muted-foreground">{feature}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}

          {!proPlan && !enterprisePlan && (
            <div className="col-span-2 text-center py-12 text-muted-foreground">
              No pricing plans available at the moment.
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

export default PricingSection;
