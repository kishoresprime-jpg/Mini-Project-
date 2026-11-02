import React, { useState } from 'react';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { RoleBadge } from '../components/common/Badge';
import { User, Lock, Mail, Phone, Briefcase, Award, CheckCircle2 } from 'lucide-react';

export const Profile = () => {
  const { user, updateUserProfile } = useAuth();

  // Profile Form
  const [name, setName] = useState(user?.name || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [designation, setDesignation] = useState(user?.designation || '');
  const [skillsText, setSkillsText] = useState((user?.skills || []).join(', '));
  const [profileSuccess, setProfileSuccess] = useState('');
  const [profileError, setProfileError] = useState('');
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);

  // Password Form
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setProfileSuccess('');
    setProfileError('');
    setIsUpdatingProfile(true);

    try {
      const skillsArray = skillsText
        ? skillsText.split(',').map((s) => s.trim()).filter(Boolean)
        : [];

      const res = await api.put('/auth/update-profile', {
        name,
        phone,
        designation,
        skills: skillsArray,
      });

      updateUserProfile(res.data.user);
      setProfileSuccess('Profile updated successfully.');
    } catch (err) {
      setProfileError(err.response?.data?.message || 'Failed to update profile.');
    } finally {
      setIsUpdatingProfile(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setPasswordSuccess('');
    setPasswordError('');

    if (newPassword !== confirmPassword) {
      setPasswordError('New password and confirmation do not match.');
      return;
    }

    setIsUpdatingPassword(true);
    try {
      await api.put('/auth/change-password', {
        currentPassword,
        newPassword,
      });

      setPasswordSuccess('Password successfully updated.');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      setPasswordError(err.response?.data?.message || 'Failed to change password.');
    } finally {
      setIsUpdatingPassword(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h2 className="text-xl font-bold text-slate-900 dark:text-white">Account Profile & Capabilities</h2>
        <p className="text-xs text-slate-500 mt-1 dark:text-slate-400">
          Manage your personal details, recorded academic competencies, and access credentials
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* User Card */}
        <Card className="md:col-span-1 text-center flex flex-col items-center">
          <div className="h-20 w-20 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center font-bold text-2xl border-2 border-primary-200 dark:bg-primary-950 dark:text-primary-300 dark:border-primary-800">
            {user?.name?.charAt(0).toUpperCase()}
          </div>
          <h3 className="text-base font-bold text-slate-900 dark:text-white mt-3">{user?.name}</h3>
          <p className="text-xs text-slate-500 mt-0.5">{user?.email}</p>

          <div className="mt-2">
            <RoleBadge role={user?.role} />
          </div>

          <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800 w-full text-left space-y-2 text-xs">
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Department</span>
              <span className="font-medium text-slate-800 dark:text-slate-200">
                {user?.department?.name || 'All Institutional Units'}
              </span>
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Designation</span>
              <span className="font-medium text-slate-800 dark:text-slate-200">
                {user?.designation || 'Academic Member'}
              </span>
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 block">
                Completed Tasks Record
              </span>
              <span className="font-medium text-emerald-600">
                {user?.completedTasksCount || 0} verified deliverables
              </span>
            </div>
          </div>
        </Card>

        {/* Profile edit & Password changes on right */}
        <div className="md:col-span-2 space-y-6">
          {/* Edit Profile Form */}
          <Card title="Edit Personal Information">
            {profileSuccess && (
              <div className="mb-4 rounded-lg bg-emerald-50 p-3 text-xs text-emerald-800 border border-emerald-200 dark:bg-emerald-950 dark:text-emerald-300">
                {profileSuccess}
              </div>
            )}
            {profileError && (
              <div className="mb-4 rounded-lg bg-rose-50 p-3 text-xs text-rose-800 border border-rose-200 dark:bg-rose-950 dark:text-rose-300">
                {profileError}
              </div>
            )}

            <form onSubmit={handleUpdateProfile} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase text-slate-700 dark:text-slate-300 mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 bg-white p-2 text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-primary-500 dark:border-slate-700 dark:bg-navy-950 dark:text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-700 dark:text-slate-300 mb-1">
                    Phone Contact
                  </label>
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 bg-white p-2 text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-primary-500 dark:border-slate-700 dark:bg-navy-950 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-700 dark:text-slate-300 mb-1">
                    Designation
                  </label>
                  <input
                    type="text"
                    value={designation}
                    onChange={(e) => setDesignation(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 bg-white p-2 text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-primary-500 dark:border-slate-700 dark:bg-navy-950 dark:text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase text-slate-700 dark:text-slate-300 mb-1">
                  Skills & Subject Competencies (Used for AI Matcher)
                </label>
                <input
                  type="text"
                  value={skillsText}
                  onChange={(e) => setSkillsText(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 bg-white p-2 text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-primary-500 dark:border-slate-700 dark:bg-navy-950 dark:text-white"
                  placeholder="Machine Learning, React, Lab Infrastructure, Network Security..."
                />
              </div>

              <div className="flex justify-end pt-2">
                <Button type="submit" isLoading={isUpdatingProfile}>
                  Save Changes
                </Button>
              </div>
            </form>
          </Card>

          {/* Change Password Form */}
          <Card title="Security & Password Modification">
            {passwordSuccess && (
              <div className="mb-4 rounded-lg bg-emerald-50 p-3 text-xs text-emerald-800 border border-emerald-200 dark:bg-emerald-950 dark:text-emerald-300">
                {passwordSuccess}
              </div>
            )}
            {passwordError && (
              <div className="mb-4 rounded-lg bg-rose-50 p-3 text-xs text-rose-800 border border-rose-200 dark:bg-rose-950 dark:text-rose-300">
                {passwordError}
              </div>
            )}

            <form onSubmit={handleChangePassword} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase text-slate-700 dark:text-slate-300 mb-1">
                  Current Password *
                </label>
                <input
                  type="password"
                  required
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 bg-white p-2 text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-primary-500 dark:border-slate-700 dark:bg-navy-950 dark:text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-700 dark:text-slate-300 mb-1">
                    New Password *
                  </label>
                  <input
                    type="password"
                    required
                    minLength={6}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 bg-white p-2 text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-primary-500 dark:border-slate-700 dark:bg-navy-950 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-700 dark:text-slate-300 mb-1">
                    Confirm New Password *
                  </label>
                  <input
                    type="password"
                    required
                    minLength={6}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 bg-white p-2 text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-primary-500 dark:border-slate-700 dark:bg-navy-950 dark:text-white"
                  />
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <Button type="submit" variant="secondary" isLoading={isUpdatingPassword}>
                  Update Password
                </Button>
              </div>
            </form>
          </Card>
        </div>
      </div>
    </div>
  );
};

