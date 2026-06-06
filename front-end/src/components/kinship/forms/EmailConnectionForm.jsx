import React, { useState } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { DialogFooter } from "@/components/ui/dialog";
import { Loader2 } from "lucide-react";

export default function EmailConnectionForm({ onSubmit, isPending, onClose }) {
  const [email, setEmail] = useState("");
  const [relationshipType, setRelationshipType] = useState("PARENT");
  const [errors, setErrors] = useState({});

  const validate = () => {
    const newErrors = {};
    if (!email.trim()) {
      newErrors.email = "Email address is required";
    } else {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email.trim())) {
        newErrors.email = "Invalid email format";
      }
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (validate()) {
      onSubmit({ email: email.trim(), relationship_type: relationshipType });
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 py-2">
      <div className="space-y-3">
        <h4 className="text-xs font-semibold text-primary uppercase tracking-wider">Connection Details</h4>
        
        <div className="space-y-1">
          <Label htmlFor="connect_email" className="text-xs font-medium">Relative's Email Address *</Label>
          <Input
            id="connect_email"
            name="connect_email"
            type="email"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              if (errors.email) setErrors((prev) => ({ ...prev, email: "" }));
            }}
            placeholder="e.g. parent@family.com"
            className={errors.email ? "border-destructive focus-visible:ring-destructive text-sm" : "text-sm"}
            required
          />
          {errors.email && <p className="text-[10px] text-destructive">{errors.email}</p>}
          <p className="text-[10px] text-muted-foreground leading-normal mt-1">
            If this user already has a Kinship account, they will receive a request to merge your family trees. If they aren't on Kinship, they'll receive an invitation and their place in your tree will be reserved.
          </p>
        </div>

        <div className="space-y-1">
          <Label htmlFor="connect_relationship_type" className="text-xs font-medium">This person is your...</Label>
          <select
            id="connect_relationship_type"
            name="connect_relationship_type"
            value={relationshipType}
            onChange={(e) => setRelationshipType(e.target.value)}
            className="flex h-9 w-full rounded-md border border-input bg-card px-3 py-1.5 text-sm shadow-sm outline-none focus:ring-1 focus:ring-ring"
          >
            <option value="PARENT">Parent (e.g. Mother, Father)</option>
            <option value="CHILD">Child (e.g. Son, Daughter)</option>
            <option value="SPOUSE">Spouse (e.g. Husband, Wife)</option>
          </select>
        </div>
      </div>

      <DialogFooter className="pt-6 flex flex-row gap-2 justify-end sm:space-x-0">
        <Button type="button" variant="outline" onClick={onClose} disabled={isPending}>
          Cancel
        </Button>
        <Button type="submit" disabled={isPending} className="gap-2">
          {isPending && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
          Send Connection Request
        </Button>
      </DialogFooter>
    </form>
  );
}
