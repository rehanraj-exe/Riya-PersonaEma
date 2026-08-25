"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Filter, MoreHorizontal, Star, AlertCircle, Clock, CheckCircle2 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

const priorityColors = {
  Critical: "text-red-500 bg-red-500/10 border-red-500/20",
  High: "text-orange-500 bg-orange-500/10 border-orange-500/20",
  Medium: "text-amber-500 bg-amber-500/10 border-amber-500/20",
  Low: "text-blue-500 bg-blue-500/10 border-blue-500/20",
};

export default function InboxPage() {
  const [filter, setFilter] = useState("All");
  const [emails, setEmails] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchEmails = async () => {
      try {
        const res = await fetch('/api/emails');
        const data = await res.json();
        setEmails(data);
      } catch (error) {
        console.error("Failed to fetch emails", error);
      } finally {
        setLoading(false);
      }
    };
    fetchEmails();
  }, []);

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] p-8 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Inbox</h1>
          <p className="text-muted-foreground">Triage, assign, and resolve emails intelligently.</p>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input 
              type="text" 
              placeholder="Search emails..." 
              className="pl-9 pr-4 py-2 rounded-md bg-secondary border border-border text-sm focus:outline-none focus:ring-1 focus:ring-primary w-64"
            />
          </div>
          <button className="p-2 rounded-md bg-secondary border border-border hover:bg-secondary/80 text-muted-foreground hover:text-foreground transition-colors">
            <Filter className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="flex gap-2 mb-6 border-b border-border pb-2">
        {["All", "Pending", "Resolved", "Critical"].map(tab => (
          <button 
            key={tab}
            onClick={() => setFilter(tab)}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
              filter === tab ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:bg-secondary"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto pr-2 space-y-2">
        {loading ? (
          <div className="p-8 flex justify-center"><div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" /></div>
        ) : (
          <AnimatePresence>
            {emails
              .filter(e => filter === "All" || (filter === "Critical" && e.analysis?.priority === "Critical") || e.status === filter)
              .map((email, i) => {
                const pColor = priorityColors[(email.analysis?.priority as keyof typeof priorityColors) || 'Low'];
                return (
                  <motion.div
                    key={email.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ delay: i * 0.05 }}
                    className="group flex items-center gap-4 p-4 rounded-xl glass hover:bg-secondary/20 transition-all cursor-pointer border border-transparent hover:border-border"
                  >
                    <div className="flex-shrink-0 pt-1">
                      <button className="text-muted-foreground hover:text-yellow-500 transition-colors">
                        <Star className="w-5 h-5" />
                      </button>
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium truncate">{email.sender}</span>
                        <span className="text-xs text-muted-foreground shrink-0">
                          {formatDistanceToNow(new Date(email.receivedAt), { addSuffix: true })}
                        </span>
                      </div>
                      <p className="text-sm text-foreground truncate font-semibold">{email.subject}</p>
                      <div className="flex flex-wrap items-center gap-2 mt-2">
                        {email.analysis?.priority && (
                          <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${pColor}`}>
                            {email.analysis.priority}
                          </span>
                        )}
                        {email.analysis?.category && (
                          <span className="text-xs px-2 py-0.5 rounded-full bg-secondary text-secondary-foreground border border-border">
                            {email.analysis.category}
                          </span>
                        )}
                        {email.analysis?.confidenceScore && (
                          <span className="text-xs text-muted-foreground">
                            AI Confidence: {Math.round(email.analysis.confidenceScore * 100)}%
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      {email.status === "Pending" && (
                        <button className="p-2 rounded-md hover:bg-emerald-500/10 text-emerald-500 transition-colors tooltip-trigger" title="Resolve">
                          <CheckCircle2 className="w-5 h-5" />
                        </button>
                      )}
                      <button className="p-2 rounded-md hover:bg-secondary transition-colors text-muted-foreground" title="More">
                        <MoreHorizontal className="w-5 h-5" />
                      </button>
                    </div>
                  </motion.div>
                );
              })}
          </AnimatePresence>
        )}
      </div>
    </div>
  );
}
