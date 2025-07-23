import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { LogOut, User, Settings } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';

interface Profile {
  display_name?: string;
  avatar_url?: string;
}

export function UserMenu() {
  const { user, signOut } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Fetch profile data when component mounts
  useEffect(() => {
    if (user) {
      fetchProfile();
    }
  }, [user]);

  const fetchProfile = async () => {
    if (!user) return;
    
    setIsLoading(true);
    try {
      const { data } = await supabase
        .from('profiles')
        .select('display_name, avatar_url')
        .eq('user_id', user.id)
        .single();
      
      if (data) {
        setProfile(data);
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    await signOut();
  };

  const displayName = profile?.display_name || user?.email?.split('@')[0] || 'User';
  const avatarUrl = profile?.avatar_url;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="ghost" 
          className="glass-effect neon-border hover:glow-blue transition-all duration-300 p-2"
        >
          <motion.div
            whileHover={{ scale: 1.05 }}
            className="flex items-center gap-2"
          >
            <Avatar className="h-8 w-8 border border-primary/50">
              <AvatarImage src={avatarUrl} alt={displayName} />
              <AvatarFallback className="bg-primary/20 text-primary">
                {displayName.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <span className="hidden sm:inline-block text-sm terminal-text font-medium">
              {displayName}
            </span>
          </motion.div>
        </Button>
      </DropdownMenuTrigger>
      
      <DropdownMenuContent 
        align="end" 
        className="glass-effect border-primary/20 neon-border w-56"
      >
        <div className="px-2 py-1.5">
          <p className="text-sm font-medium terminal-text">{displayName}</p>
          <p className="text-xs text-muted-foreground">{user?.email}</p>
        </div>
        
        <DropdownMenuSeparator className="bg-primary/20" />
        
        <DropdownMenuItem asChild>
          <Link 
            to="/profile" 
            className="flex items-center gap-2 terminal-text hover:glow-blue transition-all duration-300 cursor-pointer"
          >
            <User className="h-4 w-4" />
            Profile Settings
          </Link>
        </DropdownMenuItem>
        
        <DropdownMenuItem asChild>
          <Link 
            to="/profile" 
            className="flex items-center gap-2 terminal-text hover:glow-green transition-all duration-300 cursor-pointer"
          >
            <Settings className="h-4 w-4" />
            Edit Profile
          </Link>
        </DropdownMenuItem>
        
        <DropdownMenuSeparator className="bg-primary/20" />
        
        <DropdownMenuItem 
          onClick={handleLogout}
          className="flex items-center gap-2 terminal-text hover:glow-red transition-all duration-300 cursor-pointer"
        >
          <LogOut className="h-4 w-4" />
          Sign Out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}