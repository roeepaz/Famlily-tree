import React, { useState } from "react";
import RelativeNodeCard from "./RelativeNodeCard";
import ProfileDrawer from "./ProfileDrawer";
import AddRelativeModal from "./AddRelativeModal";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/AuthContext";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/use-toast";
import { UserPlus, Clock, Check, X } from "lucide-react";

const GENERATIONS = [
  { key: "grandparents", label: "Grandparents" },
  { key: "parents", label: "Parents & Uncles/Aunts" },
  { key: "siblings", label: "Siblings & Cousins" },
  { key: "children", label: "Children & Nephews/Nieces" },
  { key: "grandchildren", label: "Grandchildren" },
];

export default function TreeExplorer() {
  const [selectedMember, setSelectedMember] = useState(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [addModalAnchorId, setAddModalAnchorId] = useState(null);
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: familyCircle = [], isLoading } = useQuery({
    queryKey: ["familyCircle"],
    queryFn: api.getCircle,
  });

  const { data: pendingRequests = [] } = useQuery({
    queryKey: ["pendingRequests"],
    queryFn: api.getPendingRequests,
    enabled: !!user,
  });

  const respondMutation = useMutation({
    mutationFn: async ({ id, action }) => {
      return await api.respondToRequest(id, action);
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["familyCircle"] });
      queryClient.invalidateQueries({ queryKey: ["pendingRequests"] });
      toast({
        title: variables.action === "accept" ? "Connection accepted! ✨" : "Connection declined.",
        description: data.message,
      });
    },
    onError: (err) => {
      toast({
        title: "Action failed",
        description: err.message || "Failed to process the request.",
        variant: "destructive",
      });
    },
  });

  const grouped = {};
  GENERATIONS.forEach((g) => {
    grouped[g.key] = familyCircle.filter((m) => m.generation === g.key && m.id !== user?.id);
  });

  const visibleGenerations = GENERATIONS.filter((gen) => {
    const members = grouped[gen.key] || [];
    const hasMembers = members.length > 0;
    const isSiblingsRow = gen.key === "siblings" && user;
    return hasMembers || isSiblingsRow;
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
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-10 pb-6 border-b border-border">
        <div className="text-center sm:text-left">
          <h2 className="font-heading text-3xl font-semibold text-foreground">Family Tree</h2>
          <p className="text-sm text-muted-foreground mt-1.5">
            Explore your family connections. Click on anyone to see their profile.
          </p>
        </div>
        <Button 
          onClick={() => {
            setAddModalAnchorId(user?.id);
            setIsAddModalOpen(true);
          }} 
          className="rounded-xl gap-2 font-medium px-5 shadow-sm"
        >
          <UserPlus className="w-4 h-4" />
          Add Relative
        </Button>
      </div>

      {/* Pending Connection Requests Banner */}
      {pendingRequests.length > 0 && (
        <div className="mb-8 space-y-3 animate-in fade-in slide-in-from-top-4 duration-300">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-teal-600 dark:text-teal-400">
            <Clock className="w-4 h-4 animate-pulse" />
            Pending Family Connections ({pendingRequests.length})
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {pendingRequests.map((req) => (
              <div 
                key={req.id} 
                className="flex items-center justify-between p-4 bg-gradient-to-r from-teal-50/60 to-cyan-50/60 backdrop-blur-md border border-teal-200/60 rounded-2xl shadow-sm dark:from-teal-950/20 dark:to-cyan-950/20 dark:border-teal-900/40"
              >
                <div className="flex items-center gap-3">
                  <img
                    src={req.sender.avatar}
                    alt={req.sender.name}
                    className="w-10 h-10 rounded-full border border-border/80 object-cover"
                  />
                  <div>
                    <h4 className="text-sm font-semibold text-foreground">{req.sender.name}</h4>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Wants to connect with you as their <span className="font-semibold text-primary">{req.relationship_type.toLowerCase()}</span>
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => respondMutation.mutate({ id: req.id, action: "decline" })}
                    disabled={respondMutation.isPending}
                    className="h-8 w-8 p-0 rounded-full text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
                  >
                    <X className="w-4 h-4" />
                    <span className="sr-only">Decline</span>
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => respondMutation.mutate({ id: req.id, action: "accept" })}
                    disabled={respondMutation.isPending}
                    className="h-8 px-3 rounded-full bg-teal-600 hover:bg-teal-700 text-white dark:bg-teal-700 dark:hover:bg-teal-600 font-medium text-xs flex items-center gap-1.5 shadow-sm transition-all duration-200 hover:scale-[1.02]"
                  >
                    <Check className="w-3.5 h-3.5" />
                    Confirm
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="space-y-10">
        {visibleGenerations.map((gen, index) => {
          const members = grouped[gen.key] || [];

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
              {index !== visibleGenerations.length - 1 && (
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
        onAddRelative={(anchorId) => {
          setAddModalAnchorId(anchorId);
          setIsAddModalOpen(true);
          setSelectedMember(null);
        }}
      />

      <AddRelativeModal
        isOpen={isAddModalOpen}
        onClose={() => {
          setIsAddModalOpen(false);
          setAddModalAnchorId(null);
        }}
        preselectedAnchorId={addModalAnchorId}
      />
    </div>
  );
}