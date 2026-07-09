"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Bell, Shield, CreditCard, Trash2 } from "lucide-react";

export default function SettingsPage() {
  const [emailNotif, setEmailNotif] = useState(true);
  const [pushNotif, setPushNotif] = useState(true);
  const [profilePublic, setProfilePublic] = useState(true);

  return (
    <div className="space-y-6 max-w-3xl">
      <h1 className="text-3xl font-bold text-foreground">Settings</h1>

      <Card className="bg-surface border-border">
        <CardHeader>
          <CardTitle className="text-foreground">Account</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Email</Label>
            <Input defaultValue="user@example.com" disabled className="bg-secondary border-border" />
          </div>
          <div className="space-y-2">
            <Label>Change Password</Label>
            <Input type="password" placeholder="New password" className="bg-secondary border-border" />
          </div>
          <Button className="bg-gold text-background hover:bg-light-gold">Update Account</Button>
        </CardContent>
      </Card>

      <Card className="bg-surface border-border">
        <CardHeader className="flex flex-row items-center gap-2">
          <Bell className="w-5 h-5 text-gold" />
          <CardTitle className="text-foreground">Notifications</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-foreground">Email Notifications</p>
              <p className="text-xs text-muted-foreground">Receive updates via email</p>
            </div>
            <Button variant={emailNotif ? "default" : "outline"} size="sm" onClick={() => setEmailNotif(!emailNotif)} className={emailNotif ? "bg-gold text-background" : ""}>
              {emailNotif ? "On" : "Off"}
            </Button>
          </div>
          <Separator className="bg-border" />
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-foreground">Push Notifications</p>
              <p className="text-xs text-muted-foreground">Browser push alerts</p>
            </div>
            <Button variant={pushNotif ? "default" : "outline"} size="sm" onClick={() => setPushNotif(!pushNotif)} className={pushNotif ? "bg-gold text-background" : ""}>
              {pushNotif ? "On" : "Off"}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-surface border-border">
        <CardHeader className="flex flex-row items-center gap-2">
          <Shield className="w-5 h-5 text-gold" />
          <CardTitle className="text-foreground">Privacy</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-foreground">Public Profile</p>
              <p className="text-xs text-muted-foreground">Make your profile visible to casting directors</p>
            </div>
            <Button variant={profilePublic ? "default" : "outline"} size="sm" onClick={() => setProfilePublic(!profilePublic)} className={profilePublic ? "bg-gold text-background" : ""}>
              {profilePublic ? "On" : "Off"}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-surface border-border">
        <CardHeader className="flex flex-row items-center gap-2">
          <CreditCard className="w-5 h-5 text-gold" />
          <CardTitle className="text-foreground">Subscription</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-foreground">Current Plan</p>
              <p className="text-xs text-muted-foreground">Your active subscription</p>
            </div>
            <Badge className="bg-gold text-background">Silver</Badge>
          </div>
          <Button variant="outline" className="border-gold text-gold hover:bg-gold/10">Manage Subscription</Button>
        </CardContent>
      </Card>

      <Card className="bg-surface border-border border-destructive">
        <CardHeader className="flex flex-row items-center gap-2">
          <Trash2 className="w-5 h-5 text-destructive" />
          <CardTitle className="text-destructive">Danger Zone</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">Once you delete your account, there is no going back. Please be certain.</p>
          <Button variant="destructive">Delete Account</Button>
        </CardContent>
      </Card>
    </div>
  );
}
