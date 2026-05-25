import React from "react";
import { Users, CalendarHeart, BookOpen } from "lucide-react";
import ShareUpdateCard from "./ShareUpdateCard";
import FamilyPostCard from "./FamilyPostCard";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { toast } from "@/components/ui/use-toast";

export default function FamilyHub() {
  const queryClient = useQueryClient();

  // Queries
  const { data: posts = [], isLoading: isLoadingPosts } = useQuery({
    queryKey: ["posts"],
    queryFn: api.getPosts,
  });

  const { data: familyMembers = [], isLoading: isLoadingMembers } = useQuery({
    queryKey: ["familyCircle"],
    queryFn: api.getCircle,
  });

  const { data: heritageEvents = [] } = useQuery({
    queryKey: ["heritageEvents"],
    queryFn: api.getHeritageEvents,
  });

  // Mutations
  const sharePostMutation = useMutation({
    mutationFn: ({ content, image }) => api.createPost(content, image),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["posts"] });
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
    });
  };

  const quickStats = [
    { icon: Users, label: "Family Members", value: isLoadingMembers ? "..." : familyMembers.length.toString() },
    { icon: CalendarHeart, label: "Upcoming Birthdays", value: "3" },
    { icon: BookOpen, label: "Heritage Stories", value: heritageEvents.length.toString() },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Sidebar */}
        <aside className="hidden lg:block lg:col-span-3 space-y-5">
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
            </div>
          </div>

          <div className="bg-card rounded-2xl border border-border p-5 shadow-sm">
            <h3 className="font-heading text-base font-semibold text-foreground mb-3">Active Members</h3>
            <div className="space-y-2.5">
              {isLoadingMembers ? (
                <div className="flex justify-center py-4">
                  <div className="w-4 h-4 border-2 border-primary/20 border-t-primary rounded-full animate-spin"></div>
                </div>
              ) : (
                familyMembers.filter(m => !m.isDeceased).slice(0, 5).map((m) => (
                  <div key={m.id} className="flex items-center gap-2.5">
                    <img src={m.avatar} alt={m.name} className="w-8 h-8 rounded-full object-cover" />
                    <div className="min-w-0">
                      <p className="text-xs font-medium text-foreground truncate">{m.name}</p>
                      <p className="text-[10px] text-muted-foreground">{m.relation}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </aside>

        {/* Main Feed */}
        <main className="lg:col-span-6 space-y-5">
          <ShareUpdateCard onShare={handleSharePost} />
          {isLoadingPosts ? (
            <div className="flex justify-center py-10">
              <div className="w-6 h-6 border-2 border-primary/20 border-t-primary rounded-full animate-spin"></div>
            </div>
          ) : posts.length === 0 ? (
            <div className="text-center py-10 bg-card border rounded-2xl p-5">
              <p className="text-sm text-muted-foreground">No updates shared yet. Be the first to share one!</p>
            </div>
          ) : (
            posts.map((post) => (
              <FamilyPostCard key={post.id} post={post} />
            ))
          )}
        </main>

        {/* Right Sidebar */}
        <aside className="hidden lg:block lg:col-span-3 space-y-5">
          <div className="bg-card rounded-2xl border border-border p-5 shadow-sm">
            <h3 className="font-heading text-base font-semibold text-foreground mb-3">Upcoming</h3>
            <div className="space-y-3">
              {[
                { event: "Lily's 6th Birthday", date: "Jun 12", emoji: "🎂" },
                { event: "Family Reunion 5K", date: "Jul 4", emoji: "🏃" },
                { event: "Margaret's Visit", date: "Jul 20", emoji: "✈️" },
              ].map((e, i) => (
                <div key={i} className="flex items-center gap-3 p-2.5 rounded-xl bg-secondary/40">
                  <span className="text-lg">{e.emoji}</span>
                  <div>
                    <p className="text-xs font-medium text-foreground">{e.event}</p>
                    <p className="text-[10px] text-muted-foreground">{e.date}</p>
                  </div>
                </div>
              ))}
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
    </div>
  );
}