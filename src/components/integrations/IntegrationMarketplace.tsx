'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { 
  Store, 
  Search,
  Star,
  Download,
  CheckCircle,
  Plus,
  Filter,
  Zap,
  Globe,
  Shield,
  Users,
  TrendingUp,
  Heart,
  ExternalLink
} from 'lucide-react';

interface MarketplaceIntegration {
  id: string;
  name: string;
  description: string;
  category: 'analytics' | 'cms' | 'social' | 'email' | 'crm' | 'storage' | 'productivity' | 'marketing';
  developer: string;
  rating: number;
  reviews: number;
  installs: number;
  price: 'free' | 'paid' | 'freemium';
  priceAmount?: number;
  icon: string;
  screenshots: string[];
  features: string[];
  isInstalled: boolean;
  isPopular: boolean;
  isNew: boolean;
  lastUpdated: string;
  version: string;
}

export function IntegrationMarketplace() {
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [priceFilter, setPriceFilter] = useState('all');
  const [sortBy, setSortBy] = useState('popular');

  const [integrations] = useState<MarketplaceIntegration[]>([
    {
      id: '1',
      name: 'Google Analytics 4',
      description: 'Advanced web analytics and reporting with real-time insights',
      category: 'analytics',
      developer: 'Google',
      rating: 4.8,
      reviews: 12450,
      installs: 89000,
      price: 'free',
      icon: '📊',
      screenshots: [],
      features: ['Real-time Analytics', 'Custom Reports', 'Audience Insights', 'Conversion Tracking'],
      isInstalled: true,
      isPopular: true,
      isNew: false,
      lastUpdated: '2025-01-15',
      version: '2.1.0'
    },
    {
      id: '2',
      name: 'Shopify Connect',
      description: 'Seamlessly integrate with Shopify stores for e-commerce SEO',
      category: 'cms',
      developer: 'Shopify Inc.',
      rating: 4.6,
      reviews: 8920,
      installs: 45000,
      price: 'freemium',
      priceAmount: 29,
      icon: '🛒',
      screenshots: [],
      features: ['Product SEO', 'Inventory Sync', 'Order Analytics', 'Customer Insights'],
      isInstalled: false,
      isPopular: true,
      isNew: false,
      lastUpdated: '2025-01-10',
      version: '1.8.2'
    },
    {
      id: '3',
      name: 'LinkedIn Marketing',
      description: 'Professional social media marketing and lead generation',
      category: 'social',
      developer: 'LinkedIn Corp.',
      rating: 4.4,
      reviews: 6780,
      installs: 32000,
      price: 'paid',
      priceAmount: 49,
      icon: '💼',
      screenshots: [],
      features: ['Lead Generation', 'Content Scheduling', 'Analytics Dashboard', 'Audience Targeting'],
      isInstalled: false,
      isPopular: false,
      isNew: true,
      lastUpdated: '2025-01-18',
      version: '1.2.0'
    },
    {
      id: '4',
      name: 'Mailchimp Pro',
      description: 'Advanced email marketing automation and customer journey mapping',
      category: 'email',
      developer: 'Mailchimp',
      rating: 4.7,
      reviews: 15600,
      installs: 67000,
      price: 'freemium',
      priceAmount: 19,
      icon: '📧',
      screenshots: [],
      features: ['Email Automation', 'A/B Testing', 'Customer Segmentation', 'ROI Tracking'],
      isInstalled: true,
      isPopular: true,
      isNew: false,
      lastUpdated: '2025-01-12',
      version: '3.4.1'
    },
    {
      id: '5',
      name: 'Salesforce CRM',
      description: 'Complete customer relationship management and sales automation',
      category: 'crm',
      developer: 'Salesforce',
      rating: 4.5,
      reviews: 9340,
      installs: 28000,
      price: 'paid',
      priceAmount: 99,
      icon: '🏢',
      screenshots: [],
      features: ['Lead Management', 'Sales Pipeline', 'Contact Tracking', 'Revenue Analytics'],
      isInstalled: false,
      isPopular: false,
      isNew: false,
      lastUpdated: '2025-01-08',
      version: '2.7.3'
    },
    {
      id: '6',
      name: 'Notion Workspace',
      description: 'All-in-one workspace for notes, docs, and project management',
      category: 'productivity',
      developer: 'Notion Labs',
      rating: 4.9,
      reviews: 23400,
      installs: 156000,
      price: 'freemium',
      priceAmount: 8,
      icon: '📝',
      screenshots: [],
      features: ['Document Management', 'Team Collaboration', 'Task Tracking', 'Knowledge Base'],
      isInstalled: false,
      isPopular: true,
      isNew: true,
      lastUpdated: '2025-01-20',
      version: '1.0.5'
    },
    {
      id: '7',
      name: 'HubSpot Marketing',
      description: 'Inbound marketing, sales, and customer service platform',
      category: 'marketing',
      developer: 'HubSpot',
      rating: 4.6,
      reviews: 11200,
      installs: 41000,
      price: 'freemium',
      priceAmount: 45,
      icon: '🎯',
      screenshots: [],
      features: ['Marketing Automation', 'Lead Scoring', 'Content Management', 'Analytics'],
      isInstalled: false,
      isPopular: true,
      isNew: false,
      lastUpdated: '2025-01-14',
      version: '2.3.8'
    },
    {
      id: '8',
      name: 'Dropbox Business',
      description: 'Secure cloud storage and file sharing for teams',
      category: 'storage',
      developer: 'Dropbox Inc.',
      rating: 4.3,
      reviews: 7890,
      installs: 52000,
      price: 'paid',
      priceAmount: 15,
      icon: '💾',
      screenshots: [],
      features: ['File Sync', 'Team Folders', 'Version History', 'Advanced Security'],
      isInstalled: false,
      isPopular: false,
      isNew: false,
      lastUpdated: '2025-01-11',
      version: '1.9.4'
    }
  ]);

  const categories = [
    { id: 'all', name: 'All Categories', count: integrations.length },
    { id: 'analytics', name: 'Analytics', count: integrations.filter(i => i.category === 'analytics').length },
    { id: 'cms', name: 'CMS', count: integrations.filter(i => i.category === 'cms').length },
    { id: 'social', name: 'Social Media', count: integrations.filter(i => i.category === 'social').length },
    { id: 'email', name: 'Email Marketing', count: integrations.filter(i => i.category === 'email').length },
    { id: 'crm', name: 'CRM', count: integrations.filter(i => i.category === 'crm').length },
    { id: 'storage', name: 'Storage', count: integrations.filter(i => i.category === 'storage').length },
    { id: 'productivity', name: 'Productivity', count: integrations.filter(i => i.category === 'productivity').length },
    { id: 'marketing', name: 'Marketing', count: integrations.filter(i => i.category === 'marketing').length }
  ];

  const filteredIntegrations = integrations
    .filter(integration => {
      const matchesSearch = integration.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           integration.description.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = categoryFilter === 'all' || integration.category === categoryFilter;
      const matchesPrice = priceFilter === 'all' || integration.price === priceFilter;
      
      return matchesSearch && matchesCategory && matchesPrice;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'popular': return b.installs - a.installs;
        case 'rating': return b.rating - a.rating;
        case 'newest': return new Date(b.lastUpdated).getTime() - new Date(a.lastUpdated).getTime();
        case 'name': return a.name.localeCompare(b.name);
        default: return 0;
      }
    });

  const getPriceDisplay = (integration: MarketplaceIntegration) => {
    switch (integration.price) {
      case 'free': return 'Free';
      case 'paid': return `$${integration.priceAmount}/mo`;
      case 'freemium': return `Free + $${integration.priceAmount}/mo`;
      default: return 'Free';
    }
  };

  const getPriceColor = (price: string) => {
    switch (price) {
      case 'free': return 'bg-green-100 text-green-800';
      case 'paid': return 'bg-blue-100 text-blue-800';
      case 'freemium': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`h-3 w-3 ${i < Math.floor(rating) ? 'text-yellow-400 fill-current' : 'text-gray-300'}`}
      />
    ));
  };

  const marketplaceStats = {
    totalIntegrations: integrations.length,
    installed: integrations.filter(i => i.isInstalled).length,
    popular: integrations.filter(i => i.isPopular).length,
    new: integrations.filter(i => i.isNew).length
  };

  return (
    <div className="space-y-6">
      {/* Marketplace Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Available</CardTitle>
            <Store className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{marketplaceStats.totalIntegrations}</div>
            <p className="text-xs text-muted-foreground">Total integrations</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Installed</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{marketplaceStats.installed}</div>
            <p className="text-xs text-muted-foreground">Currently active</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Popular</CardTitle>
            <TrendingUp className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{marketplaceStats.popular}</div>
            <p className="text-xs text-muted-foreground">Trending now</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">New</CardTitle>
            <Zap className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{marketplaceStats.new}</div>
            <p className="text-xs text-muted-foreground">Recently added</p>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Store className="h-5 w-5 mr-2" />
            Integration Marketplace
          </CardTitle>
          <div className="flex items-center space-x-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search integrations..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="px-3 py-2 border rounded-md bg-background"
            >
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name} ({category.count})
                </option>
              ))}
            </select>
            
            <select
              value={priceFilter}
              onChange={(e) => setPriceFilter(e.target.value)}
              className="px-3 py-2 border rounded-md bg-background"
            >
              <option value="all">All Prices</option>
              <option value="free">Free</option>
              <option value="freemium">Freemium</option>
              <option value="paid">Paid</option>
            </select>
            
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-3 py-2 border rounded-md bg-background"
            >
              <option value="popular">Most Popular</option>
              <option value="rating">Highest Rated</option>
              <option value="newest">Newest</option>
              <option value="name">Name A-Z</option>
            </select>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredIntegrations.map((integration) => (
              <div key={integration.id} className="p-4 border rounded-lg hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center space-x-3">
                    <div className="text-2xl">{integration.icon}</div>
                    <div>
                      <h4 className="font-medium">{integration.name}</h4>
                      <div className="text-xs text-muted-foreground">{integration.developer}</div>
                    </div>
                  </div>
                  <div className="flex flex-col items-end space-y-1">
                    {integration.isNew && (
                      <Badge className="bg-orange-100 text-orange-800 text-xs">
                        New
                      </Badge>
                    )}
                    {integration.isPopular && (
                      <Badge className="bg-purple-100 text-purple-800 text-xs">
                        Popular
                      </Badge>
                    )}
                  </div>
                </div>

                <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                  {integration.description}
                </p>

                <div className="flex items-center space-x-2 mb-3">
                  <div className="flex items-center space-x-1">
                    {renderStars(integration.rating)}
                  </div>
                  <span className="text-sm font-medium">{integration.rating}</span>
                  <span className="text-xs text-muted-foreground">
                    ({integration.reviews.toLocaleString()})
                  </span>
                </div>

                <div className="flex items-center justify-between mb-3 text-xs text-muted-foreground">
                  <div className="flex items-center space-x-1">
                    <Download className="h-3 w-3" />
                    <span>{integration.installs.toLocaleString()} installs</span>
                  </div>
                  <Badge className={getPriceColor(integration.price)} variant="outline">
                    {getPriceDisplay(integration)}
                  </Badge>
                </div>

                <div className="space-y-2 mb-3">
                  <div className="text-xs font-medium">Key Features:</div>
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
                  {integration.isInstalled ? (
                    <Button size="sm" variant="outline" className="flex-1" disabled>
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Installed
                    </Button>
                  ) : (
                    <Button size="sm" className="flex-1">
                      <Plus className="h-4 w-4 mr-2" />
                      Install
                    </Button>
                  )}
                  <Button size="sm" variant="outline">
                    <ExternalLink className="h-4 w-4" />
                  </Button>
                  <Button size="sm" variant="outline">
                    <Heart className="h-4 w-4" />
                  </Button>
                </div>

                <div className="mt-2 text-xs text-muted-foreground">
                  v{integration.version} • Updated {new Date(integration.lastUpdated).toLocaleDateString()}
                </div>
              </div>
            ))}
          </div>

          {filteredIntegrations.length === 0 && (
            <div className="text-center py-12">
              <Store className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">No integrations found</h3>
              <p className="text-muted-foreground">
                Try adjusting your search terms or filters
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
