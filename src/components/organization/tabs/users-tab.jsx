"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Plus, Users, Mail, Shield, Search, X } from "lucide-react"
import { apiService } from "@/lib/api"
import { useAuth } from "@/context/AuthContext"

export function UsersTab() {
    const { token, user } = useAuth()
    const [organizations, setOrganizations] = useState([])
    const [selectedOrgId, setSelectedOrgId] = useState(null)
    const [orgUsers, setOrgUsers] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)
    const [searchTerm, setSearchTerm] = useState("")
    const [isAddUserDialogOpen, setIsAddUserDialogOpen] = useState(false)
    
    const [addUserForm, setAddUserForm] = useState({
        user_email: "",
        organization_id: "",
        organization_role: "member"
    })

    const isAdmin = user?.role === "admin"
    const roleOptions = [
        { value: "owner", label: "Owner" },
        { value: "chief_editor", label: "Chief Editor" },
        { value: "editor", label: "Editor" },
        { value: "admin", label: "Admin" },
        { value: "member", label: "Member" }
    ]

    useEffect(() => {
        if (isAdmin) {
            loadOrganizations()
        } else if (user?.organization) {
            setSelectedOrgId(user.organization.id || user.organization)
            loadOrganizationUsers(user.organization.id || user.organization)
        }
    }, [token, user, isAdmin])

    useEffect(() => {
        if (selectedOrgId) {
            loadOrganizationUsers(selectedOrgId)
        }
    }, [selectedOrgId, token])

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

    const loadOrganizationUsers = async (orgId) => {
        try {
            setLoading(true)
            setError(null)
            const response = await apiService.getOrganization(orgId, token)
            if (response.members) {
                setOrgUsers(response.members)
            }
        } catch (err) {
            console.error("Error loading organization users:", err)
            setError(err.message || "Failed to load users")
        } finally {
            setLoading(false)
        }
    }

    const handleAddUser = async () => {
        try {
            setError(null)
            if (!addUserForm.user_email || !addUserForm.organization_id) {
                setError("User email and organization are required")
                return
            }

            const response = await apiService.addUserToOrganization(
                addUserForm.user_email,
                addUserForm.organization_id,
                addUserForm.organization_role,
                token
            )

            if (response.success) {
                setIsAddUserDialogOpen(false)
                setAddUserForm({ user_email: "", organization_id: selectedOrgId || "", organization_role: "member" })
                loadOrganizationUsers(addUserForm.organization_id || selectedOrgId)
            } else {
                setError(response.error || "Failed to add user")
            }
        } catch (err) {
            console.error("Error adding user:", err)
            setError(err.message || "Failed to add user")
        }
    }

    const filteredUsers = orgUsers.filter(u =>
        u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (u.full_name && u.full_name.toLowerCase().includes(searchTerm.toLowerCase()))
    )

    if (loading && !orgUsers.length) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="text-[#737373]">Loading users...</div>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-[#1a1a1a]">Users</h2>
                    <p className="text-sm text-[#737373] mt-1">Manage organization members</p>
                </div>
                {isAdmin && (
                    <Dialog open={isAddUserDialogOpen} onOpenChange={setIsAddUserDialogOpen}>
                        <DialogTrigger asChild>
                            <Button className="bg-[#884cff] hover:bg-[#7a3ff0] text-white">
                                <Plus className="w-4 h-4 mr-2" />
                                Add User
                            </Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Add User to Organization</DialogTitle>
                            </DialogHeader>
                            <div className="space-y-4 mt-4">
                                {isAdmin && (
                                    <div>
                                        <label className="text-sm font-medium text-[#1a1a1a]">Organization</label>
                                        <select
                                            value={addUserForm.organization_id}
                                            onChange={(e) => setAddUserForm({ ...addUserForm, organization_id: e.target.value })}
                                            className="w-full mt-1 px-3 py-2 border border-[#e6e6e6] rounded-md"
                                        >
                                            <option value="">Select organization</option>
                                            {organizations.map(org => (
                                                <option key={org.id} value={org.id}>{org.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                )}
                                <div>
                                    <label className="text-sm font-medium text-[#1a1a1a]">User Email</label>
                                    <Input
                                        type="email"
                                        value={addUserForm.user_email}
                                        onChange={(e) => setAddUserForm({ ...addUserForm, user_email: e.target.value })}
                                        placeholder="Enter user email"
                                        className="mt-1"
                                    />
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-[#1a1a1a]">Role</label>
                                    <select
                                        value={addUserForm.organization_role}
                                        onChange={(e) => setAddUserForm({ ...addUserForm, organization_role: e.target.value })}
                                        className="w-full mt-1 px-3 py-2 border border-[#e6e6e6] rounded-md"
                                    >
                                        {roleOptions.map(role => (
                                            <option key={role.value} value={role.value}>{role.label}</option>
                                        ))}
                                    </select>
                                </div>
                                {error && (
                                    <div className="text-red-600 text-sm">{error}</div>
                                )}
                                <Button
                                    onClick={handleAddUser}
                                    className="w-full bg-[#884cff] hover:bg-[#7a3ff0] text-white"
                                >
                                    Add User
                                </Button>
                            </div>
                        </DialogContent>
                    </Dialog>
                )}
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

            {/* Search */}
            <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#737373] w-4 h-4" />
                <Input
                    placeholder="Search users..."
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

            {/* Users List */}
            <div className="grid gap-4">
                {filteredUsers.length === 0 ? (
                    <div className="text-center py-12 text-[#737373]">
                        <Users className="w-12 h-12 mx-auto mb-4 text-[#e6e6e6]" />
                        <p>No users found</p>
                    </div>
                ) : (
                    filteredUsers.map((user) => (
                        <div
                            key={user.id}
                            className="bg-white rounded-lg border border-[#e6e6e6] p-6 hover:shadow-md transition-shadow"
                        >
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 bg-[#884cff] rounded-full flex items-center justify-center text-white font-semibold">
                                        {user.email.charAt(0).toUpperCase()}
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-semibold text-[#1a1a1a]">
                                            {user.full_name || user.email}
                                        </h3>
                                        <div className="flex items-center gap-2 text-sm text-[#737373] mt-1">
                                            <Mail className="w-4 h-4" />
                                            <span>{user.email}</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="flex items-center gap-2 px-3 py-1 bg-[#f9f6f2] rounded-full">
                                        <Shield className="w-4 h-4 text-[#884cff]" />
                                        <span className="text-sm font-medium text-[#1a1a1a] capitalize">
                                            {user.organization_role || "member"}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    )
}

