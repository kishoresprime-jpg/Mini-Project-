import React, { useEffect, useState } from 'react';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { RoleBadge } from '../components/common/Badge';
import { Loader } from '../components/common/Loader';
import { EmptyState } from '../components/common/EmptyState';
import { FileText, Search, ShieldCheck } from 'lucide-react';

export const AuditLogs = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [actionFilter, setActionFilter] = useState('');

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const params = {};
      if (search) params.search = search;
      if (actionFilter) params.action = actionFilter;

      const res = await api.get('/audit-logs', { params });
      setLogs(res.data.data || []);
    } catch (err) {
      console.error('Failed to load audit logs:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [actionFilter]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center">
            <FileText className="w-5 h-5 mr-2 text-primary-600" />
            Institutional Compliance & Security Audit Trail
          </h2>
          <p className="text-xs text-slate-500 mt-1 dark:text-slate-400">
            Immutable log recording administrative modifications, workflow transitions, and authorization checks
          </p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <Card className="!p-4">
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <div className="relative flex-1 w-full">
            <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search audit descriptions, users, or action codes..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-lg border border-slate-300 bg-white py-2 pl-9 pr-3 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-primary-500 dark:border-slate-700 dark:bg-navy-950 dark:text-white"
            />
          </div>

          <select
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
            className="w-full sm:w-56 rounded-lg border border-slate-300 bg-white py-2 px-3 text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-primary-500 dark:border-slate-700 dark:bg-navy-950 dark:text-white"
          >
            <option value="">All Action Types</option>
            <option value="USER_LOGIN">User Login</option>
            <option value="TASK_CREATED">Task Created</option>
            <option value="TASK_STATUS_UPDATED">Task Status Updated</option>
            <option value="APPROVAL_APPROVED">Approval Approved</option>
            <option value="APPROVAL_REJECTED">Approval Rejected</option>
            <option value="PROJECT_CREATED">Project Created</option>
            <option value="WORKFLOW_STAGE_ADVANCED">Workflow Stage Advanced</option>
          </select>

          <Button onClick={fetchLogs} variant="secondary" size="sm">
            Search
          </Button>
        </div>
      </Card>

      {/* Logs Table */}
      <Card className="!p-0 overflow-hidden">
        {loading ? (
          <Loader message="Loading compliance audit logs..." />
        ) : logs.length === 0 ? (
          <EmptyState title="No audit entries" description="No actions match the specified criteria." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider dark:bg-slate-800/60 dark:border-slate-800 dark:text-slate-400">
                <tr>
                  <th className="px-6 py-3">Timestamp</th>
                  <th className="px-6 py-3">Action</th>
                  <th className="px-6 py-3">Performed By</th>
                  <th className="px-6 py-3">Target Resource</th>
                  <th className="px-6 py-3">Description</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {logs.map((log) => (
                  <tr key={log._id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition">
                    <td className="px-6 py-3.5 whitespace-nowrap text-slate-500">
                      {new Date(log.createdAt).toLocaleString()}
                    </td>
                    <td className="px-6 py-3.5 whitespace-nowrap">
                      <span className="font-mono text-[11px] font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300">
                        {log.action}
                      </span>
                    </td>
                    <td className="px-6 py-3.5 whitespace-nowrap">
                      <div className="font-semibold text-slate-900 dark:text-white">
                        {log.performedBy?.name || 'System'}
                      </div>
                      <RoleBadge role={log.userRole} />
                    </td>
                    <td className="px-6 py-3.5 whitespace-nowrap text-slate-600 dark:text-slate-300 font-medium">
                      {log.targetModel}
                    </td>
                    <td className="px-6 py-3.5 text-slate-700 dark:text-slate-300">
                      {log.description}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
};

