import React, { useState } from 'react';
import { ThumbsUp, ThumbsDown, MessageCircle, Eye, Trash2, Edit, Calendar } from 'lucide-react';
import { useForum } from '../../context/ForumContext';
import { useNavigate } from 'react-router-dom';

export default function PostCard({ post }) {
  const { upvotePost, downvotePost, deletePost } = useForum();
  const navigate = useNavigate();
  const [deleting, setDeleting] = useState(false);

  // Get current user
  const token = localStorage.getItem('token');
  const userId = token ? JSON.parse(atob(token.split('.')[1])).id : null;
  
  const isAuthor = post.user._id === userId;

  // Check if user has voted
  const userHasUpvoted = post.upvotes?.includes(userId);
  const userHasDownvoted = post.downvotes?.includes(userId);

  // ============================================
  // HANDLERS
  // ============================================
  
  async function handleUpvote(e) {
    e.stopPropagation();
    try {
      await upvotePost(post._id);
    } catch (error) {
      console.error('Error upvoting:', error);
    }
  }

  async function handleDownvote(e) {
    e.stopPropagation();
    try {
      await downvotePost(post._id);
    } catch (error) {
      console.error('Error downvoting:', error);
    }
  }

  async function handleDelete(e) {
    e.stopPropagation();
    if (!confirm('Delete this post? This cannot be undone.')) return;
    
    setDeleting(true);
    try {
      await deletePost(post._id);
    } catch (error) {
      console.error('Error deleting:', error);
      alert('Failed to delete post');
      setDeleting(false);
    }
  }

  function handleClick() {
    navigate(`/forum/post/${post._id}`);
  }

  // ============================================
  // RENDER
  // ============================================
  
  return (
    <div 
      onClick={handleClick}
      className="bg-white dark:bg-[#121318] rounded-xl p-6 shadow-md border border-gray-200 dark:border-gray-800 hover:shadow-lg transition-all cursor-pointer"
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <h3 className="text-lg font-semibold mb-2 hover:text-accent transition">
            {post.title}
          </h3>
          
          <div className="flex items-center gap-3 text-sm text-gray-500 dark:text-gray-400">
            <div className="flex items-center gap-1">
              <span className="font-medium text-gray-700 dark:text-gray-300">
                {post.user.name}
              </span>
            </div>
            <span>•</span>
            <div className="flex items-center gap-1">
              <Calendar size={14} />
              {new Date(post.createdAt).toLocaleDateString('en-US', { 
                month: 'short', 
                day: 'numeric' 
              })}
            </div>
            {post.isEdited && (
              <>
                <span>•</span>
                <span className="text-xs">(edited)</span>
              </>
            )}
          </div>
        </div>

        {/* Delete Button (only for author) */}
        {isAuthor && (
          <button
            onClick={handleDelete}
            disabled={deleting}
            className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition"
            title="Delete post"
          >
            {deleting ? (
              <div className="w-5 h-5 border-2 border-red-500 border-t-transparent rounded-full animate-spin" />
            ) : (
              <Trash2 size={18} />
            )}
          </button>
        )}
      </div>

      {/* Content Preview */}
      <p className="text-gray-700 dark:text-gray-300 mb-4 line-clamp-3">
        {post.content}
      </p>

      {/* Tags */}
      {post.tags && post.tags.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-4">
          {post.tags.map((tag, index) => (
            <span
              key={index}
              className="px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded-full text-xs font-medium"
            >
              #{tag}
            </span>
          ))}
        </div>
      )}

      {/* Footer Stats */}
      <div className="flex items-center gap-4 pt-4 border-t border-gray-200 dark:border-gray-800">
        {/* Upvote */}
        <button
          onClick={handleUpvote}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-lg transition ${
            userHasUpvoted
              ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
              : 'hover:bg-gray-100 dark:hover:bg-gray-800'
          }`}
        >
          <ThumbsUp size={16} />
          <span className="text-sm font-medium">{post.upvoteCount || post.upvotes?.length || 0}</span>
        </button>

        {/* Downvote */}
        <button
          onClick={handleDownvote}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-lg transition ${
            userHasDownvoted
              ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
              : 'hover:bg-gray-100 dark:hover:bg-gray-800'
          }`}
        >
          <ThumbsDown size={16} />
          <span className="text-sm font-medium">{post.downvoteCount || post.downvotes?.length || 0}</span>
        </button>

        {/* Comments */}
        <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
          <MessageCircle size={16} />
          <span className="text-sm">{post.commentCount || 0}</span>
        </div>

        {/* Views */}
        <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
          <Eye size={16} />
          <span className="text-sm">{post.views || 0}</span>
        </div>

        {/* Vote Score */}
        <div className="ml-auto">
          <span className={`text-sm font-semibold ${
            (post.voteScore || 0) > 0 
              ? 'text-green-600 dark:text-green-400' 
              : (post.voteScore || 0) < 0 
              ? 'text-red-600 dark:text-red-400' 
              : 'text-gray-600 dark:text-gray-400'
          }`}>
            {(post.voteScore || 0) > 0 ? '+' : ''}{post.voteScore || 0}
          </span>
        </div>
      </div>
    </div>
  );
}