import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { RoleBadge, PriorityBadge } from '../components/common/Badge';
import { Loader } from '../components/common/Loader';
import { Sparkles, Check, ArrowRight, UserCheck, AlertCircle, Info } from 'lucide-react';

export const AIAssignment = () => {
  const { user } = useAuth();
  const location = useLocation();
  const queryTaskId = new URLSearchParams(location.search).get('taskId');

  const [tasks, setTasks] = useState([]);
  const [selectedTaskId, setSelectedTaskId] = useState(queryTaskId || '');
  const [selectedTask, setSelectedTask] = useState(null);
  const [recommendations, setRecommendations] = useState([]);
  const [methodInfo, setMethodInfo] = useState('');
  const [loading, setLoading] = useState(false);
  const [assigningUserId, setAssigningUserId] = useState(null);
  const [overrideReason, setOverrideReason] = useState('');

  // Fetch active tasks for dropdown
  useEffect(() => {
    const fetchTasks = async () => {
      try {
        const res = await api.get('/tasks?status=To Do');
        setTasks(res.data.data || []);
      } catch (err) {
        console.error('Failed to load tasks:', err);
      }
    };
    fetchTasks();
  }, []);

  // When selectedTaskId changes, load task and run AI recommendation
  useEffect(() => {
    if (!selectedTaskId) {
      setRecommendations([]);
      setSelectedTask(null);
      return;
    }

    const runRecommendation = async () => {
      try {
        setLoading(true);
        // Fetch full task details
        const taskRes = await api.get(`/tasks/${selectedTaskId}`);
        setSelectedTask(taskRes.data.data);

        // Fetch AI recommendations
        const aiRes = await api.post('/ai/recommend-assignees', {
          taskId: selectedTaskId,
          departmentId: taskRes.data.data.department?._id,
          requiredSkills: taskRes.data.data.requiredSkills,
          priority: taskRes.data.data.priority,
        });

        setRecommendations(aiRes.data.data?.recommendations || []);
        setMethodInfo(aiRes.data.data?.modelDescription || '');
      } catch (err) {
        console.error('AI recommendation failed:', err);
      } finally {
        setLoading(false);
      }
    };

    runRecommendation();
  }, [selectedTaskId]);

  const handleApplyAssignment = async (candidateUserId, isTopCandidate) => {
    setAssigningUserId(candidateUserId);
    try {
      await api.post('/ai/apply-recommendation', {
        taskId: selectedTaskId,
        userId: candidateUserId,
        isOverridden: !isTopCandidate,
        reason: isTopCandidate
          ? 'Accepted AI recommendation highest match score.'
          : overrideReason || 'Manual manager override based on departmental priority.',
      });

      alert('Assignee updated and notified successfully!');
      // Re-fetch task
      const updated = await api.get(`/tasks/${selectedTaskId}`);
      setSelectedTask(updated.data.data);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to apply assignment.');
    } finally {
      setAssigningUserId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center">
            <Sparkles className="w-5 h-5 mr-2 text-primary-600" />
            AI Task Assignment Recommendation Engine
          </h2>
          <p className="text-xs text-slate-500 mt-1 dark:text-slate-400">
            Multi-criteria heuristic ranking analyzing skill fit, active workload saturation, and completion history
          </p>
        </div>
      </div>

      {/* Task Selection Card */}
      <Card>
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
              Select Task for AI Matching
            </label>
            <select
              value={selectedTaskId}
              onChange={(e) => setSelectedTaskId(e.target.value)}
              className="w-full rounded-lg border border-slate-300 bg-white p-2.5 text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-primary-500 dark:border-slate-700 dark:bg-navy-950 dark:text-white"
            >
              <option value="">-- Choose a task from the queue --</option>
              {tasks.map((t) => (
                <option key={t._id} value={t._id}>
                  [{t.priority}] {t.title} ({t.project?.code})
                </option>
              ))}
            </select>
          </div>

          {selectedTask && (
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 dark:bg-navy-950/40 dark:border-slate-800 grid grid-cols-1 sm:grid-cols-4 gap-4 text-xs">
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Current Assignee</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">
                  {selectedTask.assignedTo?.name || 'Unassigned'}
                </span>
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Priority</span>
                <PriorityBadge priority={selectedTask.priority} />
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Department</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">
                  {selectedTask.department?.name}
                </span>
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Required Skills</span>
                <div className="flex flex-wrap gap-1 mt-0.5">
                  {selectedTask.requiredSkills?.map((s, idx) => (
                    <span key={idx} className="px-1.5 py-0.5 rounded text-[10px] bg-slate-200 dark:bg-slate-700">
                      {s}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </Card>

      {/* Model Disclaimer Pill */}
      {methodInfo && (
        <div className="flex items-center space-x-2 p-3 rounded-lg bg-blue-50 border border-blue-200 text-xs text-blue-900 dark:bg-blue-950/60 dark:border-blue-800 dark:text-blue-300">
          <Info className="w-4 h-4 shrink-0 text-blue-600" />
          <span>
            <strong>Scoring Methodology:</strong> {methodInfo}
          </span>
        </div>
      )}

      {/* Recommendations List */}
      {loading ? (
        <Loader message="Evaluating candidate skill sets, active task queues, and performance metrics..." />
      ) : recommendations.length === 0 ? (
        selectedTaskId ? (
          <p className="text-xs text-slate-500 py-8 text-center">No matching candidates found for this task's department.</p>
        ) : null
      ) : (
        <div className="space-y-4">
          <h3 className="text-sm font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300">
            Ranked Candidate Assignees ({recommendations.length} evaluated)
          </h3>

          <div className="space-y-4">
            {recommendations.map((rec, idx) => {
              const isTop = idx === 0;
              const isCurrentlyAssigned =
                selectedTask?.assignedTo?._id?.toString() === rec.user._id.toString();

              return (
                <Card
                  key={rec.user._id}
                  className={`transition ${
                    isTop
                      ? 'border-2 border-primary-500 shadow-md ring-1 ring-primary-500/20'
                      : 'border-slate-200'
                  }`}
                >
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        {isTop && (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-primary-600 text-white uppercase tracking-wider flex items-center">
                            <Sparkles className="w-3 h-3 mr-1" />
                            Top Recommendation
                          </span>
                        )}
                        <h4 className="text-base font-bold text-slate-900 dark:text-white">
                          {rec.user.name}
                        </h4>
                        <RoleBadge role={rec.user.role} />
                      </div>

                      <p className="text-xs text-slate-500 mt-0.5">
                        {rec.user.designation || 'Faculty Member'} &bull; {rec.user.email}
                      </p>

                      {/* Explainable Reasons */}
                      <div className="mt-3 space-y-1">
                        <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                          Evaluation Breakdown:
                        </span>
                        <ul className="space-y-1 mt-1">
                          {rec.reasons.map((reason, rIdx) => (
                            <li
                              key={rIdx}
                              className="text-xs text-slate-700 dark:text-slate-300 flex items-start space-x-1.5"
                            >
                              <span className="text-emerald-500 font-bold">&bull;</span>
                              <span>{reason}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      {/* Skills badge list */}
                      <div className="mt-3 flex flex-wrap gap-1">
                        {rec.user.skills?.map((s, sIdx) => (
                          <span
                            key={sIdx}
                            className="px-2 py-0.5 rounded text-[10px] bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300"
                          >
                            {s}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Compatibility Score Circle and Assignment Button */}
                    <div className="flex flex-col items-center justify-center p-4 rounded-xl bg-slate-50 border border-slate-100 dark:bg-navy-950/60 dark:border-slate-800 shrink-0 min-w-[150px]">
                      <div className="text-3xl font-extrabold text-primary-600 dark:text-primary-400">
                        {rec.score}%
                      </div>
                      <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                        Match Score
                      </span>

                      <div className="text-[11px] text-slate-500 mt-1">
                        Active Tasks: {rec.activeTasksCount}
                      </div>

                      <div className="mt-4 w-full">
                        {isCurrentlyAssigned ? (
                          <span className="block text-center text-xs font-bold text-emerald-600 py-1.5">
                            Currently Assigned
                          </span>
                        ) : (
                          <Button
                            variant={isTop ? 'primary' : 'outline'}
                            size="sm"
                            className="w-full"
                            isLoading={assigningUserId === rec.user._id}
                            onClick={() => handleApplyAssignment(rec.user._id, isTop)}
                          >
                            {isTop ? 'Accept AI Choice' : 'Select Candidate'}
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

