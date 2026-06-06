import React, { useState } from "react";
import { Heart, MessageCircle, Share2, Sun, Trophy, BookHeart, Calendar } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { POST_TYPE_CONFIG } from "@/lib/mockData";
import { formatDistanceToNow } from "date-fns";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { toast } from "@/components/ui/use-toast";
import { useAuth } from "@/lib/AuthContext";
import EventPostDetails from "./post/EventPostDetails";
import ReactionsHoverBar from "./post/ReactionsHoverBar";
import CommentItem from "./post/CommentItem";
import CommentsSection from "./post/CommentsSection";

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

  const { data: eventDetails } = useQuery({
    queryKey: ["event", post.eventId],
    queryFn: () => api.getEvent(post.eventId),
    enabled: !!post.eventId,
  });

  const [showComments, setShowComments] = useState(false);
  const [showReactions, setShowReactions] = useState(false);
  const reactionsTimeoutRef = React.useRef(null);

  const config = POST_TYPE_CONFIG[post.type] || POST_TYPE_CONFIG.daily;
  const TypeIcon = typeIcons[post.type] || Sun;

  // React Query Mutations with Optimistic Updates
  const toggleReactionMutation = useMutation({
    mutationFn: (emoji) => api.toggleReaction(post.id, emoji),
    onMutate: async (newEmoji) => {
      await queryClient.cancelQueries({ queryKey: ["posts"] });
      const previousPosts = queryClient.getQueryData(["posts"]);

      queryClient.setQueryData(["posts"], (oldPosts) => {
        if (!oldPosts) return [];
        return oldPosts.map((p) => {
          if (p.id !== post.id) return p;

          const currentReaction = p.userReaction;
          let newUserReaction = null;
          let newReactions = p.reactions ? [...p.reactions] : [];

          if (currentReaction) {
            newReactions = newReactions.map((r) => {
              if (r.emoji === currentReaction) {
                return { ...r, count: Math.max(0, r.count - 1) };
              }
              return r;
            }).filter((r) => r.count > 0);
          }

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
      queryClient.invalidateQueries({ queryKey: ["posts"] });
    }
  });

  const addCommentMutation = useMutation({
    mutationFn: (text) => api.addComment(post.id, text),
    onMutate: async (newText) => {
      await queryClient.cancelQueries({ queryKey: ["posts"] });
      const previousPosts = queryClient.getQueryData(["posts"]);

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
      queryClient.invalidateQueries({ queryKey: ["posts"] });
    }
  });

  const handleReact = (emoji) => {
    if (reactionsTimeoutRef.current) {
      clearTimeout(reactionsTimeoutRef.current);
    }
    toggleReactionMutation.mutate(emoji);
  };

  const handleAddComment = (text) => {
    addCommentMutation.mutate(text);
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
    }, 400);
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
        {post.type === "event" ? (
          <EventPostDetails post={post} eventDetails={eventDetails} onTabChange={onTabChange} />
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

          <ReactionsHoverBar
            showReactions={showReactions}
            loveEmojis={LOVE_EMOJIS}
            reactionConfig={REACTION_CONFIG}
            onReact={(emoji) => {
              handleReact(emoji);
              setShowReactions(false);
            }}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
          />
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
            <CommentItem comment={post.comments[0]} bgClass="bg-secondary/30" />
            {post.comments.length > 1 && (
              <button 
                onClick={() => setShowComments(true)}
                className="text-[10px] text-primary hover:underline font-medium ml-auto mt-2 whitespace-nowrap"
              >
                View all {post.comments.length}
              </button>
            )}
          </div>
        </div>
      )}

      {/* Comments Drawer/List */}
      {showComments && (
        <CommentsSection
          post={post}
          onAddComment={handleAddComment}
          isPending={addCommentMutation.isPending}
        />
      )}
    </div>
  );
}