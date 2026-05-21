import React, { useState } from "react";
import { Heart, MessageCircle, Share2, Sun, Trophy, BookHeart } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { POST_TYPE_CONFIG } from "@/lib/mockData";
import { formatDistanceToNow } from "date-fns";

const typeIcons = { daily: Sun, milestone: Trophy, memory: BookHeart };

export default function FamilyPostCard({ post }) {
  const [showComments, setShowComments] = useState(false);
  const config = POST_TYPE_CONFIG[post.type] || POST_TYPE_CONFIG.daily;
  const TypeIcon = typeIcons[post.type] || Sun;

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
        <p className="text-sm leading-relaxed text-foreground/90">{post.content}</p>
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

      {/* Reactions */}
      <div className="px-5 pb-3 flex items-center gap-2">
        {post.reactions.map((r, i) => (
          <span
            key={i}
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-secondary/60 text-xs font-medium text-foreground/80 cursor-pointer hover:bg-secondary transition-colors"
          >
            {r.emoji} {r.count}
          </span>
        ))}
      </div>

      {/* Actions */}
      <div className="px-5 py-3 border-t border-border flex items-center gap-1">
        <Button variant="ghost" size="sm" className="flex-1 text-muted-foreground hover:text-rose-500 rounded-xl">
          <Heart className="w-4 h-4 mr-1.5" />
          Love
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="flex-1 text-muted-foreground rounded-xl"
          onClick={() => setShowComments(!showComments)}
        >
          <MessageCircle className="w-4 h-4 mr-1.5" />
          {post.comments.length}
        </Button>
        <Button variant="ghost" size="sm" className="flex-1 text-muted-foreground rounded-xl">
          <Share2 className="w-4 h-4 mr-1.5" />
          Share
        </Button>
      </div>

      {/* Comments */}
      {showComments && (
        <div className="px-5 pb-4 border-t border-border pt-3 space-y-3">
          {post.comments.map((comment) => (
            <div key={comment.id} className="flex items-start gap-2.5">
              <Avatar className="w-7 h-7">
                <AvatarImage src={comment.authorAvatar} alt={comment.authorName} />
                <AvatarFallback>{comment.authorName[0]}</AvatarFallback>
              </Avatar>
              <div className="flex-1 bg-secondary/50 rounded-xl px-3 py-2">
                <span className="text-xs font-semibold text-foreground">{comment.authorName}</span>
                <p className="text-xs text-foreground/80 mt-0.5">{comment.text}</p>
              </div>
            </div>
          ))}
          <div className="flex items-center gap-2 mt-2">
            <Input
              placeholder="Write a comment..."
              className="text-xs rounded-xl bg-secondary/40 border-none h-8"
            />
            <Button size="sm" variant="ghost" className="text-primary h-8 px-3 text-xs">
              Reply
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}