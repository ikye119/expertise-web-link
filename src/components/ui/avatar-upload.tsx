import { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { Camera, Upload, X, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';

interface AvatarUploadProps {
  currentAvatarUrl?: string;
  onAvatarChange: (url: string) => void;
}

export function AvatarUpload({ currentAvatarUrl, onAvatarChange }: AvatarUploadProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState(currentAvatarUrl || '');
  const [isLoading, setIsLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleUrlSubmit = () => {
    if (avatarUrl.trim()) {
      onAvatarChange(avatarUrl.trim());
      setIsOpen(false);
      toast({
        title: "Avatar Updated",
        description: "Your profile picture has been updated successfully.",
      });
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // For now, we'll use a file-to-URL service or suggest users upload to external services
    // In a real app, you'd upload to Supabase Storage
    toast({
      title: "File Upload",
      description: "Please upload your image to a service like Imgur or use a direct URL for now.",
      variant: "destructive"
    });
  };

  const clearAvatar = () => {
    setAvatarUrl('');
    onAvatarChange('');
    setIsOpen(false);
    toast({
      title: "Avatar Removed",
      description: "Your profile picture has been removed.",
    });
  };

  return (
    <div className="relative">
      <div className="relative">
        {currentAvatarUrl ? (
          <motion.img
            whileHover={{ scale: 1.05 }}
            src={currentAvatarUrl}
            alt="Profile Avatar"
            className="w-20 h-20 rounded-full object-cover border-2 border-primary glow-blue"
          />
        ) : (
          <motion.div
            whileHover={{ scale: 1.05 }}
            className="w-20 h-20 rounded-full bg-primary/20 border-2 border-primary glow-blue flex items-center justify-center"
          >
            <User className="h-8 w-8 text-primary" />
          </motion.div>
        )}
        
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button
              size="icon"
              className="absolute -bottom-2 -right-2 h-8 w-8 rounded-full glow-green hover:glow-pink transition-all duration-300"
            >
              <Camera className="h-4 w-4" />
            </Button>
          </DialogTrigger>
          
          <DialogContent className="glass-effect border-primary/20 neon-border">
            <DialogHeader>
              <DialogTitle className="neon-text font-orbitron">
                [UPDATE_AVATAR_SYS]
              </DialogTitle>
            </DialogHeader>
            
            <div className="space-y-6">
              {/* URL Input Method */}
              <div className="space-y-3">
                <Label className="text-sm font-medium terminal-text">
                  Avatar URL
                </Label>
                <div className="flex gap-2">
                  <Input
                    value={avatarUrl}
                    onChange={(e) => setAvatarUrl(e.target.value)}
                    placeholder="> ENTER_AVATAR_URL..."
                    className="glass-effect border-primary/20 focus:border-primary/50 terminal-text"
                  />
                  <Button
                    onClick={handleUrlSubmit}
                    disabled={!avatarUrl.trim()}
                    className="glow-green hover:glow-pink transition-all duration-300"
                  >
                    Update
                  </Button>
                </div>
              </div>

              {/* File Upload Method (placeholder) */}
              <div className="space-y-3">
                <Label className="text-sm font-medium terminal-text">
                  Upload File
                </Label>
                <div className="flex items-center gap-2">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                  <Button
                    onClick={() => fileInputRef.current?.click()}
                    variant="outline"
                    className="glass-effect border-primary/20 hover:border-primary/50 w-full"
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    Choose File
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Supported formats: JPG, PNG, GIF (max 5MB)
                </p>
              </div>

              {/* Preview */}
              {avatarUrl && (
                <div className="space-y-3">
                  <Label className="text-sm font-medium terminal-text">
                    Preview
                  </Label>
                  <div className="flex items-center justify-center">
                    <img
                      src={avatarUrl}
                      alt="Avatar Preview"
                      className="w-16 h-16 rounded-full object-cover border border-primary/50"
                      onError={() => {
                        toast({
                          title: "Invalid URL",
                          description: "The image URL appears to be invalid.",
                          variant: "destructive"
                        });
                      }}
                    />
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-2">
                {currentAvatarUrl && (
                  <Button
                    onClick={clearAvatar}
                    variant="outline"
                    className="flex-1 glow-red hover:glow-pink transition-all duration-300"
                  >
                    <X className="h-4 w-4 mr-2" />
                    Remove Avatar
                  </Button>
                )}
                <Button
                  onClick={() => setIsOpen(false)}
                  variant="outline"
                  className="flex-1 glass-effect border-primary/20"
                >
                  Cancel
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}