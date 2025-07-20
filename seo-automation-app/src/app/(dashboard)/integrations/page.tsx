'use client';

import { useState } from 'react';
import { Breadcrumb } from '@/components/layout/breadcrumb';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { APIConnections } from '@/components/integrations/APIConnections';
import { WebhookManager } from '@/components/integrations/WebhookManager';
import { DataExports } from '@/components/integrations/DataExports';
import { IntegrationMarketplace } from '@/components/integrations/IntegrationMarketplace';
import { 
  Plug, 
  Zap,
  Download,
  Store,
  Activity,
  CheckCircle,
  AlertTriangle,
  Clock,
  Globe,
  Key,
  Shield,
  BarChart3,
  Settings,
  Plus
} from 'lucide-react';

interface Integration {
  id: string;
  name: string;
  description: string;
  category: 'analytics' | 'cms' | 'social' | 'email' | 'crm' | 'storage';
  status: 'connected' | 'disconnected' | 'error' | 'pending';
  lastSync: string;
  apiCalls: number;
  rateLimit: number;
  icon: string;
  features: string[];
}

export default function IntegrationsPage() {
  const [activeTab, setActiveTab] = useState('connections');
  const [integrations] = useState<Integration[]>([
    {
      id: '1',
      name: 'Google Analytics',
      description: 'Track website performance and user behavior',
      category: 'analytics',
      status: 'connected',
      lastSync: '2 minutes ago',
      apiCalls: 1247,
      rateLimit: 10000,
      icon: '📊',
      features: ['Traffic Analysis', 'Conversion Tracking', 'Audience Insights']
    },
    {
      id: '2',
      name: 'WordPress',
      description: 'Publish content directly to WordPress sites',
      category: 'cms',
      status: 'connected',
      lastSync: '5 minutes ago',
      apiCalls: 89,
      rateLimit: 1000,
      icon: '📝',
      features: ['Auto Publishing', 'SEO Optimization', 'Media Management']
    },
    {
      id: '3',
      name: 'Facebook Pages',
      description: 'Share content and analyze social engagement',
      category: 'social',
      status: 'error',
      lastSync: '2 hours ago',
      apiCalls: 234,
      rateLimit: 5000,
      icon: '📘',
      features: ['Post Scheduling', 'Engagement Analytics', 'Audience Targeting']
    },
    {
      id: '4',
      name: 'Mailchimp',
      description: 'Email marketing and automation',
      category: 'email',
      status: 'connected',
      lastSync: '10 minutes ago',
      apiCalls: 156,
      rateLimit: 2000,
      icon: '📧',
      features: ['Email Campaigns', 'List Management', 'Automation']
    },
    {
      id: '5',
      name: 'Salesforce',
      description: 'CRM integration for lead management',
      category: 'crm',
      status: 'pending',
      lastSync: 'Never',
      apiCalls: 0,
      rateLimit: 5000,
      icon: '🏢',
      features: ['Lead Tracking', 'Contact Management', 'Sales Pipeline']
    },
    {
      id: '6',
      name: 'Google Drive',
      description: 'Cloud storage for content and assets',
      category: 'storage',
      status: 'connected',
      lastSync: '1 minute ago',
      apiCalls: 67,
      rateLimit: 1000,
      icon: '💾',
      features: ['File Storage', 'Collaboration', 'Version Control']
    }
  ]);

  const integrationStats = {
    total: integrations.length,
    connected: integrations.filter(i => i.status === 'connected').length,
    errors: integrations.filter(i => i.status === 'error').length,
    pending: integrations.filter(i => i.status === 'pending').length,
    totalApiCalls: integrations.reduce((sum, i) => sum + i.apiCalls, 0)
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'connected': return 'bg-green-100 text-green-800';
      case 'disconnected': return 'bg-gray-100 text-gray-800';
      case 'error': return 'bg-red-100 text-red-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'connected': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'disconnected': return <Globe className="h-4 w-4 text-gray-500" />;
      case 'error': return <AlertTriangle className="h-4 w-4 text-red-500" />;
      case 'pending': return <Clock className="h-4 w-4 text-yellow-500" />;
      default: return <Globe className="h-4 w-4 text-gray-500" />;
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'analytics': return 'bg-blue-100 text-blue-800';
      case 'cms': return 'bg-purple-100 text-purple-800';
      case 'social': return 'bg-pink-100 text-pink-800';
      case 'email': return 'bg-green-100 text-green-800';
      case 'crm': return 'bg-orange-100 text-orange-800';
      case 'storage': return 'bg-indigo-100 text-indigo-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      <Breadcrumb items={[
        { label: 'Dashboard', href: '/dashboard' },
        { label: 'Integrations & API' }
      ]} />
      
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-responsive-3xl font-bold flex items-center">
            <Plug className="h-8 w-8 mr-3 text-blue-600" />
            Integrations & API
            <Badge className="ml-3 bg-gradient-to-r from-blue-500 to-purple-500 text-white">
              <Shield className="h-3 w-3 mr-1" />
              ENTERPRISE
            </Badge>
          </h1>
          <p className="text-muted-foreground text-responsive-base">
            Connect with external services and manage API integrations
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline">
            <Key className="h-4 w-4 mr-2" />
            API Keys
          </Button>
          <Button variant="outline">
            <Settings className="h-4 w-4 mr-2" />
            Settings
          </Button>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Add Integration
          </Button>
        </div>
      </div>

      {/* Integration Stats */}
      <div className="grid gap-4 md:grid-cols-5">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Integrations</CardTitle>
            <Plug className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{integrationStats.total}</div>
            <p className="text-xs text-muted-foreground">Active connections</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Connected</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{integrationStats.connected}</div>
            <p className="text-xs text-muted-foreground">Working properly</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Errors</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{integrationStats.errors}</div>
            <p className="text-xs text-muted-foreground">Need attention</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
            <Clock className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{integrationStats.pending}</div>
            <p className="text-xs text-muted-foreground">Setup required</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">API Calls</CardTitle>
            <Activity className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{integrationStats.totalApiCalls.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">This month</p>
          </CardContent>
        </Card>
      </div>

      {/* Integration Management Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="connections">
            <Plug className="h-4 w-4 mr-2" />
            Connections
          </TabsTrigger>
          <TabsTrigger value="webhooks">
            <Zap className="h-4 w-4 mr-2" />
            Webhooks
          </TabsTrigger>
          <TabsTrigger value="exports">
            <Download className="h-4 w-4 mr-2" />
            Data Exports
          </TabsTrigger>
          <TabsTrigger value="marketplace">
            <Store className="h-4 w-4 mr-2" />
            Marketplace
          </TabsTrigger>
        </TabsList>

        <TabsContent value="connections" className="space-y-6">
          {/* Current Integrations */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Active Integrations ({integrations.length})</span>
                <Button size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Integration
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {integrations.map((integration) => (
                  <div key={integration.id} className="p-4 border rounded-lg hover:shadow-md transition-shadow">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center space-x-3">
                        <div className="text-2xl">{integration.icon}</div>
                        <div>
                          <h4 className="font-medium">{integration.name}</h4>
                          <Badge className={getCategoryColor(integration.category)} variant="outline">
                            {integration.category}
                          </Badge>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        {getStatusIcon(integration.status)}
                        <Badge className={getStatusColor(integration.status)}>
                          {integration.status}
                        </Badge>
                      </div>
                    </div>

                    <p className="text-sm text-muted-foreground mb-3">{integration.description}</p>

                    <div className="space-y-2 mb-3">
                      <div className="flex justify-between text-xs">
                        <span>API Usage</span>
                        <span>{integration.apiCalls}/{integration.rateLimit}</span>
                      </div>
                      <Progress 
                        value={(integration.apiCalls / integration.rateLimit) * 100} 
                        className="h-1" 
                      />
                    </div>

                    <div className="text-xs text-muted-foreground mb-3">
                      Last sync: {integration.lastSync}
                    </div>

                    <div className="space-y-1 mb-3">
                      <div className="text-xs font-medium">Features:</div>
                      <div className="flex flex-wrap gap-1">
                        {integration.features.slice(0, 2).map((feature, index) => (
                          <Badge key={index} variant="secondary" className="text-xs">
                            {feature}
                          </Badge>
                        ))}
                        {integration.features.length > 2 && (
                          <Badge variant="secondary" className="text-xs">
                            +{integration.features.length - 2} more
                          </Badge>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Button size="sm" variant="outline" className="flex-1">
                        Configure
                      </Button>
                      <Button size="sm" variant="outline">
                        <BarChart3 className="h-3 w-3" />
                      </Button>
                      <Button size="sm" variant="outline">
                        <Settings className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <APIConnections integrations={integrations} />
        </TabsContent>

        <TabsContent value="webhooks" className="space-y-6">
          <WebhookManager />
        </TabsContent>

        <TabsContent value="exports" className="space-y-6">
          <DataExports />
        </TabsContent>

        <TabsContent value="marketplace" className="space-y-6">
          <IntegrationMarketplace />
        </TabsContent>
      </Tabs>

      {/* Quick Setup Guide */}
      <Card className="bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-medium text-blue-900 mb-1">
                🚀 Quick Integration Setup
              </h3>
              <p className="text-sm text-blue-700">
                Connect your favorite tools in minutes with our pre-built integrations
              </p>
            </div>
            <div className="flex items-center space-x-3">
              <Button variant="outline" className="border-blue-300">
                <Key className="h-4 w-4 mr-2" />
                Generate API Key
              </Button>
              <Button className="bg-blue-600 hover:bg-blue-700">
                <Zap className="h-4 w-4 mr-2" />
                Setup Webhook
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
