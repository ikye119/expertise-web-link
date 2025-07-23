import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { MessageSquare, Trash2, User, Clock, ArrowRightLeft } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { formatDistanceToNow } from 'date-fns';

interface SkillRequestData {
  id: string;
  from_user_id: string;
  to_user_id: string;
  skill_offered: string | null;
  skill_wanted: string | null;
  message: string | null;
  status: string;
  created_at: string;
  from_user_name: string | null;
  to_user_name: string | null;
}

export function RequestManagement() {
  const [requests, setRequests] = useState<SkillRequestData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  const fetchRequests = async () => {
    setIsLoading(true);
    try {
      // Get all skill requests
      const { data: requestsData, error: requestsError } = await supabase
        .from('skill_requests')
        .select('*')
        .order('created_at', { ascending: false });

      if (requestsError) throw requestsError;

      // Get user profiles for display names
      const userIds = requestsData?.flatMap(r => [r.from_user_id, r.to_user_id]) || [];
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('user_id, display_name')
        .in('user_id', [...new Set(userIds)]);

      if (profilesError) throw profilesError;

      // Combine data
      const enrichedRequests = requestsData?.map(request => {
        const fromProfile = profilesData?.find(p => p.user_id === request.from_user_id);
        const toProfile = profilesData?.find(p => p.user_id === request.to_user_id);

        return {
          ...request,
          from_user_name: fromProfile?.display_name || null,
          to_user_name: toProfile?.display_name || null
        };
      }) || [];

      setRequests(enrichedRequests);
    } catch (error) {
      console.error('Error fetching requests:', error);
      toast({
        title: "Error",
        description: "Failed to load skill requests",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const handleDeleteRequest = async (requestId: string) => {
    try {
      const { error } = await supabase
        .from('skill_requests')
        .delete()
        .eq('id', requestId);

      if (error) throw error;

      toast({
        title: "Request Deleted",
        description: "Skill request has been removed from the system",
      });

      fetchRequests();
    } catch (error) {
      console.error('Error deleting request:', error);
      toast({
        title: "Error",
        description: "Failed to delete request",
        variant: "destructive"
      });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'accepted':
        return 'bg-green-500/20 text-green-300 border-green-500/30';
      case 'declined':
        return 'bg-red-500/20 text-red-300 border-red-500/30';
      case 'pending':
        return 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30';
      default:
        return 'bg-gray-500/20 text-gray-300 border-gray-500/30';
    }
  };

  if (isLoading) {
    return (
      <Card className="glass-effect terminal-glow">
        <CardContent className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          <span className="ml-4 terminal-text">[LOADING_REQUEST_DATA...]</span>
        </CardContent>
      </Card>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-4"
    >
      <Card className="glass-effect neon-border terminal-glow">
        <CardHeader>
          <CardTitle className="neon-text font-orbitron flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            [REQUEST_MANAGEMENT_SYS] - {requests.length} Requests
          </CardTitle>
        </CardHeader>
        <CardContent>
          {requests.length === 0 ? (
            <p className="text-center text-muted-foreground terminal-text py-8">
              {'{> NO_SKILL_REQUESTS_FOUND}'}
            </p>
          ) : (
            <div className="space-y-4">
              {requests.map((request, index) => (
                <motion.div
                  key={request.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Card className="glass-effect terminal-glow">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1 space-y-3">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <ArrowRightLeft className="h-8 w-8 p-1.5 bg-primary/20 rounded-full text-primary" />
                              <div>
                                <h3 className="font-medium neon-text">
                                  [REQUEST] {request.from_user_name || 'Anonymous'} → {request.to_user_name || 'Anonymous'}
                                </h3>
                                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                  <Clock className="h-3 w-3" />
                                  {formatDistanceToNow(new Date(request.created_at))} ago
                                </div>
                              </div>
                            </div>
                            <Badge className={getStatusColor(request.status)}>
                              {request.status.toUpperCase()}
                            </Badge>
                          </div>

                          {/* Skills Exchange Details */}
                          {(request.skill_offered || request.skill_wanted) && (
                            <div className="space-y-2">
                              {request.skill_offered && (
                                <div>
                                  <span className="text-sm font-medium text-green-400 terminal-text">
                                    [OFFERING]: 
                                  </span>
                                  <Badge variant="secondary" className="ml-2 bg-green-500/20 text-green-300">
                                    {request.skill_offered}
                                  </Badge>
                                </div>
                              )}
                              {request.skill_wanted && (
                                <div>
                                  <span className="text-sm font-medium text-blue-400 terminal-text">
                                    [SEEKING]: 
                                  </span>
                                  <Badge variant="secondary" className="ml-2 bg-blue-500/20 text-blue-300">
                                    {request.skill_wanted}
                                  </Badge>
                                </div>
                              )}
                            </div>
                          )}

                          {/* Message */}
                          {request.message && (
                            <div className="glass-effect rounded-lg p-3">
                              <span className="text-sm font-medium terminal-text text-muted-foreground">Message:</span>
                              <p className="text-sm terminal-text mt-1">"{request.message}"</p>
                            </div>
                          )}

                          <div className="text-xs text-muted-foreground terminal-text">
                            Request ID: {request.id}
                          </div>
                        </div>

                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              variant="destructive"
                              size="sm"
                              className="ml-4"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent className="glass-effect neon-border">
                            <AlertDialogHeader>
                              <AlertDialogTitle className="neon-text font-orbitron">
                                [CONFIRM_REQUEST_DELETION]
                              </AlertDialogTitle>
                              <AlertDialogDescription className="terminal-text">
                                Are you sure you want to delete this skill request? This action cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel className="glass-effect">
                                Cancel
                              </AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleDeleteRequest(request.id)}
                                className="bg-destructive text-destructive-foreground"
                              >
                                Delete Request
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}