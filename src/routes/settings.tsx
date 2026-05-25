import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useUserProfile, type UserProfile } from "@/lib/user-profile";

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
  const { profile, resetProfileDraft, updateProfile } = useUserProfile();
  const [profileForm, setProfileForm] = useState<UserProfile>(profile);
  const [emailAlerts, setEmailAlerts] = useState(true);
  const [weeklyDigest, setWeeklyDigest] = useState(false);
  const [stockAlerts, setStockAlerts] = useState(true);
  const [payrollReminders, setPayrollReminders] = useState(true);

  const updateProfileField = (field: keyof UserProfile, value: string) => {
    setProfileForm((current) => ({ ...current, [field]: value }));
  };

  const handleSaveProfile = () => {
    updateProfile(profileForm);
  };

  const handleCancelProfile = () => {
    setProfileForm(resetProfileDraft());
  };

  return (
    <div className="flex-1 p-6">
      <header className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>
        <p className="text-sm text-muted-foreground">
          Manage your account and workspace preferences
        </p>
      </header>

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
                      <Input
                        id="name"
                        value={profileForm.name}
                        placeholder="Your name"
                        onChange={(event) => updateProfileField("name", event.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        type="email"
                        value={profileForm.email}
                        placeholder="you@company.com"
                        onChange={(event) => updateProfileField("email", event.target.value)}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="role">Role</Label>
                    <Input
                      id="role"
                      value={profileForm.role}
                      onChange={(event) => updateProfileField("role", event.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="bio">Bio</Label>
                    <Textarea
                      id="bio"
                      rows={3}
                      placeholder="A short description about you"
                      value={profileForm.bio}
                      onChange={(event) => updateProfileField("bio", event.target.value)}
                    />
                  </div>
                  <Separator />
                  <div className="flex justify-end gap-2">
                    <Button type="button" variant="outline" onClick={handleCancelProfile}>
                      Cancel
                    </Button>
                    <Button type="button" onClick={handleSaveProfile}>
                      Save changes
                    </Button>
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
    </div>
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
