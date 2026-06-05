import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/AuthContext";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "@/components/ui/use-toast";
import { Loader2, UserPlus } from "lucide-react";

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
    relationship_type: "CHILD", // Default to Child
  });

  const [emailFormData, setEmailFormData] = useState({
    email: "",
    relationship_type: "PARENT",
  });

  // Keep track of errors
  const [errors, setErrors] = useState({});
  const [emailErrors, setEmailErrors] = useState({});

  // Sync default/preselected anchor when modal opens
  useEffect(() => {
    if (isOpen) {
      // Find default family branch name from current user or preselected anchor
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

      setEmailFormData({
        email: "",
        relationship_type: "PARENT",
      });
      setEmailErrors({});
      setActiveTab("email");
    }
  }, [isOpen, preselectedAnchorId, familyCircle, user]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => {
      const updated = { ...prev, [name]: value };
      if (name === "birth_date" && value && !prev.birth_year) {
        updated.birth_year = new Date(value).getFullYear().toString();
      }
      return updated;
    });
    // Clear error
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const handleCheckboxChange = (checked) => {
    setFormData((prev) => ({
      ...prev,
      is_deceased: checked,
      // Clear death year if unchecking deceased
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

  const validateEmailForm = () => {
    const newErrors = {};
    if (!emailFormData.email.trim()) {
      newErrors.email = "Email address is required";
    } else {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(emailFormData.email.trim())) {
        newErrors.email = "Invalid email format";
      }
    }
    setEmailErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

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
      // Refetch the family circle query to update the tree UI
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

  const handleSubmit = (e) => {
    e.preventDefault();
    if (validate()) {
      addRelativeMutation.mutate(formData);
    }
  };

  const handleEmailSubmit = (e) => {
    e.preventDefault();
    if (validateEmailForm()) {
      connectEmailMutation.mutate({
        email: emailFormData.email.trim(),
        relationship_type: emailFormData.relationship_type,
      });
    }
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
                    max={new Date().toISOString().split('T')[0]}
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
                      {/* Add current user explicitly if they aren't in familyCircle yet or to ensure they are first */}
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
              <Button type="button" variant="outline" onClick={onClose} disabled={addRelativeMutation.isPending}>
                Cancel
              </Button>
              <Button type="submit" disabled={addRelativeMutation.isPending} className="gap-2">
                {addRelativeMutation.isPending && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                Add Connection
              </Button>
            </DialogFooter>
          </form>
        ) : (
          <form onSubmit={handleEmailSubmit} className="space-y-4 py-2">
            <div className="space-y-3">
              <h4 className="text-xs font-semibold text-primary uppercase tracking-wider">Connection Details</h4>
              
              <div className="space-y-1">
                <Label htmlFor="connect_email" className="text-xs font-medium">Relative's Email Address *</Label>
                <Input
                  id="connect_email"
                  name="connect_email"
                  type="email"
                  value={emailFormData.email}
                  onChange={(e) => setEmailFormData(prev => ({ ...prev, email: e.target.value }))}
                  placeholder="e.g. parent@family.com"
                  className={emailErrors.email ? "border-destructive focus-visible:ring-destructive text-sm" : "text-sm"}
                  required
                />
                {emailErrors.email && <p className="text-[10px] text-destructive">{emailErrors.email}</p>}
                <p className="text-[10px] text-muted-foreground leading-normal mt-1">
                  If this user already has a Kinship account, they will receive a request to merge your family trees. If they aren't on Kinship, they'll receive an invitation and their place in your tree will be reserved.
                </p>
              </div>

              <div className="space-y-1">
                <Label htmlFor="connect_relationship_type" className="text-xs font-medium">This person is your...</Label>
                <select
                  id="connect_relationship_type"
                  name="connect_relationship_type"
                  value={emailFormData.relationship_type}
                  onChange={(e) => setEmailFormData(prev => ({ ...prev, relationship_type: e.target.value }))}
                  className="flex h-9 w-full rounded-md border border-input bg-card px-3 py-1.5 text-sm shadow-sm outline-none focus:ring-1 focus:ring-ring"
                >
                  <option value="PARENT">Parent (e.g. Mother, Father)</option>
                  <option value="CHILD">Child (e.g. Son, Daughter)</option>
                  <option value="SPOUSE">Spouse (e.g. Husband, Wife)</option>
                </select>
              </div>
            </div>

            <DialogFooter className="pt-6 flex flex-row gap-2 justify-end sm:space-x-0">
              <Button type="button" variant="outline" onClick={onClose} disabled={connectEmailMutation.isPending}>
                Cancel
              </Button>
              <Button type="submit" disabled={connectEmailMutation.isPending} className="gap-2">
                {connectEmailMutation.isPending && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                Send Connection Request
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
