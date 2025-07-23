import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  related_id: string | null;
  is_read: boolean;
  created_at: string;
}

export function NotificationIcon() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const { user } = useAuth();
  const navigate = useNavigate();

  const fetchNotifications = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;

      setNotifications(data || []);
      setUnreadCount(data?.filter(n => !n.is_read).length || 0);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    }
  };

  useEffect(() => {
    fetchNotifications();

    // Set up real-time subscription
    const channel = supabase
      .channel('notifications_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user?.id}`
        },
        () => {
          fetchNotifications();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const markAsRead = async (notificationId: string) => {
    try {
      await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('id', notificationId);
      
      fetchNotifications();
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const handleNotificationClick = (notification: Notification) => {
    markAsRead(notification.id);
    
    // Navigate based on notification type
    switch (notification.type) {
      case 'skill_request':
        navigate('/requests');
        break;
      case 'message_received':
        navigate('/messages');
        break;
      case 'request_accepted':
      case 'request_declined':
        navigate('/requests');
        break;
      default:
        navigate('/dashboard');
    }
    
    setShowDropdown(false);
  };

  const markAllAsRead = async () => {
    if (!user) return;

    try {
      await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('user_id', user.id)
        .eq('is_read', false);
      
      fetchNotifications();
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  };

  return (
    <div className="relative">
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setShowDropdown(!showDropdown)}
        className="relative glow-blue hover:glow-pink transition-all duration-300"
      >
        <Bell className="h-5 w-5" />
        <AnimatePresence>
          {unreadCount > 0 && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0 }}
              className="absolute -top-1 -right-1 bg-primary text-primary-foreground rounded-full text-xs w-5 h-5 flex items-center justify-center glow-pulse"
            >
              {unreadCount}
            </motion.div>
          )}
        </AnimatePresence>
      </Button>

      <AnimatePresence>
        {showDropdown && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -10 }}
            className="absolute right-0 top-full mt-2 w-80 z-50"
          >
            <Card className="glass-effect neon-border terminal-glow">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-orbitron neon-text">
                    [NOTIFICATIONS_SYS]
                  </CardTitle>
                  <div className="flex gap-2">
                    {unreadCount > 0 && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={markAllAsRead}
                        className="text-xs glow-green hover:glow-pink transition-all duration-300"
                      >
                        Mark All Read
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setShowDropdown(false)}
                      className="h-6 w-6"
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="max-h-96 overflow-y-auto">
                {notifications.length === 0 ? (
                  <p className="text-center text-muted-foreground terminal-text py-4">
                    {'{> NO_NOTIFICATIONS}'}
                  </p>
                ) : (
                  <div className="space-y-2">
                    {notifications.map((notification) => (
                      <motion.div
                        key={notification.id}
                        whileHover={{ scale: 1.02 }}
                        onClick={() => handleNotificationClick(notification)}
                        className={`p-3 rounded-lg cursor-pointer transition-all duration-300 ${
                          !notification.is_read
                            ? 'bg-primary/10 border border-primary/20 glow-pulse'
                            : 'glass-effect'
                        }`}
                      >
                        <h4 className="font-medium text-sm terminal-text">
                          {notification.title}
                        </h4>
                        <p className="text-xs text-muted-foreground mt-1">
                          {notification.message}
                        </p>
                        <p className="text-xs text-muted-foreground mt-2">
                          {formatDistanceToNow(new Date(notification.created_at))} ago
                        </p>
                      </motion.div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}