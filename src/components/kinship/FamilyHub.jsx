import React, { useState } from "react";
import { Users, CalendarHeart, BookOpen } from "lucide-react";
import ShareUpdateCard from "./ShareUpdateCard";
import FamilyPostCard from "./FamilyPostCard";
import { FEED_POSTS, FAMILY_MEMBERS, CURRENT_USER } from "@/lib/mockData";
import { toast } from "@/components/ui/use-toast";

const quickStats = [
  { icon: Users, label: "Family Members", value: "14" },
  { icon: CalendarHeart, label: "Upcoming Birthdays", value: "3" },
  { icon: BookOpen, label: "Heritage Stories", value: "5" },
];

export default function FamilyHub() {
  const [posts, setPosts] = useState(FEED_POSTS);

  const handleSharePost = (newPostData) => {
    const newPost = {
      id: `post-${Date.now()}`,
      authorId: CURRENT_USER.id,
      authorName: CURRENT_USER.name,
      authorAvatar: CURRENT_USER.avatar,
      authorBranch: CURRENT_USER.branch,
      type: newPostData.type,
      timestamp: new Date().toISOString(),
      content: newPostData.content,
      image: newPostData.image,
      reactions: [],
      comments: [],
    };

    setPosts([newPost, ...posts]);
    
    toast({
      title: "Update shared! ✨",
      description: "Your family update has been posted to the feed.",
    });
  };
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
              {FAMILY_MEMBERS.filter(m => !m.isDeceased).slice(0, 5).map((m) => (
                <div key={m.id} className="flex items-center gap-2.5">
                  <img src={m.avatar} alt={m.name} className="w-8 h-8 rounded-full object-cover" />
                  <div className="min-w-0">
                    <p className="text-xs font-medium text-foreground truncate">{m.name}</p>
                    <p className="text-[10px] text-muted-foreground">{m.relation}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </aside>

        {/* Main Feed */}
        <main className="lg:col-span-6 space-y-5">
          <ShareUpdateCard onShare={handleSharePost} />
          {posts.map((post) => (
            <FamilyPostCard key={post.id} post={post} />
          ))}
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