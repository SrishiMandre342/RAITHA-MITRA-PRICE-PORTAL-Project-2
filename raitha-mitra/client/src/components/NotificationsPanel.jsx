import React from 'react';
import { useSocket } from '../context/SocketContext';
import { timeAgo } from '../utils/constants';

export default function NotificationsPanel({ onClose }) {
  const { notifications, markAllRead } = useSocket();

  const handleClose = () => {
    markAllRead();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center" onClick={handleClose}>
      <div className="absolute inset-0 bg-black/40" />
      <div
        className="relative bg-white rounded-t-3xl w-full max-w-lg max-h-[70vh] flex flex-col shadow-2xl"
        onClick={(e) => e.stopPropagation()}
        style={{ animation: 'slideUp 0.3s ease' }}
      >
        {/* Handle */}
        <div className="w-10 h-1 bg-gray-300 rounded-full mx-auto mt-3 mb-1" />

        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
          <h2 className="font-semibold text-gray-900">Notifications</h2>
          <button onClick={handleClose} className="text-gray-400 text-xl p-1">✕</button>
        </div>

        <div className="overflow-y-auto flex-1 p-4 space-y-2">
          {notifications.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              <div className="text-4xl mb-2">🔔</div>
              <div>No notifications yet</div>
            </div>
          ) : (
            notifications.map((n) => (
              <div key={n.id} className={`flex gap-3 p-3 rounded-xl ${n.read ? 'bg-white' : 'bg-green-50'}`}>
                <div className="text-2xl flex-shrink-0">{n.listing?.emoji || '🌿'}</div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-gray-800 leading-snug">{n.message}</div>
                  <div className="text-xs text-gray-400 mt-0.5">{timeAgo(n.time)}</div>
                </div>
                {!n.read && <div className="w-2 h-2 rounded-full bg-green-600 mt-1.5 flex-shrink-0" />}
              </div>
            ))
          )}
        </div>
      </div>

      <style>{`@keyframes slideUp { from { transform: translateY(100%); } to { transform: translateY(0); } }`}</style>
    </div>
  );
}
