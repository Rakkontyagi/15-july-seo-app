/**
 * Team Activity Feed
 * Completes Story 3.2 - Real-time team activity notifications
 * Live activity stream with collaboration timeline
 */

'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Activity, 
  FileText, 
  MessageSquare, 
  CheckCircle, 
  XCircle, 
  Edit, 
  Upload, 
  Download,
  Users,
  Clock,
  Filter,
  Bell,
  BellOff,
  RefreshCw,
  Calendar,
  TrendingUp,
  GitBranch,
  Eye
} from 'lucide-react';

import { useAppStore } from '@/lib/store/app-store';
import { sseManager } from '@/lib/realtime/sse-manager';

// Types
interface ActivityItem {
  id: string;
  type: 'content_created' | 'content_updated' | 'comment_added' | 'approval_given' | 'review_completed' | 'team_joined' | 'export_generated';
  userId: string;
  userName: string;
  userAvatar?: string;
  timestamp: string;
  description: string;
  metadata: {
    contentId?: string;
    contentTitle?: string;
    commentId?: string;
    reviewId?: string;
    teamId?: string;
    exportFormat?: string;
    [key: string]: any;
  };
  priority: 'low' | 'medium' | 'high';
  read: boolean;
}

interface ActivityFilter {
  type: 'all' | 'content' | 'comments' | 'approvals' | 'team';
  timeRange: '1h' | '24h' | '7d' | '30d';
  users: string[];
  priority: 'all' | 'high' | 'medium' | 'low';
}

interface TeamActivityFeedProps {
  organizationId: string;
  showNotifications?: boolean;
  maxItems?: number;
}

export function TeamActivityFeed({ 
  organizationId, 
  showNotifications = true, 
  maxItems = 50 
}: TeamActivityFeedProps) {
  const { user } = useAppStore();
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<ActivityFilter>({
    type: 'all',
    timeRange: '24h',
    users: [],
    priority: 'all',
  });
  const [notifications, setNotifications] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);

  // Load initial activity data
  useEffect(() => {
    loadActivityData();
    
    // Set up real-time updates
    if (showNotifications) {
      setupRealTimeUpdates();
    }
  }, [organizationId, filter]);

  // Calculate unread count
  useEffect(() => {
    const unread = activities.filter(activity => !activity.read).length;
    setUnreadCount(unread);
  }, [activities]);

  const loadActivityData = async () => {
    setIsLoading(true);
    
    try {
      // Simulate loading activity data
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const mockActivities = generateMockActivities(organizationId, filter);
      setActivities(mockActivities);
    } catch (error) {
      console.error('Failed to load activity data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const setupRealTimeUpdates = async () => {
    try {
      await sseManager.createConnection(
        user?.id || 'anonymous',
        `activity-${organizationId}`,
        handleActivityUpdate,
        handleActivityError
      );
    } catch (error) {
      console.error('Failed to setup real-time activity updates:', error);
    }
  };

  const handleActivityUpdate = (message: any) => {
    if (message.type === 'activity_update') {
      const newActivity: ActivityItem = message.data;
      
      setActivities(prev => {
        const updated = [newActivity, ...prev];
        return updated.slice(0, maxItems);
      });

      // Show browser notification if enabled
      if (notifications && 'Notification' in window && Notification.permission === 'granted') {
        new Notification('New Team Activity', {
          body: newActivity.description,
          icon: '/favicon.ico',
        });
      }
    }
  };

  const handleActivityError = (error: Event) => {
    console.error('Activity feed error:', error);
  };

  const handleFilterChange = (key: keyof ActivityFilter, value: any) => {
    setFilter(prev => ({ ...prev, [key]: value }));
  };

  const markAsRead = (activityId: string) => {
    setActivities(prev => 
      prev.map(activity => 
        activity.id === activityId 
          ? { ...activity, read: true }
          : activity
      )
    );
  };

  const markAllAsRead = () => {
    setActivities(prev => 
      prev.map(activity => ({ ...activity, read: true }))
    );
  };

  const toggleNotifications = async () => {
    if (!notifications && 'Notification' in window) {
      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        setNotifications(true);
      }
    } else {
      setNotifications(!notifications);
    }
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'content_created':
      case 'content_updated':
        return <FileText className="w-4 h-4" />;
      case 'comment_added':
        return <MessageSquare className="w-4 h-4" />;
      case 'approval_given':
        return <CheckCircle className="w-4 h-4" />;
      case 'review_completed':
        return <Eye className="w-4 h-4" />;
      case 'team_joined':
        return <Users className="w-4 h-4" />;
      case 'export_generated':
        return <Download className="w-4 h-4" />;
      default:
        return <Activity className="w-4 h-4" />;
    }
  };

  const getActivityColor = (type: string) => {
    switch (type) {
      case 'content_created':
        return 'text-green-600 bg-green-100';
      case 'content_updated':
        return 'text-blue-600 bg-blue-100';
      case 'comment_added':
        return 'text-purple-600 bg-purple-100';
      case 'approval_given':
        return 'text-green-600 bg-green-100';
      case 'review_completed':
        return 'text-orange-600 bg-orange-100';
      case 'team_joined':
        return 'text-indigo-600 bg-indigo-100';
      case 'export_generated':
        return 'text-gray-600 bg-gray-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'bg-red-100 text-red-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'low':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatTimeAgo = (timestamp: string) => {
    const now = new Date();
    const time = new Date(timestamp);
    const diffInMinutes = Math.floor((now.getTime() - time.getTime()) / (1000 * 60));

    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return `${Math.floor(diffInMinutes / 1440)}d ago`;
  };

  const filteredActivities = activities.filter(activity => {
    // Type filter
    if (filter.type !== 'all') {
      const typeMap = {
        content: ['content_created', 'content_updated'],
        comments: ['comment_added'],
        approvals: ['approval_given', 'review_completed'],
        team: ['team_joined'],
      };
      
      if (!typeMap[filter.type as keyof typeof typeMap]?.includes(activity.type)) {
        return false;
      }
    }

    // Priority filter
    if (filter.priority !== 'all' && activity.priority !== filter.priority) {
      return false;
    }

    // Time range filter
    const now = new Date();
    const activityTime = new Date(activity.timestamp);
    const timeDiff = now.getTime() - activityTime.getTime();
    
    const timeRanges = {
      '1h': 60 * 60 * 1000,
      '24h': 24 * 60 * 60 * 1000,
      '7d': 7 * 24 * 60 * 60 * 1000,
      '30d': 30 * 24 * 60 * 60 * 1000,
    };

    if (timeDiff > timeRanges[filter.timeRange]) {
      return false;
    }

    // User filter
    if (filter.users.length > 0 && !filter.users.includes(activity.userId)) {
      return false;
    }

    return true;
  });

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center h-64">
          <div className="text-center space-y-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="text-muted-foreground">Loading activity feed...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <CardTitle className="flex items-center gap-2">
              <Activity className="w-5 h-5" />
              Team Activity
              {unreadCount > 0 && (
                <Badge variant="destructive" className="text-xs">
                  {unreadCount}
                </Badge>
              )}
            </CardTitle>
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleNotifications}
              className="flex items-center gap-2"
            >
              {notifications ? (
                <Bell className="w-4 h-4" />
              ) : (
                <BellOff className="w-4 h-4" />
              )}
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={loadActivityData}
            >
              <RefreshCw className="w-4 h-4" />
            </Button>
            
            {unreadCount > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={markAllAsRead}
              >
                Mark all read
              </Button>
            )}
          </div>
        </div>
        
        <CardDescription>
          Real-time team collaboration activity
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Filters */}
        <div className="flex flex-wrap gap-2">
          <Select value={filter.type} onValueChange={(value) => handleFilterChange('type', value)}>
            <SelectTrigger className="w-32">
              <Filter className="w-4 h-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="content">Content</SelectItem>
              <SelectItem value="comments">Comments</SelectItem>
              <SelectItem value="approvals">Approvals</SelectItem>
              <SelectItem value="team">Team</SelectItem>
            </SelectContent>
          </Select>

          <Select value={filter.timeRange} onValueChange={(value) => handleFilterChange('timeRange', value)}>
            <SelectTrigger className="w-32">
              <Clock className="w-4 h-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1h">Last Hour</SelectItem>
              <SelectItem value="24h">Last 24h</SelectItem>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
            </SelectContent>
          </Select>

          <Select value={filter.priority} onValueChange={(value) => handleFilterChange('priority', value)}>
            <SelectTrigger className="w-32">
              <TrendingUp className="w-4 h-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Priority</SelectItem>
              <SelectItem value="high">High</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="low">Low</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Activity List */}
        <div className="space-y-3 max-h-96 overflow-y-auto">
          {filteredActivities.length === 0 ? (
            <div className="text-center py-8">
              <Activity className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">No Activity</h3>
              <p className="text-muted-foreground">
                No team activity found for the selected filters.
              </p>
            </div>
          ) : (
            filteredActivities.map(activity => (
              <div
                key={activity.id}
                className={`flex items-start gap-3 p-3 rounded-lg border transition-colors cursor-pointer hover:bg-gray-50 ${
                  !activity.read ? 'bg-blue-50 border-blue-200' : 'bg-white'
                }`}
                onClick={() => markAsRead(activity.id)}
              >
                {/* Activity Icon */}
                <div className={`p-2 rounded-full ${getActivityColor(activity.type)}`}>
                  {getActivityIcon(activity.type)}
                </div>

                {/* User Avatar */}
                <Avatar className="w-8 h-8">
                  <AvatarImage src={activity.userAvatar} />
                  <AvatarFallback className="text-xs">
                    {activity.userName.charAt(0)}
                  </AvatarFallback>
                </Avatar>

                {/* Activity Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium text-sm">{activity.userName}</span>
                    <Badge className={getPriorityColor(activity.priority)} variant="outline">
                      {activity.priority}
                    </Badge>
                    {!activity.read && (
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    )}
                  </div>
                  
                  <p className="text-sm text-gray-700 mb-1">{activity.description}</p>
                  
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Clock className="w-3 h-3" />
                    {formatTimeAgo(activity.timestamp)}
                    
                    {activity.metadata.contentTitle && (
                      <>
                        <span>•</span>
                        <span className="font-medium">{activity.metadata.contentTitle}</span>
                      </>
                    )}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center gap-1">
                  {activity.metadata.contentId && (
                    <Button variant="ghost" size="sm">
                      <Eye className="w-3 h-3" />
                    </Button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Load More */}
        {filteredActivities.length >= maxItems && (
          <div className="text-center pt-4 border-t">
            <Button variant="outline" onClick={loadActivityData}>
              Load More Activity
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Mock data generator
function generateMockActivities(organizationId: string, filter: ActivityFilter): ActivityItem[] {
  const activities: ActivityItem[] = [];
  const now = new Date();

  const activityTypes = [
    'content_created',
    'content_updated',
    'comment_added',
    'approval_given',
    'review_completed',
    'team_joined',
    'export_generated',
  ];

  const users = [
    { id: 'user-1', name: 'Sarah Johnson', avatar: '/avatars/sarah.jpg' },
    { id: 'user-2', name: 'Mike Chen', avatar: '/avatars/mike.jpg' },
    { id: 'user-3', name: 'Lisa Wang', avatar: '/avatars/lisa.jpg' },
    { id: 'user-4', name: 'David Brown', avatar: '/avatars/david.jpg' },
    { id: 'user-5', name: 'Emma Davis', avatar: '/avatars/emma.jpg' },
  ];

  const contentTitles = [
    'Digital Marketing Strategies for 2024',
    'SEO Best Practices Guide',
    'Content Creation Workflow',
    'Social Media Marketing Tips',
    'Email Marketing Automation',
  ];

  for (let i = 0; i < 50; i++) {
    const user = users[Math.floor(Math.random() * users.length)];
    const type = activityTypes[Math.floor(Math.random() * activityTypes.length)];
    const contentTitle = contentTitles[Math.floor(Math.random() * contentTitles.length)];
    
    const activity: ActivityItem = {
      id: `activity-${i}`,
      type: type as ActivityItem['type'],
      userId: user.id,
      userName: user.name,
      userAvatar: user.avatar,
      timestamp: new Date(now.getTime() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString(),
      description: generateActivityDescription(type, user.name, contentTitle),
      metadata: {
        contentId: `content-${Math.floor(Math.random() * 100)}`,
        contentTitle,
        commentId: type === 'comment_added' ? `comment-${Math.floor(Math.random() * 100)}` : undefined,
        reviewId: type === 'review_completed' ? `review-${Math.floor(Math.random() * 100)}` : undefined,
        exportFormat: type === 'export_generated' ? ['pdf', 'excel', 'csv'][Math.floor(Math.random() * 3)] : undefined,
      },
      priority: ['low', 'medium', 'high'][Math.floor(Math.random() * 3)] as ActivityItem['priority'],
      read: Math.random() > 0.3, // 70% read, 30% unread
    };

    activities.push(activity);
  }

  return activities.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
}

function generateActivityDescription(type: string, userName: string, contentTitle: string): string {
  switch (type) {
    case 'content_created':
      return `created new content "${contentTitle}"`;
    case 'content_updated':
      return `updated content "${contentTitle}"`;
    case 'comment_added':
      return `added a comment to "${contentTitle}"`;
    case 'approval_given':
      return `approved content "${contentTitle}"`;
    case 'review_completed':
      return `completed review for "${contentTitle}"`;
    case 'team_joined':
      return `joined the team`;
    case 'export_generated':
      return `exported "${contentTitle}" as PDF`;
    default:
      return `performed an action on "${contentTitle}"`;
  }
}
