import React from 'react';

export const StatusBadge = ({ status }) => {
  const styles = {
    'To Do': 'bg-slate-100 text-slate-700 border-slate-300 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700',
    'In Progress': 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/60 dark:text-blue-300 dark:border-blue-800',
    'Submitted for Review': 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800',
    Approved: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800',
    Rejected: 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/60 dark:text-rose-300 dark:border-rose-800',
    Completed: 'bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-900/60 dark:text-emerald-200 dark:border-emerald-700',
    Blocked: 'bg-red-50 text-red-700 border-red-200 dark:bg-red-950/60 dark:text-red-300 dark:border-red-800',
  };

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${
        styles[status] || styles['To Do']
      }`}
    >
      <span className="w-1.5 h-1.5 mr-1.5 rounded-full bg-current opacity-70"></span>
      {status}
    </span>
  );
};

export const PriorityBadge = ({ priority }) => {
  const styles = {
    Low: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400',
    Medium: 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300',
    High: 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300',
    Critical: 'bg-rose-100 text-rose-800 font-semibold dark:bg-rose-950 dark:text-rose-300',
  };

  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
        styles[priority] || styles.Medium
      }`}
    >
      {priority}
    </span>
  );
};

export const RiskBadge = ({ level = 'Low', score }) => {
  const styles = {
    Low: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800',
    Medium: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800',
    High: 'bg-rose-50 text-rose-700 border-rose-200 animate-pulse dark:bg-rose-950/60 dark:text-rose-300 dark:border-rose-800',
  };

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${
        styles[level] || styles.Low
      }`}
    >
      {level} Delay Risk {score !== undefined ? `(${score}%)` : ''}
    </span>
  );
};

export const RoleBadge = ({ role }) => {
  const labels = {
    super_admin: 'Super Admin',
    principal: 'Principal',
    hod: 'HOD',
    faculty: 'Faculty',
    staff: 'Staff',
    student: 'Student',
  };

  const styles = {
    super_admin: 'bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300',
    principal: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300',
    hod: 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300',
    faculty: 'bg-teal-100 text-teal-800 dark:bg-teal-950 dark:text-teal-300',
    staff: 'bg-orange-100 text-orange-800 dark:bg-orange-950 dark:text-orange-300',
    student: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300',
  };

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
        styles[role] || 'bg-slate-100 text-slate-800'
      }`}
    >
      {labels[role] || role}
    </span>
  );
};

