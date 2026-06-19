import React, { useState, useEffect, useRef } from "react";
import { useAuth } from "@/lib/AuthContext";
import { api } from "@/lib/api";
import { useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowUp, ArrowDown, ArrowLeftRight, Check, X, Clipboard, Send, Loader2, TreePine, CalendarDays, Archive, Trash2 } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/components/ui/use-toast";

const features = [
  {
    icon: TreePine,
    title: "Tree Explorer",
    desc: "Visualize your family connections in an interactive, living tree.",
    bg: "bg-teal-500/10 border-teal-500/20 text-slate-100",
    text: "text-slate-100",
    tab: "tree",
  },
  {
    icon: Archive,
    title: "Heritage Vault",
    desc: "Store and share precious family photos, documents, and stories.",
    bg: "bg-amber-500/10 border-amber-500/20 text-slate-100",
    text: "text-slate-100",
    tab: "vault",
  },
  {
    icon: CalendarDays,
    title: "Family Events",
    desc: "Never miss a birthday, reunion, or milestone again.",
    bg: "bg-blue-500/10 border-blue-500/20 text-slate-100",
    text: "text-slate-100",
    tab: "events",
  },
];

export default function SparkOnboardingCanvas({ familyCircle }) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  
  // Step state: 'axis' or 'handoff'
  const [step, setStep] = useState("axis");
  const [editingAxis, setEditingAxis] = useState(null); // 'UP' | 'SIDE' | 'DOWN'
  const [subType, setSubType] = useState(null); // 'SPOUSE' | 'SIBLING' for SIDE axis
  const [isSaving, setIsSaving] = useState(false);
  const [deleteNodeId, setDeleteNodeId] = useState(null);
  const [deleteNodeName, setDeleteNodeName] = useState(null);
  const [deleteNodeRelation, setDeleteNodeRelation] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Form inputs
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const firstNameInputRef = useRef(null);

  // Local state to hold temporary nodes for instant rendering
  const [localNodes, setLocalNodes] = useState([]);

  // Load existing family circle nodes into local rendering state (excluding user themselves)
  useEffect(() => {
    if (familyCircle) {
      const initialNodes = familyCircle
        .filter((m) => m.id !== user?.id)
        .map((m) => ({
          id: m.id,
          name: m.name,
          relation: m.relation,
          generation: m.generation,
          email: m.email || "",
          phone: m.phone || "",
          isActive: m.isActive,
          isDeceased: m.isDeceased || false,
        }));
      setLocalNodes(initialNodes);
    }
  }, [familyCircle, user]);

  // Set default last name based on user's last name
  const userLastName = user?.name ? user.name.split(" ").slice(1).join(" ") : "";

  // Auto-focus first name field when editing starts
  useEffect(() => {
    if (editingAxis && firstNameInputRef.current) {
      firstNameInputRef.current.focus();
    }
  }, [editingAxis, subType]);

  const handleStartAdd = (axis) => {
    setEditingAxis(axis);
    setFirstName("");
    setLastName(userLastName);
    setEmail("");
    setPhone("");
    if (axis === "SIDE") {
      setSubType(null); // Will ask first
    } else {
      setSubType(axis === "UP" ? "PARENT" : "CHILD");
    }
  };

  const handleCancel = () => {
    setEditingAxis(null);
    setSubType(null);
  };

  const handleSave = async (e) => {
    if (e) e.preventDefault();
    if (!firstName.trim()) {
      toast({
        title: "Name required",
        description: "Please enter at least a first name.",
        variant: "destructive",
      });
      return;
    }

    setIsSaving(true);
    try {
      const trimmedFirstName = firstName.trim();
      const trimmedLastName = lastName.trim() || userLastName;
      const targetEmail = email.trim() || null;
      const targetPhone = phone.trim() || null;
      const relationshipType = subType; // 'PARENT' | 'CHILD' | 'SPOUSE' | 'SIBLING'

      // Check if sibling relationship
      if (relationshipType === "SIBLING") {
        // Find existing parent nodes
        const parents = familyCircle.filter((m) => m.relation === "Parent" || m.generation === "parents");
        
        let parentId;
        if (parents.length > 0) {
          parentId = parents[0].id;
        } else {
          // 1. Create a parent placeholder node
          const placeholderParent = await api.createProfile({
            first_name: "Parent of",
            last_name: trimmedLastName,
            email: null,
            phone: null,
            is_deceased: false,
            family_branch_name: user?.branch || "Family",
          });
          
          // 2. Link creator as child of this placeholder parent
          await api.createRelationship({
            person_id: placeholderParent.id,
            relative_id: user?.id,
            relationship_type: "CHILD",
          });
          
          parentId = placeholderParent.id;
        }

        // 3. Create Sibling profile
        const siblingProfile = await api.createProfile({
          first_name: trimmedFirstName,
          last_name: trimmedLastName,
          email: targetEmail,
          phone: targetPhone,
          is_deceased: false,
          family_branch_name: user?.branch || "Family",
        });

        // 4. Link Sibling as child of parent placeholder
        await api.createRelationship({
          person_id: parentId,
          relative_id: siblingProfile.id,
          relationship_type: "CHILD",
        });

        // Add to local state for optimistic rendering
        setLocalNodes((prev) => [
          ...prev,
          {
            id: siblingProfile.id,
            name: `${trimmedFirstName} ${trimmedLastName}`,
            relation: "Sibling",
            generation: "siblings",
            email: targetEmail || "",
            phone: targetPhone || "",
            isActive: false,
            isDeceased: false,
          },
        ]);
      } else {
        // Normal direct relationships (PARENT, CHILD, SPOUSE)
        // 1. Create Profile
        const newProfile = await api.createProfile({
          first_name: trimmedFirstName,
          last_name: trimmedLastName,
          email: targetEmail,
          phone: targetPhone,
          is_deceased: false,
          family_branch_name: user?.branch || "Family",
        });

        // 2. Create Relationship
        await api.createRelationship({
          person_id: user?.id,
          relative_id: newProfile.id,
          relationship_type: relationshipType,
        });

        // Add to local state for optimistic rendering
        let relLabel = "Relative";
        let genLabel = "siblings";
        if (relationshipType === "PARENT") {
          relLabel = "Parent";
          genLabel = "parents";
        } else if (relationshipType === "CHILD") {
          relLabel = "Child";
          genLabel = "children";
        } else if (relationshipType === "SPOUSE") {
          relLabel = "Spouse";
          genLabel = "siblings";
        }

        setLocalNodes((prev) => [
          ...prev,
          {
            id: newProfile.id,
            name: `${trimmedFirstName} ${trimmedLastName}`,
            relation: relLabel,
            generation: genLabel,
            email: targetEmail || "",
            phone: targetPhone || "",
            isActive: false,
            isDeceased: false,
          },
        ]);
      }

      // Invalidate queries to sync with DB
      queryClient.invalidateQueries({ queryKey: ["familyCircle"] });
      
      toast({
        title: "Added successfully! ✨",
        description: `Added ${trimmedFirstName} to your tree circle.`,
      });

      // Clear states
      setEditingAxis(null);
      setSubType(null);
    } catch (err) {
      console.error(err);
      toast({
        title: "Error adding relative",
        description: err.message || "Something went wrong.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeletePerson = (personId, name, relation) => {
    setDeleteNodeId(personId);
    setDeleteNodeName(name);
    setDeleteNodeRelation(relation);
  };

  const confirmDeletePerson = async () => {
    if (!deleteNodeId) return;
    setIsDeleting(true);
    try {
      await api.deleteProfile(deleteNodeId);
      setLocalNodes((prev) => prev.filter((n) => n.id !== deleteNodeId));
      queryClient.invalidateQueries({ queryKey: ["familyCircle"] });
      toast({
        title: "הוסר בהצלחה! 🗑️",
        description: `הסרת את ${deleteNodeName} מעץ המשפחה.`,
      });
      setDeleteNodeId(null);
      setDeleteNodeName(null);
      setDeleteNodeRelation(null);
    } catch (err) {
      console.error(err);
      toast({
        title: "שגיאה בהסרת אדם",
        description: err.message || "משהו השתבש.",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const handleFinishOnboarding = () => {
    localStorage.setItem(`kinship_spark_completed_${user?.id}`, "true");
    queryClient.invalidateQueries({ queryKey: ["familyCircle"] });
    window.location.reload(); // Refresh to load standard TreeExplorer
  };

  // Group local rendering nodes
  const parentsNodes = localNodes.filter((n) => n.relation === "Parent");
  const childrenNodes = localNodes.filter((n) => n.relation === "Child");
  const siblingsNodes = localNodes.filter((n) => n.relation === "Sibling");
  const spouseNodes = localNodes.filter((n) => n.relation === "Spouse");



  return (
    <div className="relative min-h-[75vh] w-full overflow-hidden flex flex-col items-center justify-between py-6 px-4 bg-gradient-to-b from-slate-900 via-slate-950 to-slate-900 text-slate-100 rounded-3xl border border-slate-800 shadow-2xl">
      
      {/* Background radial accent */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-teal-500/10 via-transparent to-transparent pointer-events-none" />

      {/* Top Header info */}
      <div className="text-center z-10 max-w-lg mb-4">
        <h3 className="font-heading text-2xl font-bold text-teal-400 tracking-tight">Plant Your Family Tree</h3>
        <p className="text-xs text-slate-400 mt-1 leading-relaxed">
          Start by mapping your immediate first closeness circle. Distant relatives are simplified to keep your setup quick and effortless.
        </p>
      </div>

      {/* Visual Canvas Board */}
      <div 
        className={`w-full max-w-3xl flex-1 flex flex-col justify-center items-center relative py-6 transition-all duration-500 ease-in-out origin-center scale-[0.72] min-[400px]:scale-[0.82] min-[520px]:scale-90 sm:scale-100 ${
          step === "handoff" ? "scale-[0.6] sm:scale-90 opacity-40 pointer-events-none" : ""
        }`}
      >
        {/* ROW 1: PARENTS (UP) */}
        <div className="flex flex-col items-center min-h-[90px] justify-end pb-3 w-full">
          <AnimatePresence>
            {parentsNodes.length > 0 ? (
              <div className="flex gap-4 items-center">
                {parentsNodes.map((p) => (
                  <motion.div
                    key={p.id}
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="flex flex-col items-center p-3 rounded-2xl bg-slate-800/80 border border-slate-700 w-28 text-center relative group"
                  >
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeletePerson(p.id, p.name, p.relation);
                      }}
                      className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-slate-900 border border-slate-700 text-slate-400 hover:text-rose-400 hover:border-rose-500/50 flex items-center justify-center transition-all opacity-0 group-hover:opacity-100 shadow-md z-10"
                      title="מחק"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                    <Avatar className="w-10 h-10 ring-1 ring-slate-700">
                      <AvatarFallback className="bg-slate-700 text-teal-400 text-sm font-semibold">{p.name[0]}</AvatarFallback>
                    </Avatar>
                    <span className="text-xs font-semibold text-slate-200 mt-1.5 truncate max-w-[90px]">{p.name.split(" ")[0]}</span>
                    <span className="text-[9px] text-slate-400">{p.relation}</span>
                  </motion.div>
                ))}
                {parentsNodes.length < 2 && editingAxis !== "UP" && (
                  <button
                    onClick={() => handleStartAdd("UP")}
                    className="flex flex-col items-center justify-center p-3 rounded-2xl border-2 border-dashed border-slate-800 hover:border-teal-500/50 bg-slate-900/40 hover:bg-slate-800/20 w-28 h-[104px] text-center transition-all group"
                  >
                    <div className="w-8 h-8 rounded-full border border-dashed border-slate-700 group-hover:border-teal-500 flex items-center justify-center text-slate-500 group-hover:text-teal-400 transition-all">
                      <ArrowUp className="w-4 h-4 animate-pulse" />
                    </div>
                    <span className="text-[10px] font-semibold text-slate-500 group-hover:text-teal-400 mt-2">Add Parent</span>
                  </button>
                )}
              </div>
            ) : (
              editingAxis !== "UP" && (
                <button
                  onClick={() => handleStartAdd("UP")}
                  className="flex flex-col items-center gap-1 group transition-all"
                >
                  <div className="w-10 h-10 rounded-full border-2 border-dashed border-slate-700 group-hover:border-teal-500 flex items-center justify-center text-slate-500 group-hover:text-teal-400 group-hover:scale-105 transition-all">
                    <ArrowUp className="w-5 h-5 animate-pulse" />
                  </div>
                  <span className="text-[10px] font-semibold text-slate-500 group-hover:text-teal-400">Add Parents</span>
                </button>
              )
            )}
          </AnimatePresence>

          {/* Inline Form for UP Axis */}
          {editingAxis === "UP" && (
            <motion.div 
              initial={{ opacity: 0, y: -10 }} 
              animate={{ opacity: 1, y: 0 }}
              className="bg-slate-800 border border-teal-500/30 p-4 rounded-2xl shadow-xl w-64 text-left z-20"
            >
              <form onSubmit={handleSave} className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold text-teal-400">Add Mother or Father</span>
                  <button type="button" onClick={handleCancel} className="text-slate-400 hover:text-slate-100">
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <div className="space-y-2">
                  <div>
                    <Label htmlFor="p_first" className="text-[10px] font-semibold text-slate-400">First Name</Label>
                    <Input
                      id="p_first"
                      ref={firstNameInputRef}
                      placeholder="e.g. John"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      className="h-8 bg-slate-900 border-slate-700 text-xs rounded-lg focus:border-teal-500"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="p_last" className="text-[10px] font-semibold text-slate-400">Last Name</Label>
                    <Input
                      id="p_last"
                      placeholder="e.g. Doe"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      className="h-8 bg-slate-900 border-slate-700 text-xs rounded-lg focus:border-teal-500"
                    />
                  </div>
                  <div>
                    <Label htmlFor="p_email" className="text-[10px] font-semibold text-slate-400">Email (Optional)</Label>
                    <Input
                      id="p_email"
                      type="email"
                      placeholder="e.g. father@family.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="h-8 bg-slate-900 border-slate-700 text-xs rounded-lg focus:border-teal-500"
                    />
                  </div>
                  <div>
                    <Label htmlFor="p_phone" className="text-[10px] font-semibold text-slate-400">Phone (Optional)</Label>
                    <Input
                      id="p_phone"
                      type="tel"
                      placeholder="e.g. +1 555-1234"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="h-8 bg-slate-900 border-slate-700 text-xs rounded-lg focus:border-teal-500"
                    />
                  </div>
                </div>
                <div className="flex gap-2 justify-end pt-1">
                  <Button type="button" size="sm" variant="ghost" onClick={handleCancel} className="h-7 text-xs text-slate-400">
                    Cancel
                  </Button>
                  <Button type="submit" size="sm" disabled={isSaving} className="h-7 text-xs bg-teal-600 hover:bg-teal-700 text-white font-semibold">
                    {isSaving ? <Loader2 className="w-3 h-3 animate-spin" /> : <Check className="w-3.5 h-3.5 mr-1" />}
                    Save
                  </Button>
                </div>
              </form>
            </motion.div>
          )}
        </div>

        {/* Central Connecting Lines (SVG drawing connection from Parents to Creator) */}
        <div className="h-6 w-0.5 bg-slate-800" />

        {/* ROW 2: SIBLINGS / SPOUSE (SIDE) + CREATOR (CENTER) */}
        <div className="flex items-center justify-center gap-4 min-h-[90px] w-full z-10">
          
          {/* Left Side: Siblings */}
          <div className="flex items-center gap-3 justify-end flex-1 max-w-[280px]">
            <AnimatePresence>
              {siblingsNodes.map((s) => (
                <motion.div
                  key={s.id}
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="flex flex-col items-center p-3 rounded-2xl bg-slate-800/80 border border-slate-700 w-28 text-center relative group"
                >
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeletePerson(s.id, s.name, s.relation);
                    }}
                    className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-slate-900 border border-slate-700 text-slate-400 hover:text-rose-400 hover:border-rose-500/50 flex items-center justify-center transition-all opacity-0 group-hover:opacity-100 shadow-md z-10"
                    title="מחק"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                  <Avatar className="w-10 h-10 ring-1 ring-slate-700">
                    <AvatarFallback className="bg-slate-700 text-teal-400 text-sm font-semibold">{s.name[0]}</AvatarFallback>
                  </Avatar>
                  <span className="text-xs font-semibold text-slate-200 mt-1.5 truncate max-w-[90px]">{s.name.split(" ")[0]}</span>
                  <span className="text-[9px] text-slate-400">{s.relation}</span>
                </motion.div>
              ))}
            </AnimatePresence>
            
            {editingAxis !== "SIDE" && (
              <button
                onClick={() => handleStartAdd("SIDE")}
                className="w-10 h-10 rounded-full border-2 border-dashed border-slate-700 hover:border-teal-500 flex items-center justify-center text-slate-500 hover:text-teal-400 hover:scale-105 transition-all"
                title="Add Sibling or Spouse"
              >
                <ArrowLeftRight className="w-5 h-5 animate-pulse" />
              </button>
            )}
          </div>

          {/* Inline Form Segmented Choice for SIDE Axis */}
          {editingAxis === "SIDE" && !subType && (
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }} 
              animate={{ scale: 1, opacity: 1 }}
              className="bg-slate-800 border border-teal-500/30 p-4 rounded-2xl shadow-xl w-60 text-center space-y-3 z-20"
            >
              <h4 className="text-xs font-bold text-teal-400">Add to your horizontal axis</h4>
              <div className="flex flex-col gap-2">
                <Button 
                  onClick={() => setSubType("SPOUSE")}
                  className="w-full bg-slate-900 border border-slate-700 hover:bg-slate-800 text-slate-200 text-xs font-semibold py-2"
                >
                  Add Spouse / Partner
                </Button>
                <Button 
                  onClick={() => setSubType("SIBLING")}
                  className="w-full bg-slate-900 border border-slate-700 hover:bg-slate-800 text-slate-200 text-xs font-semibold py-2"
                >
                  Add Brother / Sister
                </Button>
              </div>
              <Button onClick={handleCancel} variant="ghost" className="text-slate-400 hover:text-slate-200 text-xs h-8">
                Cancel
              </Button>
            </motion.div>
          )}

          {/* Form for SIDE Axis relative */}
          {editingAxis === "SIDE" && subType && (
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }}
              className="bg-slate-800 border border-teal-500/30 p-4 rounded-2xl shadow-xl w-64 text-left z-20"
            >
              <form onSubmit={handleSave} className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold text-teal-400">
                    Add {subType === "SPOUSE" ? "Spouse" : "Sibling"}
                  </span>
                  <button type="button" onClick={handleCancel} className="text-slate-400 hover:text-slate-100">
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <div className="space-y-2">
                  <div>
                    <Label htmlFor="s_first" className="text-[10px] font-semibold text-slate-400">First Name</Label>
                    <Input
                      id="s_first"
                      ref={firstNameInputRef}
                      placeholder="e.g. Marie"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      className="h-8 bg-slate-900 border-slate-700 text-xs rounded-lg focus:border-teal-500"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="s_last" className="text-[10px] font-semibold text-slate-400">Last Name</Label>
                    <Input
                      id="s_last"
                      placeholder="e.g. Doe"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      className="h-8 bg-slate-900 border-slate-700 text-xs rounded-lg focus:border-teal-500"
                    />
                  </div>
                  <div>
                    <Label htmlFor="s_email" className="text-[10px] font-semibold text-slate-400">Email (Optional)</Label>
                    <Input
                      id="s_email"
                      type="email"
                      placeholder="e.g. relative@family.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="h-8 bg-slate-900 border-slate-700 text-xs rounded-lg focus:border-teal-500"
                    />
                  </div>
                  <div>
                    <Label htmlFor="s_phone" className="text-[10px] font-semibold text-slate-400">Phone (Optional)</Label>
                    <Input
                      id="s_phone"
                      type="tel"
                      placeholder="e.g. +1 555-1234"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="h-8 bg-slate-900 border-slate-700 text-xs rounded-lg focus:border-teal-500"
                    />
                  </div>
                </div>
                <div className="flex gap-2 justify-end pt-1">
                  <Button type="button" size="sm" variant="ghost" onClick={handleCancel} className="h-7 text-xs text-slate-400">
                    Cancel
                  </Button>
                  <Button type="submit" size="sm" disabled={isSaving} className="h-7 text-xs bg-teal-600 hover:bg-teal-700 text-white font-semibold">
                    {isSaving ? <Loader2 className="w-3 h-3 animate-spin" /> : <Check className="w-3.5 h-3.5 mr-1" />}
                    Save
                  </Button>
                </div>
              </form>
            </motion.div>
          )}

          {/* Center Node: The Creator */}
          <div className="flex flex-col items-center justify-center p-4 rounded-3xl bg-teal-950/40 border-2 border-teal-500/60 shadow-lg shadow-teal-500/10 ring-4 ring-teal-500/10 w-36 text-center scale-105 z-10">
            <div className="relative">
              <Avatar className="w-14 h-14 ring-2 ring-teal-400">
                <AvatarImage src={user?.avatar} />
                <AvatarFallback className="bg-teal-900 text-teal-300 font-heading text-lg">
                  {user?.name ? user.name[0] : "Y"}
                </AvatarFallback>
              </Avatar>
              <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-teal-500 border border-slate-900 flex items-center justify-center text-[10px] font-bold text-slate-900">
                👑
              </div>
            </div>
            <span className="text-sm font-bold text-teal-300 mt-2 truncate max-w-[120px]">{user?.name ? user.name.split(" ")[0] : "You"}</span>
            <span className="text-[10px] text-teal-400 font-medium">Root Creator</span>
          </div>

          {/* Right Side: Spouse */}
          <div className="flex items-center gap-3 justify-start flex-1 max-w-[280px]">
            <AnimatePresence>
              {spouseNodes.map((sp) => (
                <motion.div
                  key={sp.id}
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="flex flex-col items-center p-3 rounded-2xl bg-slate-800/80 border border-slate-700 w-28 text-center relative group"
                >
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeletePerson(sp.id, sp.name, sp.relation);
                    }}
                    className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-slate-900 border border-slate-700 text-slate-400 hover:text-rose-400 hover:border-rose-500/50 flex items-center justify-center transition-all opacity-0 group-hover:opacity-100 shadow-md z-10"
                    title="מחק"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                  <Avatar className="w-10 h-10 ring-1 ring-slate-700">
                    <AvatarFallback className="bg-slate-700 text-teal-400 text-sm font-semibold">{sp.name[0]}</AvatarFallback>
                  </Avatar>
                  <span className="text-xs font-semibold text-slate-200 mt-1.5 truncate max-w-[90px]">{sp.name.split(" ")[0]}</span>
                  <span className="text-[9px] text-slate-400">{sp.relation}</span>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>

        </div>

        {/* Central Connecting Lines */}
        <div className="h-6 w-0.5 bg-slate-800" />

        {/* ROW 3: CHILDREN (DOWN) */}
        <div className="flex flex-col items-center min-h-[90px] justify-start pt-3 w-full">
          <AnimatePresence>
            {childrenNodes.length > 0 ? (
              <div className="flex gap-4 items-center">
                {childrenNodes.map((c) => (
                  <motion.div
                    key={c.id}
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="flex flex-col items-center p-3 rounded-2xl bg-slate-800/80 border border-slate-700 w-28 text-center relative group"
                  >
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeletePerson(c.id, c.name, c.relation);
                      }}
                      className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-slate-900 border border-slate-700 text-slate-400 hover:text-rose-400 hover:border-rose-500/50 flex items-center justify-center transition-all opacity-0 group-hover:opacity-100 shadow-md z-10"
                      title="מחק"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                    <Avatar className="w-10 h-10 ring-1 ring-slate-700">
                      <AvatarFallback className="bg-slate-700 text-teal-400 text-sm font-semibold">{c.name[0]}</AvatarFallback>
                    </Avatar>
                    <span className="text-xs font-semibold text-slate-200 mt-1.5 truncate max-w-[90px]">{c.name.split(" ")[0]}</span>
                    <span className="text-[9px] text-slate-400">{c.relation}</span>
                  </motion.div>
                ))}
                {editingAxis !== "DOWN" && (
                  <button
                    onClick={() => handleStartAdd("DOWN")}
                    className="flex flex-col items-center justify-center p-3 rounded-2xl border-2 border-dashed border-slate-800 hover:border-teal-500/50 bg-slate-900/40 hover:bg-slate-800/20 w-28 h-[104px] text-center transition-all group"
                  >
                    <div className="w-8 h-8 rounded-full border border-dashed border-slate-700 group-hover:border-teal-500 flex items-center justify-center text-slate-500 group-hover:text-teal-400 transition-all">
                      <ArrowDown className="w-4 h-4 animate-pulse" />
                    </div>
                    <span className="text-[10px] font-semibold text-slate-500 group-hover:text-teal-400 mt-2">Add Child</span>
                  </button>
                )}
              </div>
            ) : (
              editingAxis !== "DOWN" && (
                <button
                  onClick={() => handleStartAdd("DOWN")}
                  className="flex flex-col items-center gap-1 group transition-all"
                >
                  <div className="w-10 h-10 rounded-full border-2 border-dashed border-slate-700 group-hover:border-teal-500 flex items-center justify-center text-slate-500 group-hover:text-teal-400 group-hover:scale-105 transition-all">
                    <ArrowDown className="w-5 h-5 animate-pulse" />
                  </div>
                  <span className="text-[10px] font-semibold text-slate-500 group-hover:text-teal-400">Add Children</span>
                </button>
              )
            )}
          </AnimatePresence>

          {/* Form for DOWN Axis children */}
          {editingAxis === "DOWN" && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }} 
              animate={{ opacity: 1, y: 0 }}
              className="bg-slate-800 border border-teal-500/30 p-4 rounded-2xl shadow-xl w-64 text-left z-20"
            >
              <form onSubmit={handleSave} className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold text-teal-400">Add Son or Daughter</span>
                  <button type="button" onClick={handleCancel} className="text-slate-400 hover:text-slate-100">
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <div className="space-y-2">
                  <div>
                    <Label htmlFor="c_first" className="text-[10px] font-semibold text-slate-400">First Name</Label>
                    <Input
                      id="c_first"
                      ref={firstNameInputRef}
                      placeholder="e.g. Leo"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      className="h-8 bg-slate-900 border-slate-700 text-xs rounded-lg focus:border-teal-500"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="c_last" className="text-[10px] font-semibold text-slate-400">Last Name</Label>
                    <Input
                      id="c_last"
                      placeholder="e.g. Doe"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      className="h-8 bg-slate-900 border-slate-700 text-xs rounded-lg focus:border-teal-500"
                    />
                  </div>
                  <div>
                    <Label htmlFor="c_email" className="text-[10px] font-semibold text-slate-400">Email (Optional)</Label>
                    <Input
                      id="c_email"
                      type="email"
                      placeholder="e.g. child@family.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="h-8 bg-slate-900 border-slate-700 text-xs rounded-lg focus:border-teal-500"
                    />
                  </div>
                  <div>
                    <Label htmlFor="c_phone" className="text-[10px] font-semibold text-slate-400">Phone (Optional)</Label>
                    <Input
                      id="c_phone"
                      type="tel"
                      placeholder="e.g. +1 555-1234"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="h-8 bg-slate-900 border-slate-700 text-xs rounded-lg focus:border-teal-500"
                    />
                  </div>
                </div>
                <div className="flex gap-2 justify-end pt-1">
                  <Button type="button" size="sm" variant="ghost" onClick={handleCancel} className="h-7 text-xs text-slate-400">
                    Cancel
                  </Button>
                  <Button type="submit" size="sm" disabled={isSaving} className="h-7 text-xs bg-teal-600 hover:bg-teal-700 text-white font-semibold">
                    {isSaving ? <Loader2 className="w-3 h-3 animate-spin" /> : <Check className="w-3.5 h-3.5 mr-1" />}
                    Save
                  </Button>
                </div>
              </form>
            </motion.div>
          )}
        </div>

      </div>

      {/* Action Footer for finishing and triggering Magic Handoff */}
      {step === "axis" && (
        <div className="w-full max-w-sm mt-4 z-10 flex gap-3">
          <Button 
            variant="ghost" 
            onClick={handleFinishOnboarding}
            className="flex-1 border border-slate-800 text-slate-400 hover:text-slate-200 text-xs py-3 h-10 rounded-xl"
          >
            Skip Onboarding
          </Button>
          <Button 
            onClick={() => setStep("handoff")}
            disabled={localNodes.length === 0}
            className="flex-1 bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-600 hover:to-cyan-600 disabled:from-slate-800 disabled:text-slate-600 text-white text-xs font-semibold py-3 h-10 rounded-xl shadow-lg"
          >
            Invite Family & Finish
          </Button>
        </div>
      )}

      {/* Magic Link Handoff Panel */}
      <AnimatePresence>
        {step === "handoff" && (
          <motion.div
            initial={{ y: 250, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 250, opacity: 0 }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="absolute bottom-0 left-0 right-0 bg-slate-900/95 backdrop-blur-md border-t border-slate-800 p-6 rounded-t-3xl shadow-2xl z-30 flex flex-col max-h-[85%]"
          >
            <div className="flex justify-between items-start mb-4">
              <div>
                <h4 className="font-heading text-lg font-bold text-teal-400">Pass the Torch</h4>
                <p className="text-[11px] text-slate-400 mt-0.5 leading-relaxed">
                  Invite your family to fill out the rest of the tree. When they join, they will see these mapped relationships.
                </p>
              </div>
              <Button size="icon" variant="ghost" onClick={() => setStep("axis")} className="text-slate-400 hover:text-slate-200">
                <X className="w-4 h-4" />
              </Button>
            </div>

            {/* List of Mapped relatives */}
            <div className="flex-1 overflow-y-auto space-y-3 pr-1 py-1">
              {(() => {
                const inviteableNodes = localNodes.filter((rel) => !rel.isDeceased);
                if (inviteableNodes.length === 0) {
                  return (
                    <div className="text-center py-6 text-slate-500 text-xs">
                      No relatives added to generate share links. Add parent, spouse, or child first.
                    </div>
                  );
                }
                return inviteableNodes.map((rel) => {
                  const baseInviteUrl = `${window.location.origin}/register?inviteId=${rel.id}`;
                  const inviteUrl = rel.email
                    ? `${baseInviteUrl}&email=${encodeURIComponent(rel.email)}`
                    : rel.phone
                      ? `${baseInviteUrl}&phone=${encodeURIComponent(rel.phone)}`
                      : baseInviteUrl;
                  const shareText = `Hey ${rel.name.split(" ")[0]}! I started our private family tree on Kinship. Come claim your profile and see who is already here: ${inviteUrl}`;
                  const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(shareText)}`;

                  return (
                    <div key={rel.id} className="flex items-center justify-between p-3.5 bg-slate-950/60 border border-slate-800/80 rounded-2xl gap-3">
                      <div className="flex items-center gap-3">
                        <Avatar className="w-9 h-9 ring-1 ring-slate-800">
                          <AvatarFallback className="bg-slate-800 text-teal-400 text-xs font-semibold">{rel.name[0]}</AvatarFallback>
                        </Avatar>
                        <div className="text-left">
                          <p className="text-xs font-bold text-slate-200">{rel.name}</p>
                          <p className="text-[9px] text-slate-400">
                            {rel.relation} • {rel.email ? rel.email : rel.phone ? rel.phone : "No email or phone added"}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5">
                        {/* Copy Link Button */}
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => {
                            navigator.clipboard.writeText(inviteUrl);
                            toast({
                              title: "Link copied! 📋",
                              description: `Copied invite link for ${rel.name}.`,
                            });
                          }}
                          className="w-8 h-8 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200"
                          title="Copy Invitation Link"
                        >
                          <Clipboard className="w-3.5 h-3.5" />
                        </Button>

                        {/* Share to WhatsApp Button */}
                        <a
                          href={whatsappUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center justify-center w-8 h-8 rounded-lg bg-emerald-900/60 border border-emerald-800/50 text-emerald-400 hover:bg-emerald-800 hover:text-emerald-200 transition-colors"
                          title="Share via WhatsApp"
                        >
                          <Send className="w-3.5 h-3.5" />
                        </a>
                      </div>
                    </div>
                  );
                });
              })()}
            </div>

            <div className="pt-4 mt-2 border-t border-slate-800 flex gap-2">
              <Button 
                variant="ghost" 
                onClick={() => setStep("axis")}
                className="flex-1 border border-slate-800 text-slate-400 hover:text-slate-200 text-xs py-3 h-10 rounded-xl"
              >
                Go Back
              </Button>
              <Button 
                onClick={handleFinishOnboarding}
                className="flex-1 bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-600 hover:to-cyan-600 text-white text-xs font-semibold py-3 h-10 rounded-xl shadow-lg"
              >
                Finish & Go to Dashboard
              </Button>
            </div>

          </motion.div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation Modal */}
      {deleteNodeId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl max-w-sm w-full shadow-2xl text-center space-y-4 animate-in zoom-in-95 duration-200">
            <div className="w-12 h-12 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-500 flex items-center justify-center mx-auto mb-2">
              <Trash2 className="w-5 h-5" />
            </div>
            <h4 className="text-base font-bold text-slate-100">מחיקת אדם מהעץ</h4>
            <div className="text-xs text-slate-400 leading-relaxed space-y-2">
              <p>
                האם אתה בטוח שברצונך למחוק את <span className="font-semibold text-slate-200">{deleteNodeName}</span> מהעץ?
              </p>
              {deleteNodeRelation === "Parent" && (
                <p className="text-amber-500 font-medium">
                  ⚠️ שים לב: מחיקת הורה תנתק גם את כל הקשרים המשפחתיים שלו.
                </p>
              )}
            </div>
            <div className="flex gap-3 pt-2">
              <Button 
                variant="ghost" 
                onClick={() => { setDeleteNodeId(null); setDeleteNodeName(null); setDeleteNodeRelation(null); }}
                disabled={isDeleting}
                className="flex-1 border border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-800"
              >
                ביטול
              </Button>
              <Button 
                onClick={confirmDeletePerson}
                disabled={isDeleting}
                className="flex-1 bg-rose-600 hover:bg-rose-700 disabled:bg-rose-800 text-white font-semibold shadow-lg shadow-rose-600/10"
              >
                {isDeleting ? <Loader2 className="w-4.5 h-4.5 animate-spin" /> : "מחק"}
              </Button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
