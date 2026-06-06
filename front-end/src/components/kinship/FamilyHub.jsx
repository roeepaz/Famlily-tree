import React, { useState } from "react";
import { Users, CalendarHeart, BookOpen, TreePine, CalendarDays, Archive, ArrowRight, Sparkles } from "lucide-react";
import { motion } from "framer-motion";
import ShareUpdateCard from "./ShareUpdateCard";
import FamilyPostCard from "./FamilyPostCard";
import ProfileDrawer from "./ProfileDrawer";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { toast } from "@/components/ui/use-toast";
import {
  FeedSkeleton,
  StatsSkeleton,
  CompactRowSkeleton,
} from "./SkeletonLoaders";

const onboardingFeatures = [
  {
    icon: TreePine,
    title: "Tree Explorer",
    desc: "Visualize your family connections in an interactive, living tree.",
    bg: "bg-[#00D1C1]",
    text: "text-[#052B28]",
    tab: "tree",
  },
  {
    icon: Archive,
    title: "Heritage Vault",
    desc: "Store and share precious family photos, documents, and stories.",
    bg: "bg-[#FFB800]",
    text: "text-[#332500]",
    tab: "vault",
  },
  {
    icon: CalendarDays,
    title: "Family Events",
    desc: "Never miss a birthday, reunion, or milestone again.",
    bg: "bg-[#2E5BFF]",
    text: "text-white",
    tab: "events",
  },
];

export default function FamilyHub({ onTabChange, onLaunchSpark }) {
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

  if (!isLoadingMembers && familyMembers.length <= 1) {
    return (
      <div className="min-h-screen pb-28 max-w-5xl mx-auto px-4 md:px-6">
        {/* Hero Section - Adapted from temp.jsx */}
        <section className="relative overflow-hidden min-h-[60vh] flex items-center bg-gradient-to-br from-teal-500/15 via-cyan-500/5 to-transparent dark:from-teal-950/25 dark:via-cyan-950/10 dark:to-transparent border border-border/40 rounded-3xl p-8 md:p-16 mb-12 shadow-sm">
          {/* Decorative orbs */}
          <motion.div
            animate={{ x: [0, 40, 0], y: [0, -30, 0] }}
            transition={{ duration: 12, repeat: Infinity }}
            className="absolute top-20 right-[15%] w-48 h-48 rounded-full bg-teal-500/10 dark:bg-teal-500/5 blur-3xl pointer-events-none"
          />
          <motion.div
            animate={{ x: [0, -30, 0], y: [0, 40, 0] }}
            transition={{ duration: 15, repeat: Infinity }}
            className="absolute bottom-20 left-[10%] w-64 h-64 rounded-full bg-cyan-500/5 dark:bg-cyan-500/2 blur-3xl pointer-events-none"
          />

          <div className="max-w-2xl text-left relative z-10">
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              className="inline-flex items-center gap-2 bg-teal-500/10 border border-teal-500/20 px-4 py-2 rounded-full mb-8 text-teal-600 dark:text-teal-400"
            >
              <Sparkles className="w-4 h-4 text-teal-500" />
              <span className="text-sm font-semibold uppercase tracking-wider">Welcome to Kinship</span>
            </motion.div>
            
            <h1 className="font-heading font-extrabold text-4xl md:text-6xl lg:text-7xl leading-none tracking-tight mb-6 text-foreground">
              LIFE,
              <br />
              <span className="text-teal-600 dark:text-teal-400 drop-shadow-[0_0_15px_rgba(20,184,166,0.2)]">SYNCHRONIZED.</span>
            </h1>
            
            <p className="text-base md:text-lg text-muted-foreground max-w-md leading-relaxed mb-8">
              Your family hub — where schedules align, memories live, and connections grow stronger every day.
            </p>

            <motion.button
              whileHover={{ scale: 1.03, boxShadow: "0 20px 50px rgba(13, 148, 136, 0.2)" }}
              whileTap={{ scale: 0.97 }}
              onClick={onLaunchSpark}
              className="h-14 px-8 rounded-2xl bg-teal-600 hover:bg-teal-700 dark:bg-teal-500 dark:hover:bg-teal-600 text-white font-heading font-bold text-base transition-all shadow-xl flex items-center gap-2 group"
            >
              Plant Your Family Tree
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </motion.button>
          </div>
        </section>

        {/* Feature plates - Adapted from temp.jsx */}
        <div className="space-y-8">
          {onboardingFeatures.map((feature, i) => (
            <motion.section
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className={`${feature.bg} ${feature.text} rounded-3xl p-10 md:p-14 overflow-hidden shadow-sm relative border border-border/40`}
            >
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-12">
                <div className={`flex-1 text-left ${i % 2 === 1 ? "md:order-2" : ""}`}>
                  <div className="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center mb-6 border border-white/10">
                    <feature.icon className="w-8 h-8" />
                  </div>
                  <h2 className="font-heading font-extrabold text-2xl md:text-4xl mb-4 leading-tight">
                    {feature.title}
                  </h2>
                  <p className="text-base md:text-lg opacity-80 leading-relaxed max-w-md mb-8">
                    {feature.desc}
                  </p>
                  <motion.button
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={() => onTabChange(feature.tab)}
                    className="h-12 px-6 rounded-2xl bg-white/20 backdrop-blur-sm font-heading font-bold text-sm hover:bg-white/30 transition-all flex items-center gap-2 group border border-white/10"
                  >
                    Explore
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </motion.button>
                </div>
                
                <div className={`flex items-center justify-center ${i % 2 === 1 ? "md:order-1" : ""}`}>
                  <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    whileInView={{ scale: 1, opacity: 1 }}
                    viewport={{ once: true }}
                    className="w-36 h-36 md:w-48 md:h-48 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center border border-white/5"
                  >
                    <feature.icon className="w-16 h-16 md:w-20 md:h-20 opacity-30" />
                  </motion.div>
                </div>
              </div>
            </motion.section>
          ))}
        </div>

        {/* Quartz Footer Section - Adapted from temp.jsx */}
        <section className="bg-slate-50 dark:bg-slate-900/40 border border-border/40 rounded-3xl p-10 md:p-16 text-center mt-12 shadow-sm">
          <h2 className="font-heading font-extrabold text-2xl md:text-4xl text-foreground mb-4">
            Ready to Begin?
          </h2>
          <p className="text-base text-muted-foreground mb-8 max-w-md mx-auto leading-relaxed">
            Join thousands of families who keep their bonds alive, organized, and celebrated.
          </p>
          <motion.button
            whileHover={{ scale: 1.03, boxShadow: "0 20px 50px rgba(13, 148, 136, 0.15)" }}
            whileTap={{ scale: 0.97 }}
            onClick={onLaunchSpark}
            className="h-14 px-10 rounded-2xl bg-teal-600 hover:bg-teal-700 dark:bg-teal-500 dark:hover:bg-teal-600 text-white font-heading font-bold text-base transition-all shadow-xl mx-auto flex items-center gap-2 group"
          >
            Join the Fleet
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </motion.button>
        </section>
      </div>
    );
  }

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
                
                <button
                  onClick={onLaunchSpark}
                  className="w-full mt-4 py-2 border border-teal-500/20 hover:border-teal-500/40 bg-teal-500/5 hover:bg-teal-500/10 text-teal-600 dark:text-teal-400 dark:bg-teal-950/20 dark:hover:bg-teal-950/40 text-[10px] font-semibold rounded-xl flex items-center justify-center gap-1.5 transition-all duration-200"
                >
                  <span>🌱</span>
                  <span>פתח את עורך עץ המשפחה</span>
                </button>
              </div>
            )}
          </div>
        </aside>

        {/* Main Feed */}
        <main className="lg:col-span-6 space-y-5">
          {familyMembers.length <= 1 && (
            <div className="bg-gradient-to-br from-teal-500/10 via-cyan-500/5 to-slate-900/10 border-2 border-teal-500/30 p-6 rounded-3xl shadow-md text-left relative overflow-hidden">
              <div className="absolute right-0 top-0 w-24 h-24 bg-teal-500/5 rounded-full filter blur-xl pointer-events-none" />
              <div className="flex gap-4 items-start">
                <div className="w-12 h-12 rounded-2xl bg-teal-500/10 flex items-center justify-center text-teal-500 shrink-0 ring-4 ring-teal-500/5">
                  <span className="text-2xl">🌱</span>
                </div>
                <div>
                  <h4 className="font-heading text-lg font-bold text-slate-800 dark:text-slate-100">Plant Your Family Tree</h4>
                  <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 leading-relaxed">
                    It looks like you're alone in your family circle. Let's map your immediate parent, spouse, and children connections to unlock notifications, private vault shares, and joint event calendars!
                  </p>
                  <button
                    onClick={onLaunchSpark}
                    className="mt-4 px-5 py-2.5 bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-600 hover:to-cyan-600 text-white text-xs font-semibold rounded-xl shadow-md transition-all active:scale-95 flex items-center gap-1.5"
                  >
                    <span>Launch Tree Builder</span>
                    <span>✨</span>
                  </button>
                </div>
              </div>
            </div>
          )}

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

          {/* Mobile-only Sidebar Widgets (displayed below the feed) */}
          <div className="block lg:hidden mt-8 space-y-6">
            <div className="border-t border-border pt-6 mb-2">
              <h3 className="font-heading text-lg font-bold text-foreground text-left">Family Highlights</h3>
            </div>

            {/* Quick Stats */}
            <div className="bg-card rounded-2xl border border-border p-5 shadow-sm">
              <h3 className="font-heading text-sm font-semibold text-foreground mb-4">Family At a Glance</h3>
              {(isLoadingMembers || isLoadingBirthdays) ? (
                <StatsSkeleton />
              ) : (
                <div className="grid grid-cols-3 gap-3">
                  {quickStats.map((stat, i) => (
                    <div key={i} className="flex flex-col items-center text-center p-2 rounded-xl bg-secondary/30">
                      <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center mb-1.5">
                        <stat.icon className="w-4 h-4 text-primary" />
                      </div>
                      <p className="text-sm font-bold text-foreground leading-none">{stat.value}</p>
                      <p className="text-[9px] text-muted-foreground mt-1 leading-tight">{stat.label.split(" ")[1] || stat.label}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Upcoming Birthdays */}
            <div className="bg-card rounded-2xl border border-border p-5 shadow-sm">
              <h3 className="font-heading text-sm font-semibold text-foreground mb-3">Upcoming Birthdays</h3>
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

            {/* Upcoming Gatherings */}
            <div className="bg-card rounded-2xl border border-border p-5 shadow-sm">
              <h3 className="font-heading text-sm font-semibold text-foreground mb-3">Upcoming Gatherings</h3>
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
                        <div className="w-9 h-10 bg-background rounded-lg border border-border overflow-hidden flex flex-col items-center justify-center shrink-0 shadow-inner">
                          <div className="w-full bg-primary text-[8px] font-bold text-primary-foreground py-0.5 text-center leading-none">
                            {monthStr}
                          </div>
                          <div className="text-sm font-bold text-foreground leading-none py-1">
                            {dayStr}
                          </div>
                        </div>
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
          </div>
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