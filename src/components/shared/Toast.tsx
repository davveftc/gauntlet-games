"use client";
import { motion, AnimatePresence } from "framer-motion";
import { useEffect } from "react";

interface ToastProps {
  message: string;
  type?: "success" | "error" | "info";
  isVisible: boolean;
  onClose: () => void;
  duration?: number;
}

export default function Toast({
  message,
  type = "info",
  isVisible,
  onClose,
  duration = 3000,
}: ToastProps) {
  useEffect(() => {
    if (isVisible) {
      const timer = setTimeout(onClose, duration);
      return () => clearTimeout(timer);
    }
  }, [isVisible, onClose, duration]);

  const bgColor = {
    success: "bg-success/20 border-success/40",
    error: "bg-error/20 border-error/40",
    info: "bg-primary/20 border-primary/40",
  }[type];

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className={`fixed top-4 left-1/2 -translate-x-1/2 z-[100] px-6 py-3 rounded-xl border ${bgColor} backdrop-blur-xl text-white text-sm font-medium`}
        >
          {message}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
