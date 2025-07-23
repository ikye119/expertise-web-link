import { useState } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MessageCircle, Users, Zap, User, Search, Inbox } from 'lucide-react';
import { Link } from 'react-router-dom';
import { SkillList } from '@/components/SkillList';
import { UserMatches } from '@/components/UserMatches';
import { SkillExchangeTimeline } from '@/components/SkillExchangeTimeline';
import { NotificationIcon } from '@/components/notifications/NotificationIcon';
import { UserMenu } from '@/components/ui/user-menu';
import { SkillSessionManager } from '@/components/sessions/SkillSessionManager';
import { useAdmin } from '@/hooks/useAdmin';

export default function Dashboard() {
  const { isAdmin } = useAdmin();
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  return (
    <div className="min-h-screen bg-gradient-primary">
      <div className="container mx-auto max-w-7xl px-2 sm:px-4 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-4 sm:mb-8 pt-4 sm:pt-8"
        >
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl sm:text-4xl font-orbitron font-bold neon-text">
                [SKILLSWAP_TERMINAL]
              </h1>
              <p className="text-muted-foreground terminal-text text-sm sm:text-base">
                {'{> NEURAL_SKILL_EXCHANGE_NETWORK}'}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <NotificationIcon />
              {isAdmin && (
                <Link to="/admin">
                  <Button className="glow-red hover:glow-pink transition-all duration-300 min-w-[44px] min-h-[44px]">
                    <Users className="h-4 w-4 sm:mr-2" />
                    <span className="hidden sm:inline">Admin</span>
                  </Button>
                </Link>
              )}
              <UserMenu />
            </div>
          </div>
        </motion.div>

        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mb-6 sm:mb-8"
        >
          <Link to="/match">
            <Card className="glass-effect terminal-glow hover:neon-border transition-all duration-300 cursor-pointer">
              <CardContent className="p-3 sm:p-4 text-center">
                <Search className="h-6 w-6 sm:h-8 sm:w-8 text-primary mx-auto mb-2 glow-blue" />
                <p className="text-xs sm:text-sm font-medium terminal-text">Find Matches</p>
              </CardContent>
            </Card>
          </Link>

          <Link to="/requests">
            <Card className="glass-effect terminal-glow hover:neon-border transition-all duration-300 cursor-pointer">
              <CardContent className="p-3 sm:p-4 text-center">
                <Inbox className="h-6 w-6 sm:h-8 sm:w-8 text-primary mx-auto mb-2 glow-green" />
                <p className="text-xs sm:text-sm font-medium terminal-text">Requests</p>
              </CardContent>
            </Card>
          </Link>

          <Link to="/messages">
            <Card className="glass-effect terminal-glow hover:neon-border transition-all duration-300 cursor-pointer">
              <CardContent className="p-3 sm:p-4 text-center">
                <MessageCircle className="h-6 w-6 sm:h-8 sm:w-8 text-primary mx-auto mb-2 glow-pink" />
                <p className="text-xs sm:text-sm font-medium terminal-text">Messages</p>
              </CardContent>
            </Card>
          </Link>

          <Link to="/profile">
            <Card className="glass-effect terminal-glow hover:neon-border transition-all duration-300 cursor-pointer">
              <CardContent className="p-3 sm:p-4 text-center">
                <User className="h-6 w-6 sm:h-8 sm:w-8 text-primary mx-auto mb-2 glow-blue" />
                <p className="text-xs sm:text-sm font-medium terminal-text">Profile</p>
              </CardContent>
            </Card>
          </Link>
        </motion.div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8">
          <div className="lg:col-span-2 space-y-6 sm:space-y-8">
            <SkillList refreshTrigger={refreshTrigger} />
            <SkillSessionManager />
            <SkillExchangeTimeline />
          </div>
          <div className="space-y-6 sm:space-y-8">
            <UserMatches />
          </div>
        </div>
      </div>
    </div>
  );
}