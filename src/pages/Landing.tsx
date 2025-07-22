import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';

export default function Landing() {
  const navigate = useNavigate();
  const { user, loading } = useAuth();

  useEffect(() => {
    if (!loading && user) {
      navigate('/dashboard');
    }
  }, [user, loading, navigate]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-secondary/20">
      <div className="container mx-auto px-4 py-16">
        <div className="text-center max-w-4xl mx-auto">
          <h1 className="text-6xl font-bold mb-6 bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
            SkillSwap
          </h1>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Exchange your skills with others. Teach what you know, learn what you want. 
            Connect with people who can help you grow while sharing your expertise.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
            <Button 
              size="lg" 
              onClick={() => navigate('/signup')}
              className="text-lg px-8 py-6"
            >
              Get Started
            </Button>
            <Button 
              variant="outline" 
              size="lg" 
              onClick={() => navigate('/login')}
              className="text-lg px-8 py-6"
            >
              Sign In
            </Button>
          </div>

          <div className="grid md:grid-cols-3 gap-8 mt-16">
            <div className="p-6 rounded-lg border bg-card">
              <h3 className="text-xl font-semibold mb-4">Share Your Skills</h3>
              <p className="text-muted-foreground">
                List the skills you can teach and help others learn something new.
              </p>
            </div>
            <div className="p-6 rounded-lg border bg-card">
              <h3 className="text-xl font-semibold mb-4">Learn New Things</h3>
              <p className="text-muted-foreground">
                Find people who can teach you the skills you want to master.
              </p>
            </div>
            <div className="p-6 rounded-lg border bg-card">
              <h3 className="text-xl font-semibold mb-4">Connect & Grow</h3>
              <p className="text-muted-foreground">
                Build meaningful connections while expanding your knowledge and abilities.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}