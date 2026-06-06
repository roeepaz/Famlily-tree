import React from "react";
import { motion } from "framer-motion";
import { useNavigate, Link } from "react-router-dom";
import { Sparkles, ArrowRight, TreePine, Shield, Heart, Users } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Landing() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen relative overflow-hidden bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-teal-50/60 via-slate-50 to-cyan-50/20 text-slate-800 font-body">
      {/* Decorative background gradients */}
      <div className="absolute inset-0 -z-10 overflow-hidden">
        <motion.div
          animate={{ x: [0, 20, 0], y: [0, -30, 0] }}
          transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
          className="absolute -top-20 -right-20 w-[400px] h-[400px] rounded-full bg-teal-200/20 blur-3xl"
        />
        <motion.div
          animate={{ x: [0, -25, 0], y: [0, 20, 0] }}
          transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-1/2 -left-40 w-[500px] h-[500px] rounded-full bg-cyan-200/25 blur-3xl"
        />
        <motion.div
          animate={{ scale: [1, 1.1, 1] }}
          transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
          className="absolute -bottom-40 right-20 w-[600px] h-[600px] rounded-full bg-teal-100/15 blur-3xl"
        />
      </div>

      {/* Header */}
      <header className="relative z-10 max-w-7xl mx-auto flex items-center justify-between px-6 md:px-12 pt-8 pb-4">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6 }}
          className="flex items-center gap-3 cursor-pointer"
          onClick={() => navigate("/")}
        >
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-teal-500 to-cyan-600 flex items-center justify-center shadow-md shadow-teal-500/10">
            <TreePine className="w-5 h-5 text-white" />
          </div>
          <span className="font-heading font-bold text-2xl bg-gradient-to-r from-teal-700 to-cyan-800 bg-clip-text text-transparent">
            Kinship
          </span>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6 }}
          className="flex items-center gap-4"
        >
          <Link
            to="/login"
            className="text-sm font-semibold text-slate-600 hover:text-teal-600 transition-colors"
          >
            Sign In
          </Link>
          <Button
            onClick={() => navigate("/register")}
            className="rounded-xl bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-700 hover:to-cyan-700 text-white font-semibold shadow-md shadow-teal-500/10 transition-all hover:shadow-lg hover:shadow-teal-500/15"
          >
            Start Your Tree
          </Button>
        </motion.div>
      </header>

      {/* Hero Section */}
      <main className="relative z-10 max-w-7xl mx-auto px-6 md:px-12 pt-12 pb-24 flex flex-col lg:flex-row items-center gap-16 lg:gap-24">
        {/* Left Column: Hero Text */}
        <div className="flex-1 space-y-8 text-center lg:text-left">
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.5 }}
            className="inline-flex items-center gap-2 bg-teal-50 border border-teal-100/80 px-4 py-1.5 rounded-full text-teal-700 text-xs font-semibold tracking-wide uppercase shadow-sm mx-auto lg:mx-0"
          >
            <Shield className="w-3.5 h-3.5 text-teal-600" />
            <span>100% Private Family Sanctuary</span>
          </motion.div>

          <div className="space-y-4">
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.6 }}
              className="font-heading font-extrabold text-4xl md:text-5xl lg:text-6xl text-slate-800 leading-[1.15] tracking-tight"
            >
              Every family has a story.
              <br />
              <span className="bg-gradient-to-r from-teal-600 to-cyan-600 bg-clip-text text-transparent">
                Write yours together.
              </span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.6 }}
              className="text-lg text-slate-600 max-w-xl mx-auto lg:mx-0 leading-relaxed font-body"
            >
              Build your private family tree, preserve cherished memories, and share milestones with the people who matter most. Safe, structured, and entirely yours.
            </motion.p>
          </div>

          {/* Action Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.6 }}
            className="flex flex-col sm:flex-row justify-center lg:justify-start gap-4"
          >
            <Button
              onClick={() => navigate("/register")}
              size="lg"
              className="h-14 px-8 rounded-2xl bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-700 hover:to-cyan-700 text-white font-semibold text-base shadow-lg shadow-teal-500/20 hover:shadow-xl hover:shadow-teal-500/25 group transition-all"
            >
              Plant Your Family Tree
              <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
            </Button>
            <Button
              onClick={() => navigate("/login")}
              size="lg"
              variant="outline"
              className="h-14 px-8 rounded-2xl border-slate-200 hover:border-slate-300 hover:bg-slate-100 hover:text-slate-800 text-slate-700 font-semibold text-base shadow-sm transition-all"
            >
              Enter Family Vault
            </Button>
          </motion.div>

          {/* Trust points */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5, duration: 0.8 }}
            className="grid grid-cols-3 gap-4 pt-4 border-t border-slate-100 max-w-md mx-auto lg:mx-0"
          >
            <div className="text-center lg:text-left">
              <p className="text-xl font-bold text-slate-800">Private</p>
              <p className="text-xs text-slate-500 mt-1">No ads, no public feeds</p>
            </div>
            <div className="text-center lg:text-left">
              <p className="text-xl font-bold text-slate-800">Secure</p>
              <p className="text-xs text-slate-500 mt-1">Encrypted family vault</p>
            </div>
            <div className="text-center lg:text-left">
              <p className="text-xl font-bold text-slate-800">Connected</p>
              <p className="text-xs text-slate-500 mt-1">Automatic circle merges</p>
            </div>
          </motion.div>
        </div>

        {/* Right Column: Hero Visuals */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3, duration: 0.8, type: "spring", stiffness: 100 }}
          className="flex-1 flex justify-center items-center w-full"
        >
          <div className="relative w-full max-w-[480px]">
            {/* Background elements */}
            <div className="absolute inset-0 bg-gradient-to-tr from-teal-200/30 to-cyan-300/30 rounded-3xl blur-2xl transform rotate-6 scale-95" />
            
            {/* Primary Image */}
            <div className="relative z-10 rounded-3xl overflow-hidden shadow-2xl border-4 border-white transform hover:scale-[1.02] transition-transform duration-500">
              <img
                src="/family-photos/photo1.jpg"
                alt="Joyful family sharing a special moment"
                className="w-full aspect-[4/3] object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-900/40 via-transparent to-transparent" />
            </div>

            {/* Overlapping secondary image */}
            <motion.div
              initial={{ opacity: 0, x: 40, y: 40 }}
              animate={{ opacity: 1, x: 0, y: 0 }}
              transition={{ delay: 0.6, duration: 0.8 }}
              className="absolute -bottom-10 -right-6 z-20 w-48 rounded-2xl overflow-hidden shadow-xl border-4 border-white hidden sm:block transform hover:-translate-y-1 transition-transform duration-300"
            >
              <img
                src="/family-photos/photo2.jpg"
                alt="Family holding hands close-up"
                className="w-full aspect-square object-cover"
              />
            </motion.div>

            {/* Orbiting Badge - "Heritage" */}
            <motion.div
              animate={{ y: [0, -8, 0] }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
              className="absolute -top-6 -left-6 z-20 bg-white/95 backdrop-blur-md rounded-2xl p-3 shadow-lg border border-slate-100 flex items-center gap-3"
            >
              <div className="w-8 h-8 rounded-lg bg-teal-100 flex items-center justify-center">
                <Heart className="w-4.5 h-4.5 text-teal-600" />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-800 leading-none">Shared Legacy</p>
                <p className="text-[10px] text-slate-500 mt-1">Preserved forever</p>
              </div>
            </motion.div>

            {/* Orbiting Badge - "Connection" */}
            <motion.div
              animate={{ y: [0, 8, 0] }}
              transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
              className="absolute top-1/2 -left-12 z-20 bg-white/95 backdrop-blur-md rounded-2xl p-3 shadow-lg border border-slate-100 flex items-center gap-3 hidden md:flex"
            >
              <div className="w-8 h-8 rounded-lg bg-cyan-100 flex items-center justify-center">
                <Users className="w-4.5 h-4.5 text-cyan-600" />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-800 leading-none">Extended Network</p>
                <p className="text-[10px] text-slate-500 mt-1">Automatic merges</p>
              </div>
            </motion.div>
          </div>
        </motion.div>
      </main>

      {/* Feature section */}
      <section className="relative z-10 border-t border-slate-100 bg-white/60 backdrop-blur-sm py-20">
        <div className="max-w-7xl mx-auto px-6 md:px-12">
          <div className="text-center max-w-2xl mx-auto mb-16 space-y-4">
            <h2 className="font-heading font-extrabold text-3xl text-slate-800">
              Why families choose Kinship
            </h2>
            <p className="text-slate-600">
              We design features that focus on real family values, safeguarding your heritage without selling your attention.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white/80 rounded-2xl p-8 border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
              <div className="w-12 h-12 rounded-xl bg-teal-50 flex items-center justify-center mb-6">
                <TreePine className="w-6 h-6 text-teal-600" />
              </div>
              <h3 className="font-heading font-bold text-xl text-slate-800 mb-3">
                Unified Tree Mapping
              </h3>
              <p className="text-slate-600 text-sm leading-relaxed">
                Connect two branches, and your trees merge automatically. Watch your extended family circle grow and discover new connections easily.
              </p>
            </div>

            <div className="bg-white/80 rounded-2xl p-8 border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
              <div className="w-12 h-12 rounded-xl bg-cyan-50 flex items-center justify-center mb-6">
                <Shield className="w-6 h-6 text-cyan-600" />
              </div>
              <h3 className="font-heading font-bold text-xl text-slate-800 mb-3">
                Privacy By Relation
              </h3>
              <p className="text-slate-600 text-sm leading-relaxed">
                Your data is strictly private. Only users who share a verifiable connection path to you can see your family profile or shared updates.
              </p>
            </div>

            <div className="bg-white/80 rounded-2xl p-8 border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
              <div className="w-12 h-12 rounded-xl bg-teal-50 flex items-center justify-center mb-6">
                <Sparkles className="w-6 h-6 text-teal-600" />
              </div>
              <h3 className="font-heading font-bold text-xl text-slate-800 mb-3">
                Family Archives
              </h3>
              <p className="text-slate-600 text-sm leading-relaxed">
                Build a collaborative knowledge base. Preserve recipes, journals, historical documents, and photo albums for future generations.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-100 bg-slate-50 py-12">
        <div className="max-w-7xl mx-auto px-6 md:px-12 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-teal-500 to-cyan-600 flex items-center justify-center">
              <TreePine className="w-4 h-4 text-white" />
            </div>
            <span className="font-heading font-bold text-lg text-slate-700">Kinship</span>
          </div>
          <p className="text-xs text-slate-500">
            &copy; {new Date().getFullYear()} Kinship. All rights reserved. Secure and private family archives.
          </p>
        </div>
      </footer>
    </div>
  );
}
