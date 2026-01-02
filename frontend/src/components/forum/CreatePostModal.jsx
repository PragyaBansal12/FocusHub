import React, { useState } from 'react';
import { X, Plus } from 'lucide-react';
import { useForum } from '../../context/ForumContext';

export default function CreatePostModal({ onClose }) {
  const { createPost } = useForum();
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    tags: []
  });
  const [tagInput, setTagInput] = useState('');
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState('');

  // ============================================
  // HANDLERS
  // ============================================
  
  function addTag(e) {
    e.preventDefault();
    const tag = tagInput.trim().toLowerCase();
    
    if (tag && !formData.tags.includes(tag) && formData.tags.length < 5) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, tag]
      }));
      setTagInput('');
    }
  }

  function removeTag(tagToRemove) {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');

    if (!formData.title.trim()) {
      setError('Title is required');
      return;
    }

    if (!formData.content.trim()) {
      setError('Content is required');
      return;
    }

    setCreating(true);
    try {
      await createPost(formData);
      onClose();
    } catch (error) {
      console.error('Error creating post:', error);
      setError(error.message || 'Failed to create post');
    } finally {
      setCreating(false);
    }
  }

  // ============================================
  // RENDER
  // ============================================
  
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-[#121318] rounded-2xl p-6 max-w-3xl w-full shadow-xl max-h-[90vh] overflow-y-auto">
        
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-semibold">Create New Post</h3>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-[#0b0f15] transition"
            disabled={creating}
          >
            <X size={20} />
          </button>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-4 p-4 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 rounded-lg">
            {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Title */}
          <div>
            <label className="block text-sm font-medium mb-2">
              Title <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="What's on your mind?"
              className="w-full p-3 rounded-lg bg-gray-50 dark:bg-[#0b0f15] border border-gray-200 dark:border-gray-700 outline-none focus:border-accent"
              disabled={creating}
              maxLength={200}
            />
            <div className="text-xs text-gray-500 dark:text-gray-400 mt-1 text-right">
              {formData.title.length}/200
            </div>
          </div>

          {/* Content */}
          <div>
            <label className="block text-sm font-medium mb-2">
              Content <span className="text-red-500">*</span>
            </label>
            <textarea
              value={formData.content}
              onChange={(e) => setFormData({ ...formData, content: e.target.value })}
              placeholder="Share your thoughts, ask a question, or start a discussion..."
              className="w-full p-3 rounded-lg bg-gray-50 dark:bg-[#0b0f15] border border-gray-200 dark:border-gray-700 outline-none focus:border-accent resize-none"
              rows="8"
              disabled={creating}
              maxLength={5000}
            />
            <div className="text-xs text-gray-500 dark:text-gray-400 mt-1 text-right">
              {formData.content.length}/5000
            </div>
          </div>

          {/* Tags */}
          <div>
            <label className="block text-sm font-medium mb-2">
              Tags (optional, max 5)
            </label>
            <form onSubmit={addTag} className="flex gap-2 mb-2">
              <input
                type="text"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                placeholder="Add a tag (e.g., DSA, WebDev)"
                className="flex-1 p-3 rounded-lg bg-gray-50 dark:bg-[#0b0f15] border border-gray-200 dark:border-gray-700 outline-none focus:border-accent"
                disabled={creating || formData.tags.length >= 5}
              />
              <button
                type="submit"
                disabled={creating || formData.tags.length >= 5 || !tagInput.trim()}
                className="px-4 py-2 bg-gray-200 dark:bg-gray-700 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Plus size={18} />
              </button>
            </form>

            {/* Tag Display */}
            {formData.tags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {formData.tags.map((tag, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center gap-2 px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded-full text-sm"
                  >
                    #{tag}
                    <button
                      onClick={() => removeTag(tag)}
                      className="hover:text-blue-900 dark:hover:text-blue-200"
                      disabled={creating}
                      type="button"
                    >
                      <X size={14} />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4 border-t border-gray-200 dark:border-gray-800">
            <button
              type="submit"
              disabled={creating || !formData.title.trim() || !formData.content.trim()}
              className="flex-1 py-3 bg-accent text-white rounded-lg hover:opacity-90 font-medium transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {creating ? 'Creating...' : 'Create Post'}
            </button>
            <button
              type="button"
              onClick={onClose}
              disabled={creating}
              className="px-6 py-3 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-[#0b0f15] transition disabled:opacity-50"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}