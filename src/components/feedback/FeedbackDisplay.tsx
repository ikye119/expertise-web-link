import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Star, MessageSquare, TrendingUp } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface Feedback {
  id: string;
  rating: number;
  comment: string | null;
  skill_name: string;
  created_at: string;
  reviewer_profile?: {
    display_name: string | null;
  };
}

interface FeedbackDisplayProps {
  userId: string;
  displayName: string;
}

export function FeedbackDisplay({ userId, displayName }: FeedbackDisplayProps) {
  const [feedback, setFeedback] = useState<Feedback[]>([]);
  const [averageRating, setAverageRating] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  const fetchFeedback = async () => {
    try {
      const { data, error } = await supabase
        .from('feedback')
        .select('*')
        .eq('reviewed_user_id', userId)
        .order('created_at', { ascending: false });

      // Get reviewer profiles
      const reviewerIds = data?.map(f => f.reviewer_id) || [];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, display_name')
        .in('user_id', reviewerIds);

      if (error) throw error;

      // Add profile data to feedback
      const feedbackWithProfiles = data?.map(f => ({
        ...f,
        reviewer_profile: { display_name: profiles?.find(p => p.user_id === f.reviewer_id)?.display_name || null }
      })) || [];
      
      setFeedback(feedbackWithProfiles);
      
      // Calculate average rating
      if (data && data.length > 0) {
        const total = data.reduce((sum, f) => sum + f.rating, 0);
        setAverageRating(total / data.length);
      }
    } catch (error) {
      console.error('Error fetching feedback:', error);
      toast({
        title: "Error",
        description: "Failed to load feedback",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchFeedback();
  }, [userId]);

  const renderStars = (rating: number) => {
    return (
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`h-4 w-4 ${
              star <= rating
                ? 'text-yellow-400 fill-current drop-shadow-[0_0_5px_rgba(250,204,21,0.5)]'
                : 'text-muted-foreground'
            }`}
          />
        ))}
      </div>
    );
  };

  if (isLoading) {
    return (
      <Card className="glass-effect neon-border">
        <CardContent className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="glass-effect neon-border">
      <CardHeader>
        <CardTitle className="neon-text font-orbitron flex items-center gap-2">
          <TrendingUp className="h-5 w-5" />
          Feedback for {displayName}
        </CardTitle>
        {feedback.length > 0 && (
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              {renderStars(Math.round(averageRating))}
              <span className="text-sm text-muted-foreground">
                {averageRating.toFixed(1)} ({feedback.length} reviews)
              </span>
            </div>
          </div>
        )}
      </CardHeader>
      <CardContent>
        {feedback.length === 0 ? (
          <p className="text-muted-foreground text-center py-8">
            No feedback yet
          </p>
        ) : (
          <div className="space-y-4">
            {feedback.map((item) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-4 glass-effect rounded-lg border border-primary/20"
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    {renderStars(item.rating)}
                    <Badge variant="outline" className="text-xs">
                      {item.skill_name}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    by {item.reviewer_profile?.display_name || 'Anonymous'}
                  </p>
                </div>
                {item.comment && (
                  <div className="flex items-start gap-2 mt-2">
                    <MessageSquare className="h-4 w-4 text-muted-foreground mt-1 flex-shrink-0" />
                    <p className="text-sm text-muted-foreground">{item.comment}</p>
                  </div>
                )}
                <p className="text-xs text-muted-foreground mt-2">
                  {new Date(item.created_at).toLocaleDateString()}
                </p>
              </motion.div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}