import React from "react";
import { TreePine, Heart } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { CURRENT_USER } from "@/lib/mockData";

const TABS = [
  { id: "hub", label: "Family Hub" },
  { id: "tree", label: "Tree Explorer" },
  { id: "vault", label: "Heritage Vault" },
];

export default function Navbar({ activeTab, onTabChange }) {
  return (
    <header className="sticky top-0 z-50 bg-card/80 backdrop-blur-xl border-b border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center">
              <TreePine className="w-5 h-5 text-primary" />
            </div>
            <span className="font-heading text-xl font-semibold tracking-tight text-foreground">
              Kinship
            </span>
          </div>

          {/* Navigation Tabs */}
          <nav className="hidden sm:flex items-center gap-1 bg-secondary/60 rounded-xl p-1">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => onTabChange(tab.id)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                  activeTab === tab.id
                    ? "bg-card text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </nav>

          {/* User */}
          <div className="flex items-center gap-3">
            <div className="hidden md:flex flex-col items-end">
              <span className="text-sm font-medium text-foreground">{CURRENT_USER.name}</span>
              <span className="text-xs text-muted-foreground">{CURRENT_USER.branch}</span>
            </div>
            <Avatar className="w-9 h-9 ring-2 ring-primary/20">
              <AvatarImage src={CURRENT_USER.avatar} alt={CURRENT_USER.name} />
              <AvatarFallback>{CURRENT_USER.name[0]}</AvatarFallback>
            </Avatar>
          </div>
        </div>

        {/* Mobile Tabs */}
        <div className="flex sm:hidden items-center gap-1 pb-3 overflow-x-auto">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all duration-200 ${
                activeTab === tab.id
                  ? "bg-primary text-primary-foreground"
                  : "bg-secondary text-muted-foreground"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>
    </header>
  );
}