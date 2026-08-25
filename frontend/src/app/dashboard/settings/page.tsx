"use client";

import { motion } from "framer-motion";
import { Save, Mail, Key, ShieldCheck, Bell } from "lucide-react";

export default function SettingsPage() {
  return (
    <div className="p-8 max-w-4xl mx-auto space-y-8">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground">Manage your credentials and agent configurations.</p>
      </motion.div>

      <div className="space-y-6">
        {/* IMAP Config */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="glass rounded-2xl overflow-hidden"
        >
          <div className="p-6 border-b border-border bg-card/30 flex items-center gap-3">
            <Mail className="w-5 h-5 text-primary" />
            <div>
              <h3 className="font-semibold text-lg">IMAP Email Connection</h3>
              <p className="text-sm text-muted-foreground">The inbox your agent will monitor and process.</p>
            </div>
          </div>
          <div className="p-6 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Email Address (IMAP_USER)</label>
                <input 
                  type="email" 
                  defaultValue="rehanrajhansakarra@gmail.com"
                  className="w-full bg-background border border-border rounded-md px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-shadow"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">App Password (IMAP_PASSWORD)</label>
                <input 
                  type="password" 
                  defaultValue="••••••••••••••••"
                  className="w-full bg-background border border-border rounded-md px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-shadow"
                />
              </div>
            </div>
            <div className="flex items-center gap-2 text-xs text-emerald-500 bg-emerald-500/10 p-3 rounded-md">
              <ShieldCheck className="w-4 h-4" />
              <span>Connection active and verified via Next.js Cron.</span>
            </div>
          </div>
        </motion.div>

        {/* AI Config */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="glass rounded-2xl overflow-hidden"
        >
          <div className="p-6 border-b border-border bg-card/30 flex items-center gap-3">
            <Key className="w-5 h-5 text-primary" />
            <div>
              <h3 className="font-semibold text-lg">AI Provider Configuration</h3>
              <p className="text-sm text-muted-foreground">Manage your Google Gemini API keys.</p>
            </div>
          </div>
          <div className="p-6 space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Gemini API Key</label>
              <input 
                type="password" 
                defaultValue="AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX"
                className="w-full bg-background border border-border rounded-md px-4 py-2 text-sm font-mono text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-shadow"
              />
            </div>
          </div>
        </motion.div>

        {/* Notifications */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="glass rounded-2xl overflow-hidden"
        >
          <div className="p-6 border-b border-border bg-card/30 flex items-center gap-3">
            <Bell className="w-5 h-5 text-primary" />
            <div>
              <h3 className="font-semibold text-lg">Notifications</h3>
              <p className="text-sm text-muted-foreground">Alerts when critical emails arrive.</p>
            </div>
          </div>
          <div className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium text-sm">Critical Priority Alerts</h4>
                <p className="text-xs text-muted-foreground">Send push notification to phone</p>
              </div>
              <button className="w-12 h-6 rounded-full bg-primary relative flex items-center px-1">
                <div className="w-4 h-4 rounded-full bg-white translate-x-6 transition-transform" />
              </button>
            </div>
          </div>
        </motion.div>

        <div className="flex justify-end">
          <button className="flex items-center gap-2 bg-primary text-primary-foreground px-6 py-2 rounded-md font-medium hover:opacity-90 transition-opacity">
            <Save className="w-4 h-4" />
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
}
