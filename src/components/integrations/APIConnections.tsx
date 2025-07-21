'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { 
  Key, 
  Copy,
  Eye,
  EyeOff,
  Plus,
  Trash2,
  Edit,
  CheckCircle,
  AlertTriangle,
  Activity,
  Clock,
  Shield,
  Globe,
  Code,
  Settings
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

interface APIKey {
  id: string;
  name: string;
  key: string;
  permissions: string[];
  lastUsed: string;
  createdAt: string;
  status: 'active' | 'revoked' | 'expired';
  usage: number;
  rateLimit: number;
}

interface APIConnectionsProps {
  integrations: Integration[];
}

export function APIConnections({ integrations }: APIConnectionsProps) {
  const [showKeys, setShowKeys] = useState<{ [key: string]: boolean }>({});
  const [apiKeys] = useState<APIKey[]>([
    {
      id: '1',
      name: 'Production API Key',
      key: 'sk_live_51H7...',
      permissions: ['read', 'write', 'admin'],
      lastUsed: '2 minutes ago',
      createdAt: '2025-01-01',
      status: 'active',
      usage: 1247,
      rateLimit: 10000
    },
    {
      id: '2',
      name: 'Development API Key',
      key: 'sk_test_51H7...',
      permissions: ['read', 'write'],
      lastUsed: '1 hour ago',
      createdAt: '2025-01-15',
      status: 'active',
      usage: 89,
      rateLimit: 1000
    },
    {
      id: '3',
      name: 'Analytics Read-Only',
      key: 'sk_ro_51H7...',
      permissions: ['read'],
      lastUsed: '5 minutes ago',
      createdAt: '2025-01-10',
      status: 'active',
      usage: 234,
      rateLimit: 5000
    }
  ]);

  const connectionHealth = {
    healthy: integrations.filter(i => i.status === 'connected').length,
    issues: integrations.filter(i => i.status === 'error').length,
    pending: integrations.filter(i => i.status === 'pending').length,
    totalRequests: integrations.reduce((sum, i) => sum + i.apiCalls, 0)
  };

  const toggleKeyVisibility = (keyId: string) => {
    setShowKeys(prev => ({
      ...prev,
      [keyId]: !prev[keyId]
    }));
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      // In a real app, show a toast notification
      console.log('Copied to clipboard');
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'revoked': return 'bg-red-100 text-red-800';
      case 'expired': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPermissionColor = (permission: string) => {
    switch (permission) {
      case 'admin': return 'bg-red-100 text-red-800';
      case 'write': return 'bg-blue-100 text-blue-800';
      case 'read': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const maskApiKey = (key: string) => {
    return key.substring(0, 8) + '...' + key.substring(key.length - 4);
  };

  return (
    <div className="space-y-6">
      {/* Connection Health Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Activity className="h-5 w-5 mr-2" />
            Connection Health
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{connectionHealth.healthy}</div>
              <div className="text-sm text-muted-foreground">Healthy Connections</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">{connectionHealth.issues}</div>
              <div className="text-sm text-muted-foreground">Connection Issues</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-600">{connectionHealth.pending}</div>
              <div className="text-sm text-muted-foreground">Pending Setup</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{connectionHealth.totalRequests.toLocaleString()}</div>
              <div className="text-sm text-muted-foreground">Total Requests</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* API Keys Management */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center">
              <Key className="h-5 w-5 mr-2" />
              API Keys ({apiKeys.length})
            </span>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Generate New Key
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {apiKeys.map((apiKey) => (
              <div key={apiKey.id} className="p-4 border rounded-lg">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-3">
                    <Key className="h-5 w-5 text-blue-600" />
                    <div>
                      <h4 className="font-medium">{apiKey.name}</h4>
                      <div className="flex items-center space-x-2 mt-1">
                        <Badge className={getStatusColor(apiKey.status)}>
                          {apiKey.status}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          Created: {new Date(apiKey.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button variant="ghost" size="sm">
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <div className="space-y-3">
                  {/* API Key Display */}
                  <div className="flex items-center space-x-2">
                    <div className="flex-1 font-mono text-sm bg-muted p-2 rounded">
                      {showKeys[apiKey.id] ? apiKey.key : maskApiKey(apiKey.key)}
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => toggleKeyVisibility(apiKey.id)}
                    >
                      {showKeys[apiKey.id] ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => copyToClipboard(apiKey.key)}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>

                  {/* Permissions */}
                  <div>
                    <div className="text-sm font-medium mb-2">Permissions:</div>
                    <div className="flex space-x-2">
                      {apiKey.permissions.map((permission, index) => (
                        <Badge key={index} className={getPermissionColor(permission)}>
                          {permission}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  {/* Usage Stats */}
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div>
                      <div className="text-muted-foreground">Usage</div>
                      <div className="font-medium">{apiKey.usage.toLocaleString()}/{apiKey.rateLimit.toLocaleString()}</div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">Last Used</div>
                      <div className="font-medium">{apiKey.lastUsed}</div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">Rate Limit</div>
                      <div className="font-medium">{Math.round((apiKey.usage / apiKey.rateLimit) * 100)}% used</div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Connection Testing */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Globe className="h-5 w-5 mr-2" />
            Connection Testing
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="block text-sm font-medium mb-2">Test Endpoint</label>
                <Input placeholder="https://api.example.com/test" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">API Key</label>
                <select className="w-full px-3 py-2 border rounded-md bg-background">
                  <option value="">Select API Key</option>
                  {apiKeys.map((key) => (
                    <option key={key.id} value={key.id}>{key.name}</option>
                  ))}
                </select>
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2">Request Headers (JSON)</label>
              <Textarea 
                placeholder='{"Content-Type": "application/json", "Authorization": "Bearer YOUR_TOKEN"}'
                className="font-mono text-sm"
              />
            </div>
            
            <div className="flex items-center space-x-2">
              <Button>
                <Activity className="h-4 w-4 mr-2" />
                Test Connection
              </Button>
              <Button variant="outline">
                <Code className="h-4 w-4 mr-2" />
                View Logs
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Security Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Shield className="h-5 w-5 mr-2" />
            Security Settings
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div>
                <div className="font-medium">IP Whitelist</div>
                <div className="text-sm text-muted-foreground">
                  Restrict API access to specific IP addresses
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Badge className="bg-green-100 text-green-800">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Enabled
                </Badge>
                <Button variant="outline" size="sm">
                  <Settings className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div>
                <div className="font-medium">Rate Limiting</div>
                <div className="text-sm text-muted-foreground">
                  Automatic rate limiting and throttling
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Badge className="bg-green-100 text-green-800">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Active
                </Badge>
                <Button variant="outline" size="sm">
                  <Settings className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div>
                <div className="font-medium">Request Logging</div>
                <div className="text-sm text-muted-foreground">
                  Log all API requests for monitoring
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Badge className="bg-green-100 text-green-800">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Enabled
                </Badge>
                <Button variant="outline" size="sm">
                  <Settings className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div>
                <div className="font-medium">SSL/TLS Encryption</div>
                <div className="text-sm text-muted-foreground">
                  All API communications encrypted
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Badge className="bg-green-100 text-green-800">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Enforced
                </Badge>
                <Button variant="outline" size="sm">
                  <Settings className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
