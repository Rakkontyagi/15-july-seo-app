'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { 
  Zap, 
  Plus,
  Play,
  Pause,
  Trash2,
  Edit,
  CheckCircle,
  AlertTriangle,
  Clock,
  Activity,
  Globe,
  Code,
  Settings,
  Copy,
  Eye,
  RefreshCw
} from 'lucide-react';

interface Webhook {
  id: string;
  name: string;
  url: string;
  events: string[];
  status: 'active' | 'paused' | 'failed';
  lastTriggered: string;
  successRate: number;
  totalDeliveries: number;
  failedDeliveries: number;
  createdAt: string;
  secret: string;
}

interface WebhookEvent {
  id: string;
  webhookId: string;
  event: string;
  status: 'success' | 'failed' | 'pending';
  timestamp: string;
  responseCode: number;
  responseTime: number;
  payload: string;
  error?: string;
}

export function WebhookManager() {
  const [webhooks] = useState<Webhook[]>([
    {
      id: '1',
      name: 'Content Published',
      url: 'https://api.example.com/webhooks/content',
      events: ['content.published', 'content.updated'],
      status: 'active',
      lastTriggered: '5 minutes ago',
      successRate: 98.5,
      totalDeliveries: 1247,
      failedDeliveries: 18,
      createdAt: '2025-01-01',
      secret: 'whsec_1234567890abcdef'
    },
    {
      id: '2',
      name: 'SEO Analysis Complete',
      url: 'https://hooks.slack.com/services/T00000000/B00000000/XXXXXXXXXXXXXXXXXXXXXXXX',
      events: ['seo.analysis.complete', 'seo.score.updated'],
      status: 'active',
      lastTriggered: '2 hours ago',
      successRate: 100,
      totalDeliveries: 89,
      failedDeliveries: 0,
      createdAt: '2025-01-10',
      secret: 'whsec_abcdef1234567890'
    },
    {
      id: '3',
      name: 'Team Notifications',
      url: 'https://api.teams.com/webhook/notifications',
      events: ['team.member.added', 'project.completed'],
      status: 'failed',
      lastTriggered: '1 day ago',
      successRate: 85.2,
      totalDeliveries: 234,
      failedDeliveries: 35,
      createdAt: '2025-01-05',
      secret: 'whsec_fedcba0987654321'
    }
  ]);

  const [recentEvents] = useState<WebhookEvent[]>([
    {
      id: '1',
      webhookId: '1',
      event: 'content.published',
      status: 'success',
      timestamp: '5 minutes ago',
      responseCode: 200,
      responseTime: 145,
      payload: '{"id": "123", "title": "SEO Best Practices", "status": "published"}'
    },
    {
      id: '2',
      webhookId: '2',
      event: 'seo.analysis.complete',
      status: 'success',
      timestamp: '2 hours ago',
      responseCode: 200,
      responseTime: 89,
      payload: '{"content_id": "456", "seo_score": 87, "recommendations": [...]}'
    },
    {
      id: '3',
      webhookId: '3',
      event: 'team.member.added',
      status: 'failed',
      timestamp: '1 day ago',
      responseCode: 404,
      responseTime: 5000,
      payload: '{"member_id": "789", "name": "John Doe", "role": "editor"}',
      error: 'Webhook endpoint not found'
    }
  ]);

  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newWebhook, setNewWebhook] = useState({
    name: '',
    url: '',
    events: [] as string[],
    secret: ''
  });

  const availableEvents = [
    'content.published',
    'content.updated',
    'content.deleted',
    'seo.analysis.complete',
    'seo.score.updated',
    'team.member.added',
    'team.member.removed',
    'project.created',
    'project.completed',
    'integration.connected',
    'integration.failed'
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'paused': return 'bg-yellow-100 text-yellow-800';
      case 'failed': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getEventStatusColor = (status: string) => {
    switch (status) {
      case 'success': return 'bg-green-100 text-green-800';
      case 'failed': return 'bg-red-100 text-red-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'paused': return <Pause className="h-4 w-4 text-yellow-500" />;
      case 'failed': return <AlertTriangle className="h-4 w-4 text-red-500" />;
      default: return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const handleEventToggle = (event: string) => {
    setNewWebhook(prev => ({
      ...prev,
      events: prev.events.includes(event)
        ? prev.events.filter(e => e !== event)
        : [...prev.events, event]
    }));
  };

  const handleCreateWebhook = () => {
    // In a real app, this would create the webhook
    console.log('Creating webhook:', newWebhook);
    setShowCreateForm(false);
    setNewWebhook({ name: '', url: '', events: [], secret: '' });
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      console.log('Copied to clipboard');
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  const webhookStats = {
    total: webhooks.length,
    active: webhooks.filter(w => w.status === 'active').length,
    failed: webhooks.filter(w => w.status === 'failed').length,
    totalDeliveries: webhooks.reduce((sum, w) => sum + w.totalDeliveries, 0),
    avgSuccessRate: webhooks.reduce((sum, w) => sum + w.successRate, 0) / webhooks.length
  };

  return (
    <div className="space-y-6">
      {/* Webhook Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Webhooks</CardTitle>
            <Zap className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{webhookStats.total}</div>
            <p className="text-xs text-muted-foreground">Configured endpoints</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{webhookStats.active}</div>
            <p className="text-xs text-muted-foreground">Working properly</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Deliveries</CardTitle>
            <Activity className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{webhookStats.totalDeliveries.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">All time</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{webhookStats.avgSuccessRate.toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground">Average delivery success</p>
          </CardContent>
        </Card>
      </div>

      {/* Webhook List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Configured Webhooks ({webhooks.length})</span>
            <Button onClick={() => setShowCreateForm(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Webhook
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {webhooks.map((webhook) => (
              <div key={webhook.id} className="p-4 border rounded-lg">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-3">
                    {getStatusIcon(webhook.status)}
                    <div>
                      <h4 className="font-medium">{webhook.name}</h4>
                      <div className="text-sm text-muted-foreground font-mono">
                        {webhook.url}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge className={getStatusColor(webhook.status)}>
                      {webhook.status}
                    </Badge>
                    <Button variant="ghost" size="sm">
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-3 text-sm">
                  <div>
                    <div className="text-muted-foreground">Success Rate</div>
                    <div className="font-medium text-green-600">{webhook.successRate}%</div>
                  </div>
                  <div>
                    <div className="text-muted-foreground">Total Deliveries</div>
                    <div className="font-medium">{webhook.totalDeliveries.toLocaleString()}</div>
                  </div>
                  <div>
                    <div className="text-muted-foreground">Failed</div>
                    <div className="font-medium text-red-600">{webhook.failedDeliveries}</div>
                  </div>
                  <div>
                    <div className="text-muted-foreground">Last Triggered</div>
                    <div className="font-medium">{webhook.lastTriggered}</div>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="text-sm font-medium">Events:</div>
                  <div className="flex flex-wrap gap-2">
                    {webhook.events.map((event, index) => (
                      <Badge key={index} variant="secondary">
                        {event}
                      </Badge>
                    ))}
                  </div>
                </div>

                <div className="mt-3 flex items-center space-x-2">
                  <Button size="sm" variant="outline">
                    <Activity className="h-3 w-3 mr-1" />
                    Test
                  </Button>
                  <Button size="sm" variant="outline">
                    <Eye className="h-3 w-3 mr-1" />
                    Logs
                  </Button>
                  <Button size="sm" variant="outline">
                    <RefreshCw className="h-3 w-3 mr-1" />
                    Retry Failed
                  </Button>
                  {webhook.status === 'active' ? (
                    <Button size="sm" variant="outline">
                      <Pause className="h-3 w-3 mr-1" />
                      Pause
                    </Button>
                  ) : (
                    <Button size="sm" variant="outline">
                      <Play className="h-3 w-3 mr-1" />
                      Resume
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Recent Events */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Activity className="h-5 w-5 mr-2" />
            Recent Webhook Events
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {recentEvents.map((event) => (
              <div key={event.id} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center space-x-3">
                  <Badge className={getEventStatusColor(event.status)}>
                    {event.status}
                  </Badge>
                  <div>
                    <div className="font-medium text-sm">{event.event}</div>
                    <div className="text-xs text-muted-foreground">
                      {event.timestamp} • {event.responseCode} • {event.responseTime}ms
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Button variant="ghost" size="sm">
                    <Code className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="sm">
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Create Webhook Form */}
      {showCreateForm && (
        <Card>
          <CardHeader>
            <CardTitle>Create New Webhook</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium mb-2">Webhook Name</label>
                  <Input
                    placeholder="e.g., Content Published Notifications"
                    value={newWebhook.name}
                    onChange={(e) => setNewWebhook(prev => ({ ...prev, name: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Endpoint URL</label>
                  <Input
                    placeholder="https://api.example.com/webhooks"
                    value={newWebhook.url}
                    onChange={(e) => setNewWebhook(prev => ({ ...prev, url: e.target.value }))}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Events to Subscribe</label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {availableEvents.map((event) => (
                    <label key={event} className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={newWebhook.events.includes(event)}
                        onChange={() => handleEventToggle(event)}
                        className="rounded"
                      />
                      <span className="text-sm">{event}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Secret (Optional)</label>
                <Input
                  placeholder="Webhook secret for signature verification"
                  value={newWebhook.secret}
                  onChange={(e) => setNewWebhook(prev => ({ ...prev, secret: e.target.value }))}
                />
              </div>

              <div className="flex items-center space-x-2">
                <Button onClick={handleCreateWebhook}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Webhook
                </Button>
                <Button variant="outline" onClick={() => setShowCreateForm(false)}>
                  Cancel
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
