"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { useState } from "react";

const mockUsers = [
  { id: "1", email: "alice@example.com", role: "talent", status: "active", createdAt: "2025-01-01" },
  { id: "2", email: "bob@example.com", role: "casting_director", status: "active", createdAt: "2025-01-02" },
  { id: "3", email: "charlie@example.com", role: "creator", status: "suspended", createdAt: "2025-01-03" },
  { id: "4", email: "diana@example.com", role: "admin", status: "active", createdAt: "2025-01-04" },
];

export default function AdminUsersPage() {
  const [search, setSearch] = useState("");
  const filtered = mockUsers.filter((u) => u.email.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-foreground">User Management</h1>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input placeholder="Search users..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9 bg-surface border-border" />
      </div>

      <Card className="bg-surface border-border">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="border-border hover:bg-transparent">
                <TableHead className="text-muted-foreground">Email</TableHead>
                <TableHead className="text-muted-foreground">Role</TableHead>
                <TableHead className="text-muted-foreground">Status</TableHead>
                <TableHead className="text-muted-foreground">Joined</TableHead>
                <TableHead className="text-muted-foreground text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((u) => (
                <TableRow key={u.id} className="border-border">
                  <TableCell className="text-foreground">{u.email}</TableCell>
                  <TableCell className="capitalize text-muted-foreground">{u.role.replace("_", " ")}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className={u.status === "active" ? "border-green-500 text-green-500" : "border-destructive text-destructive"}>
                      {u.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{u.createdAt}</TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm" className="text-gold hover:text-gold">Edit</Button>
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
