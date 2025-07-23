import { useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Send } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

interface MessageInputProps {
  recipientId: string;
  onMessageSent?: () => void;
}

export function MessageInput({ recipientId, onMessageSent }: MessageInputProps) {
  const [message, setMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
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

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex gap-2 p-2 sm:p-4 glass-effect rounded-lg terminal-glow"
    >
      <Textarea
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        onKeyPress={handleKeyPress}
        placeholder="> ENTER_MESSAGE_PAYLOAD..."
        className="flex-1 min-h-[60px] sm:min-h-[60px] glass-effect border-primary/20 focus:border-primary/50 terminal-text text-sm sm:text-base resize-none"
        disabled={isSending}
      />
      <Button
        onClick={sendMessage}
        disabled={!message.trim() || isSending}
        className="self-end glow-green hover:glow-pink transition-all duration-300 min-w-[48px] min-h-[48px] sm:min-w-[44px] sm:min-h-[44px]"
        size="icon"
      >
        <Send className="h-4 w-4 sm:h-4 sm:w-4" />
      </Button>
    </motion.div>
  );
}