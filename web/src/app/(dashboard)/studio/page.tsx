"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Sparkles, Film, Music, UserCircle, Wand2, ImageIcon, Video, History } from "lucide-react";

const tools = [
  { id: "scene", name: "Scene Generator", icon: Film, description: "Generate custom scenes for your portfolio." },
  { id: "reel", name: "Reel Generator", icon: Video, description: "Auto-compile your best clips into a reel." },
  { id: "music", name: "Music Video", icon: Music, description: "Create AI-powered music videos." },
  { id: "twin", name: "Digital Twin", icon: UserCircle, description: "Build your digital likeness for AI scenes." },
];

const mockHistory = [
  { id: "1", type: "Scene", prompt: "Cyberpunk city rooftop scene", status: "completed", createdAt: "2025-01-14" },
  { id: "2", type: "Reel", prompt: "Drama reel compilation", status: "processing", createdAt: "2025-01-13" },
  { id: "3", type: "Music Video", prompt: "Upbeat pop montage", status: "failed", createdAt: "2025-01-12" },
];

export default function StudioPage() {
  const used = 8;
  const limit = 25;

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-foreground">AI Studio</h1>

      <Card className="bg-surface border-border">
        <CardHeader>
          <CardTitle className="text-foreground flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-gold" />
            Credit Usage
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">{used} / {limit} generations used</span>
            <span className="text-gold font-medium">{Math.round((used / limit) * 100)}%</span>
          </div>
          <Progress value={(used / limit) * 100} className="h-2 bg-secondary" />
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {tools.map((tool) => {
          const Icon = tool.icon;
          return (
            <Card key={tool.id} className="bg-surface border-border hover:border-gold/50 transition-colors cursor-pointer">
              <CardContent className="p-6 space-y-3">
                <div className="p-3 rounded-lg bg-gold/10 w-fit">
                  <Icon className="w-6 h-6 text-gold" />
                </div>
                <h3 className="font-semibold text-foreground">{tool.name}</h3>
                <p className="text-sm text-muted-foreground">{tool.description}</p>
                <Button className="w-full bg-gold text-background hover:bg-light-gold">
                  <Wand2 className="w-4 h-4 mr-2" /> Generate
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card className="bg-surface border-border">
        <CardHeader>
          <CardTitle className="text-foreground flex items-center gap-2">
            <History className="w-5 h-5 text-gold" />
            Generation History
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {mockHistory.map((item) => (
            <div key={item.id} className="flex items-center justify-between p-3 rounded-lg bg-secondary">
              <div className="flex items-center gap-3">
                <ImageIcon className="w-4 h-4 text-gold" />
                <div>
                  <p className="text-sm font-medium text-foreground">{item.type}</p>
                  <p className="text-xs text-muted-foreground">{item.prompt}</p>
                </div>
              </div>
              <Badge variant="outline" className={item.status === "completed" ? "border-green-500 text-green-500" : item.status === "processing" ? "border-gold text-gold" : "border-destructive text-destructive"}>
                {item.status}
              </Badge>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
