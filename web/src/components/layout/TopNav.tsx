"use client";

import { Search, Bell } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { MobileNav } from "./Sidebar";
import { UserMenu } from "@/components/common/UserMenu";

export function TopNav() {
  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b border-border bg-surface/80 backdrop-blur px-4 sm:px-6">
      <MobileNav />
      <div className="flex-1 flex items-center gap-4">
        <div className="relative max-w-md w-full hidden sm:block">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search casting calls, talent..."
            className="pl-9 bg-secondary border-border"
          />
        </div>
      </div>
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="w-5 h-5" />
          <span className="absolute top-2 right-2 w-2 h-2 bg-gold rounded-full" />
        </Button>
        <UserMenu />
      </div>
    </header>
  );
}
