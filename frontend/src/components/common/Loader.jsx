import React from 'react';
import { Inbox, AlertCircle } from 'lucide-react';

export const Loader = ({ message = 'Loading records...' }) => (
  <div className="flex flex-col items-center justify-center p-12 text-slate-500">
    <div className="w-8 h-8 border-3 border-primary-600 border-t-transparent rounded-full animate-spin"></div>
    <p className="mt-3 text-sm font-medium">{message}</p>
  </div>
);

export const EmptyState = ({
  icon: Icon = Inbox,
  title = 'No items found',
  description = 'There are no records matching your criteria.',
  action,
}) => (
  <div className="flex flex-col items-center justify-center p-12 text-center rounded-xl border border-dashed border-slate-300 bg-slate-50/50 dark:border-slate-800 dark:bg-navy-950/30">
    <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 mb-3 dark:bg-slate-800 dark:text-slate-500">
      <Icon className="w-6 h-6" />
    </div>
    <h4 className="text-base font-semibold text-slate-800 dark:text-slate-200">{title}</h4>
    <p className="text-sm text-slate-500 max-w-sm mt-1 mb-4 dark:text-slate-400">
      {description}
    </p>
    {action}
  </div>
);

