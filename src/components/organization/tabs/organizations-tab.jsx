"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Plus, Building2, Users, Coins, Trash2, Edit, Search, Wallet } from "lucide-react"
import { apiService } from "@/lib/api"
import { useAuth } from "@/context/AuthContext"

export function OrganizationsTab() {
    const { token, user } = useAuth()
    const [organizations, setOrganizations] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)
    const [searchTerm, setSearchTerm] = useState("")
    const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
    const [isAddCreditsDialogOpen, setIsAddCreditsDialogOpen] = useState(false)
    const [selectedOrg, setSelectedOrg] = useState(null)
    
    // Create form state
    const [createForm, setCreateForm] = useState({
        name: "",
        owner_email: "",
        initial_credits: 0
    })
    
    // Edit form state
    const [editForm, setEditForm] = useState({
        name: ""
    })
    
    // Add credits form state
    const [addCreditsForm, setAddCreditsForm] = useState({
        amount: "",
        reason: "Credit top-up by admin"
    })

    const isAdmin = user?.role === "admin"

    useEffect(() => {
        loadOrganizations()
    }, [token])

    const loadOrganizations = async () => {
        try {
            setLoading(true)
            setError(null)
            const response = await apiService.listOrganizations(token)
            if (response.organizations) {
                setOrganizations(response.organizations)
            }
        } catch (err) {
            console.error("Error loading organizations:", err)
            setError(err.message || "Failed to load organizations")
        } finally {
            setLoading(false)
        }
    }

    const handleCreateOrganization = async () => {
        try {
            setError(null)
            if (!createForm.name || !createForm.owner_email) {
                setError("Name and owner email are required")
                return
            }

            const response = await apiService.createOrganization(
                createForm.name,
                createForm.owner_email,
                parseInt(createForm.initial_credits) || 0,
                token
            )

            if (response.success) {
                setIsCreateDialogOpen(false)
                setCreateForm({ name: "", owner_email: "", initial_credits: 0 })
                loadOrganizations()
            } else {
                setError(response.error || "Failed to create organization")
            }
        } catch (err) {
            console.error("Error creating organization:", err)
            setError(err.message || "Failed to create organization")
        }
    }

    const handleUpdateOrganization = async () => {
        try {
            setError(null)
            if (!editForm.name) {
                setError("Name is required")
                return
            }

            const response = await apiService.updateOrganization(
                selectedOrg.id,
                { name: editForm.name },
                token
            )

            if (response.success) {
                setIsEditDialogOpen(false)
                setSelectedOrg(null)
                loadOrganizations()
            } else {
                setError(response.error || "Failed to update organization")
            }
        } catch (err) {
            console.error("Error updating organization:", err)
            setError(err.message || "Failed to update organization")
        }
    }

    const handleDeleteOrganization = async (orgId) => {
        if (!window.confirm("Are you sure you want to delete this organization? This action cannot be undone.")) {
            return
        }

        try {
            setError(null)
            const response = await apiService.deleteOrganization(orgId, token)
            if (response.success) {
                loadOrganizations()
            } else {
                setError(response.error || "Failed to delete organization")
            }
        } catch (err) {
            console.error("Error deleting organization:", err)
            setError(err.message || "Failed to delete organization")
        }
    }

    const openEditDialog = (org) => {
        setSelectedOrg(org)
        setEditForm({ name: org.name })
        setIsEditDialogOpen(true)
    }

    const openAddCreditsDialog = (org) => {
        setSelectedOrg(org)
        setAddCreditsForm({ amount: "", reason: "Credit top-up by admin" })
        setIsAddCreditsDialogOpen(true)
    }

    const handleAddCredits = async () => {
        try {
            setError(null)
            if (!addCreditsForm.amount || parseFloat(addCreditsForm.amount) <= 0) {
                setError("Valid amount is required")
                return
            }

            const response = await apiService.addOrganizationCredits(
                selectedOrg.id,
                parseFloat(addCreditsForm.amount),
                addCreditsForm.reason,
                token
            )

            if (response.success) {
                setIsAddCreditsDialogOpen(false)
                setAddCreditsForm({ amount: "", reason: "Credit top-up by admin" })
                loadOrganizations()
            } else {
                setError(response.error || "Failed to add credits")
            }
        } catch (err) {
            console.error("Error adding credits:", err)
            setError(err.message || "Failed to add credits")
        }
    }

    const filteredOrganizations = organizations.filter(org =>
        org.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        org.owner_email.toLowerCase().includes(searchTerm.toLowerCase())
    )

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="text-[#737373]">Loading organizations...</div>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900">Organizations</h2>
                    <p className="text-sm text-gray-500 mt-1">Manage organizations and their settings</p>
                </div>
                {isAdmin && (
                    <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                        <DialogTrigger asChild>
                            <Button className="bg-indigo-600 hover:bg-indigo-700 text-white">
                                <Plus className="w-4 h-4 mr-2" />
                                Create Organization
                            </Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Create New Organization</DialogTitle>
                            </DialogHeader>
                            <div className="space-y-4 mt-4">
                                <div>
                                    <label className="text-sm font-medium text-gray-900">Organization Name</label>
                                    <Input
                                        value={createForm.name}
                                        onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
                                        placeholder="Enter organization name"
                                        className="mt-1"
                                    />
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-gray-900">Owner Email</label>
                                    <Input
                                        type="email"
                                        value={createForm.owner_email}
                                        onChange={(e) => setCreateForm({ ...createForm, owner_email: e.target.value })}
                                        placeholder="Enter owner email"
                                        className="mt-1"
                                    />
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-gray-900">Initial Credits</label>
                                    <Input
                                        type="number"
                                        value={createForm.initial_credits}
                                        onChange={(e) => setCreateForm({ ...createForm, initial_credits: e.target.value })}
                                        placeholder="0"
                                        className="mt-1"
                                    />
                                </div>
                                {error && (
                                    <div className="text-red-600 text-sm">{error}</div>
                                )}
                                <Button
                                    onClick={handleCreateOrganization}
                                    className="w-full bg-indigo-600 hover:bg-indigo-700 text-white"
                                >
                                    Create Organization
                                </Button>
                            </div>
                        </DialogContent>
                    </Dialog>
                )}
            </div>

            {/* Search */}
            <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#737373] w-4 h-4" />
                <Input
                    placeholder="Search organizations..."
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

            {/* Organizations List */}
            <div className="grid gap-4">
                {filteredOrganizations.length === 0 ? (
                    <div className="text-center py-12 text-[#737373]">
                        <Building2 className="w-12 h-12 mx-auto mb-4 text-[#e6e6e6]" />
                        <p>No organizations found</p>
                    </div>
                ) : (
                    filteredOrganizations.map((org) => (
                        <div
                            key={org.id}
                            className="bg-white rounded-lg border border-[#e6e6e6] p-6 hover:shadow-md transition-shadow"
                        >
                            <div className="flex items-start justify-between">
                                <div className="flex-1">
                                    <div className="flex items-center gap-3 mb-2">
                                        <Building2 className="w-5 h-5 text-[#884cff]" />
                                        <h3 className="text-lg font-semibold text-[#1a1a1a]">{org.name}</h3>
                                    </div>
                                    <div className="grid grid-cols-3 gap-4 mt-4">
                                        <div className="flex items-center gap-2 text-sm text-[#737373]">
                                            <Users className="w-4 h-4" />
                                            <span>{org.member_count || 0} members</span>
                                        </div>
                                        <div className="flex items-center gap-2 text-sm text-[#737373]">
                                            <Coins className="w-4 h-4" />
                                            <span>{org.credit_balance || 0} credits</span>
                                        </div>
                                        <div className="text-sm text-[#737373]">
                                            Owner: {org.owner_email}
                                        </div>
                                    </div>
                                </div>
                                {isAdmin && (
                                    <div className="flex items-center gap-2">
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => openAddCreditsDialog(org)}
                                            className="text-green-600 hover:text-green-700"
                                            title="Add Credits"
                                        >
                                            <Wallet className="w-4 h-4" />
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => openEditDialog(org)}
                                            className="text-[#884cff] hover:text-[#7a3ff0]"
                                            title="Edit"
                                        >
                                            <Edit className="w-4 h-4" />
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => handleDeleteOrganization(org.id)}
                                            className="text-red-600 hover:text-red-700"
                                            title="Delete"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </Button>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Edit Dialog */}
            <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Edit Organization</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 mt-4">
                        <div>
                            <label className="text-sm font-medium text-[#1a1a1a]">Organization Name</label>
                            <Input
                                value={editForm.name}
                                onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                                placeholder="Enter organization name"
                                className="mt-1"
                            />
                        </div>
                        {error && (
                            <div className="text-red-600 text-sm">{error}</div>
                        )}
                        <Button
                            onClick={handleUpdateOrganization}
                            className="w-full bg-[#884cff] hover:bg-[#7a3ff0] text-white"
                        >
                            Update Organization
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Add Credits Dialog */}
            <Dialog open={isAddCreditsDialogOpen} onOpenChange={setIsAddCreditsDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Add Credits to {selectedOrg?.name}</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 mt-4">
                        <div>
                            <label className="text-sm font-medium text-[#1a1a1a]">Amount</label>
                            <Input
                                type="number"
                                value={addCreditsForm.amount}
                                onChange={(e) => setAddCreditsForm({ ...addCreditsForm, amount: e.target.value })}
                                placeholder="Enter credit amount"
                                className="mt-1"
                            />
                        </div>
                        <div>
                            <label className="text-sm font-medium text-[#1a1a1a]">Reason</label>
                            <Input
                                value={addCreditsForm.reason}
                                onChange={(e) => setAddCreditsForm({ ...addCreditsForm, reason: e.target.value })}
                                placeholder="Enter reason for credit addition"
                                className="mt-1"
                            />
                        </div>
                        {error && (
                            <div className="text-red-600 text-sm">{error}</div>
                        )}
                        <Button
                            onClick={handleAddCredits}
                            className="w-full bg-[#884cff] hover:bg-[#7a3ff0] text-white"
                        >
                            Add Credits
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    )
}

