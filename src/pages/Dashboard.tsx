import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { SkillForm } from '@/components/SkillForm';
import { SkillList } from '@/components/SkillList';
import { UserMatches } from '@/components/UserMatches';
import { SkillExchangeTimeline } from '@/components/SkillExchangeTimeline';
import { LogOut, User, MessageCircle, BarChart3 } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Dashboard() {
  const { user, signOut } = useAuth();
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const handleSkillAdded = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  return (
    <div className="min-h-screen bg-gradient-primary">
      <header className="border-b neon-border glass-effect sticky top-0 z-50">
        <div className="container mx-auto px-2 sm:px-4 py-3 sm:py-4 flex items-center justify-between">
          <h1 className="text-lg sm:text-2xl font-bold neon-text font-orbitron truncate">SkillSwap</h1>
          <div className="flex items-center gap-1 sm:gap-4">
            <Link to="/messages">
              <Button variant="outline" size="sm" className="glow-green hover:glow-pink transition-all duration-300 min-w-[44px] min-h-[44px]">
                <MessageCircle className="h-4 w-4 sm:mr-2" />
                <span className="hidden sm:inline">Messages</span>
              </Button>
            </Link>
            <Link to="/admin">
              <Button variant="outline" size="sm" className="glow-blue hover:glow-pink transition-all duration-300 min-w-[44px] min-h-[44px]">
                <BarChart3 className="h-4 w-4 sm:mr-2" />
                <span className="hidden sm:inline">Admin</span>
              </Button>
            </Link>
            <div className="hidden md:flex items-center gap-2">
              <User className="h-5 w-5" />
              <span className="text-sm terminal-text truncate max-w-32">{user?.email}</span>
            </div>
            <Button variant="outline" size="sm" onClick={signOut} className="hover:glow-pink transition-all duration-300 min-w-[44px] min-h-[44px]">
              <LogOut className="h-4 w-4 sm:mr-2" />
              <span className="hidden sm:inline">Sign Out</span>
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-2 sm:px-4 py-4 sm:py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-8">
          <div className="space-y-4 sm:space-y-8 order-1 lg:order-1">
            <SkillForm onSkillAdded={handleSkillAdded} />
            <div className="block lg:hidden">
              <UserMatches />
            </div>
            <SkillList refreshTrigger={refreshTrigger} />
            <SkillExchangeTimeline />
          </div>
          <div className="order-2 lg:order-2 hidden lg:block">
            <UserMatches />
          </div>
        </div>
      </main>
    </div>
  );
}