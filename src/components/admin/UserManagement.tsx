import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { User, Trash2, Mail, MapPin, Shield } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface UserData {
  user_id: string;
  email: string;
  display_name: string | null;
  bio: string | null;
  location: string | null;
  role: string;
  skills_teaching: string[];
  skills_learning: string[];
  created_at: string;
}

export function UserManagement() {
  const [users, setUsers] = useState<UserData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      // Get all users with their auth data, profiles, roles, and skills
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select(`
          user_id,
          display_name,
          bio,
          location,
          created_at
        `);

      if (profilesError) throw profilesError;

      // Get user roles
      const { data: rolesData, error: rolesError } = await supabase
        .from('user_roles')
        .select('user_id, role');

      if (rolesError) throw rolesError;

      // Get user skills
      const { data: skillsData, error: skillsError } = await supabase
        .from('skills')
        .select('user_id, skill_name, is_teaching, is_learning');

      if (skillsError) throw skillsError;

      // Combine the data
      const usersMap = new Map();
      
      profilesData?.forEach(profile => {
        const userRole = rolesData?.find(r => r.user_id === profile.user_id);
        const userSkills = skillsData?.filter(s => s.user_id === profile.user_id) || [];
        
        usersMap.set(profile.user_id, {
          user_id: profile.user_id,
          email: 'N/A', // Auth users table is not accessible via API
          display_name: profile.display_name,
          bio: profile.bio,
          location: profile.location,
          role: userRole?.role || 'user',
          skills_teaching: userSkills.filter(s => s.is_teaching).map(s => s.skill_name),
          skills_learning: userSkills.filter(s => s.is_learning).map(s => s.skill_name),
          created_at: profile.created_at
        });
      });

      setUsers(Array.from(usersMap.values()));
    } catch (error) {
      console.error('Error fetching users:', error);
      toast({
        title: "Error",
        description: "Failed to load users",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleDeleteUser = async (userId: string, displayName: string) => {
    try {
      // Delete user's data (profiles, skills, messages, etc.)
      await supabase.from('profiles').delete().eq('user_id', userId);
      await supabase.from('skills').delete().eq('user_id', userId);
      await supabase.from('user_roles').delete().eq('user_id', userId);
      await supabase.from('messages').delete().or(`sender_id.eq.${userId},recipient_id.eq.${userId}`);
      await supabase.from('skill_requests').delete().or(`from_user_id.eq.${userId},to_user_id.eq.${userId}`);
      await supabase.from('notifications').delete().eq('user_id', userId);

      toast({
        title: "User Deleted",
        description: `${displayName || 'User'} has been removed from the system`,
      });

      fetchUsers();
    } catch (error) {
      console.error('Error deleting user:', error);
      toast({
        title: "Error",
        description: "Failed to delete user",
        variant: "destructive"
      });
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin':
        return 'bg-red-500/20 text-red-300 border-red-500/30';
      case 'user':
        return 'bg-blue-500/20 text-blue-300 border-blue-500/30';
      default:
        return 'bg-gray-500/20 text-gray-300 border-gray-500/30';
    }
  };

  if (isLoading) {
    return (
      <Card className="glass-effect terminal-glow">
        <CardContent className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          <span className="ml-4 terminal-text">[LOADING_USER_DATA...]</span>
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
            <User className="h-5 w-5" />
            [USER_MANAGEMENT_SYS] - {users.length} Users
          </CardTitle>
        </CardHeader>
        <CardContent>
          {users.length === 0 ? (
            <p className="text-center text-muted-foreground terminal-text py-8">
              {'{> NO_USERS_FOUND}'}
            </p>
          ) : (
            <div className="space-y-4">
              {users.map((user, index) => (
                <motion.div
                  key={user.user_id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Card className="glass-effect terminal-glow">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1 space-y-2">
                          <div className="flex items-center gap-3">
                            <User className="h-10 w-10 p-2 bg-primary/20 rounded-full text-primary" />
                            <div>
                              <h3 className="font-medium neon-text">
                                [USER] {user.display_name || 'Anonymous'}
                              </h3>
                              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <Mail className="h-3 w-3" />
                                {user.email}
                                <Badge className={getRoleColor(user.role)}>
                                  <Shield className="h-3 w-3 mr-1" />
                                  {user.role}
                                </Badge>
                              </div>
                            </div>
                          </div>

                          {user.bio && (
                            <p className="text-sm text-muted-foreground terminal-text">
                              "{user.bio}"
                            </p>
                          )}

                          {user.location && (
                            <div className="flex items-center gap-1 text-sm text-muted-foreground">
                              <MapPin className="h-3 w-3" />
                              {user.location}
                            </div>
                          )}

                          {/* Skills */}
                          {(user.skills_teaching.length > 0 || user.skills_learning.length > 0) && (
                            <div className="space-y-2">
                              {user.skills_teaching.length > 0 && (
                                <div>
                                  <span className="text-xs font-medium text-green-400 terminal-text">
                                    [TEACHING]: 
                                  </span>
                                  <div className="flex flex-wrap gap-1 mt-1">
                                    {user.skills_teaching.map((skill, idx) => (
                                      <Badge 
                                        key={idx}
                                        variant="secondary" 
                                        className="text-xs bg-green-500/20 text-green-300"
                                      >
                                        {skill}
                                      </Badge>
                                    ))}
                                  </div>
                                </div>
                              )}
                              {user.skills_learning.length > 0 && (
                                <div>
                                  <span className="text-xs font-medium text-blue-400 terminal-text">
                                    [LEARNING]: 
                                  </span>
                                  <div className="flex flex-wrap gap-1 mt-1">
                                    {user.skills_learning.map((skill, idx) => (
                                      <Badge 
                                        key={idx}
                                        variant="secondary" 
                                        className="text-xs bg-blue-500/20 text-blue-300"
                                      >
                                        {skill}
                                      </Badge>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          )}

                          <p className="text-xs text-muted-foreground">
                            Joined: {new Date(user.created_at).toLocaleDateString()}
                          </p>
                        </div>

                        {user.role !== 'admin' && (
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
                                  [CONFIRM_USER_DELETION]
                                </AlertDialogTitle>
                                <AlertDialogDescription className="terminal-text">
                                  Are you sure you want to delete {user.display_name || 'this user'}? 
                                  This will permanently remove all their data including skills, messages, and requests.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel className="glass-effect">
                                  Cancel
                                </AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => handleDeleteUser(user.user_id, user.display_name || 'User')}
                                  className="bg-destructive text-destructive-foreground"
                                >
                                  Delete User
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        )}
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