import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, Filter, Zap, Users } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { MatchCard } from './MatchCard';

interface Match {
  user_id: string;
  display_name: string | null;
  bio: string | null;
  location: string | null;
  skills_offered: string[];
  skills_wanted: string[];
  compatibility_score: number;
  is_mutual: boolean;
}

interface SkillMatchEngineProps {
  onOfferSwap: (userId: string, displayName: string) => void;
}

export function SkillMatchEngine({ onOfferSwap }: SkillMatchEngineProps) {
  const [matches, setMatches] = useState<Match[]>([]);
  const [filteredMatches, setFilteredMatches] = useState<Match[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'compatibility' | 'mutual' | 'recent'>('compatibility');
  const { user } = useAuth();
  const { toast } = useToast();

  const findMatches = async () => {
    if (!user) return;

    setIsLoading(true);
    try {
      // Get current user's skills
      const { data: mySkills, error: mySkillsError } = await supabase
        .from('skills')
        .select('skill_name, is_teaching, is_learning')
        .eq('user_id', user.id);

      if (mySkillsError) throw mySkillsError;

      const skillsITeach = mySkills?.filter(s => s.is_teaching).map(s => s.skill_name) || [];
      const skillsIWant = mySkills?.filter(s => s.is_learning).map(s => s.skill_name) || [];

      if (skillsITeach.length === 0 && skillsIWant.length === 0) {
        setMatches([]);
        setIsLoading(false);
        return;
      }

      // Get all other users with their skills and profiles
      const { data: otherUsersSkills, error: otherSkillsError } = await supabase
        .from('skills')
        .select(`
          user_id,
          skill_name,
          is_teaching,
          is_learning,
          profiles!inner (
            display_name,
            bio,
            location
          )
        `)
        .neq('user_id', user.id);

      if (otherSkillsError) throw otherSkillsError;

      // Group skills by user
      const userSkillsMap = new Map();
      otherUsersSkills?.forEach(skill => {
        if (!userSkillsMap.has(skill.user_id)) {
          userSkillsMap.set(skill.user_id, {
            user_id: skill.user_id,
            profile: skill.profiles,
            skills_offered: [],
            skills_wanted: []
          });
        }
        
        const userSkills = userSkillsMap.get(skill.user_id);
        if (skill.is_teaching) {
          userSkills.skills_offered.push(skill.skill_name);
        }
        if (skill.is_learning) {
          userSkills.skills_wanted.push(skill.skill_name);
        }
      });

      // Calculate matches and compatibility scores
      const calculatedMatches: Match[] = [];
      
      userSkillsMap.forEach((userData) => {
        const { user_id, profile, skills_offered, skills_wanted } = userData;
        
        // Check if there's any skill overlap
        const canTeachThem = skillsITeach.some(skill => skills_wanted.includes(skill));
        const theyCanTeachMe = skills_offered.some(skill => skillsIWant.includes(skill));
        
        if (canTeachThem || theyCanTeachMe) {
          const mutualSkills = skillsITeach.filter(skill => skills_wanted.includes(skill)).length +
                              skills_offered.filter(skill => skillsIWant.includes(skill)).length;
          
          const totalPossibleMatches = Math.max(skillsITeach.length + skillsIWant.length, 1);
          const compatibilityScore = Math.min((mutualSkills / totalPossibleMatches) * 100, 100);
          
          const isMutual = canTeachThem && theyCanTeachMe;
          
          calculatedMatches.push({
            user_id,
            display_name: profile?.display_name || null,
            bio: profile?.bio || null,
            location: profile?.location || null,
            skills_offered,
            skills_wanted,
            compatibility_score: compatibilityScore,
            is_mutual: isMutual
          });
        }
      });

      // Sort matches by compatibility score
      calculatedMatches.sort((a, b) => {
        if (a.is_mutual && !b.is_mutual) return -1;
        if (!a.is_mutual && b.is_mutual) return 1;
        return b.compatibility_score - a.compatibility_score;
      });

      setMatches(calculatedMatches);
      setFilteredMatches(calculatedMatches);
    } catch (error) {
      console.error('Error finding matches:', error);
      toast({
        title: "Error",
        description: "Failed to find skill matches",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    findMatches();
  }, [user]);

  useEffect(() => {
    let filtered = [...matches];

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(match => 
        match.display_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        match.skills_offered.some(skill => skill.toLowerCase().includes(searchTerm.toLowerCase())) ||
        match.skills_wanted.some(skill => skill.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    // Apply sorting
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'mutual':
          if (a.is_mutual && !b.is_mutual) return -1;
          if (!a.is_mutual && b.is_mutual) return 1;
          return b.compatibility_score - a.compatibility_score;
        case 'compatibility':
          return b.compatibility_score - a.compatibility_score;
        case 'recent':
          return 0; // Keep original order for now
        default:
          return 0;
      }
    });

    setFilteredMatches(filtered);
  }, [matches, searchTerm, sortBy]);

  const mutualCount = matches.filter(m => m.is_mutual).length;

  return (
    <div className="space-y-6">
      {/* Header Stats */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="grid grid-cols-1 sm:grid-cols-3 gap-4"
      >
        <Card className="glass-effect terminal-glow">
          <CardContent className="p-4 text-center">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Users className="h-5 w-5 text-primary" />
              <span className="text-2xl font-bold neon-text">{matches.length}</span>
            </div>
            <p className="text-sm text-muted-foreground terminal-text">Total Matches</p>
          </CardContent>
        </Card>

        <Card className="glass-effect terminal-glow glow-pulse">
          <CardContent className="p-4 text-center">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Zap className="h-5 w-5 text-yellow-400" />
              <span className="text-2xl font-bold text-yellow-400">{mutualCount}</span>
            </div>
            <p className="text-sm text-muted-foreground terminal-text">Mutual Swaps</p>
          </CardContent>
        </Card>

        <Card className="glass-effect terminal-glow">
          <CardContent className="p-4 text-center">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Search className="h-5 w-5 text-blue-400" />
              <span className="text-2xl font-bold text-blue-400">{filteredMatches.length}</span>
            </div>
            <p className="text-sm text-muted-foreground terminal-text">Filtered Results</p>
          </CardContent>
        </Card>
      </motion.div>

      {/* Search and Filter Controls */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <Card className="glass-effect neon-border terminal-glow">
          <CardHeader>
            <CardTitle className="neon-text font-orbitron flex items-center gap-2">
              <Filter className="h-5 w-5" />
              [MATCH_FILTERS_SYS]
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <Input
                  placeholder="> SEARCH_SKILLS_OR_USERS..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="glass-effect border-primary/20 focus:border-primary/50 terminal-text"
                />
              </div>
              <Select value={sortBy} onValueChange={(value: any) => setSortBy(value)}>
                <SelectTrigger className="w-full sm:w-48 glass-effect border-primary/20">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="compatibility">Compatibility</SelectItem>
                  <SelectItem value="mutual">Mutual First</SelectItem>
                  <SelectItem value="recent">Recent</SelectItem>
                </SelectContent>
              </Select>
              <Button
                onClick={findMatches}
                className="glow-green hover:glow-pink transition-all duration-300"
              >
                <Search className="h-4 w-4 mr-2" />
                Refresh
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Matches Grid */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          <span className="ml-4 terminal-text">[CALCULATING_MATCHES...]</span>
        </div>
      ) : filteredMatches.length === 0 ? (
        <Card className="glass-effect terminal-glow">
          <CardContent className="text-center py-12">
            <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="terminal-text text-muted-foreground">
              {matches.length === 0 
                ? '{> NO_COMPATIBLE_MATCHES_FOUND}' 
                : '{> NO_MATCHES_FOR_CURRENT_FILTERS}'
              }
            </p>
            {matches.length === 0 && (
              <p className="text-sm text-muted-foreground mt-2">
                Try adding more skills to increase your match potential
              </p>
            )}
          </CardContent>
        </Card>
      ) : (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6"
        >
          {filteredMatches.map((match, index) => (
            <motion.div
              key={match.user_id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <MatchCard match={match} onOfferSwap={onOfferSwap} />
            </motion.div>
          ))}
        </motion.div>
      )}
    </div>
  );
}