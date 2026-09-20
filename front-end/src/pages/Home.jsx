import React, { useState, useEffect, useRef } from "react";
import Navbar from "@/components/kinship/Navbar";
import FamilyHub from "@/components/kinship/FamilyHub";
import TreeExplorer from "@/components/kinship/TreeExplorer";
import HeritageVault from "@/components/kinship/HeritageVault";
import FamilyEvents from "@/components/kinship/FamilyEvents";
import ProfileDrawer from "@/components/kinship/ProfileDrawer";
import AddRelativeModal from "@/components/kinship/AddRelativeModal";
import SparkOnboardingCanvas from "@/components/kinship/SparkOnboardingCanvas";
import SubtleTopLoadingBar from "@/components/kinship/SubtleTopLoadingBar";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/AuthContext";
import { motion, AnimatePresence } from "framer-motion";
import { TreePine, Sparkles } from "lucide-react";

const views = {
  hub: FamilyHub,
  tree: TreeExplorer,
  vault: HeritageVault,
  events: FamilyEvents,
};

export let persistedActiveTab = "tree";
let persistedUserId = null;

export default function Home() {
  const { user } = useAuth();

  // Reset to default tab if logged in user changes
  if (user && persistedUserId && persistedUserId !== user.id) {
    persistedActiveTab = "tree";
  }
  if (user) {
    persistedUserId = user.id;
  }

  const [activeTab, setActiveTab] = useState(persistedActiveTab);

  useEffect(() => {
    persistedActiveTab = activeTab;
  }, [activeTab]);

  const [isMyProfileOpen, setIsMyProfileOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [addModalAnchorId, setAddModalAnchorId] = useState(null);
  const [showSparkOnboarding, setShowSparkOnboarding] = useState(false);
  const [isCheckingCircle, setIsCheckingCircle] = useState(() => {
    return sessionStorage.getItem("just_logged_in") === "true";
  });
  const [loadingText, setLoadingText] = useState("Gathering family members...");
  const lastUserIdRef = useRef(null);

  const { data: familyCircle = [], isLoading: isLoadingCircle } = useQuery({
    queryKey: ["familyCircle"],
    queryFn: api.getCircle,
    enabled: !!user,
  });

  const showLoader = isCheckingCircle;

  // Cycle through loading messages for a premium feel
  useEffect(() => {
    if (!showLoader) return;
    const texts = [
      "Gathering family members...",
      "Connecting family branches...",
      "Cultivating your family tree...",
      "Synchronizing family schedules...",
    ];
    let idx = 0;
    const textInterval = setInterval(() => {
      idx = (idx + 1) % texts.length;
      setLoadingText(texts[idx]);
    }, 600);
    return () => clearInterval(textInterval);
  }, [showLoader]);

  // Introduce a minimum 2-second delay to prevent sudden layout shifts (only for active logins)
  useEffect(() => {
    if (!user) return;
    if (lastUserIdRef.current === user.id) return;
    lastUserIdRef.current = user.id;

    const justLoggedIn = sessionStorage.getItem("just_logged_in") === "true";
    if (justLoggedIn) {
      setIsCheckingCircle(true);
      const timer = setTimeout(() => {
        setIsCheckingCircle(false);
        sessionStorage.removeItem("just_logged_in");
      }, 2000);
      return () => clearTimeout(timer);
    } else {
      setIsCheckingCircle(false);
    }
  }, [user]);

  // Open the onboarding wizard only after data is fully loaded and user is confirmed to be alone
  useEffect(() => {
    if (!showLoader && user) {
      const isAlone =
        familyCircle.length <= 1 &&
        localStorage.getItem(`kinship_spark_completed_${user.id}`) !== "true";
      
      if (isAlone) {
        setShowSparkOnboarding(true);
      }
    }
  }, [showLoader, familyCircle, user]);

  const ActiveView = views[activeTab];

  return (
    <AnimatePresence mode="wait">
      {showLoader ? (
        <motion.div
          key="loader"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0, scale: 0.98 }}
          transition={{ duration: 0.4 }}
          className="fixed inset-0 z-50 min-h-screen bg-background flex flex-col items-center justify-center overflow-hidden"
        >
          {/* Ambient Glows */}
          <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full bg-teal-500/10 blur-3xl pointer-events-none dark:bg-teal-500/5 animate-[pulse_6s_ease-in-out_infinite]" />
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 rounded-full bg-cyan-500/10 blur-3xl pointer-events-none dark:bg-cyan-500/5 animate-[pulse_6s_ease-in-out_infinite_1.5s]" />

          <div className="z-10 flex flex-col items-center max-w-sm px-6 text-center">
            {/* Animated Logo Container */}
            <div className="relative mb-8">
              <div className="absolute inset-0 rounded-full bg-teal-500/20 blur-2xl animate-pulse scale-110" />
              <motion.div 
                className="relative w-24 h-24 rounded-3xl bg-gradient-to-tr from-teal-500 to-cyan-500 flex items-center justify-center shadow-xl shadow-teal-500/20 border border-teal-400/20"
                animate={{
                  scale: [1, 1.05, 1],
                  rotate: [0, 2, -2, 0],
                }}
                transition={{
                  repeat: Infinity,
                  duration: 4,
                  ease: "easeInOut",
                }}
              >
                {/* Dashed outer ring that rotates slowly */}
                <div className="absolute inset-2 rounded-2xl border-2 border-dashed border-white/20 animate-[spin_15s_linear_infinite]" />
                {/* Pulsing core */}
                <div className="absolute inset-4 rounded-xl bg-white/10 backdrop-blur-md flex items-center justify-center">
                  <TreePine className="w-10 h-10 text-white animate-[pulse_2s_ease-in-out_infinite]" />
                </div>
              </motion.div>
            </div>

            {/* Title / Brand */}
            <h2 className="font-heading text-3xl font-extrabold text-foreground tracking-tight flex items-center gap-2 justify-center">
              Kinship
              <Sparkles className="w-5 h-5 text-teal-500 animate-pulse" />
            </h2>
            
            {/* Loading text with transition */}
            <p className="text-sm text-muted-foreground mt-3 leading-relaxed min-h-[40px] flex items-center justify-center font-medium">
              {loadingText}
            </p>

            {/* Custom Infinite Progress Bar */}
            <div className="w-48 h-1 bg-secondary rounded-full overflow-hidden mt-6 relative">
              <motion.div
                className="h-full bg-gradient-to-r from-teal-500 to-cyan-500 rounded-full"
                initial={{ left: "-30%", width: "30%", position: "absolute" }}
                animate={{
                  left: ["-30%", "100%"],
                }}
                transition={{
                  repeat: Infinity,
                  duration: 1.5,
                  ease: "easeInOut",
                }}
              />
            </div>
          </div>
        </motion.div>
      ) : (
        <motion.div
          key="app-root"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4 }}
          className="min-h-screen bg-background pb-20 sm:pb-0"
        >
          <SubtleTopLoadingBar />
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
        </motion.div>
      )}
    </AnimatePresence>
  );
}