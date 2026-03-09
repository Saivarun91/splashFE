"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { apiService } from "@/lib/api";
import { useLanguage } from "@/context/LanguageContext";
import { Loader2, Zap, ArrowDownCircle, ArrowUpCircle, Calendar } from "lucide-react";

export default function CreditLogsPage() {
  const { token } = useAuth();
  const { t } = useLanguage();
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLogs = async () => {
      if (!token) {
        setLoading(false);
        return;
      }
      try {
        const data = await apiService.getUserCreditUsage(token);
        // Backend returns usage_data; support entries/logs as fallback
        const entries = data?.usage_data ?? data?.entries ?? data?.logs;
        if (Array.isArray(entries)) {
          setLogs(entries);
        } else if (data?.error) {
          console.error("Credit logs API error:", data.error);
        }
      } catch (e) {
        console.error("Failed to fetch credit logs:", e);
      } finally {
        setLoading(false);
      }
    };
    fetchLogs();
  }, [token]);

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
        <h1 className="text-2xl font-bold text-gray-900">
          {t("credits.logsTitle") || "Credits Usage"}
        </h1>
        <p className="text-gray-600 text-sm">
          {t("credits.logsSubtitle") ||
            "See how your credits are being consumed for image generation."}
        </p>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        {logs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-gray-500">
            <Zap className="w-10 h-10 mb-3 text-gray-400" />
            <p>{t("credits.noLogs") || "No credit usage found yet."}</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left font-medium text-gray-500">
                    {t("credits.date") || "Date"}
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-gray-500">
                    {t("credits.change") || "Change"}
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-gray-500">
                    {t("credits.balance") || "Balance After"}
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-gray-500">
                    {t("credits.reason") || "Reason"}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {logs.map((entry) => {
                  const isDebit = entry.change_type === "debit";
                  return (
                    <tr key={entry.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2 text-gray-700">
                          <Calendar className="w-4 h-4 text-gray-400" />
                          <span>
                            {(entry.date ?? entry.created_at)
                              ? new Date(entry.date ?? entry.created_at).toLocaleString()
                              : "-"}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                            isDebit
                              ? "bg-red-50 text-red-700"
                              : "bg-green-50 text-green-700"
                          }`}
                        >
                          {isDebit ? (
                            <ArrowDownCircle className="w-3 h-3" />
                          ) : (
                            <ArrowUpCircle className="w-3 h-3" />
                          )}
                          {isDebit ? "-" : "+"}
                          {entry.credits_changed}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-800">
                        {entry.balance_after}
                      </td>
                      <td className="px-4 py-3 text-gray-700">
                        {entry.reason || "-"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

