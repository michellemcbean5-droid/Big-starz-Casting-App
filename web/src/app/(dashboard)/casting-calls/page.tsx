"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Search, MapPin, DollarSign, Calendar } from "lucide-react";

const mockCastingCalls = [
  { id: "1", title: "Sci-Fi Lead — Feature Film", type: "Feature", location: "Los Angeles", budget: 5000, deadline: "2025-02-01", status: "open" },
  { id: "2", title: "Commercial — Sports Brand", type: "Commercial", location: "Remote", budget: 2000, deadline: "2025-01-28", status: "open" },
  { id: "3", title: "Indie Drama — Supporting", type: "Indie", location: "New York", budget: 1500, deadline: "2025-01-25", status: "open" },
  { id: "4", title: "TV Series — Guest Star", type: "TV", location: "Vancouver", budget: 3000, deadline: "2025-02-10", status: "open" },
  { id: "5", title: "Theater — Lead Role", type: "Theater", location: "Chicago", budget: 800, deadline: "2025-01-20", status: "closed" },
];

export default function CastingCallsPage() {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");

  const filtered = mockCastingCalls.filter((c) => {
    const matchesSearch = c.title.toLowerCase().includes(search.toLowerCase()) || c.location.toLowerCase().includes(search.toLowerCase());
    const matchesFilter = filter === "all" || c.type.toLowerCase() === filter.toLowerCase();
    return matchesSearch && matchesFilter;
  });

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-foreground">Casting Calls</h1>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search by title or location..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 bg-surface border-border"
          />
        </div>
        <div className="flex gap-2">
          {["all", "Feature", "Commercial", "TV", "Indie"].map((f) => (
            <Button
              key={f}
              variant={filter === f ? "default" : "outline"}
              size="sm"
              onClick={() => setFilter(f)}
              className={filter === f ? "bg-gold text-background" : "border-border text-muted-foreground"}
            >
              {f}
            </Button>
          ))}
        </div>
      </div>

      <div className="grid gap-4">
        {filtered.map((call) => (
          <Card key={call.id} className="bg-surface border-border hover:border-gold/50 transition-colors">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg text-foreground">{call.title}</CardTitle>
                <Badge variant={call.status === "open" ? "default" : "secondary"} className={call.status === "open" ? "bg-gold text-background" : ""}>
                  {call.status}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                <span className="flex items-center gap-1">
                  <MapPin className="w-4 h-4 text-gold" /> {call.location}
                </span>
                <span className="flex items-center gap-1">
                  <DollarSign className="w-4 h-4 text-gold" /> {call.budget}
                </span>
                <span className="flex items-center gap-1">
                  <Calendar className="w-4 h-4 text-gold" /> {call.deadline}
                </span>
                <Badge variant="outline" className="border-gold text-gold">{call.type}</Badge>
              </div>
            </CardContent>
          </Card>
        ))}
        {filtered.length === 0 && <p className="text-muted-foreground">No casting calls found.</p>}
      </div>
    </div>
  );
}
