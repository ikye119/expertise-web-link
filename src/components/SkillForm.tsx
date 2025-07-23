import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

interface SkillFormProps {
  onSkillAdded: () => void;
}

export function SkillForm({ onSkillAdded }: SkillFormProps) {
  const [skillName, setSkillName] = useState('');
  const [isTeaching, setIsTeaching] = useState(false);
  const [isLearning, setIsLearning] = useState(false);
  const [skillLevel, setSkillLevel] = useState(1);
  const [urgency, setUrgency] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) return;
    if (!isTeaching && !isLearning) {
      toast({
        title: "Error",
        description: "Please select at least one option (teaching or learning)",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);

    try {
        const { error } = await supabase
          .from('skills')
          .insert([
            {
              user_id: user.id,
              skill_name: skillName.trim(),
              is_teaching: isTeaching,
              is_learning: isLearning,
              skill_level: skillLevel,
              urgency: urgency
            }
          ]);

      if (error) throw error;

      toast({
        title: "Success!",
        description: "Skill added successfully"
      });

      setSkillName('');
      setIsTeaching(false);
      setIsLearning(false);
      setSkillLevel(1);
      setUrgency(1);
      onSkillAdded();
    } catch (error) {
      console.error('Error adding skill:', error);
      toast({
        title: "Error",
        description: "Failed to add skill. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Add a Skill</CardTitle>
        <CardDescription>
          Share what you can teach or what you want to learn
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="skillName">Skill Name</Label>
            <Input
              id="skillName"
              placeholder="e.g. Guitar, Python, Cooking, Design"
              value={skillName}
              onChange={(e) => setSkillName(e.target.value)}
              required
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="skillLevel">Skill Level</Label>
              <Select value={skillLevel.toString()} onValueChange={(value) => setSkillLevel(parseInt(value))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">Beginner</SelectItem>
                  <SelectItem value="2">Basic</SelectItem>
                  <SelectItem value="3">Intermediate</SelectItem>
                  <SelectItem value="4">Advanced</SelectItem>
                  <SelectItem value="5">Expert</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="urgency">Urgency</Label>
              <Select value={urgency.toString()} onValueChange={(value) => setUrgency(parseInt(value))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">Low</SelectItem>
                  <SelectItem value="2">Medium</SelectItem>
                  <SelectItem value="3">High</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-3">
            <Label>What would you like to do?</Label>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="teaching"
                checked={isTeaching}
                onCheckedChange={(checked) => setIsTeaching(checked as boolean)}
              />
              <Label htmlFor="teaching">I can teach this skill</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="learning"
                checked={isLearning}
                onCheckedChange={(checked) => setIsLearning(checked as boolean)}
              />
              <Label htmlFor="learning">I want to learn this skill</Label>
            </div>
          </div>

          <Button type="submit" disabled={isLoading} className="w-full">
            {isLoading ? 'Adding...' : 'Add Skill'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}