'use client';

import React, { createContext, useContext, useState, useCallback } from 'react';

type NotificationType = 'success' | 'error' | 'info' | 'warning';

interface Notification {
  id: number;
  type: NotificationType;
  title?: string;
  message: string;
}

interface NotificationContextType {
  showNotification: (type: NotificationType, message: string, title?: string) => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotification must be used within a NotificationProvider');
  }
  return context;
};

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const showNotification = useCallback((type: NotificationType, message: string, title?: string) => {
    const id = Date.now();
    setNotifications((prev) => [...prev, { id, type, message, title }]);

    // Auto remove after 4 seconds
    setTimeout(() => {
      setNotifications((prev) => prev.filter((n) => n.id !== id));
    }, 4000);
  }, []);

  const removeNotification = (id: number) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  return (
    <NotificationContext.Provider value={{ showNotification }}>
      {children}
      
      {/* TOAST CONTAINER */}
      <div className="fixed top-4 left-4 right-4 md:left-auto md:right-4 z-[9999] flex flex-col gap-3 w-auto md:w-full md:max-w-sm pointer-events-none items-center md:items-end">
        {notifications.map((notification) => (
          <div
            key={notification.id}
            className={`
              pointer-events-auto transform transition-all duration-300 ease-in-out animate-slide-in
              flex items-start gap-3 p-4 rounded-xl shadow-lg border backdrop-blur-md w-full max-w-sm
              ${notification.type === 'success' ? 'bg-white/90 dark:bg-gray-800/90 border-green-500/20 text-green-600 dark:text-green-400' : ''}
              ${notification.type === 'error' ? 'bg-white/90 dark:bg-gray-800/90 border-red-500/20 text-red-600 dark:text-red-400' : ''}
              ${notification.type === 'info' ? 'bg-white/90 dark:bg-gray-800/90 border-blue-500/20 text-blue-600 dark:text-blue-400' : ''}
              ${notification.type === 'warning' ? 'bg-white/90 dark:bg-gray-800/90 border-yellow-500/20 text-yellow-600 dark:text-yellow-400' : ''}
            `}
          >
            {/* ICON */}
            <div className="flex-shrink-0 mt-0.5">
              {notification.type === 'success' && (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              )}
              {notification.type === 'error' && (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              )}
              {notification.type === 'info' && (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              )}
              {notification.type === 'warning' && (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
              )}
            </div>

            {/* CONTENT */}
            <div className="flex-1">
              {notification.title && <h4 className="font-bold text-sm mb-0.5 text-gray-900 dark:text-white">{notification.title}</h4>}
              <p className="text-sm font-medium opacity-90">{notification.message}</p>
            </div>

            {/* CLOSE BUTTON */}
            <button 
              onClick={() => removeNotification(notification.id)}
              className="flex-shrink-0 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>
        ))}
      </div>
    </NotificationContext.Provider>
  );
};