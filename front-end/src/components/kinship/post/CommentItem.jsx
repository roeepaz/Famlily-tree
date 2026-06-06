import React from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export default function CommentItem({ comment, bgClass = "bg-secondary/50" }) {
  return (
    <div className="flex items-start gap-2.5">
      <Avatar className="w-7 h-7">
        <AvatarImage src={comment.authorAvatar} alt={comment.authorName} />
        <AvatarFallback>{comment.authorName?.[0] || "?"}</AvatarFallback>
      </Avatar>
      <div className={`flex-1 ${bgClass} rounded-xl px-3 py-2`}>
        <span className="text-xs font-semibold text-foreground">{comment.authorName}</span>
        <p className="text-xs text-foreground/80 mt-0.5 leading-relaxed">{comment.text}</p>
      </div>
    </div>
  );
}
