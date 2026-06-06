import React, { useState } from "react";
import { Users, CalendarHeart, BookOpen } from "lucide-react";
import ShareUpdateCard from "./ShareUpdateCard";
import FamilyPostCard from "./FamilyPostCard";
import ProfileDrawer from "./ProfileDrawer";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { toast } from "@/components/ui/use-toast";
import { FeedSkeleton } from "./SkeletonLoaders";
import WelcomePromo from "./onboarding/WelcomePromo";
import FamilyAtGlanceWidget from "./widgets/FamilyAtGlanceWidget";
import UpcomingBirthdaysWidget from "./widgets/UpcomingBirthdaysWidget";
import UpcomingGatheringsWidget from "./widgets/UpcomingGatheringsWidget";
import FamilyQuoteWidget from "./widgets/FamilyQuoteWidget";

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
      <WelcomePromo
        onTabChange={onTabChange}
        onLaunchSpark={onLaunchSpark}
      />
    );
  }

  const handleSelectMember = (b) => {
    setSelectedMember(b);
    setIsDrawerOpen(true);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Sidebar */}
        <aside className="hidden lg:block lg:col-span-3 space-y-5">
          <FamilyAtGlanceWidget
            isLoading={isLoadingMembers || isLoadingBirthdays}
            quickStats={quickStats}
            onLaunchSpark={onLaunchSpark}
          />
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
            <FamilyAtGlanceWidget
              isLoading={isLoadingMembers || isLoadingBirthdays}
              quickStats={quickStats}
              onLaunchSpark={onLaunchSpark}
              isMobile={true}
            />

            {/* Upcoming Birthdays */}
            <UpcomingBirthdaysWidget
              isLoading={isLoadingBirthdays}
              upcomingBirthdays={upcomingBirthdays}
              onSelectMember={handleSelectMember}
            />

            {/* Upcoming Gatherings */}
            <UpcomingGatheringsWidget
              isLoading={isLoadingEvents}
              nextEvents={nextEvents}
              onTabChange={onTabChange}
            />
          </div>
        </main>

        {/* Right Sidebar */}
        <aside className="hidden lg:block lg:col-span-3 space-y-5">
          <UpcomingBirthdaysWidget
            isLoading={isLoadingBirthdays}
            upcomingBirthdays={upcomingBirthdays}
            onSelectMember={handleSelectMember}
          />

          <UpcomingGatheringsWidget
            isLoading={isLoadingEvents}
            nextEvents={nextEvents}
            onTabChange={onTabChange}
          />

          <FamilyQuoteWidget />
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