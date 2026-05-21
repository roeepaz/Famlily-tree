import React from "react";
import { TreePine, LogOut } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/lib/AuthContext";

const TABS = [
  { id: "hub", label: "Family Hub" },
  { id: "tree", label: "Tree Explorer" },
  { id: "vault", label: "Heritage Vault" },
];

export default function Navbar({ activeTab, onTabChange, onProfileClick }) {
  const { user, logout } = useAuth();

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
            <button
              onClick={onProfileClick}
              className="flex items-center gap-3 hover:opacity-80 transition-opacity focus:outline-none text-right"
              title="View your profile"
            >
              <div className="hidden md:flex flex-col items-end">
                <span className="text-sm font-medium text-foreground hover:text-primary transition-colors">
                  {user?.name || "Guest"}
                </span>
                <span className="text-xs text-muted-foreground">{user?.branch || "Family Branch"}</span>
              </div>
              <Avatar className="w-9 h-9 ring-2 ring-primary/20 hover:ring-primary/40 transition-all">
                <AvatarImage src={user?.avatar} alt={user?.name} />
                <AvatarFallback>{user?.name ? user.name[0] : "?"}</AvatarFallback>
              </Avatar>
            </button>
            <button
              onClick={logout}
              title="Log out"
              className="p-2 text-muted-foreground hover:text-foreground hover:bg-secondary rounded-lg transition-colors"
            >
              <LogOut className="w-4.5 h-4.5" />
            </button>
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