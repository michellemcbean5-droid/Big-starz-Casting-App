"use client";

import { useAuth } from "@/context/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Briefcase, DollarSign, Sparkles, ArrowRight, TrendingUp } from "lucide-react";
import Link from "next/link";

const mockCastingCalls = [
  { id: "1", title: "Sci-Fi Lead — Feature Film", type: "Feature", location: "Los Angeles", budget: 5000, deadline: "2025-02-01" },
  { id: "2", title: "Commercial — Sports Brand", type: "Commercial", location: "Remote", budget: 2000, deadline: "2025-01-28" },
  { id: "3", title: "Indie Drama — Supporting", type: "Indie", location: "New York", budget: 1500, deadline: "2025-01-25" },
];

const mockActivity = [
  "Applied to Sci-Fi Lead — Feature Film",
  "AI Scene generated for Reel #4",
  "Profile viewed by Casting Director",
  "Subscription upgraded to Silver",
];

export default function DashboardHomePage() {
  const { user } = useAuth();
  const roleLabel = user?.role ? user.role.replace("_", " ") : "Talent";

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">
          Welcome back, <span className="text-gold">{user?.email?.split("@")[0] || "Star"}</span>
        </h1>
        <p className="text-muted-foreground mt-1 capitalize">{roleLabel} Dashboard</p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="bg-surface border-border">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Applications</CardTitle>
            <Briefcase className="w-4 h-4 text-gold" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">12</div>
            <p className="text-xs text-muted-foreground">3 pending review</p>
          </CardContent>
        </Card>
        <Card className="bg-surface border-border">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Earnings</CardTitle>
            <DollarSign className="w-4 h-4 text-gold" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">$4,250</div>
            <p className="text-xs text-muted-foreground">+$1,200 this month</p>
          </CardContent>
        </Card>
        <Card className="bg-surface border-border">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">AI Generations</CardTitle>
            <Sparkles className="w-4 h-4 text-gold" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">8 / 25</div>
            <p className="text-xs text-muted-foreground">Used this month</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="bg-surface border-border">
          <CardHeader>
            <CardTitle className="text-foreground">Recent Activity</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {mockActivity.map((act, i) => (
              <div key={i} className="flex items-center gap-3 text-sm text-muted-foreground">
                <TrendingUp className="w-4 h-4 text-gold" />
                {act}
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="bg-surface border-border">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-foreground">Recommended Casting Calls</CardTitle>
            <Link href="/casting-calls">
              <Button variant="ghost" size="sm" className="text-gold">
                View all <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent className="space-y-3">
            {mockCastingCalls.map((call) => (
              <div key={call.id} className="flex items-center justify-between p-3 rounded-lg bg-secondary hover:bg-secondary/80 transition-colors">
                <div>
                  <p className="font-medium text-foreground text-sm">{call.title}</p>
                  <p className="text-xs text-muted-foreground">{call.location} • ${call.budget}</p>
                </div>
                <Badge variant="outline" className="border-gold text-gold text-xs">{call.type}</Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <Card className="bg-surface border-border">
        <CardHeader>
          <CardTitle className="text-foreground">AI Studio Quick Actions</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-3">
          <Link href="/studio">
            <Button className="bg-gold text-background hover:bg-light-gold">Scene Generator</Button>
          </Link>
          <Link href="/studio">
            <Button variant="outline" className="border-gold text-gold hover:bg-gold/10">Reel Generator</Button>
          </Link>
          <Link href="/studio">
            <Button variant="outline" className="border-gold text-gold hover:bg-gold/10">Music Video</Button>
          </Link>
          <Link href="/studio">
            <Button variant="outline" className="border-gold text-gold hover:bg-gold/10">Digital Twin</Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
