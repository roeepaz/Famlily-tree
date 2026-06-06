import React, { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import CommentItem from "./CommentItem";

export default function CommentsSection({ post, onAddComment, isPending }) {
  const [commentText, setCommentText] = useState("");

  const handleAddComment = () => {
    if (!commentText.trim()) return;
    onAddComment(commentText.trim());
    setCommentText("");
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleAddComment();
    }
  };

  return (
    <div className="px-5 pb-4 border-t border-border pt-3 space-y-3 bg-secondary/10">
      {post.comments && post.comments.length > 0 && (
        <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
          {post.comments.map((comment) => (
            <CommentItem key={comment.id} comment={comment} />
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
          disabled={isPending}
        />
        <Button
          size="sm"
          variant="ghost"
          onClick={handleAddComment}
          disabled={isPending || !commentText.trim()}
          className="text-primary h-8 px-3 text-xs font-medium hover:bg-secondary/40"
        >
          {isPending ? "Replying..." : "Reply"}
        </Button>
      </div>
    </div>
  );
}
