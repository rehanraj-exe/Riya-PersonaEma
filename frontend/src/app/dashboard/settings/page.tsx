"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Save, Mail, ShieldCheck, AlertCircle } from "lucide-react";

export default function SettingsPage() {
  const [imapUser, setImapUser] = useState("");
  const [imapPassword, setImapPassword] = useState("");
  const [hasSettings, setHasSettings] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{type: 'success' | 'error', text: string} | null>(null);

  useEffect(() => {
    fetch(`/api/settings?t=${Date.now()}`)
      .then(res => res.json())
      .then(data => {
        if (data.hasSettings) {
          setHasSettings(true);
          setImapUser(data.imapUser);
        }
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  const handleSave = async () => {
    setSaving(true);
    setMessage(null);
    try {
      const res = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imapUser, imapPassword })
      });
      if (!res.ok) throw new Error('Failed to save');
      
      setHasSettings(true);
      setMessage({ type: 'success', text: 'Settings saved successfully. Your agent will now sync this inbox.' });
    } catch (err) {
      setMessage({ type: 'error', text: 'Failed to save settings. Please try again.' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="p-8 text-center text-muted-foreground">Loading settings...</div>;

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
          className="glass rounded-2xl overflow-hidden border border-border"
        >
          <div className="p-6 border-b border-border bg-card/30 flex items-center gap-3">
            <Mail className="w-5 h-5 text-primary" />
            <div>
              <h3 className="font-semibold text-lg">IMAP Email Connection</h3>
              <p className="text-sm text-muted-foreground">The inbox your personal AI agent will monitor and process.</p>
            </div>
          </div>
          <div className="p-6 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Email Address (Gmail)</label>
                <input 
                  type="email" 
                  value={imapUser}
                  onChange={(e) => setImapUser(e.target.value)}
                  placeholder="you@gmail.com"
                  className="w-full bg-background border border-border rounded-md px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-shadow"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">App Password (16 characters)</label>
                <input 
                  type="password" 
                  value={imapPassword}
                  onChange={(e) => setImapPassword(e.target.value)}
                  placeholder={hasSettings ? "•••••••••••••••• (Saved)" : "Enter 16-char App Password"}
                  className="w-full bg-background border border-border rounded-md px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-shadow"
                />
              </div>
            </div>
            
            {hasSettings && (
              <div className="flex items-center gap-2 text-xs text-emerald-500 bg-emerald-500/10 p-3 rounded-md border border-emerald-500/20">
                <ShieldCheck className="w-4 h-4" />
                <span>Credentials saved securely in database. Inbox is ready for syncing.</span>
              </div>
            )}

            {message && (
              <div className={`flex items-center gap-2 text-xs p-3 rounded-md border ${message.type === 'success' ? 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20' : 'text-red-500 bg-red-500/10 border-red-500/20'}`}>
                {message.type === 'success' ? <ShieldCheck className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                <span>{message.text}</span>
              </div>
            )}
          </div>
        </motion.div>

        <div className="flex justify-end">
          <button 
            onClick={handleSave}
            disabled={saving || !imapUser || !imapPassword}
            className="flex items-center gap-2 bg-primary text-primary-foreground px-6 py-2 rounded-md font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            {saving ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </div>
    </div>
  );
}
