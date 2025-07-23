import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MessageCircle, User, Clock } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { formatDistanceToNow } from 'date-fns';

interface Message {
  id: string;
  sender_id: string;
  recipient_id: string;
  content: string;
  created_at: string;
  read_at: string | null;
  sender_profile?: {
    display_name: string | null;
  };
  recipient_profile?: {
    display_name: string | null;
  };
}

interface MessageListProps {
  selectedUserId?: string;
  onSelectUser?: (userId: string, displayName: string) => void;
}

export function MessageList({ selectedUserId, onSelectUser }: MessageListProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [conversations, setConversations] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();

  const fetchConversations = async () => {
    if (!user) return;

    try {
      // Get unique conversations
      const { data: messagesData, error } = await supabase
        .from('messages')
        .select('*')
        .or(`sender_id.eq.${user.id},recipient_id.eq.${user.id}`)
        .order('created_at', { ascending: false });

      // Get profiles separately
      const userIds = messagesData?.map(m => [m.sender_id, m.recipient_id]).flat() || [];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, display_name')
        .in('user_id', [...new Set(userIds)]);

      if (error) throw error;

      // Group by conversation partner
      const conversationMap = new Map();
      
      messagesData?.forEach((message) => {
        const isFromMe = message.sender_id === user.id;
        const partnerId = isFromMe ? message.recipient_id : message.sender_id;
        const partnerProfile = profiles?.find(p => p.user_id === partnerId);
        const partnerName = partnerProfile?.display_name;

        if (!conversationMap.has(partnerId)) {
          conversationMap.set(partnerId, {
            partnerId,
            partnerName: partnerName || 'Anonymous User',
            lastMessage: message,
            unreadCount: 0
          });
        }

        // Count unread messages from partner
        if (!isFromMe && !message.read_at) {
          conversationMap.get(partnerId).unreadCount++;
        }
      });

      setConversations(Array.from(conversationMap.values()));
    } catch (error) {
      console.error('Error fetching conversations:', error);
      toast({
        title: "Error",
        description: "Failed to load conversations",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const fetchMessages = async () => {
    if (!user || !selectedUserId) return;

    try {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .or(`and(sender_id.eq.${user.id},recipient_id.eq.${selectedUserId}),and(sender_id.eq.${selectedUserId},recipient_id.eq.${user.id})`)
        .order('created_at', { ascending: true });

      if (error) throw error;

      setMessages(data || []);

      // Mark messages as read
      await supabase
        .from('messages')
        .update({ read_at: new Date().toISOString() })
        .eq('sender_id', selectedUserId)
        .eq('recipient_id', user.id)
        .is('read_at', null);

    } catch (error) {
      console.error('Error fetching messages:', error);
      toast({
        title: "Error",
        description: "Failed to load messages",
        variant: "destructive"
      });
    }
  };

  useEffect(() => {
    fetchConversations();

    // Set up real-time subscription
    const channel = supabase
      .channel('messages_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'messages'
        },
        () => {
          fetchConversations();
          if (selectedUserId) {
            fetchMessages();
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  useEffect(() => {
    if (selectedUserId) {
      fetchMessages();
    }
  }, [selectedUserId, user]);

  if (!selectedUserId) {
    return (
      <Card className="glass-effect neon-border">
        <CardHeader>
          <CardTitle className="neon-text font-orbitron flex items-center gap-2">
            <MessageCircle className="h-5 w-5" />
            Conversations
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : conversations.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">
              No conversations yet. Connect with other users to start messaging!
            </p>
          ) : (
            <div className="space-y-3">
              {conversations.map((conversation) => (
                <motion.div
                  key={conversation.partnerId}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Button
                    variant="ghost"
                    className="w-full justify-start h-auto p-4 glass-effect"
                    onClick={() => onSelectUser?.(conversation.partnerId, conversation.partnerName)}
                  >
                    <div className="flex items-center gap-3 w-full">
                      <User className="h-10 w-10 p-2 bg-primary/20 rounded-full text-primary" />
                      <div className="flex-1 text-left">
                        <div className="flex items-center justify-between">
                          <h4 className="font-medium">{conversation.partnerName}</h4>
                          {conversation.unreadCount > 0 && (
                            <span className="bg-primary text-primary-foreground rounded-full px-2 py-1 text-xs">
                              {conversation.unreadCount}
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground truncate">
                          {conversation.lastMessage?.content}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {formatDistanceToNow(new Date(conversation.lastMessage?.created_at))} ago
                        </p>
                      </div>
                    </div>
                  </Button>
                </motion.div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="glass-effect neon-border h-[600px] flex flex-col">
      <CardHeader>
        <CardTitle className="neon-text font-orbitron flex items-center gap-2">
          <MessageCircle className="h-5 w-5" />
          Messages
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-1 overflow-y-auto">
        <div className="space-y-4">
          {messages.map((message) => (
            <motion.div
              key={message.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex ${message.sender_id === user?.id ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[70%] p-3 rounded-lg glass-effect ${
                  message.sender_id === user?.id
                    ? 'bg-primary/20 neon-border'
                    : 'bg-secondary/50'
                }`}
              >
                <p className="text-sm">{message.content}</p>
                <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                  <Clock className="h-3 w-3" />
                  {formatDistanceToNow(new Date(message.created_at))} ago
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}