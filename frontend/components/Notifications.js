import { useState, useEffect, useRef } from 'react';
import { FiBell } from 'react-icons/fi';
import api from '../lib/api';

const Notifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  const fetchNotifications = async () => {
    try {
      const res = await api.get('/student/notifications');
      setNotifications(res.data);
      const unread = res.data.filter((n) => !n.read).length;
      setUnreadCount(unread);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const handleMarkAllAsRead = async () => {
    try {
      await api.post('/student/notifications/mark-as-read');
      fetchNotifications();
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  };

  const handleMarkOneAsRead = async (id) => {
    try {
      await api.post(`/student/notifications/${id}/mark-as-read`);
      fetchNotifications();
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative"
      >
        <FiBell className="h-6 w-6" />
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 block h-4 w-4 rounded-full bg-red-500 text-white text-xs">
            {unreadCount}
          </span>
        )}
      </button>
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-card text-card-foreground rounded-md shadow-lg z-10 border border-border">
          <div className="p-4 flex justify-between items-center">
            <h3 className="text-lg font-medium">Notifications</h3>
            {unreadCount > 0 && (
                <button
                    onClick={handleMarkAllAsRead}
                    className="text-sm text-blue-500 hover:underline"
                >
                    Mark all as read
                </button>
            )}
          </div>
          <div className="divide-y divide-border max-h-60 overflow-y-auto">
            {notifications.length > 0 ? (
              notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`p-4 relative ${
                    notification.read ? 'text-muted-foreground' : 'font-bold'
                  }`}
                >
                  {!notification.read && (
                    <span className="absolute left-2 top-1/2 -translate-y-1/2 h-2 w-2 rounded-full bg-blue-500"></span>
                  )}
                  <p className="text-sm ml-4 pr-20">{notification.message}</p>
                  <p className="text-xs text-muted-foreground ml-4 mt-1 pr-20">
                    {new Date(notification.createdAt).toLocaleString()}
                  </p>
                  {!notification.read && (
                    <button
                      onClick={() => handleMarkOneAsRead(notification.id)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-blue-500 hover:underline"
                    >
                      Mark as read
                    </button>
                  )}
                </div>
              ))
            ) : (
              <div className="p-4 text-sm text-muted-foreground">
                You have no notifications.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Notifications;
