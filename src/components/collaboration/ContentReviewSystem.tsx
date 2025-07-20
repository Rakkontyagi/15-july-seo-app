/**
 * Content Review System
 * Implements Story 3.2 - Team collaboration with review workflow
 * Comment system, approval workflow, and version control
 */

'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  MessageSquare, 
  CheckCircle, 
  XCircle, 
  Clock, 
  User, 
  Calendar,
  Edit,
  History,
  Send,
  Reply,
  MoreHorizontal,
  Flag,
  Eye,
  GitBranch
} from 'lucide-react';

import { useAppStore } from '@/lib/store/app-store';

// Types
interface ContentReview {
  id: string;
  contentId: string;
  title: string;
  status: 'draft' | 'in-review' | 'approved' | 'rejected' | 'published';
  assignedTo: string[];
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  dueDate?: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  version: number;
  comments: Comment[];
  approvals: Approval[];
  changes: ContentChange[];
}

interface Comment {
  id: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  content: string;
  timestamp: string;
  type: 'comment' | 'suggestion' | 'approval' | 'rejection';
  position?: {
    line: number;
    column: number;
  };
  replies: Comment[];
  resolved: boolean;
  resolvedBy?: string;
  resolvedAt?: string;
}

interface Approval {
  id: string;
  userId: string;
  userName: string;
  status: 'pending' | 'approved' | 'rejected';
  timestamp: string;
  comment?: string;
  required: boolean;
}

interface ContentChange {
  id: string;
  userId: string;
  userName: string;
  timestamp: string;
  type: 'edit' | 'comment' | 'approval' | 'status_change';
  description: string;
  oldValue?: string;
  newValue?: string;
}

interface ContentReviewSystemProps {
  contentId: string;
  initialContent: string;
  onContentUpdate: (content: string) => void;
  onStatusChange: (status: string) => void;
}

export function ContentReviewSystem({
  contentId,
  initialContent,
  onContentUpdate,
  onStatusChange
}: ContentReviewSystemProps) {
  const { user } = useAppStore();
  const [review, setReview] = useState<ContentReview | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [newComment, setNewComment] = useState('');
  const [selectedLine, setSelectedLine] = useState<number | null>(null);
  const [commentType, setCommentType] = useState<'comment' | 'suggestion'>('comment');
  const [showHistory, setShowHistory] = useState(false);

  // Load review data
  useEffect(() => {
    loadReviewData();
  }, [contentId]);

  const loadReviewData = async () => {
    setIsLoading(true);
    
    try {
      // Simulate loading review data
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const mockReview: ContentReview = {
        id: `review-${contentId}`,
        contentId,
        title: 'Blog Post: Digital Marketing Strategies',
        status: 'in-review',
        assignedTo: ['user-1', 'user-2', 'user-3'],
        createdBy: user?.id || 'user-creator',
        createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        updatedAt: new Date().toISOString(),
        dueDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
        priority: 'medium',
        version: 3,
        comments: [
          {
            id: 'comment-1',
            userId: 'user-1',
            userName: 'Sarah Johnson',
            userAvatar: '/avatars/sarah.jpg',
            content: 'Great introduction! The hook is very engaging.',
            timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
            type: 'comment',
            position: { line: 5, column: 0 },
            replies: [],
            resolved: false,
          },
          {
            id: 'comment-2',
            userId: 'user-2',
            userName: 'Mike Chen',
            userAvatar: '/avatars/mike.jpg',
            content: 'Consider adding more specific examples in this section.',
            timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
            type: 'suggestion',
            position: { line: 15, column: 0 },
            replies: [
              {
                id: 'reply-1',
                userId: user?.id || 'user-creator',
                userName: user?.name || 'Content Creator',
                content: 'Good point! I\'ll add some case studies.',
                timestamp: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
                type: 'comment',
                replies: [],
                resolved: false,
              },
            ],
            resolved: false,
          },
        ],
        approvals: [
          {
            id: 'approval-1',
            userId: 'user-1',
            userName: 'Sarah Johnson',
            status: 'approved',
            timestamp: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
            comment: 'Content looks great overall!',
            required: true,
          },
          {
            id: 'approval-2',
            userId: 'user-2',
            userName: 'Mike Chen',
            status: 'pending',
            timestamp: new Date().toISOString(),
            required: true,
          },
          {
            id: 'approval-3',
            userId: 'user-3',
            userName: 'Lisa Wang',
            status: 'pending',
            timestamp: new Date().toISOString(),
            required: false,
          },
        ],
        changes: [
          {
            id: 'change-1',
            userId: user?.id || 'user-creator',
            userName: user?.name || 'Content Creator',
            timestamp: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
            type: 'edit',
            description: 'Updated introduction paragraph',
            oldValue: 'Old introduction text...',
            newValue: 'New introduction text...',
          },
          {
            id: 'change-2',
            userId: 'user-1',
            userName: 'Sarah Johnson',
            timestamp: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
            type: 'approval',
            description: 'Approved content for publication',
          },
        ],
      };

      setReview(mockReview);
    } catch (error) {
      console.error('Failed to load review data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddComment = async () => {
    if (!newComment.trim() || !review) return;

    const comment: Comment = {
      id: `comment-${Date.now()}`,
      userId: user?.id || 'current-user',
      userName: user?.name || 'Current User',
      userAvatar: user?.avatar,
      content: newComment,
      timestamp: new Date().toISOString(),
      type: commentType,
      position: selectedLine ? { line: selectedLine, column: 0 } : undefined,
      replies: [],
      resolved: false,
    };

    const updatedReview = {
      ...review,
      comments: [...review.comments, comment],
      updatedAt: new Date().toISOString(),
    };

    setReview(updatedReview);
    setNewComment('');
    setSelectedLine(null);

    // Add to changes log
    const change: ContentChange = {
      id: `change-${Date.now()}`,
      userId: user?.id || 'current-user',
      userName: user?.name || 'Current User',
      timestamp: new Date().toISOString(),
      type: 'comment',
      description: `Added ${commentType}: ${newComment.substring(0, 50)}...`,
    };

    updatedReview.changes.unshift(change);
    setReview(updatedReview);
  };

  const handleReplyToComment = async (commentId: string, replyContent: string) => {
    if (!review) return;

    const reply: Comment = {
      id: `reply-${Date.now()}`,
      userId: user?.id || 'current-user',
      userName: user?.name || 'Current User',
      userAvatar: user?.avatar,
      content: replyContent,
      timestamp: new Date().toISOString(),
      type: 'comment',
      replies: [],
      resolved: false,
    };

    const updatedComments = review.comments.map(comment => {
      if (comment.id === commentId) {
        return {
          ...comment,
          replies: [...comment.replies, reply],
        };
      }
      return comment;
    });

    setReview({
      ...review,
      comments: updatedComments,
      updatedAt: new Date().toISOString(),
    });
  };

  const handleResolveComment = async (commentId: string) => {
    if (!review) return;

    const updatedComments = review.comments.map(comment => {
      if (comment.id === commentId) {
        return {
          ...comment,
          resolved: true,
          resolvedBy: user?.id || 'current-user',
          resolvedAt: new Date().toISOString(),
        };
      }
      return comment;
    });

    setReview({
      ...review,
      comments: updatedComments,
      updatedAt: new Date().toISOString(),
    });
  };

  const handleApproval = async (status: 'approved' | 'rejected', comment?: string) => {
    if (!review) return;

    const userApproval = review.approvals.find(approval => approval.userId === user?.id);
    if (!userApproval) return;

    const updatedApprovals = review.approvals.map(approval => {
      if (approval.userId === user?.id) {
        return {
          ...approval,
          status,
          timestamp: new Date().toISOString(),
          comment,
        };
      }
      return approval;
    });

    // Check if all required approvals are complete
    const requiredApprovals = updatedApprovals.filter(approval => approval.required);
    const allApproved = requiredApprovals.every(approval => approval.status === 'approved');
    const anyRejected = requiredApprovals.some(approval => approval.status === 'rejected');

    let newStatus = review.status;
    if (anyRejected) {
      newStatus = 'rejected';
    } else if (allApproved) {
      newStatus = 'approved';
    }

    const updatedReview = {
      ...review,
      approvals: updatedApprovals,
      status: newStatus as ContentReview['status'],
      updatedAt: new Date().toISOString(),
    };

    setReview(updatedReview);
    onStatusChange(newStatus);

    // Add to changes log
    const change: ContentChange = {
      id: `change-${Date.now()}`,
      userId: user?.id || 'current-user',
      userName: user?.name || 'Current User',
      timestamp: new Date().toISOString(),
      type: 'approval',
      description: `${status === 'approved' ? 'Approved' : 'Rejected'} content${comment ? `: ${comment}` : ''}`,
    };

    updatedReview.changes.unshift(change);
    setReview(updatedReview);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft': return 'bg-gray-100 text-gray-800';
      case 'in-review': return 'bg-yellow-100 text-yellow-800';
      case 'approved': return 'bg-green-100 text-green-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      case 'published': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'low': return 'bg-blue-100 text-blue-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'high': return 'bg-orange-100 text-orange-800';
      case 'urgent': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="text-muted-foreground">Loading review data...</p>
        </div>
      </div>
    );
  }

  if (!review) {
    return (
      <div className="text-center py-12">
        <MessageSquare className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
        <h3 className="text-lg font-medium mb-2">No Review Data</h3>
        <p className="text-muted-foreground">Unable to load review information.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Review Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-3">
                {review.title}
                <Badge className={getStatusColor(review.status)}>
                  {review.status.replace('-', ' ')}
                </Badge>
                <Badge className={getPriorityColor(review.priority)}>
                  {review.priority}
                </Badge>
              </CardTitle>
              <CardDescription className="flex items-center gap-4 mt-2">
                <span className="flex items-center gap-1">
                  <User className="w-4 h-4" />
                  Created by {review.createdBy}
                </span>
                <span className="flex items-center gap-1">
                  <Calendar className="w-4 h-4" />
                  {new Date(review.createdAt).toLocaleDateString()}
                </span>
                <span className="flex items-center gap-1">
                  <GitBranch className="w-4 h-4" />
                  Version {review.version}
                </span>
                {review.dueDate && (
                  <span className="flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    Due {new Date(review.dueDate).toLocaleDateString()}
                  </span>
                )}
              </CardDescription>
            </div>
            
            <div className="flex items-center gap-2">
              <Button variant="outline" onClick={() => setShowHistory(!showHistory)}>
                <History className="w-4 h-4 mr-2" />
                History
              </Button>
              <Button variant="outline">
                <Eye className="w-4 h-4 mr-2" />
                Preview
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content Area */}
        <div className="lg:col-span-2 space-y-6">
          {/* Content Editor/Viewer */}
          <Card>
            <CardHeader>
              <CardTitle>Content</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="relative">
                <Textarea
                  value={initialContent}
                  onChange={(e) => onContentUpdate(e.target.value)}
                  className="min-h-96 font-mono text-sm"
                  placeholder="Content goes here..."
                />
                {/* Line numbers and comment indicators would go here */}
              </div>
            </CardContent>
          </Card>

          {/* Comments Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="w-5 h-5" />
                Comments ({review.comments.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Add Comment */}
              <div className="space-y-3 p-4 border rounded-lg bg-gray-50">
                <div className="flex items-center gap-2">
                  <Select value={commentType} onValueChange={(value: any) => setCommentType(value)}>
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="comment">Comment</SelectItem>
                      <SelectItem value="suggestion">Suggestion</SelectItem>
                    </SelectContent>
                  </Select>
                  {selectedLine && (
                    <Badge variant="outline">Line {selectedLine}</Badge>
                  )}
                </div>
                <Textarea
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Add a comment or suggestion..."
                  className="min-h-20"
                />
                <div className="flex justify-between">
                  <Button variant="outline" onClick={() => setSelectedLine(null)}>
                    Clear Line
                  </Button>
                  <Button onClick={handleAddComment} disabled={!newComment.trim()}>
                    <Send className="w-4 h-4 mr-2" />
                    Add Comment
                  </Button>
                </div>
              </div>

              {/* Comment List */}
              <div className="space-y-4">
                {review.comments.map(comment => (
                  <CommentItem
                    key={comment.id}
                    comment={comment}
                    onReply={handleReplyToComment}
                    onResolve={handleResolveComment}
                    currentUserId={user?.id || 'current-user'}
                  />
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Approval Status */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5" />
                Approvals
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {review.approvals.map(approval => (
                <div key={approval.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <Avatar className="w-8 h-8">
                      <AvatarFallback>{approval.userName.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="font-medium text-sm">{approval.userName}</div>
                      <div className="text-xs text-muted-foreground">
                        {approval.required ? 'Required' : 'Optional'}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <Badge className={
                      approval.status === 'approved' ? 'bg-green-100 text-green-800' :
                      approval.status === 'rejected' ? 'bg-red-100 text-red-800' :
                      'bg-yellow-100 text-yellow-800'
                    }>
                      {approval.status}
                    </Badge>
                    {approval.comment && (
                      <div className="text-xs text-muted-foreground mt-1">
                        {approval.comment}
                      </div>
                    )}
                  </div>
                </div>
              ))}

              {/* Approval Actions */}
              {review.approvals.some(approval => 
                approval.userId === user?.id && approval.status === 'pending'
              ) && (
                <div className="space-y-2 pt-4 border-t">
                  <div className="flex gap-2">
                    <Button 
                      size="sm" 
                      className="flex-1"
                      onClick={() => handleApproval('approved')}
                    >
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Approve
                    </Button>
                    <Button 
                      size="sm" 
                      variant="destructive" 
                      className="flex-1"
                      onClick={() => handleApproval('rejected')}
                    >
                      <XCircle className="w-4 h-4 mr-2" />
                      Reject
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Activity History */}
          {showHistory && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <History className="w-5 h-5" />
                  Activity History
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {review.changes.map(change => (
                    <div key={change.id} className="flex gap-3 text-sm">
                      <div className="w-2 h-2 rounded-full bg-primary mt-2 flex-shrink-0"></div>
                      <div className="flex-1">
                        <div className="font-medium">{change.userName}</div>
                        <div className="text-muted-foreground">{change.description}</div>
                        <div className="text-xs text-muted-foreground">
                          {new Date(change.timestamp).toLocaleString()}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

// Comment Item Component
interface CommentItemProps {
  comment: Comment;
  onReply: (commentId: string, content: string) => void;
  onResolve: (commentId: string) => void;
  currentUserId: string;
}

function CommentItem({ comment, onReply, onResolve, currentUserId }: CommentItemProps) {
  const [showReply, setShowReply] = useState(false);
  const [replyContent, setReplyContent] = useState('');

  const handleReply = () => {
    if (replyContent.trim()) {
      onReply(comment.id, replyContent);
      setReplyContent('');
      setShowReply(false);
    }
  };

  return (
    <div className={`p-4 border rounded-lg ${comment.resolved ? 'bg-gray-50 opacity-75' : ''}`}>
      <div className="flex items-start gap-3">
        <Avatar className="w-8 h-8">
          <AvatarImage src={comment.userAvatar} />
          <AvatarFallback>{comment.userName.charAt(0)}</AvatarFallback>
        </Avatar>
        
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <span className="font-medium text-sm">{comment.userName}</span>
            <Badge variant="outline" className="text-xs">
              {comment.type}
            </Badge>
            {comment.position && (
              <Badge variant="outline" className="text-xs">
                Line {comment.position.line}
              </Badge>
            )}
            <span className="text-xs text-muted-foreground">
              {new Date(comment.timestamp).toLocaleString()}
            </span>
            {comment.resolved && (
              <Badge className="bg-green-100 text-green-800 text-xs">
                Resolved
              </Badge>
            )}
          </div>
          
          <div className="text-sm mb-3">{comment.content}</div>
          
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={() => setShowReply(!showReply)}>
              <Reply className="w-3 h-3 mr-1" />
              Reply
            </Button>
            {!comment.resolved && (
              <Button variant="ghost" size="sm" onClick={() => onResolve(comment.id)}>
                <CheckCircle className="w-3 h-3 mr-1" />
                Resolve
              </Button>
            )}
          </div>

          {/* Replies */}
          {comment.replies.length > 0 && (
            <div className="mt-4 space-y-3 pl-4 border-l-2 border-gray-200">
              {comment.replies.map(reply => (
                <div key={reply.id} className="flex items-start gap-2">
                  <Avatar className="w-6 h-6">
                    <AvatarImage src={reply.userAvatar} />
                    <AvatarFallback className="text-xs">{reply.userName.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium text-xs">{reply.userName}</span>
                      <span className="text-xs text-muted-foreground">
                        {new Date(reply.timestamp).toLocaleString()}
                      </span>
                    </div>
                    <div className="text-xs">{reply.content}</div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Reply Form */}
          {showReply && (
            <div className="mt-3 space-y-2">
              <Textarea
                value={replyContent}
                onChange={(e) => setReplyContent(e.target.value)}
                placeholder="Write a reply..."
                className="min-h-16 text-sm"
              />
              <div className="flex justify-end gap-2">
                <Button variant="outline" size="sm" onClick={() => setShowReply(false)}>
                  Cancel
                </Button>
                <Button size="sm" onClick={handleReply} disabled={!replyContent.trim()}>
                  Reply
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
