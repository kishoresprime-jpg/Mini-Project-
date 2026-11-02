import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/client';
import { useSocket } from '../context/SocketContext';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { Loader } from '../components/common/Loader';
import { EmptyState } from '../components/common/EmptyState';
import { Bell, CheckCheck, Trash2, Clock, ExternalLink } from 'lucide-react';

export const Notifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [unreadOnly, setUnreadOnly] = useState(false);
  const { markAllReadLocally, decrementUnread } = useSocket();

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const params = {};
      if (unreadOnly) params.isRead = false;

      const res = await api.get('/notifications', { params });
      setNotifications(res.data.data || []);
    } catch (err) {
      console.error('Failed to load notifications:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, [unreadOnly]);

  const handleMarkAsRead = async (id) => {
    try {
      await api.patch(`/notifications/${id}/read`);
      decrementUnread();
      fetchNotifications();
    } catch (err) {
      console.error(err);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await api.patch('/notifications/mark-all-read');
      markAllReadLocally();
      fetchNotifications();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (id) => {
    try {
      await api.delete(`/notifications/${id}`);
      fetchNotifications();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center">
            <Bell className="w-5 h-5 mr-2 text-primary-600" />
            Institutional Alerts & Notifications
          </h2>
          <p className="text-xs text-slate-500 mt-1 dark:text-slate-400">
            Real-time workflow milestones, assignment dispatches, and deadline alerts
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setUnreadOnly(!unreadOnly)}
          >
            {unreadOnly ? 'Show All' : 'Show Unread Only'}
          </Button>

          <Button
            variant="secondary"
            size="sm"
            onClick={handleMarkAllRead}
            icon={CheckCheck}
          >
            Mark All Read
          </Button>
        </div>
      </div>

      {loading ? (
        <Loader message="Loading notification feed..." />
      ) : notifications.length === 0 ? (
        <EmptyState
          icon={Bell}
          title="No notifications"
          description="You are completely up to date with institutional events."
        />
      ) : (
        <div className="space-y-3">
          {notifications.map((n) => (
            <Card
              key={n._id}
              className={`transition ${
                !n.isRead
                  ? 'border-l-4 border-l-primary-500 bg-primary-50/20 dark:bg-primary-950/20'
                  : ''
              }`}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center space-x-2">
                    <span
                      className={`h-2 w-2 rounded-full ${
                        !n.isRead ? 'bg-primary-600 animate-pulse' : 'bg-transparent'
                      }`}
                    />
                    <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                      {n.title}
                    </h4>
                    <span className="text-[10px] text-slate-400">
                      {new Date(n.createdAt).toLocaleString()}
                    </span>
                  </div>

                  <p className="text-xs text-slate-600 dark:text-slate-300 mt-1.5 whitespace-pre-line">
                    {n.message}
                  </p>

                  {n.link && (
                    <Link
                      to={n.link}
                      onClick={() => !n.isRead && handleMarkAsRead(n._id)}
                      className="inline-flex items-center text-xs font-semibold text-primary-600 hover:text-primary-700 mt-2"
                    >
                      View Referenced Item <ExternalLink className="w-3.5 h-3.5 ml-1" />
                    </Link>
                  )}
                </div>

                <div className="flex items-center space-x-2 shrink-0">
                  {!n.isRead && (
                    <button
                      onClick={() => handleMarkAsRead(n._id)}
                      className="text-xs font-medium text-slate-500 hover:text-primary-600"
                      title="Mark as read"
                    >
                      Mark read
                    </button>
                  )}
                  <button
                    onClick={() => handleDelete(n._id)}
                    className="text-slate-400 hover:text-rose-500 p-1"
                    title="Delete notification"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

