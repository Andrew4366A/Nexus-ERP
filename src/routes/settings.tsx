import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";

import { AppSidebar } from "@/components/app-sidebar";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

export const Route = createFileRoute("/settings")({
  head: () => ({
    meta: [
      { title: "Settings — Nexus ERP" },
      { name: "description", content: "Manage your profile, notifications, and company settings." },
    ],
  }),
  component: SettingsPage,
});

function SettingsPage() {
  const [emailAlerts, setEmailAlerts] = useState(true);
  const [weeklyDigest, setWeeklyDigest] = useState(false);
  const [stockAlerts, setStockAlerts] = useState(true);
  const [payrollReminders, setPayrollReminders] = useState(true);

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="sticky top-0 z-10 flex h-16 items-center gap-3 border-b border-border/60 bg-background/80 px-6 backdrop-blur">
          <SidebarTrigger />
          <div>
            <h1 className="text-base font-semibold tracking-tight">Settings</h1>
            <p className="text-xs text-muted-foreground">
              Manage your account and workspace preferences
            </p>
          </div>
        </header>

        <main className="flex-1 p-6">
          <Tabs defaultValue="profile" className="space-y-6">
            <TabsList>
              <TabsTrigger value="profile">Profile</TabsTrigger>
              <TabsTrigger value="notifications">Notifications</TabsTrigger>
              <TabsTrigger value="company">Company Settings</TabsTrigger>
            </TabsList>

            <TabsContent value="profile">
              <Card className="shadow-[var(--shadow-card)]">
                <CardHeader>
                  <CardTitle>Profile</CardTitle>
                  <CardDescription>
                    Update your personal information and how others see you.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-5">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="name">Full name</Label>
                      <Input id="name" defaultValue="Alex Morgan" placeholder="Your name" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        type="email"
                        defaultValue="alex@nexuserp.com"
                        placeholder="you@company.com"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="role">Role</Label>
                    <Input id="role" defaultValue="Operations Manager" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="bio">Bio</Label>
                    <Textarea
                      id="bio"
                      rows={3}
                      placeholder="A short description about you"
                      defaultValue="Leading operations across logistics and warehousing."
                    />
                  </div>
                  <Separator />
                  <div className="flex justify-end gap-2">
                    <Button variant="outline">Cancel</Button>
                    <Button>Save changes</Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="notifications">
              <Card className="shadow-[var(--shadow-card)]">
                <CardHeader>
                  <CardTitle>Notifications</CardTitle>
                  <CardDescription>Choose what updates you want to receive.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-1">
                  <ToggleRow
                    title="Email alerts"
                    description="Receive important account and security alerts by email."
                    checked={emailAlerts}
                    onCheckedChange={setEmailAlerts}
                  />
                  <Separator />
                  <ToggleRow
                    title="Low stock alerts"
                    description="Get notified when inventory dips below threshold."
                    checked={stockAlerts}
                    onCheckedChange={setStockAlerts}
                  />
                  <Separator />
                  <ToggleRow
                    title="Payroll reminders"
                    description="Reminders before each payroll cycle closes."
                    checked={payrollReminders}
                    onCheckedChange={setPayrollReminders}
                  />
                  <Separator />
                  <ToggleRow
                    title="Weekly digest"
                    description="A Monday-morning summary of last week's activity."
                    checked={weeklyDigest}
                    onCheckedChange={setWeeklyDigest}
                  />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="company">
              <Card className="shadow-[var(--shadow-card)]">
                <CardHeader>
                  <CardTitle>Company Settings</CardTitle>
                  <CardDescription>Configure your organization's workspace defaults.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-5">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="company">Company name</Label>
                      <Input id="company" defaultValue="Nexus Industries" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="vat">VAT / Tax ID</Label>
                      <Input id="vat" defaultValue="EU-9472810" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="hq">Headquarters</Label>
                      <Input id="hq" defaultValue="Berlin, Germany" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="currency">Default currency</Label>
                      <Input id="currency" defaultValue="EUR" />
                    </div>
                  </div>
                  <Separator />
                  <div className="flex justify-end gap-2">
                    <Button variant="outline">Cancel</Button>
                    <Button>Save changes</Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}

function ToggleRow({
  title,
  description,
  checked,
  onCheckedChange,
}: {
  title: string;
  description: string;
  checked: boolean;
  onCheckedChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-4 py-4">
      <div className="space-y-0.5">
        <p className="text-sm font-medium">{title}</p>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
      <Switch checked={checked} onCheckedChange={onCheckedChange} />
    </div>
  );
}
