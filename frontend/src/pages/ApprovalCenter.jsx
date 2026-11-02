import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { Modal } from '../components/common/Modal';
import { StatusBadge, RoleBadge } from '../components/common/Badge';
import { Loader } from '../components/common/Loader';
import { EmptyState } from '../components/common/EmptyState';
import { CheckCircle2, XCircle, Clock, ShieldCheck, MessageSquare, Check } from 'lucide-react';

export const ApprovalCenter = () => {
  const { user, isAtLeastRole } = useAuth();
  const [approvals, setApprovals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('Pending');

  // Review modal
  const [selectedApproval, setSelectedApproval] = useState(null);
  const [reviewAction, setReviewAction] = useState('Approved');
  const [reviewComments, setReviewComments] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchApprovals = async () => {
    try {
      setLoading(true);
      const res = await api.get('/approvals', {
        params: { status: statusFilter },
      });
      setApprovals(res.data.data || []);
    } catch (err) {
      console.error('Failed to load approvals:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApprovals();
  }, [statusFilter]);

  const handleReview = async (e) => {
    e.preventDefault();
    if (!selectedApproval) return;

    setIsSubmitting(true);
    try {
      await api.post(`/approvals/${selectedApproval._id}/review`, {
        action: reviewAction,
        comments: reviewComments,
      });

      setSelectedApproval(null);
      setReviewComments('');
      fetchApprovals();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to submit review.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">Institutional Approval Center</h2>
          <p className="text-xs text-slate-500 mt-1 dark:text-slate-400">
            Verify academic deliverables, review student and faculty submissions, and authorize workflow transitions
          </p>
        </div>

        {/* Status Filter Pills */}
        <div className="flex items-center space-x-1 p-1 bg-slate-100 rounded-lg dark:bg-slate-800">
          {['Pending', 'Approved', 'Rejected', 'all'].map((status) => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition capitalize ${
                statusFilter === status
                  ? 'bg-white text-slate-900 shadow-sm dark:bg-navy-900 dark:text-white'
                  : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
              }`}
            >
              {status === 'all' ? 'All Records' : status}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <Loader message="Loading approval tickets..." />
      ) : approvals.length === 0 ? (
        <EmptyState
          title={`No ${statusFilter.toLowerCase()} requests`}
          description="Everything has been reviewed or no submissions match the filter."
        />
      ) : (
        <div className="space-y-4">
          {approvals.map((appr) => (
            <Card key={appr._id} className="hover:shadow-md transition">
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center space-x-2">
                    <span className="text-xs font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                      {appr.type === 'task_submission' ? 'Task Submission' : 'Workflow Stage'}
                    </span>
                    <span className="text-xs text-slate-500">
                      {appr.department?.code} Department
                    </span>
                    <StatusBadge status={appr.status} />
                  </div>

                  <h3 className="text-base font-bold text-slate-900 dark:text-white mt-2">
                    {appr.task?.title || appr.project?.title || 'Academic Deliverable'}
                  </h3>

                  {appr.task?.project && (
                    <p className="text-xs text-slate-500 mt-0.5">
                      Project: {appr.task.project.title}
                    </p>
                  )}

                  {/* Submitter Info */}
                  <div className="flex items-center space-x-2 mt-3 text-xs text-slate-600 dark:text-slate-300">
                    <span className="font-semibold">{appr.submittedBy?.name}</span>
                    <RoleBadge role={appr.submittedBy?.role} />
                    <span>&bull;</span>
                    <span className="text-slate-400">
                      Submitted on {new Date(appr.createdAt).toLocaleString()}
                    </span>
                  </div>

                  {/* Submission Notes */}
                  {appr.submissionNotes && (
                    <div className="mt-3 p-3 rounded-lg bg-slate-50 border border-slate-100 text-xs text-slate-700 dark:bg-navy-950/40 dark:border-slate-800 dark:text-slate-300">
                      <span className="font-bold text-[10px] uppercase text-slate-400 tracking-wider block mb-1">
                        Submitter Notes & Evidence
                      </span>
                      {appr.submissionNotes}
                    </div>
                  )}

                  {/* Reviewer Comments (if already reviewed) */}
                  {appr.status !== 'Pending' && (
                    <div className="mt-3 p-3 rounded-lg bg-slate-100 text-xs text-slate-800 dark:bg-slate-800/80 dark:text-slate-200">
                      <span className="font-bold text-[10px] uppercase text-slate-500 tracking-wider block mb-0.5">
                        Reviewed by {appr.reviewedBy?.name || 'Administrator'} on{' '}
                        {appr.reviewedAt ? new Date(appr.reviewedAt).toLocaleDateString() : ''}
                      </span>
                      {appr.reviewerComments || 'No reviewer comments entered.'}
                    </div>
                  )}
                </div>

                {/* Action buttons (only for pending tickets and authorized roles) */}
                {appr.status === 'Pending' && isAtLeastRole('hod') && (
                  <div className="flex sm:flex-col items-center gap-2 shrink-0">
                    <Button
                      variant="success"
                      size="sm"
                      onClick={() => {
                        setSelectedApproval(appr);
                        setReviewAction('Approved');
                      }}
                      icon={Check}
                    >
                      Approve
                    </Button>
                    <Button
                      variant="danger"
                      size="sm"
                      onClick={() => {
                        setSelectedApproval(appr);
                        setReviewAction('Rejected');
                      }}
                      icon={XCircle}
                    >
                      Reject
                    </Button>
                  </div>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Review Confirmation Modal */}
      <Modal
        isOpen={!!selectedApproval}
        onClose={() => setSelectedApproval(null)}
        title={`${reviewAction === 'Approved' ? 'Sign-Off & Approve' : 'Reject & Request Revisions'}`}
      >
        <form onSubmit={handleReview} className="space-y-4">
          <p className="text-xs text-slate-600 dark:text-slate-300">
            You are about to mark submission for <strong>"{selectedApproval?.task?.title}"</strong> as{' '}
            <span
              className={`font-bold ${
                reviewAction === 'Approved' ? 'text-emerald-600' : 'text-rose-600'
              }`}
            >
              {reviewAction}
            </span>
            .
          </p>

          <div>
            <label className="block text-xs font-semibold uppercase text-slate-700 dark:text-slate-300 mb-1">
              Reviewer Feedback & Remarks (Sent to Submitter)
            </label>
            <textarea
              rows={3}
              value={reviewComments}
              onChange={(e) => setReviewComments(e.target.value)}
              className="w-full rounded-lg border border-slate-300 bg-white p-2.5 text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-primary-500 dark:border-slate-700 dark:bg-navy-950 dark:text-white"
              placeholder={
                reviewAction === 'Approved'
                  ? 'Criteria satisfied. Verified for project dossier.'
                  : 'Specify deficiencies or additional documentation needed...'
              }
            />
          </div>

          <div className="flex justify-end space-x-3 pt-3 border-t border-slate-100 dark:border-slate-800">
            <Button variant="secondary" onClick={() => setSelectedApproval(null)}>
              Cancel
            </Button>
            <Button
              type="submit"
              variant={reviewAction === 'Approved' ? 'success' : 'danger'}
              isLoading={isSubmitting}
            >
              Confirm {reviewAction}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

