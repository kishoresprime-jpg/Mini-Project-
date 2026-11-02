import React, { useEffect, useState } from 'react';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { Modal } from '../components/common/Modal';
import { Loader } from '../components/common/Loader';
import { GitBranch, Plus, ArrowRight, ShieldCheck, CheckCircle, AlertCircle } from 'lucide-react';

export const WorkflowBuilder = () => {
  const { user } = useAuth();
  const [workflows, setWorkflows] = useState([]);
  const [selectedWorkflow, setSelectedWorkflow] = useState(null);
  const [loading, setLoading] = useState(true);

  // Modal State for new workflow
  const [isWfModalOpen, setIsWfModalOpen] = useState(false);
  const [wfFormData, setWfFormData] = useState({
    name: '',
    code: '',
    description: '',
    isDefault: false,
  });

  // Modal State for new stage
  const [isStageModalOpen, setIsStageModalOpen] = useState(false);
  const [stageFormData, setStageFormData] = useState({
    title: '',
    order: 1,
    description: '',
    requiredRole: 'hod',
    requiresApproval: true,
    mandatoryTasksCompleted: false,
    stageType: 'execution',
  });

  const fetchWorkflows = async () => {
    try {
      setLoading(true);
      const res = await api.get('/workflows');
      setWorkflows(res.data.data || []);
      if (res.data.data?.length > 0 && !selectedWorkflow) {
        setSelectedWorkflow(res.data.data[0]);
      }
    } catch (err) {
      console.error('Failed to load workflows:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWorkflows();
  }, []);

  const handleCreateWorkflow = async (e) => {
    e.preventDefault();
    try {
      const res = await api.post('/workflows', wfFormData);
      setIsWfModalOpen(false);
      setWfFormData({ name: '', code: '', description: '', isDefault: false });
      fetchWorkflows();
      setSelectedWorkflow(res.data.data);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to create workflow template.');
    }
  };

  const handleAddStage = async (e) => {
    e.preventDefault();
    try {
      await api.post(`/workflows/${selectedWorkflow._id}/stages`, stageFormData);
      setIsStageModalOpen(false);
      setStageFormData({
        title: '',
        order: (selectedWorkflow.stages?.length || 0) + 1,
        description: '',
        requiredRole: 'hod',
        requiresApproval: true,
        mandatoryTasksCompleted: false,
        stageType: 'execution',
      });
      // Refresh current workflow
      const updated = await api.get(`/workflows/${selectedWorkflow._id}`);
      setSelectedWorkflow(updated.data.data);
      fetchWorkflows();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to add workflow stage.');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">Workflow Automation Engine</h2>
          <p className="text-xs text-slate-500 mt-1 dark:text-slate-400">
            Define hierarchical multi-stage review pipelines and prerequisite rules
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <Button onClick={() => setIsWfModalOpen(true)} variant="secondary" icon={Plus}>
            New Template
          </Button>
          {selectedWorkflow && (
            <Button
              onClick={() => {
                setStageFormData((prev) => ({
                  ...prev,
                  order: (selectedWorkflow.stages?.length || 0) + 1,
                }));
                setIsStageModalOpen(true);
              }}
              icon={GitBranch}
            >
              Add Stage
            </Button>
          )}
        </div>
      </div>

      {loading ? (
        <Loader message="Loading workflow templates..." />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Templates list on left */}
          <Card className="lg:col-span-1 !p-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3 px-2 dark:text-slate-400">
              Templates
            </h3>
            <div className="space-y-1">
              {workflows.map((wf) => (
                <button
                  key={wf._id}
                  onClick={() => setSelectedWorkflow(wf)}
                  className={`w-full text-left p-3 rounded-lg text-xs transition ${
                    selectedWorkflow?._id === wf._id
                      ? 'bg-primary-50 text-primary-700 font-bold border border-primary-200 dark:bg-primary-950/60 dark:text-primary-300 dark:border-primary-800'
                      : 'text-slate-700 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-800/50'
                  }`}
                >
                  <div className="font-semibold">{wf.name}</div>
                  <div className="text-[10px] text-slate-400 mt-0.5 flex items-center justify-between">
                    <span>{wf.code}</span>
                    <span>{wf.stages?.length || 0} stages</span>
                  </div>
                </button>
              ))}
            </div>
          </Card>

          {/* Stages visual pipeline on right */}
          <div className="lg:col-span-3 space-y-4">
            {selectedWorkflow ? (
              <Card
                title={selectedWorkflow.name}
                subtitle={selectedWorkflow.description || 'Configured institutional stage hierarchy'}
              >
                <div className="relative pl-6 space-y-6 before:absolute before:left-3 before:top-2 before:bottom-2 before:w-0.5 before:bg-primary-200 dark:before:bg-primary-950">
                  {selectedWorkflow.stages?.length === 0 ? (
                    <p className="text-xs text-slate-400 py-6 text-center">
                      No stages defined yet. Click "Add Stage" above to configure.
                    </p>
                  ) : (
                    selectedWorkflow.stages?.map((stage, idx) => (
                      <div key={stage._id || idx} className="relative">
                        {/* Bullet point */}
                        <div className="absolute -left-6 top-1 flex h-6 w-6 items-center justify-center rounded-full bg-primary-600 text-white font-bold text-xs ring-4 ring-white dark:ring-navy-900">
                          {stage.order}
                        </div>

                        <div className="p-4 rounded-xl border border-slate-200 bg-white shadow-sm dark:bg-navy-900 dark:border-slate-800">
                          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                            <div>
                              <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                                {stage.title}
                              </h4>
                              <p className="text-xs text-slate-500 mt-0.5">
                                {stage.description || 'Standard stage execution.'}
                              </p>
                            </div>
                            <span className="px-2.5 py-1 rounded bg-slate-100 text-slate-700 font-semibold text-[11px] uppercase tracking-wider dark:bg-slate-800 dark:text-slate-300">
                              Requires: {stage.requiredRole}
                            </span>
                          </div>

                          <div className="mt-3 flex flex-wrap items-center gap-3 pt-3 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-500">
                            <span className="flex items-center">
                              <ShieldCheck className="w-3.5 h-3.5 mr-1 text-primary-500" />
                              {stage.requiresApproval ? 'Human Approval Required' : 'Auto Progression'}
                            </span>
                            {stage.mandatoryTasksCompleted && (
                              <span className="flex items-center text-amber-600">
                                <AlertCircle className="w-3.5 h-3.5 mr-1" />
                                Mandatory Tasks Must Be 100% Complete
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </Card>
            ) : null}
          </div>
        </div>
      )}

      {/* New Template Modal */}
      <Modal isOpen={isWfModalOpen} onClose={() => setIsWfModalOpen(false)} title="Create Workflow Template">
        <form onSubmit={handleCreateWorkflow} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase text-slate-700 dark:text-slate-300 mb-1">
              Workflow Template Name *
            </label>
            <input
              type="text"
              required
              value={wfFormData.name}
              onChange={(e) => setWfFormData({ ...wfFormData, name: e.target.value })}
              className="w-full rounded-lg border border-slate-300 bg-white p-2 text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-primary-500 dark:border-slate-700 dark:bg-navy-950 dark:text-white"
              placeholder="e.g. Department Capstone Project Review"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase text-slate-700 dark:text-slate-300 mb-1">
              Workflow Code *
            </label>
            <input
              type="text"
              required
              value={wfFormData.code}
              onChange={(e) => setWfFormData({ ...wfFormData, code: e.target.value.toUpperCase() })}
              className="w-full rounded-lg border border-slate-300 bg-white p-2 text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-primary-500 dark:border-slate-700 dark:bg-navy-950 dark:text-white"
              placeholder="e.g. WF-CAPSTONE-2026"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase text-slate-700 dark:text-slate-300 mb-1">
              Description
            </label>
            <textarea
              rows={3}
              value={wfFormData.description}
              onChange={(e) => setWfFormData({ ...wfFormData, description: e.target.value })}
              className="w-full rounded-lg border border-slate-300 bg-white p-2 text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-primary-500 dark:border-slate-700 dark:bg-navy-950 dark:text-white"
            />
          </div>

          <div className="flex justify-end space-x-3 pt-3 border-t border-slate-100 dark:border-slate-800">
            <Button variant="secondary" onClick={() => setIsWfModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit">Create Template</Button>
          </div>
        </form>
      </Modal>

      {/* New Stage Modal */}
      <Modal isOpen={isStageModalOpen} onClose={() => setIsStageModalOpen(false)} title="Add Workflow Stage">
        <form onSubmit={handleAddStage} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase text-slate-700 dark:text-slate-300 mb-1">
              Stage Title *
            </label>
            <input
              type="text"
              required
              value={stageFormData.title}
              onChange={(e) => setStageFormData({ ...stageFormData, title: e.target.value })}
              className="w-full rounded-lg border border-slate-300 bg-white p-2 text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-primary-500 dark:border-slate-700 dark:bg-navy-950 dark:text-white"
              placeholder="e.g. HOD Departmental Verification"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold uppercase text-slate-700 dark:text-slate-300 mb-1">
                Order Position
              </label>
              <input
                type="number"
                min={1}
                required
                value={stageFormData.order}
                onChange={(e) => setStageFormData({ ...stageFormData, order: Number(e.target.value) })}
                className="w-full rounded-lg border border-slate-300 bg-white p-2 text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-primary-500 dark:border-slate-700 dark:bg-navy-950 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase text-slate-700 dark:text-slate-300 mb-1">
                Required Authorization Role
              </label>
              <select
                value={stageFormData.requiredRole}
                onChange={(e) => setStageFormData({ ...stageFormData, requiredRole: e.target.value })}
                className="w-full rounded-lg border border-slate-300 bg-white p-2 text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-primary-500 dark:border-slate-700 dark:bg-navy-950 dark:text-white"
              >
                <option value="super_admin">Super Admin</option>
                <option value="principal">Principal</option>
                <option value="hod">HOD</option>
                <option value="faculty">Faculty</option>
                <option value="staff">Staff</option>
              </select>
            </div>
          </div>

          <div className="space-y-2 pt-2">
            <label className="flex items-center space-x-2 text-xs text-slate-700 dark:text-slate-300">
              <input
                type="checkbox"
                checked={stageFormData.requiresApproval}
                onChange={(e) =>
                  setStageFormData({ ...stageFormData, requiresApproval: e.target.checked })
                }
                className="rounded border-slate-300 text-primary-600 focus:ring-primary-500"
              />
              <span>Requires Human Approval to advance to next stage</span>
            </label>

            <label className="flex items-center space-x-2 text-xs text-slate-700 dark:text-slate-300">
              <input
                type="checkbox"
                checked={stageFormData.mandatoryTasksCompleted}
                onChange={(e) =>
                  setStageFormData({
                    ...stageFormData,
                    mandatoryTasksCompleted: e.target.checked,
                  })
                }
                className="rounded border-slate-300 text-primary-600 focus:ring-primary-500"
              />
              <span>Block advance until all stage tasks are 100% completed</span>
            </label>
          </div>

          <div className="flex justify-end space-x-3 pt-3 border-t border-slate-100 dark:border-slate-800">
            <Button variant="secondary" onClick={() => setIsStageModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit">Save Stage</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

