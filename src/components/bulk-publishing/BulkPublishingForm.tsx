'use client';

import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

const platformOptions = [
  { label: 'WordPress', value: 'wordpress' },
  { label: 'Shopify', value: 'shopify' },
  { label: 'HubSpot', value: 'hubspot' },
];

export default function BulkPublishingForm() {
  const [title, setTitle] = useState('');
  const [contentTitle, setContentTitle] = useState('');
  const [contentBody, setContentBody] = useState('');
  const [platforms, setPlatforms] = useState([
    { platform: '', endpoint: '', apiKey: '', username: '', password: '', storeId: '', hubId: '', priority: 5 }
  ]);
  const [schedule, setSchedule] = useState({ publishAt: '', recurring: false, frequency: 'daily', interval: 1 });
  const [isLoading, setIsLoading] = useState(false);
  const [bulkId, setBulkId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handlePlatformChange = (idx: number, field: string, value: string) => {
    setPlatforms(prev => prev.map((p, i) => i === idx ? { ...p, [field]: value } : p));
  };

  const addPlatform = () => {
    setPlatforms(prev => [...prev, { platform: '', endpoint: '', apiKey: '', username: '', password: '', storeId: '', hubId: '', priority: 5 }]);
  };

  const removePlatform = (idx: number) => {
    setPlatforms(prev => prev.filter((_, i) => i !== idx));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setBulkId(null);
    try {
      const payload = {
        title,
        content: {
          title: contentTitle,
          content: contentBody,
        },
        platforms: platforms.map(p => ({
          platform: p.platform,
          credentials: {
            endpoint: p.endpoint,
            apiKey: p.apiKey,
            username: p.username || undefined,
            password: p.password || undefined,
            storeId: p.storeId || undefined,
            hubId: p.hubId || undefined,
          },
          priority: p.priority,
        })),
        schedule: schedule.publishAt ? { publishAt: schedule.publishAt } : undefined,
      };
      const res = await fetch('/api/cms/bulk/publish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to submit bulk publish job');
      setBulkId(data.bulkId || data.resultBulkId || null);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="max-w-2xl mx-auto mt-8">
      <CardHeader>
        <CardTitle>Bulk Publishing Job</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <Label htmlFor="title">Job Title</Label>
            <Input id="title" value={title} onChange={e => setTitle(e.target.value)} required />
          </div>
          <div>
            <Label htmlFor="contentTitle">Content Title</Label>
            <Input id="contentTitle" value={contentTitle} onChange={e => setContentTitle(e.target.value)} required />
          </div>
          <div>
            <Label htmlFor="contentBody">Content Body</Label>
            <Textarea id="contentBody" value={contentBody} onChange={e => setContentBody(e.target.value)} rows={6} required />
          </div>
          <Separator />
          <div>
            <Label>Platforms</Label>
            <div className="space-y-4">
              {platforms.map((p, idx) => (
                <div key={idx} className="border p-3 rounded-md space-y-2 relative">
                  <div className="flex gap-2 items-center">
                    <select
                      value={p.platform}
                      onChange={e => handlePlatformChange(idx, 'platform', e.target.value)}
                      className="p-2 border rounded-md min-w-[120px]"
                      required
                    >
                      <option value="">Select Platform</option>
                      {platformOptions.map(opt => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                      ))}
                    </select>
                    <Input
                      placeholder="Endpoint URL"
                      value={p.endpoint}
                      onChange={e => handlePlatformChange(idx, 'endpoint', e.target.value)}
                      required
                    />
                    <Input
                      placeholder="API Key"
                      value={p.apiKey}
                      onChange={e => handlePlatformChange(idx, 'apiKey', e.target.value)}
                      required
                    />
                    <Input
                      placeholder="Username (optional)"
                      value={p.username}
                      onChange={e => handlePlatformChange(idx, 'username', e.target.value)}
                    />
                    <Input
                      placeholder="Password (optional)"
                      type="password"
                      value={p.password}
                      onChange={e => handlePlatformChange(idx, 'password', e.target.value)}
                    />
                    {p.platform === 'shopify' && (
                      <Input
                        placeholder="Store ID"
                        value={p.storeId}
                        onChange={e => handlePlatformChange(idx, 'storeId', e.target.value)}
                      />
                    )}
                    {p.platform === 'hubspot' && (
                      <Input
                        placeholder="Hub ID"
                        value={p.hubId}
                        onChange={e => handlePlatformChange(idx, 'hubId', e.target.value)}
                      />
                    )}
                    <Input
                      type="number"
                      min={1}
                      max={10}
                      value={p.priority}
                      onChange={e => handlePlatformChange(idx, 'priority', e.target.value)}
                      className="w-20"
                      placeholder="Priority"
                    />
                    {platforms.length > 1 && (
                      <Button type="button" variant="destructive" size="sm" onClick={() => removePlatform(idx)}>
                        Remove
                      </Button>
                    )}
                  </div>
                </div>
              ))}
              <Button type="button" variant="outline" onClick={addPlatform}>
                Add Platform
              </Button>
            </div>
          </div>
          <Separator />
          <div>
            <Label>Scheduling (optional)</Label>
            <div className="flex gap-4 items-center">
              <Input
                type="datetime-local"
                value={schedule.publishAt}
                onChange={e => setSchedule(s => ({ ...s, publishAt: e.target.value }))}
              />
              {/* Recurring scheduling can be added here */}
            </div>
          </div>
          {error && <Badge variant="destructive">{error}</Badge>}
          {bulkId && (
            <div className="space-y-2">
              <Badge variant="success">Bulk Job Submitted! ID: {bulkId}</Badge>
              <a
                href={`/dashboard/bulk-publishing/status/${bulkId}`}
                className="text-blue-600 underline"
                target="_blank"
                rel="noopener noreferrer"
              >
                View Status
              </a>
            </div>
          )}
          <Button type="submit" disabled={isLoading} className="w-full">
            {isLoading ? 'Submitting...' : 'Submit Bulk Publishing Job'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
} 