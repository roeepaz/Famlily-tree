import React, { useState } from "react";
import { Calendar, MapPin, Clock, Edit2, Trash2, Check, Users } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { toast } from "@/components/ui/use-toast";
import { useAuth } from "@/lib/AuthContext";
import { motion } from "framer-motion";

export default function EventCard({ event, onEdit, onDelete }) {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [isDescExpanded, setIsDescExpanded] = useState(false);

  // RSVP Mutation
  const rsvpMutation = useMutation({
    mutationFn: (status) => api.rsvpEvent(event.id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["events"] });
    },
    onError: (err) => {
      toast({
        title: "Failed to update RSVP",
        description: err.message,
        variant: "destructive",
      });
    },
  });

  // Poll Vote Mutation
  const pollVoteMutation = useMutation({
    mutationFn: (optionId) => api.votePollOption(optionId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["events"] });
    },
    onError: (err) => {
      toast({
        title: "Failed to submit vote",
        description: err.message,
        variant: "destructive",
      });
    },
  });

  // Date parsing
  const dateObj = new Date(event.eventDate);
  const month = dateObj.toLocaleDateString("en-US", { month: "short" }).toUpperCase();
  const day = dateObj.getDate();
  const weekday = dateObj.toLocaleDateString("en-US", { weekday: "short" });
  const time = dateObj.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });

  const isCreator = user && user.id === event.authorId;

  // RSVP stats
  const { coming = [], notSure = [], cant = [], comingCount = 0, notSureCount = 0, cantCount = 0 } = event.rsvps || {};

  return (
    <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden flex flex-col justify-between group transition-all duration-300 hover:shadow-md">
      <div>
        {/* Cover image or gradient */}
        <div className="relative h-44 w-full bg-gradient-to-br from-primary/20 to-accent/15 overflow-hidden">
          {event.imageUrl ? (
            <img
              src={event.imageUrl}
              alt={event.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center text-primary/10">
              <Calendar className="w-24 h-24 stroke-[1]" />
            </div>
          )}
          
          {/* Glassmorphic Date Badge overlay */}
          <div className="absolute top-4 left-4 w-12 h-14 bg-background/95 backdrop-blur-md rounded-xl border border-border overflow-hidden flex flex-col items-center justify-center shadow-md">
            <div className="w-full bg-primary text-[9px] font-bold text-primary-foreground py-0.5 text-center leading-none tracking-wider">
              {month}
            </div>
            <div className="text-lg font-bold text-foreground leading-none py-1.5">
              {day}
            </div>
          </div>

          {/* Host Creator badge overlay */}
          <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between">
            <div className="flex items-center gap-2 bg-background/90 backdrop-blur-md px-3 py-1.5 rounded-full border border-border shadow-sm">
              <Avatar className="w-5 h-5 ring-1 ring-primary/20">
                <AvatarImage src={event.authorAvatar} alt={event.authorName} />
                <AvatarFallback>{event.authorName?.[0] || "?"}</AvatarFallback>
              </Avatar>
              <span className="text-[10px] font-semibold text-foreground truncate max-w-[120px]">
                Host: {event.authorName}
              </span>
            </div>

            {/* Creator Actions */}
            {isCreator && (
              <div className="flex items-center gap-1">
                <button
                  onClick={onEdit}
                  title="Edit event"
                  className="p-2 bg-background/90 hover:bg-background backdrop-blur-md rounded-full border border-border text-muted-foreground hover:text-primary shadow-sm transition-all active:scale-95"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={onDelete}
                  title="Delete event"
                  className="p-2 bg-background/90 hover:bg-background backdrop-blur-md rounded-full border border-border text-muted-foreground hover:text-destructive shadow-sm transition-all active:scale-95"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Content Details */}
        <div className="p-5">
          <div className="flex items-center gap-2">
            <span className="text-[10px] bg-secondary text-muted-foreground px-2 py-0.5 rounded-md font-semibold tracking-wide uppercase">
              {event.authorBranch}
            </span>
          </div>

          <h2 className="font-heading text-xl font-bold text-foreground mt-2 leading-snug">
            {event.title}
          </h2>
          {event.subtitle && (
            <p className="text-xs text-muted-foreground font-medium mt-0.5">
              {event.subtitle}
            </p>
          )}

          {/* Time and Location details */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-4 text-xs text-muted-foreground border-b border-border/40 pb-4">
            <div className="flex items-center gap-2">
              <Clock className="w-3.5 h-3.5 text-primary" />
              <span>{weekday}, {dateObj.toLocaleDateString(undefined, { month: "short", day: "numeric" })} at {time}</span>
            </div>
            {event.location && (
              <div className="flex items-center gap-2">
                <MapPin className="w-3.5 h-3.5 text-primary truncate" />
                <span className="truncate" title={event.location}>{event.location}</span>
              </div>
            )}
          </div>

          {/* Description */}
          <div className="mt-4">
            <p className={`text-xs text-foreground/80 leading-relaxed ${!isDescExpanded && "line-clamp-3"}`}>
              {event.description}
            </p>
            {event.description.length > 150 && (
              <button
                onClick={() => setIsDescExpanded(!isDescExpanded)}
                className="text-primary hover:underline text-[10px] font-semibold mt-1"
              >
                {isDescExpanded ? "Read less" : "Read more"}
              </button>
            )}
          </div>

          {/* RSVP Attendance options */}
          <div className="mt-6 border-t border-border/30 pt-5">
            <h3 className="text-xs font-semibold text-foreground flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5 text-muted-foreground" />
              Are you coming?
            </h3>
            
            {/* Status toggle buttons */}
            <div className="grid grid-cols-3 gap-2 mt-3">
              <Button
                variant={event.userRsvp === "COMING" ? "default" : "outline"}
                onClick={() => rsvpMutation.mutate("COMING")}
                disabled={rsvpMutation.isPending}
                className={`text-[11px] h-9 rounded-xl transition-all ${
                  event.userRsvp === "COMING" 
                    ? "bg-emerald-600 hover:bg-emerald-700 text-white" 
                    : "hover:bg-emerald-50 hover:text-emerald-600 border-border"
                }`}
              >
                I'm coming
              </Button>
              <Button
                variant={event.userRsvp === "NOT_SURE" ? "default" : "outline"}
                onClick={() => rsvpMutation.mutate("NOT_SURE")}
                disabled={rsvpMutation.isPending}
                className={`text-[11px] h-9 rounded-xl transition-all ${
                  event.userRsvp === "NOT_SURE" 
                    ? "bg-teal-500 hover:bg-teal-600 text-white" 
                    : "hover:bg-teal-50 hover:text-teal-600 border-border"
                }`}
              >
                Not sure
              </Button>
              <Button
                variant={event.userRsvp === "CANT" ? "default" : "outline"}
                onClick={() => rsvpMutation.mutate("CANT")}
                disabled={rsvpMutation.isPending}
                className={`text-[11px] h-9 rounded-xl transition-all ${
                  event.userRsvp === "CANT" 
                    ? "bg-rose-600 hover:bg-rose-700 text-white" 
                    : "hover:bg-rose-50 hover:text-rose-600 border-border"
                }`}
              >
                I can't
              </Button>
            </div>

            {/* Attendance voter lists */}
            <div className="mt-4 space-y-3 bg-secondary/20 rounded-xl p-3 border border-border/20">
              {/* Coming list */}
              <div>
                <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider block">
                  Coming ({comingCount})
                </span>
                {coming.length > 0 ? (
                  <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                    <div className="flex -space-x-1.5 overflow-hidden">
                      {coming.map((p) => (
                        <Avatar key={p.id} className="w-5 h-5 border border-background" title={p.name}>
                          <AvatarImage src={p.avatar} alt={p.name} />
                          <AvatarFallback className="text-[7px]">{p.name[0]}</AvatarFallback>
                        </Avatar>
                      ))}
                    </div>
                    <span className="text-[9px] text-muted-foreground truncate max-w-full">
                      {coming.map(p => p.name).join(", ")}
                    </span>
                  </div>
                ) : (
                  <span className="text-[9px] text-muted-foreground/60 italic block mt-0.5">No responses yet.</span>
                )}
              </div>

              {/* Not sure list */}
              <div>
                <span className="text-[10px] font-bold text-teal-700 uppercase tracking-wider block">
                  Not Sure ({notSureCount})
                </span>
                {notSure.length > 0 ? (
                  <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                    <div className="flex -space-x-1.5 overflow-hidden">
                      {notSure.map((p) => (
                        <Avatar key={p.id} className="w-5 h-5 border border-background" title={p.name}>
                          <AvatarImage src={p.avatar} alt={p.name} />
                          <AvatarFallback className="text-[7px]">{p.name[0]}</AvatarFallback>
                        </Avatar>
                      ))}
                    </div>
                    <span className="text-[9px] text-muted-foreground truncate max-w-full">
                      {notSure.map(p => p.name).join(", ")}
                    </span>
                  </div>
                ) : (
                  <span className="text-[9px] text-muted-foreground/60 italic block mt-0.5">No responses yet.</span>
                )}
              </div>

              {/* Cant list */}
              <div>
                <span className="text-[10px] font-bold text-rose-700 uppercase tracking-wider block">
                  Can't Make It ({cantCount})
                </span>
                {cant.length > 0 ? (
                  <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                    <div className="flex -space-x-1.5 overflow-hidden">
                      {cant.map((p) => (
                        <Avatar key={p.id} className="w-5 h-5 border border-background" title={p.name}>
                          <AvatarImage src={p.avatar} alt={p.name} />
                          <AvatarFallback className="text-[7px]">{p.name[0]}</AvatarFallback>
                        </Avatar>
                      ))}
                    </div>
                    <span className="text-[9px] text-muted-foreground truncate max-w-full">
                      {cant.map(p => p.name).join(", ")}
                    </span>
                  </div>
                ) : (
                  <span className="text-[9px] text-muted-foreground/60 italic block mt-0.5">No responses yet.</span>
                )}
              </div>
            </div>
          </div>

          {/* Optional Poll component */}
          {event.poll && (
            <div className="mt-6 border-t border-dashed border-border/60 pt-5">
              <span className="text-[10px] bg-primary/10 text-primary px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider">
                Family Poll
              </span>
              <h4 className="font-heading text-sm font-semibold text-foreground mt-2 leading-tight">
                {event.poll.question}
              </h4>
              
              <div className="mt-3.5 space-y-2.5">
                {event.poll.options.map((option) => (
                  <div key={option.id} className="space-y-1">
                    <div className="relative w-full h-10 bg-secondary/50 hover:bg-secondary rounded-xl overflow-hidden border border-border/80 transition-colors">
                      {/* Animated progress bar overlay */}
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${option.percentage}%` }}
                        transition={{ duration: 0.5, ease: "easeOut" }}
                        className="absolute left-0 top-0 h-full bg-primary/10"
                      />
                      
                      {/* Interactive click button */}
                      <button
                        onClick={() => pollVoteMutation.mutate(option.id)}
                        disabled={pollVoteMutation.isPending}
                        className="absolute inset-0 px-4 flex items-center justify-between text-xs font-semibold text-foreground focus:outline-none"
                      >
                        <span className="flex items-center gap-1.5 truncate max-w-[70%]">
                          {option.userVoted && <Check className="w-3.5 h-3.5 text-primary shrink-0 stroke-[3]" />}
                          <span className="truncate">{option.text}</span>
                        </span>
                        <span className="text-[10px] text-muted-foreground shrink-0">
                          {option.percentage}% ({option.count})
                        </span>
                      </button>
                    </div>

                    {/* Avatars of members who voted for this option */}
                    {option.votes && option.votes.length > 0 && (
                      <div className="flex items-center gap-1.5 px-2.5 mt-0.5">
                        <div className="flex -space-x-1.5 overflow-hidden">
                          {option.votes.map((voter) => (
                            <Avatar key={voter.id} className="w-4.5 h-4.5 border border-background" title={voter.name}>
                              <AvatarImage src={voter.avatar} alt={voter.name} />
                              <AvatarFallback className="text-[6px]">{voter.name[0]}</AvatarFallback>
                            </Avatar>
                          ))}
                        </div>
                        <span className="text-[9px] text-muted-foreground truncate max-w-full">
                          {option.votes.map(v => v.name).join(", ")}
                        </span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
