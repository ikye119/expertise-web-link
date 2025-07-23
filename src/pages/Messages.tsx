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

  const handleSelectUser = (userId: string, displayName: string) => {
    setSelectedUserId(userId);
    setSelectedUserName(displayName);
  };

  const handleBack = () => {
    setSelectedUserId(undefined);
    setSelectedUserName(undefined);
  };

  return (
    <div className="min-h-screen bg-gradient-primary p-8">
      <div className="container mx-auto max-w-4xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center gap-4 mb-4">
            <Link to="/dashboard">
              <Button variant="ghost" className="glow-blue hover:glow-pink transition-all duration-300">
                <Home className="h-4 w-4 mr-2" />
                Dashboard
              </Button>
            </Link>
            {selectedUserId && (
              <Button variant="ghost" onClick={handleBack}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
            )}
            <h1 className="text-4xl font-orbitron font-bold neon-text">
              {selectedUserId ? `Chat with ${selectedUserName}` : 'Messages'}
            </h1>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 gap-8">
          <MessageList 
            selectedUserId={selectedUserId}
            onSelectUser={handleSelectUser}
          />
          
          {selectedUserId && (
            <MessageInput 
              recipientId={selectedUserId}
              onMessageSent={() => {}}
            />
          )}
        </div>
      </div>
    </div>
  );
}