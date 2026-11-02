import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import { Layout } from './components/layout/Layout';
import { Loader } from './components/common/Loader';

// Pages
import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { Projects } from './pages/Projects';
import { Tasks } from './pages/Tasks';
import { TaskDetails } from './pages/TaskDetails';
import { WorkflowBuilder } from './pages/WorkflowBuilder';
import { ApprovalCenter } from './pages/ApprovalCenter';
import { AIAssignment } from './pages/AIAssignment';
import { WorkloadAnalytics } from './pages/WorkloadAnalytics';
import { DelayRiskDashboard } from './pages/DelayRiskDashboard';
import { Notifications } from './pages/Notifications';
import { Reports } from './pages/Reports';
import { AuditLogs } from './pages/AuditLogs';
import { Users } from './pages/Users';
import { Departments } from './pages/Departments';
import { Profile } from './pages/Profile';
import { Settings } from './pages/Settings';
import { DatabaseViewer } from './pages/DatabaseViewer';
import { AccessDenied } from './pages/AccessDenied';
import { NotFound } from './pages/NotFound';

// Protected Route wrapper with role check
const ProtectedRoute = ({ children, minRole = null }) => {
  const { user, loading, isAtLeastRole } = useAuth();

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50 dark:bg-navy-950">
        <Loader message="Authenticating session..." />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (minRole && !isAtLeastRole(minRole)) {
    return <Navigate to="/access-denied" replace />;
  }

  return children;
};

export default function App() {
  const { user, loading } = useAuth();

  return (
    <Routes>
      {/* Public Login Route */}
      <Route
        path="/login"
        element={user && !loading ? <Navigate to="/" replace /> : <Login />}
      />

      {/* Main Authenticated Layout */}
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Dashboard />} />
        <Route path="projects" element={<Projects />} />
        <Route path="tasks" element={<Tasks />} />
        <Route path="tasks/:id" element={<TaskDetails />} />
        <Route
          path="workflows"
          element={
            <ProtectedRoute minRole="hod">
              <WorkflowBuilder />
            </ProtectedRoute>
          }
        />
        <Route path="approvals" element={<ApprovalCenter />} />
        <Route
          path="ai-assignment"
          element={
            <ProtectedRoute minRole="faculty">
              <AIAssignment />
            </ProtectedRoute>
          }
        />
        <Route path="workload" element={<WorkloadAnalytics />} />
        <Route path="delay-risk" element={<DelayRiskDashboard />} />
        <Route path="notifications" element={<Notifications />} />
        <Route
          path="reports"
          element={
            <ProtectedRoute minRole="faculty">
              <Reports />
            </ProtectedRoute>
          }
        />
        <Route
          path="audit-logs"
          element={
            <ProtectedRoute minRole="hod">
              <AuditLogs />
            </ProtectedRoute>
          }
        />
        <Route
          path="users"
          element={
            <ProtectedRoute minRole="hod">
              <Users />
            </ProtectedRoute>
          }
        />
        <Route path="departments" element={<Departments />} />
        <Route path="database-viewer" element={<DatabaseViewer />} />
        <Route path="profile" element={<Profile />} />
        <Route path="settings" element={<Settings />} />
        <Route path="access-denied" element={<AccessDenied />} />
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  );
}

