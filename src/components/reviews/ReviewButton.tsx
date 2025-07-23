import { useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Star, MessageSquare, Trophy, Award } from 'lucide-react';
import { FeedbackForm } from '@/components/feedback/FeedbackForm';

interface ReviewButtonProps {
  reviewedUserId: string;
  displayName: string;
  skillName: string;
  averageRating?: number;
  reviewCount?: number;
}

export function ReviewButton({ 
  reviewedUserId, 
  displayName, 
  skillName, 
  averageRating = 0,
  reviewCount = 0 
}: ReviewButtonProps) {
  const [isOpen, setIsOpen] = useState(false);

  const renderStars = (rating: number) => {
    return (
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`h-3 w-3 ${
              star <= rating
                ? 'text-yellow-400 fill-current'
                : 'text-muted-foreground'
            }`}
          />
        ))}
      </div>
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <motion.div
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <Button 
            variant="outline" 
            className="glass-effect border-primary/20 hover:border-primary/50 hover:glow-blue transition-all duration-300 w-full"
          >
            <Star className="h-4 w-4 mr-2" />
            Leave Review
            {reviewCount > 0 && (
              <Badge variant="secondary" className="ml-2 text-xs">
                {averageRating.toFixed(1)} ({reviewCount})
              </Badge>
            )}
          </Button>
        </motion.div>
      </DialogTrigger>
      
      <DialogContent className="glass-effect border-primary/20 neon-border max-w-2xl">
        <DialogHeader>
          <DialogTitle className="neon-text font-orbitron">
            [REVIEW_SYSTEM_INTERFACE]
          </DialogTitle>
        </DialogHeader>
        
        <FeedbackForm
          reviewedUserId={reviewedUserId}
          skillName={skillName}
          displayName={displayName}
          onClose={() => setIsOpen(false)}
        />
      </DialogContent>
    </Dialog>
  );
}