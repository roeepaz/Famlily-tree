import React, { useState } from "react";
import RelativeNodeCard from "./RelativeNodeCard";
import ProfileDrawer from "./ProfileDrawer";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/AuthContext";

const GENERATIONS = [
  { key: "grandparents", label: "Grandparents" },
  { key: "parents", label: "Parents & Uncles/Aunts" },
  { key: "siblings", label: "Siblings & Cousins" },
  { key: "children", label: "Children" },
];

export default function TreeExplorer() {
  const [selectedMember, setSelectedMember] = useState(null);
  const { user } = useAuth();

  const { data: familyCircle = [], isLoading } = useQuery({
    queryKey: ["familyCircle"],
    queryFn: api.getCircle,
  });

  const grouped = {};
  GENERATIONS.forEach((g) => {
    grouped[g.key] = familyCircle.filter((m) => m.generation === g.key && m.id !== user?.id);
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin"></div>
      </div>
    );
  }

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
          const hasMembers = members.length > 0;
          const isSiblingsRow = gen.key === "siblings" && user;
          if (!hasMembers && !isSiblingsRow) return null;

          return (
            <div key={gen.key}>
              {/* Generation label */}
              <div className="flex items-center gap-3 mb-5">
                <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{gen.label}</span>
                <div className="flex-1 h-px bg-border" />
              </div>

              {/* Insert "You" in the siblings row */}
              <div className="flex flex-wrap justify-center gap-4">
                {gen.key === "siblings" && user && (
                  <RelativeNodeCard
                    member={{ ...user, relation: "You" }}
                    isCenter
                    onClick={setSelectedMember}
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