/**
 * SocketContext v2
 * - Joins per-user room (user:<id>) for order notifications
 * - Emits 'join-user' after connection
 */
import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';
import toast from 'react-hot-toast';

const SocketContext = createContext(null);

export function SocketProvider({ children }) {
  const { user } = useAuth();
  const socketRef = useRef(null);
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    if (!user) {
      if (socketRef.current) { socketRef.current.disconnect(); socketRef.current = null; }
      return;
    }

    const URL = (process.env.REACT_APP_API_URL || 'http://localhost:5000/api').replace('/api', '');
    const socket = io(URL, { transports: ['websocket', 'polling'] });
    socketRef.current = socket;

    socket.on('connect', () => {
      socket.emit('join-user',     user._id);
      socket.emit('join-location', user.district);
    });

    socket.on('new-listing', data => {
      addNotif({ type: 'new_listing', message: data.message, icon: '🌱', time: new Date() });
      toast(data.message, { icon: '🌱' });
    });

    socket.on('new-order', data => {
      addNotif({ type: 'new_order', message: data.message, icon: '🛒', time: new Date() });
      toast.success(data.message);
    });

    socket.on('order-status-update', data => {
      addNotif({ type: 'order_status', message: data.message, icon: '📦', time: new Date() });
      toast(data.message, { icon: '📦' });
    });

    return () => { socket.disconnect(); socketRef.current = null; };
  }, [user]);

  const addNotif = (n) => setNotifications(p => [{ ...n, id: Date.now(), read: false }, ...p.slice(0, 49)]);
  const markAllRead = () => setNotifications(p => p.map(n => ({ ...n, read: true })));
  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <SocketContext.Provider value={{ socket: socketRef.current, notifications, unreadCount, markAllRead }}>
      {children}
    </SocketContext.Provider>
  );
}

export const useSocket = () => useContext(SocketContext);
