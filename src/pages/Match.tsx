import { useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Home, ArrowLeft } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { SkillMatchEngine } from '@/components/matching/SkillMatchEngine';
import { useToast } from '@/hooks/use-toast';

export default function Match() {
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleOfferSwap = (userId: string, displayName: string) => {
    // Navigate to a request creation modal or page
    navigate('/requests', { 
      state: { 
        createRequest: true, 
        targetUserId: userId, 
        targetUserName: displayName 
      } 
    });
  };

  return (
    <div className="min-h-screen bg-gradient-primary">
      <div className="container mx-auto max-w-7xl px-2 sm:px-4 lg:px-8">
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
              [SKILL_MATCH_ENGINE]
            </h1>
          </div>
          <p className="text-muted-foreground terminal-text text-sm sm:text-base">
            {'{> ANALYZING_COMPATIBLE_SKILL_EXCHANGES...}'}
          </p>
        </motion.div>

        <SkillMatchEngine onOfferSwap={handleOfferSwap} />
      </div>
    </div>
  );
}