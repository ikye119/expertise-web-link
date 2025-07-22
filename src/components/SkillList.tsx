import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { Trash2 } from 'lucide-react';

interface Skill {
  id: string;
  skill_name: string;
  is_teaching: boolean;
  is_learning: boolean;
  created_at: string;
}

interface SkillListProps {
  refreshTrigger: number;
}

export function SkillList({ refreshTrigger }: SkillListProps) {
  const [skills, setSkills] = useState<Skill[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();

  const fetchSkills = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('skills')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setSkills(data || []);
    } catch (error) {
      console.error('Error fetching skills:', error);
      toast({
        title: "Error",
        description: "Failed to load skills",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const deleteSkill = async (skillId: string) => {
    try {
      const { error } = await supabase
        .from('skills')
        .delete()
        .eq('id', skillId);

      if (error) throw error;

      setSkills(skills.filter(skill => skill.id !== skillId));
      toast({
        title: "Success",
        description: "Skill deleted successfully"
      });
    } catch (error) {
      console.error('Error deleting skill:', error);
      toast({
        title: "Error",
        description: "Failed to delete skill",
        variant: "destructive"
      });
    }
  };

  useEffect(() => {
    fetchSkills();
  }, [user, refreshTrigger]);

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
        <CardTitle>Your Skills</CardTitle>
        <CardDescription>
          Manage the skills you can teach and want to learn
        </CardDescription>
      </CardHeader>
      <CardContent>
        {skills.length === 0 ? (
          <p className="text-muted-foreground text-center py-8">
            No skills added yet. Add your first skill above!
          </p>
        ) : (
          <div className="space-y-3">
            {skills.map((skill) => (
              <div
                key={skill.id}
                className="flex items-center justify-between p-3 border rounded-lg"
              >
                <div className="flex-1">
                  <h4 className="font-medium">{skill.skill_name}</h4>
                  <div className="flex gap-2 mt-1">
                    {skill.is_teaching && (
                      <Badge variant="default">Teaching</Badge>
                    )}
                    {skill.is_learning && (
                      <Badge variant="secondary">Learning</Badge>
                    )}
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => deleteSkill(skill.id)}
                  className="text-destructive hover:text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}