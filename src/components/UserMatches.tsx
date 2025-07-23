import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { MessageCircle, Star, Zap } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

interface UserSkill {
  id: string;
  skill_name: string;
  is_teaching: boolean;
  is_learning: boolean;
  user_id: string;
  display_name: string | null;
  skill_level: number;
  urgency: number;
  timezone?: string;
}

interface MatchedUser {
  user_id: string;
  display_name: string | null;
  skill_name: string;
  is_teaching: boolean;
  is_learning: boolean;
  skill_level: number;
  urgency: number;
  timezone?: string;
  match_score: number;
  score_breakdown: {
    skill_diff: number;
    urgency_bonus: number;
    timezone_bonus: number;
  };
}

export function UserMatches() {
  const [matches, setMatches] = useState<MatchedUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isConnecting, setIsConnecting] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  const sendConnectionRequest = async (recipientId: string, skillName: string) => {
    if (!user || isConnecting) return;

    setIsConnecting(true);
    try {
      // Create a connection record
      const { error: connectionError } = await supabase
        .from('match_connections')
        .insert({
          user1_id: user.id,
          user2_id: recipientId,
          skill_name: skillName
        });

      if (connectionError) throw connectionError;

      // Send initial message
      const { error: messageError } = await supabase
        .from('messages')
        .insert({
          sender_id: user.id,
          recipient_id: recipientId,
          content: `Hi! I'd like to connect for skill exchange: ${skillName}`
        });

      if (messageError) throw messageError;

      toast({
        title: "Connection sent!",
        description: "Your connection request and initial message have been sent."
      });
    } catch (error) {
      console.error('Error sending connection:', error);
      toast({
        title: "Error",
        description: "Failed to send connection request",
        variant: "destructive"
      });
    } finally {
      setIsConnecting(false);
    }
  };

  const calculateMatchScore = (
    mySkill: any,
    theirSkill: any,
    myTimezone: string = 'UTC',
    theirTimezone: string = 'UTC'
  ) => {
    // Skill level difference (prefer similar levels, max 20 points)
    const skillDiff = Math.abs(mySkill.skill_level - theirSkill.skill_level);
    const skillDiffScore = Math.max(0, 20 - skillDiff * 5);

    // Urgency bonus (both urgencies combined, max 30 points)
    const urgencyScore = (mySkill.urgency + theirSkill.urgency) * 5;

    // Timezone bonus (same timezone gets 15 points, close zones get partial)
    let timezoneScore = 0;
    if (myTimezone === theirTimezone) {
      timezoneScore = 15;
    } else {
      // Simple timezone proximity check (could be enhanced)
      timezoneScore = 5;
    }

    const totalScore = skillDiffScore + urgencyScore + timezoneScore;

    return {
      total: totalScore,
      breakdown: {
        skill_diff: skillDiffScore,
        urgency_bonus: urgencyScore,
        timezone_bonus: timezoneScore
      }
    };
  };

  const fetchMatches = async () => {
    if (!user) return;

    try {
      // Get current user's skills with all fields
      const { data: mySkills, error: mySkillsError } = await supabase
        .from('skills')
        .select('skill_name, is_teaching, is_learning, skill_level, urgency')
        .eq('user_id', user.id);

      if (mySkillsError) throw mySkillsError;

      if (!mySkills || mySkills.length === 0) {
        setIsLoading(false);
        return;
      }

      // Get current user's profile for timezone
      const { data: myProfile } = await supabase
        .from('profiles')
        .select('timezone')
        .eq('user_id', user.id)
        .single();

      // Find potential matches with all fields
      const { data: potentialMatches, error: matchesError } = await supabase
        .from('skills')
        .select('skill_name, is_teaching, is_learning, skill_level, urgency, user_id')
        .neq('user_id', user.id);

      if (matchesError) throw matchesError;

      // Get profiles for the matched users
      const userIds = potentialMatches?.map(match => match.user_id) || [];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, display_name, timezone')
        .in('user_id', userIds);

      // Calculate weighted scores for complementary skills
      const scoredMatches: MatchedUser[] = [];
      
      potentialMatches?.forEach(theirSkill => {
        mySkills.forEach(mySkill => {
          // Check if skills are complementary
          if (
            mySkill.skill_name.toLowerCase() === theirSkill.skill_name.toLowerCase() &&
            ((mySkill.is_teaching && theirSkill.is_learning) || 
             (mySkill.is_learning && theirSkill.is_teaching))
          ) {
            const profile = profiles?.find(p => p.user_id === theirSkill.user_id);
            const score = calculateMatchScore(
              mySkill,
              theirSkill,
              myProfile?.timezone || 'UTC',
              profile?.timezone || 'UTC'
            );

            scoredMatches.push({
              user_id: theirSkill.user_id,
              display_name: profile?.display_name || null,
              skill_name: theirSkill.skill_name,
              is_teaching: theirSkill.is_teaching,
              is_learning: theirSkill.is_learning,
              skill_level: theirSkill.skill_level,
              urgency: theirSkill.urgency,
              timezone: profile?.timezone,
              match_score: score.total,
              score_breakdown: score.breakdown
            });
          }
        });
      });

      // Sort by match score (highest first) and take top matches
      const topMatches = scoredMatches
        .sort((a, b) => b.match_score - a.match_score)
        .slice(0, 10);

      setMatches(topMatches);
    } catch (error) {
      console.error('Error fetching matches:', error);
      toast({
        title: "Error",
        description: "Failed to load potential matches",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchMatches();
  }, [user]);

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="glass-effect neon-border">
      <CardHeader>
        <CardTitle className="neon-text font-orbitron flex items-center gap-2">
          <Zap className="h-5 w-5" />
          Skill Matches
        </CardTitle>
        <CardDescription>
          Connect with complementary skill partners
        </CardDescription>
      </CardHeader>
      <CardContent>
        {matches.length === 0 ? (
          <p className="text-muted-foreground text-center py-8">
            No matches found yet. Add more skills to find potential exchange partners!
          </p>
        ) : (
          <div className="space-y-3">
            {matches.map((match, index) => (
              <motion.div
                key={`${match.user_id}-${match.skill_name}-${index}`}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-3 sm:p-4 border rounded-lg bg-gradient-to-r from-background to-muted/20 glass-effect neon-border hover:glow-green transition-all duration-300 gap-3 sm:gap-4"
              >
                <div className="flex-1 w-full sm:w-auto">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-2 gap-2">
                    <h4 className="font-medium neon-text font-orbitron text-sm sm:text-base">{match.display_name || 'Anonymous User'}</h4>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs floating-badge glow-blue">
                        Score: {match.match_score}
                      </Badge>
                    </div>
                  </div>
                  
                  <p className="text-sm text-muted-foreground mb-2 terminal-text">{match.skill_name}</p>
                  
                  <div className="flex flex-wrap gap-1 sm:gap-2 mb-2">
                    {match.is_teaching && (
                      <Badge variant="default" className="floating-badge glow-green text-xs">Can teach (Lv {match.skill_level})</Badge>
                    )}
                    {match.is_learning && (
                      <Badge variant="secondary" className="floating-badge glow-blue text-xs">Learning (Lv {match.skill_level})</Badge>
                    )}
                    <Badge variant="outline" className={`floating-badge text-xs ${
                      match.urgency === 3 ? "border-red-500 text-red-600 glow-pink" :
                      match.urgency === 2 ? "border-yellow-500 text-yellow-600" :
                      "border-green-500 text-green-600 glow-green"
                    }`}>
                      {match.urgency === 3 ? "High" : match.urgency === 2 ? "Medium" : "Low"}
                    </Badge>
                  </div>
                  
                  <div className="text-xs text-muted-foreground terminal-text hidden sm:block">
                    <span>Match: </span>
                    <span>Skill ({match.score_breakdown.skill_diff}), </span>
                    <span>Urgency ({match.score_breakdown.urgency_bonus}), </span>
                    <span>Timezone ({match.score_breakdown.timezone_bonus})</span>
                    {match.timezone && <span> • {match.timezone}</span>}
                  </div>
                </div>
                
                <div className="w-full sm:w-auto sm:ml-4">
                  <Button 
                    onClick={() => sendConnectionRequest(match.user_id, match.skill_name)}
                    className="pulse-match glow-green hover:glow-pink transition-all duration-300 font-orbitron w-full sm:w-auto min-h-[48px] text-sm"
                    disabled={isConnecting}
                  >
                    <MessageCircle className="h-4 w-4 mr-2" />
                    Connect
                  </Button>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}