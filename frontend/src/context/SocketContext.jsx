import React, { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';
import api from '../api/client';

const SocketContext = createContext(null);

export const SocketProvider = ({ children }) => {
  const { user } = useAuth();
  const [socket, setSocket] = useState(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const [recentNotification, setRecentNotification] = useState(null);

  // Fetch initial unread count
  useEffect(() => {
    if (user) {
      api.get('/notifications?limit=1')
        .then((res) => {
          setUnreadCount(res.data.unreadCount || 0);
        })
        .catch(() => {});
    }
  }, [user]);

  useEffect(() => {
    if (!user) {
      if (socket) socket.disconnect();
      return;
    }

    const socketInstance = io(window.location.origin, {
      transports: ['websocket', 'polling'],
    });

    socketInstance.on('connect', () => {
      // Join user specific and department room
      socketInstance.emit('join_user_room', user._id);
      if (user.department) {
        const deptId = user.department._id || user.department;
        socketInstance.emit('join_dept_room', deptId);
      }
      socketInstance.emit('join_role_room', user.role);
    });

    socketInstance.on('notification_received', (notification) => {
      setUnreadCount((prev) => prev + 1);
      setRecentNotification(notification);

      // Auto dismiss toast after 6 seconds
      setTimeout(() => {
        setRecentNotification((curr) => (curr?._id === notification._id ? null : curr));
      }, 6000);
    });

    setSocket(socketInstance);

    return () => {
      socketInstance.disconnect();
    };
  }, [user]);

  const markAllReadLocally = () => {
    setUnreadCount(0);
  };

  const decrementUnread = () => {
    setUnreadCount((prev) => Math.max(0, prev - 1));
  };

  return (
    <SocketContext.Provider
      value={{
        socket,
        unreadCount,
        recentNotification,
        markAllReadLocally,
        decrementUnread,
        setRecentNotification,
      }}
    >
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => {
  return useContext(SocketContext) || {};
};

