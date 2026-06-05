import React from "react";
import { TreePine, LogOut, Home, BookOpen, CalendarDays } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/lib/AuthContext";

const TABS = [
  { id: "hub", label: "Family Hub", shortLabel: "Hub", icon: Home },
  { id: "tree", label: "Tree Explorer", shortLabel: "Tree", icon: TreePine },
  { id: "vault", label: "Heritage Vault", shortLabel: "Vault", icon: BookOpen },
  { id: "events", label: "Family Events", shortLabel: "Events", icon: CalendarDays },
];

export default function Navbar({ activeTab, onTabChange, onProfileClick }) {
  const { user, logout } = useAuth();

  return (
    <>
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

            {/* Navigation Tabs (Desktop only) */}
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
        </div>
      </header>

      {/* Mobile Fixed Bottom Navigation Bar */}
      <nav className="flex sm:hidden fixed bottom-0 left-0 right-0 z-50 bg-card/90 backdrop-blur-xl border-t border-border justify-around items-center h-16 pb-safe shadow-lg">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`flex flex-col items-center justify-center flex-1 h-full py-1 text-center transition-all ${
                isActive
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Icon className={`w-5 h-5 transition-all duration-200 ${isActive ? "scale-110 text-primary stroke-[2.5]" : "stroke-[2]"}`} />
              <span className={`text-[10px] mt-1.5 tracking-tight font-medium ${isActive ? "text-foreground font-bold" : ""}`}>
                {tab.shortLabel}
              </span>
            </button>
          );
        })}
      </nav>
    </>
  );
}