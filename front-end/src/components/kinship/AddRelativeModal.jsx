import React from "react";
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
import { UserPlus, Info } from "lucide-react";
import ManualConnectionForm from "./forms/ManualConnectionForm";

export default function AddRelativeModal({ isOpen, onClose, preselectedAnchorId }) {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const { data: familyCircle = [], isLoading: isLoadingCircle } = useQuery({
    queryKey: ["familyCircle"],
    queryFn: api.getCircle,
    enabled: isOpen,
  });

  const addRelativeMutation = useMutation({
    mutationFn: async (data) => {
      const profileData = {
        first_name: data.first_name.trim(),
        last_name: data.last_name.trim(),
        email: data.email.trim() || null,
        phone: data.phone.trim() || null,
        location: data.location.trim() || null,
        birth_date: data.birth_date || null,
        birth_year: data.birth_year ? parseInt(data.birth_year, 10) : null,
        hebrew_birth_date: data.hebrew_birth_date || null,
        is_deceased: data.is_deceased,
        death_date: data.is_deceased && data.death_date ? data.death_date : null,
        death_year: data.is_deceased && data.death_year ? parseInt(data.death_year, 10) : null,
        hebrew_death_date: data.is_deceased && data.hebrew_death_date ? data.hebrew_death_date : null,
        burial_place: data.is_deceased && data.burial_place ? data.burial_place.trim() : null,
        family_branch_name: data.family_branch_name.trim() || null,
        avatar_url: data.avatar_url || null,
      };

      const newProfile = await api.createProfile(profileData);

      const relationshipData = {
        person_id: data.anchor_id,
        relative_id: newProfile.id,
        relationship_type: data.relationship_type,
      };

      await api.createRelationship(relationshipData);
      return newProfile;
    },
    onSuccess: (newProfile) => {
      queryClient.invalidateQueries({ queryKey: ["familyCircle"] });
      toast({
        title: "בן משפחה נוסף! 🌿",
        description: `${newProfile.name} נוסף לעץ המשפחה שלך.`,
      });
      onClose();
    },
    onError: (err) => {
      toast({
        title: "לא ניתן היה להוסיף את בן המשפחה",
        description: err.message || "אירעה שגיאה. אנא נסה שנית.",
        variant: "destructive",
      });
    },
  });

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent dir="rtl" className="sm:max-w-[500px] bg-card border border-border shadow-2xl rounded-2xl overflow-y-auto max-h-[90vh]">
        <DialogHeader className="pb-1">
          <DialogTitle className="text-xl font-semibold font-heading text-foreground flex items-center gap-2">
            <UserPlus className="w-5 h-5 text-primary shrink-0" />
            הוספת בן משפחה
          </DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground leading-relaxed">
            יצירת פרופיל לאחד מבני המשפחה ומיקומו בעץ המשפחה.
          </DialogDescription>
        </DialogHeader>

        {/* Context banner */}
        <div className="flex items-start gap-3 rounded-xl border border-primary/20 bg-primary/5 px-4 py-3">
          <Info className="w-4 h-4 text-primary shrink-0 mt-0.5" />
          <p className="text-xs text-muted-foreground leading-relaxed">
            זהו אזור המיועד לבני משפחה{" "}
            <span className="font-semibold text-foreground">שאינם מתכוונים להצטרף לאפליקציה</span> —
            כגון סבים וסבתות, קרובים שנפטרו, או כל מי שרוצים לזכור בעץ.
            לא תישלח הזמנה כלשהי.
          </p>
        </div>

        <ManualConnectionForm
          onSubmit={(formData) => addRelativeMutation.mutate(formData)}
          isPending={addRelativeMutation.isPending}
          onClose={onClose}
          familyCircle={familyCircle}
          isLoadingCircle={isLoadingCircle}
          preselectedAnchorId={preselectedAnchorId}
          user={user}
        />
      </DialogContent>
    </Dialog>
  );
}
