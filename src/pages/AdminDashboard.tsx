import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { 
  Users, 
  BookOpen, 
  MessageCircle, 
  Star, 
  TrendingUp,
  Shield,
  Activity,
  Home
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

interface AdminStats {
  totalUsers: number;
  totalSkills: number;
  totalMessages: number;
  totalFeedback: number;
  topSkills: { skill_name: string; count: number }[];
  topRatedUsers: { user_id: string; display_name: string; avg_rating: number; review_count: number }[];
  messageActivity: { date: string; count: number }[];
  urgencyDistribution: { urgency: string; count: number }[];
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<AdminStats>({
    totalUsers: 0,
    totalSkills: 0,
    totalMessages: 0,
    totalFeedback: 0,
    topSkills: [],
    topRatedUsers: [],
    messageActivity: [],
    urgencyDistribution: []
  });
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();

  const fetchAdminStats = async () => {
    try {
      // Check if user is admin (for now, just check if user exists)
      if (!user) return;

      // Fetch total counts
      const [usersResult, skillsResult, messagesResult, feedbackResult] = await Promise.all([
        supabase.from('profiles').select('id', { count: 'exact' }),
        supabase.from('skills').select('id', { count: 'exact' }),
        supabase.from('messages').select('id', { count: 'exact' }),
        supabase.from('feedback').select('id', { count: 'exact' })
      ]);

      // Fetch top skills
      const { data: skillsData } = await supabase
        .from('skills')
        .select('skill_name')
        .order('created_at', { ascending: false });

      const skillCounts = skillsData?.reduce((acc, skill) => {
        acc[skill.skill_name] = (acc[skill.skill_name] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      const topSkills = Object.entries(skillCounts || {})
        .map(([skill_name, count]) => ({ skill_name, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10);

      // Fetch top rated users
      const { data: feedbackData } = await supabase
        .from('feedback')
        .select(`
          reviewed_user_id,
          rating,
          profiles!feedback_reviewed_user_id_fkey(display_name)
        `);

      const userRatings = feedbackData?.reduce((acc, feedback) => {
        const userId = feedback.reviewed_user_id;
        if (!acc[userId]) {
          acc[userId] = {
            user_id: userId,
            display_name: (feedback as any).profiles?.display_name || 'Anonymous',
            total_rating: 0,
            count: 0
          };
        }
        acc[userId].total_rating += feedback.rating;
        acc[userId].count++;
        return acc;
      }, {} as Record<string, any>);

      const topRatedUsers = Object.values(userRatings || {})
        .map((user: any) => ({
          user_id: user.user_id,
          display_name: user.display_name,
          avg_rating: user.total_rating / user.count,
          review_count: user.count
        }))
        .filter(user => user.review_count >= 2) // Only users with 2+ reviews
        .sort((a, b) => b.avg_rating - a.avg_rating)
        .slice(0, 10);

      // Fetch message activity (last 7 days)
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      const { data: messageActivityData } = await supabase
        .from('messages')
        .select('created_at')
        .gte('created_at', sevenDaysAgo.toISOString());

      const messageActivity = Array.from({ length: 7 }, (_, i) => {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const dateStr = date.toISOString().split('T')[0];
        const count = messageActivityData?.filter(m => 
          m.created_at.startsWith(dateStr)
        ).length || 0;
        return { date: dateStr, count };
      }).reverse();

      // Fetch urgency distribution
      const { data: urgencyData } = await supabase
        .from('skills')
        .select('urgency');

      const urgencyDistribution = [
        { urgency: 'Low', count: urgencyData?.filter(s => s.urgency === 1).length || 0 },
        { urgency: 'Medium', count: urgencyData?.filter(s => s.urgency === 2).length || 0 },
        { urgency: 'High', count: urgencyData?.filter(s => s.urgency === 3).length || 0 }
      ];

      setStats({
        totalUsers: usersResult.count || 0,
        totalSkills: skillsResult.count || 0,
        totalMessages: messagesResult.count || 0,
        totalFeedback: feedbackResult.count || 0,
        topSkills,
        topRatedUsers,
        messageActivity,
        urgencyDistribution
      });

    } catch (error) {
      console.error('Error fetching admin stats:', error);
      toast({
        title: "Error",
        description: "Failed to load admin statistics",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminStats();
  }, [user]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-primary flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  const COLORS = ['#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];

  return (
    <div className="min-h-screen bg-gradient-primary p-8">
      <div className="container mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center gap-4 mb-4">
            <Link to="/dashboard">
              <Button variant="ghost" className="glow-blue hover:glow-pink transition-all duration-300">
                <Home className="h-4 w-4 mr-2" />
                Dashboard
              </Button>
            </Link>
          </div>
          <h1 className="text-4xl font-orbitron font-bold neon-text mb-2">
            Admin Dashboard
          </h1>
          <p className="text-muted-foreground">
            Monitor and analyze SkillSwap platform activity
          </p>
        </motion.div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {[
            { title: 'Total Users', value: stats.totalUsers, icon: Users, color: 'text-blue-400' },
            { title: 'Total Skills', value: stats.totalSkills, icon: BookOpen, color: 'text-green-400' },
            { title: 'Messages', value: stats.totalMessages, icon: MessageCircle, color: 'text-purple-400' },
            { title: 'Feedback', value: stats.totalFeedback, icon: Star, color: 'text-yellow-400' }
          ].map((stat, index) => (
            <motion.div
              key={stat.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card className="glass-effect neon-border">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">{stat.title}</p>
                      <p className="text-2xl font-bold font-orbitron">{stat.value}</p>
                    </div>
                    <stat.icon className={`h-8 w-8 ${stat.color}`} />
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Top Skills */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
          >
            <Card className="glass-effect neon-border">
              <CardHeader>
                <CardTitle className="neon-text font-orbitron flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Top Skills
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={stats.topSkills}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                    <XAxis 
                      dataKey="skill_name" 
                      tick={{ fill: '#fff', fontSize: 12 }}
                      angle={-45}
                      textAnchor="end"
                      height={80}
                    />
                    <YAxis tick={{ fill: '#fff' }} />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'rgba(0,0,0,0.8)', 
                        border: '1px solid #10b981',
                        borderRadius: '8px'
                      }}
                    />
                    <Bar dataKey="count" fill="#10b981" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </motion.div>

          {/* Urgency Distribution */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
          >
            <Card className="glass-effect neon-border">
              <CardHeader>
                <CardTitle className="neon-text font-orbitron flex items-center gap-2">
                  <Activity className="h-5 w-5" />
                  Urgency Distribution
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={stats.urgencyDistribution}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="count"
                    >
                      {stats.urgencyDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Top Rated Users */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Card className="glass-effect neon-border">
            <CardHeader>
              <CardTitle className="neon-text font-orbitron flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Top Rated Users
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {stats.topRatedUsers.map((user, index) => (
                  <motion.div
                    key={user.user_id}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: index * 0.1 }}
                    className="p-4 glass-effect rounded-lg border border-primary/20"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium">{user.display_name}</h4>
                      <Badge variant="outline" className="text-xs">
                        #{index + 1}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-1 mb-1">
                      {Array.from({ length: 5 }, (_, i) => (
                        <Star
                          key={i}
                          className={`h-4 w-4 ${
                            i < Math.round(user.avg_rating)
                              ? 'text-yellow-400 fill-current'
                              : 'text-muted-foreground'
                          }`}
                        />
                      ))}
                      <span className="text-sm text-muted-foreground ml-2">
                        {user.avg_rating.toFixed(1)}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {user.review_count} reviews
                    </p>
                  </motion.div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}