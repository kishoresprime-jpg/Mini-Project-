import React from 'react';
import { Link } from 'react-router-dom';
import { HelpCircle, ArrowLeft } from 'lucide-react';
import { Button } from '../components/common/Button';

export const NotFound = () => {
  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] text-center p-6">
      <div className="h-16 w-16 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center mb-4 dark:bg-slate-800 dark:text-slate-400">
        <HelpCircle className="w-8 h-8" />
      </div>
      <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
        404 - Page Not Found
      </h2>
      <p className="text-sm text-slate-500 max-w-md mt-2 dark:text-slate-400">
        The requested URL path does not exist in the College Workflow System.
      </p>
      <div className="mt-6">
        <Link to="/">
          <Button icon={ArrowLeft}>Back to Dashboard</Button>
        </Link>
      </div>
    </div>
  );
};

