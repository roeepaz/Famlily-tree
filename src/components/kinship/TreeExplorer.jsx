import React, { useState } from "react";
import { CURRENT_USER, FAMILY_MEMBERS } from "@/lib/mockData";
import RelativeNodeCard from "./RelativeNodeCard";
import ProfileDrawer from "./ProfileDrawer";

const GENERATIONS = [
  { key: "grandparents", label: "Grandparents" },
  { key: "parents", label: "Parents & Uncles/Aunts" },
  { key: "siblings", label: "Siblings & Cousins" },
  { key: "children", label: "Children" },
];

export default function TreeExplorer() {
  const [selectedMember, setSelectedMember] = useState(null);

  const grouped = {};
  GENERATIONS.forEach((g) => {
    grouped[g.key] = FAMILY_MEMBERS.filter((m) => m.generation === g.key);
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="text-center mb-10">
        <h2 className="font-heading text-3xl font-semibold text-foreground">Family Tree</h2>
        <p className="text-sm text-muted-foreground mt-1.5">
          Explore your family connections. Click on anyone to see their profile.
        </p>
      </div>

      <div className="space-y-10">
        {GENERATIONS.map((gen) => {
          const members = grouped[gen.key];
          if (members.length === 0) return null;

          return (
            <div key={gen.key}>
              {/* Generation label */}
              <div className="flex items-center gap-3 mb-5">
                <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{gen.label}</span>
                <div className="flex-1 h-px bg-border" />
              </div>

              {/* Insert "You" in the siblings row */}
              <div className="flex flex-wrap justify-center gap-4">
                {gen.key === "siblings" && (
                  <RelativeNodeCard
                    member={{ ...CURRENT_USER, relation: "You" }}
                    isCenter
                    onClick={() => {}}
                  />
                )}
                {members.map((member) => (
                  <RelativeNodeCard
                    key={member.id}
                    member={member}
                    isCenter={false}
                    onClick={setSelectedMember}
                  />
                ))}
              </div>

              {/* Connector line */}
              {gen.key !== "children" && (
                <div className="flex justify-center mt-5">
                  <div className="w-px h-8 bg-border" />
                </div>
              )}
            </div>
          );
        })}
      </div>

      <ProfileDrawer
        member={selectedMember}
        isOpen={!!selectedMember}
        onClose={() => setSelectedMember(null)}
      />
    </div>
  );
}