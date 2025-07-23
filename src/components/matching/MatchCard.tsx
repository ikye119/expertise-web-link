import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { User, ArrowRightLeft, Star, MapPin } from 'lucide-react';

interface MatchCardProps {
  match: {
    user_id: string;
    display_name: string | null;
    bio: string | null;
    location: string | null;
    skills_offered: string[];
    skills_wanted: string[];
    compatibility_score: number;
    is_mutual: boolean;
  };
  onOfferSwap: (userId: string, displayName: string) => void;
}

export function MatchCard({ match, onOfferSwap }: MatchCardProps) {
  const handleOfferSwap = () => {
    onOfferSwap(match.user_id, match.display_name || 'Anonymous User');
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.02 }}
      className="h-full"
    >
      <Card 
        className={`h-full glass-effect terminal-glow transition-all duration-500 ${
          match.is_mutual ? 'neon-border glow-pulse' : 'border-primary/20'
        }`}
      >
        <CardHeader className="pb-2">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <User className="h-12 w-12 p-2 bg-primary/20 rounded-full text-primary" />
              <div>
                <CardTitle className="text-lg font-orbitron neon-text">
                  [USER] {match.display_name || 'Anonymous'}
                </CardTitle>
                {match.location && (
                  <div className="flex items-center gap-1 text-sm text-muted-foreground">
                    <MapPin className="h-3 w-3" />
                    {match.location}
                  </div>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1">
                <Star className="h-4 w-4 text-yellow-400" />
                <span className="text-sm font-medium">
                  {Math.round(match.compatibility_score)}%
                </span>
              </div>
              {match.is_mutual && (
                <Badge className="bg-gradient-to-r from-primary to-blue-500 text-white glow-pulse">
                  MUTUAL
                </Badge>
              )}
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {match.bio && (
            <p className="text-sm text-muted-foreground terminal-text">
              "{match.bio}"
            </p>
          )}

          <div className="space-y-3">
            <div>
              <h4 className="text-sm font-medium text-green-400 mb-2 terminal-text">
                [OFFERS] Skills Available:
              </h4>
              <div className="flex flex-wrap gap-1">
                {match.skills_offered.map((skill, index) => (
                  <Badge 
                    key={index} 
                    variant="secondary" 
                    className="floating-badge bg-green-500/20 text-green-300 border-green-500/30"
                  >
                    {skill}
                  </Badge>
                ))}
              </div>
            </div>

            <div className="flex justify-center">
              <ArrowRightLeft className="h-6 w-6 text-primary glow-blue" />
            </div>

            <div>
              <h4 className="text-sm font-medium text-blue-400 mb-2 terminal-text">
                [WANTS] Skills Seeking:
              </h4>
              <div className="flex flex-wrap gap-1">
                {match.skills_wanted.map((skill, index) => (
                  <Badge 
                    key={index} 
                    variant="secondary" 
                    className="floating-badge bg-blue-500/20 text-blue-300 border-blue-500/30"
                  >
                    {skill}
                  </Badge>
                ))}
              </div>
            </div>
          </div>

          <Button
            onClick={handleOfferSwap}
            className={`w-full transition-all duration-300 ${
              match.is_mutual 
                ? 'glow-green hover:glow-pink pulse-match' 
                : 'glow-blue hover:glow-green'
            }`}
          >
            <ArrowRightLeft className="h-4 w-4 mr-2" />
            {match.is_mutual ? 'INITIATE_MUTUAL_SWAP' : 'OFFER_SKILL_SWAP'}
          </Button>
        </CardContent>
      </Card>
    </motion.div>
  );
}