import React, { useState, useEffect } from "react";
import Navbar from "@/components/kinship/Navbar";
import FamilyHub from "@/components/kinship/FamilyHub";
import TreeExplorer from "@/components/kinship/TreeExplorer";
import HeritageVault from "@/components/kinship/HeritageVault";
import FamilyEvents from "@/components/kinship/FamilyEvents";
import ProfileDrawer from "@/components/kinship/ProfileDrawer";
import AddRelativeModal from "@/components/kinship/AddRelativeModal";
import SparkOnboardingCanvas from "@/components/kinship/SparkOnboardingCanvas";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/AuthContext";
import { motion, AnimatePresence } from "framer-motion";

const views = {
  hub: FamilyHub,
  tree: TreeExplorer,
  vault: HeritageVault,
  events: FamilyEvents,
};

export default function Home() {
  const [activeTab, setActiveTab] = useState("hub");
  const [isMyProfileOpen, setIsMyProfileOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [addModalAnchorId, setAddModalAnchorId] = useState(null);
  const [showSparkOnboarding, setShowSparkOnboarding] = useState(false);
  const { user } = useAuth();

  const { data: familyCircle = [] } = useQuery({
    queryKey: ["familyCircle"],
    queryFn: api.getCircle,
    enabled: !!user,
  });

  const isAlone =
    user &&
    familyCircle.length <= 1 &&
    localStorage.getItem(`kinship_spark_completed_${user.id}`) !== "true";

  // Trigger popup when landing alone
  useEffect(() => {
    if (isAlone) {
      setShowSparkOnboarding(true);
    }
  }, [isAlone]);

  const ActiveView = views[activeTab];

  return (
    <div className="min-h-screen bg-background">
      <Navbar 
        activeTab={activeTab} 
        onTabChange={setActiveTab} 
        onProfileClick={() => setIsMyProfileOpen(true)} 
      />
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -12 }}
          transition={{ duration: 0.25 }}
        >
          <ActiveView 
            onTabChange={setActiveTab} 
            onLaunchSpark={() => setShowSparkOnboarding(true)} 
          />
        </motion.div>
      </AnimatePresence>

      <ProfileDrawer
        member={user ? { ...user, relation: "You" } : null}
        isOpen={isMyProfileOpen}
        onClose={() => setIsMyProfileOpen(false)}
        onAddRelative={(anchorId) => {
          setAddModalAnchorId(anchorId);
          setIsAddModalOpen(true);
          setIsMyProfileOpen(false);
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

      <Dialog open={showSparkOnboarding} onOpenChange={setShowSparkOnboarding}>
        <DialogContent className="sm:max-w-[760px] p-0 border-0 bg-transparent shadow-none overflow-hidden">
          <SparkOnboardingCanvas familyCircle={familyCircle} />
        </DialogContent>
      </Dialog>
    </div>
  );
}