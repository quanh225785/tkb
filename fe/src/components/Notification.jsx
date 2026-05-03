import React, { useEffect } from 'react';
import { CheckCircle, AlertCircle, Info, X } from 'lucide-react';

const ICONS = {
  success: <CheckCircle size={18} />,
  error: <AlertCircle size={18} />,
  info: <Info size={18} />,
  warning: <AlertCircle size={18} />,
};

export default function Notification({ notifications, onDismiss }) {
  return (
    <div className="notification-container">
      {notifications.map((n) => (
        <NotificationItem key={n.id} notification={n} onDismiss={onDismiss} />
      ))}
    </div>
  );
}

function NotificationItem({ notification, onDismiss }) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onDismiss(notification.id);
    }, notification.duration || 3500);
    return () => clearTimeout(timer);
  }, [notification.id, notification.duration, onDismiss]);

  return (
    <div className={`notification ${notification.type || 'info'}`}>
      <span className="notif-icon">{ICONS[notification.type] || ICONS.info}</span>
      <span className="notif-message">{notification.message}</span>
      <button className="notif-close" onClick={() => onDismiss(notification.id)}>
        <X size={14} />
      </button>
    </div>
  );
}
