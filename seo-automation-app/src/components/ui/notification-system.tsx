'use client';

import { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import { cn } from '@/lib/utils/cn';
import { Card, CardContent } from './card';
import { Button } from './button';
import { Badge } from './badge';
import { 
  Bell, 
  X, 
  Check, 
  Clock, 
  AlertCircle, 
  Info,
  Settings,
  MoreHorizontal
} from 'lucide-react';

export interface Notification {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info' | 'progress';
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
  action?: {
    label: string;
    onClick: () => void;
  };
  progress?: number;
  persistent?: boolean;
}

interface NotificationContextType {
  notifications: Notification[];
  addNotification: (notification: Omit<Notification, 'id' | 'timestamp' | 'read'>) => void;
  removeNotification: (id: string) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  clearAll: () => void;
  unreadCount: number;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export function NotificationProvider({ children }: { children: ReactNode }) {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const addNotification = (notification: Omit<Notification, 'id' | 'timestamp' | 'read'>) => {
    const newNotification: Notification = {
      ...notification,
      id: Math.random().toString(36).substring(2, 9),
      timestamp: new Date(),
      read: false
    };
    
    setNotifications(prev => [newNotification, ...prev]);

    // Auto-remove non-persistent notifications after 5 seconds
    if (!notification.persistent && notification.type !== 'progress') {
      setTimeout(() => {
        removeNotification(newNotification.id);
      }, 5000);
    }
  };

  const removeNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const markAsRead = (id: string) => {
    setNotifications(prev => 
      prev.map(n => n.id === id ? { ...n, read: true } : n)
    );
  };

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const clearAll = () => {
    setNotifications([]);
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <NotificationContext.Provider value={{
      notifications,
      addNotification,
      removeNotification,
      markAsRead,
      markAllAsRead,
      clearAll,
      unreadCount
    }}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within NotificationProvider');
  }
  return context;
}

interface NotificationBellProps {
  className?: string;
}

export function NotificationBell({ className }: NotificationBellProps) {
  const { unreadCount } = useNotifications();
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="relative">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setIsOpen(!isOpen)}
        className={cn('relative', className)}
      >
        <Bell className="h-4 w-4" />
        {unreadCount > 0 && (
          <Badge 
            variant="destructive"
            className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
          >
            {unreadCount > 9 ? '9+' : unreadCount}
          </Badge>
        )}
      </Button>
      
      {isOpen && (
        <NotificationDropdown onClose={() => setIsOpen(false)} />
      )}
    </div>
  );
}

interface NotificationDropdownProps {
  onClose: () => void;
}

function NotificationDropdown({ onClose }: NotificationDropdownProps) {
  const { notifications, markAsRead, markAllAsRead, clearAll, removeNotification } = useNotifications();

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest('[data-notification-dropdown]')) {
        onClose();
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [onClose]);

  const typeIcons = {
    success: Check,
    error: AlertCircle,
    warning: AlertCircle,
    info: Info,
    progress: Clock
  };

  const typeColors = {
    success: 'text-green-600',
    error: 'text-red-600',
    warning: 'text-yellow-600',
    info: 'text-blue-600',
    progress: 'text-primary'
  };

  return (
    <div 
      data-notification-dropdown
      className="absolute right-0 top-full z-50 mt-2 w-80 max-h-96 overflow-y-auto bg-popover border border-border rounded-lg shadow-lg"
    >
      <div className="p-4 border-b border-border">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold">Notifications</h3>
          <div className="flex items-center space-x-2">
            {notifications.length > 0 && (
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={markAllAsRead}
                  className="text-xs"
                >
                  Mark all read
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearAll}
                  className="text-xs"
                >
                  Clear all
                </Button>
              </>
            )}
          </div>
        </div>
      </div>

      <div className="max-h-64 overflow-y-auto">
        {notifications.length === 0 ? (
          <div className="p-4 text-center text-muted-foreground">
            <Bell className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p>No notifications</p>
          </div>
        ) : (
          notifications.map(notification => {
            const Icon = typeIcons[notification.type];
            const iconColor = typeColors[notification.type];
            
            return (
              <div
                key={notification.id}
                className={cn(
                  'p-3 border-b border-border last:border-b-0 hover:bg-accent/50 cursor-pointer',
                  !notification.read && 'bg-accent/20'
                )}
                onClick={() => markAsRead(notification.id)}
              >
                <div className="flex items-start space-x-3">
                  <Icon className={cn('h-4 w-4 mt-0.5 flex-shrink-0', iconColor)} />
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="font-medium text-sm truncate">
                        {notification.title}
                      </p>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          removeNotification(notification.id);
                        }}
                        className="h-6 w-6 p-0 flex-shrink-0"
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                    
                    <p className="text-xs text-muted-foreground mt-1">
                      {notification.message}
                    </p>
                    
                    {notification.progress !== undefined && (
                      <div className="mt-2">
                        <div className="flex items-center justify-between text-xs">
                          <span>Progress</span>
                          <span>{notification.progress}%</span>
                        </div>
                        <div className="w-full bg-secondary rounded-full h-1.5 mt-1">
                          <div 
                            className="bg-primary h-1.5 rounded-full transition-all duration-300"
                            style={{ width: `${notification.progress}%` }}
                          />
                        </div>
                      </div>
                    )}
                    
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-xs text-muted-foreground">
                        {notification.timestamp.toLocaleTimeString()}
                      </span>
                      
                      {notification.action && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            notification.action?.onClick();
                          }}
                          className="text-xs h-6"
                        >
                          {notification.action.label}
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

// Progress notification hook
export function useProgressNotification() {
  const { addNotification, removeNotification } = useNotifications();
  
  const startProgress = (title: string, message: string) => {
    const id = Math.random().toString(36).substring(2, 9);
    addNotification({
      type: 'progress',
      title,
      message,
      progress: 0,
      persistent: true
    });
    return id;
  };

  const updateProgress = (id: string, progress: number, message?: string) => {
    // Remove old notification and add updated one
    removeNotification(id);
    addNotification({
      type: 'progress',
      title: 'Processing...',
      message: message || `${progress}% complete`,
      progress,
      persistent: true
    });
  };

  const completeProgress = (id: string, title: string, message: string) => {
    removeNotification(id);
    addNotification({
      type: 'success',
      title,
      message
    });
  };

  return {
    startProgress,
    updateProgress,
    completeProgress
  };
}