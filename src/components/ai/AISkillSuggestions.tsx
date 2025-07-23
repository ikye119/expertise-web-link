import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Sparkles, Brain, TrendingUp, Plus, Loader2, Lightbulb, Target } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

interface SkillSuggestion {
  skill_name: string;
  type: 'learn' | 'teach';
  reason: string;
  category: 'technical' | 'creative' | 'business' | 'soft-skill';
}

interface AISkillSuggestionsProps {
  onSkillAdded?: () => void;
}

export function AISkillSuggestions({ onSkillAdded }: AISkillSuggestionsProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [suggestions, setSuggestions] = useState<SkillSuggestion[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [addingSkills, setAddingSkills] = useState<Set<string>>(new Set());
  const { user } = useAuth();
  const { toast } = useToast();

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'technical': return '⚡';
      case 'creative': return '🎨';
      case 'business': return '💼';
      case 'soft-skill': return '🧠';
      default: return '💡';
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'technical': return 'bg-blue-500/20 text-blue-300 border-blue-500/30';
      case 'creative': return 'bg-purple-500/20 text-purple-300 border-purple-500/30';
      case 'business': return 'bg-green-500/20 text-green-300 border-green-500/30';
      case 'soft-skill': return 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30';
      default: return 'bg-gray-500/20 text-gray-300 border-gray-500/30';
    }
  };

  const fetchSuggestions = async () => {
    if (!user) return;

    setIsLoading(true);
    try {
      // Get user's current skills
      const { data: userSkills, error: skillsError } = await supabase
        .from('skills')
        .select('skill_name, is_teaching, is_learning')
        .eq('user_id', user.id);

      if (skillsError) throw skillsError;

      // Get popular skills on the platform
      const { data: popularSkillsData, error: popularError } = await supabase
        .from('skills')
        .select('skill_name')
        .limit(20);

      if (popularError) throw popularError;

      // Extract most common skills
      const skillCounts: { [key: string]: number } = {};
      popularSkillsData?.forEach(skill => {
        skillCounts[skill.skill_name] = (skillCounts[skill.skill_name] || 0) + 1;
      });

      const popularSkills = Object.entries(skillCounts)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 10)
        .map(([skill]) => skill);

      // Call AI suggestions edge function
      const { data, error } = await supabase.functions.invoke('suggest-skills', {
        body: {
          userSkills: userSkills || [],
          popularSkills
        }
      });

      if (error) throw error;

      setSuggestions(data.suggestions || []);
      setIsOpen(true);
    } catch (error) {
      console.error('Error fetching suggestions:', error);
      toast({
        title: "Error",
        description: "Failed to generate skill suggestions. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const addSkillToProfile = async (suggestion: SkillSuggestion) => {
    if (!user) return;

    setAddingSkills(prev => new Set([...prev, suggestion.skill_name]));

    try {
      const { error } = await supabase
        .from('skills')
        .insert({
          user_id: user.id,
          skill_name: suggestion.skill_name,
          is_teaching: suggestion.type === 'teach',
          is_learning: suggestion.type === 'learn',
          skill_level: suggestion.type === 'teach' ? 3 : 1,
          urgency: 2
        });

      if (error) throw error;

      toast({
        title: "Skill Added!",
        description: `${suggestion.skill_name} has been added to your profile`,
      });

      onSkillAdded?.();
      
      // Remove from suggestions
      setSuggestions(prev => prev.filter(s => s.skill_name !== suggestion.skill_name));
    } catch (error) {
      console.error('Error adding skill:', error);
      toast({
        title: "Error",
        description: "Failed to add skill to your profile",
        variant: "destructive"
      });
    } finally {
      setAddingSkills(prev => {
        const newSet = new Set(prev);
        newSet.delete(suggestion.skill_name);
        return newSet;
      });
    }
  };

  return (
    <>
      <motion.div
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
      >
        <Button
          onClick={fetchSuggestions}
          disabled={isLoading}
          className="w-full glow-purple hover:glow-pink transition-all duration-300 group"
        >
          {isLoading ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Generating Suggestions...
            </>
          ) : (
            <>
              <Sparkles className="h-4 w-4 mr-2 group-hover:animate-pulse" />
              AI Skill Suggestions
            </>
          )}
        </Button>
      </motion.div>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="glass-effect border-primary/20 neon-border max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="neon-text font-orbitron flex items-center gap-2">
              <Brain className="h-6 w-6 text-purple-400" />
              [AI_SKILL_ADVISOR_SYSTEM]
            </DialogTitle>
            <p className="text-muted-foreground terminal-text">
              Personalized skill recommendations based on your profile and platform trends
            </p>
          </DialogHeader>

          <div className="space-y-6 mt-6">
            {suggestions.length === 0 ? (
              <div className="text-center py-8">
                <Lightbulb className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="terminal-text text-muted-foreground">
                  No suggestions available. Try again later.
                </p>
              </div>
            ) : (
              <div className="grid gap-4">
                <AnimatePresence>
                  {suggestions.map((suggestion, index) => (
                    <motion.div
                      key={suggestion.skill_name}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, x: -100 }}
                      transition={{ delay: index * 0.1 }}
                    >
                      <Card className="glass-effect terminal-glow border-primary/20 hover:border-primary/40 transition-all duration-300">
                        <CardContent className="p-6">
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1">
                              <div className="flex items-center gap-3 mb-3">
                                <span className="text-2xl">
                                  {getCategoryIcon(suggestion.category)}
                                </span>
                                <div>
                                  <h3 className="text-lg font-orbitron neon-text">
                                    {suggestion.skill_name}
                                  </h3>
                                  <div className="flex items-center gap-2 mt-1">
                                    <Badge 
                                      className={`text-xs ${
                                        suggestion.type === 'learn' 
                                          ? 'bg-blue-500/20 text-blue-300 border-blue-500/30'
                                          : 'bg-green-500/20 text-green-300 border-green-500/30'
                                      }`}
                                    >
                                      {suggestion.type === 'learn' ? 'Learn' : 'Teach'}
                                    </Badge>
                                    <Badge className={getCategoryColor(suggestion.category)}>
                                      {suggestion.category.replace('-', ' ')}
                                    </Badge>
                                  </div>
                                </div>
                              </div>
                              
                              <p className="text-sm text-muted-foreground terminal-text">
                                <Target className="h-4 w-4 inline mr-2" />
                                {suggestion.reason}
                              </p>
                            </div>

                            <Button
                              onClick={() => addSkillToProfile(suggestion)}
                              disabled={addingSkills.has(suggestion.skill_name)}
                              className="glow-green hover:glow-pink transition-all duration-300 min-w-[120px]"
                            >
                              {addingSkills.has(suggestion.skill_name) ? (
                                <>
                                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                  Adding...
                                </>
                              ) : (
                                <>
                                  <Plus className="h-4 w-4 mr-2" />
                                  Add Skill
                                </>
                              )}
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            )}

            <div className="flex justify-between items-center pt-4 border-t border-primary/20">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <TrendingUp className="h-4 w-4" />
                Powered by AI analysis of your skills and platform trends
              </div>
              <Button
                variant="outline"
                onClick={() => setIsOpen(false)}
                className="glass-effect border-primary/20"
              >
                Close
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}