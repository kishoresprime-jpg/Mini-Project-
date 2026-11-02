import React, { useEffect, useState } from 'react';
import api from '../api/client';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { Settings as SettingsIcon, Server, Database, ShieldCheck, CheckCircle2 } from 'lucide-react';

export const Settings = () => {
  const [health, setHealth] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkHealth = async () => {
      try {
        const res = await api.get('/health');
        setHealth(res.data);
      } catch (err) {
        setHealth({ status: 'Disconnected', error: err.message });
      } finally {
        setLoading(false);
      }
    };

    checkHealth();
  }, []);

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center">
          <SettingsIcon className="w-5 h-5 mr-2 text-primary-600" />
          System Settings & Platform Architecture
        </h2>
        <p className="text-xs text-slate-500 mt-1 dark:text-slate-400">
          Environment configuration, server runtime parameters, and security policies
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Backend API Health */}
        <Card title="Backend API Cluster Health">
          <div className="space-y-3 text-xs">
            <div className="flex items-center justify-between p-3 rounded-lg bg-slate-50 dark:bg-navy-950/40">
              <span className="font-semibold text-slate-700 dark:text-slate-300">Server Status</span>
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                <span className="w-2 h-2 rounded-full bg-emerald-500 mr-1.5 animate-pulse"></span>
                {health?.status || 'Active'}
              </span>
            </div>

            <div className="flex items-center justify-between p-3 rounded-lg bg-slate-50 dark:bg-navy-950/40">
              <span className="font-semibold text-slate-700 dark:text-slate-300">Architecture</span>
              <span className="font-mono text-[11px]">MERN (Express REST + Socket.IO)</span>
            </div>

            <div className="flex items-center justify-between p-3 rounded-lg bg-slate-50 dark:bg-navy-950/40">
              <span className="font-semibold text-slate-700 dark:text-slate-300">Authentication</span>
              <span className="font-mono text-[11px]">HMAC-SHA256 JWT & bcrypt</span>
            </div>

            <div className="flex items-center justify-between p-3 rounded-lg bg-slate-50 dark:bg-navy-950/40">
              <span className="font-semibold text-slate-700 dark:text-slate-300">Real-Time Engine</span>
              <span className="font-mono text-[11px]">WebSocket / Socket.IO Rooms</span>
            </div>
          </div>
        </Card>

        {/* Database & Security Configuration */}
        <Card title="MongoDB & Security Directives">
          <div className="space-y-3 text-xs">
            <div className="flex items-center justify-between p-3 rounded-lg bg-slate-50 dark:bg-navy-950/40">
              <span className="font-semibold text-slate-700 dark:text-slate-300">Database Engine</span>
              <span className="font-mono text-[11px] text-primary-600 font-bold">MongoDB ODM (Mongoose)</span>
            </div>

            <div className="flex items-center justify-between p-3 rounded-lg bg-slate-50 dark:bg-navy-950/40">
              <span className="font-semibold text-slate-700 dark:text-slate-300">Data Isolation</span>
              <span className="text-[11px] text-emerald-600 font-semibold">Strict Hierarchical Enforcement</span>
            </div>

            <div className="flex items-center justify-between p-3 rounded-lg bg-slate-50 dark:bg-navy-950/40">
              <span className="font-semibold text-slate-700 dark:text-slate-300">Rate Limiter</span>
              <span className="text-[11px] text-slate-600 dark:text-slate-400">1000 req / 15 min per IP</span>
            </div>

            <div className="flex items-center justify-between p-3 rounded-lg bg-slate-50 dark:bg-navy-950/40">
              <span className="font-semibold text-slate-700 dark:text-slate-300">Security Headers</span>
              <span className="text-[11px] text-emerald-600 font-semibold">Helmet CSP Enabled</span>
            </div>
          </div>
        </Card>
      </div>

      {/* Database Setup Guide */}
      <Card title="MongoDB Connection & Setup Information">
        <div className="text-xs text-slate-600 dark:text-slate-300 space-y-3">
          <p>
            The backend connects directly to your persistent MongoDB instance defined in <code className="bg-slate-100 dark:bg-slate-800 px-1 py-0.5 rounded font-mono text-primary-600">backend/.env</code>.
          </p>
          <div className="p-3 bg-slate-900 text-slate-100 rounded-lg font-mono text-xs overflow-x-auto">
            # Local MongoDB instance (Default):<br />
            MONGODB_URI=mongodb://127.0.0.1:27017/college_workflow<br /><br />
            # MongoDB Atlas Free Cloud Cluster:<br />
            MONGODB_URI=mongodb+srv://&lt;username&gt;:&lt;password&gt;@cluster0.mongodb.net/college_workflow?retryWrites=true&amp;w=majority
          </div>
          <p className="text-[11px] text-slate-500">
            To populate the database with realistic demonstration accounts and academic projects across all 6 roles, run:
            <code className="bg-slate-100 dark:bg-slate-800 px-1 py-0.5 rounded font-mono text-primary-600 ml-1">npm run seed</code> in the project root.
          </p>
        </div>
      </Card>
    </div>
  );
};

