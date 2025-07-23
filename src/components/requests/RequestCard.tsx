import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { User, Check, X, MessageCircle, Clock } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface RequestCardProps {
  request: {
    id: string;
    from_user_id: string;
    to_user_id: string;
    skill_offered: string | null;
    skill_wanted: string | null;
    message: string | null;
    status: string;
    created_at: string;
    from_profile?: {
      display_name: string | null;
      bio: string | null;
      location: string | null;
    };
    to_profile?: {
      display_name: string | null;
    };
  };
  currentUserId: string;
  onAccept: (requestId: string) => void;
  onDecline: (requestId: string) => void;
  onMessage: (userId: string, displayName: string) => void;
}

export function RequestCard({ 
  request, 
  currentUserId, 
  onAccept, 
  onDecline, 
  onMessage 
}: RequestCardProps) {
  const isIncoming = request.to_user_id === currentUserId;
  const otherUser = isIncoming ? request.from_profile : request.to_profile;
  const otherUserId = isIncoming ? request.from_user_id : request.to_user_id;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'accepted':
        return 'bg-green-500/20 text-green-300 border-green-500/30';
      case 'declined':
        return 'bg-red-500/20 text-red-300 border-red-500/30';
      default:
        return 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30';
    }
  };

  const handleMessage = () => {
    onMessage(otherUserId, otherUser?.display_name || 'Anonymous User');
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.02 }}
    >
      <Card className={`glass-effect terminal-glow transition-all duration-300 ${
        request.status === 'pending' && isIncoming ? 'neon-border glow-pulse' : 'border-primary/20'
      }`}>
        <CardHeader className="pb-2">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <User className="h-10 w-10 p-2 bg-primary/20 rounded-full text-primary" />
              <div>
                <CardTitle className="text-lg font-orbitron neon-text">
                  {isIncoming ? '[REQUEST_FROM]' : '[REQUEST_TO]'} {otherUser?.display_name || 'Anonymous'}
                </CardTitle>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Clock className="h-3 w-3" />
                  {formatDistanceToNow(new Date(request.created_at))} ago
                </div>
              </div>
            </div>
            <Badge className={getStatusColor(request.status)}>
              {request.status.toUpperCase()}
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Skill Exchange Details */}
          {(request.skill_offered || request.skill_wanted) && (
            <div className="space-y-2">
              {request.skill_offered && (
                <div>
                  <span className="text-sm font-medium text-green-400 terminal-text">
                    [OFFERING]: 
                  </span>
                  <Badge variant="secondary" className="ml-2 bg-green-500/20 text-green-300">
                    {request.skill_offered}
                  </Badge>
                </div>
              )}
              {request.skill_wanted && (
                <div>
                  <span className="text-sm font-medium text-blue-400 terminal-text">
                    [SEEKING]: 
                  </span>
                  <Badge variant="secondary" className="ml-2 bg-blue-500/20 text-blue-300">
                    {request.skill_wanted}
                  </Badge>
                </div>
              )}
            </div>
          )}

          {/* Message */}
          {request.message && (
            <div className="glass-effect rounded-lg p-3">
              <p className="text-sm terminal-text">"{request.message}"</p>
            </div>
          )}

          {/* Bio if available */}
          {isIncoming && otherUser?.display_name && (
            <div className="text-sm text-muted-foreground">
              <strong>User:</strong> {otherUser.display_name}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-2">
            {request.status === 'pending' && isIncoming && (
              <>
                <Button
                  onClick={() => onAccept(request.id)}
                  className="flex-1 glow-green hover:glow-pink transition-all duration-300"
                >
                  <Check className="h-4 w-4 mr-2" />
                  Accept
                </Button>
                <Button
                  onClick={() => onDecline(request.id)}
                  variant="destructive"
                  className="flex-1"
                >
                  <X className="h-4 w-4 mr-2" />
                  Decline
                </Button>
              </>
            )}
            
            {request.status === 'accepted' && (
              <Button
                onClick={handleMessage}
                className="flex-1 glow-blue hover:glow-green transition-all duration-300"
              >
                <MessageCircle className="h-4 w-4 mr-2" />
                Start Chat
              </Button>
            )}

            {request.status === 'pending' && !isIncoming && (
              <div className="flex-1 text-center text-sm text-muted-foreground terminal-text py-2">
                [AWAITING_RESPONSE...]
              </div>
            )}

            {request.status === 'declined' && (
              <div className="flex-1 text-center text-sm text-red-400 terminal-text py-2">
                [REQUEST_DECLINED]
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}