import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { Modal } from '../components/common/Modal';
import { StatusBadge, PriorityBadge, RiskBadge, RoleBadge } from '../components/common/Badge';
import { Loader } from '../components/common/Loader';
import {
  Calendar,
  Clock,
  User,
  CheckCircle,
  AlertTriangle,
  Send,
  Paperclip,
  MessageSquare,
  ShieldAlert,
  ArrowLeft,
  CheckSquare,
  Sparkles,
} from 'lucide-react';

export const TaskDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, isAtLeastRole } = useAuth();

  const [task, setTask] = useState(null);
  const [loading, setLoading] = useState(true);
  const [commentText, setCommentText] = useState('');
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);

  // Status transition state
  const [newStatus, setNewStatus] = useState('');
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  // Submit for Review modal
  const [isSubmitModalOpen, setIsSubmitModalOpen] = useState(false);
  const [submissionNotes, setSubmissionNotes] = useState('');
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);

  // New subtask state
  const [newSubtaskTitle, setNewSubtaskTitle] = useState('');

  const fetchTaskDetails = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/tasks/${id}`);
      setTask(res.data.data);
      setNewStatus(res.data.data?.status || '');
    } catch (err) {
      console.error('Failed to load task details:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTaskDetails();
  }, [id]);

  const handleStatusChange = async (e) => {
    const updatedStatus = e.target.value;
    setNewStatus(updatedStatus);
    setIsUpdatingStatus(true);

    try {
      await api.patch(`/tasks/${id}/status`, { status: updatedStatus });
      fetchTaskDetails();
    } catch (err) {
      alert(err.response?.data?.message || 'Status transition denied.');
      setNewStatus(task.status);
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const handleToggleSubtask = async (subtaskId) => {
    try {
      await api.patch(`/tasks/${id}/subtasks/${subtaskId}`);
      fetchTaskDetails();
    } catch (err) {
      console.error('Failed to toggle subtask:', err);
    }
  };

  const handleAddSubtask = async (e) => {
    e.preventDefault();
    if (!newSubtaskTitle.trim()) return;

    try {
      await api.post(`/tasks/${id}/subtasks`, { title: newSubtaskTitle });
      setNewSubtaskTitle('');
      fetchTaskDetails();
    } catch (err) {
      console.error('Failed to add subtask:', err);
    }
  };

  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!commentText.trim()) return;

    setIsSubmittingComment(true);
    try {
      await api.post(`/tasks/${id}/comments`, { content: commentText });
      setCommentText('');
      fetchTaskDetails();
    } catch (err) {
      console.error('Failed to post comment:', err);
    } finally {
      setIsSubmittingComment(false);
    }
  };

  const handleSubmitForReview = async (e) => {
    e.preventDefault();
    setIsSubmittingReview(true);

    try {
      await api.post(`/tasks/${id}/submit`, { notes: submissionNotes });
      setIsSubmitModalOpen(false);
      setSubmissionNotes('');
      fetchTaskDetails();
      alert('Task submitted successfully! HOD has been notified for verification.');
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to submit task for review.');
    } finally {
      setIsSubmittingReview(false);
    }
  };

  if (loading) {
    return <Loader message="Fetching task records..." />;
  }

  if (!task) {
    return (
      <div className="text-center py-12">
        <p className="text-slate-500">Task record could not be found.</p>
        <Button onClick={() => navigate('/tasks')} className="mt-4">
          Back to Tasks
        </Button>
      </div>
    );
  }

  const isAssignee = task.assignedTo?._id?.toString() === user?._id?.toString();
  const isManager = ['super_admin', 'principal', 'hod'].includes(user?.role);
  const canModify = isAssignee || isManager;
  const delayRisk = task.delayRisk || {};

  return (
    <div className="space-y-6">
      {/* Back button & Action header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <button
          onClick={() => navigate(-1)}
          className="inline-flex items-center text-xs font-semibold text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
        >
          <ArrowLeft className="w-4 h-4 mr-1.5" />
          Back to list
        </button>

        <div className="flex items-center space-x-2">
          {/* Submit for review button for assignee */}
          {isAssignee && task.status !== 'Submitted for Review' && task.status !== 'Approved' && (
            <Button
              onClick={() => setIsSubmitModalOpen(true)}
              variant="success"
              size="sm"
              icon={Send}
            >
              Submit for Approval
            </Button>
          )}

          {/* AI Reassign button for managers */}
          {isAtLeastRole('faculty') && (
            <Link
              to={`/ai-assignment?taskId=${task._id}`}
              className="inline-flex items-center px-3 py-1.5 rounded-lg bg-primary-50 text-primary-700 text-xs font-semibold hover:bg-primary-100 border border-primary-200 dark:bg-primary-950/60 dark:text-primary-300 dark:border-primary-800"
            >
              <Sparkles className="w-3.5 h-3.5 mr-1" />
              AI Assignment Matcher
            </Link>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Main Task details, subtasks, and comments */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-800 uppercase dark:bg-slate-800 dark:text-slate-300">
                {task.project?.code || 'Task'}
              </span>
              <div className="flex items-center space-x-2">
                <PriorityBadge priority={task.priority} />
                <StatusBadge status={task.status} />
              </div>
            </div>

            <h1 className="text-xl font-bold text-slate-900 dark:text-white mt-3">
              {task.title}
            </h1>
            <p className="text-xs text-slate-600 dark:text-slate-300 mt-2 whitespace-pre-line leading-relaxed">
              {task.description || 'No detailed instructions provided.'}
            </p>

            {/* Status Transition Selector */}
            {canModify && (
              <div className="mt-6 p-4 rounded-xl bg-slate-50 border border-slate-200/80 dark:bg-navy-950/40 dark:border-slate-800">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                  Update Task Status
                </label>
                <div className="flex items-center space-x-3">
                  <select
                    value={newStatus}
                    onChange={handleStatusChange}
                    disabled={isUpdatingStatus}
                    className="flex-1 rounded-lg border border-slate-300 bg-white p-2 text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-primary-500 dark:border-slate-700 dark:bg-navy-900 dark:text-white"
                  >
                    <option value="To Do">To Do</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Blocked">Blocked</option>
                    {isManager && <option value="Approved">Approved (Manager)</option>}
                    {isManager && <option value="Rejected">Rejected (Manager)</option>}
                    <option value="Completed">Completed</option>
                  </select>
                  {isUpdatingStatus && (
                    <span className="text-xs text-slate-500 animate-pulse">Updating...</span>
                  )}
                </div>
              </div>
            )}
          </Card>

          {/* Subtasks Checklist */}
          <Card
            title={`Checklist & Subtasks (${task.subtasks?.filter((s) => s.isCompleted).length || 0}/${task.subtasks?.length || 0})`}
            subtitle="Mark checklist items as completed as you make progress"
          >
            <div className="space-y-2">
              {task.subtasks?.map((subtask) => (
                <div
                  key={subtask._id}
                  onClick={() => canModify && handleToggleSubtask(subtask._id)}
                  className={`flex items-center space-x-3 p-2.5 rounded-lg border transition ${
                    canModify ? 'cursor-pointer' : ''
                  } ${
                    subtask.isCompleted
                      ? 'bg-slate-50 border-slate-200 text-slate-400 line-through dark:bg-navy-950/20 dark:border-slate-800/80'
                      : 'bg-white border-slate-200 text-slate-800 dark:bg-navy-900 dark:border-slate-800 dark:text-slate-200'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={subtask.isCompleted}
                    onChange={() => {}}
                    className="rounded border-slate-300 text-primary-600 focus:ring-primary-500 w-4 h-4"
                  />
                  <span className="text-xs flex-1">{subtask.title}</span>
                </div>
              ))}

              {/* Add subtask inline */}
              {canModify && (
                <form onSubmit={handleAddSubtask} className="flex items-center space-x-2 pt-2">
                  <input
                    type="text"
                    value={newSubtaskTitle}
                    onChange={(e) => setNewSubtaskTitle(e.target.value)}
                    placeholder="Add a new checklist step..."
                    className="flex-1 rounded-lg border border-slate-300 bg-white p-2 text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-primary-500 dark:border-slate-700 dark:bg-navy-900 dark:text-white"
                  />
                  <Button type="submit" size="sm" variant="secondary">
                    Add Step
                  </Button>
                </form>
              )}
            </div>
          </Card>

          {/* Comments & Activity Thread */}
          <Card title="Activity & Comments" subtitle="Audit trail and communication thread">
            <div className="space-y-4">
              <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
                {task.comments?.length === 0 ? (
                  <p className="text-xs text-slate-400 py-4 text-center">No comments yet.</p>
                ) : (
                  task.comments?.map((comment) => (
                    <div
                      key={comment._id}
                      className="p-3 rounded-lg bg-slate-50 border border-slate-100 dark:bg-navy-950/40 dark:border-slate-800"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <span className="text-xs font-bold text-slate-900 dark:text-white">
                            {comment.author?.name}
                          </span>
                          <RoleBadge role={comment.author?.role} />
                        </div>
                        <span className="text-[10px] text-slate-400">
                          {new Date(comment.createdAt).toLocaleString()}
                        </span>
                      </div>
                      <p className="text-xs text-slate-700 dark:text-slate-300 mt-1.5 whitespace-pre-line">
                        {comment.content}
                      </p>
                    </div>
                  ))
                )}
              </div>

              {/* Add Comment Box */}
              <form onSubmit={handleAddComment} className="pt-2 flex flex-col space-y-2">
                <textarea
                  rows={2}
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  placeholder="Post an update, question, or approval note..."
                  className="w-full rounded-lg border border-slate-300 bg-white p-2.5 text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-primary-500 dark:border-slate-700 dark:bg-navy-900 dark:text-white"
                />
                <div className="flex justify-end">
                  <Button type="submit" size="sm" isLoading={isSubmittingComment} icon={MessageSquare}>
                    Post Update
                  </Button>
                </div>
              </form>
            </div>
          </Card>
        </div>

        {/* Right Col: Task Metadata & Delay-Risk Radar */}
        <div className="space-y-6">
          {/* AI Delay-Risk Card */}
          <Card className="border-t-4 border-t-amber-500">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center">
                <AlertTriangle className="w-3.5 h-3.5 mr-1 text-amber-500" />
                Delay-Risk Radar
              </span>
              <RiskBadge level={delayRisk.level || 'Low'} score={delayRisk.score} />
            </div>

            <div className="mt-3 space-y-2">
              <div className="text-xs text-slate-600 dark:text-slate-300">
                <span className="font-semibold block text-slate-800 dark:text-slate-200">
                  Diagnosis Reasons:
                </span>
                <ul className="list-disc list-inside mt-1 space-y-1 text-[11px] text-slate-500 dark:text-slate-400">
                  {delayRisk.reasons?.map((reason, idx) => (
                    <li key={idx}>{reason}</li>
                  ))}
                </ul>
              </div>

              {delayRisk.recommendedAction && (
                <div className="mt-3 p-2.5 rounded-lg bg-amber-50 border border-amber-200 dark:bg-amber-950/40 dark:border-amber-800 text-[11px] text-amber-800 dark:text-amber-300">
                  <span className="font-bold block">Recommended Action:</span>
                  {delayRisk.recommendedAction}
                </div>
              )}
            </div>
          </Card>

          {/* Assignment & Metadata */}
          <Card title="Task Metadata">
            <div className="space-y-3 text-xs">
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                  Assigned Personnel
                </span>
                <div className="font-semibold text-slate-800 dark:text-slate-200 mt-0.5">
                  {task.assignedTo?.name || 'Unassigned'}
                </div>
                {task.assignedTo?.email && (
                  <div className="text-[11px] text-slate-500">{task.assignedTo.email}</div>
                )}
              </div>

              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                  Assigned By
                </span>
                <div className="font-medium text-slate-700 dark:text-slate-300 mt-0.5">
                  {task.assignedBy?.name}
                </div>
              </div>

              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                  Target Deadline
                </span>
                <div className="font-medium text-slate-700 dark:text-slate-300 mt-0.5">
                  {new Date(task.deadline).toLocaleDateString()}
                </div>
              </div>

              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                  Estimated Effort
                </span>
                <div className="font-medium text-slate-700 dark:text-slate-300 mt-0.5">
                  {task.estimatedHours || 8} hours
                </div>
              </div>

              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                  Required Skill Keywords
                </span>
                <div className="flex flex-wrap gap-1 mt-1">
                  {task.requiredSkills?.map((skill, idx) => (
                    <span
                      key={idx}
                      className="px-2 py-0.5 rounded text-[10px] font-medium bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* Submit for Review Modal */}
      <Modal
        isOpen={isSubmitModalOpen}
        onClose={() => setIsSubmitModalOpen(false)}
        title="Submit Task for HOD Verification"
      >
        <form onSubmit={handleSubmitForReview} className="space-y-4">
          <p className="text-xs text-slate-600 dark:text-slate-300">
            Submitting this task marks it as <strong>Submitted for Review</strong> and triggers an approval ticket in the HOD / Project Manager Approval Center.
          </p>

          <div>
            <label className="block text-xs font-semibold uppercase text-slate-700 dark:text-slate-300 mb-1">
              Submission Deliverable Notes & Verification Links
            </label>
            <textarea
              rows={4}
              required
              value={submissionNotes}
              onChange={(e) => setSubmissionNotes(e.target.value)}
              className="w-full rounded-lg border border-slate-300 bg-white p-2.5 text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-primary-500 dark:border-slate-700 dark:bg-navy-950 dark:text-white"
              placeholder="Detail your completed milestones, Google Drive / Git links, or evidence documentation..."
            />
          </div>

          <div className="flex justify-end space-x-3 pt-3 border-t border-slate-100 dark:border-slate-800">
            <Button variant="secondary" onClick={() => setIsSubmitModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="success" isLoading={isSubmittingReview}>
              Confirm Submission
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

