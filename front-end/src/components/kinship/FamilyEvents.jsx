import React, { useState } from "react";
import { Calendar, Plus, CalendarDays, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { toast } from "@/components/ui/use-toast";
import EventCard from "./EventCard";
import EventModal from "./EventModal";
import { EventsGridSkeleton } from "./SkeletonLoaders";

export default function FamilyEvents() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("upcoming");
  const [searchQuery, setSearchQuery] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState(null);

  // Fetch events
  const { data: events = [], isLoading } = useQuery({
    queryKey: ["events"],
    queryFn: api.getEvents,
  });

  // Create Event Mutation
  const createMutation = useMutation({
    mutationFn: (eventData) => api.createEvent(eventData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["events"] });
      setIsModalOpen(false);
      toast({
        title: "Family event created! 🎉",
        description: "Your new family gathering has been successfully posted.",
      });
    },
    onError: (err) => {
      toast({
        title: "Failed to create event",
        description: err.message,
        variant: "destructive",
      });
    },
  });

  // Edit Event Mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => api.updateEvent(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["events"] });
      setIsModalOpen(false);
      setEditingEvent(null);
      toast({
        title: "Event updated! ✏️",
        description: "The event details have been successfully saved.",
      });
    },
    onError: (err) => {
      toast({
        title: "Failed to update event",
        description: err.message,
        variant: "destructive",
      });
    },
  });

  // Delete Event Mutation
  const deleteMutation = useMutation({
    mutationFn: (id) => api.deleteEvent(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["events"] });
      toast({
        title: "Event deleted 🗑️",
        description: "The event has been removed from the schedule.",
      });
    },
    onError: (err) => {
      toast({
        title: "Failed to delete event",
        description: err.message,
        variant: "destructive",
      });
    },
  });

  const handleCreateOrUpdate = (formData) => {
    if (editingEvent) {
      updateMutation.mutate({ id: editingEvent.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleEditClick = (event) => {
    setEditingEvent(event);
    setIsModalOpen(true);
  };

  const handleDeleteClick = (eventId) => {
    if (confirm("Are you sure you want to delete this event? This will remove all RSVPs and poll votes.")) {
      deleteMutation.mutate(eventId);
    }
  };

  // Categorize events
  const today = new Date();
  const filteredEvents = events.filter((e) => {
    const titleMatch = e.title.toLowerCase().includes(searchQuery.toLowerCase());
    const descMatch = e.description.toLowerCase().includes(searchQuery.toLowerCase());
    const locMatch = e.location ? e.location.toLowerCase().includes(searchQuery.toLowerCase()) : false;
    return titleMatch || descMatch || locMatch;
  });

  const upcomingEvents = filteredEvents.filter((e) => new Date(e.eventDate) >= today);
  const pastEvents = filteredEvents.filter((e) => new Date(e.eventDate) < today);

  // Order upcoming: chronological (earliest first), past: reverse chronological (latest first)
  upcomingEvents.sort((a, b) => new Date(a.eventDate).getTime() - new Date(b.eventDate).getTime());
  pastEvents.sort((a, b) => new Date(b.eventDate).getTime() - new Date(a.eventDate).getTime());

  const currentList = activeTab === "upcoming" ? upcomingEvents : pastEvents;

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header section */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
        <div>
          <h1 className="font-heading text-3xl font-bold text-foreground">Family Gatherings</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Coordinate, schedule, plan dinners, and RSVP for extended family events.
          </p>
        </div>
        <Button
          onClick={() => {
            setEditingEvent(null);
            setIsModalOpen(true);
          }}
          className="rounded-xl flex items-center gap-1.5 shadow-sm self-start md:self-auto bg-primary hover:bg-primary/95 text-primary-foreground"
        >
          <Plus className="w-4 h-4" />
          Create Event
        </Button>
      </div>

      {/* Tabs and Search */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 mb-6 border-b border-border pb-4">
        {/* Toggle buttons */}
        <div className="flex bg-secondary/50 p-1 rounded-xl w-fit border border-border">
          <button
            onClick={() => setActiveTab("upcoming")}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold tracking-wide transition-all ${
              activeTab === "upcoming"
                ? "bg-card text-foreground shadow-sm font-bold"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Calendar className="w-3.5 h-3.5" />
            UPCOMING ({upcomingEvents.length})
          </button>
          <button
            onClick={() => setActiveTab("past")}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold tracking-wide transition-all ${
              activeTab === "past"
                ? "bg-card text-foreground shadow-sm font-bold"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <CalendarDays className="w-3.5 h-3.5" />
            PAST EVENTS ({pastEvents.length})
          </button>
        </div>

        {/* Search input */}
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/60" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search events..."
            className="pl-9 pr-4 py-2 text-xs rounded-xl bg-card border border-border focus-visible:ring-1 focus-visible:ring-primary/30"
          />
        </div>
      </div>

      {/* Main events display */}
      {isLoading ? (
        <EventsGridSkeleton count={4} />
      ) : currentList.length === 0 ? (
        <div className="text-center py-16 bg-card border border-dashed rounded-2xl p-8 flex flex-col items-center justify-center">
          <div className="w-12 h-12 rounded-2xl bg-secondary flex items-center justify-center mb-4">
            <Calendar className="w-6 h-6 text-muted-foreground" />
          </div>
          <h3 className="font-heading text-lg font-semibold text-foreground">No events found</h3>
          <p className="text-xs text-muted-foreground max-w-xs mt-1">
            {searchQuery
              ? "We couldn't find any events matching your search terms."
              : activeTab === "upcoming"
              ? "There are no upcoming family events scheduled. Why not create one?"
              : "No past family events were recorded in your family circle."}
          </p>
          {!searchQuery && activeTab === "upcoming" && (
            <Button
              onClick={() => setIsModalOpen(true)}
              variant="outline"
              className="mt-4 rounded-xl text-xs"
            >
              Add First Event
            </Button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {currentList.map((event) => (
            <EventCard
              key={event.id}
              event={event}
              onEdit={() => handleEditClick(event)}
              onDelete={() => handleDeleteClick(event.id)}
            />
          ))}
        </div>
      )}

      {/* Create / Edit Modal */}
      <EventModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingEvent(null);
        }}
        onSubmit={handleCreateOrUpdate}
        event={editingEvent}
      />
    </div>
  );
}
