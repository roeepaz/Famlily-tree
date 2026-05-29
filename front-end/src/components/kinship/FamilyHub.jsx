import React, { useState } from "react";
import { Users, CalendarHeart, BookOpen } from "lucide-react";
import ShareUpdateCard from "./ShareUpdateCard";
import FamilyPostCard from "./FamilyPostCard";
import ProfileDrawer from "./ProfileDrawer";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { toast } from "@/components/ui/use-toast";
import {
  FeedSkeleton,
  StatsSkeleton,
  MemberRowSkeleton,
  CompactRowSkeleton,
} from "./SkeletonLoaders";

export default function FamilyHub({ onTabChange }) {
  const queryClient = useQueryClient();
  const [selectedMember, setSelectedMember] = useState(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  // Queries
  const { data: posts = [], isLoading: isLoadingPosts } = useQuery({
    queryKey: ["posts"],
    queryFn: api.getPosts,
  });

  const { data: familyMembers = [], isLoading: isLoadingMembers } = useQuery({
    queryKey: ["familyCircle"],
    queryFn: api.getCircle,
  });

  const { data: upcomingBirthdays = [], isLoading: isLoadingBirthdays } = useQuery({
    queryKey: ["upcomingBirthdays"],
    queryFn: api.getUpcomingBirthdays,
  });

  const { data: heritageEvents = [] } = useQuery({
    queryKey: ["heritageEvents"],
    queryFn: api.getHeritageEvents,
  });

  const { data: events = [], isLoading: isLoadingEvents } = useQuery({
    queryKey: ["events"],
    queryFn: api.getEvents,
  });

  const today = new Date();
  const nextEvents = events
    .filter((e) => new Date(e.eventDate) >= today)
    .sort((a, b) => new Date(a.eventDate).getTime() - new Date(b.eventDate).getTime())
    .slice(0, 3);

  // Mutations
  const sharePostMutation = useMutation({
    mutationFn: ({ content, image, type }) => api.createPost(content, image, type),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["posts"] });
      queryClient.invalidateQueries({ queryKey: ["heritageEvents"] });
      toast({
        title: "Update shared! ✨",
        description: "Your family update has been posted to the feed.",
      });
    },
    onError: (err) => {
      toast({
        title: "Failed to share update",
        description: err.message,
        variant: "destructive",
      });
    },
  });

  const handleSharePost = (newPostData) => {
    sharePostMutation.mutate({
      content: newPostData.content,
      image: newPostData.image,
      type: newPostData.type,
    });
  };

  const quickStats = [
    { icon: Users, label: "Family Members", value: isLoadingMembers ? "..." : familyMembers.length.toString() },
    { icon: CalendarHeart, label: "Upcoming Birthdays", value: isLoadingBirthdays ? "..." : upcomingBirthdays.length.toString() },
    { icon: BookOpen, label: "Heritage Stories", value: heritageEvents.length.toString() },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Sidebar */}
        <aside className="hidden lg:block lg:col-span-3 space-y-5">
          <div className="bg-card rounded-2xl border border-border p-5 shadow-sm">
            <h3 className="font-heading text-base font-semibold text-foreground mb-4">Family At a Glance</h3>
            {(isLoadingMembers || isLoadingBirthdays) ? (
              <StatsSkeleton />
            ) : (
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
              </div>
            )}
          </div>

          <div className="bg-card rounded-2xl border border-border p-5 shadow-sm">
            <h3 className="font-heading text-base font-semibold text-foreground mb-3">Active Members</h3>
            <div className="space-y-2.5">
              {isLoadingMembers ? (
                [1, 2, 3, 4].map((i) => <MemberRowSkeleton key={i} />)
              ) : (
                familyMembers.filter(m => !m.isDeceased).slice(0, 5).map((m) => (
                  <button
                    key={m.id}
                    onClick={() => {
                      setSelectedMember(m);
                      setIsDrawerOpen(true);
                    }}
                    className="w-full flex items-center gap-2.5 p-1 rounded-xl hover:bg-secondary/30 transition-colors text-left group"
                  >
                    {m.avatar ? (
                      <img src={m.avatar} alt={m.name} className="w-8 h-8 rounded-full object-cover ring-1 ring-primary/5 group-hover:scale-105 transition-transform" />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold text-[10px] group-hover:scale-105 transition-transform">
                        {m.name?.[0] || "?"}
                      </div>
                    )}
                    <div className="min-w-0">
                      <p className="text-xs font-medium text-foreground truncate group-hover:text-primary transition-colors">{m.name}</p>
                      <p className="text-[10px] text-muted-foreground">{m.relation}</p>
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>
        </aside>

        {/* Main Feed */}
        <main className="lg:col-span-6 space-y-5">
          <ShareUpdateCard onShare={handleSharePost} />
          {isLoadingPosts ? (
            <FeedSkeleton count={3} />
          ) : posts.length === 0 ? (
            <div className="text-center py-10 bg-card border rounded-2xl p-5">
              <p className="text-sm text-muted-foreground">No updates shared yet. Be the first to share one!</p>
            </div>
          ) : (
            posts.map((post) => (
              <FamilyPostCard key={post.id} post={post} onTabChange={onTabChange} />
            ))
          )}
        </main>

        {/* Right Sidebar */}
        <aside className="hidden lg:block lg:col-span-3 space-y-5">
          <div className="bg-card rounded-2xl border border-border p-5 shadow-sm">
            <h3 className="font-heading text-base font-semibold text-foreground mb-3">Upcoming Birthdays</h3>
            <div className="space-y-3">
              {isLoadingBirthdays ? (
                [1, 2, 3].map((i) => <CompactRowSkeleton key={i} />)
              ) : upcomingBirthdays.length === 0 ? (
                <p className="text-xs text-muted-foreground text-center py-2">No upcoming birthdays.</p>
              ) : (
                upcomingBirthdays.map((b) => (
                  <button
                    key={b.id}
                    onClick={() => {
                      setSelectedMember(b);
                      setIsDrawerOpen(true);
                    }}
                    className="w-full flex items-center gap-3 p-2.5 rounded-xl bg-secondary/40 hover:bg-secondary/60 transition-all text-left group"
                  >
                    {b.avatar ? (
                      <img
                        src={b.avatar}
                        alt={b.name}
                        className="w-9 h-9 rounded-full object-cover ring-2 ring-primary/10 group-hover:scale-105 transition-transform"
                      />
                    ) : (
                      <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold text-xs ring-2 ring-primary/5 group-hover:scale-105 transition-transform">
                        {b.name?.[0] || "?"}
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-semibold text-foreground truncate group-hover:text-primary transition-colors flex items-center gap-1.5">
                        {b.name}
                        {b.relation === 'You' && (
                          <span className="text-[9px] bg-primary/20 text-primary px-1 rounded font-normal">You</span>
                        )}
                      </p>
                      <p className="text-[10px] text-muted-foreground mt-0.5">
                        {b.ageTurning ? `Turning ${b.ageTurning}` : 'Birthday'} on {new Date(b.nextBirthdayDate + 'T00:00:00').toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-primary/10 text-primary whitespace-nowrap">
                        {b.daysUntil === 0 ? "Today! 🎂" : b.daysUntil === 1 ? "Tomorrow!" : `in ${b.daysUntil}d`}
                      </span>
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>

          <div className="bg-card rounded-2xl border border-border p-5 shadow-sm">
            <h3 className="font-heading text-base font-semibold text-foreground mb-3">Upcoming Gatherings</h3>
            <div className="space-y-3">
              {isLoadingEvents ? (
                [1, 2].map((i) => <CompactRowSkeleton key={i} />)
              ) : nextEvents.length === 0 ? (
                <p className="text-xs text-muted-foreground text-center py-2">No upcoming family events.</p>
              ) : (
                nextEvents.map((evt) => {
                  const date = new Date(evt.eventDate);
                  const monthStr = date.toLocaleDateString("en-US", { month: "short" }).toUpperCase();
                  const dayStr = date.getDate();
                  return (
                    <button
                      key={evt.id}
                      onClick={() => onTabChange && onTabChange("events")}
                      className="w-full flex items-center gap-3 p-2.5 rounded-xl bg-secondary/40 hover:bg-secondary/60 transition-all text-left group"
                    >
                      {/* Date Block */}
                      <div className="w-9 h-10 bg-background rounded-lg border border-border overflow-hidden flex flex-col items-center justify-center shrink-0 shadow-inner">
                        <div className="w-full bg-primary text-[8px] font-bold text-primary-foreground py-0.5 text-center leading-none">
                          {monthStr}
                        </div>
                        <div className="text-sm font-bold text-foreground leading-none py-1">
                          {dayStr}
                        </div>
                      </div>
                      {/* Event Info */}
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-semibold text-foreground truncate group-hover:text-primary transition-colors">
                          {evt.title}
                        </p>
                        <p className="text-[10px] text-muted-foreground truncate mt-0.5">
                          {evt.location || "TBD"}
                        </p>
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </div>

          <div className="bg-gradient-to-br from-primary/10 to-primary/5 rounded-2xl border border-primary/10 p-5">
            <h3 className="font-heading text-base font-semibold text-foreground mb-2">Family Quote</h3>
            <p className="text-sm text-foreground/80 italic leading-relaxed">
              "The family is one of nature's masterpieces."
            </p>
            <p className="text-xs text-muted-foreground mt-2">— George Santayana</p>
          </div>
        </aside>
      </div>

      {/* Profile Drawer */}
      <ProfileDrawer
        member={selectedMember}
        isOpen={isDrawerOpen}
        onClose={() => {
          setIsDrawerOpen(false);
          setSelectedMember(null);
        }}
      />
    </div>
  );
}