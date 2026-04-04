import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { MessageCircle, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { motion, AnimatePresence } from "framer-motion";

export default function FloatingChatButton() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Don't show on chat page itself
  if (location.pathname === "/zuuchat") return null;

  return (
    <motion.button
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.9 }}
      onClick={() => {
        if (!user) navigate("/auth");
        else navigate("/zuuchat");
      }}
      className="fixed bottom-20 md:bottom-6 right-4 z-50 w-14 h-14 rounded-full bg-primary text-primary-foreground shadow-lg flex items-center justify-center hover:bg-primary/90 transition-colors"
      title="ZuuChat"
    >
      <MessageCircle size={24} />
    </motion.button>
  );
}
