import React, { useState } from "react";
import Navbar from "@/components/kinship/Navbar";
import FamilyHub from "@/components/kinship/FamilyHub";
import TreeExplorer from "@/components/kinship/TreeExplorer";
import HeritageVault from "@/components/kinship/HeritageVault";
import ProfileDrawer from "@/components/kinship/ProfileDrawer";
import AddRelativeModal from "@/components/kinship/AddRelativeModal";
import { useAuth } from "@/lib/AuthContext";
import { motion, AnimatePresence } from "framer-motion";

const views = {
  hub: FamilyHub,
  tree: TreeExplorer,
  vault: HeritageVault,
};

export default function Home() {
  const [activeTab, setActiveTab] = useState("hub");
  const [isMyProfileOpen, setIsMyProfileOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [addModalAnchorId, setAddModalAnchorId] = useState(null);
  const { user } = useAuth();

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
          <ActiveView />
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
    </div>
  );
}