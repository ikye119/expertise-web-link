import { useState } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Star, Send } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

interface FeedbackFormProps {
  reviewedUserId: string;
  skillName: string;
  displayName: string;
  onClose?: () => void;
}

export function FeedbackForm({ reviewedUserId, skillName, displayName, onClose }: FeedbackFormProps) {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  const submitFeedback = async () => {
    if (!user || rating === 0 || isSubmitting) return;

    setIsSubmitting(true);
    try {
      const { error } = await supabase
        .from('feedback')
        .upsert({
          reviewer_id: user.id,
          reviewed_user_id: reviewedUserId,
          skill_name: skillName,
          rating,
          comment: comment.trim() || null
        });

      if (error) throw error;

      toast({
        title: "Feedback submitted",
        description: "Thank you for your feedback!",
      });

      onClose?.();
    } catch (error) {
      console.error('Error submitting feedback:', error);
      toast({
        title: "Error",
        description: "Failed to submit feedback",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
    >
      <Card className="glass-effect neon-border">
        <CardHeader>
          <CardTitle className="neon-text font-orbitron">
            Rate your experience with {displayName}
          </CardTitle>
          <p className="text-muted-foreground">Skill: {skillName}</p>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Star Rating */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Rating</label>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <motion.button
                  key={star}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => setRating(star)}
                  className={`p-1 transition-colors ${
                    star <= rating
                      ? 'text-yellow-400 drop-shadow-[0_0_10px_rgba(250,204,21,0.7)]'
                      : 'text-muted-foreground hover:text-yellow-400'
                  }`}
                >
                  <Star 
                    className="h-8 w-8" 
                    fill={star <= rating ? 'currentColor' : 'none'}
                  />
                </motion.button>
              ))}
            </div>
          </div>

          {/* Comment */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Comment (optional)</label>
            <Textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Share your experience..."
              className="glass-effect border-primary/20 focus:border-primary/50"
              rows={4}
            />
          </div>

          {/* Actions */}
          <div className="flex gap-2 justify-end">
            <Button variant="ghost" onClick={onClose}>
              Cancel
            </Button>
            <Button
              onClick={submitFeedback}
              disabled={rating === 0 || isSubmitting}
              className="glow-green hover:glow-pink transition-all duration-300"
            >
              <Send className="h-4 w-4 mr-2" />
              Submit Feedback
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}