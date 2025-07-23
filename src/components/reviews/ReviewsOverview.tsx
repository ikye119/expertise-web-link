import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Star, MessageSquare, TrendingUp, Award, Trophy } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface ReviewStats {
  averageRating: number;
  totalReviews: number;
  ratingDistribution: { [key: number]: number };
  recentReviews: Array<{
    id: string;
    rating: number;
    comment: string | null;
    skill_name: string;
    created_at: string;
    reviewer_name: string;
  }>;
}

interface ReviewsOverviewProps {
  userId: string;
  displayName: string;
  showDetailed?: boolean;
}

export function ReviewsOverview({ userId, displayName, showDetailed = false }: ReviewsOverviewProps) {
  const [stats, setStats] = useState<ReviewStats>({
    averageRating: 0,
    totalReviews: 0,
    ratingDistribution: {},
    recentReviews: []
  });
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  const fetchReviewStats = async () => {
    try {
      // Fetch all reviews for the user
      const { data: reviews, error } = await supabase
        .from('feedback')
        .select(`
          id,
          rating,
          comment,
          skill_name,
          created_at,
          reviewer_id
        `)
        .eq('reviewed_user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      if (!reviews || reviews.length === 0) {
        setIsLoading(false);
        return;
      }

      // Get reviewer names
      const reviewerIds = reviews.map(r => r.reviewer_id);
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, display_name')
        .in('user_id', reviewerIds);

      // Calculate stats
      const totalReviews = reviews.length;
      const averageRating = reviews.reduce((sum, r) => sum + r.rating, 0) / totalReviews;
      
      // Rating distribution
      const ratingDistribution: { [key: number]: number } = {};
      for (let i = 1; i <= 5; i++) {
        ratingDistribution[i] = reviews.filter(r => r.rating === i).length;
      }

      // Recent reviews with reviewer names
      const recentReviews = reviews.slice(0, showDetailed ? 10 : 3).map(review => ({
        ...review,
        reviewer_name: profiles?.find(p => p.user_id === review.reviewer_id)?.display_name || 'Anonymous'
      }));

      setStats({
        averageRating,
        totalReviews,
        ratingDistribution,
        recentReviews
      });

    } catch (error) {
      console.error('Error fetching review stats:', error);
      toast({
        title: "Error",
        description: "Failed to load reviews",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchReviewStats();
  }, [userId]);

  const renderStars = (rating: number, size: 'sm' | 'md' | 'lg' = 'md') => {
    const sizeClass = size === 'sm' ? 'h-3 w-3' : size === 'lg' ? 'h-6 w-6' : 'h-4 w-4';
    return (
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`${sizeClass} ${
              star <= rating
                ? 'text-yellow-400 fill-current drop-shadow-[0_0_5px_rgba(250,204,21,0.5)]'
                : 'text-muted-foreground'
            }`}
          />
        ))}
      </div>
    );
  };

  const getRatingColor = (rating: number) => {
    if (rating >= 4.5) return 'text-green-400';
    if (rating >= 3.5) return 'text-yellow-400';
    if (rating >= 2.5) return 'text-orange-400';
    return 'text-red-400';
  };

  if (isLoading) {
    return (
      <Card className="glass-effect neon-border">
        <CardContent className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          <span className="ml-3 terminal-text">[LOADING_REVIEWS...]</span>
        </CardContent>
      </Card>
    );
  }

  if (stats.totalReviews === 0) {
    return (
      <Card className="glass-effect terminal-glow">
        <CardContent className="text-center py-8">
          <Star className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <p className="terminal-text text-muted-foreground">
            No reviews yet. Be the first to leave feedback!
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* Rating Summary */}
      <Card className="glass-effect neon-border terminal-glow">
        <CardHeader>
          <CardTitle className="neon-text font-orbitron flex items-center gap-2">
            <Trophy className="h-5 w-5 text-yellow-400" />
            [REPUTATION_SCORE]
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-6">
            <div className="text-center">
              <div className={`text-4xl font-bold font-orbitron ${getRatingColor(stats.averageRating)}`}>
                {stats.averageRating.toFixed(1)}
              </div>
              {renderStars(Math.round(stats.averageRating), 'lg')}
              <p className="text-sm text-muted-foreground mt-1">
                {stats.totalReviews} review{stats.totalReviews !== 1 ? 's' : ''}
              </p>
            </div>
            
            {showDetailed && (
              <div className="flex-1 space-y-2">
                {[5, 4, 3, 2, 1].map((rating) => (
                  <div key={rating} className="flex items-center gap-2">
                    <span className="text-sm w-8">{rating}★</span>
                    <div className="flex-1 bg-muted-foreground/20 rounded-full h-2">
                      <div
                        className="bg-yellow-400 h-2 rounded-full transition-all duration-500"
                        style={{
                          width: `${((stats.ratingDistribution[rating] || 0) / stats.totalReviews) * 100}%`
                        }}
                      />
                    </div>
                    <span className="text-sm text-muted-foreground w-8">
                      {stats.ratingDistribution[rating] || 0}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Recent Reviews */}
      {stats.recentReviews.length > 0 && (
        <Card className="glass-effect neon-border terminal-glow">
          <CardHeader>
            <CardTitle className="neon-text font-orbitron flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              Recent Reviews
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {stats.recentReviews.map((review, index) => (
              <motion.div
                key={review.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="p-4 glass-effect rounded-lg border border-primary/20"
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    {renderStars(review.rating, 'sm')}
                    <Badge variant="outline" className="text-xs">
                      {review.skill_name}
                    </Badge>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-muted-foreground">
                      by {review.reviewer_name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(review.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                {review.comment && (
                  <p className="text-sm text-muted-foreground mt-2">
                    "{review.comment}"
                  </p>
                )}
              </motion.div>
            ))}
          </CardContent>
        </Card>
      )}
    </motion.div>
  );
}