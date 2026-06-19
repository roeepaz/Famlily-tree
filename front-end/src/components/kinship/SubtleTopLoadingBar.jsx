import React from "react";
import { useIsFetching } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";

export default function SubtleTopLoadingBar() {
  const isFetching = useIsFetching();

  return (
    <AnimatePresence>
      {isFetching > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed top-0 left-0 right-0 h-[2.5px] bg-teal-500/10 z-[9999] overflow-hidden pointer-events-none"
        >
          <motion.div
            className="h-full bg-gradient-to-r from-teal-500 via-cyan-500 to-teal-400 rounded-full"
            initial={{ left: "-35%", width: "35%", position: "absolute" }}
            animate={{
              left: ["-35%", "110%"],
            }}
            transition={{
              repeat: Infinity,
              duration: 1.4,
              ease: "easeInOut",
            }}
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
