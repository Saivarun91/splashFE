"use client"

import { OrganizationContent } from "@/components/organization/organization-content"

export default function OrganizationsPage() {
    return (
        <div className="flex h-screen bg-gradient-to-br from-gray-50 via-purple-50/30 to-pink-50/20">
            <div className="flex-1 flex flex-col overflow-hidden">
                <OrganizationContent />
            </div>
        </div>
    )
}

