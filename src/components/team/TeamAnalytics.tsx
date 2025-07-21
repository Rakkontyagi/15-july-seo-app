'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  BarChart3, 
  TrendingUp,
  TrendingDown,
  Users,
  Target,
  Clock,
  Award,
  Activity,
  Calendar,
  FileText,
  CheckCircle,
  AlertTriangle
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

interface TeamProject {
  id: string;
  name: string;
  description: string;
  status: 'active' | 'completed' | 'paused' | 'planning';
  progress: number;
  dueDate: string;
  assignedMembers: string[];
  contentCount: number;
  priority: 'high' | 'medium' | 'low';
}

interface TeamAnalyticsProps {
  members: TeamMember[];
  projects: TeamProject[];
}

export function TeamAnalytics({ members, projects }: TeamAnalyticsProps) {
  // Calculate team metrics
  const totalContent = members.reduce((sum, member) => sum + member.contentCreated, 0);
  const totalTasks = members.reduce((sum, member) => sum + member.tasksCompleted, 0);
  const avgPerformance = members.reduce((sum, member) => sum + member.performance, 0) / members.length;
  
  const activeProjects = projects.filter(p => p.status === 'active').length;
  const completedProjects = projects.filter(p => p.status === 'completed').length;
  const overdueProjects = projects.filter(p => 
    new Date(p.dueDate) < new Date() && p.status !== 'completed'
  ).length;

  // Performance trends (mock data)
  const performanceTrends = [
    { period: 'This Week', content: 47, tasks: 23, performance: 94 },
    { period: 'Last Week', content: 42, tasks: 19, performance: 89 },
    { period: '2 Weeks Ago', content: 38, tasks: 21, performance: 87 },
    { period: '3 Weeks Ago', content: 35, tasks: 18, performance: 85 }
  ];

  // Team productivity by role
  const roleProductivity = [
    { role: 'Admin', members: members.filter(m => m.role === 'admin').length, avgContent: 45, avgPerformance: 92 },
    { role: 'Editor', members: members.filter(m => m.role === 'editor').length, avgContent: 38, avgPerformance: 89 },
    { role: 'Contributor', members: members.filter(m => m.role === 'contributor').length, avgContent: 28, avgPerformance: 82 },
    { role: 'Viewer', members: members.filter(m => m.role === 'viewer').length, avgContent: 0, avgPerformance: 0 }
  ].filter(r => r.members > 0);

  // Project completion rates
  const projectMetrics = {
    onTime: projects.filter(p => p.status === 'completed').length,
    delayed: overdueProjects,
    inProgress: activeProjects,
    avgProgress: projects.reduce((sum, p) => sum + p.progress, 0) / projects.length
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'Admin': return 'bg-red-100 text-red-800';
      case 'Editor': return 'bg-blue-100 text-blue-800';
      case 'Contributor': return 'bg-green-100 text-green-800';
      case 'Viewer': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPerformanceColor = (performance: number) => {
    if (performance >= 90) return 'text-green-600';
    if (performance >= 80) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getTrendIcon = (current: number, previous: number) => {
    return current > previous ? (
      <TrendingUp className="h-4 w-4 text-green-500" />
    ) : (
      <TrendingDown className="h-4 w-4 text-red-500" />
    );
  };

  return (
    <div className="space-y-6">
      {/* Analytics Overview */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Team Productivity</CardTitle>
            <BarChart3 className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{Math.round(avgPerformance)}%</div>
            <div className="flex items-center text-xs text-muted-foreground">
              <TrendingUp className="h-3 w-3 mr-1 text-green-500" />
              <span className="text-green-600">+5.2%</span>
              <span className="ml-1">from last month</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Content Created</CardTitle>
            <FileText className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalContent}</div>
            <div className="flex items-center text-xs text-muted-foreground">
              <TrendingUp className="h-3 w-3 mr-1 text-green-500" />
              <span className="text-green-600">+12.3%</span>
              <span className="ml-1">this month</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tasks Completed</CardTitle>
            <CheckCircle className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalTasks}</div>
            <div className="flex items-center text-xs text-muted-foreground">
              <TrendingUp className="h-3 w-3 mr-1 text-green-500" />
              <span className="text-green-600">+8.7%</span>
              <span className="ml-1">completion rate</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Project Health</CardTitle>
            <Target className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{Math.round(projectMetrics.avgProgress)}%</div>
            <div className="flex items-center text-xs text-muted-foreground">
              {overdueProjects > 0 ? (
                <>
                  <AlertTriangle className="h-3 w-3 mr-1 text-red-500" />
                  <span className="text-red-600">{overdueProjects} overdue</span>
                </>
              ) : (
                <>
                  <CheckCircle className="h-3 w-3 mr-1 text-green-500" />
                  <span className="text-green-600">On track</span>
                </>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Performance Trends */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <TrendingUp className="h-5 w-5 mr-2" />
              Performance Trends
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {performanceTrends.map((trend, index) => (
                <div key={index} className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium">{trend.period}</span>
                    <div className="flex items-center space-x-4">
                      <span className="text-muted-foreground">
                        {trend.content} content • {trend.tasks} tasks
                      </span>
                      <span className={`font-medium ${getPerformanceColor(trend.performance)}`}>
                        {trend.performance}%
                      </span>
                    </div>
                  </div>
                  <Progress value={trend.performance} className="h-2" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Role-based Productivity */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Users className="h-5 w-5 mr-2" />
              Productivity by Role
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {roleProductivity.map((role, index) => (
                <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center space-x-3">
                    <Badge className={getRoleColor(role.role)}>
                      {role.role}
                    </Badge>
                    <div>
                      <div className="font-medium text-sm">{role.members} members</div>
                      <div className="text-xs text-muted-foreground">
                        Avg: {role.avgContent} content/month
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className={`font-bold ${getPerformanceColor(role.avgPerformance)}`}>
                      {role.avgPerformance}%
                    </div>
                    <div className="text-xs text-muted-foreground">performance</div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Individual Performance */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Award className="h-5 w-5 mr-2" />
            Individual Performance Analysis
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {members.map((member) => (
              <div key={member.id} className="p-4 border rounded-lg">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-medium">
                      {member.name.split(' ').map(n => n[0]).join('')}
                    </div>
                    <div>
                      <div className="font-medium">{member.name}</div>
                      <Badge className={getRoleColor(member.role)} variant="outline">
                        {member.role}
                      </Badge>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className={`text-lg font-bold ${getPerformanceColor(member.performance)}`}>
                      {member.performance}%
                    </div>
                    <div className="text-xs text-muted-foreground">performance score</div>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4 mb-3">
                  <div className="text-center">
                    <div className="text-lg font-bold text-blue-600">{member.contentCreated}</div>
                    <div className="text-xs text-muted-foreground">Content Created</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-bold text-green-600">{member.tasksCompleted}</div>
                    <div className="text-xs text-muted-foreground">Tasks Completed</div>
                  </div>
                  <div className="text-center">
                    <div className={`text-lg font-bold ${member.status === 'online' ? 'text-green-600' : 'text-gray-400'}`}>
                      {member.status === 'online' ? 'Online' : 'Offline'}
                    </div>
                    <div className="text-xs text-muted-foreground">Status</div>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Overall Performance</span>
                    <span>{member.performance}%</span>
                  </div>
                  <Progress value={member.performance} className="h-2" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Project Analytics */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Activity className="h-5 w-5 mr-2" />
            Project Analytics
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6 md:grid-cols-2">
            <div>
              <h4 className="font-medium mb-4">Project Status Distribution</h4>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Active Projects</span>
                  <div className="flex items-center space-x-2">
                    <div className="w-16 bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-green-500 h-2 rounded-full" 
                        style={{ width: `${(activeProjects / projects.length) * 100}%` }}
                      ></div>
                    </div>
                    <span className="text-sm font-medium">{activeProjects}</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Completed Projects</span>
                  <div className="flex items-center space-x-2">
                    <div className="w-16 bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-blue-500 h-2 rounded-full" 
                        style={{ width: `${(completedProjects / projects.length) * 100}%` }}
                      ></div>
                    </div>
                    <span className="text-sm font-medium">{completedProjects}</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Overdue Projects</span>
                  <div className="flex items-center space-x-2">
                    <div className="w-16 bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-red-500 h-2 rounded-full" 
                        style={{ width: `${(overdueProjects / projects.length) * 100}%` }}
                      ></div>
                    </div>
                    <span className="text-sm font-medium">{overdueProjects}</span>
                  </div>
                </div>
              </div>
            </div>

            <div>
              <h4 className="font-medium mb-4">Key Metrics</h4>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Average Progress</span>
                  <span className="font-medium">{Math.round(projectMetrics.avgProgress)}%</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">On-time Completion Rate</span>
                  <span className="font-medium text-green-600">
                    {Math.round((completedProjects / (completedProjects + overdueProjects || 1)) * 100)}%
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Total Content Pieces</span>
                  <span className="font-medium">
                    {projects.reduce((sum, p) => sum + p.contentCount, 0)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Team Utilization</span>
                  <span className="font-medium">
                    {Math.round((members.filter(m => m.status === 'online').length / members.length) * 100)}%
                  </span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
