import React, { useState } from "react";
import Navbar from "@/components/kinship/Navbar";
import FamilyHub from "@/components/kinship/FamilyHub";
import TreeExplorer from "@/components/kinship/TreeExplorer";
import HeritageVault from "@/components/kinship/HeritageVault";
import { motion, AnimatePresence } from "framer-motion";

const views = {
  hub: FamilyHub,
  tree: TreeExplorer,
  vault: HeritageVault,
};

export default function Home() {
  const [activeTab, setActiveTab] = useState("hub");
  const ActiveView = views[activeTab];

  return (
    <div className="min-h-screen bg-background">
      <Navbar activeTab={activeTab} onTabChange={setActiveTab} />
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
    </div>
  );
}