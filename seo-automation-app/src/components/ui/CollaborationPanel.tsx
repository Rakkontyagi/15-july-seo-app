
import React, { useState } from 'react';

interface Comment {
  id: string;
  author: string;
  timestamp: string;
  text: string;
}

interface CollaborationPanelProps {
  comments: Comment[];
  onAddComment: (text: string) => void;
  className?: string;
}

const CollaborationPanel: React.FC<CollaborationPanelProps> = ({
  comments,
  onAddComment,
  className,
}) => {
  const [newComment, setNewComment] = useState('');

  const handleAddComment = () => {
    if (newComment.trim()) {
      onAddComment(newComment);
      setNewComment('');
    }
  };

  return (
    <div className={`p-4 border border-gray-200 rounded-md shadow-sm ${className}`}>
      <h3 className="text-lg font-semibold mb-3">Collaboration</h3>
      <div className="space-y-4">
        {/* Comments Section */}
        <div>
          <h4 className="text-md font-medium text-gray-700 mb-2">Comments</h4>
          {
            comments.length === 0 ? (
              <p className="text-gray-500 text-sm">No comments yet.</p>
            ) : (
              <ul className="space-y-2 max-h-48 overflow-y-auto pr-2">
                {comments.map((comment) => (
                  <li key={comment.id} className="bg-gray-50 p-2 rounded-md">
                    <p className="text-xs font-semibold text-gray-800">{comment.author} <span className="font-normal text-gray-500">at {new Date(comment.timestamp).toLocaleString()}</span></p>
                    <p className="text-sm text-gray-700">{comment.text}</p>
                  </li>
                ))}
              </ul>
            )
          }
        </div>

        {/* Add Comment Section */}
        <div className="mt-4">
          <textarea
            className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            rows={3}
            placeholder="Add a comment..."
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
          ></textarea>
          <button
            onClick={handleAddComment}
            className="mt-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 text-sm"
          >
            Add Comment
          </button>
        </div>

        {/* Change Tracking (Placeholder) */}
        <div className="mt-4">
          <h4 className="text-md font-medium text-gray-700 mb-2">Change Tracking</h4>
          <p className="text-gray-500 text-sm">Change tracking features would be integrated here (e.g., diff views, activity logs).</p>
        </div>
      </div>
    </div>
  );
};

export default CollaborationPanel;
