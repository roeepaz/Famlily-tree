import React from "react";
import { StatsSkeleton } from "../SkeletonLoaders";

export default function FamilyAtGlanceWidget({ isLoading, quickStats, onLaunchSpark, isMobile = false }) {
  if (isLoading) {
    return (
      <div className="bg-card rounded-2xl border border-border p-5 shadow-sm">
        <h3 className="font-heading text-base font-semibold text-foreground mb-4">Family At a Glance</h3>
        <StatsSkeleton />
      </div>
    );
  }

  if (isMobile) {
    return (
      <div className="bg-card rounded-2xl border border-border p-5 shadow-sm">
        <h3 className="font-heading text-sm font-semibold text-foreground mb-4">Family At a Glance</h3>
        <div className="grid grid-cols-3 gap-3">
          {quickStats.map((stat, i) => (
            <div key={i} className="flex flex-col items-center text-center p-2 rounded-xl bg-secondary/30">
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center mb-1.5">
                <stat.icon className="w-4 h-4 text-primary" />
              </div>
              <p className="text-sm font-bold text-foreground leading-none">{stat.value}</p>
              <p className="text-[9px] text-muted-foreground mt-1 leading-tight">
                {stat.label.split(" ")[1] || stat.label}
              </p>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-card rounded-2xl border border-border p-5 shadow-sm">
      <h3 className="font-heading text-base font-semibold text-foreground mb-4">Family At a Glance</h3>
      <div className="space-y-4">
        {quickStats.map((stat, i) => (
          <div key={i} className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center">
              <stat.icon className="w-4 h-4 text-primary" />
            </div>
            <div>
              <p className="text-lg font-semibold text-foreground leading-none">{stat.value}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{stat.label}</p>
            </div>
          </div>
        ))}
        
        <button
          onClick={onLaunchSpark}
          className="w-full mt-4 py-2 border border-teal-500/20 hover:border-teal-500/40 bg-teal-500/5 hover:bg-teal-500/10 text-teal-600 dark:text-teal-400 dark:bg-teal-950/20 dark:hover:bg-teal-950/40 text-[10px] font-semibold rounded-xl flex items-center justify-center gap-1.5 transition-all duration-200"
        >
          <span>🌱</span>
          <span>פתח את עורך עץ המשפחה</span>
        </button>
      </div>
    </div>
  );
}
