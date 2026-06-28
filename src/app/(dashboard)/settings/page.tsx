"use client";

import { PageHeader } from "@/components/layout/page-header";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function SettingsPage() {
  return (
    <div className="p-6 sm:p-10 max-w-6xl mx-auto">
      <PageHeader
        title="Settings"
        description="Manage your account settings and preferences."
      />

      <Tabs defaultValue="general" className="mt-6">
        <TabsList>
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="billing">Billing</TabsTrigger>
          <TabsTrigger value="team">Team</TabsTrigger>
          <TabsTrigger value="api">API Keys</TabsTrigger>
        </TabsList>
        <TabsContent value="general" className="mt-6">
          <div className="flex flex-col gap-6 animate-in fade-in-50 duration-500">
            <div className="rounded-lg border p-6">
              <h3 className="text-lg font-medium">Profile Settings</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Update your personal information.
              </p>
              {/* Form placeholder */}
              <div className="mt-4 h-32 rounded bg-muted/50" />
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
