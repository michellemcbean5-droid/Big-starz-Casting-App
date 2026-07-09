"use client";

import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Camera } from "lucide-react";

export default function ProfilePage() {
  const { user } = useAuth();
  const [bio, setBio] = useState("");
  const [skills, setSkills] = useState("");
  const [experience, setExperience] = useState("");
  const [location, setLocation] = useState("");
  const [ageRange, setAgeRange] = useState("");
  const [unionStatus, setUnionStatus] = useState("Non-Union");
  const [reelUrl, setReelUrl] = useState("");
  const [stageName, setStageName] = useState("");

  const initials = user?.email?.slice(0, 2).toUpperCase() || "U";

  return (
    <div className="space-y-6 max-w-3xl">
      <h1 className="text-3xl font-bold text-foreground">Profile</h1>

      <Card className="bg-surface border-border">
        <CardHeader>
          <CardTitle className="text-foreground">Public Profile</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center gap-6">
            <div className="relative">
              <Avatar className="h-24 w-24">
                <AvatarFallback className="bg-gold text-background text-2xl font-bold">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <button className="absolute bottom-0 right-0 p-1.5 rounded-full bg-gold text-background hover:bg-light-gold">
                <Camera className="w-4 h-4" />
              </button>
            </div>
            <div>
              <p className="text-lg font-semibold text-foreground">{stageName || user?.email?.split("@")[0]}</p>
              <p className="text-sm text-muted-foreground capitalize">{user?.role.replace("_", " ")}</p>
              <Badge variant="outline" className="mt-2 border-gold text-gold">{unionStatus}</Badge>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Stage Name</Label>
              <Input value={stageName} onChange={(e) => setStageName(e.target.value)} className="bg-secondary border-border" />
            </div>
            <div className="space-y-2">
              <Label>Location</Label>
              <Input value={location} onChange={(e) => setLocation(e.target.value)} className="bg-secondary border-border" />
            </div>
            <div className="space-y-2">
              <Label>Age Range</Label>
              <Input value={ageRange} onChange={(e) => setAgeRange(e.target.value)} placeholder="e.g. 18-25" className="bg-secondary border-border" />
            </div>
            <div className="space-y-2">
              <Label>Union Status</Label>
              <Input value={unionStatus} onChange={(e) => setUnionStatus(e.target.value)} className="bg-secondary border-border" />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label>Reel / Portfolio URL</Label>
              <Input value={reelUrl} onChange={(e) => setReelUrl(e.target.value)} placeholder="https://..." className="bg-secondary border-border" />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Bio</Label>
            <Textarea value={bio} onChange={(e) => setBio(e.target.value)} rows={4} className="bg-secondary border-border" placeholder="Tell casting directors about yourself..." />
          </div>

          <div className="space-y-2">
            <Label>Skills (comma separated)</Label>
            <Input value={skills} onChange={(e) => setSkills(e.target.value)} placeholder="Acting, Singing, Dance..." className="bg-secondary border-border" />
          </div>

          <div className="space-y-2">
            <Label>Experience</Label>
            <Textarea value={experience} onChange={(e) => setExperience(e.target.value)} rows={4} className="bg-secondary border-border" placeholder="List your notable credits..." />
          </div>

          <Button className="bg-gold text-background hover:bg-light-gold">Save Profile</Button>
        </CardContent>
      </Card>
    </div>
  );
}
