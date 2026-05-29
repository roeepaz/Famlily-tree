import React, { useState } from "react";
import { Heart, MessageCircle, Share2, Sun, Trophy, BookHeart, Calendar } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { POST_TYPE_CONFIG } from "@/lib/mockData";
import { formatDistanceToNow } from "date-fns";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { toast } from "@/components/ui/use-toast";
import { useAuth } from "@/lib/AuthContext";

const typeIcons = { daily: Sun, milestone: Trophy, memory: BookHeart, event: Calendar };

const LOVE_EMOJIS = ["❤️", "🥰", "😍", "💖", "🤗", "🙏"];

const REACTION_CONFIG = {
  "❤️": { label: "Love", color: "text-rose-500 hover:text-rose-600 font-semibold" },
  "🥰": { label: "Warmth", color: "text-teal-500 hover:text-teal-600 font-semibold" },
  "😍": { label: "Adore", color: "text-cyan-500 hover:text-cyan-600 font-semibold" },
  "💖": { label: "Sparkle", color: "text-pink-500 hover:text-pink-600 font-semibold" },
  "🤗": { label: "Hug", color: "text-blue-500 hover:text-blue-600 font-semibold" },
  "🙏": { label: "Thankful", color: "text-yellow-600 hover:text-yellow-700 font-semibold" },
};

export default function FamilyPostCard({ post, onTabChange }) {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [showComments, setShowComments] = useState(false);
  const [commentText, setCommentText] = useState("");
  const [showReactions, setShowReactions] = useState(false);
  const reactionsTimeoutRef = React.useRef(null);

  const config = POST_TYPE_CONFIG[post.type] || POST_TYPE_CONFIG.daily;
  const TypeIcon = typeIcons[post.type] || Sun;

  // React Query Mutations with Optimistic Updates
  const toggleReactionMutation = useMutation({
    mutationFn: (emoji) => api.toggleReaction(post.id, emoji),
    onMutate: async (newEmoji) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ["posts"] });

      // Snapshot the previous posts value
      const previousPosts = queryClient.getQueryData(["posts"]);

      // Optimistically update the posts cache
      queryClient.setQueryData(["posts"], (oldPosts) => {
        if (!oldPosts) return [];
        return oldPosts.map((p) => {
          if (p.id !== post.id) return p;

          const currentReaction = p.userReaction;
          let newUserReaction = null;
          let newReactions = p.reactions ? [...p.reactions] : [];

          // 1. Remove previous user reaction if it exists
          if (currentReaction) {
            newReactions = newReactions.map((r) => {
              if (r.emoji === currentReaction) {
                return { ...r, count: Math.max(0, r.count - 1) };
              }
              return r;
            }).filter((r) => r.count > 0);
          }

          // 2. Add new reaction if it's different from the current one
          if (currentReaction !== newEmoji) {
            newUserReaction = newEmoji;
            const existingIdx = newReactions.findIndex((r) => r.emoji === newEmoji);
            if (existingIdx > -1) {
              newReactions[existingIdx] = {
                ...newReactions[existingIdx],
                count: newReactions[existingIdx].count + 1,
              };
            } else {
              newReactions.push({ emoji: newEmoji, count: 1 });
            }
          }

          return {
            ...p,
            userReaction: newUserReaction,
            reactions: newReactions,
          };
        });
      });

      return { previousPosts };
    },
    onError: (err, newEmoji, context) => {
      // Rollback to previous state on failure
      if (context?.previousPosts) {
        queryClient.setQueryData(["posts"], context.previousPosts);
      }
      toast({
        title: "Failed to update reaction",
        description: err.message,
        variant: "destructive",
      });
    },
    onSettled: () => {
      // Sync cache with server state in the background
      queryClient.invalidateQueries({ queryKey: ["posts"] });
    }
  });

  const addCommentMutation = useMutation({
    mutationFn: (text) => api.addComment(post.id, text),
    onMutate: async (newText) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ["posts"] });

      // Snapshot the previous posts value
      const previousPosts = queryClient.getQueryData(["posts"]);

      // Optimistically update
      queryClient.setQueryData(["posts"], (oldPosts) => {
        if (!oldPosts) return [];
        return oldPosts.map((p) => {
          if (p.id !== post.id) return p;

          const optimisticComment = {
            id: `temp-${Date.now()}`,
            text: newText,
            timestamp: new Date().toISOString(),
            authorId: user?.id || 'temp-user',
            authorName: user?.name || 'Family Member',
            authorAvatar: user?.avatar || ''
          };

          return {
            ...p,
            comments: p.comments ? [...p.comments, optimisticComment] : [optimisticComment]
          };
        });
      });

      return { previousPosts };
    },
    onError: (err, newText, context) => {
      // Rollback on failure
      if (context?.previousPosts) {
        queryClient.setQueryData(["posts"], context.previousPosts);
      }
      toast({
        title: "Failed to add comment",
        description: err.message,
        variant: "destructive",
      });
    },
    onSettled: () => {
      // Sync cache with server state in the background
      queryClient.invalidateQueries({ queryKey: ["posts"] });
    }
  });

  const handleReact = (emoji) => {
    if (reactionsTimeoutRef.current) {
      clearTimeout(reactionsTimeoutRef.current);
    }
    toggleReactionMutation.mutate(emoji);
  };

  const handleAddComment = () => {
    if (!commentText.trim()) return;
    addCommentMutation.mutate(commentText.trim());
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleAddComment();
    }
  };

  const handleMouseEnter = () => {
    if (reactionsTimeoutRef.current) {
      clearTimeout(reactionsTimeoutRef.current);
      reactionsTimeoutRef.current = null;
    }
    setShowReactions(true);
  };

  const handleMouseLeave = () => {
    reactionsTimeoutRef.current = setTimeout(() => {
      setShowReactions(false);
    }, 400); // 400ms delay to smoothly move between components
  };

  const hasReacted = !!post.userReaction;
  const activeReaction = hasReacted ? REACTION_CONFIG[post.userReaction] : null;

  return (
    <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden transition-shadow hover:shadow-md">
      {/* Header */}
      <div className="p-5 pb-3">
        <div className="flex items-start gap-3">
          <Avatar className="w-11 h-11 ring-2 ring-secondary">
            <AvatarImage src={post.authorAvatar} alt={post.authorName} />
            <AvatarFallback>{post.authorName[0]}</AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-semibold text-sm text-foreground">{post.authorName}</span>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-secondary text-xs text-muted-foreground font-medium">
                {post.authorBranch}
              </span>
            </div>
            <div className="flex items-center gap-2 mt-0.5">
              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium ${config.color}`}>
                <TypeIcon className="w-3 h-3" />
                {config.label}
              </span>
              <span className="text-xs text-muted-foreground">
                {formatDistanceToNow(new Date(post.timestamp), { addSuffix: true })}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="px-5 pb-3">
        {post.type === 'event' ? (
          <div className="bg-secondary/40 rounded-xl p-4 border border-border/50 space-y-3 shadow-inner">
            <div className="flex items-start gap-2.5">
              <span className="text-2xl shrink-0">📢</span>
              <div className="min-w-0 flex-1">
                <span className="text-[10px] font-bold text-primary tracking-wider uppercase">
                  Gathering Scheduled
                </span>
                <h3 className="font-heading text-lg font-extrabold text-foreground leading-snug mt-0.5">
                  {post.content.split('\n')[0].replace('📢 New Family Event Scheduled: ', '').replace(/\*\*/g, '')}
                </h3>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-muted-foreground pt-2.5 border-t border-border/40">
              {post.content.split('\n').map((line, idx) => {
                if (line.includes('🗓️')) {
                  return (
                    <div key={idx} className="flex items-center gap-1.5">
                      <span className="shrink-0 text-base">🗓️</span>
                      <span className="font-semibold text-foreground/90">{line.replace('🗓️ **Date:** ', '').replace(/\*\*/g, '')}</span>
                    </div>
                  );
                }
                if (line.includes('📍')) {
                  return (
                    <div key={idx} className="flex items-center gap-1.5">
                      <span className="shrink-0 text-base">📍</span>
                      <span className="font-semibold text-foreground/90">{line.replace('📍 **Location:** ', '').replace(/\*\*/g, '')}</span>
                    </div>
                  );
                }
                return null;
              })}
            </div>

            {/* Description details */}
            {post.content.split('\n\n')[1] && (
              <div className="bg-card/70 p-3 rounded-lg border border-border/30">
                <p className="text-xs text-foreground/80 leading-relaxed italic whitespace-pre-line">
                  "{post.content.split('\n\n')[1]}"
                </p>
              </div>
            )}
          </div>
        ) : (
          <p className="text-sm leading-relaxed text-foreground/90 whitespace-pre-line">{post.content}</p>
        )}
      </div>

      {/* Image */}
      {post.image && (
        <div className="px-5 pb-3">
          <img
            src={post.image}
            alt="Post media"
            className="w-full rounded-xl object-cover max-h-80"
          />
        </div>
      )}

      {/* Event Link Banner */}
      {post.type === 'event' && (
        <div className="px-5 pb-3">
          <div className="p-4 bg-primary/5 border border-primary/10 rounded-xl flex items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-primary shrink-0" />
              <div>
                <h4 className="text-xs font-bold text-foreground">Family Event Announcement</h4>
                <p className="text-[10px] text-muted-foreground">Check options, dates, and RSVP now.</p>
              </div>
            </div>
            <Button
              onClick={() => onTabChange && onTabChange("events")}
              size="sm"
              className="text-[10px] px-3.5 h-8 bg-primary hover:bg-primary/95 text-primary-foreground rounded-lg shadow-sm"
            >
              View Event & RSVP
            </Button>
          </div>
        </div>
      )}

      {/* Reactions Display */}
      {post.reactions && post.reactions.length > 0 && (
        <div className="px-5 pb-3 flex items-center gap-2 flex-wrap border-b border-border/20">
          {post.reactions.map((r, i) => (
            <span
              key={i}
              onClick={() => handleReact(r.emoji)}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-secondary/60 text-xs font-medium text-foreground/80 cursor-pointer hover:bg-secondary transition-colors"
              title={`React with ${r.emoji}`}
            >
              {r.emoji} {r.count}
            </span>
          ))}
        </div>
      )}

      {/* Actions */}
      <div className="px-5 py-3 border-t border-border flex items-center gap-1 relative">
        <div 
          className="relative flex-1 flex items-center"
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
        >
          <Button 
            variant="ghost" 
            size="sm" 
            className="flex-1 text-muted-foreground rounded-l-xl rounded-r-none pr-1"
            onClick={() => handleReact(post.userReaction || "❤️")}
          >
            {hasReacted ? (
              <span className="flex items-center gap-1.5 justify-center">
                <span className="text-base animate-bounce-short">{post.userReaction}</span>
                <span className={activeReaction?.color || "text-rose-500"}>
                  {activeReaction?.label || "Love"}
                </span>
              </span>
            ) : (
              <span className="flex items-center gap-1.5 justify-center">
                <Heart className="w-4 h-4" />
                <span>Love</span>
              </span>
            )}
          </Button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              if (reactionsTimeoutRef.current) {
                clearTimeout(reactionsTimeoutRef.current);
              }
              setShowReactions(!showReactions);
            }}
            className="h-9 px-2 text-muted-foreground/60 hover:text-foreground hover:bg-accent rounded-r-xl transition-colors border-l border-border/40"
          >
            <span className="text-[10px]">▼</span>
          </button>

          {/* Facebook-like Hover reaction bar */}
          {showReactions && (
            <div 
              className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 bg-popover border border-border rounded-full py-1.5 px-3.5 shadow-xl flex items-center gap-3 z-50 animate-in fade-in-50 slide-in-from-bottom-2 duration-200"
              onMouseEnter={handleMouseEnter}
              onMouseLeave={handleMouseLeave}
            >
              {LOVE_EMOJIS.map((emoji) => (
                <button
                  key={emoji}
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleReact(emoji);
                    setShowReactions(false);
                  }}
                  className="text-2xl hover:scale-130 active:scale-95 transition-transform duration-150 focus:outline-none"
                  title={REACTION_CONFIG[emoji]?.label}
                >
                  {emoji}
                </button>
              ))}
            </div>
          )}
        </div>

        <Button
          variant="ghost"
          size="sm"
          className="flex-1 text-muted-foreground rounded-xl"
          onClick={() => setShowComments(!showComments)}
        >
          <MessageCircle className="w-4 h-4 mr-1.5" />
          {post.comments ? post.comments.length : 0}
        </Button>
        <Button variant="ghost" size="sm" className="flex-1 text-muted-foreground rounded-xl">
          <Share2 className="w-4 h-4 mr-1.5" />
          Share
        </Button>
      </div>

      {/* First Comment Preview (only if comments are collapsed and at least one exists) */}
      {!showComments && post.comments && post.comments.length > 0 && (
        <div className="px-5 pb-3 border-t border-border/20 pt-3 bg-secondary/5">
          <div className="flex items-start gap-2.5">
            <Avatar className="w-7 h-7">
              <AvatarImage src={post.comments[0].authorAvatar} alt={post.comments[0].authorName} />
              <AvatarFallback>{post.comments[0].authorName[0]}</AvatarFallback>
            </Avatar>
            <div className="flex-1 bg-secondary/30 rounded-xl px-3 py-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-foreground">{post.comments[0].authorName}</span>
                {post.comments.length > 1 && (
                  <button 
                    onClick={() => setShowComments(true)}
                    className="text-[10px] text-primary hover:underline font-medium"
                  >
                    View all {post.comments.length} replies
                  </button>
                )}
              </div>
              <p className="text-xs text-foreground/80 mt-0.5 leading-relaxed">{post.comments[0].text}</p>
            </div>
          </div>
        </div>
      )}

      {/* Comments */}
      {showComments && (
        <div className="px-5 pb-4 border-t border-border pt-3 space-y-3 bg-secondary/10">
          {post.comments && post.comments.length > 0 && (
            <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
              {post.comments.map((comment) => (
                <div key={comment.id} className="flex items-start gap-2.5">
                  <Avatar className="w-7 h-7">
                    <AvatarImage src={comment.authorAvatar} alt={comment.authorName} />
                    <AvatarFallback>{comment.authorName[0]}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 bg-secondary/50 rounded-xl px-3 py-2">
                    <span className="text-xs font-semibold text-foreground">{comment.authorName}</span>
                    <p className="text-xs text-foreground/80 mt-0.5 leading-relaxed">{comment.text}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
          <div className="flex items-center gap-2 mt-2">
            <Input
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Write a comment..."
              className="text-xs rounded-xl bg-secondary/40 border-none h-8 focus-visible:ring-1 focus-visible:ring-primary"
              disabled={addCommentMutation.isPending}
            />
            <Button 
              size="sm" 
              variant="ghost" 
              onClick={handleAddComment}
              disabled={addCommentMutation.isPending || !commentText.trim()}
              className="text-primary h-8 px-3 text-xs font-medium hover:bg-secondary/40"
            >
              {addCommentMutation.isPending ? "Replying..." : "Reply"}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}