"use client";
import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { CreditCard, Download, Calendar, Zap, Check, Crown, Loader2 } from "lucide-react";
import { toast } from "react-hot-toast";
import { apiService } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import Script from "next/script";

export const SubscriptionBilling = () => {
  const { user, token } = useAuth();
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPlan, setCurrentPlan] = useState(null);
  const [organizationCredits, setOrganizationCredits] = useState(null);
  const [processingPayment, setProcessingPayment] = useState(false);
  const [razorpayLoaded, setRazorpayLoaded] = useState(false);

  useEffect(() => {
    fetchPlans();
    fetchOrganizationData();
  }, [token, user]);

  const fetchPlans = async () => {
    try {
      const response = await apiService.getPlans(true); // Fetch only active plans
      if (response.success && response.plans) {
        setPlans(response.plans);
      }
    } catch (error) {
      console.error('Failed to fetch plans:', error);
      toast.error('Failed to load plans');
    } finally {
      setLoading(false);
    }
  };

  const fetchOrganizationData = async () => {
    if (!token || !user) return;
    
    try {
      // Fetch user profile to get organization
      const userProfile = await apiService.getUserProfile(token);
      if (userProfile?.success && userProfile?.user) {
        const currentUser = userProfile.user;
        let organizationId = null;
        
        if (currentUser?.organization) {
          if (typeof currentUser.organization === 'object' && currentUser.organization.id) {
            organizationId = currentUser.organization.id;
          } else if (typeof currentUser.organization === 'string') {
            organizationId = currentUser.organization;
          }
        }
        
        if (organizationId) {
          const orgData = await apiService.getOrganization(organizationId, token);
          if (orgData) {
            setOrganizationCredits({
              balance: orgData.credit_balance || 0,
              total: orgData.credit_balance || 0, // You may want to track total credits separately
            });
            
            // Set current plan if organization has one
            if (orgData.plan) {
              const planId = typeof orgData.plan === 'object' ? orgData.plan.id : orgData.plan;
              const planResponse = await apiService.getPlan(planId);
              if (planResponse?.success && planResponse?.plan) {
                setCurrentPlan(planResponse.plan);
              }
            }
          }
        }
      }
    } catch (error) {
      console.error('Failed to fetch organization data:', error);
    }
  };

  const handlePlanPurchase = async (plan) => {
    if (!token || !user) {
      toast.error('Please login to purchase a plan');
      return;
    }

    if (!razorpayLoaded) {
      toast.error('Payment gateway is loading. Please wait...');
      return;
    }

    setProcessingPayment(true);
    try {
      // Get organization ID
      const userProfile = await apiService.getUserProfile(token);
      if (!userProfile?.success || !userProfile?.user) {
        throw new Error('Failed to get user profile');
      }

      const currentUser = userProfile.user;
      let organizationId = null;
      
      if (currentUser?.organization) {
        if (typeof currentUser.organization === 'object' && currentUser.organization.id) {
          organizationId = currentUser.organization.id;
        } else if (typeof currentUser.organization === 'string') {
          organizationId = currentUser.organization;
        }
      }

      if (!organizationId) {
        throw new Error('No organization found. Please contact support.');
      }

      // Create Razorpay order for plan subscription
      const orderResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000'}/api/payments/razorpay/create-order/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          organization_id: organizationId,
          amount: plan.price,
          credits: plan.credits_per_month,
          plan_id: plan.id,
          plan_name: plan.name,
        }),
      });

      const orderData = await orderResponse.json();
      
      if (!orderData.success) {
        throw new Error(orderData.error || 'Failed to create payment order');
      }

      // Initialize Razorpay checkout
      const options = {
        key: orderData.key_id,
        amount: orderData.order.amount,
        currency: orderData.order.currency,
        name: 'Tarinika',
        description: `${plan.name} Plan Subscription`,
        order_id: orderData.order_id,
        handler: async function (response) {
          // Verify payment
          try {
            const verifyResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000'}/api/payments/razorpay/verify/`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
              },
              body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
              }),
            });

            const verifyData = await verifyResponse.json();
            
            if (verifyData.success) {
              toast.success('Plan subscription successful!');
              // Refresh organization data
              await fetchOrganizationData();
              await fetchPlans();
            } else {
              toast.error(verifyData.error || 'Payment verification failed');
            }
          } catch (error) {
            console.error('Payment verification error:', error);
            toast.error('Payment verification failed. Please contact support.');
          } finally {
            setProcessingPayment(false);
          }
        },
        prefill: {
          name: user.full_name || user.username || '',
          email: user.email || '',
        },
        theme: {
          color: '#3b82f6',
        },
        modal: {
          ondismiss: function() {
            setProcessingPayment(false);
          },
        },
      };

      const razorpay = new window.Razorpay(options);
      razorpay.open();
      
    } catch (error) {
      console.error('Plan purchase error:', error);
      toast.error(error.message || 'Failed to initiate payment');
      setProcessingPayment(false);
    }
  };

  const creditsPercentage = organizationCredits 
    ? ((organizationCredits.balance / (organizationCredits.total || 1000)) * 100)
    : 0;

  // --- Color Palette ---
  const colors = {
    foreground: "hsl(0, 0%, 15%)",
    mutedForeground: "hsl(0, 0%, 40%)",
    accent: "hsl(180, 45%, 45%)",
    accentBg: "hsla(180, 45%, 45%, 0.1)",
    destructive: "hsl(0, 84%, 60%)",
    success: "hsl(142, 76%, 36%)",
    muted: "hsl(46, 34%, 92%)",
    cardBg: "hsl(0, 0%, 100%)",
    border: "hsl(0, 0%, 90%)",
    shadowElegant: "0 8px 30px -8px rgba(71, 71, 71, 0.15)",
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin" style={{ color: colors.accent }} />
      </div>
    );
  }

  return (
    <>
      <Script
        src="https://checkout.razorpay.com/v1/checkout.js"
        onLoad={() => setRazorpayLoaded(true)}
        onError={() => toast.error('Failed to load payment gateway')}
      />
      
      <div className="space-y-6 max-w-6xl mx-auto" style={{ animation: "fade-in 0.3s ease-in-out" }}>
        {/* Header */}
        <div>
          <h1 style={{ color: colors.foreground }} className="text-3xl font-bold mb-2">
            Subscription, Credits & Billing
          </h1>
          <p style={{ color: colors.mutedForeground }}>
            Manage your plan, credits, and billing information
          </p>
        </div>

        {/* Current Plan + Payment */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Current Plan */}
          <Card style={{ boxShadow: colors.shadowElegant, background: colors.cardBg }} className="lg:col-span-2">
            <CardHeader>
              <CardTitle style={{ color: colors.foreground }}>Current Plan</CardTitle>
              <CardDescription style={{ color: colors.mutedForeground }}>
                Your active subscription details
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {currentPlan ? (
                <>
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-3 mb-2">
                        <h3 style={{ color: colors.foreground }} className="text-2xl font-bold">
                          {currentPlan.name} Plan
                        </h3>
                        <Badge style={{ backgroundColor: colors.accent, color: "#fff" }}>
                          <Crown className="w-3 h-3 mr-1" />
                          Active
                        </Badge>
                      </div>
                      <p style={{ color: colors.foreground }} className="text-3xl font-bold">
                        {(currentPlan.currency === 'INR' ? '₹' : '$')}{currentPlan.price.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        <span style={{ color: colors.mutedForeground }} className="text-base font-normal">
                          /{currentPlan.billing_cycle === 'yearly' ? 'year' : 'month'}
                        </span>
                      </p>
                    </div>
                    <Button
                      variant="outline"
                      style={{
                        borderColor: colors.border,
                        color: colors.foreground,
                      }}
                    >
                      Manage Plan
                    </Button>
                  </div>

                  <Separator style={{ backgroundColor: colors.border }} />

                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p style={{ color: colors.foreground }} className="text-sm font-medium">
                          Credits Remaining
                        </p>
                        <p style={{ color: colors.mutedForeground }} className="text-xs">
                          {currentPlan.credits_per_month} credits/month
                        </p>
                      </div>
                      <p style={{ color: colors.accent }} className="text-2xl font-bold">
                        {organizationCredits?.balance || 0}
                        <span style={{ color: colors.mutedForeground }} className="text-sm font-normal">
                          /{currentPlan.credits_per_month}
                        </span>
                      </p>
                    </div>
                    <Progress
                      value={creditsPercentage}
                      className="h-3"
                      style={{
                        backgroundColor: colors.muted,
                        "--progress-color": colors.accent,
                      }}
                    />
                    
                    {/* Display custom settings dynamically from current plan */}
                    {currentPlan?.custom_settings && typeof currentPlan.custom_settings === 'object' && Object.keys(currentPlan.custom_settings).length > 0 && (
                      <div className="border-t pt-4 mt-4 space-y-2" style={{ borderColor: colors.border }}>
                        <p className="text-xs font-semibold uppercase tracking-wide mb-2" style={{ color: colors.mutedForeground }}>
                          Additional Details
                        </p>
                        {Object.entries(currentPlan.custom_settings).map(([key, value]) => (
                          <div key={key} className="flex items-center gap-2 text-sm">
                            <Check className="w-4 h-4 flex-shrink-0" style={{ color: colors.success }} />
                            <span style={{ color: colors.mutedForeground }}>
                              <strong style={{ color: colors.foreground }}>{String(key).replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}:</strong> {String(value)}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <div className="text-center py-8">
                  <p style={{ color: colors.mutedForeground }}>No active plan. Select a plan below to get started.</p>
                </div>
              )}

              <div
                className="flex items-center justify-between p-4 rounded-lg"
                style={{ backgroundColor: colors.muted }}
              >
                <div>
                  <p style={{ color: colors.foreground }} className="text-sm font-medium">
                    Need more credits?
                  </p>
                  <p style={{ color: colors.mutedForeground }} className="text-xs">
                    Purchase additional credits anytime
                  </p>
                </div>
                <Button
                  size="sm"
                  style={{
                    background: `linear-gradient(to right, ${colors.accent}, hsla(180,45%,45%,0.8))`,
                    color: "#fff",
                  }}
                >
                  <Zap className="w-4 h-4 mr-2" />
                  Buy Credits
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Payment Method */}
          <Card style={{ boxShadow: colors.shadowElegant, background: colors.cardBg }}>
            <CardHeader>
              <CardTitle style={{ color: colors.foreground }}>Payment Method</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div
                className="p-4 rounded-lg"
                style={{
                  border: `1px solid ${colors.border}`,
                }}
              >
                <div className="flex items-start justify-between mb-3">
                  <CreditCard className="w-8 h-8" style={{ color: colors.accent }} />
                  <Badge variant="outline" style={{ borderColor: colors.border, color: colors.mutedForeground }}>
                    Razorpay
                  </Badge>
                </div>
                <p style={{ color: colors.foreground }} className="font-medium mb-1">
                  Secure Payment Gateway
                </p>
                <p style={{ color: colors.mutedForeground }} className="text-sm">
                  Powered by Razorpay
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Available Plans */}
        <div>
          <h2 style={{ color: colors.foreground }} className="text-2xl font-bold mb-4">
            Available Plans
          </h2>
          {plans.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {plans.map((plan) => {
                const isCurrentPlan = currentPlan && currentPlan.id === plan.id;
                return (
                  <Card
                    key={plan.id}
                    className="shadow-md hover:-translate-y-1 transition-all"
                    style={{
                      boxShadow: plan.is_popular ? colors.shadowElegant : "0 4px 6px rgba(0,0,0,0.08)",
                      border: plan.is_popular ? `2px solid ${colors.accent}` : `1px solid ${colors.border}`,
                    }}
                  >
                    {plan.is_popular && (
                      <div
                        className="text-white text-center py-2 text-sm font-semibold"
                        style={{
                          background: `linear-gradient(to right, ${colors.accent}, hsla(180,45%,45%,0.8))`,
                        }}
                      >
                        Most Popular
                      </div>
                    )}
                    <CardHeader>
                      <CardTitle style={{ color: colors.foreground }}>{plan.name}</CardTitle>
                      <div className="mt-4">
                        <p style={{ color: colors.foreground }} className="text-4xl font-bold">
                          {(plan.currency === 'INR' ? '₹' : '$')}{plan.price.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          <span style={{ color: colors.mutedForeground }} className="text-base font-normal">
                            /{plan.billing_cycle === 'yearly' ? 'yr' : 'mo'}
                          </span>
                        </p>
                        {plan.original_price && plan.original_price > plan.price && (
                          <p style={{ color: colors.mutedForeground }} className="text-sm mt-1 line-through">
                            {(plan.currency === 'INR' ? '₹' : '$')}{plan.original_price.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}/{plan.billing_cycle === 'yearly' ? 'yr' : 'mo'}
                          </p>
                        )}
                        <p style={{ color: colors.mutedForeground }} className="text-sm mt-1">
                          {plan.credits_per_month} credits/month
                        </p>
                        {plan.description && (
                          <p style={{ color: colors.mutedForeground }} className="text-sm mt-2">
                            {plan.description}
                          </p>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {plan.features && plan.features.length > 0 && (
                        <ul className="space-y-3">
                          {plan.features.map((feature, idx) => (
                            <li key={idx} className="flex items-start gap-2 text-sm">
                              <Check className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: colors.success }} />
                              <span style={{ color: colors.mutedForeground }}>{feature}</span>
                            </li>
                          ))}
                        </ul>
                      )}
                      
                      {/* Display custom settings dynamically from plan data */}
                      {plan.custom_settings && typeof plan.custom_settings === 'object' && Object.keys(plan.custom_settings).length > 0 && (
                        <div className="border-t pt-4 mt-4 space-y-2" style={{ borderColor: colors.border }}>
                          <p className="text-xs font-semibold uppercase tracking-wide mb-2" style={{ color: colors.mutedForeground }}>
                            Additional Details
                          </p>
                          {Object.entries(plan.custom_settings).map(([key, value]) => (
                            <div key={key} className="flex items-center gap-2 text-sm">
                              <Check className="w-4 h-4 flex-shrink-0" style={{ color: colors.success }} />
                              <span style={{ color: colors.mutedForeground }}>
                                <strong style={{ color: colors.foreground }}>{String(key).replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}:</strong> {String(value)}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                      <Button
                        className="w-full"
                        disabled={isCurrentPlan || processingPayment}
                        onClick={() => handlePlanPurchase(plan)}
                        style={{
                          background:
                            isCurrentPlan
                              ? colors.muted
                              : `linear-gradient(to right, ${colors.accent}, hsla(180,45%,45%,0.8))`,
                          color: isCurrentPlan ? colors.mutedForeground : "#fff",
                          cursor: isCurrentPlan ? "not-allowed" : "pointer",
                        }}
                      >
                        {processingPayment ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Processing...
                          </>
                        ) : isCurrentPlan ? (
                          "Current Plan"
                        ) : (
                          `Subscribe to ${plan.name}`
                        )}
                      </Button>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-12 bg-gray-50 rounded-xl border border-gray-200">
              <p style={{ color: colors.mutedForeground }}>No plans available at the moment.</p>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default SubscriptionBilling;
