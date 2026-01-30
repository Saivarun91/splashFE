"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { apiService } from "@/lib/api";
import { useLanguage } from "@/context/LanguageContext";
import { CreditCard, Check, X, Calendar, DollarSign, Loader2, FileText } from "lucide-react";
import { InvoiceView } from "@/components/InvoiceView";

export default function PaymentHistoryPage() {
  const { token } = useAuth();
  const { t } = useLanguage();
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [invoicePaymentData, setInvoicePaymentData] = useState(null);

  useEffect(() => {
    const fetchHistory = async () => {
      if (!token) {
        setLoading(false);
        return;
      }
      try {
        const data = await apiService.getPaymentHistory(token);
        if (data?.transactions) {
          setPayments(data.transactions);
        }
      } catch (e) {
        console.error("Failed to fetch payment history:", e);
      } finally {
        setLoading(false);
      }
    };
    fetchHistory();
  }, [token]);

  const getStatusChip = (status) => {
    if (status === "completed") {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
          <Check className="w-3 h-3" /> {t("status.completed") || "Completed"}
        </span>
      );
    }
    if (status === "pending") {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-700">
          {t("status.pending") || "Pending"}
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700">
        <X className="w-3 h-3" /> {t("status.failed") || "Failed"}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Payment History</h1>
        <p className="text-gray-600 text-sm">
          View all your plan and credit purchases.
        </p>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        {payments.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-gray-500">
            <CreditCard className="w-10 h-10 mb-3 text-gray-400" />
            <p>No payments found yet.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left font-medium text-gray-500">
                    Date
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-gray-500">
                    Plan / Credits
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-gray-500">
                    Amount
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-gray-500">
                    Credits
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-gray-500">
                    Status
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-gray-500">
                    Transaction ID
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-gray-500">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {payments.map((p) => (
                  <tr key={p.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2 text-gray-700">
                        <Calendar className="w-4 h-4 text-gray-400" />
                        <span>
                          {p.created_at
                            ? new Date(p.created_at).toLocaleDateString()
                            : "-"}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-800">
                      {p.plan_name || "Credit Purchase"}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1 text-gray-800">
                        <DollarSign className="w-4 h-4 text-gray-400" />
                        <span>₹{p.total_amount?.toFixed(2) || p.amount?.toFixed(2) || "0.00"}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-800">
                      {p.credits ?? 0}
                    </td>
                    <td className="px-4 py-3">{getStatusChip(p.status)}</td>
                    <td className="px-4 py-3 text-xs text-gray-500 font-mono">
                      {p.razorpay_payment_id || p.razorpay_order_id || p.id}
                    </td>
                    <td className="px-4 py-3">
                      {p.status === "completed" ? (
                        <button
                          onClick={() => {
                            setInvoicePaymentData(p);
                            setSelectedInvoice(p.id);
                          }}
                          className="inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 rounded-lg transition-colors"
                        >
                          <FileText className="w-4 h-4" />
                          View Invoice
                        </button>
                      ) : (
                        <span className="text-gray-400 text-sm">-</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Invoice Modal */}
      {selectedInvoice && invoicePaymentData && (
        <InvoiceView
          transactionId={selectedInvoice}
          paymentData={invoicePaymentData}
          onClose={() => {
            setSelectedInvoice(null);
            setInvoicePaymentData(null);
          }}
        />
      )}
    </div>
  );
}

