import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { RiskBadge, PriorityBadge, StatusBadge } from '../components/common/Badge';
import { Loader } from '../components/common/Loader';
import {
  AlertTriangle,
  RefreshCw,
  Clock,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  ShieldAlert,
  Info,
} from 'lucide-react';

export const DelayRiskDashboard = () => {
  const { user, isAtLeastRole } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isRecalculating, setIsRecalculating] = useState(false);

  const fetchRiskData = async () => {
    try {
      setLoading(true);
      const res = await api.get('/ai/delay-risk-dashboard');
      setData(res.data.data);
    } catch (err) {
      console.error('Failed to load delay risk dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRiskData();
  }, []);

  const handleRecalculate = async () => {
    try {
      setIsRecalculating(true);
      await api.post('/ai/re-evaluate-risks');
      await fetchRiskData();
    } catch (err) {
      console.error('Recalculation failed:', err);
    } finally {
      setIsRecalculating(false);
    }
  };

  if (loading) {
    return <Loader message="Evaluating delay risks across active deliverables..." />;
  }

  const highRisk = data?.highRiskTasks || [];
  const mediumRisk = data?.mediumRiskTasks || [];
  const lowRisk = data?.lowRiskTasks || [];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center">
            <AlertTriangle className="w-5 h-5 mr-2 text-rose-500" />
            Task Delay-Risk Prediction & Proactive Escalation Radar
          </h2>
          <p className="text-xs text-slate-500 mt-1 dark:text-slate-400">
            Explainable delay estimation analyzing deadline proximity, velocity deficits, and blocked prerequisites
          </p>
        </div>

        {isAtLeastRole('hod') && (
          <Button
            onClick={handleRecalculate}
            variant="secondary"
            isLoading={isRecalculating}
            icon={RefreshCw}
          >
            Re-Evaluate All Risks
          </Button>
        )}
      </div>

      {/* Model Transparency Info */}
      <div className="flex items-center space-x-2 p-3 rounded-lg bg-amber-50 border border-amber-200 text-xs text-amber-900 dark:bg-amber-950/60 dark:border-amber-800 dark:text-amber-300">
        <Info className="w-4 h-4 shrink-0 text-amber-600" />
        <span>
          <strong>Algorithm Specification:</strong> Transparent multi-factor heuristic risk model evaluating linear progress lag vs elapsed duration, dependency bottlenecks, priority penalties, and deadline proximity.
        </span>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-l-4 border-l-rose-500">
          <p className="text-xs font-medium text-slate-500">High Delay-Risk Tasks</p>
          <h3 className="text-2xl font-bold text-rose-600 mt-1">{data?.highRiskCount || 0}</h3>
          <span className="text-[11px] text-rose-600 font-semibold">Immediate intervention required</span>
        </Card>

        <Card className="border-l-4 border-l-amber-500">
          <p className="text-xs font-medium text-slate-500">Medium Delay-Risk Tasks</p>
          <h3 className="text-2xl font-bold text-amber-600 mt-1">{data?.mediumRiskCount || 0}</h3>
          <span className="text-[11px] text-amber-600 font-semibold">Monitor progress cadence</span>
        </Card>

        <Card className="border-l-4 border-l-emerald-500">
          <p className="text-xs font-medium text-slate-500">Low Delay-Risk Tasks</p>
          <h3 className="text-2xl font-bold text-emerald-600 mt-1">{data?.lowRiskCount || 0}</h3>
          <span className="text-[11px] text-emerald-600 font-semibold">On-schedule execution</span>
        </Card>

        <Card className="border-l-4 border-l-slate-500">
          <p className="text-xs font-medium text-slate-500">Overdue Deliverables</p>
          <h3 className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
            {data?.overdueCount || 0}
          </h3>
          <span className="text-[11px] text-slate-500">Passed scheduled deadline</span>
        </Card>
      </div>

      {/* HIGH RISK TASKS SECTION */}
      <div className="space-y-4">
        <div className="flex items-center space-x-2">
          <div className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping"></div>
          <h3 className="text-sm font-bold uppercase tracking-wider text-rose-600 dark:text-rose-400">
            Critical & High Delay-Risk Deliverables ({highRisk.length})
          </h3>
        </div>

        {highRisk.length === 0 ? (
          <Card className="!p-6 text-center text-xs text-slate-500">
            No tasks currently flagged with high delay-risk.
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {highRisk.map((task) => (
              <Card
                key={task._id}
                className="border-2 border-rose-200 dark:border-rose-900/60 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-rose-50 text-rose-700 dark:bg-rose-950 dark:text-rose-300">
                      Score: {task.delayRisk?.score}%
                    </span>
                    <div className="flex items-center space-x-2">
                      <PriorityBadge priority={task.priority} />
                      <StatusBadge status={task.status} />
                    </div>
                  </div>

                  <Link
                    to={`/tasks/${task._id}`}
                    className="text-base font-bold text-slate-900 hover:text-primary-600 dark:text-white block mt-2"
                  >
                    {task.title}
                  </Link>

                  <div className="mt-2 text-xs text-slate-500 flex items-center space-x-2">
                    <span>Assignee: {task.assignedTo?.name || 'Unassigned'}</span>
                    <span>&bull;</span>
                    <span>Due: {new Date(task.deadline).toLocaleDateString()}</span>
                  </div>

                  {/* Diagnosis Reasons */}
                  <div className="mt-3 p-3 rounded-lg bg-rose-50/70 border border-rose-100 dark:bg-rose-950/30 dark:border-rose-900/40">
                    <span className="text-[10px] uppercase font-bold text-rose-800 dark:text-rose-300 tracking-wider block mb-1">
                      Identified Risk Drivers:
                    </span>
                    <ul className="list-disc list-inside space-y-1 text-xs text-rose-900 dark:text-rose-200">
                      {task.delayRisk?.reasons?.map((reason, idx) => (
                        <li key={idx}>{reason}</li>
                      ))}
                    </ul>
                  </div>

                  {/* Corrective Action */}
                  {task.delayRisk?.recommendedAction && (
                    <div className="mt-3 p-2.5 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-800 dark:bg-navy-950 dark:border-slate-800 dark:text-slate-200">
                      <span className="font-bold text-[10px] uppercase tracking-wider block text-slate-500 mb-0.5">
                        Recommended Corrective Action:
                      </span>
                      {task.delayRisk.recommendedAction}
                    </div>
                  )}
                </div>

                <div className="pt-3 mt-4 border-t border-slate-100 dark:border-slate-800 flex justify-end">
                  <Link
                    to={`/tasks/${task._id}`}
                    className="text-xs font-semibold text-primary-600 hover:text-primary-700 flex items-center"
                  >
                    Open Task Inspection &rarr;
                  </Link>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* MEDIUM RISK SECTION */}
      {mediumRisk.length > 0 && (
        <div className="space-y-4 pt-4">
          <h3 className="text-sm font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">
            Moderate Delay-Risk Deliverables ({mediumRisk.length})
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {mediumRisk.map((task) => (
              <Card key={task._id} className="border-amber-200 dark:border-amber-900/60">
                <div className="flex items-center justify-between">
                  <RiskBadge level="Medium" score={task.delayRisk?.score} />
                  <StatusBadge status={task.status} />
                </div>

                <Link
                  to={`/tasks/${task._id}`}
                  className="text-sm font-bold text-slate-900 hover:text-primary-600 dark:text-white block mt-2 line-clamp-1"
                >
                  {task.title}
                </Link>

                <p className="text-xs text-slate-500 mt-1">
                  Assignee: {task.assignedTo?.name || 'Unassigned'} &bull; Due:{' '}
                  {new Date(task.deadline).toLocaleDateString()}
                </p>

                <p className="text-xs text-slate-600 dark:text-slate-300 mt-2 line-clamp-2">
                  {task.delayRisk?.reasons?.[0] || 'Moderate schedule deficit.'}
                </p>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

