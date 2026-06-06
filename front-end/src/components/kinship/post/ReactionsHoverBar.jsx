import React from "react";

export default function ReactionsHoverBar({
  showReactions,
  loveEmojis,
  reactionConfig,
  onReact,
  onMouseEnter,
  onMouseLeave,
}) {
  if (!showReactions) return null;

  return (
    <div
      className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 bg-popover border border-border rounded-full py-1.5 px-3.5 shadow-xl flex items-center gap-3 z-50 animate-in fade-in-50 slide-in-from-bottom-2 duration-200"
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      {loveEmojis.map((emoji) => (
        <button
          key={emoji}
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onReact(emoji);
          }}
          className="text-2xl hover:scale-130 active:scale-95 transition-transform duration-150 focus:outline-none"
          title={reactionConfig[emoji]?.label}
        >
          {emoji}
        </button>
      ))}
    </div>
  );
}
