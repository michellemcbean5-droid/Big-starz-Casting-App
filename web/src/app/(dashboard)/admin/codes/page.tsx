"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Copy } from "lucide-react";

const mockCodes = [
  { id: "1", code: "STAR-2025-001", tier: "free", maxUses: 100, usedCount: 45, expiresAt: "2025-06-01", revoked: false },
  { id: "2", code: "STAR-2025-002", tier: "bronze", maxUses: 50, usedCount: 12, expiresAt: "2025-05-01", revoked: false },
  { id: "3", code: "STAR-2025-003", tier: "silver", maxUses: 20, usedCount: 20, expiresAt: "2025-04-01", revoked: true },
];

export default function AdminCodesPage() {
  const [tier, setTier] = useState("free");
  const [maxUses, setMaxUses] = useState(100);

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-foreground">Master Codes</h1>

      <Card className="bg-surface border-border">
        <CardHeader>
          <CardTitle className="text-foreground">Generate New Code</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label>Tier</Label>
              <Input value={tier} onChange={(e) => setTier(e.target.value)} className="bg-secondary border-border" />
            </div>
            <div className="space-y-2">
              <Label>Max Uses</Label>
              <Input type="number" value={maxUses} onChange={(e) => setMaxUses(Number(e.target.value))} className="bg-secondary border-border" />
            </div>
            <div className="flex items-end">
              <Button className="bg-gold text-background hover:bg-light-gold">Generate Code</Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-surface border-border">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="border-border hover:bg-transparent">
                <TableHead className="text-muted-foreground">Code</TableHead>
                <TableHead className="text-muted-foreground">Tier</TableHead>
                <TableHead className="text-muted-foreground">Uses</TableHead>
                <TableHead className="text-muted-foreground">Expires</TableHead>
                <TableHead className="text-muted-foreground">Status</TableHead>
                <TableHead className="text-muted-foreground text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {mockCodes.map((c) => (
                <TableRow key={c.id} className="border-border">
                  <TableCell className="font-mono text-foreground">{c.code}</TableCell>
                  <TableCell className="capitalize text-muted-foreground">{c.tier}</TableCell>
                  <TableCell className="text-muted-foreground">{c.usedCount} / {c.maxUses}</TableCell>
                  <TableCell className="text-muted-foreground">{c.expiresAt}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className={c.revoked ? "border-destructive text-destructive" : "border-green-500 text-green-500"}>
                      {c.revoked ? "Revoked" : "Active"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon" className="text-gold hover:text-gold">
                      <Copy className="w-4 h-4" />
                    </Button>
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
