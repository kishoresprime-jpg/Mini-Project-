import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldAlert, ArrowLeft } from 'lucide-react';
import { Button } from '../components/common/Button';

export const AccessDenied = () => {
  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] text-center p-6">
      <div className="h-16 w-16 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mb-4 dark:bg-rose-950/60 dark:text-rose-400">
        <ShieldAlert className="w-8 h-8" />
      </div>
      <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
        403 - Hierarchical Access Denied
      </h2>
      <p className="text-sm text-slate-500 max-w-md mt-2 dark:text-slate-400">
        You do not possess the necessary institutional role or department clearance to view or modify this resource.
      </p>
      <div className="mt-6">
        <Link to="/">
          <Button icon={ArrowLeft}>Return to Dashboard</Button>
        </Link>
      </div>
    </div>
  );
};

