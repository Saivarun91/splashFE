"use client"

import { OrganizationContent } from "@/components/organization/organization-content"

export default function OrganizationsPage() {
    return (
        <div className="flex h-screen bg-[#fcfcfc]">
            <div className="flex-1 flex flex-col overflow-hidden">
                <OrganizationContent />
            </div>
        </div>
    )
}

