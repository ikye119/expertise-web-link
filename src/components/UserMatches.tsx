import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
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
}

export function UserMatches() {
  const [matches, setMatches] = useState<UserSkill[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();

  const fetchMatches = async () => {
    if (!user) return;

    try {
      // Get current user's skills
      const { data: mySkills, error: mySkillsError } = await supabase
        .from('skills')
        .select('skill_name, is_teaching, is_learning')
        .eq('user_id', user.id);

      if (mySkillsError) throw mySkillsError;

      if (!mySkills || mySkills.length === 0) {
        setIsLoading(false);
        return;
      }

      // Find potential matches
      const { data: potentialMatches, error: matchesError } = await supabase
        .from('skills')
        .select('id, skill_name, is_teaching, is_learning, user_id')
        .neq('user_id', user.id);

      if (matchesError) throw matchesError;

      // Get profiles for the matched users
      const userIds = potentialMatches?.map(match => match.user_id) || [];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, display_name')
        .in('user_id', userIds);

      // Combine skills with profile data
      const skillsWithProfiles = potentialMatches?.map(match => ({
        ...match,
        display_name: profiles?.find(p => p.user_id === match.user_id)?.display_name || null
      })) || [];

      // Filter for complementary skills
      const complementaryMatches = skillsWithProfiles.filter(match => {
        return mySkills.some(mySkill => {
          return (
            mySkill.skill_name.toLowerCase() === match.skill_name.toLowerCase() &&
            ((mySkill.is_teaching && match.is_learning) || 
             (mySkill.is_learning && match.is_teaching))
          );
        });
      });

      setMatches(complementaryMatches);
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
    <Card>
      <CardHeader>
        <CardTitle>Potential Matches</CardTitle>
        <CardDescription>
          People with complementary skills who might be interested in skill exchange
        </CardDescription>
      </CardHeader>
      <CardContent>
        {matches.length === 0 ? (
          <p className="text-muted-foreground text-center py-8">
            No matches found yet. Add more skills to find potential exchange partners!
          </p>
        ) : (
          <div className="space-y-3">
            {matches.map((match) => (
              <div
                key={match.id}
                className="flex items-center justify-between p-3 border rounded-lg"
              >
                <div className="flex-1">
                  <h4 className="font-medium">{match.display_name || 'Anonymous User'}</h4>
                  <p className="text-sm text-muted-foreground">{match.skill_name}</p>
                  <div className="flex gap-2 mt-1">
                    {match.is_teaching && (
                      <Badge variant="default">Can teach</Badge>
                    )}
                    {match.is_learning && (
                      <Badge variant="secondary">Wants to learn</Badge>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}