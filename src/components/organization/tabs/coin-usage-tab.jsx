"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Coins, TrendingUp, TrendingDown, Calendar, Download, Search } from "lucide-react"
import { apiService } from "@/lib/api"
import { useAuth } from "@/context/AuthContext"

export function CoinUsageTab() {
    const { token, user } = useAuth()
    const [organizations, setOrganizations] = useState([])
    const [selectedOrgId, setSelectedOrgId] = useState(null)
    const [usageData, setUsageData] = useState(null)
    const [summary, setSummary] = useState(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)
    const [searchTerm, setSearchTerm] = useState("")
    const [dateRange, setDateRange] = useState({
        start_date: "",
        end_date: ""
    })
    const [changeTypeFilter, setChangeTypeFilter] = useState("all") // all, debit, credit

    const isAdmin = user?.role === "admin"

    useEffect(() => {
        if (isAdmin) {
            loadOrganizations()
        } else if (user?.organization) {
            setSelectedOrgId(user.organization.id || user.organization)
            loadCreditUsage(user.organization.id || user.organization)
            loadCreditSummary(user.organization.id || user.organization)
        }
    }, [token, user, isAdmin])

    useEffect(() => {
        if (selectedOrgId) {
            loadCreditUsage(selectedOrgId)
            loadCreditSummary(selectedOrgId)
        }
    }, [selectedOrgId, token, dateRange, changeTypeFilter])

    const loadOrganizations = async () => {
        try {
            const response = await apiService.listOrganizations(token)
            if (response.organizations) {
                setOrganizations(response.organizations)
                if (response.organizations.length > 0 && !selectedOrgId) {
                    setSelectedOrgId(response.organizations[0].id)
                }
            }
        } catch (err) {
            console.error("Error loading organizations:", err)
            setError(err.message || "Failed to load organizations")
        }
    }

    const loadCreditUsage = async (orgId) => {
        try {
            setLoading(true)
            setError(null)
            const params = {}
            if (dateRange.start_date) params.start_date = dateRange.start_date
            if (dateRange.end_date) params.end_date = dateRange.end_date
            if (changeTypeFilter !== "all") params.change_type = changeTypeFilter

            const response = await apiService.getOrganizationCreditUsage(orgId, params, token)
            if (response) {
                setUsageData(response)
            }
        } catch (err) {
            console.error("Error loading credit usage:", err)
            setError(err.message || "Failed to load credit usage")
        } finally {
            setLoading(false)
        }
    }

    const loadCreditSummary = async (orgId) => {
        try {
            const response = await apiService.getOrganizationCreditSummary(orgId, token)
            if (response) {
                setSummary(response)
            }
        } catch (err) {
            console.error("Error loading credit summary:", err)
        }
    }

    const filteredUsageData = usageData?.usage_data?.filter(entry =>
        entry.reason?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        entry.user_email?.toLowerCase().includes(searchTerm.toLowerCase())
    ) || []

    if (loading && !usageData) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="text-[#737373]">Loading credit usage...</div>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h2 className="text-2xl font-bold text-[#1a1a1a]">Coin Usage</h2>
                <p className="text-sm text-[#737373] mt-1">Track organization credit usage and transactions</p>
            </div>

            {/* Organization Selector (Admin only) */}
            {isAdmin && organizations.length > 0 && (
                <div>
                    <label className="text-sm font-medium text-[#1a1a1a] mb-2 block">Select Organization</label>
                    <select
                        value={selectedOrgId || ""}
                        onChange={(e) => setSelectedOrgId(e.target.value)}
                        className="w-full px-3 py-2 border border-[#e6e6e6] rounded-md"
                    >
                        {organizations.map(org => (
                            <option key={org.id} value={org.id}>{org.name}</option>
                        ))}
                    </select>
                </div>
            )}

            {/* Summary Cards */}
            {usageData && (
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="bg-white rounded-lg border border-[#e6e6e6] p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-[#737373]">Current Balance</p>
                                <p className="text-2xl font-bold text-[#1a1a1a] mt-1">
                                    {usageData.organization?.current_balance || 0}
                                </p>
                            </div>
                            <Coins className="w-8 h-8 text-[#884cff]" />
                        </div>
                    </div>
                    <div className="bg-white rounded-lg border border-[#e6e6e6] p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-[#737373]">Total Credits</p>
                                <p className="text-2xl font-bold text-green-600 mt-1">
                                    {usageData.summary?.total_credits || 0}
                                </p>
                            </div>
                            <TrendingUp className="w-8 h-8 text-green-600" />
                        </div>
                    </div>
                    <div className="bg-white rounded-lg border border-[#e6e6e6] p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-[#737373]">Total Debits</p>
                                <p className="text-2xl font-bold text-red-600 mt-1">
                                    {usageData.summary?.total_debits || 0}
                                </p>
                            </div>
                            <TrendingDown className="w-8 h-8 text-red-600" />
                        </div>
                    </div>
                    <div className="bg-white rounded-lg border border-[#e6e6e6] p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-[#737373]">Net Usage</p>
                                <p className={`text-2xl font-bold mt-1 ${
                                    (usageData.summary?.net_usage || 0) >= 0 ? "text-red-600" : "text-green-600"
                                }`}>
                                    {usageData.summary?.net_usage || 0}
                                </p>
                            </div>
                            <Calendar className="w-8 h-8 text-[#737373]" />
                        </div>
                    </div>
                </div>
            )}

            {/* Filters */}
            <div className="bg-white rounded-lg border border-[#e6e6e6] p-4">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div>
                        <label className="text-sm font-medium text-[#1a1a1a] mb-2 block">Start Date</label>
                        <Input
                            type="date"
                            value={dateRange.start_date}
                            onChange={(e) => setDateRange({ ...dateRange, start_date: e.target.value })}
                        />
                    </div>
                    <div>
                        <label className="text-sm font-medium text-[#1a1a1a] mb-2 block">End Date</label>
                        <Input
                            type="date"
                            value={dateRange.end_date}
                            onChange={(e) => setDateRange({ ...dateRange, end_date: e.target.value })}
                        />
                    </div>
                    <div>
                        <label className="text-sm font-medium text-[#1a1a1a] mb-2 block">Type</label>
                        <select
                            value={changeTypeFilter}
                            onChange={(e) => setChangeTypeFilter(e.target.value)}
                            className="w-full px-3 py-2 border border-[#e6e6e6] rounded-md"
                        >
                            <option value="all">All</option>
                            <option value="debit">Debits</option>
                            <option value="credit">Credits</option>
                        </select>
                    </div>
                    <div className="flex items-end">
                        <Button
                            onClick={() => {
                                setDateRange({ start_date: "", end_date: "" })
                                setChangeTypeFilter("all")
                            }}
                            variant="outline"
                            className="w-full"
                        >
                            Clear Filters
                        </Button>
                    </div>
                </div>
            </div>

            {/* Search */}
            <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#737373] w-4 h-4" />
                <Input
                    placeholder="Search by reason or user email..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                />
            </div>

            {/* Error Message */}
            {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <p className="text-red-600">{error}</p>
                </div>
            )}

            {/* Usage Table */}
            <div className="bg-white rounded-lg border border-[#e6e6e6] overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gray-50 border-b border-[#e6e6e6]">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-[#1a1a1a]">Date</th>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-[#1a1a1a]">Type</th>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-[#1a1a1a]">Amount</th>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-[#1a1a1a]">Balance After</th>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-[#1a1a1a]">Reason</th>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-[#1a1a1a]">User</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[#e6e6e6]">
                            {filteredUsageData.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-6 py-12 text-center text-[#737373]">
                                        No usage data found
                                    </td>
                                </tr>
                            ) : (
                                filteredUsageData.map((entry) => (
                                    <tr key={entry.id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 text-sm text-[#1a1a1a]">
                                            {entry.date
                                                ? new Date(entry.date).toLocaleDateString()
                                                : "N/A"}
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                                entry.change_type === "credit"
                                                    ? "bg-green-100 text-green-700"
                                                    : "bg-red-100 text-red-700"
                                            }`}>
                                                {entry.change_type}
                                            </span>
                                        </td>
                                        <td className={`px-6 py-4 text-sm font-medium ${
                                            entry.change_type === "credit" ? "text-green-600" : "text-red-600"
                                        }`}>
                                            {entry.change_type === "credit" ? "+" : "-"}{entry.credits_changed}
                                        </td>
                                        <td className="px-6 py-4 text-sm text-[#1a1a1a]">
                                            {entry.balance_after}
                                        </td>
                                        <td className="px-6 py-4 text-sm text-[#737373]">
                                            {entry.reason || "N/A"}
                                        </td>
                                        <td className="px-6 py-4 text-sm text-[#737373]">
                                            {entry.user_email || "N/A"}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    )
}

