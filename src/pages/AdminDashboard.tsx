import { useState } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Shield, Users, MessageSquare, Home, Database, Activity } from 'lucide-react';
import { Link } from 'react-router-dom';
import { UserManagement } from '@/components/admin/UserManagement';
import { RequestManagement } from '@/components/admin/RequestManagement';

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState('overview');

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
              [ADMIN_CONTROL_PANEL]
            </h1>
            <div className="ml-auto">
              <div className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-red-400 glow-pulse" />
                <span className="text-sm font-medium text-red-400 terminal-text">
                  ADMIN_ACCESS_GRANTED
                </span>
              </div>
            </div>
          </div>
          <p className="text-muted-foreground terminal-text text-sm sm:text-base">
            {'{> SYSTEM_ADMINISTRATION_INTERFACE}'}
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-3 glass-effect">
              <TabsTrigger 
                value="overview" 
                className="data-[state=active]:glow-green"
              >
                <Activity className="h-4 w-4 mr-2" />
                Overview
              </TabsTrigger>
              <TabsTrigger 
                value="users"
                className="data-[state=active]:glow-blue"
              >
                <Users className="h-4 w-4 mr-2" />
                Users
              </TabsTrigger>
              <TabsTrigger 
                value="requests"
                className="data-[state=active]:glow-pink"
              >
                <MessageSquare className="h-4 w-4 mr-2" />
                Requests
              </TabsTrigger>
            </TabsList>

            <div className="mt-6">
              <TabsContent value="overview" className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <Card className="glass-effect terminal-glow">
                    <CardHeader>
                      <CardTitle className="neon-text font-orbitron flex items-center gap-2">
                        <Users className="h-5 w-5 text-blue-400" />
                        [USER_METRICS]
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-center">
                        <div className="text-3xl font-bold neon-text mb-2">--</div>
                        <p className="text-sm text-muted-foreground terminal-text">Total Users</p>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="glass-effect terminal-glow">
                    <CardHeader>
                      <CardTitle className="neon-text font-orbitron flex items-center gap-2">
                        <MessageSquare className="h-5 w-5 text-green-400" />
                        [REQUEST_METRICS]
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-center">
                        <div className="text-3xl font-bold neon-text mb-2">--</div>
                        <p className="text-sm text-muted-foreground terminal-text">Active Requests</p>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="glass-effect terminal-glow">
                    <CardHeader>
                      <CardTitle className="neon-text font-orbitron flex items-center gap-2">
                        <Database className="h-5 w-5 text-pink-400" />
                        [SYSTEM_STATUS]
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-center">
                        <div className="text-lg font-bold text-green-400 mb-2 terminal-text">ONLINE</div>
                        <p className="text-sm text-muted-foreground terminal-text">All Systems Operational</p>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <Card className="glass-effect neon-border terminal-glow">
                  <CardHeader>
                    <CardTitle className="neon-text font-orbitron flex items-center gap-2">
                      <Shield className="h-5 w-5" />
                      [ADMIN_ACTIONS]
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <Button
                        onClick={() => setActiveTab('users')}
                        className="glow-blue hover:glow-green transition-all duration-300 justify-start"
                      >
                        <Users className="h-4 w-4 mr-2" />
                        Manage Users
                      </Button>
                      <Button
                        onClick={() => setActiveTab('requests')}
                        className="glow-pink hover:glow-green transition-all duration-300 justify-start"
                      >
                        <MessageSquare className="h-4 w-4 mr-2" />
                        Manage Requests
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="users">
                <UserManagement />
              </TabsContent>

              <TabsContent value="requests">
                <RequestManagement />
              </TabsContent>
            </div>
          </Tabs>
        </motion.div>
      </div>
    </div>
  );
}