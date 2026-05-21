import React from "react";
import { X, MapPin, Mail, Phone, Calendar, Clock, ArrowRight } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";

export default function ProfileDrawer({ member, isOpen, onClose }) {
  return (
    <AnimatePresence>
      {isOpen && member && (
        <>
          {/* Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-foreground/20 backdrop-blur-sm z-40"
          />

          {/* Drawer */}
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
            className="fixed right-0 top-0 bottom-0 w-full max-w-md bg-card border-l border-border shadow-2xl z-50 overflow-y-auto"
          >
            {/* Header */}
            <div className="relative">
              <div className="h-32 bg-gradient-to-br from-primary/20 via-primary/10 to-secondary" />
              <button
                onClick={onClose}
                className="absolute top-4 right-4 w-8 h-8 rounded-full bg-card/80 backdrop-blur-sm flex items-center justify-center text-foreground hover:bg-card transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
              <div className="px-6 -mt-12">
                <Avatar className="w-24 h-24 ring-4 ring-card shadow-lg">
                  <AvatarImage src={member.avatar} alt={member.name} />
                  <AvatarFallback className="text-2xl font-heading">{member.name[0]}</AvatarFallback>
                </Avatar>
              </div>
            </div>

            {/* Info */}
            <div className="px-6 pt-4 pb-8 space-y-6">
              <div>
                <h2 className="font-heading text-2xl font-semibold text-foreground">
                  {member.name}
                  {member.isDeceased && <span className="ml-2 text-base">🕊️</span>}
                </h2>
                <div className="flex items-center gap-2 mt-1.5">
                  <Badge variant="secondary" className="text-xs">{member.relation}</Badge>
                  <Badge variant="outline" className="text-xs">{member.branch}</Badge>
                </div>
              </div>

              {/* Contact Details */}
              <div className="space-y-3">
                {member.location && (
                  <div className="flex items-center gap-3 text-sm text-foreground/80">
                    <div className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center">
                      <MapPin className="w-4 h-4 text-muted-foreground" />
                    </div>
                    {member.location}
                  </div>
                )}
                {member.email && (
                  <div className="flex items-center gap-3 text-sm text-foreground/80">
                    <div className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center">
                      <Mail className="w-4 h-4 text-muted-foreground" />
                    </div>
                    {member.email}
                  </div>
                )}
                {member.phone && (
                  <div className="flex items-center gap-3 text-sm text-foreground/80">
                    <div className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center">
                      <Phone className="w-4 h-4 text-muted-foreground" />
                    </div>
                    {member.phone}
                  </div>
                )}
                {member.birthYear && (
                  <div className="flex items-center gap-3 text-sm text-foreground/80">
                    <div className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center">
                      <Calendar className="w-4 h-4 text-muted-foreground" />
                    </div>
                    Born {member.birthYear}
                    {member.isDeceased && ` · Passed ${member.deathYear}`}
                  </div>
                )}
              </div>

              {/* Recent Activity (placeholder) */}
              <div>
                <h3 className="text-sm font-semibold text-foreground mb-3">Recent Activity</h3>
                <div className="space-y-2">
                  {["Shared a family photo", "Commented on a memory", "Updated their profile"].map((activity, i) => (
                    <div key={i} className="flex items-center gap-2.5 p-2.5 rounded-xl bg-secondary/40">
                      <Clock className="w-3.5 h-3.5 text-muted-foreground" />
                      <span className="text-xs text-foreground/80">{activity}</span>
                    </div>
                  ))}
                </div>
              </div>

              <Button className="w-full rounded-xl" variant="outline">
                View Full Memory Timeline
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}