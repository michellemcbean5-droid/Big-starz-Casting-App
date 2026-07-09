"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

const mockContracts = [
  { id: "1", talent: "Alice Smith", type: "AI Consent", signedAt: "2025-01-10", status: "signed" },
  { id: "2", talent: "Bob Jones", type: "Standard Talent", signedAt: null, status: "pending" },
  { id: "3", talent: "Charlie Doe", type: "Digital Twin", signedAt: "2025-01-12", status: "signed" },
];

export default function AdminContractsPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-foreground">Contract Management</h1>

      <Card className="bg-surface border-border">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="border-border hover:bg-transparent">
                <TableHead className="text-muted-foreground">Talent</TableHead>
                <TableHead className="text-muted-foreground">Type</TableHead>
                <TableHead className="text-muted-foreground">Signed</TableHead>
                <TableHead className="text-muted-foreground">Status</TableHead>
                <TableHead className="text-muted-foreground text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {mockContracts.map((c) => (
                <TableRow key={c.id} className="border-border">
                  <TableCell className="text-foreground">{c.talent}</TableCell>
                  <TableCell className="text-muted-foreground">{c.type}</TableCell>
                  <TableCell className="text-muted-foreground">{c.signedAt || "—"}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className={c.status === "signed" ? "border-green-500 text-green-500" : "border-gold text-gold"}>
                      {c.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm" className="text-gold hover:text-gold">View</Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
