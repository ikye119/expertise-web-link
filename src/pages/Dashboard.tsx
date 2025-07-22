import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { SkillForm } from '@/components/SkillForm';
import { SkillList } from '@/components/SkillList';
import { UserMatches } from '@/components/UserMatches';
import { LogOut, User } from 'lucide-react';

export default function Dashboard() {
  const { user, signOut } = useAuth();
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const handleSkillAdded = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold">SkillSwap Dashboard</h1>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <User className="h-5 w-5" />
              <span className="text-sm">{user?.email}</span>
            </div>
            <Button variant="outline" onClick={signOut}>
              <LogOut className="h-4 w-4 mr-2" />
              Sign Out
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-2 gap-8">
          <div className="space-y-8">
            <SkillForm onSkillAdded={handleSkillAdded} />
            <SkillList refreshTrigger={refreshTrigger} />
          </div>
          <div>
            <UserMatches />
          </div>
        </div>
      </main>
    </div>
  );
}