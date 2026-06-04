import React from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { TreePine, CalendarDays, Archive, Users, ArrowRight, Sparkles } from "lucide-react";
import FloatingNav from "@/components/onboarding/FloatingNav";

const features = [
  {
    icon: TreePine,
    title: "Tree Explorer",
    desc: "Visualize your family connections in an interactive, living tree.",
    bg: "bg-[#00D1C1]",
    text: "text-[#052B28]",
    path: "/tree",
  },
  {
    icon: Archive,
    title: "Heritage Vault",
    desc: "Store and share precious family photos, documents, and stories.",
    bg: "bg-[#FFB800]",
    text: "text-[#332500]",
    path: "/vault",
  },
  {
    icon: CalendarDays,
    title: "Family Events",
    desc: "Never miss a birthday, reunion, or milestone again.",
    bg: "bg-[#2E5BFF]",
    text: "text-white",
    path: "/events",
  },
];

export default function FamilyHub() {
  return (
    <div className="min-h-screen pb-28">
      {/* Hero Section - Turquoise Fleet */}
      <section className="fleet-cyan min-h-[60vh] flex items-center relative overflow-hidden">
        {/* Decorative orbs */}
        <motion.div
          animate={{ x: [0, 40, 0], y: [0, -30, 0] }}
          transition={{ duration: 12, repeat: Infinity }}
          className="absolute top-20 right-[15%] w-48 h-48 rounded-full bg-white/10 blur-3xl"
        />
        <motion.div
          animate={{ x: [0, -30, 0], y: [0, 40, 0] }}
          transition={{ duration: 15, repeat: Infinity }}
          className="absolute bottom-20 left-[10%] w-64 h-64 rounded-full bg-black/5 blur-3xl"
        />

        <div className="max-w-6xl mx-auto px-6 md:px-12 py-24 md:py-32 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: "spring", stiffness: 150 }}
            className="max-w-2xl"
          >
            <div className="inline-flex items-center gap-2 bg-white/15 backdrop-blur-sm px-4 py-2 rounded-full mb-8">
              <Sparkles className="w-4 h-4" />
              <span className="text-sm font-heading font-semibold">Welcome to Kinship</span>
            </div>
            <h1 className="font-heading font-extrabold text-4xl md:text-hero leading-tight tracking-tight mb-6">
              LIFE,
              <br />
              <span className="text-white text-glow-cyan">SYNCHRONIZED.</span>
            </h1>
            <p className="text-body-lg text-[#052B28]/60 max-w-md leading-relaxed mb-8">
              Your family hub — where schedules align, memories live, and connections grow stronger every day.
            </p>
            <Link to="/onboarding">
              <motion.button
                whileHover={{ scale: 1.03, boxShadow: "0 20px 50px rgba(5, 43, 40, 0.2)" }}
                whileTap={{ scale: 0.97 }}
                className="h-14 px-8 rounded-2xl bg-[#052B28] text-white font-heading font-bold text-base transition-all shadow-xl flex items-center gap-2 group"
              >
                Plant Your Family Tree
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </motion.button>
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Service Fleet - Feature Plates */}
      {features.map((feature, i) => (
        <motion.section
          key={feature.title}
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true, margin: "-100px" }}
          className={`${feature.bg} ${feature.text} relative overflow-hidden`}
        >
          <div className="max-w-6xl mx-auto px-6 md:px-12 py-24 md:py-32">
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center"
            >
              <div className={i % 2 === 1 ? "md:order-2" : ""}>
                <div className="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center mb-6">
                  <feature.icon className="w-8 h-8" />
                </div>
                <h2 className="font-heading font-extrabold text-3xl md:text-section mb-4 leading-tight">
                  {feature.title}
                </h2>
                <p className="text-lg opacity-70 leading-relaxed max-w-md mb-8">
                  {feature.desc}
                </p>
                <Link to={feature.path}>
                  <motion.button
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                    className="h-12 px-6 rounded-2xl bg-white/20 backdrop-blur-sm font-heading font-bold text-sm hover:bg-white/30 transition-all flex items-center gap-2 group"
                  >
                    Explore
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </motion.button>
                </Link>
              </div>
              <div className={i % 2 === 1 ? "md:order-1" : ""}>
                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  whileInView={{ scale: 1, opacity: 1 }}
                  viewport={{ once: true }}
                  className="w-48 h-48 md:w-64 md:h-64 mx-auto rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center"
                >
                  <feature.icon className="w-20 h-20 md:w-28 md:h-28 opacity-30" />
                </motion.div>
              </div>
            </motion.div>
          </div>
        </motion.section>
      ))}

      {/* Quartz Footer Section */}
      <section className="fleet-quartz py-24 md:py-32">
        <div className="max-w-4xl mx-auto px-6 md:px-12 text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="font-heading font-extrabold text-3xl md:text-section text-fleet-quartz-dark mb-4">
              Ready to Begin?
            </h2>
            <p className="text-lg text-fleet-quartz-dark/50 mb-10 max-w-md mx-auto">
              Join thousands of families who keep their bonds alive, organized, and celebrated.
            </p>
            <Link to="/onboarding">
              <motion.button
                whileHover={{ scale: 1.03, boxShadow: "0 20px 50px rgba(0, 209, 193, 0.3)" }}
                whileTap={{ scale: 0.97 }}
                className="h-14 px-10 rounded-2xl bg-fleet-cyan text-fleet-cyan-dark font-heading font-bold text-base transition-all shadow-xl mx-auto flex items-center gap-2 group"
              >
                Join the Fleet
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </motion.button>
            </Link>
          </motion.div>
        </div>
      </section>

      <FloatingNav />
    </div>
  );
}