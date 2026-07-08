"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FileText, Clock } from "lucide-react";

const mockApplications = [
  { id: "1", title: "Sci-Fi Lead — Feature Film", status: "pending", submittedAt: "2025-01-15", message: "Very interested in this role." },
  { id: "2", title: "Commercial — Sports Brand", status: "reviewed", submittedAt: "2025-01-12", message: "Available for callbacks." },
  { id: "3", title: "Indie Drama — Supporting", status: "accepted", submittedAt: "2025-01-10", message: "Thank you for the opportunity." },
];

const statusColors: Record<string, string> = {
  pending: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20",
  reviewed: "bg-blue-500/10 text-blue-500 border-blue-500/20",
  accepted: "bg-green-500/10 text-green-500 border-green-500/20",
  rejected: "bg-red-500/10 text-red-500 border-red-500/20",
};

export default function ApplicationsPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-foreground">My Applications</h1>

      <div className="grid gap-4">
        {mockApplications.map((app) => (
          <Card key={app.id} className="bg-surface border-border">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg text-foreground flex items-center gap-2">
                  <FileText className="w-5 h-5 text-gold" />
                  {app.title}
                </CardTitle>
                <Badge variant="outline" className={statusColors[app.status]}>
                  {app.status}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-2">
              <p className="text-sm text-muted-foreground">{app.message}</p>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Clock className="w-3 h-3" />
                Submitted {app.submittedAt}
              </div>
              <div className="flex gap-2 pt-2">
                <Button variant="outline" size="sm" className="border-gold text-gold hover:bg-gold/10">View Details</Button>
                <Button variant="ghost" size="sm" className="text-muted-foreground">Withdraw</Button>
              </div>
            </CardContent>
          </Card>
        ))}
        {mockApplications.length === 0 && <p className="text-muted-foreground">No applications yet.</p>}
      </div>
    </div>
  );
}
