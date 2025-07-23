import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, User, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface UserProfile {
  user_id: string;
  display_name: string | null;
}

interface UserSearchProps {
  onSelectUser: (userId: string, displayName: string) => void;
  onClose: () => void;
}

export function UserSearch({ onSelectUser, onClose }: UserSearchProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { user } = useAuth();

  const searchUsers = async (term: string) => {
    if (!term.trim() || !user) return;
    
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('user_id, display_name')
        .ilike('display_name', `%${term}%`)
        .neq('user_id', user.id)
        .limit(10);

      if (error) throw error;
      setUsers(data || []);
    } catch (error) {
      console.error('Error searching users:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      searchUsers(searchTerm);
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchTerm, user]);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
    >
      <Card className="w-full max-w-md glass-effect neon-border terminal-glow">
        <div className="p-4 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-orbitron neon-text">[USER_SEARCH_SYS]</h3>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="glow-blue hover:glow-pink transition-all duration-300"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-primary" />
            <Input
              placeholder="> SEARCH_USERS..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 glass-effect border-primary/20 focus:border-primary/50 terminal-text"
              autoFocus
            />
          </div>

          <div className="max-h-60 overflow-y-auto space-y-2">
            {isLoading ? (
              <div className="flex items-center justify-center py-4">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                <span className="ml-2 terminal-text">[SEARCHING...]</span>
              </div>
            ) : users.length === 0 && searchTerm ? (
              <div className="text-center py-4 terminal-text text-muted-foreground">
                {'{> NO_USERS_FOUND}'}
              </div>
            ) : (
              <AnimatePresence>
                {users.map((userProfile) => (
                  <motion.div
                    key={userProfile.user_id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                  >
                    <Button
                      variant="ghost"
                      className="w-full justify-start h-auto p-3 glass-effect terminal-glow hover:glow-green transition-all duration-300"
                      onClick={() => {
                        onSelectUser(
                          userProfile.user_id,
                          userProfile.display_name || 'Anonymous User'
                        );
                        onClose();
                      }}
                    >
                      <div className="flex items-center gap-3">
                        <User className="h-8 w-8 p-1.5 bg-primary/20 rounded-full text-primary" />
                        <div className="text-left">
                          <p className="font-medium terminal-text">
                            [USER] {userProfile.display_name || 'Anonymous User'}
                          </p>
                        </div>
                      </div>
                    </Button>
                  </motion.div>
                ))}
              </AnimatePresence>
            )}
          </div>
        </div>
      </Card>
    </motion.div>
  );
}