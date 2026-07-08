"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DollarSign, TrendingUp, Wallet, ArrowUpRight } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";

const monthlyData = [
  { name: "Jan", earnings: 1200 },
  { name: "Feb", earnings: 1900 },
  { name: "Mar", earnings: 800 },
  { name: "Apr", earnings: 1600 },
  { name: "May", earnings: 2400 },
  { name: "Jun", earnings: 1800 },
];

const sourceData = [
  { name: "Casting", value: 45 },
  { name: "AI Studio", value: 30 },
  { name: "Content", value: 25 },
];

const COLORS = ["#D4AF37", "#C0A062", "#A0A0B0"];

const mockPayouts = [
  { id: "1", amount: 1200, status: "paid", date: "2025-01-01" },
  { id: "2", amount: 1900, status: "paid", date: "2025-02-01" },
  { id: "3", amount: 800, status: "pending", date: "2025-03-01" },
];

export default function EarningsPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-foreground">Earnings</h1>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="bg-surface border-border">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Earnings</CardTitle>
            <DollarSign className="w-4 h-4 text-gold" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">$12,450</div>
            <p className="text-xs text-muted-foreground">Lifetime earnings</p>
          </CardContent>
        </Card>
        <Card className="bg-surface border-border">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">This Month</CardTitle>
            <TrendingUp className="w-4 h-4 text-gold" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">$1,800</div>
            <p className="text-xs text-green-500 flex items-center gap-1"><ArrowUpRight className="w-3 h-3" /> +12% from last month</p>
          </CardContent>
        </Card>
        <Card className="bg-surface border-border">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Available Balance</CardTitle>
            <Wallet className="w-4 h-4 text-gold" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">$3,200</div>
            <Button size="sm" className="mt-2 bg-gold text-background hover:bg-light-gold">Withdraw</Button>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="bg-surface border-border">
          <CardHeader>
            <CardTitle className="text-foreground">Monthly Earnings</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={monthlyData}>
                <XAxis dataKey="name" stroke="#A0A0B0" fontSize={12} />
                <YAxis stroke="#A0A0B0" fontSize={12} />
                <Tooltip contentStyle={{ backgroundColor: "#1E1E2F", border: "1px solid #2A2A3F", borderRadius: "8px" }} />
                <Bar dataKey="earnings" fill="#D4AF37" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="bg-surface border-border">
          <CardHeader>
            <CardTitle className="text-foreground">Revenue Sources</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie data={sourceData} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                  {sourceData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: "#1E1E2F", border: "1px solid #2A2A3F", borderRadius: "8px" }} />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex justify-center gap-4 mt-2">
              {sourceData.map((s, i) => (
                <div key={s.name} className="flex items-center gap-1 text-xs text-muted-foreground">
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[i] }} />
                  {s.name}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-surface border-border">
        <CardHeader>
          <CardTitle className="text-foreground">Payout History</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {mockPayouts.map((p) => (
            <div key={p.id} className="flex items-center justify-between p-3 rounded-lg bg-secondary">
              <div>
                <p className="text-sm font-medium text-foreground">${p.amount.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground">{p.date}</p>
              </div>
              <Badge variant="outline" className={p.status === "paid" ? "border-green-500 text-green-500" : "border-gold text-gold"}>
                {p.status}
              </Badge>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
