'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Users, 
  TrendingUp,
  Target,
  Clock,
  Award,
  Activity,
  Calendar,
  MessageSquare
} from 'lucide-react';

interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'editor' | 'contributor' | 'viewer';
  avatar: string;
  status: 'online' | 'offline' | 'away';
  lastActive: string;
  contentCreated: number;
  tasksCompleted: number;
  performance: number;
}

interface TeamOverviewProps {
  members: TeamMember[];
}

export function TeamOverview({ members }: TeamOverviewProps) {
  const totalContent = members.reduce((sum, member) => sum + member.contentCreated, 0);
  const totalTasks = members.reduce((sum, member) => sum + member.tasksCompleted, 0);
  const avgPerformance = members.reduce((sum, member) => sum + member.performance, 0) / members.length;
  const onlineMembers = members.filter(m => m.status === 'online').length;

  const topPerformers = [...members]
    .sort((a, b) => b.performance - a.performance)
    .slice(0, 3);

  const recentActivity = [
    {
      id: '1',
      member: 'Sarah Johnson',
      action: 'completed content review',
      target: 'SEO Best Practices Guide',
      timestamp: '5 minutes ago',
      type: 'completion'
    },
    {
      id: '2',
      member: 'Mike Chen',
      action: 'created new content',
      target: 'Marketing Automation Tutorial',
      timestamp: '12 minutes ago',
      type: 'creation'
    },
    {
      id: '3',
      member: 'Emily Rodriguez',
      action: 'updated project status',
      target: 'Q1 Content Campaign',
      timestamp: '25 minutes ago',
      type: 'update'
    },
    {
      id: '4',
      member: 'David Kim',
      action: 'optimized content',
      target: 'Digital Marketing Trends',
      timestamp: '1 hour ago',
      type: 'optimization'
    }
  ];

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'completion': return <Target className="h-4 w-4 text-green-500" />;
      case 'creation': return <Users className="h-4 w-4 text-blue-500" />;
      case 'update': return <Activity className="h-4 w-4 text-purple-500" />;
      case 'optimization': return <TrendingUp className="h-4 w-4 text-orange-500" />;
      default: return <Activity className="h-4 w-4 text-gray-500" />;
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin': return 'bg-red-100 text-red-800';
      case 'editor': return 'bg-blue-100 text-blue-800';
      case 'contributor': return 'bg-green-100 text-green-800';
      case 'viewer': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      {/* Team Performance Metrics */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Online Members</CardTitle>
            <Users className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{onlineMembers}/{members.length}</div>
            <p className="text-xs text-muted-foreground">
              {Math.round((onlineMembers / members.length) * 100)}% team online
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Content</CardTitle>
            <Target className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalContent}</div>
            <p className="text-xs text-muted-foreground">
              Created this month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tasks Completed</CardTitle>
            <Clock className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalTasks}</div>
            <p className="text-xs text-muted-foreground">
              Across all projects
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Performance</CardTitle>
            <TrendingUp className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{Math.round(avgPerformance)}%</div>
            <p className="text-xs text-muted-foreground">
              Team performance score
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Top Performers */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Award className="h-5 w-5 mr-2" />
              Top Performers
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {topPerformers.map((member, index) => (
                <div key={member.id} className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-gradient-to-r from-yellow-400 to-orange-500 text-white font-bold text-sm">
                      #{index + 1}
                    </div>
                    <div>
                      <div className="font-medium">{member.name}</div>
                      <Badge className={getRoleColor(member.role)} variant="outline">
                        {member.role}
                      </Badge>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-green-600">{member.performance}%</div>
                    <div className="text-xs text-muted-foreground">
                      {member.contentCreated} content
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center">
                <Activity className="h-5 w-5 mr-2" />
                Recent Activity
              </span>
              <Button variant="ghost" size="sm">
                View All
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentActivity.map((activity) => (
                <div key={activity.id} className="flex items-start space-x-3">
                  <div className="flex-shrink-0 mt-1">
                    {getActivityIcon(activity.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm">
                      <span className="font-medium">{activity.member}</span>
                      {' '}{activity.action}{' '}
                      <span className="font-medium">{activity.target}</span>
                    </p>
                    <p className="text-xs text-muted-foreground">{activity.timestamp}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Team Productivity Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Team Productivity Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {members.map((member) => (
              <div key={member.id} className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center space-x-2">
                    <span className="font-medium">{member.name}</span>
                    <Badge className={getRoleColor(member.role)} variant="outline">
                      {member.role}
                    </Badge>
                  </div>
                  <span className="text-muted-foreground">
                    {member.contentCreated} content • {member.performance}% performance
                  </span>
                </div>
                <Progress value={member.performance} className="h-2" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="cursor-pointer hover:shadow-md transition-shadow">
          <CardContent className="p-6 text-center">
            <Calendar className="h-8 w-8 mx-auto mb-3 text-blue-600" />
            <h3 className="font-medium mb-2">Schedule Team Meeting</h3>
            <p className="text-sm text-muted-foreground">
              Coordinate with your team members
            </p>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:shadow-md transition-shadow">
          <CardContent className="p-6 text-center">
            <MessageSquare className="h-8 w-8 mx-auto mb-3 text-green-600" />
            <h3 className="font-medium mb-2">Team Chat</h3>
            <p className="text-sm text-muted-foreground">
              Collaborate in real-time
            </p>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:shadow-md transition-shadow">
          <CardContent className="p-6 text-center">
            <Target className="h-8 w-8 mx-auto mb-3 text-purple-600" />
            <h3 className="font-medium mb-2">Assign Tasks</h3>
            <p className="text-sm text-muted-foreground">
              Distribute work efficiently
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
