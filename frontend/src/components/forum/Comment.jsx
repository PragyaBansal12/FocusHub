import React, { useState } from 'react';
import { ThumbsUp, ThumbsDown, Reply, Trash2, Calendar } from 'lucide-react';
import { useForum } from '../../context/ForumContext';

export default function Comment({ comment, postId, level = 0 }) {
  const { upvoteComment, deleteComment, addComment } = useForum();
  const [showReplyBox, setShowReplyBox] = useState(false);
  const [replyContent, setReplyContent] = useState('');
  const [replying, setReplying] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Get current user
  const token = localStorage.getItem('token');
  const userId = token ? JSON.parse(atob(token.split('.')[1])).id : null;
  
  const isAuthor = comment.user._id === userId;
  const userHasUpvoted = comment.upvotes?.includes(userId);

  // ============================================
  // HANDLERS
  // ============================================
  
  async function handleUpvote() {
    try {
      await upvoteComment(comment._id);
    } catch (error) {
      console.error('Error upvoting comment:', error);
    }
  }

  async function handleReply() {
    if (!replyContent.trim()) return;
    
    setReplying(true);
    try {
      await addComment(postId, replyContent, comment._id);
      setReplyContent('');
      setShowReplyBox(false);
    } catch (error) {
      console.error('Error replying:', error);
      alert('Failed to post reply');
    } finally {
      setReplying(false);
    }
  }

  async function handleDelete() {
    if (!confirm('Delete this comment?')) return;
    
    setDeleting(true);
    try {
      await deleteComment(comment._id);
    } catch (error) {
      console.error('Error deleting comment:', error);
      alert('Failed to delete comment');
      setDeleting(false);
    }
  }

  // Max nesting level
  const maxLevel = 3;
  const canReply = level < maxLevel;

  // ============================================
  // RENDER
  // ============================================
  
  return (
    <div className={`${level > 0 ? 'ml-8 border-l-2 border-gray-200 dark:border-gray-800 pl-4' : ''}`}>
      <div className="bg-white dark:bg-[#121318] rounded-lg p-4 mb-3 border border-gray-200 dark:border-gray-800">
        {/* Header */}
        <div className="flex items-start justify-between mb-2">
          <div className="flex items-center gap-3 text-sm">
            <span className="font-medium text-gray-900 dark:text-gray-100">
              {comment.user.name}
            </span>
            <span className="text-gray-500 dark:text-gray-400">•</span>
            <div className="flex items-center gap-1 text-gray-500 dark:text-gray-400">
              <Calendar size={12} />
              {new Date(comment.createdAt).toLocaleString('en-US', { 
                month: 'short', 
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })}
            </div>
            {comment.isEdited && (
              <>
                <span className="text-gray-500 dark:text-gray-400">•</span>
                <span className="text-xs text-gray-500 dark:text-gray-400">(edited)</span>
              </>
            )}
          </div>

          {isAuthor && (
            <button
              onClick={handleDelete}
              disabled={deleting}
              className="p-1 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition"
              title="Delete comment"
            >
              {deleting ? (
                <div className="w-4 h-4 border-2 border-red-500 border-t-transparent rounded-full animate-spin" />
              ) : (
                <Trash2 size={16} />
              )}
            </button>
          )}
        </div>

        {/* Content */}
        <p className="text-gray-700 dark:text-gray-300 mb-3">
          {comment.content}
        </p>

        {/* Actions */}
        <div className="flex items-center gap-4">
          {/* Upvote */}
          <button
            onClick={handleUpvote}
            className={`flex items-center gap-1.5 px-2 py-1 rounded transition text-sm ${
              userHasUpvoted
                ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                : 'hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-400'
            }`}
          >
            <ThumbsUp size={14} />
            <span>{comment.upvoteCount || comment.upvotes?.length || 0}</span>
          </button>

          {/* Reply Button */}
          {canReply && (
            <button
              onClick={() => setShowReplyBox(!showReplyBox)}
              className="flex items-center gap-1.5 px-2 py-1 rounded hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-400 transition text-sm"
            >
              <Reply size={14} />
              <span>Reply</span>
            </button>
          )}

          {/* Vote Score */}
          <span className={`text-sm font-medium ml-auto ${
            (comment.voteScore || 0) > 0 
              ? 'text-green-600 dark:text-green-400' 
              : 'text-gray-600 dark:text-gray-400'
          }`}>
            {(comment.voteScore || 0) > 0 ? '+' : ''}{comment.voteScore || 0}
          </span>
        </div>

        {/* Reply Box */}
        {showReplyBox && (
          <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-800">
            <textarea
              value={replyContent}
              onChange={(e) => setReplyContent(e.target.value)}
              placeholder="Write a reply..."
              className="w-full p-3 rounded-lg bg-gray-50 dark:bg-[#0b0f15] border border-gray-200 dark:border-gray-700 outline-none focus:border-accent resize-none"
              rows="3"
              disabled={replying}
            />
            <div className="flex gap-2 mt-2">
              <button
                onClick={handleReply}
                disabled={replying || !replyContent.trim()}
                className="px-4 py-2 bg-accent text-white rounded-lg hover:opacity-90 transition disabled:opacity-50 disabled:cursor-not-allowed text-sm"
              >
                {replying ? 'Posting...' : 'Post Reply'}
              </button>
              <button
                onClick={() => {
                  setShowReplyBox(false);
                  setReplyContent('');
                }}
                className="px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-[#0b0f15] transition text-sm"
                disabled={replying}
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}