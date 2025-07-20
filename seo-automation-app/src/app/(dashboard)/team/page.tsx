'use client';

import { useState } from 'react';
import { Breadcrumb } from '@/components/layout/breadcrumb';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { TeamOverview } from '@/components/team/TeamOverview';
import { ProjectManagement } from '@/components/team/ProjectManagement';
import { CollaborationTools } from '@/components/team/CollaborationTools';
import { TeamAnalytics } from '@/components/team/TeamAnalytics';
import { 
  Users, 
  FolderOpen,
  MessageSquare,
  BarChart3,
  Plus,
  Settings,
  Crown,
  Zap,
  Target,
  Clock,
  TrendingUp,
  UserPlus,
  Calendar,
  Bell
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

export default function TeamPage() {
  const [activeTab, setActiveTab] = useState('overview');
  const [teamMembers] = useState<TeamMember[]>([
    {
      id: '1',
      name: 'Sarah Johnson',
      email: 'sarah@company.com',
      role: 'admin',
      avatar: '/avatars/sarah.jpg',
      status: 'online',
      lastActive: '2 minutes ago',
      contentCreated: 47,
      tasksCompleted: 23,
      performance: 94
    },
    {
      id: '2',
      name: 'Mike Chen',
      email: 'mike@company.com',
      role: 'editor',
      avatar: '/avatars/mike.jpg',
      status: 'online',
      lastActive: '5 minutes ago',
      contentCreated: 32,
      tasksCompleted: 18,
      performance: 87
    },
    {
      id: '3',
      name: 'Emily Rodriguez',
      email: 'emily@company.com',
      role: 'contributor',
      avatar: '/avatars/emily.jpg',
      status: 'away',
      lastActive: '1 hour ago',
      contentCreated: 28,
      tasksCompleted: 15,
      performance: 82
    },
    {
      id: '4',
      name: 'David Kim',
      email: 'david@company.com',
      role: 'editor',
      avatar: '/avatars/david.jpg',
      status: 'offline',
      lastActive: '3 hours ago',
      contentCreated: 41,
      tasksCompleted: 21,
      performance: 91
    }
  ]);

  const [teamProjects] = useState<TeamProject[]>([
    {
      id: '1',
      name: 'Q1 Content Campaign',
      description: 'Comprehensive content strategy for Q1 marketing goals',
      status: 'active',
      progress: 68,
      dueDate: '2025-03-31',
      assignedMembers: ['1', '2', '3'],
      contentCount: 24,
      priority: 'high'
    },
    {
      id: '2',
      name: 'SEO Optimization Sprint',
      description: 'Optimize existing content for better search rankings',
      status: 'active',
      progress: 45,
      dueDate: '2025-02-15',
      assignedMembers: ['2', '4'],
      contentCount: 18,
      priority: 'high'
    },
    {
      id: '3',
      name: 'Blog Redesign Project',
      description: 'Redesign blog layout and improve user experience',
      status: 'planning',
      progress: 12,
      dueDate: '2025-04-30',
      assignedMembers: ['1', '3', '4'],
      contentCount: 0,
      priority: 'medium'
    }
  ]);

  const teamStats = [
    {
      name: 'Team Members',
      value: teamMembers.length.toString(),
      change: '+2',
      changeType: 'increase' as const,
      icon: <Users className="h-4 w-4" />,
      color: 'text-blue-600'
    },
    {
      name: 'Active Projects',
      value: teamProjects.filter(p => p.status === 'active').length.toString(),
      change: '+1',
      changeType: 'increase' as const,
      icon: <FolderOpen className="h-4 w-4" />,
      color: 'text-green-600'
    },
    {
      name: 'Content This Month',
      value: '127',
      change: '+23%',
      changeType: 'increase' as const,
      icon: <Target className="h-4 w-4" />,
      color: 'text-purple-600'
    },
    {
      name: 'Team Performance',
      value: '88%',
      change: '+5%',
      changeType: 'increase' as const,
      icon: <TrendingUp className="h-4 w-4" />,
      color: 'text-orange-600'
    }
  ];

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin': return 'bg-red-100 text-red-800';
      case 'editor': return 'bg-blue-100 text-blue-800';
      case 'contributor': return 'bg-green-100 text-green-800';
      case 'viewer': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online': return 'bg-green-500';
      case 'away': return 'bg-yellow-500';
      case 'offline': return 'bg-gray-400';
      default: return 'bg-gray-400';
    }
  };

  const getProjectStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'completed': return 'bg-blue-100 text-blue-800';
      case 'paused': return 'bg-yellow-100 text-yellow-800';
      case 'planning': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      <Breadcrumb items={[
        { label: 'Dashboard', href: '/dashboard' },
        { label: 'Team Collaboration' }
      ]} />
      
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-responsive-3xl font-bold flex items-center">
            <Users className="h-8 w-8 mr-3 text-blue-600" />
            Team Collaboration
            <Badge className="ml-3 bg-gradient-to-r from-blue-500 to-purple-500 text-white">
              <Crown className="h-3 w-3 mr-1" />
              ENTERPRISE
            </Badge>
          </h1>
          <p className="text-muted-foreground text-responsive-base">
            Manage your team, projects, and collaborative content creation workflows
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline">
            <Bell className="h-4 w-4 mr-2" />
            Notifications
          </Button>
          <Button variant="outline">
            <Settings className="h-4 w-4 mr-2" />
            Team Settings
          </Button>
          <Button>
            <UserPlus className="h-4 w-4 mr-2" />
            Invite Member
          </Button>
        </div>
      </div>

      {/* Team Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        {teamStats.map((stat, index) => (
          <Card key={index}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{stat.name}</CardTitle>
              <div className={stat.color}>
                {stat.icon}
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <div className="flex items-center text-xs text-muted-foreground">
                <TrendingUp className="h-3 w-3 mr-1 text-green-500" />
                <span className="text-green-600">{stat.change}</span>
                <span className="ml-1">from last month</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Team Management Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">
            <Users className="h-4 w-4 mr-2" />
            Team Overview
          </TabsTrigger>
          <TabsTrigger value="projects">
            <FolderOpen className="h-4 w-4 mr-2" />
            Projects
          </TabsTrigger>
          <TabsTrigger value="collaboration">
            <MessageSquare className="h-4 w-4 mr-2" />
            Collaboration
          </TabsTrigger>
          <TabsTrigger value="analytics">
            <BarChart3 className="h-4 w-4 mr-2" />
            Analytics
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Team Members */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Team Members ({teamMembers.length})</span>
                  <Button size="sm">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Member
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {teamMembers.map((member) => (
                    <div key={member.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className="relative">
                          <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-medium">
                            {member.name.split(' ').map(n => n[0]).join('')}
                          </div>
                          <div className={`absolute -bottom-1 -right-1 w-3 h-3 rounded-full border-2 border-white ${getStatusColor(member.status)}`}></div>
                        </div>
                        <div>
                          <div className="font-medium">{member.name}</div>
                          <div className="text-sm text-muted-foreground">{member.email}</div>
                          <div className="text-xs text-muted-foreground">Last active: {member.lastActive}</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <Badge className={getRoleColor(member.role)}>
                          {member.role}
                        </Badge>
                        <div className="text-xs text-muted-foreground mt-1">
                          {member.contentCreated} content • {member.performance}% performance
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Active Projects */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Active Projects</span>
                  <Button size="sm">
                    <Plus className="h-4 w-4 mr-2" />
                    New Project
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {teamProjects.filter(p => p.status === 'active').map((project) => (
                    <div key={project.id} className="p-4 border rounded-lg">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="font-medium">{project.name}</h4>
                        <div className="flex items-center space-x-2">
                          <Badge className={getPriorityColor(project.priority)}>
                            {project.priority}
                          </Badge>
                          <Badge className={getProjectStatusColor(project.status)}>
                            {project.status}
                          </Badge>
                        </div>
                      </div>
                      
                      <p className="text-sm text-muted-foreground mb-3">{project.description}</p>
                      
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>Progress</span>
                          <span>{project.progress}%</span>
                        </div>
                        <Progress value={project.progress} className="h-2" />
                      </div>
                      
                      <div className="flex items-center justify-between mt-3 text-sm text-muted-foreground">
                        <span>Due: {new Date(project.dueDate).toLocaleDateString()}</span>
                        <span>{project.assignedMembers.length} members • {project.contentCount} content</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="projects" className="space-y-6">
          <ProjectManagement projects={teamProjects} members={teamMembers} />
        </TabsContent>

        <TabsContent value="collaboration" className="space-y-6">
          <CollaborationTools members={teamMembers} />
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          <TeamAnalytics members={teamMembers} projects={teamProjects} />
        </TabsContent>
      </Tabs>

      {/* Quick Actions */}
      <Card className="bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-medium text-blue-900 mb-1">
                🚀 Boost Team Productivity
              </h3>
              <p className="text-sm text-blue-700">
                Set up automated workflows, assign tasks, and track team performance in real-time
              </p>
            </div>
            <div className="flex items-center space-x-3">
              <Button variant="outline" className="border-blue-300">
                <Calendar className="h-4 w-4 mr-2" />
                Schedule Meeting
              </Button>
              <Button className="bg-blue-600 hover:bg-blue-700">
                <Zap className="h-4 w-4 mr-2" />
                Setup Automation
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
