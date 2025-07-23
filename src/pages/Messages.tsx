import { useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Home } from 'lucide-react';
import { Link } from 'react-router-dom';
import { MessageList } from '@/components/messaging/MessageList';
import { MessageInput } from '@/components/messaging/MessageInput';

export default function Messages() {
  const [selectedUserId, setSelectedUserId] = useState<string>();
  const [selectedUserName, setSelectedUserName] = useState<string>();
  const [typingUsers, setTypingUsers] = useState<Set<string>>(new Set());

  const handleSelectUser = (userId: string, displayName: string) => {
    setSelectedUserId(userId);
    setSelectedUserName(displayName);
  };

  const handleBack = () => {
    setSelectedUserId(undefined);
    setSelectedUserName(undefined);
  };

  const handleTypingChange = (isTyping: boolean) => {
    if (!selectedUserId) return;
    
    setTypingUsers(prev => {
      const newSet = new Set(prev);
      if (isTyping) {
        newSet.add(selectedUserId);
      } else {
        newSet.delete(selectedUserId);
      }
      return newSet;
    });
  };

  return (
    <div className="min-h-screen bg-gradient-primary">
      <div className="container mx-auto max-w-6xl px-2 sm:px-4 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-4 sm:mb-8 pt-4 sm:pt-8"
        >
          <div className="flex items-center gap-2 sm:gap-4 mb-4 flex-wrap">
            <Link to="/dashboard">
              <Button variant="ghost" className="glow-blue hover:glow-pink transition-all duration-300 min-w-[44px] min-h-[44px]">
                <Home className="h-4 w-4 sm:mr-2" />
                <span className="hidden sm:inline">Dashboard</span>
              </Button>
            </Link>
            {selectedUserId && (
              <Button variant="ghost" onClick={handleBack} className="min-w-[44px] min-h-[44px]">
                <ArrowLeft className="h-4 w-4 sm:mr-2" />
                <span className="hidden sm:inline">Back</span>
              </Button>
            )}
            <h1 className="text-2xl sm:text-4xl font-orbitron font-bold neon-text truncate">
              {selectedUserId ? `Chat with ${selectedUserName}` : 'Messages'}
            </h1>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 gap-4 sm:gap-8">
          {!selectedUserId ? (
            <MessageList 
              selectedUserId={selectedUserId}
              onSelectUser={handleSelectUser}
              typingUsers={typingUsers}
            />
          ) : (
            <div className="space-y-4">
              <MessageList 
                selectedUserId={selectedUserId}
                onSelectUser={handleSelectUser}
                typingUsers={typingUsers}
              />
              <div className="sticky bottom-0 bg-gradient-primary/80 backdrop-blur-lg p-2 sm:p-4 rounded-lg">
                <MessageInput 
                  recipientId={selectedUserId}
                  onMessageSent={() => {}}
                  onTypingChange={handleTypingChange}
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}