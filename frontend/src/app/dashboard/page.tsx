"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, Cell
} from "recharts";
import { Inbox, AlertCircle, CheckCircle2, Clock, Send } from "lucide-react";

export default function Dashboard() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [simulating, setSimulating] = useState(false);

  const fetchStats = async () => {
    try {
      const res = await fetch('/api/dashboard');
      const json = await res.json();
      setData(json);
    } catch (error) {
      console.error("Failed to fetch dashboard stats", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const simulateEmail = async () => {
    setSimulating(true);
    try {
      await fetch('/api/emails', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sender: "john.doe@acmecorp.com",
          subject: "Urgent: Payment failed on enterprise plan",
          body: "Hello, our credit card was declined for the recent renewal of our Enterprise Plan. Our systems are now locked out. Please help us resolve this immediately!"
        })
      });
      // Refresh stats
      await fetchStats();
    } catch (error) {
      console.error("Failed to simulate email", error);
    } finally {
      setSimulating(false);
    }
  };

  if (loading || !data) return <div className="p-8 flex justify-center"><div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" /></div>;

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Overview</h1>
          <p className="text-muted-foreground">Monitor your email triage performance in real-time.</p>
        </div>
        <button 
          onClick={simulateEmail}
          disabled={simulating}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
        >
          {simulating ? <div className="animate-spin w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full" /> : <Send className="w-4 h-4" />}
          Simulate Incoming Email
        </button>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          { title: "Total Emails", value: data.totalEmails, icon: Inbox, color: "text-blue-500", bg: "bg-blue-500/10" },
          { title: "Critical Priority", value: data.criticalCount, icon: AlertCircle, color: "text-red-500", bg: "bg-red-500/10" },
          { title: "Avg. Resolution", value: data.avgResolution, icon: Clock, color: "text-amber-500", bg: "bg-amber-500/10" },
          { title: "Resolved Today", value: data.resolvedToday, icon: CheckCircle2, color: "text-emerald-500", bg: "bg-emerald-500/10" }
        ].map((stat, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.1 }}
            className="glass p-6 rounded-2xl flex flex-col gap-2"
          >
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-muted-foreground">{stat.title}</span>
              <div className={`w-8 h-8 rounded-full ${stat.bg} flex items-center justify-center`}>
                <stat.icon className={`w-4 h-4 ${stat.color}`} />
              </div>
            </div>
            <div className="text-3xl font-bold">{stat.value}</div>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.4 }}
          className="glass p-6 rounded-2xl"
        >
          <h3 className="text-lg font-semibold mb-4">Email Traffic</h3>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data.traffic}>
                <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                <XAxis dataKey="name" stroke="#71717a" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#71717a" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={{ backgroundColor: '#0c0c0e', border: '1px solid #27272a', borderRadius: '8px' }} />
                <Line type="monotone" dataKey="emails" stroke="#3b82f6" strokeWidth={3} dot={false} />
                <Line type="monotone" dataKey="resolved" stroke="#10b981" strokeWidth={3} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.5 }}
          className="glass p-6 rounded-2xl"
        >
          <h3 className="text-lg font-semibold mb-4">Priority Distribution</h3>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.priorityDistribution} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#27272a" horizontal={false} />
                <XAxis type="number" stroke="#71717a" fontSize={12} tickLine={false} axisLine={false} allowDecimals={false} />
                <YAxis dataKey="name" type="category" stroke="#71717a" fontSize={12} tickLine={false} axisLine={false} width={80} />
                <Tooltip contentStyle={{ backgroundColor: '#0c0c0e', border: '1px solid #27272a', borderRadius: '8px' }} cursor={{fill: '#27272a', opacity: 0.4}}/>
                <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                  {data.priorityDistribution.map((entry: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={
                      entry.name === 'Critical' ? '#ef4444' :
                      entry.name === 'High' ? '#f97316' :
                      entry.name === 'Medium' ? '#eab308' : '#3b82f6'
                    } />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
