import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/AuthContext";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { toast } from "@/components/ui/use-toast";
import { UserPlus } from "lucide-react";
import EmailConnectionForm from "./forms/EmailConnectionForm";
import ManualConnectionForm from "./forms/ManualConnectionForm";

export default function AddRelativeModal({ isOpen, onClose, preselectedAnchorId }) {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  // Fetch family circle members to populate the Anchor Person dropdown
  const { data: familyCircle = [], isLoading: isLoadingCircle } = useQuery({
    queryKey: ["familyCircle"],
    queryFn: api.getCircle,
    enabled: isOpen,
  });

  const [activeTab, setActiveTab] = useState("email"); // "email" or "manual"

  // Mutation to create profile and relationship in sequence
  const addRelativeMutation = useMutation({
    mutationFn: async (data) => {
      // 1. Create the Profile
      const profileData = {
        first_name: data.first_name.trim(),
        last_name: data.last_name.trim(),
        email: data.email.trim() || null,
        phone: data.phone.trim() || null,
        location: data.location.trim() || null,
        birth_date: data.birth_date || null,
        birth_year: data.birth_year ? parseInt(data.birth_year, 10) : null,
        is_deceased: data.is_deceased,
        death_year: data.is_deceased && data.death_year ? parseInt(data.death_year, 10) : null,
        family_branch_name: data.family_branch_name.trim() || null,
      };
      
      const newProfile = await api.createProfile(profileData);

      // 2. Create the Relationship linking anchor to the new profile
      const relationshipData = {
        person_id: data.anchor_id,
        relative_id: newProfile.id,
        relationship_type: data.relationship_type, // PARENT, CHILD, SPOUSE
      };

      await api.createRelationship(relationshipData);
      return newProfile;
    },
    onSuccess: (newProfile) => {
      queryClient.invalidateQueries({ queryKey: ["familyCircle"] });
      toast({
        title: "Family connection added! ✨",
        description: `Successfully added ${newProfile.name} to the family tree.`,
      });
      onClose();
    },
    onError: (err) => {
      toast({
        title: "Failed to add connection",
        description: err.message || "An error occurred while creating the connection.",
        variant: "destructive",
      });
    },
  });

  const connectEmailMutation = useMutation({
    mutationFn: async ({ email, relationship_type }) => {
      return await api.connectExistingByEmail(email, relationship_type);
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["familyCircle"] });
      toast({
        title: data.pending ? "Connection request sent! ✉️" : "Invitation sent! ✉️",
        description: data.message,
      });
      onClose();
    },
    onError: (err) => {
      toast({
        title: "Failed to send request",
        description: err.message || "An error occurred while sending the request.",
        variant: "destructive",
      });
    },
  });

  const handleManualSubmit = (formData) => {
    addRelativeMutation.mutate(formData);
  };

  const handleEmailSubmit = ({ email, relationship_type }) => {
    connectEmailMutation.mutate({ email, relationship_type });
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[480px] bg-card border border-border shadow-2xl rounded-2xl overflow-y-auto max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold font-heading text-foreground flex items-center gap-2">
            <UserPlus className="w-5 h-5 text-primary" />
            {activeTab === "manual" ? "Add Family Connection" : "Connect via Email"}
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            {activeTab === "manual"
              ? "Create a profile node for a family member and connect them to an existing relative in your tree."
              : "Link your profile with an existing family member on Kinship by entering their email address."}
          </DialogDescription>
        </DialogHeader>

        {/* Premium segmented control tab bar */}
        <div className="grid grid-cols-2 p-1 bg-secondary/50 backdrop-blur-sm rounded-xl border border-border/50 text-xs mb-2">
          <button
            type="button"
            onClick={() => setActiveTab("email")}
            className={`py-2 px-3 rounded-lg font-medium transition-all duration-200 ${
              activeTab === "email"
                ? "bg-background text-primary shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Connect via Email
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("manual")}
            className={`py-2 px-3 rounded-lg font-medium transition-all duration-200 ${
              activeTab === "manual"
                ? "bg-background text-primary shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Add Family Connection
          </button>
        </div>

        {activeTab === "manual" ? (
          <ManualConnectionForm
            onSubmit={handleManualSubmit}
            isPending={addRelativeMutation.isPending}
            onClose={onClose}
            familyCircle={familyCircle}
            isLoadingCircle={isLoadingCircle}
            preselectedAnchorId={preselectedAnchorId}
            user={user}
          />
        ) : (
          <EmailConnectionForm
            onSubmit={handleEmailSubmit}
            isPending={connectEmailMutation.isPending}
            onClose={onClose}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}
