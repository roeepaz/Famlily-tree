import React from "react";
import { motion } from "framer-motion";
import { TreePine, Archive, CalendarDays, ArrowRight, Sparkles } from "lucide-react";

const onboardingFeatures = [
  {
    icon: TreePine,
    title: "Tree Explorer",
    desc: "Visualize your family connections in an interactive, living tree.",
    bg: "bg-[#00D1C1]",
    text: "text-[#052B28]",
    tab: "tree",
  },
  {
    icon: Archive,
    title: "Heritage Vault",
    desc: "Store and share precious family photos, documents, and stories.",
    bg: "bg-[#FFB800]",
    text: "text-[#332500]",
    tab: "vault",
  },
  {
    icon: CalendarDays,
    title: "Family Events",
    desc: "Never miss a birthday, reunion, or milestone again.",
    bg: "bg-[#2E5BFF]",
    text: "text-white",
    tab: "events",
  },
];

export default function WelcomePromo({ onTabChange, onLaunchSpark }) {
  return (
    <div className="min-h-screen pb-28 max-w-5xl mx-auto px-4 md:px-6">
      {/* Hero Section */}
      <section className="relative overflow-hidden min-h-[60vh] flex items-center bg-gradient-to-br from-teal-500/15 via-cyan-500/5 to-transparent dark:from-teal-950/25 dark:via-cyan-950/10 dark:to-transparent border border-border/40 rounded-3xl p-8 md:p-16 mb-12 shadow-sm">
        {/* Decorative orbs */}
        <motion.div
          animate={{ x: [0, 40, 0], y: [0, -30, 0] }}
          transition={{ duration: 12, repeat: Infinity }}
          className="absolute top-20 right-[15%] w-48 h-48 rounded-full bg-teal-500/10 dark:bg-teal-500/5 blur-3xl pointer-events-none"
        />
        <motion.div
          animate={{ x: [0, -30, 0], y: [0, 40, 0] }}
          transition={{ duration: 15, repeat: Infinity }}
          className="absolute bottom-20 left-[10%] w-64 h-64 rounded-full bg-cyan-500/5 dark:bg-cyan-500/2 blur-3xl pointer-events-none"
        />

        <div className="max-w-2xl text-left relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 bg-teal-500/10 border border-teal-500/20 px-4 py-2 rounded-full mb-8 text-teal-600 dark:text-teal-400"
          >
            <Sparkles className="w-4 h-4 text-teal-500" />
            <span className="text-sm font-semibold uppercase tracking-wider">Welcome to Kinship</span>
          </motion.div>
          
          <h1 className="font-heading font-extrabold text-4xl md:text-6xl lg:text-7xl leading-none tracking-tight mb-6 text-foreground">
            LIFE,
            <br />
            <span className="text-teal-600 dark:text-teal-400 drop-shadow-[0_0_15px_rgba(20,184,166,0.2)]">SYNCHRONIZED.</span>
          </h1>
          
          <p className="text-base md:text-lg text-muted-foreground max-w-md leading-relaxed mb-8">
            Your family hub — where schedules align, memories live, and connections grow stronger every day.
          </p>

          <motion.button
            whileHover={{ scale: 1.03, boxShadow: "0 20px 50px rgba(13, 148, 136, 0.2)" }}
            whileTap={{ scale: 0.97 }}
            onClick={onLaunchSpark}
            className="h-14 px-8 rounded-2xl bg-teal-600 hover:bg-teal-700 dark:bg-teal-500 dark:hover:bg-teal-600 text-white font-heading font-bold text-base transition-all shadow-xl flex items-center gap-2 group"
          >
            Plant Your Family Tree
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </motion.button>
        </div>
      </section>

      {/* Feature plates */}
      <div className="space-y-8">
        {onboardingFeatures.map((feature, i) => (
          <motion.section
            key={feature.title}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className={`${feature.bg} ${feature.text} rounded-3xl p-10 md:p-14 overflow-hidden shadow-sm relative border border-border/40`}
          >
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-12">
              <div className={`flex-1 text-left ${i % 2 === 1 ? "md:order-2" : ""}`}>
                <div className="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center mb-6 border border-white/10">
                  <feature.icon className="w-8 h-8" />
                </div>
                <h2 className="font-heading font-extrabold text-2xl md:text-4xl mb-4 leading-tight">
                  {feature.title}
                </h2>
                <p className="text-base md:text-lg opacity-80 leading-relaxed max-w-md mb-8">
                  {feature.desc}
                </p>
                <motion.button
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => onTabChange(feature.tab)}
                  className="h-12 px-6 rounded-2xl bg-white/20 backdrop-blur-sm font-heading font-bold text-sm hover:bg-white/30 transition-all flex items-center gap-2 group border border-white/10"
                >
                  Explore
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </motion.button>
              </div>
              
              <div className={`flex items-center justify-center ${i % 2 === 1 ? "md:order-1" : ""}`}>
                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  whileInView={{ scale: 1, opacity: 1 }}
                  viewport={{ once: true }}
                  className="w-36 h-36 md:w-48 md:h-48 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center border border-white/5"
                >
                  <feature.icon className="w-16 h-16 md:w-20 md:h-20 opacity-30" />
                </motion.div>
              </div>
            </div>
          </motion.section>
        ))}
      </div>

      {/* Quartz Footer Section */}
      <section className="bg-slate-50 dark:bg-slate-900/40 border border-border/40 rounded-3xl p-10 md:p-16 text-center mt-12 shadow-sm">
        <h2 className="font-heading font-extrabold text-2xl md:text-4xl text-foreground mb-4">
          Ready to Begin?
        </h2>
        <p className="text-base text-muted-foreground mb-8 max-w-md mx-auto leading-relaxed">
          Join thousands of families who keep their bonds alive, organized, and celebrated.
        </p>
        <motion.button
          whileHover={{ scale: 1.03, boxShadow: "0 20px 50px rgba(13, 148, 136, 0.15)" }}
          whileTap={{ scale: 0.97 }}
          onClick={onLaunchSpark}
          className="h-14 px-10 rounded-2xl bg-teal-600 hover:bg-teal-700 dark:bg-teal-500 dark:hover:bg-teal-600 text-white font-heading font-bold text-base transition-all shadow-xl mx-auto flex items-center gap-2 group"
        >
          Join the Fleet
          <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
        </motion.button>
      </section>
    </div>
  );
}
