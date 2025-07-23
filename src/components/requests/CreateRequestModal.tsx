import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { X, Send, User } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { UserSearch } from '@/components/messaging/UserSearch';

interface CreateRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  targetUserId?: string;
  targetUserName?: string;
}

interface Skill {
  id: string;
  skill_name: string;
  is_teaching: boolean;
  is_learning: boolean;
}

export function CreateRequestModal({ 
  isOpen, 
  onClose, 
  onSuccess, 
  targetUserId, 
  targetUserName 
}: CreateRequestModalProps) {
  const [selectedUserId, setSelectedUserId] = useState(targetUserId || '');
  const [selectedUserName, setSelectedUserName] = useState(targetUserName || '');
  const [skillOffered, setSkillOffered] = useState('');
  const [skillWanted, setSkillWanted] = useState('');
  const [message, setMessage] = useState('');
  const [mySkills, setMySkills] = useState<Skill[]>([]);
  const [showUserSearch, setShowUserSearch] = useState(!targetUserId);
  const [isSending, setIsSending] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  const fetchMySkills = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('skills')
        .select('*')
        .eq('user_id', user.id);

      if (error) throw error;
      setMySkills(data || []);
    } catch (error) {
      console.error('Error fetching skills:', error);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchMySkills();
    }
  }, [isOpen, user]);

  const handleSendRequest = async () => {
    if (!user || !selectedUserId) return;

    if (!skillOffered && !skillWanted) {
      toast({
        title: "Error",
        description: "Please specify at least one skill",
        variant: "destructive"
      });
      return;
    }

    setIsSending(true);
    try {
      // Create the skill request
      const { data: requestData, error: requestError } = await supabase
        .from('skill_requests')
        .insert({
          from_user_id: user.id,
          to_user_id: selectedUserId,
          skill_offered: skillOffered || null,
          skill_wanted: skillWanted || null,
          message: message || null,
          status: 'pending'
        })
        .select()
        .single();

      if (requestError) throw requestError;

      // Create notification for the recipient
      await supabase
        .from('notifications')
        .insert({
          user_id: selectedUserId,
          type: 'skill_request',
          title: 'New Skill Exchange Request',
          message: `${user.email} wants to exchange skills with you`,
          related_id: requestData.id
        });

      toast({
        title: "Request Sent!",
        description: `Your skill exchange request has been sent to ${selectedUserName}`,
      });

      onSuccess();
    } catch (error) {
      console.error('Error sending request:', error);
      toast({
        title: "Error",
        description: "Failed to send skill request",
        variant: "destructive"
      });
    } finally {
      setIsSending(false);
    }
  };

  const handleSelectUser = (userId: string, displayName: string) => {
    setSelectedUserId(userId);
    setSelectedUserName(displayName);
    setShowUserSearch(false);
  };

  const teachingSkills = mySkills.filter(s => s.is_teaching);
  const learningSkills = mySkills.filter(s => s.is_learning);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="w-full max-w-md"
        >
          <Card className="glass-effect neon-border terminal-glow">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="neon-text font-orbitron">
                  [CREATE_SKILL_REQUEST]
                </CardTitle>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={onClose}
                  className="glow-blue hover:glow-pink transition-all duration-300"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* User Selection */}
              <div className="space-y-2">
                <Label className="text-sm font-medium terminal-text">
                  Send Request To:
                </Label>
                {selectedUserId ? (
                  <div className="flex items-center justify-between glass-effect rounded-lg p-3">
                    <div className="flex items-center gap-2">
                      <User className="h-6 w-6 p-1 bg-primary/20 rounded-full text-primary" />
                      <span className="terminal-text">{selectedUserName}</span>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setSelectedUserId('');
                        setSelectedUserName('');
                        setShowUserSearch(true);
                      }}
                    >
                      Change
                    </Button>
                  </div>
                ) : (
                  <Button
                    variant="outline"
                    onClick={() => setShowUserSearch(true)}
                    className="w-full glass-effect border-primary/20"
                  >
                    <User className="h-4 w-4 mr-2" />
                    Select User
                  </Button>
                )}
              </div>

              {/* Skill I'm Offering */}
              <div className="space-y-2">
                <Label className="text-sm font-medium terminal-text text-green-400">
                  Skill I'm Offering:
                </Label>
                <Select value={skillOffered} onValueChange={setSkillOffered}>
                  <SelectTrigger className="glass-effect border-primary/20">
                    <SelectValue placeholder="Select a skill you can teach..." />
                  </SelectTrigger>
                  <SelectContent>
                    {teachingSkills.length === 0 ? (
                      <SelectItem value="none" disabled>
                        No teaching skills available
                      </SelectItem>
                    ) : (
                      teachingSkills.map((skill) => (
                        <SelectItem key={skill.id} value={skill.skill_name}>
                          {skill.skill_name}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>

              {/* Skill I Want to Learn */}
              <div className="space-y-2">
                <Label className="text-sm font-medium terminal-text text-blue-400">
                  Skill I Want to Learn:
                </Label>
                <Select value={skillWanted} onValueChange={setSkillWanted}>
                  <SelectTrigger className="glass-effect border-primary/20">
                    <SelectValue placeholder="Select a skill you want to learn..." />
                  </SelectTrigger>
                  <SelectContent>
                    {learningSkills.length === 0 ? (
                      <SelectItem value="none" disabled>
                        No learning skills available
                      </SelectItem>
                    ) : (
                      learningSkills.map((skill) => (
                        <SelectItem key={skill.id} value={skill.skill_name}>
                          {skill.skill_name}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>

              {/* Message */}
              <div className="space-y-2">
                <Label className="text-sm font-medium terminal-text">
                  Message (Optional):
                </Label>
                <Textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="> ENTER_REQUEST_MESSAGE..."
                  className="glass-effect border-primary/20 focus:border-primary/50 terminal-text min-h-[80px]"
                />
              </div>

              {/* Send Button */}
              <Button
                onClick={handleSendRequest}
                disabled={!selectedUserId || isSending || (!skillOffered && !skillWanted)}
                className="w-full glow-green hover:glow-pink transition-all duration-300 pulse-match"
              >
                <Send className="h-4 w-4 mr-2" />
                {isSending ? '[SENDING_REQUEST...]' : 'SEND_SKILL_REQUEST'}
              </Button>
            </CardContent>
          </Card>
        </motion.div>

        {/* User Search Modal */}
        <AnimatePresence>
          {showUserSearch && (
            <UserSearch
              onSelectUser={handleSelectUser}
              onClose={() => setShowUserSearch(false)}
            />
          )}
        </AnimatePresence>
      </motion.div>
    </AnimatePresence>
  );
}