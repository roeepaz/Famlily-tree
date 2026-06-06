import React, { useEffect, useState } from "react";
import { Heart } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const PHOTOS = [
  "/family-photos/photo1.jpg",
  "/family-photos/photo2.jpg",
  "/family-photos/photo3.jpg",
  "/family-photos/photo4.jpg",
];

// How long each photo is displayed (ms)
const SLIDE_DURATION = 1800;

export default function AppLoader() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [progress, setProgress] = useState(0);

  // Cycle through photos
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % PHOTOS.length);
    }, SLIDE_DURATION);
    return () => clearInterval(interval);
  }, []);

  // Animated shimmer progress bar
  useEffect(() => {
    setProgress(0);
    const step = 100 / (SLIDE_DURATION / 30);
    const ticker = setInterval(() => {
      setProgress((p) => Math.min(p + step, 100));
    }, 30);
    return () => clearInterval(ticker);
  }, [currentIndex]);

  return (
    <div className="fixed inset-0 z-[9999] overflow-hidden bg-black">
      {/* Photo slideshow with Ken Burns zoom */}
      <AnimatePresence>
        <motion.div
          key={currentIndex}
          className="absolute inset-0"
          initial={{ opacity: 0, scale: 1.08 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.96 }}
          transition={{ duration: 0.9, ease: "easeInOut" }}
        >
          <img
            src={PHOTOS[currentIndex]}
            alt={`Family memory ${currentIndex + 1}`}
            className="w-full h-full object-cover"
            draggable={false}
          />
          {/* Dark vignette gradient */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-black/30" />
        </motion.div>
      </AnimatePresence>

      {/* Center brand card */}
      <div className="absolute inset-0 flex flex-col items-center justify-center px-6">
        <motion.div
          initial={{ opacity: 0, y: 24, scale: 0.92 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ delay: 0.3, duration: 0.7, ease: "easeOut" }}
          className="flex flex-col items-center text-center"
        >
          {/* Logo icon */}
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-teal-500 to-cyan-400 shadow-2xl shadow-teal-500/40 flex items-center justify-center mb-5">
            <Heart className="w-8 h-8 text-white" strokeWidth={2.5} />
          </div>

          {/* Brand name */}
          <h1
            dir="rtl"
            className="text-4xl font-extrabold text-white mb-2"
            style={{ fontFamily: "'Heebo', 'Arial', sans-serif", textShadow: "0 4px 32px rgba(0,0,0,0.5)", letterSpacing: "0" }}
          >
            משפחת שרעבי - אהבה ואחדות
          </h1>

          <p dir="rtl" className="text-white/70 text-sm font-light tracking-wide mb-10" style={{ fontFamily: "'Heebo', 'Arial', sans-serif" }}>
            המשפחה שלנו, מחוברת לנצח
          </p>

          {/* Progress bar */}
          <div className="w-48 h-1 rounded-full bg-white/20 overflow-hidden">
            <motion.div
              className="h-full rounded-full bg-gradient-to-r from-teal-400 to-cyan-300"
              style={{ width: `${progress}%` }}
              transition={{ ease: "linear" }}
            />
          </div>

          {/* Dot indicators */}
          <div className="flex items-center gap-2 mt-5">
            {PHOTOS.map((_, i) => (
              <motion.div
                key={i}
                animate={{
                  width: i === currentIndex ? 20 : 6,
                  opacity: i === currentIndex ? 1 : 0.4,
                }}
                transition={{ duration: 0.3 }}
                className="h-1.5 rounded-full bg-white"
              />
            ))}
          </div>
        </motion.div>
      </div>

      {/* Bottom tagline */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6, duration: 0.8 }}
        className="absolute bottom-8 left-0 right-0 flex justify-center"
      >
        <p dir="rtl" className="text-white/40 text-xs tracking-wide" style={{ fontFamily: "'Heebo', 'Arial', sans-serif" }}>
          מאובטח · פרטי · המשפחה קודמת
        </p>
      </motion.div>
    </div>
  );
}
