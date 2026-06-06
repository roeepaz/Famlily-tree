import React from "react";

export default function FamilyQuoteWidget() {
  return (
    <div className="bg-gradient-to-br from-primary/10 to-primary/5 rounded-2xl border border-primary/10 p-5">
      <h3 className="font-heading text-base font-semibold text-foreground mb-2">Family Quote</h3>
      <p className="text-sm text-foreground/80 italic leading-relaxed">
        "The family is one of nature's masterpieces."
      </p>
      <p className="text-xs text-muted-foreground mt-2">— George Santayana</p>
    </div>
  );
}
