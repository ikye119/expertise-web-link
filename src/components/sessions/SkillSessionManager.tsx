import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { CheckCircle, Clock, Star, Trophy, MessageSquare } from 'lucide-react';
import { FeedbackForm } from '@/components/feedback/FeedbackForm';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

interface SkillSession {
  id: string;
  participant1_id: string;
  participant2_id: string;
  skill_name: string;
  status: 'in_progress' | 'completed' | 'cancelled';
  started_at: string;
  completed_at?: string;
  participant1_name?: string;
  participant2_name?: string;
}

export function SkillSessionManager() {
  const [sessions, setSessions] = useState<SkillSession[]>([]);
  const [selectedSession, setSelectedSession] = useState<SkillSession | null>(null);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();

  const fetchSessions = async () => {
    if (!user) return;

    try {
      // For now, we'll simulate this with skill_requests that are accepted
      const { data: requests, error } = await supabase
        .from('skill_requests')
        .select(`
          id,
          from_user_id,
          to_user_id,
          skill_offered,
          skill_wanted,
          status,
          created_at,
          updated_at
        `)
        .or(`from_user_id.eq.${user.id},to_user_id.eq.${user.id}`)
        .eq('status', 'accepted')
        .order('updated_at', { ascending: false });

      if (error) throw error;

      // Get participant names
      const userIds = requests?.flatMap(r => [r.from_user_id, r.to_user_id]) || [];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, display_name')
        .in('user_id', userIds);

      const sessionsWithNames = requests?.map(request => ({
        id: request.id,
        participant1_id: request.from_user_id,
        participant2_id: request.to_user_id,
        skill_name: request.skill_offered || request.skill_wanted || 'General Skills',
        status: 'completed' as const,
        started_at: request.created_at,
        completed_at: request.updated_at,
        participant1_name: profiles?.find(p => p.user_id === request.from_user_id)?.display_name || 'Anonymous',
        participant2_name: profiles?.find(p => p.user_id === request.to_user_id)?.display_name || 'Anonymous'
      })) || [];

      setSessions(sessionsWithNames);
    } catch (error) {
      console.error('Error fetching sessions:', error);
      toast({
        title: "Error",
        description: "Failed to load skill sessions",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSessions();
  }, [user]);

  const handleCompleteSession = (session: SkillSession) => {
    setSelectedSession(session);
    setShowReviewModal(true);
  };

  const getPartnerInfo = (session: SkillSession) => {
    const isParticipant1 = session.participant1_id === user?.id;
    return {
      partnerId: isParticipant1 ? session.participant2_id : session.participant1_id,
      partnerName: isParticipant1 ? session.participant2_name : session.participant1_name
    };
  };

  if (isLoading) {
    return (
      <Card className="glass-effect neon-border">
        <CardContent className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          <span className="ml-3 terminal-text">[LOADING_SESSIONS...]</span>
        </CardContent>
      </Card>
    );
  }

  if (sessions.length === 0) {
    return (
      <Card className="glass-effect terminal-glow">
        <CardContent className="text-center py-8">
          <Clock className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <p className="terminal-text text-muted-foreground">
            No skill sessions yet. Start connecting with others to begin!
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card className="glass-effect neon-border terminal-glow">
        <CardHeader>
          <CardTitle className="neon-text font-orbitron flex items-center gap-2">
            <Trophy className="h-5 w-5" />
            [SKILL_SESSION_MANAGER]
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {sessions.map((session, index) => {
            const { partnerId, partnerName } = getPartnerInfo(session);
            
            return (
              <motion.div
                key={session.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="p-4 glass-effect rounded-lg border border-primary/20"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-5 w-5 text-green-400" />
                      <div>
                        <h3 className="font-medium terminal-text">
                          Session with {partnerName}
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          Skill: {session.skill_name}
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Badge className="bg-green-500/20 text-green-300 border-green-500/30">
                      Completed
                    </Badge>
                    <Button
                      size="sm"
                      onClick={() => handleCompleteSession(session)}
                      className="glow-blue hover:glow-pink transition-all duration-300"
                    >
                      <Star className="h-4 w-4 mr-1" />
                      Review
                    </Button>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </CardContent>
      </Card>

      {/* Review Modal */}
      {selectedSession && (
        <Dialog open={showReviewModal} onOpenChange={setShowReviewModal}>
          <DialogContent className="glass-effect border-primary/20 neon-border max-w-2xl">
            <DialogHeader>
              <DialogTitle className="neon-text font-orbitron">
                [SESSION_REVIEW_INTERFACE]
              </DialogTitle>
            </DialogHeader>
            
            <FeedbackForm
              reviewedUserId={getPartnerInfo(selectedSession).partnerId}
              skillName={selectedSession.skill_name}
              displayName={getPartnerInfo(selectedSession).partnerName || 'Anonymous'}
              onClose={() => {
                setShowReviewModal(false);
                setSelectedSession(null);
              }}
            />
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}