import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { User, Save, Camera, MapPin, Clock } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

interface ProfileData {
  display_name: string;
  bio: string;
  location: string;
  availability_status: string;
  avatar_url: string;
}

interface ProfileEditorProps {
  onProfileUpdate?: () => void;
}

export function ProfileEditor({ onProfileUpdate }: ProfileEditorProps) {
  const [profile, setProfile] = useState<ProfileData>({
    display_name: '',
    bio: '',
    location: '',
    availability_status: 'available',
    avatar_url: ''
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  const fetchProfile = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') throw error;

      if (data) {
        setProfile({
          display_name: data.display_name || '',
          bio: data.bio || '',
          location: data.location || '',
          availability_status: data.availability_status || 'available',
          avatar_url: data.avatar_url || ''
        });
      }
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

  const handleSave = async () => {
    if (!user) return;

    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .upsert({
          user_id: user.id,
          display_name: profile.display_name,
          bio: profile.bio,
          location: profile.location,
          availability_status: profile.availability_status,
          avatar_url: profile.avatar_url,
          updated_at: new Date().toISOString()
        });

      if (error) throw error;

      toast({
        title: "Profile Updated",
        description: "Your profile has been saved successfully",
      });

      onProfileUpdate?.();
    } catch (error) {
      console.error('Error saving profile:', error);
      toast({
        title: "Error",
        description: "Failed to save profile",
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleChange = (field: keyof ProfileData, value: string) => {
    setProfile(prev => ({ ...prev, [field]: value }));
  };

  if (isLoading) {
    return (
      <Card className="glass-effect terminal-glow">
        <CardContent className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          <span className="ml-4 terminal-text">[LOADING_PROFILE...]</span>
        </CardContent>
      </Card>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <Card className="glass-effect neon-border terminal-glow">
        <CardHeader>
          <CardTitle className="neon-text font-orbitron flex items-center gap-2">
            <User className="h-5 w-5" />
            [PROFILE_EDITOR_SYS]
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Avatar Section */}
          <div className="flex items-center gap-6">
            <div className="relative">
              {profile.avatar_url ? (
                <img
                  src={profile.avatar_url}
                  alt="Profile Avatar"
                  className="w-20 h-20 rounded-full object-cover border-2 border-primary glow-blue"
                />
              ) : (
                <div className="w-20 h-20 rounded-full bg-primary/20 border-2 border-primary glow-blue flex items-center justify-center">
                  <User className="h-8 w-8 text-primary" />
                </div>
              )}
              <Button
                size="icon"
                className="absolute -bottom-2 -right-2 h-8 w-8 rounded-full glow-green hover:glow-pink transition-all duration-300"
              >
                <Camera className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex-1">
              <Label htmlFor="avatar_url" className="text-sm font-medium terminal-text">
                Avatar URL
              </Label>
              <Input
                id="avatar_url"
                value={profile.avatar_url}
                onChange={(e) => handleChange('avatar_url', e.target.value)}
                placeholder="> ENTER_AVATAR_URL..."
                className="glass-effect border-primary/20 focus:border-primary/50 terminal-text"
              />
            </div>
          </div>

          {/* Display Name */}
          <div className="space-y-2">
            <Label htmlFor="display_name" className="text-sm font-medium terminal-text">
              Display Name
            </Label>
            <Input
              id="display_name"
              value={profile.display_name}
              onChange={(e) => handleChange('display_name', e.target.value)}
              placeholder="> ENTER_DISPLAY_NAME..."
              className="glass-effect border-primary/20 focus:border-primary/50 terminal-text"
            />
          </div>

          {/* Bio */}
          <div className="space-y-2">
            <Label htmlFor="bio" className="text-sm font-medium terminal-text">
              Bio / About Me
            </Label>
            <Textarea
              id="bio"
              value={profile.bio}
              onChange={(e) => handleChange('bio', e.target.value)}
              placeholder="> DESCRIBE_YOURSELF..."
              className="glass-effect border-primary/20 focus:border-primary/50 terminal-text min-h-[100px]"
            />
          </div>

          {/* Location */}
          <div className="space-y-2">
            <Label htmlFor="location" className="text-sm font-medium terminal-text flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              Location
            </Label>
            <Input
              id="location"
              value={profile.location}
              onChange={(e) => handleChange('location', e.target.value)}
              placeholder="> ENTER_LOCATION..."
              className="glass-effect border-primary/20 focus:border-primary/50 terminal-text"
            />
          </div>

          {/* Availability Status */}
          <div className="space-y-2">
            <Label className="text-sm font-medium terminal-text flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Availability Status
            </Label>
            <Select 
              value={profile.availability_status} 
              onValueChange={(value) => handleChange('availability_status', value)}
            >
              <SelectTrigger className="glass-effect border-primary/20">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="available">Available</SelectItem>
                <SelectItem value="busy">Busy</SelectItem>
                <SelectItem value="away">Away</SelectItem>
                <SelectItem value="offline">Offline</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Save Button */}
          <Button
            onClick={handleSave}
            disabled={isSaving}
            className="w-full glow-green hover:glow-pink transition-all duration-300 pulse-match"
          >
            <Save className="h-4 w-4 mr-2" />
            {isSaving ? '[SAVING_PROFILE...]' : 'SAVE_PROFILE_DATA'}
          </Button>
        </CardContent>
      </Card>
    </motion.div>
  );
}