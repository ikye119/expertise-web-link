import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Home, Inbox, Send, Plus } from 'lucide-react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { RequestCard } from '@/components/requests/RequestCard';
import { CreateRequestModal } from '@/components/requests/CreateRequestModal';

interface SkillRequest {
  id: string;
  from_user_id: string;
  to_user_id: string;
  skill_offered: string | null;
  skill_wanted: string | null;
  message: string | null;
  status: string;
  created_at: string;
  from_profile?: {
    display_name: string | null;
    bio: string | null;
    location: string | null;
  };
  to_profile?: {
    display_name: string | null;
  };
}

export default function Requests() {
  const [requests, setRequests] = useState<SkillRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('incoming');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  // Check if we should show create request modal from navigation state
  useEffect(() => {
    if (location.state?.createRequest) {
      setShowCreateModal(true);
    }
  }, [location.state]);

  const fetchRequests = async () => {
    if (!user) return;

    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('skill_requests')
        .select(`
          *
        `)
        .or(`from_user_id.eq.${user.id},to_user_id.eq.${user.id}`)
        .order('created_at', { ascending: false });

      if (error) throw error;

      setRequests(data || []);
    } catch (error) {
      console.error('Error fetching requests:', error);
      toast({
        title: "Error",
        description: "Failed to load requests",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();

    // Set up real-time subscription
    const channel = supabase
      .channel('skill_requests_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'skill_requests'
        },
        () => {
          fetchRequests();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const handleAcceptRequest = async (requestId: string) => {
    try {
      const { error } = await supabase
        .from('skill_requests')
        .update({ 
          status: 'accepted',
          updated_at: new Date().toISOString()
        })
        .eq('id', requestId);

      if (error) throw error;

      // Create notification for the requester
      const request = requests.find(r => r.id === requestId);
      if (request) {
        await supabase
          .from('notifications')
          .insert({
            user_id: request.from_user_id,
            type: 'request_accepted',
            title: 'Skill Request Accepted!',
            message: `Your skill exchange request has been accepted`,
            related_id: requestId
          });
      }

      toast({
        title: "Request Accepted",
        description: "You can now start chatting with this user",
      });

      fetchRequests();
    } catch (error) {
      console.error('Error accepting request:', error);
      toast({
        title: "Error",
        description: "Failed to accept request",
        variant: "destructive"
      });
    }
  };

  const handleDeclineRequest = async (requestId: string) => {
    try {
      const { error } = await supabase
        .from('skill_requests')
        .update({ 
          status: 'declined',
          updated_at: new Date().toISOString()
        })
        .eq('id', requestId);

      if (error) throw error;

      // Create notification for the requester
      const request = requests.find(r => r.id === requestId);
      if (request) {
        await supabase
          .from('notifications')
          .insert({
            user_id: request.from_user_id,
            type: 'request_declined',
            title: 'Skill Request Declined',
            message: `Your skill exchange request was declined`,
            related_id: requestId
          });
      }

      toast({
        title: "Request Declined",
        description: "The request has been declined",
      });

      fetchRequests();
    } catch (error) {
      console.error('Error declining request:', error);
      toast({
        title: "Error",
        description: "Failed to decline request",
        variant: "destructive"
      });
    }
  };

  const handleMessage = (userId: string, displayName: string) => {
    navigate('/messages', { 
      state: { 
        selectedUserId: userId, 
        selectedUserName: displayName 
      } 
    });
  };

  const incomingRequests = requests.filter(r => r.to_user_id === user?.id);
  const outgoingRequests = requests.filter(r => r.from_user_id === user?.id);

  const pendingIncoming = incomingRequests.filter(r => r.status === 'pending').length;

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
            <h1 className="text-2xl sm:text-4xl font-orbitron font-bold neon-text truncate">
              [SKILL_REQUEST_INBOX]
            </h1>
            <Button
              onClick={() => setShowCreateModal(true)}
              className="ml-auto glow-green hover:glow-pink transition-all duration-300"
            >
              <Plus className="h-4 w-4 sm:mr-2" />
              <span className="hidden sm:inline">New Request</span>
            </Button>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2 glass-effect">
              <TabsTrigger 
                value="incoming" 
                className="relative data-[state=active]:glow-green"
              >
                <Inbox className="h-4 w-4 mr-2" />
                Incoming
                {pendingIncoming > 0 && (
                  <span className="absolute -top-2 -right-2 bg-primary text-primary-foreground rounded-full text-xs w-5 h-5 flex items-center justify-center glow-pulse">
                    {pendingIncoming}
                  </span>
                )}
              </TabsTrigger>
              <TabsTrigger 
                value="outgoing"
                className="data-[state=active]:glow-blue"
              >
                <Send className="h-4 w-4 mr-2" />
                Sent
              </TabsTrigger>
            </TabsList>

            <div className="mt-6">
              {isLoading ? (
                <Card className="glass-effect terminal-glow">
                  <CardContent className="flex items-center justify-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                    <span className="ml-4 terminal-text">[LOADING_REQUESTS...]</span>
                  </CardContent>
                </Card>
              ) : (
                <>
                  <TabsContent value="incoming" className="space-y-4">
                    {incomingRequests.length === 0 ? (
                      <Card className="glass-effect terminal-glow">
                        <CardContent className="text-center py-12">
                          <Inbox className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                          <p className="terminal-text text-muted-foreground">
                            {'{> NO_INCOMING_REQUESTS}'}
                          </p>
                        </CardContent>
                      </Card>
                    ) : (
                      <div className="space-y-4">
                        {incomingRequests.map((request, index) => (
                          <motion.div
                            key={request.id}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.1 }}
                          >
                            <RequestCard
                              request={request}
                              currentUserId={user?.id || ''}
                              onAccept={handleAcceptRequest}
                              onDecline={handleDeclineRequest}
                              onMessage={handleMessage}
                            />
                          </motion.div>
                        ))}
                      </div>
                    )}
                  </TabsContent>

                  <TabsContent value="outgoing" className="space-y-4">
                    {outgoingRequests.length === 0 ? (
                      <Card className="glass-effect terminal-glow">
                        <CardContent className="text-center py-12">
                          <Send className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                          <p className="terminal-text text-muted-foreground">
                            {'{> NO_SENT_REQUESTS}'}
                          </p>
                          <Button
                            onClick={() => setShowCreateModal(true)}
                            className="mt-4 glow-green hover:glow-pink transition-all duration-300"
                          >
                            <Plus className="h-4 w-4 mr-2" />
                            Send Your First Request
                          </Button>
                        </CardContent>
                      </Card>
                    ) : (
                      <div className="space-y-4">
                        {outgoingRequests.map((request, index) => (
                          <motion.div
                            key={request.id}
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.1 }}
                          >
                            <RequestCard
                              request={request}
                              currentUserId={user?.id || ''}
                              onAccept={handleAcceptRequest}
                              onDecline={handleDeclineRequest}
                              onMessage={handleMessage}
                            />
                          </motion.div>
                        ))}
                      </div>
                    )}
                  </TabsContent>
                </>
              )}
            </div>
          </Tabs>
        </motion.div>
      </div>

      <AnimatePresence>
        {showCreateModal && (
          <CreateRequestModal
            isOpen={showCreateModal}
            onClose={() => setShowCreateModal(false)}
            onSuccess={() => {
              setShowCreateModal(false);
              fetchRequests();
            }}
            targetUserId={location.state?.targetUserId}
            targetUserName={location.state?.targetUserName}
          />
        )}
      </AnimatePresence>
    </div>
  );
}