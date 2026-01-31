"use client";

import { useState, useEffect, useRef } from "react";
import { X, Download, Loader2, FileText } from "lucide-react";
import { apiService } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";

export function InvoiceView({ transactionId, onClose, paymentData }) {
    const { token } = useAuth();
    const [invoice, setInvoice] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [downloading, setDownloading] = useState(false);
    const [invoiceConfig, setInvoiceConfig] = useState({
        company_name: "Splash Ai Studio",
        invoice_prefix: "INV-",
        tax_rate: 18,
        bank_name: "Borcelle Bank",
        account_name: "Studio Shodwe",
        account_number: "123-456-7890",
        pay_by_date: 30,
        terms_and_conditions: "Late payments may result in a 2% penalty fee.",
    });
    const invoiceRef = useRef(null);

    useEffect(() => {
        if (transactionId || paymentData) {
            fetchInvoiceConfig();
        }
    }, [transactionId, paymentData]);

    const fetchInvoiceConfig = async () => {
        try {
            // Try to load from localStorage first (fallback)
            const localConfig = typeof window !== 'undefined' ? localStorage.getItem('invoice_config') : null;
            if (localConfig) {
                try {
                    const parsed = JSON.parse(localConfig);
                    setInvoiceConfig(parsed);
                } catch (e) {
                    console.warn("Failed to parse local config:", e);
                }
            }
            
            if (token) {
                const data = await apiService.getInvoiceConfig(token);
                if (data) {
                    setInvoiceConfig(data);
                    // Update localStorage with server data
                    if (typeof window !== 'undefined') {
                        localStorage.setItem('invoice_config', JSON.stringify(data));
                    }
                }
            }
        } catch (err) {
            console.warn("Invoice config endpoint not available, using defaults or local storage:", err.message);
            
            // If we have local storage, use it
            const localConfig = typeof window !== 'undefined' ? localStorage.getItem('invoice_config') : null;
            if (localConfig) {
                try {
                    const parsed = JSON.parse(localConfig);
                    setInvoiceConfig(parsed);
                } catch (e) {
                    // If parsing fails, keep defaults
                }
            }
        } finally {
            setLoading(false);
        }
    };

    const downloadPDF = async () => {
        if (!invoiceRef.current) return;
        
        setDownloading(true);
        try {
            // Dynamically import html2pdf only on client side
            const html2pdf = (await import("html2pdf.js")).default;
            
            const opt = {
                margin: 0,
                filename: `Invoice_${invoiceData?.invoice_number || transactionId || 'invoice'}.pdf`,
                image: { type: "jpeg", quality: 1 },
                html2canvas: { scale: 3 },
                jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
            };

            await html2pdf()
                .from(invoiceRef.current)
                .set(opt)
                .save();
            
            setDownloading(false);
        } catch (err) {
            console.error("Error generating PDF:", err);
            setDownloading(false);
            alert("Failed to generate PDF. Please try again.");
        }
    };

    // Use payment data if invoice is not available
    const invoiceData = invoice || paymentData;
    const config = invoiceConfig || {};
    
    // Calculate amounts
    // Prefer server-calculated tax breakdown if available
    const baseAmount = invoiceData?.amount || invoiceData?.base_amount || 0;
    const taxRate = (invoiceData?.tax_rate ?? config.tax_rate) || 18;
    const tax = invoiceData?.tax_amount ?? (baseAmount * taxRate) / 100;
    const total = invoiceData?.total_amount ?? (baseAmount + tax);
    
    // Get billing details from payment data
    const name = invoiceData?.billing_name || invoiceData?.user_name || "Customer Name";
    const address = invoiceData?.billing_address || "Address not provided";
    const phone = invoiceData?.billing_phone || "Phone not provided";
    const email = invoiceData?.user_email || invoiceData?.email || "";
    const gstNumber = invoiceData?.billing_gst_number || "";
    const billingType = invoiceData?.billing_type || "individual";
    
    // Format date
    const formatDate = (dateString) => {
        if (!dateString) return new Date().toLocaleDateString('en-GB');
        const date = new Date(dateString);
        return date.toLocaleDateString('en-GB');
    };

    // Calculate pay by date
    const getPayByDate = () => {
        const invoiceDate = invoiceData?.created_at || invoiceData?.date || new Date();
        const days = config.pay_by_date || 30;
        const payBy = new Date(invoiceDate);
        payBy.setDate(payBy.getDate() + days);
        return formatDate(payBy);
    };

    const invoiceNumber = invoiceData?.invoice_number || config.invoice_prefix + (invoiceData?.id || transactionId || '00000');
    const invoiceDate = formatDate(invoiceData?.created_at || invoiceData?.date);

    useEffect(() => {
        // Add print styles
        const style = document.createElement('style');
        style.textContent = `
            @media print {
                .invoice-header-bar {
                    display: none !important;
                }
                body {
                    overflow: visible !important;
                }
            }
        `;
        document.head.appendChild(style);
        return () => {
            if (document.head.contains(style)) {
                document.head.removeChild(style);
            }
        };
    }, []);

    return (
        <div className="fixed inset-0 z-50 bg-white overflow-y-auto">
            {/* Header Bar with Actions */}
            <div className="invoice-header-bar sticky top-0 z-10 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between shadow-sm">
                <h2 className="text-2xl font-bold text-gray-900">Invoice</h2>
                <div className="flex items-center gap-3">
                    <button
                        onClick={downloadPDF}
                        disabled={downloading || loading || !invoiceData}
                        className="px-4 py-2 bg-[#8f6ae1] hover:bg-[#7a5bc7] text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                        {downloading ? (
                            <>
                                <Loader2 className="w-4 h-4 animate-spin" />
                                Generating PDF...
                            </>
                        ) : (
                            <>
                                <Download className="w-4 h-4" />
                                Download PDF
                            </>
                        )}
                    </button>
                    <button
                        onClick={onClose}
                        className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>
            </div>

            {/* Invoice Content */}
            <div className="flex justify-center py-8 px-4">
                {loading ? (
                    <div className="flex items-center justify-center py-12">
                        <Loader2 className="w-8 h-8 animate-spin text-[#8f6ae1]" />
                    </div>
                ) : error ? (
                    <div className="text-center py-12">
                        <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                        <p className="text-red-600">{error}</p>
                    </div>
                ) : invoiceData ? (
                    <div ref={invoiceRef} style={styles.page}>
                        <div style={styles.header}>
                            <div>
                                <div style={styles.logo}>Splash</div>
                                <div style={styles.subLogo}>AI STUDIO</div>
                            </div>

                            <div style={styles.invoiceTitle}>
                                <h1 style={styles.invoiceText}>INVOICE</h1>
                                <p><strong>Invoice #</strong> {invoiceNumber}</p>
                                <p><strong>Date:</strong> {invoiceDate}</p>
                            </div>
                        </div>

                        <div style={styles.purpleLine}></div>

                        <div style={styles.billing}>
                            <h4>Billed to:</h4>
                            <p>{name}</p>
                            <p>{address}</p>
                            <p>{phone}</p>
                            {email && <p>{email}</p>}
                            {gstNumber && billingType === "business" && (
                                <p><strong>GST Number:</strong> {gstNumber}</p>
                            )}
                        </div>

                        <table style={styles.table}>
                            <thead>
                                <tr>
                                    <th style={styles.th}>Items</th>
                                    <th style={styles.th}>Quantity</th>
                                    <th style={styles.th}>Unit Price</th>
                                    <th style={styles.th}>Total</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr>
                                    <td style={styles.td}>{invoiceData.plan_name || invoiceData.plan || "Credit Purchase"}</td>
                                    <td style={styles.td}>1</td>
                                    <td style={styles.td}>${baseAmount.toFixed(2)}</td>
                                    <td style={styles.td}>${baseAmount.toFixed(2)}</td>
                                </tr>
                                <tr>
                                    <td style={styles.td}>GST</td>
                                    <td style={styles.td}>{taxRate}%</td>
                                    <td style={styles.td}>${tax.toFixed(2)}</td>
                                    <td style={styles.td}>${tax.toFixed(2)}</td>
                                </tr>
                            </tbody>
                        </table>

                        <div style={styles.totalBox}>
                            <span>Total</span>
                            <span>${total.toFixed(2)}</span>
                        </div>

                        <div style={styles.footer}>
                            <p style={styles.thanks}>Thank you for your business</p>

                            <div style={styles.section}>
                                <h4>Payment Information</h4>
                                <p>{config.bank_name || "Borcelle Bank"}</p>
                                <p>Account Name: {config.account_name || "Studio Shodwe"}</p>
                                <p>Account No.: {config.account_number || "123-456-7890"}</p>
                                <p>Pay by: {getPayByDate()}</p>
                            </div>

                            <div style={styles.section}>
                                <h4>Terms and conditions</h4>
                                <p>{config.terms_and_conditions || "Late payments may result in a 2% penalty fee."}</p>
                            </div>

                            <p style={styles.brand}>{config.company_name || "Splash AI Studio"}</p>
                        </div>
                    </div>
                ) : null}
            </div>
        </div>
    );
}

/* ===================== STYLES ===================== */

const styles = {
    page: {
        width: "210mm",
        minHeight: "297mm",
        padding: "20mm",
        background: "#fff",
        fontFamily: "Arial, sans-serif",
        color: "#000",
        margin: "0 auto",
        boxShadow: "0 0 10px rgba(0,0,0,0.1)",
    },

    header: {
        display: "flex",
        justifyContent: "space-between",
    },

    logo: {
        fontSize: "36px",
        fontWeight: "700",
    },

    subLogo: {
        letterSpacing: "3px",
        fontSize: "14px",
    },

    invoiceTitle: {
        textAlign: "right",
    },

    invoiceText: {
        fontSize: "42px",
        margin: 0,
    },

    purpleLine: {
        height: "10px",
        background: "#8f6ae1",
        margin: "20px 0",
    },

    billing: {
        marginBottom: "25px",
    },

    table: {
        width: "100%",
        borderCollapse: "collapse",
    },

    th: {
        background: "#8f6ae1",
        color: "#fff",
        padding: "10px",
    },

    td: {
        padding: "10px",
        borderBottom: "1px solid #ddd",
    },

    totalBox: {
        marginTop: "20px",
        background: "#8f6ae1",
        color: "#fff",
        width: "260px",
        padding: "12px",
        display: "flex",
        justifyContent: "space-between",
        fontWeight: "bold",
        marginLeft: "auto",
    },

    footer: {
        marginTop: "80px",
        textAlign: "left",
    },

    thanks: {
        fontWeight: "bold",
        marginBottom: "30px",
        textAlign: "left",
    },

    section: {
        marginBottom: "20px",
        textAlign: "left",
    },

    brand: {
        marginTop: "40px",
        fontSize: "14px",
        opacity: 0.7,
        textAlign: "left",
    },
};
