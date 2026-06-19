import React, { useState, useRef } from "react";
import RelativeNodeCard from "./RelativeNodeCard";
import ProfileDrawer from "./ProfileDrawer";
import AddRelativeModal from "./AddRelativeModal";
import SparkOnboardingCanvas from "./SparkOnboardingCanvas";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/AuthContext";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/use-toast";
import { TreePine, UserPlus, Clock, Check, X } from "lucide-react";
import { TreeSkeleton } from "./SkeletonLoaders";

const GENERATIONS = [
  { key: "grandparents", label: "Grandparents" },
  { key: "parents", label: "Parents & Uncles/Aunts" },
  { key: "siblings", label: "Siblings & Cousins" },
  { key: "children", label: "Children & Nephews/Nieces" },
  { key: "grandchildren", label: "Grandchildren" },
];

function groupRowMembers(rowMembers, user, genKey) {
  const couples = [];
  const singles = [];
  const processed = new Set();

  let userProfile = null;
  if (user && genKey === "siblings") {
    userProfile = { ...user, relation: "You" };
  }

  if (userProfile) {
    if (userProfile.spouseId) {
      const spouse = rowMembers.find(m => m.id === userProfile.spouseId);
      if (spouse) {
        couples.push({ partner1: userProfile, partner2: spouse });
        processed.add(spouse.id);
      } else {
        singles.push(userProfile);
      }
    } else {
      singles.push(userProfile);
    }
  }

  rowMembers.forEach(member => {
    if (processed.has(member.id)) return;

    if (member.spouseId) {
      const partner = rowMembers.find(m => m.id === member.spouseId);
      if (partner && !processed.has(partner.id)) {
        couples.push({ partner1: member, partner2: partner });
        processed.add(member.id);
        processed.add(partner.id);
      } else {
        singles.push(member);
        processed.add(member.id);
      }
    } else {
      singles.push(member);
      processed.add(member.id);
    }
  });

  return { couples, singles };
}

export default function TreeExplorer({ onLaunchSpark, onTabChange }) {
  const [selectedMember, setSelectedMember] = useState(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [addModalAnchorId, setAddModalAnchorId] = useState(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const containerRef = useRef(null);
  const [dragStart, setDragStart] = useState({ x: 0, scrollLeft: 0, active: false });
  const [hasDragged, setHasDragged] = useState(false);

  const handleMouseDown = (e) => {
    if (!containerRef.current) return;
    if (e.button !== 0) return; // Left click only
    
    setDragStart({
      x: e.pageX,
      scrollLeft: containerRef.current.scrollLeft,
      active: true
    });
    setHasDragged(false);
  };

  const handleMouseMove = (e) => {
    if (!dragStart.active || !containerRef.current) return;
    
    const deltaX = e.pageX - dragStart.x;
    if (Math.abs(deltaX) > 5) {
      setHasDragged(true);
    }
    
    containerRef.current.scrollLeft = dragStart.scrollLeft - deltaX;
  };

  const handleMouseUpOrLeave = () => {
    setDragStart((prev) => ({ ...prev, active: false }));
  };

  const handleCardClick = (member) => {
    if (hasDragged) {
      return;
    }
    setSelectedMember(member);
  };

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

  const isOnboardingActive =
    !isLoading &&
    user &&
    familyCircle.length <= 1 &&
    localStorage.getItem(`kinship_spark_completed_${user.id}`) !== "true";

  if (isOnboardingActive) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <SparkOnboardingCanvas familyCircle={familyCircle} />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Viewport Canvas Wrapper */}
      <div className="relative min-h-[80vh] w-full overflow-hidden flex flex-col items-center py-8 px-4 sm:px-8 bg-gradient-to-b from-slate-900 via-slate-950 to-slate-900 text-slate-100 rounded-3xl border border-slate-800 shadow-2xl">
        {/* Grid Background */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b_1px,transparent_1px),linear-gradient(to_bottom,#1e293b_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] opacity-20 pointer-events-none" />
        {/* Glows */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full bg-teal-500/5 blur-3xl pointer-events-none animate-[pulse_6s_ease-in-out_infinite]" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 rounded-full bg-cyan-500/5 blur-3xl pointer-events-none animate-[pulse_6s_ease-in-out_infinite_2s]" />

        {/* Content Container */}
        <div className="w-full max-w-5xl z-10">
          {isLoading ? (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-10 pb-6 border-b border-slate-800 animate-pulse">
                <div className="space-y-2">
                  <div className="h-8 w-48 bg-slate-800 rounded-lg" />
                  <div className="h-4 w-72 bg-slate-800 rounded-lg" />
                </div>
                <div className="h-10 w-36 bg-slate-800 rounded-xl" />
              </div>
              <TreeSkeleton />
            </div>
          ) : (
            <>
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-10 pb-6 border-b border-slate-800">
                <div className="text-center sm:text-left">
                  <h2 className="font-heading text-3xl font-semibold text-slate-100 flex items-center justify-center sm:justify-start gap-2">
                    Family Tree
                    <TreePine className="w-6 h-6 text-teal-400" />
                  </h2>
                  <p className="text-sm text-slate-400 mt-1.5">
                    Explore your family connections. Click on anyone to see their profile.
                  </p>
                </div>
                
                <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
                  {/* Mode Switcher */}
                  <div className="flex items-center bg-slate-950 border border-slate-800 p-1 rounded-xl shadow-inner shrink-0 w-full sm:w-auto justify-center">
                    <button
                      onClick={() => setIsEditMode(false)}
                      className={`flex-1 sm:flex-none px-4 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                        !isEditMode
                          ? "bg-teal-500 text-slate-900 shadow-md"
                          : "text-slate-400 hover:text-slate-200"
                      }`}
                    >
                      View
                    </button>
                    <button
                      onClick={() => setIsEditMode(true)}
                      className={`flex-1 sm:flex-none px-4 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                        isEditMode
                          ? "bg-teal-500 text-slate-900 shadow-md"
                          : "text-slate-400 hover:text-slate-200"
                      }`}
                    >
                      Edit
                    </button>
                  </div>

                  {isEditMode && (
                    <div className="flex flex-row items-center gap-2.5 w-full sm:w-auto">
                      <Button 
                        onClick={onLaunchSpark} 
                        variant="outline"
                        className="flex-1 sm:flex-none rounded-xl gap-1.5 sm:gap-2 border-teal-500/30 text-teal-400 hover:bg-teal-500/10 hover:text-teal-300 font-medium px-3 sm:px-5 py-2 sm:py-2.5 text-[11px] sm:text-sm shadow-sm bg-slate-900"
                      >
                        <span>🌱</span>
                        <span>עורך עץ המשפחה</span>
                      </Button>
                      <Button 
                        onClick={() => {
                          setAddModalAnchorId(user?.id);
                          setIsAddModalOpen(true);
                        }} 
                        className="flex-1 sm:flex-none rounded-xl gap-1.5 sm:gap-2 font-medium px-3 sm:px-5 py-2 sm:py-2.5 bg-teal-500 hover:bg-teal-600 text-slate-950 font-semibold text-[11px] sm:text-xs flex items-center justify-center shadow-sm transition-all duration-200 hover:scale-[1.02] border-0"
                      >
                        <UserPlus className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                        <span>הוספה ידנית</span>
                      </Button>
                    </div>
                  )}
                </div>
              </div>

              {/* Pending Connection Requests Banner */}
              {pendingRequests.length > 0 && (
                <div className="mb-8 space-y-3 animate-in fade-in slide-in-from-top-4 duration-300">
                  <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-teal-400">
                    <Clock className="w-4 h-4 animate-pulse" />
                    Pending Family Connections ({pendingRequests.length})
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    {pendingRequests.map((req) => (
                      <div 
                        key={req.id} 
                        className="flex items-center justify-between p-4 bg-slate-950/60 border border-slate-800/80 rounded-2xl shadow-sm backdrop-blur-md"
                      >
                        <div className="flex items-center gap-3">
                          <img
                            src={req.sender.avatar}
                            alt={req.sender.name}
                            className="w-10 h-10 rounded-full border border-slate-800 object-cover"
                          />
                          <div>
                            <h4 className="text-sm font-semibold text-slate-200">{req.sender.name}</h4>
                            <p className="text-xs text-slate-400 mt-0.5">
                              Wants to connect with you as their <span className="font-semibold text-teal-400">{req.relationship_type.toLowerCase()}</span>
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => respondMutation.mutate({ id: req.id, action: "decline" })}
                            disabled={respondMutation.isPending}
                            className="h-8 w-8 p-0 rounded-full text-slate-400 hover:bg-rose-500/10 hover:text-rose-400 transition-colors"
                          >
                            <X className="w-4 h-4" />
                            <span className="sr-only">Decline</span>
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => respondMutation.mutate({ id: req.id, action: "accept" })}
                            disabled={respondMutation.isPending}
                            className="h-8 px-3 rounded-full bg-teal-500 hover:bg-teal-600 text-slate-950 font-semibold text-xs flex items-center gap-1.5 shadow-sm transition-all duration-200 hover:scale-[1.02] border-0"
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

              {/* Swipe/Drag guide for mobile */}
              <div className="flex md:hidden items-center justify-center gap-1.5 text-slate-400 text-[11px] mb-4 bg-slate-950/40 border border-slate-800/80 px-2.5 py-1 rounded-full w-fit mx-auto shadow-sm select-none">
                <span className="animate-pulse">↔</span> Scroll or drag to explore tree
              </div>

              {/* Entire Tree scrollable canvas */}
              <div 
                ref={containerRef}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUpOrLeave}
                onMouseLeave={handleMouseUpOrLeave}
                className="w-full overflow-x-auto no-scrollbar cursor-grab active:cursor-grabbing py-4 select-none"
              >
                <div className="inline-flex flex-col items-center min-w-full justify-center">
                  <div className="flex flex-col items-center space-y-8 sm:space-y-10 min-w-max px-8 py-2">
                    {visibleGenerations.map((gen, index) => {
                      const members = grouped[gen.key] || [];

                      return (
                        <div key={gen.key} className="w-full flex flex-col items-center">
                          {/* Generation label */}
                          <div className="flex items-center gap-3 mb-5 w-full">
                            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 shrink-0">{gen.label}</span>
                            <div className="flex-1 h-px bg-slate-800/80" />
                          </div>

                          {/* Nodes Render Container */}
                          <div className="flex flex-nowrap justify-center items-center gap-4 sm:gap-6 w-full">
                            {(() => {
                              const { couples, singles } = groupRowMembers(members, user, gen.key);
                              return (
                                <>
                                  {/* Couples Block */}
                                  {couples.map((couple, cIdx) => (
                                    <div 
                                      key={`couple-${cIdx}`}
                                      className="flex items-center gap-1.5 sm:gap-2 p-2 sm:p-3.5 border border-dashed border-teal-500/25 rounded-2xl sm:rounded-3xl bg-slate-950/40 shadow-inner relative shrink-0"
                                    >
                                      <RelativeNodeCard
                                        member={couple.partner1}
                                        isCenter={couple.partner1.relation === "You"}
                                        onClick={handleCardClick}
                                        isDark={true}
                                      />
                                      <div className="w-4 sm:w-6 h-px bg-gradient-to-r from-teal-500/20 via-teal-500 to-teal-500/20 relative flex items-center justify-center shrink-0">
                                        <span className="text-[9px] sm:text-[10px] leading-none text-rose-500 bg-slate-950 px-1 rounded-full border border-teal-500/10 shadow-sm animate-pulse">❤️</span>
                                      </div>
                                      <RelativeNodeCard
                                        member={couple.partner2}
                                        isCenter={false}
                                        onClick={handleCardClick}
                                        isDark={true}
                                      />
                                    </div>
                                  ))}

                                  {/* Singles Block */}
                                  {singles.map((single) => {
                                    if (single.relation === "You" && couples.some(c => c.partner1.relation === "You")) return null;
                                    return (
                                      <RelativeNodeCard
                                        key={single.id}
                                        member={single}
                                        isCenter={single.relation === "You"}
                                        onClick={handleCardClick}
                                        isDark={true}
                                      />
                                    );
                                  })}
                                </>
                              );
                            })()}
                          </div>

                          {/* Connector line */}
                          {index !== visibleGenerations.length - 1 && (
                            <div className="flex justify-center mt-5">
                              <div className="w-px h-8 bg-slate-800" />
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
      <ProfileDrawer
        member={selectedMember}
        isOpen={!!selectedMember}
        onClose={() => setSelectedMember(null)}
        isEditMode={isEditMode}
        onAddRelative={isEditMode ? (anchorId) => {
          setAddModalAnchorId(anchorId);
          setIsAddModalOpen(true);
          setSelectedMember(null);
        } : null}
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
