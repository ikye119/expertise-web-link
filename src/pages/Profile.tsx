import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Home, User, Edit, Plus, BookOpen, GraduationCap, Star } from 'lucide-react';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { ProfileEditor } from '@/components/profile/ProfileEditor';
import { SkillForm } from '@/components/SkillForm';
import { ReviewsOverview } from '@/components/reviews/ReviewsOverview';

interface ProfileData {
  display_name: string | null;
  bio: string | null;
  location: string | null;
  availability_status: string;
  avatar_url: string | null;
}

interface Skill {
  id: string;
  skill_name: string;
  is_teaching: boolean;
  is_learning: boolean;
  skill_level: number;
  urgency: number;
}

export default function Profile() {
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [skills, setSkills] = useState<Skill[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [showSkillForm, setShowSkillForm] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  const fetchProfile = async () => {
    if (!user) return;

    try {
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (profileError && profileError.code !== 'PGRST116') throw profileError;

      setProfile(profileData);

      const { data: skillsData, error: skillsError } = await supabase
        .from('skills')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (skillsError) throw skillsError;

      setSkills(skillsData || []);
    } catch (error) {
      console.error('Error fetching profile:', error);
      toast({
        title: "Error",
        description: "Failed to load profile",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, [user]);

  const handleSkillAdded = () => {
    setShowSkillForm(false);
    fetchProfile();
  };

  const handleDeleteSkill = async (skillId: string) => {
    try {
      const { error } = await supabase
        .from('skills')
        .delete()
        .eq('id', skillId);

      if (error) throw error;

      toast({
        title: "Skill Deleted",
        description: "Skill has been removed from your profile",
      });

      fetchProfile();
    } catch (error) {
      console.error('Error deleting skill:', error);
      toast({
        title: "Error",
        description: "Failed to delete skill",
        variant: "destructive"
      });
    }
  };

  const getAvailabilityColor = (status: string) => {
    switch (status) {
      case 'available':
        return 'bg-green-500/20 text-green-300 border-green-500/30';
      case 'busy':
        return 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30';
      case 'away':
        return 'bg-orange-500/20 text-orange-300 border-orange-500/30';
      case 'offline':
        return 'bg-gray-500/20 text-gray-300 border-gray-500/30';
      default:
        return 'bg-blue-500/20 text-blue-300 border-blue-500/30';
    }
  };

  const teachingSkills = skills.filter(s => s.is_teaching);
  const learningSkills = skills.filter(s => s.is_learning);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-primary flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        <span className="ml-4 terminal-text">[LOADING_USER_PROFILE...]</span>
      </div>
    );
  }

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
              [USER_PROFILE_SYS]
            </h1>
          </div>
        </motion.div>

        {/* Profile Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-6"
        >
          <Card className="glass-effect neon-border terminal-glow">
            <CardContent className="p-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
                <div className="relative">
                  {profile?.avatar_url ? (
                    <img
                      src={profile.avatar_url}
                      alt="Profile Avatar"
                      className="w-24 h-24 rounded-full object-cover border-2 border-primary glow-blue"
                    />
                  ) : (
                    <div className="w-24 h-24 rounded-full bg-primary/20 border-2 border-primary glow-blue flex items-center justify-center">
                      <User className="h-12 w-12 text-primary" />
                    </div>
                  )}
                  <Badge 
                    className={`absolute -bottom-2 -right-2 ${getAvailabilityColor(profile?.availability_status || 'available')}`}
                  >
                    {profile?.availability_status || 'available'}
                  </Badge>
                </div>

                <div className="flex-1">
                  <h2 className="text-2xl font-orbitron font-bold neon-text mb-2">
                    [USER] {profile?.display_name || 'Anonymous User'}
                  </h2>
                  {profile?.bio && (
                    <p className="text-muted-foreground terminal-text mb-2">
                      "{profile.bio}"
                    </p>
                  )}
                  {profile?.location && (
                    <p className="text-sm text-muted-foreground">
                      📍 {profile.location}
                    </p>
                  )}
                </div>

                <div className="flex gap-2">
                  <Button
                    onClick={() => setActiveTab('edit')}
                    className="glow-green hover:glow-pink transition-all duration-300 pulse-match"
                  >
                    <Edit className="h-4 w-4 mr-2" />
                    Edit Profile
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Profile Tabs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-4 glass-effect">
              <TabsTrigger 
                value="overview" 
                className="data-[state=active]:glow-blue"
              >
                <User className="h-4 w-4 mr-2" />
                Overview
              </TabsTrigger>
              <TabsTrigger 
                value="reviews"
                className="data-[state=active]:glow-yellow"
              >
                <Star className="h-4 w-4 mr-2" />
                Reviews
              </TabsTrigger>
              <TabsTrigger 
                value="skills"
                className="data-[state=active]:glow-green"
              >
                <GraduationCap className="h-4 w-4 mr-2" />
                Skills
              </TabsTrigger>
              <TabsTrigger 
                value="edit"
                className="data-[state=active]:glow-pink"
              >
                <Edit className="h-4 w-4 mr-2" />
                Edit
              </TabsTrigger>
            </TabsList>

            <div className="mt-6">
              <TabsContent value="overview" className="space-y-6">
                {/* Skills Overview */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Card className="glass-effect terminal-glow">
                    <CardHeader>
                      <CardTitle className="neon-text font-orbitron flex items-center gap-2">
                        <BookOpen className="h-5 w-5 text-green-400" />
                        [TEACHING] Skills Offered
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {teachingSkills.length === 0 ? (
                        <p className="text-muted-foreground terminal-text text-center py-4">
                          {'{> NO_SKILLS_OFFERED}'}
                        </p>
                      ) : (
                        <div className="flex flex-wrap gap-2">
                          {teachingSkills.map((skill) => (
                            <Badge 
                              key={skill.id}
                              variant="secondary" 
                              className="floating-badge bg-green-500/20 text-green-300 border-green-500/30"
                            >
                              {skill.skill_name}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  <Card className="glass-effect terminal-glow">
                    <CardHeader>
                      <CardTitle className="neon-text font-orbitron flex items-center gap-2">
                        <GraduationCap className="h-5 w-5 text-blue-400" />
                        [LEARNING] Skills Seeking
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {learningSkills.length === 0 ? (
                        <p className="text-muted-foreground terminal-text text-center py-4">
                          {'{> NO_SKILLS_SEEKING}'}
                        </p>
                      ) : (
                        <div className="flex flex-wrap gap-2">
                          {learningSkills.map((skill) => (
                            <Badge 
                              key={skill.id}
                              variant="secondary" 
                              className="floating-badge bg-blue-500/20 text-blue-300 border-blue-500/30"
                            >
                              {skill.skill_name}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              <TabsContent value="reviews" className="space-y-6">
                {user && (
                  <ReviewsOverview 
                    userId={user.id} 
                    displayName={profile?.display_name || 'Anonymous User'}
                    showDetailed={true}
                  />
                )}
              </TabsContent>

              <TabsContent value="skills" className="space-y-6">
                <div className="flex justify-between items-center">
                  <h2 className="text-xl font-orbitron neon-text">
                    [SKILL_MANAGEMENT_SYS]
                  </h2>
                  <Button
                    onClick={() => setShowSkillForm(true)}
                    className="glow-green hover:glow-pink transition-all duration-300"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Skill
                  </Button>
                </div>

                {showSkillForm && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                  >
                    <SkillForm 
                      onSkillAdded={handleSkillAdded}
                    />
                  </motion.div>
                )}

                {skills.length === 0 ? (
                  <Card className="glass-effect terminal-glow">
                    <CardContent className="text-center py-12">
                      <GraduationCap className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <p className="terminal-text text-muted-foreground">
                        {'{> NO_SKILLS_CONFIGURED}'}
                      </p>
                      <Button
                        onClick={() => setShowSkillForm(true)}
                        className="mt-4 glow-green hover:glow-pink transition-all duration-300"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Add Your First Skill
                      </Button>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="space-y-4">
                    {skills.map((skill, index) => (
                      <motion.div
                        key={skill.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1 }}
                      >
                        <Card className="glass-effect terminal-glow">
                          <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <div className="flex flex-col">
                                  <h3 className="font-medium neon-text">
                                    {skill.skill_name}
                                  </h3>
                                  <div className="flex gap-2 mt-1">
                                    {skill.is_teaching && (
                                      <Badge className="bg-green-500/20 text-green-300 border-green-500/30 text-xs">
                                        Teaching
                                      </Badge>
                                    )}
                                    {skill.is_learning && (
                                      <Badge className="bg-blue-500/20 text-blue-300 border-blue-500/30 text-xs">
                                        Learning
                                      </Badge>
                                    )}
                                  </div>
                                </div>
                              </div>
                              <Button
                                onClick={() => handleDeleteSkill(skill.id)}
                                variant="destructive"
                                size="sm"
                              >
                                Delete
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      </motion.div>
                    ))}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="edit">
                <ProfileEditor onProfileUpdate={fetchProfile} />
              </TabsContent>
            </div>
          </Tabs>
        </motion.div>
      </div>
    </div>
  );
}