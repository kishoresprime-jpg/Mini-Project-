import React, { useEffect, useState } from 'react';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { Loader } from '../components/common/Loader';
import { FileSpreadsheet, Download, CheckCircle, Clock, AlertTriangle, FolderKanban } from 'lucide-react';

export const Reports = () => {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);

  useEffect(() => {
    const fetchReport = async () => {
      try {
        setLoading(true);
        const res = await api.get('/reports/summary');
        setData(res.data.data);
      } catch (err) {
        console.error('Failed to load reports:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchReport();
  }, []);

  const handleExportCsv = async (type) => {
    try {
      setIsExporting(true);
      const res = await api.get(`/reports/export-csv?type=${type}`, {
        responseType: 'blob',
      });

      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${type}_report_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      alert('Failed to export CSV report.');
    } finally {
      setIsExporting(false);
    }
  };

  if (loading) {
    return <Loader message="Generating institutional report summary..." />;
  }

  const counts = data?.taskStatusCounts || {};

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center">
            <FileSpreadsheet className="w-5 h-5 mr-2 text-primary-600" />
            Institutional Reports & Data Exports
          </h2>
          <p className="text-xs text-slate-500 mt-1 dark:text-slate-400">
            Export verified task logs, accreditation records, and department progress to CSV
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <Button
            onClick={() => handleExportCsv('tasks')}
            variant="primary"
            size="sm"
            isLoading={isExporting}
            icon={Download}
          >
            Export Tasks (CSV)
          </Button>
          <Button
            onClick={() => handleExportCsv('projects')}
            variant="outline"
            size="sm"
            isLoading={isExporting}
            icon={Download}
          >
            Export Projects (CSV)
          </Button>
        </div>
      </div>

      {/* Overview Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-l-4 border-l-primary-500">
          <p className="text-xs font-medium text-slate-500">Total Tracked Tasks</p>
          <h3 className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
            {data?.totalTasks || 0}
          </h3>
        </Card>

        <Card className="border-l-4 border-l-emerald-500">
          <p className="text-xs font-medium text-slate-500">Verified & Approved</p>
          <h3 className="text-2xl font-bold text-emerald-600 mt-1">
            {(counts['Completed'] || 0) + (counts['Approved'] || 0)}
          </h3>
        </Card>

        <Card className="border-l-4 border-l-amber-500">
          <p className="text-xs font-medium text-slate-500">In Progress / Review</p>
          <h3 className="text-2xl font-bold text-amber-600 mt-1">
            {(counts['In Progress'] || 0) + (counts['Submitted for Review'] || 0)}
          </h3>
        </Card>

        <Card className="border-l-4 border-l-rose-500">
          <p className="text-xs font-medium text-slate-500">Overdue Deliverables</p>
          <h3 className="text-2xl font-bold text-rose-600 mt-1">{data?.overdueCount || 0}</h3>
        </Card>
      </div>

      {/* Status Breakdown Table */}
      <Card title="Task Pipeline Distribution by Status">
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
          {Object.entries(counts).map(([status, count]) => (
            <div
              key={status}
              className="p-3 rounded-xl border border-slate-100 bg-slate-50 dark:bg-navy-950/40 dark:border-slate-800 text-center"
            >
              <div className="text-xl font-bold text-slate-800 dark:text-slate-200">{count}</div>
              <div className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold mt-1">
                {status}
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
};

