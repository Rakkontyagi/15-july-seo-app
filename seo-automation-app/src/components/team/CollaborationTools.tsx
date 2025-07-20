'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { 
  MessageSquare, 
  Send,
  Paperclip,
  Smile,
  Video,
  Phone,
  Calendar,
  FileText,
  Image,
  Link,
  Bell,
  Settings,
  Users,
  Clock,
  CheckCircle,
  AlertCircle
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

interface ChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  message: string;
  timestamp: string;
  type: 'text' | 'file' | 'image' | 'link';
  attachments?: string[];
}

interface Notification {
  id: string;
  type: 'mention' | 'task' | 'deadline' | 'approval';
  title: string;
  description: string;
  timestamp: string;
  read: boolean;
  actionRequired: boolean;
}

interface CollaborationToolsProps {
  members: TeamMember[];
}

export function CollaborationTools({ members }: CollaborationToolsProps) {
  const [activeChat, setActiveChat] = useState('general');
  const [newMessage, setNewMessage] = useState('');
  const [notifications] = useState<Notification[]>([
    {
      id: '1',
      type: 'mention',
      title: 'Sarah mentioned you',
      description: 'in "Q1 Content Campaign" project discussion',
      timestamp: '5 minutes ago',
      read: false,
      actionRequired: false
    },
    {
      id: '2',
      type: 'task',
      title: 'New task assigned',
      description: 'Review "SEO Best Practices" content',
      timestamp: '15 minutes ago',
      read: false,
      actionRequired: true
    },
    {
      id: '3',
      type: 'deadline',
      title: 'Deadline approaching',
      description: 'Marketing Automation Tutorial due in 2 days',
      timestamp: '1 hour ago',
      read: true,
      actionRequired: true
    },
    {
      id: '4',
      type: 'approval',
      title: 'Content approved',
      description: 'Digital Marketing Trends has been approved',
      timestamp: '2 hours ago',
      read: true,
      actionRequired: false
    }
  ]);

  const [chatMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      senderId: '1',
      senderName: 'Sarah Johnson',
      message: 'Hey team! Just finished reviewing the Q1 content strategy. Looking great so far! 🎉',
      timestamp: '10:30 AM',
      type: 'text'
    },
    {
      id: '2',
      senderId: '2',
      senderName: 'Mike Chen',
      message: 'Thanks Sarah! I\'ve uploaded the latest SEO analysis report.',
      timestamp: '10:32 AM',
      type: 'file',
      attachments: ['seo-analysis-report.pdf']
    },
    {
      id: '3',
      senderId: '3',
      senderName: 'Emily Rodriguez',
      message: 'Should we schedule a quick sync for tomorrow to discuss the optimization priorities?',
      timestamp: '10:35 AM',
      type: 'text'
    },
    {
      id: '4',
      senderId: '4',
      senderName: 'David Kim',
      message: 'Great idea! I\'m free after 2 PM. Here\'s the competitor analysis I mentioned:',
      timestamp: '10:38 AM',
      type: 'link'
    }
  ]);

  const chatChannels = [
    { id: 'general', name: 'General', unread: 3, type: 'public' },
    { id: 'q1-campaign', name: 'Q1 Campaign', unread: 1, type: 'project' },
    { id: 'seo-team', name: 'SEO Team', unread: 0, type: 'team' },
    { id: 'content-review', name: 'Content Review', unread: 5, type: 'workflow' }
  ];

  const handleSendMessage = () => {
    if (!newMessage.trim()) return;
    
    // In a real app, this would send the message to the backend
    console.log('Sending message:', newMessage);
    setNewMessage('');
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'mention': return <MessageSquare className="h-4 w-4 text-blue-500" />;
      case 'task': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'deadline': return <Clock className="h-4 w-4 text-orange-500" />;
      case 'approval': return <CheckCircle className="h-4 w-4 text-purple-500" />;
      default: return <Bell className="h-4 w-4 text-gray-500" />;
    }
  };

  const getChannelIcon = (type: string) => {
    switch (type) {
      case 'public': return <MessageSquare className="h-4 w-4" />;
      case 'project': return <FileText className="h-4 w-4" />;
      case 'team': return <Users className="h-4 w-4" />;
      case 'workflow': return <Settings className="h-4 w-4" />;
      default: return <MessageSquare className="h-4 w-4" />;
    }
  };

  const unreadNotifications = notifications.filter(n => !n.read).length;
  const actionRequiredCount = notifications.filter(n => n.actionRequired && !n.read).length;

  return (
    <div className="space-y-6">
      {/* Collaboration Overview */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Chats</CardTitle>
            <MessageSquare className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{chatChannels.length}</div>
            <p className="text-xs text-muted-foreground">Team channels</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Unread Messages</CardTitle>
            <Bell className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{chatChannels.reduce((sum, ch) => sum + ch.unread, 0)}</div>
            <p className="text-xs text-muted-foreground">Across all channels</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Notifications</CardTitle>
            <AlertCircle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{unreadNotifications}</div>
            <p className="text-xs text-muted-foreground">{actionRequiredCount} need action</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Online Members</CardTitle>
            <Users className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{members.filter(m => m.status === 'online').length}</div>
            <p className="text-xs text-muted-foreground">Available now</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Team Chat */}
        <div className="lg:col-span-2">
          <Card className="h-[600px] flex flex-col">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center">
                  <MessageSquare className="h-5 w-5 mr-2" />
                  Team Chat
                </CardTitle>
                <div className="flex items-center space-x-2">
                  <Button variant="ghost" size="sm">
                    <Video className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="sm">
                    <Phone className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="sm">
                    <Settings className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              
              {/* Channel Tabs */}
              <div className="flex space-x-1 bg-muted p-1 rounded-lg">
                {chatChannels.map((channel) => (
                  <Button
                    key={channel.id}
                    variant={activeChat === channel.id ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setActiveChat(channel.id)}
                    className="flex items-center space-x-2"
                  >
                    {getChannelIcon(channel.type)}
                    <span>{channel.name}</span>
                    {channel.unread > 0 && (
                      <Badge variant="destructive" className="text-xs">
                        {channel.unread}
                      </Badge>
                    )}
                  </Button>
                ))}
              </div>
            </CardHeader>
            
            <CardContent className="flex-1 flex flex-col">
              {/* Messages */}
              <div className="flex-1 overflow-y-auto space-y-4 mb-4">
                {chatMessages.map((message) => (
                  <div key={message.id} className="flex items-start space-x-3">
                    <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white text-xs font-medium">
                      {message.senderName.split(' ').map(n => n[0]).join('')}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-1">
                        <span className="font-medium text-sm">{message.senderName}</span>
                        <span className="text-xs text-muted-foreground">{message.timestamp}</span>
                      </div>
                      <div className="text-sm">{message.message}</div>
                      {message.attachments && (
                        <div className="mt-2">
                          {message.attachments.map((attachment, index) => (
                            <div key={index} className="flex items-center space-x-2 p-2 bg-muted rounded text-xs">
                              <Paperclip className="h-3 w-3" />
                              <span>{attachment}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
              
              {/* Message Input */}
              <div className="flex items-center space-x-2">
                <div className="flex-1 relative">
                  <Input
                    placeholder="Type your message..."
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                    className="pr-20"
                  />
                  <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex items-center space-x-1">
                    <Button variant="ghost" size="sm">
                      <Paperclip className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm">
                      <Smile className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <Button onClick={handleSendMessage} disabled={!newMessage.trim()}>
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Notifications & Quick Actions */}
        <div className="space-y-6">
          {/* Notifications */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center">
                  <Bell className="h-5 w-5 mr-2" />
                  Notifications
                </span>
                {unreadNotifications > 0 && (
                  <Badge variant="destructive">{unreadNotifications}</Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {notifications.slice(0, 4).map((notification) => (
                  <div
                    key={notification.id}
                    className={`p-3 border rounded-lg ${
                      !notification.read ? 'bg-blue-50 border-blue-200' : ''
                    }`}
                  >
                    <div className="flex items-start space-x-3">
                      {getNotificationIcon(notification.type)}
                      <div className="flex-1">
                        <div className="font-medium text-sm">{notification.title}</div>
                        <div className="text-xs text-muted-foreground">{notification.description}</div>
                        <div className="text-xs text-muted-foreground mt-1">{notification.timestamp}</div>
                        {notification.actionRequired && (
                          <Button size="sm" className="mt-2">
                            Take Action
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Online Team Members */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Users className="h-5 w-5 mr-2" />
                Online Members
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {members.filter(m => m.status === 'online').map((member) => (
                  <div key={member.id} className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="relative">
                        <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white text-xs font-medium">
                          {member.name.split(' ').map(n => n[0]).join('')}
                        </div>
                        <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
                      </div>
                      <div>
                        <div className="font-medium text-sm">{member.name}</div>
                        <div className="text-xs text-muted-foreground">{member.role}</div>
                      </div>
                    </div>
                    <Button variant="ghost" size="sm">
                      <MessageSquare className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Button variant="outline" className="w-full justify-start">
                  <Calendar className="h-4 w-4 mr-2" />
                  Schedule Meeting
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <FileText className="h-4 w-4 mr-2" />
                  Share Document
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <Users className="h-4 w-4 mr-2" />
                  Create Team
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <Settings className="h-4 w-4 mr-2" />
                  Manage Permissions
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
