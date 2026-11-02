import React from 'react';

export const Card = ({ children, className = '', title, subtitle, action }) => {
  return (
    <div
      className={`bg-white rounded-xl border border-slate-200/80 shadow-sm dark:bg-navy-900 dark:border-slate-800 ${className}`}
    >
      {(title || action) && (
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4 dark:border-slate-800/80">
          <div>
            {title && (
              <h3 className="text-base font-semibold text-slate-900 dark:text-white">
                {title}
              </h3>
            )}
            {subtitle && (
              <p className="text-xs text-slate-500 mt-0.5 dark:text-slate-400">
                {subtitle}
              </p>
            )}
          </div>
          {action && <div>{action}</div>}
        </div>
      )}
      <div className="p-6">{children}</div>
    </div>
  );
};

