"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

const mockLogs = [
  { id: "1", user: "admin@example.com", action: "USER_SUSPEND", resource: "User#123", details: "Suspended for policy violation", createdAt: "2025-01-15 10:00" },
  { id: "2", user: "system", action: "CODE_GENERATED", resource: "MasterCode#42", details: "Generated 100-use free code", createdAt: "2025-01-15 09:30" },
  { id: "3", user: "alice@example.com", action: "CONTRACT_SIGNED", resource: "Contract#7", details: "Digital twin consent signed", createdAt: "2025-01-14 16:45" },
];

export default function AdminAuditPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-foreground">Audit Logs</h1>

      <Card className="bg-surface border-border">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="border-border hover:bg-transparent">
                <TableHead className="text-muted-foreground">Time</TableHead>
                <TableHead className="text-muted-foreground">User</TableHead>
                <TableHead className="text-muted-foreground">Action</TableHead>
                <TableHead className="text-muted-foreground">Resource</TableHead>
                <TableHead className="text-muted-foreground">Details</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {mockLogs.map((log) => (
                <TableRow key={log.id} className="border-border">
                  <TableCell className="text-muted-foreground text-xs">{log.createdAt}</TableCell>
                  <TableCell className="text-foreground text-sm">{log.user}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className="border-gold text-gold text-xs">{log.action}</Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm">{log.resource}</TableCell>
                  <TableCell className="text-muted-foreground text-sm">{log.details}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
