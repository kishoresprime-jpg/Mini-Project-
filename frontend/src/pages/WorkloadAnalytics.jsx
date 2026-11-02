import React, { useEffect, useState } from 'react';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { RoleBadge } from '../components/common/Badge';
import { Loader } from '../components/common/Loader';
import {
  BarChart3,
  AlertCircle,
  CheckCircle,
  Users,
  Clock,
  TrendingUp,
  Scale,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';

export const WorkloadAnalytics = () => {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchWorkload = async () => {
    try {
      setLoading(true);
      const res = await api.get('/ai/workload-analytics');
      setData(res.data.data);
    } catch (err) {
      console.error('Failed to load workload analytics:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWorkload();
  }, []);

  if (loading) {
    return <Loader message="Computing department workload distributions..." />;
  }

  const userWorkloads = data?.userWorkloads || [];
  const overloadedUsers = data?.overloadedUsers || [];
  const availableUsers = data?.availableUsers || [];
  const departmentSummary = data?.departmentWorkloadSummary || [];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center">
            <Scale className="w-5 h-5 mr-2 text-primary-600" />
            Institutional Workload Balancing & Capacity Analytics
          </h2>
          <p className="text-xs text-slate-500 mt-1 dark:text-slate-400">
            Priority-weighted task loads, overload detection thresholds, and department allocation balance
          </p>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-l-4 border-l-primary-500">
          <p className="text-xs font-medium text-slate-500">Tracked Personnel</p>
          <h3 className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
            {userWorkloads.length}
          </h3>
          <span className="text-[11px] text-slate-500">Faculty & Staff</span>
        </Card>

        <Card className="border-l-4 border-l-rose-500">
          <p className="text-xs font-medium text-slate-500">Overloaded Members</p>
          <h3 className="text-2xl font-bold text-rose-600 mt-1">
            {data?.overloadedCount || 0}
          </h3>
          <span className="text-[11px] text-rose-600 font-medium">Require work redistribution</span>
        </Card>

        <Card className="border-l-4 border-l-emerald-500">
          <p className="text-xs font-medium text-slate-500">Available / Light Load</p>
          <h3 className="text-2xl font-bold text-emerald-600 mt-1">
            {data?.availableCount || 0}
          </h3>
          <span className="text-[11px] text-emerald-600 font-medium">Ready for task intake</span>
        </Card>

        <Card className="border-l-4 border-l-amber-500">
          <p className="text-xs font-medium text-slate-500">Capacity Balancing</p>
          <h3 className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
            {data?.overloadedCount === 0 ? 'Balanced' : 'Imbalanced'}
          </h3>
          <span className="text-[11px] text-slate-500">Threshold: 14 weighted pts</span>
        </Card>
      </div>

      {/* Department Workload Comparison Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card
          title="Personnel Weighted Workload Comparison"
          subtitle="Priority-weighted saturation score (Critical=5, High=3, Medium=2, Low=1)"
        >
          <div className="h-72 w-full pt-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={userWorkloads.slice(0, 8)}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                <XAxis dataKey="name" stroke="#888888" fontSize={11} interval={0} angle={-15} textAnchor="end" height={45} />
                <YAxis stroke="#888888" fontSize={12} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1e293b',
                    borderColor: '#334155',
                    borderRadius: '8px',
                    color: '#f8fafc',
                  }}
                />
                <Legend />
                <Bar dataKey="weightedScore" fill="#3b82f6" name="Weighted Load Score" radius={[4, 4, 0, 0]} />
                <Bar dataKey="activeTaskCount" fill="#10b981" name="Active Tasks Count" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Department-wide task allocation */}
        <Card
          title="Department Operational Load"
          subtitle="Total active tasks managed across departments"
        >
          <div className="h-72 w-full pt-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={departmentSummary}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                <XAxis dataKey="departmentCode" stroke="#888888" fontSize={12} />
                <YAxis stroke="#888888" fontSize={12} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1e293b',
                    borderColor: '#334155',
                    borderRadius: '8px',
                    color: '#f8fafc',
                  }}
                />
                <Bar dataKey="activeTaskCount" fill="#8b5cf6" name="Active Tasks" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      {/* Detailed Member Workload Table */}
      <Card title="Personnel Capacity & Saturation Breakdown" subtitle="Real-time audit of assigned task weights">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider dark:bg-slate-800/60 dark:border-slate-800 dark:text-slate-400">
              <tr>
                <th className="px-6 py-3">Member</th>
                <th className="px-6 py-3">Department</th>
                <th className="px-6 py-3">Active Tasks</th>
                <th className="px-6 py-3">Weighted Score</th>
                <th className="px-6 py-3">Estimated Hours</th>
                <th className="px-6 py-3">Capacity Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {userWorkloads.map((u) => {
                const isOverloaded = u.workloadStatus === 'Overloaded';
                const isLight = u.workloadStatus === 'Available / Low';

                return (
                  <tr key={u.userId} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition">
                    <td className="px-6 py-3.5">
                      <div className="font-semibold text-slate-900 dark:text-white">{u.name}</div>
                      <div className="text-[11px] text-slate-500">{u.designation || u.role}</div>
                    </td>
                    <td className="px-6 py-3.5 text-slate-600 dark:text-slate-300">
                      {u.department?.code || u.department?.name || 'Central'}
                    </td>
                    <td className="px-6 py-3.5 font-semibold text-slate-800 dark:text-slate-200">
                      {u.activeTaskCount}
                    </td>
                    <td className="px-6 py-3.5 font-bold text-primary-600 dark:text-primary-400">
                      {u.weightedScore} pts
                    </td>
                    <td className="px-6 py-3.5 text-slate-600 dark:text-slate-300">
                      {u.totalEstimatedHours} hrs
                    </td>
                    <td className="px-6 py-3.5">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          isOverloaded
                            ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                            : isLight
                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                            : 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300'
                        }`}
                      >
                        {u.workloadStatus}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};

