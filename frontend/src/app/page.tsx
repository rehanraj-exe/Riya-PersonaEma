"use client";

import { motion } from "framer-motion";
import { ArrowRight, Inbox, ShieldAlert, Sparkles, BarChart2 } from "lucide-react";
import Link from "next/link";

import { SignedIn, SignedOut, SignInButton, UserButton } from "@clerk/nextjs";

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-8 relative overflow-hidden bg-background">
      {/* Background gradients */}
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-primary/5 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] rounded-full bg-blue-500/5 blur-[120px] pointer-events-none" />
      
      <div className="absolute top-4 right-8 z-50">
        <SignedIn>
          <UserButton />
        </SignedIn>
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="max-w-4xl text-center space-y-8 z-10"
      >
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-secondary/50 border border-border/50 text-sm font-medium text-muted-foreground mb-4">
          <Sparkles className="w-4 h-4 text-primary" />
          <span>Introducing Riya AI 2.0</span>
        </div>

        <h1 className="text-5xl md:text-7xl font-bold tracking-tight text-foreground">
          Turn your chaotic inbox into an <span className="text-transparent bg-clip-text bg-gradient-to-r from-neutral-200 to-neutral-500">intelligent workflow.</span>
        </h1>
        
        <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
          Riya automatically reads, understands, classifies, and routes incoming emails to the right teams.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
          <SignedIn>
            <Link href="/dashboard" className="w-full sm:w-auto px-8 py-3 rounded-md bg-primary text-primary-foreground font-medium hover:opacity-90 transition-opacity flex items-center justify-center gap-2 shadow-lg shadow-primary/20">
              Go to Dashboard <ArrowRight className="w-4 h-4" />
            </Link>
          </SignedIn>
          <SignedOut>
            <SignInButton mode="modal">
              <button className="w-full sm:w-auto px-8 py-3 rounded-md bg-primary text-primary-foreground font-medium hover:opacity-90 transition-opacity flex items-center justify-center gap-2 shadow-lg shadow-primary/20">
                Sign In to Start
              </button>
            </SignInButton>
          </SignedOut>
          <button className="w-full sm:w-auto px-8 py-3 rounded-md bg-secondary text-secondary-foreground font-medium hover:bg-secondary/80 transition-colors border border-border">
            View Documentation
          </button>
        </div>
      </motion.div>

      <motion.div 
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, delay: 0.2, ease: "easeOut" }}
        className="mt-24 grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-5xl z-10"
      >
        <div className="glass p-6 rounded-2xl flex flex-col gap-4 hover:-translate-y-1 transition-transform duration-300">
          <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center">
            <Inbox className="w-6 h-6 text-blue-500" />
          </div>
          <h3 className="text-xl font-semibold">Smart Triage</h3>
          <p className="text-muted-foreground text-sm">Automatically categorizes incoming emails by intent, urgency, and sentiment.</p>
        </div>
        
        <div className="glass p-6 rounded-2xl flex flex-col gap-4 hover:-translate-y-1 transition-transform duration-300">
          <div className="w-12 h-12 rounded-xl bg-orange-500/10 flex items-center justify-center">
            <ShieldAlert className="w-6 h-6 text-orange-500" />
          </div>
          <h3 className="text-xl font-semibold">Priority Routing</h3>
          <p className="text-muted-foreground text-sm">Critical support tickets are instantly escalated. Spam and noise are filtered out.</p>
        </div>

        <div className="glass p-6 rounded-2xl flex flex-col gap-4 hover:-translate-y-1 transition-transform duration-300">
          <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center">
            <BarChart2 className="w-6 h-6 text-emerald-500" />
          </div>
          <h3 className="text-xl font-semibold">Deep Analytics</h3>
          <p className="text-muted-foreground text-sm">Track response times, AI accuracy, and department performance in real-time.</p>
        </div>
      </motion.div>
    </div>
  );
}
