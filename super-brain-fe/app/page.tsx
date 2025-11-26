"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Brain } from "lucide-react";
import { motion } from "framer-motion";

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem("token");
    const redirect = setTimeout(() => {
      if (token) router.push("/dashboard");
      else router.push("/auth/signin");
    }, 1500);

    return () => clearTimeout(redirect);
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background relative overflow-hidden p-6">
      {/* BIG BRUTAL BACKGROUND TEXT */}
      <motion.h1
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 0.05, y: 0 }}
        transition={{ duration: 0.8 }}
        className="absolute text-[26vw] font-heading select-none pointer-events-none text-foreground"
      >
        BRAIN
      </motion.h1>

      {/* CENTER CARD WITH GRADIENT BORDER */}
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="
          relative
          bg-secondary-background
          border-[4px]
          border-transparent
          rounded-[var(--radius-base)]
          shadow-[var(--shadow)]
          p-10
          text-center
          w-full max-w-lg
          backdrop-blur-sm
          before:absolute before:inset-0 before:-z-10 
          before:rounded-[inherit]
          before:bg-gradient-to-r before:from-[#FFBF00] before:to-[#0099FF]
        "
      >
        {/* ICON */}
        <motion.div
          initial={{ rotate: -10 }}
          animate={{ rotate: 0 }}
          transition={{ duration: 0.4 }}
          className="
            inline-flex items-center justify-center 
            p-6
            bg-main
            text-main-foreground
            rounded-[var(--radius-base)]
            border-[4px] border-border 
            shadow-[var(--shadow)]
          "
        >
          <Brain className="w-16 h-16" />
        </motion.div>

        {/* TITLE */}
        <h1 className="mt-6 text-foreground font-heading text-4xl">
          SuperBrain
        </h1>

        {/* SUBTEXT */}
        <p className="mt-3 text-foreground/70 font-base text-lg leading-relaxed">
          Your personal second brain —  
          <span className="font-heading"> captured, organized, searchable.</span>
        </p>

        {/* LOADING STATE */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, repeat: Infinity, repeatType: "reverse" }}
          className="mt-6 font-base text-md text-foreground/80"
        >
          Loading your workspace...
        </motion.p>
      </motion.div>
    </div>
  );
}
