import React, { useState, useEffect } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { DialogFooter } from "@/components/ui/dialog";
import { Loader2 } from "lucide-react";

export default function ManualConnectionForm({
  onSubmit,
  isPending,
  onClose,
  familyCircle = [],
  isLoadingCircle,
  preselectedAnchorId,
  user,
}) {
  const [formData, setFormData] = useState({
    first_name: "",
    last_name: "",
    email: "",
    phone: "",
    location: "",
    birth_date: "",
    birth_year: "",
    is_deceased: false,
    death_year: "",
    family_branch_name: "",
    anchor_id: "",
    relationship_type: "CHILD",
  });

  const [errors, setErrors] = useState({});

  useEffect(() => {
    let defaultBranch = user?.branch || "";
    if (preselectedAnchorId && familyCircle.length > 0) {
      const anchor = familyCircle.find((m) => m.id === preselectedAnchorId);
      if (anchor && anchor.branch) {
        defaultBranch = anchor.branch;
      }
    }

    setFormData({
      first_name: "",
      last_name: "",
      email: "",
      phone: "",
      location: "",
      birth_date: "",
      birth_year: "",
      is_deceased: false,
      death_year: "",
      family_branch_name: defaultBranch,
      anchor_id: preselectedAnchorId || user?.id || "",
      relationship_type: "CHILD",
    });
    setErrors({});
  }, [preselectedAnchorId, familyCircle, user]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => {
      const updated = { ...prev, [name]: value };
      if (name === "birth_date" && value && !prev.birth_year) {
        updated.birth_year = new Date(value).getFullYear().toString();
      }
      return updated;
    });
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const handleCheckboxChange = (checked) => {
    setFormData((prev) => ({
      ...prev,
      is_deceased: checked,
      death_year: checked ? prev.death_year : "",
    }));
  };

  const validate = () => {
    const newErrors = {};
    if (!formData.first_name.trim()) newErrors.first_name = "First name is required";
    if (!formData.last_name.trim()) newErrors.last_name = "Last name is required";
    if (!formData.anchor_id) newErrors.anchor_id = "Anchor family member is required";

    if (formData.email.trim()) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.email.trim())) {
        newErrors.email = "Invalid email format";
      }
    }

    const birthYearNum = formData.birth_year ? parseInt(formData.birth_year, 10) : null;
    const deathYearNum = formData.death_year ? parseInt(formData.death_year, 10) : null;

    if (formData.birth_year && (isNaN(birthYearNum) || birthYearNum < 1000 || birthYearNum > new Date().getFullYear())) {
      newErrors.birth_year = "Please enter a valid 4-digit birth year";
    }

    if (formData.is_deceased && formData.death_year) {
      if (isNaN(deathYearNum) || deathYearNum < 1000 || deathYearNum > new Date().getFullYear()) {
        newErrors.death_year = "Please enter a valid 4-digit death year";
      } else if (birthYearNum && deathYearNum < birthYearNum) {
        newErrors.death_year = "Death year cannot be before birth year";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (validate()) {
      onSubmit(formData);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 py-2">
      {/* Section: Personal Info */}
      <div className="space-y-3">
        <h4 className="text-xs font-semibold text-primary uppercase tracking-wider">Personal Details</h4>
        
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <Label htmlFor="first_name" className="text-xs font-medium">First Name *</Label>
            <Input
              id="first_name"
              name="first_name"
              value={formData.first_name}
              onChange={handleChange}
              placeholder="e.g. Robert"
              className={errors.first_name ? "border-destructive focus-visible:ring-destructive text-sm" : "text-sm"}
            />
            {errors.first_name && <p className="text-[10px] text-destructive">{errors.first_name}</p>}
          </div>

          <div className="space-y-1">
            <Label htmlFor="last_name" className="text-xs font-medium">Last Name *</Label>
            <Input
              id="last_name"
              name="last_name"
              value={formData.last_name}
              onChange={handleChange}
              placeholder="e.g. Mitchell"
              className={errors.last_name ? "border-destructive focus-visible:ring-destructive text-sm" : "text-sm"}
            />
            {errors.last_name && <p className="text-[10px] text-destructive">{errors.last_name}</p>}
          </div>
        </div>

        <div className="space-y-1">
          <Label htmlFor="email" className="text-xs font-medium">
            Email Address <span className="text-muted-foreground font-normal">(Optional)</span>
          </Label>
          <Input
            id="email"
            name="email"
            type="email"
            value={formData.email}
            onChange={handleChange}
            placeholder="For future account registration and tree fusion"
            className={errors.email ? "border-destructive focus-visible:ring-destructive text-sm" : "text-sm"}
          />
          {errors.email && <p className="text-[10px] text-destructive">{errors.email}</p>}
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <Label htmlFor="phone" className="text-xs font-medium">Phone <span className="text-muted-foreground font-normal">(Optional)</span></Label>
            <Input
              id="phone"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              placeholder="+1 (555) 019-2834"
              className="text-sm"
            />
          </div>

          <div className="space-y-1">
            <Label htmlFor="location" className="text-xs font-medium">Location <span className="text-muted-foreground font-normal">(Optional)</span></Label>
            <Input
              id="location"
              name="location"
              value={formData.location}
              onChange={handleChange}
              placeholder="e.g. Boston, MA"
              className="text-sm"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <Label htmlFor="birth_date" className="text-xs font-medium">Birth Date <span className="text-muted-foreground font-normal">(Optional)</span></Label>
            <Input
              id="birth_date"
              name="birth_date"
              type="date"
              max={new Date().toISOString().split("T")[0]}
              value={formData.birth_date}
              onChange={handleChange}
              className="text-sm"
            />
          </div>

          <div className="space-y-1">
            <Label htmlFor="birth_year" className="text-xs font-medium">Birth Year <span className="text-muted-foreground font-normal">(Optional)</span></Label>
            <Input
              id="birth_year"
              name="birth_year"
              type="number"
              value={formData.birth_year}
              onChange={handleChange}
              placeholder="YYYY"
              className={errors.birth_year ? "border-destructive focus-visible:ring-destructive text-sm" : "text-sm"}
            />
            {errors.birth_year && <p className="text-[10px] text-destructive">{errors.birth_year}</p>}
          </div>
        </div>

        <div className="space-y-1">
          <Label htmlFor="family_branch_name" className="text-xs font-medium">Family Branch <span className="text-muted-foreground font-normal">(Optional)</span></Label>
          <Input
            id="family_branch_name"
            name="family_branch_name"
            value={formData.family_branch_name}
            onChange={handleChange}
            placeholder="e.g. Mitchell Circle"
            className="text-sm"
          />
        </div>

        <div className="space-y-3 pt-1">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="is_deceased"
              checked={formData.is_deceased}
              onCheckedChange={handleCheckboxChange}
            />
            <Label htmlFor="is_deceased" className="text-xs font-medium cursor-pointer">
              This family member is deceased 🕊️
            </Label>
          </div>

          {formData.is_deceased && (
            <div className="space-y-1 max-w-[200px] animate-in fade-in duration-200">
              <Label htmlFor="death_year" className="text-xs font-medium">Death Year</Label>
              <Input
                id="death_year"
                name="death_year"
                type="number"
                value={formData.death_year}
                onChange={handleChange}
                placeholder="YYYY"
                className={errors.death_year ? "border-destructive focus-visible:ring-destructive text-sm" : "text-sm"}
              />
              {errors.death_year && <p className="text-[10px] text-destructive">{errors.death_year}</p>}
            </div>
          )}
        </div>
      </div>

      <div className="border-t border-border my-2" />

      {/* Section: Relationship Links */}
      <div className="space-y-3">
        <h4 className="text-xs font-semibold text-primary uppercase tracking-wider">Relationship Connection</h4>

        <div className="space-y-2.5">
          <div className="space-y-1">
            <Label htmlFor="relationship_type" className="text-xs font-medium">This person is the...</Label>
            <select
              id="relationship_type"
              name="relationship_type"
              value={formData.relationship_type}
              onChange={handleChange}
              className="flex h-9 w-full rounded-md border border-input bg-card px-3 py-1.5 text-sm shadow-sm outline-none focus:ring-1 focus:ring-ring"
            >
              <option value="CHILD">Child</option>
              <option value="PARENT">Parent</option>
              <option value="SPOUSE">Spouse</option>
            </select>
          </div>

          <div className="space-y-1">
            <Label htmlFor="anchor_id" className="text-xs font-medium">...of existing family member:</Label>
            {isLoadingCircle ? (
              <div className="flex items-center gap-2 h-9 text-xs text-muted-foreground bg-secondary/50 rounded-md px-3 border border-input">
                <Loader2 className="w-3 h-3 animate-spin" /> Loading family circle...
              </div>
            ) : (
              <select
                id="anchor_id"
                name="anchor_id"
                value={formData.anchor_id}
                onChange={handleChange}
                className={`flex h-9 w-full rounded-md border bg-card px-3 py-1.5 text-sm shadow-sm outline-none focus:ring-1 focus:ring-ring ${
                  errors.anchor_id ? "border-destructive focus:ring-destructive" : "border-input"
                }`}
              >
                <option value="" disabled>-- Select relative --</option>
                {user && !familyCircle.some(m => m.id === user.id) && (
                  <option value={user.id}>{user.name} (You)</option>
                )}
                {familyCircle.map((member) => (
                  <option key={member.id} value={member.id}>
                    {member.name} {member.id === user?.id ? "(You)" : `(${member.relation || "Relative"})`}
                  </option>
                ))}
              </select>
            )}
            {errors.anchor_id && <p className="text-[10px] text-destructive">{errors.anchor_id}</p>}
          </div>
        </div>
      </div>

      <DialogFooter className="pt-4 flex flex-row gap-2 justify-end sm:space-x-0">
        <Button type="button" variant="outline" onClick={onClose} disabled={isPending}>
          Cancel
        </Button>
        <Button type="submit" disabled={isPending} className="gap-2">
          {isPending && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
          Add Connection
        </Button>
      </DialogFooter>
    </form>
  );
}
