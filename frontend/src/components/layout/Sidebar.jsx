import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  FolderKanban,
  CheckSquare,
  GitBranch,
  CheckCircle2,
  Cpu,
  BarChart3,
  AlertTriangle,
  FileText,
  Users,
  Building2,
  FileSpreadsheet,
  Settings,
  Database,
  ShieldAlert,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export const Sidebar = ({ isMobileOpen, onCloseMobile }) => {
  const { user, isAtLeastRole } = useAuth();

  const navSections = [
    {
      title: 'OVERVIEW',
      items: [
        { name: 'Dashboard', path: '/', icon: LayoutDashboard },
      ],
    },
    {
      title: 'CORE OPERATIONS',
      items: [
        { name: 'Projects', path: '/projects', icon: FolderKanban },
        { name: 'Task Board', path: '/tasks', icon: CheckSquare },
        { name: 'Approval Center', path: '/approvals', icon: CheckCircle2 },
        {
          name: 'Workflow Builder',
          path: '/workflows',
          icon: GitBranch,
          minRole: 'hod',
        },
      ],
    },
    {
      title: 'AI & INTELLIGENCE',
      items: [
        {
          name: 'AI Task Assignment',
          path: '/ai-assignment',
          icon: Cpu,
          minRole: 'faculty',
        },
        { name: 'Workload Balance', path: '/workload', icon: BarChart3 },
        { name: 'Delay-Risk Radar', path: '/delay-risk', icon: AlertTriangle },
        {
          name: 'Reports & Export',
          path: '/reports',
          icon: FileSpreadsheet,
          minRole: 'faculty',
        },
      ],
    },
    {
      title: 'ADMINISTRATION',
      items: [
        {
          name: 'User Accounts',
          path: '/users',
          icon: Users,
          minRole: 'hod',
        },
        { name: 'Departments', path: '/departments', icon: Building2 },
        { name: 'Database Explorer', path: '/database-viewer', icon: Database },
        {
          name: 'Audit Logs',
          path: '/audit-logs',
          icon: FileText,
          minRole: 'hod',
        },
        { name: 'System Settings', path: '/settings', icon: Settings },
      ],
    },
  ];

  const content = (
    <div className="flex h-full flex-col justify-between py-4">
      <div className="space-y-6 px-3">
        {navSections.map((section, idx) => {
          // Filter items by role
          const visibleItems = section.items.filter((item) => {
            if (!item.minRole) return true;
            return isAtLeastRole(item.minRole);
          });

          if (visibleItems.length === 0) return null;

          return (
            <div key={idx}>
              <h2 className="px-3 text-[11px] font-bold tracking-wider text-slate-500 uppercase dark:text-slate-400">
                {section.title}
              </h2>
              <div className="mt-2 space-y-1">
                {visibleItems.map((item) => {
                  const Icon = item.icon;
                  return (
                    <NavLink
                      key={item.path}
                      to={item.path}
                      onClick={onCloseMobile}
                      className={({ isActive }) =>
                        `flex items-center px-3 py-2 text-xs font-medium rounded-lg transition-colors ${
                          isActive
                            ? 'bg-primary-600 text-white shadow-sm shadow-primary-500/30 dark:bg-primary-600 dark:text-white'
                            : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800/80 dark:hover:text-slate-200'
                        }`
                      }
                    >
                      <Icon className="w-4 h-4 mr-2.5 shrink-0" />
                      <span>{item.name}</span>
                    </NavLink>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* Role Indicator Footer */}
      <div className="px-4 py-3 mx-3 rounded-lg bg-slate-100 dark:bg-slate-800/70 text-xs">
        <div className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
          Access Level
        </div>
        <div className="font-semibold text-slate-800 dark:text-slate-200 capitalize mt-0.5">
          {user?.role ? user.role.replace('_', ' ') : 'Guest'}
        </div>
        <div className="text-[11px] text-slate-500 truncate mt-0.5">
          {user?.department?.name || 'All Institutional Units'}
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex w-64 flex-col border-r border-slate-200/80 bg-white dark:border-slate-800 dark:bg-navy-900 overflow-y-auto shrink-0 transition-colors">
        {content}
      </aside>

      {/* Mobile Drawer */}
      {isMobileOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm"
            onClick={onCloseMobile}
          />
          <div className="fixed inset-y-0 left-0 w-64 bg-white shadow-2xl dark:bg-navy-900 flex flex-col z-50 overflow-y-auto">
            {content}
          </div>
        </div>
      )}
    </>
  );
};

