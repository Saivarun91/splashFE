"use client"

import { useState } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { OrganizationsTab } from "./tabs/organizations-tab"
import { UsersTab } from "./tabs/users-tab"
import { ProjectsTab } from "./tabs/projects-tab"
import { CoinUsageTab } from "./tabs/coin-usage-tab"
import { Building2, Users, FolderKanban, Coins } from "lucide-react"

export function OrganizationContent() {
    const [activeTab, setActiveTab] = useState("organizations")

    return (
        <div className="flex-1 overflow-auto bg-gray-50">
            <div className="max-w-7xl mx-auto p-6">
                <div className="mb-6">
                    <h1 className="text-3xl font-bold text-gray-900">Organizations</h1>
                    <p className="text-sm text-gray-500 mt-1">Manage organizations, users, projects, and credit usage</p>
                </div>

                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                    <TabsList className="grid w-full grid-cols-4 mb-6">
                        <TabsTrigger value="organizations" className="flex items-center gap-2">
                            <Building2 className="w-4 h-4" />
                            Organizations
                        </TabsTrigger>
                        <TabsTrigger value="users" className="flex items-center gap-2">
                            <Users className="w-4 h-4" />
                            Users
                        </TabsTrigger>
                        <TabsTrigger value="projects" className="flex items-center gap-2">
                            <FolderKanban className="w-4 h-4" />
                            Projects
                        </TabsTrigger>
                        <TabsTrigger value="coin-usage" className="flex items-center gap-2">
                            <Coins className="w-4 h-4" />
                            Coin Usage
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent value="organizations" className="mt-0">
                        <OrganizationsTab />
                    </TabsContent>

                    <TabsContent value="users" className="mt-0">
                        <UsersTab />
                    </TabsContent>

                    <TabsContent value="projects" className="mt-0">
                        <ProjectsTab />
                    </TabsContent>

                    <TabsContent value="coin-usage" className="mt-0">
                        <CoinUsageTab />
                    </TabsContent>
                </Tabs>
            </div>
        </div>
    )
}

