import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Send, Smile } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

interface MessageInputProps {
  recipientId: string;
  onMessageSent?: () => void;
  onTypingChange?: (isTyping: boolean) => void;
}

export function MessageInput({ recipientId, onMessageSent, onTypingChange }: MessageInputProps) {
  const [message, setMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  const sendMessage = async () => {
    if (!user || !message.trim() || isSending) return;

    setIsSending(true);
    try {
      const { error } = await supabase
        .from('messages')
        .insert({
          sender_id: user.id,
          recipient_id: recipientId,
          content: message.trim()
        });

      if (error) throw error;

      setMessage('');
      onMessageSent?.();
      
      toast({
        title: "Message sent",
        description: "Your message has been delivered",
      });
    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: "Error",
        description: "Failed to send message",
        variant: "destructive"
      });
    } finally {
      setIsSending(false);
    }
  };

  // Typing indicator logic
  useEffect(() => {
    if (message.trim() && !isTyping) {
      setIsTyping(true);
      onTypingChange?.(true);
    } else if (!message.trim() && isTyping) {
      setIsTyping(false);
      onTypingChange?.(false);
    }

    const timeoutId = setTimeout(() => {
      if (isTyping) {
        setIsTyping(false);
        onTypingChange?.(false);
      }
    }, 2000);

    return () => clearTimeout(timeoutId);
  }, [message, isTyping, onTypingChange]);

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const addEmoji = (emoji: string) => {
    setMessage(prev => prev + emoji);
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-2"
    >
      {/* Quick emoji bar */}
      <div className="flex gap-1 px-2 sm:px-4">
        {['👍', '❤️', '😂', '😮', '😢', '😡', '🎉', '🚀'].map((emoji) => (
          <Button
            key={emoji}
            variant="ghost"
            size="sm"
            onClick={() => addEmoji(emoji)}
            className="text-lg hover:glow-green transition-all duration-300 min-w-[32px] min-h-[32px]"
          >
            {emoji}
          </Button>
        ))}
      </div>

      <div className="flex gap-2 p-2 sm:p-4 glass-effect rounded-lg terminal-glow">
        <Textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="> ENTER_MESSAGE_PAYLOAD..."
          className="flex-1 min-h-[60px] sm:min-h-[60px] glass-effect border-primary/20 focus:border-primary/50 terminal-text text-sm sm:text-base resize-none"
          disabled={isSending}
        />
        <div className="flex flex-col gap-2">
          <Button
            variant="ghost"
            size="icon"
            className="glow-blue hover:glow-pink transition-all duration-300"
            onClick={() => {/* Future: emoji picker */}}
          >
            <Smile className="h-4 w-4" />
          </Button>
          <Button
            onClick={sendMessage}
            disabled={!message.trim() || isSending}
            className="glow-green hover:glow-pink transition-all duration-300 min-w-[48px] min-h-[48px]"
            size="icon"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </motion.div>
  );
}