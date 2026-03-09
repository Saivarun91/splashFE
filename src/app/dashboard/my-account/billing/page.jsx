"use client";
import { useState, useEffect } from "react";
import { CreditCard, Check, X, Calendar, DollarSign, Loader2, AlertCircle, Crown } from "lucide-react";
import { toast } from "react-hot-toast";
import { apiService } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import Script from "next/script";
import { ContactSalesModal } from "@/components/ContactSalesModal";

const DEFAULT_CREDIT_OPTIONS = [
  { amount: 50, credits: 50 },
  { amount: 100, credits: 100 },
  { amount: 300, credits: 300 },
];

export const SubscriptionBilling = () => {
  const { user, token } = useAuth();
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPlan, setCurrentPlan] = useState(null);
  const [organizationCredits, setOrganizationCredits] = useState(null);
  const [userCredits, setUserCredits] = useState(null);
  const [isSingleUser, setIsSingleUser] = useState(false);
  const [processingPayment, setProcessingPayment] = useState(false);
  const [razorpayLoaded, setRazorpayLoaded] = useState(false);
  const [selectedCreditOption, setSelectedCreditOption] = useState(0);
  const [showBillingModal, setShowBillingModal] = useState(false);
  const [showContactSalesModal, setShowContactSalesModal] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [billingDetails, setBillingDetails] = useState({
    billing_name: "",
    billing_address: "",
    billing_phone: "",
    billing_gst_number: "",
    billing_type: "individual",
  });
  const [invoiceConfig, setInvoiceConfig] = useState({ tax_rate: 18 });

  useEffect(() => {
    fetchPlans();
    fetchOrganizationData();
    fetchInvoiceConfig();
  }, [token, user]);

  const fetchInvoiceConfig = async () => {
    try {
      if (token) {
        const data = await apiService.getInvoiceConfig(token);
        if (data) {
          setInvoiceConfig(data);
        } else {
          setInvoiceConfig({ tax_rate: 18 });
        }
      } else {
        setInvoiceConfig({ tax_rate: 18 });
      }
    } catch (error) {
      console.warn("Failed to fetch invoice config, using default:", error);
      setInvoiceConfig({ tax_rate: 18 });
    }
  };

  const fetchPlans = async () => {
    setLoading(true);
    try {
      const response = await apiService.getPlans(true);
      let allPlans = [];
      if (response.success && response.plans) {
        allPlans = response.plans;
      } else if (response.plans) {
        allPlans = Array.isArray(response.plans) ? response.plans : [];
      }
      // Filter to only Pro and Enterprise plans, Pro first
      const proPlan = allPlans.find((p) => (p.name || "").toLowerCase() === "pro");
      const enterprisePlan = allPlans.find((p) => (p.name || "").toLowerCase() === "enterprise");
      const filteredPlans = [];
      if (proPlan) filteredPlans.push(proPlan);
      if (enterprisePlan) filteredPlans.push(enterprisePlan);
      setPlans(filteredPlans);
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
          setIsSingleUser(false);
          const orgData = await apiService.getOrganization(organizationId, token);
          if (orgData) {
            setOrganizationCredits({
              balance: orgData.credit_balance || 0,
              total: orgData.credit_balance || 0,
            });
            
            if (orgData.plan) {
              const planId = typeof orgData.plan === 'object' ? orgData.plan.id : orgData.plan;
              const planResponse = await apiService.getPlan(planId);
              if (planResponse?.success && planResponse?.plan) {
                setCurrentPlan(planResponse.plan);
              }
            }
          }
        } else {
          setIsSingleUser(true);
          setUserCredits({
            balance: currentUser.credit_balance || 0,
            total: currentUser.credit_balance || 0,
          });
          
          if (currentUser.plan) {
            const planId = typeof currentUser.plan === 'object' ? currentUser.plan.id : currentUser.plan;
            const planResponse = await apiService.getPlan(planId);
            if (planResponse?.success && planResponse?.plan) {
              setCurrentPlan(planResponse.plan);
            }
          }
        }
      }
    } catch (error) {
      console.error('Failed to fetch user data:', error);
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

    setSelectedPlan(plan);
    setShowBillingModal(true);
  };

  const startPaymentWithBilling = async () => {
    if (!token || !user || !razorpayLoaded || !selectedPlan) {
      return;
    }

    const plan = selectedPlan;
    setProcessingPayment(true);

    try {
      // For Pro plan, use selected credit option; for Enterprise, use plan price
      let baseAmount = plan.price;
      let creditsToAdd = plan.credits_per_month || 0;
      
      if ((plan.name || "").toLowerCase() === "pro") {
        const creditOptions = plan.credit_options || plan.custom_settings?.credit_options || [];
        const selectedOption = creditOptions[selectedCreditOption] || creditOptions[0];
        if (selectedOption) {
          baseAmount = selectedOption.amount || plan.price;
          creditsToAdd = selectedOption.credits || 0;
        }
      }

      const taxRate = invoiceConfig?.tax_rate || 18;
      const taxAmount = (baseAmount * taxRate) / 100;
      const totalAmount = baseAmount + taxAmount;

      // Get user profile to check if single user or organization
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

      const orderData = {
        amount: baseAmount,
        credits: creditsToAdd,
        plan_id: plan.id,
        plan_name: plan.name,
        billing_name: billingDetails.billing_name,
        billing_address: billingDetails.billing_address,
        billing_phone: billingDetails.billing_phone,
        billing_gst_number: billingDetails.billing_gst_number,
        billing_type: billingDetails.billing_type,
      };
      
      if (organizationId) {
        orderData.organization_id = organizationId;
      }

      const orderResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000'}/api/payments/razorpay/create-order/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(orderData),
      });

      const responseData = await orderResponse.json();
      
      if (!responseData.success) {
        throw new Error(responseData.error || 'Failed to create payment order');
      }

      const options = {
        key: responseData.key_id,
        amount: (responseData.total_amount || totalAmount) * 100,
        currency: responseData.currency || 'INR',
        name: 'Tarinika',
        description: `Subscribe to ${plan.name} plan`,
        order_id: responseData.order_id,
        handler: async function (response) {
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
              const creditsAdded = creditsToAdd;
              toast.success(`Payment successful! ${plan.name} plan activated. ${creditsAdded} credits added to account.`);
              setShowBillingModal(false);
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
          name: billingDetails.billing_name || user.full_name || user.username || '',
          email: user.email || '',
          contact: billingDetails.billing_phone || '',
        },
        theme: {
          color: '#884cff',
        },
        modal: {
          ondismiss: function () {
            setProcessingPayment(false);
          },
        },
      };

      const razorpay = new window.Razorpay(options);
      razorpay.open();
    } catch (error) {
      console.error('Payment error:', error);
      toast.error('Failed to initiate payment: ' + (error.message || 'Unknown error'));
      setProcessingPayment(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
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
      
      <div className="p-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Subscription & Billing</h1>
          <p className="text-gray-600">Purchase credits and manage your subscription</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 mb-6">
          <div className="p-6">
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-6">Plans & Subscriptions</h2>
              
              {currentPlan && (
                <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-blue-700 font-medium">Current Plan</p>
                      <p className="text-lg font-bold text-blue-900">{currentPlan.name}</p>
                      <p className="text-sm text-blue-600">
                        {currentPlan.credits_per_month?.toLocaleString() || 0} credits/month • 
                        {(currentPlan.currency === 'INR' ? '₹' : '$')}{currentPlan.price.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}/{currentPlan.billing_cycle === 'yearly' ? 'year' : 'month'}
                      </p>
                    </div>  
                    <span className="px-3 py-1 bg-blue-600 text-white rounded-full text-sm font-medium">
                      Active
                    </span>
                  </div>
                </div>
              )}

              {!razorpayLoaded && (
                <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg flex items-center gap-3">
                  <AlertCircle className="w-5 h-5 text-yellow-600" />
                  <p className="text-yellow-700 text-sm">Loading payment gateway...</p>
                </div>
              )}

              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                  <span className="ml-3 text-gray-600">Loading plans...</span>
                </div>
              ) : plans.length === 0 ? (
                <div className="text-center py-12">
                  <CreditCard className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">No plans available at the moment.</p>
                </div>
              ) : (
                <div className="flex justify-center">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-5xl mx-auto w-full">
                    {plans.map((plan) => {
                      const isCurrentPlan = currentPlan && currentPlan.id === plan.id;
                      const isPro = (plan.name || "").toLowerCase() === "pro";
                      const isEnterprise = (plan.name || "").toLowerCase() === "enterprise";
                      
                      // Get credit options for Pro plan
                      const creditOptions = isPro 
                        ? (plan.credit_options || plan.custom_settings?.credit_options || [])
                        : [];
                      const selectedOption = creditOptions[selectedCreditOption] || creditOptions[0];
                      
                      // Amount display: Pro uses selected option, Enterprise uses custom display
                      let displayAmount = plan.price;
                      let amountLabel = "";
                      if (isPro && selectedOption) {
                        displayAmount = selectedOption.amount || plan.price;
                        amountLabel = "one-time";
                      } else if (isEnterprise) {
                        const amountDisplay = plan.custom_settings?.amount_display || plan.amount_display || "As you go";
                        displayAmount = null;
                        amountLabel = amountDisplay;
                      } else {
                        amountLabel = `/${plan.billing_cycle === 'yearly' ? 'year' : 'month'}`;
                      }
                      
                      const ctaText = plan.custom_settings?.cta_text || plan.cta_text || (isPro ? "Pay" : "Contact Sales");
                      
                      return (
                        <div
                          key={plan.id}
                          className={`border-2 rounded-xl p-6 relative ${
                            isPro
                              ? "border-purple-200 bg-gradient-to-b from-purple-50 to-white shadow-lg"
                              : isEnterprise
                              ? "border-gray-200 bg-white shadow-lg"
                              : isCurrentPlan
                              ? "border-green-500 shadow-md"
                              : "border-gray-200 hover:shadow-md"
                          }`}
                        >
                          {isCurrentPlan && (
                            <div className="absolute top-4 right-4">
                              <span className="bg-green-500 text-white px-3 py-1 rounded-full text-xs font-medium">
                                Current
                              </span>
                            </div>
                          )}
                          <div className="text-center mb-6">
                            <h3 className="text-2xl font-bold text-gray-900 mb-2">{plan.name}</h3>
                            {plan.description && (
                              <p className="text-gray-600 mt-1 text-sm">{plan.description}</p>
                            )}
                            <div className="mt-4">
                              {displayAmount !== null ? (
                                <div className="flex items-baseline justify-center gap-2">
                                  <span className="text-4xl font-bold text-gray-900">
                                    {(plan.currency === 'INR' ? '₹' : '$')}{displayAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                  </span>
                                  {amountLabel && (
                                    <span className="text-gray-600">{amountLabel}</span>
                                  )}
                                </div>
                              ) : (
                                <span className="text-3xl font-bold text-gray-900">{amountLabel}</span>
                              )}
                            </div>
                          </div>
                          
                          {/* Credit options dropdown for Pro plan */}
                          {isPro && creditOptions.length > 0 && (
                            <div className="mb-4">
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                Choose credits
                              </label>
                              <select
                                value={selectedCreditOption}
                                onChange={(e) => setSelectedCreditOption(Number(e.target.value))}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                              >
                                {creditOptions.map((opt, index) => (
                                  <option key={index} value={index}>
                                    ${opt.amount} – {opt.credits} credits
                                  </option>
                                ))}
                              </select>
                            </div>
                          )}
                          
                          {plan.features && plan.features.length > 0 && (
                            <ul className="space-y-3 mb-6">
                              {plan.features.map((feature, index) => (
                                <li key={index} className="flex items-start gap-2">
                                  <Check className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                                  <span className="text-gray-700">{feature}</span>
                                </li>
                              ))}
                            </ul>
                          )}
                          
                          {isEnterprise ? (
                            <button
                              type="button"
                              onClick={() => setShowContactSalesModal(true)}
                              disabled={isCurrentPlan}
                              className={`w-full py-3 rounded-lg font-semibold transition-colors flex items-center justify-center gap-2 border-2 border-gray-300 text-gray-900 hover:bg-gray-50 ${
                                isCurrentPlan ? "opacity-50 cursor-not-allowed" : ""
                              }`}
                            >
                              {ctaText}
                            </button>
                          ) : (
                            <button
                              onClick={() => handlePlanPurchase(plan)}
                              disabled={processingPayment || !razorpayLoaded || isCurrentPlan}
                              className={`w-full py-3 rounded-lg font-semibold transition-colors flex items-center justify-center gap-2 ${
                                isCurrentPlan
                                  ? "bg-gray-300 text-gray-600 cursor-not-allowed"
                                  : isPro
                                  ? "bg-purple-600 text-white hover:bg-purple-700"
                                  : "bg-gray-100 text-gray-900 hover:bg-gray-200"
                              } disabled:opacity-50 disabled:cursor-not-allowed`}
                            >
                              {processingPayment ? (
                                <>
                                  <Loader2 className="w-5 h-5 animate-spin" />
                                  Processing...
                                </>
                              ) : isCurrentPlan ? (
                                "Current Plan"
                              ) : (
                                ctaText
                              )}
                            </button>
                          )
                          }
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Billing Details Modal */}
        {showBillingModal && selectedPlan && (
          <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/50">
            <div className="bg-white rounded-lg shadow-xl max-w-lg w-full p-6 space-y-4">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-lg font-semibold text-gray-900">
                  Billing Details
                </h3>
                <button
                  onClick={() => {
                    setShowBillingModal(false);
                    setProcessingPayment(false);
                  }}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <p className="text-sm text-gray-600">
                Please enter billing details required for GST invoice.
              </p>

              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Billing Name
                  </label>
                  <input
                    type="text"
                    value={billingDetails.billing_name}
                    onChange={(e) =>
                      setBillingDetails((prev) => ({
                        ...prev,
                        billing_name: e.target.value,
                      }))
                    }
                    className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Billing Address
                  </label>
                  <textarea
                    value={billingDetails.billing_address}
                    onChange={(e) =>
                      setBillingDetails((prev) => ({
                        ...prev,
                        billing_address: e.target.value,
                      }))
                    }
                    rows={3}
                    className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Billing Phone
                  </label>
                  <input
                    type="tel"
                    value={billingDetails.billing_phone}
                    onChange={(e) =>
                      setBillingDetails((prev) => ({
                        ...prev,
                        billing_phone: e.target.value,
                      }))
                    }
                    className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    GST Number (optional)
                  </label>
                  <input
                    type="text"
                    value={billingDetails.billing_gst_number}
                    onChange={(e) =>
                      setBillingDetails((prev) => ({
                        ...prev,
                        billing_gst_number: e.target.value,
                      }))
                    }
                    className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                  />
                </div>
              </div>

              <div>
                <span className="block text-sm font-medium text-gray-700 mb-1">
                  Billing Type
                </span>
                <div className="flex gap-4 text-sm">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="billing_type"
                      value="individual"
                      checked={billingDetails.billing_type === "individual"}
                      onChange={(e) =>
                        setBillingDetails((prev) => ({
                          ...prev,
                          billing_type: e.target.value,
                        }))
                      }
                    />
                    <span>Individual</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="billing_type"
                      value="business"
                      checked={billingDetails.billing_type === "business"}
                      onChange={(e) =>
                        setBillingDetails((prev) => ({
                          ...prev,
                          billing_type: e.target.value,
                        }))
                      }
                    />
                    <span>Business</span>
                  </label>
                </div>
              </div>

              {/* GST Summary */}
              <div className="mt-2 rounded-md bg-gray-50 border border-gray-200 p-3 text-sm">
                <p className="font-semibold text-gray-800 mb-1">
                  Order Summary
                </p>
                <div className="flex justify-between text-gray-700">
                  <span>Plan amount</span>
                  <span className="font-semibold">
                    ${(() => {
                      if ((selectedPlan.name || "").toLowerCase() === "pro") {
                        const creditOptions = selectedPlan.credit_options || selectedPlan.custom_settings?.credit_options || [];
                        const selectedOption = creditOptions[selectedCreditOption] || creditOptions[0];
                        console.log(selectedOption);  
                        return (selectedOption?.amount || selectedPlan.price).toFixed(2);
                      }
                      return selectedPlan.price.toFixed(2);
                    })()}
                  </span>
                </div>
                <div className="flex justify-between text-gray-700 mt-1">
                  <span>
                    GST ({invoiceConfig?.tax_rate ?? 18}%)
                  </span>
                  <span className="font-semibold">
                    ${(() => {
                      let baseAmount = selectedPlan.price;
                      if ((selectedPlan.name || "").toLowerCase() === "pro") {
                        const creditOptions = selectedPlan.credit_options || selectedPlan.custom_settings?.credit_options || [];
                        const selectedOption = creditOptions[selectedCreditOption] || creditOptions[0];
                        baseAmount = selectedOption?.amount || selectedPlan.price;
                      }
                      return (baseAmount * (invoiceConfig?.tax_rate ?? 18) / 100).toFixed(2);
                    })()}
                  </span>
                </div>
                <div className="flex justify-between text-gray-900 font-semibold mt-2 border-t border-gray-200 pt-2">
                  <span>Total payable</span>
                  <span>
                    $
                    {(() => {
                      let baseAmount = selectedPlan.price;
                      if ((selectedPlan.name || "").toLowerCase() === "pro") {
                        const creditOptions = selectedPlan.credit_options || selectedPlan.custom_settings?.credit_options || [];
                        const selectedOption = creditOptions[selectedCreditOption] || creditOptions[0];
                        baseAmount = selectedOption?.amount || selectedPlan.price;
                      }
                      const taxAmount = baseAmount * (invoiceConfig?.tax_rate ?? 18) / 100;
                      return (baseAmount + taxAmount).toFixed(2);
                    })()}
                  </span>
                </div>
              </div>

              <div className="mt-4 flex justify-end gap-2">
                <button
                  onClick={() => {
                    setShowBillingModal(false);
                    setProcessingPayment(false);
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={startPaymentWithBilling}
                  disabled={processingPayment}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  {processingPayment ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin inline" />
                      Processing...
                    </>
                  ) : (
                    "Proceed to pay"
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        <ContactSalesModal open={showContactSalesModal} onOpenChange={setShowContactSalesModal} />
      </div>
    </>
  );
};

export default SubscriptionBilling;
