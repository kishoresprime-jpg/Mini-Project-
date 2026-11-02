import React, { useEffect, useState } from 'react';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { Modal } from '../components/common/Modal';
import { Loader } from '../components/common/Loader';
import { Building2, Plus, Users, FolderKanban, CheckSquare, Edit3, Trash2 } from 'lucide-react';

export const Departments = () => {
  const { user } = useAuth();
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [candidateHods, setCandidateHods] = useState([]);
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    description: '',
    hod: '',
  });

  const fetchDepartments = async () => {
    try {
      setLoading(true);
      const res = await api.get('/departments');
      setDepartments(res.data.data || []);
    } catch (err) {
      console.error('Failed to load departments:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchCandidates = async () => {
    try {
      const res = await api.get('/users?role=hod');
      setCandidateHods(res.data.data || []);
    } catch (err) {
      console.error('Failed to load candidate HODs:', err);
    }
  };

  useEffect(() => {
    fetchDepartments();
    if (user?.role === 'super_admin') {
      fetchCandidates();
    }
  }, []);

  const handleCreateDepartment = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setIsSubmitting(true);

    try {
      await api.post('/departments', formData);
      setIsModalOpen(false);
      setFormData({ name: '', code: '', description: '', hod: '' });
      fetchDepartments();
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Failed to create department.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">Academic & Administrative Units</h2>
          <p className="text-xs text-slate-500 mt-1 dark:text-slate-400">
            College department directories, operational oversight, and departmental leadership
          </p>
        </div>

        {user?.role === 'super_admin' && (
          <Button onClick={() => setIsModalOpen(true)} icon={Plus}>
            Create Department
          </Button>
        )}
      </div>

      {loading ? (
        <Loader message="Loading college departments..." />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {departments.map((dept) => (
            <Card key={dept._id} className="flex flex-col justify-between hover:shadow-md transition">
              <div>
                <div className="flex items-center justify-between">
                  <span className="px-2.5 py-1 rounded-md bg-primary-100 text-primary-800 text-xs font-bold uppercase tracking-wider dark:bg-primary-950 dark:text-primary-300">
                    {dept.code}
                  </span>
                  <span
                    className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold ${
                      dept.isActive
                        ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                        : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                    }`}
                  >
                    {dept.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>

                <h3 className="text-base font-bold text-slate-900 dark:text-white mt-3">
                  {dept.name}
                </h3>
                <p className="text-xs text-slate-500 line-clamp-2 mt-1 dark:text-slate-400">
                  {dept.description || 'No description provided.'}
                </p>

                {/* HOD Card */}
                <div className="mt-4 p-3 rounded-lg bg-slate-50 border border-slate-100 dark:bg-slate-800/60 dark:border-slate-800">
                  <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                    Head of Department (HOD)
                  </div>
                  <div className="text-xs font-semibold text-slate-800 dark:text-slate-200 mt-0.5">
                    {dept.hod?.name || 'Unassigned'}
                  </div>
                  {dept.hod?.email && (
                    <div className="text-[11px] text-slate-500">{dept.hod.email}</div>
                  )}
                </div>
              </div>

              {/* Stats Footer */}
              <div className="grid grid-cols-3 gap-2 border-t border-slate-100 pt-3 mt-4 text-center dark:border-slate-800">
                <div>
                  <div className="text-xs font-bold text-slate-900 dark:text-white">
                    {dept.memberCount || 0}
                  </div>
                  <div className="text-[10px] text-slate-400">Members</div>
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-900 dark:text-white">
                    {dept.projectCount || 0}
                  </div>
                  <div className="text-[10px] text-slate-400">Projects</div>
                </div>
                <div>
                  <div className="text-xs font-bold text-primary-600 dark:text-primary-400">
                    {dept.activeTaskCount || 0}
                  </div>
                  <div className="text-[10px] text-slate-400">Active Tasks</div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Create Department Modal */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Create New College Department">
        {errorMsg && (
          <div className="mb-4 rounded-lg bg-rose-50 p-3 text-xs text-rose-800 border border-rose-200 dark:bg-rose-950 dark:text-rose-300">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleCreateDepartment} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase text-slate-700 dark:text-slate-300 mb-1">
              Department Name *
            </label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full rounded-lg border border-slate-300 bg-white p-2 text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-primary-500 dark:border-slate-700 dark:bg-navy-950 dark:text-white"
              placeholder="e.g. Artificial Intelligence & Data Science"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase text-slate-700 dark:text-slate-300 mb-1">
              Department Code (Unique Uppercase) *
            </label>
            <input
              type="text"
              required
              value={formData.code}
              onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
              className="w-full rounded-lg border border-slate-300 bg-white p-2 text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-primary-500 dark:border-slate-700 dark:bg-navy-950 dark:text-white"
              placeholder="e.g. AIDS, EEE, MBA"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase text-slate-700 dark:text-slate-300 mb-1">
              Description / Scope
            </label>
            <textarea
              rows={3}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full rounded-lg border border-slate-300 bg-white p-2 text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-primary-500 dark:border-slate-700 dark:bg-navy-950 dark:text-white"
              placeholder="Academic disciplines, faculty scope, and research focus..."
            />
          </div>

          <div className="flex justify-end space-x-3 pt-4 border-t border-slate-100 dark:border-slate-800">
            <Button variant="secondary" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" isLoading={isSubmitting}>
              Create Department
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

