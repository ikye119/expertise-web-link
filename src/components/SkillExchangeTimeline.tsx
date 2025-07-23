import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Clock, Users, CheckCircle, XCircle, MessageCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { formatDistanceToNow } from 'date-fns';

interface Exchange {
  id: string;
  user1_id: string;
  user2_id: string;
  skill_name: string;
  status: string;
  connected_at: string;
  partner_name?: string;
}

export function SkillExchangeTimeline() {
  const [exchanges, setExchanges] = useState<Exchange[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();

  const fetchExchanges = async () => {
    if (!user) return;

    try {
      const { data: connections, error } = await supabase
        .from('match_connections')
        .select('*')
        .or(`user1_id.eq.${user.id},user2_id.eq.${user.id}`)
        .order('connected_at', { ascending: false });

      if (error) throw error;

      // Get partner profiles
      const partnerIds = connections?.map(conn => 
        conn.user1_id === user.id ? conn.user2_id : conn.user1_id
      ) || [];

      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, display_name')
        .in('user_id', partnerIds);

      const exchangeHistory = connections?.map(conn => {
        const partnerId = conn.user1_id === user.id ? conn.user2_id : conn.user1_id;
        const partner = profiles?.find(p => p.user_id === partnerId);
        
        return {
          ...conn,
          partner_name: partner?.display_name || 'Anonymous User'
        };
      }) || [];

      setExchanges(exchangeHistory);
    } catch (error) {
      console.error('Error fetching exchange timeline:', error);
      toast({
        title: "Error",
        description: "Failed to load exchange history",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchExchanges();

    // Set up real-time subscription
    const channel = supabase
      .channel('exchange_timeline')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'match_connections'
        },
        () => {
          fetchExchanges();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <MessageCircle className="h-4 w-4 text-blue-400" />;
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-400" />;
      case 'cancelled':
        return <XCircle className="h-4 w-4 text-red-400" />;
      default:
        return <Clock className="h-4 w-4 text-yellow-400" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'glow-blue';
      case 'completed':
        return 'glow-green';
      case 'cancelled':
        return 'glow-pink';
      default:
        return 'glow-blue';
    }
  };

  if (isLoading) {
    return (
      <Card className="glass-effect neon-border">
        <CardContent className="flex items-center justify-center py-8">
          <div className="terminal-text">[LOADING_EXCHANGE_HISTORY...]</div>
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary ml-4"></div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="glass-effect neon-border">
      <CardHeader>
        <CardTitle className="neon-text font-orbitron flex items-center gap-2">
          <Users className="h-5 w-5" />
          Skill Exchange Timeline
        </CardTitle>
      </CardHeader>
      <CardContent>
        {exchanges.length === 0 ? (
          <p className="terminal-text text-center py-8">
            {'{> NO_EXCHANGE_HISTORY}'}
            <br />
            {'{> START_CONNECTING_TO_BUILD_TIMELINE}'}
          </p>
        ) : (
          <div className="space-y-4">
            {exchanges.map((exchange, index) => (
              <motion.div
                key={exchange.id}
                initial={{ opacity: 0, x: index % 2 === 0 ? -50 : 50 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className={`timeline-card p-4 rounded-lg glass-effect neon-border ${getStatusColor(exchange.status)} hover:scale-105 transition-all duration-300`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    {getStatusIcon(exchange.status)}
                    <h4 className="font-medium neon-text font-orbitron">
                      {exchange.partner_name}
                    </h4>
                  </div>
                  <Badge 
                    variant="outline" 
                    className={`floating-badge ${getStatusColor(exchange.status)}`}
                  >
                    {exchange.status.toUpperCase()}
                  </Badge>
                </div>
                
                <p className="text-sm text-muted-foreground terminal-text mb-2">
                  Skill: {exchange.skill_name}
                </p>
                
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Clock className="h-3 w-3" />
                  <span className="terminal-text">
                    Connected {formatDistanceToNow(new Date(exchange.connected_at))} ago
                  </span>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}