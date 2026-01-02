import React, { useState, useRef } from 'react';
import { Upload, X, File, CheckCircle } from 'lucide-react';
import { validateFile, formatFileSize, getFileIcon } from '../utils/fileHelpers';
import { useMaterials } from '../context/MaterialsContext';

export default function FileUpload({ onClose }) {
  const { uploadMaterial, uploading } = useMaterials();
  
  // ============================================
  // STATE
  // ============================================
  
  const [selectedFile, setSelectedFile] = useState(null);
  const [dragActive, setDragActive] = useState(false);
  const [metadata, setMetadata] = useState({
    title: '',
    description: '',
    subject: '',
    tags: []
  });
  const [tagInput, setTagInput] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  
  const fileInputRef = useRef(null);

  // ============================================
  // FILE SELECTION HANDLERS
  // ============================================
  
  /**
   * Handle file selection from input
   */
  function handleFileSelect(e) {
    const file = e.target.files[0];
    if (file) {
      processFile(file);
    }
  }

  /**
   * Handle drag events
   */
  function handleDrag(e) {
    e.preventDefault();
    e.stopPropagation();
    
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }

  /**
   * Handle file drop
   */
  function handleDrop(e) {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    const file = e.dataTransfer.files[0];
    if (file) {
      processFile(file);
    }
  }

  /**
   * Process and validate selected file
   */
  function processFile(file) {
    setError('');
    
    // Validate file
    const validation = validateFile(file);
    if (!validation.valid) {
      setError(validation.error);
      return;
    }
    
    // Set file
    setSelectedFile(file);
    
    // Auto-fill title with filename (without extension)
    const titleFromFile = file.name.split('.').slice(0, -1).join('.');
    setMetadata(prev => ({
      ...prev,
      title: prev.title || titleFromFile
    }));
  }

  /**
   * Remove selected file
   */
  function removeFile() {
    setSelectedFile(null);
    setError('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }

  // ============================================
  // TAG MANAGEMENT
  // ============================================
  
  /**
   * Add tag
   */
  function addTag(e) {
    e.preventDefault();
    const tag = tagInput.trim().toLowerCase();
    
    if (tag && !metadata.tags.includes(tag)) {
      setMetadata(prev => ({
        ...prev,
        tags: [...prev.tags, tag]
      }));
      setTagInput('');
    }
  }

  /**
   * Remove tag
   */
  function removeTag(tagToRemove) {
    setMetadata(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  }

  // ============================================
  // UPLOAD HANDLER
  // ============================================
  
  /**
   * Upload file with metadata
   */
  async function handleUpload() {
    if (!selectedFile) {
      setError('Please select a file');
      return;
    }
    
    if (!metadata.title.trim()) {
      setError('Please enter a title');
      return;
    }
    
    setError('');
    
    const result = await uploadMaterial(selectedFile, metadata);
    
    if (result.success) {
      setSuccess(true);
      // Close after 1 second
      setTimeout(() => {
        onClose();
      }, 1000);
    } else {
      setError(result.error || 'Upload failed');
    }
  }

  // ============================================
  // RENDER
  // ============================================
  
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-[#121318] rounded-2xl p-6 max-w-2xl w-full shadow-xl max-h-[90vh] overflow-y-auto">
        
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-semibold">Upload Study Material</h3>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-[#0b0f15] transition"
            disabled={uploading}
          >
            <X size={20} />
          </button>
        </div>

        {/* Success Message */}
        {success && (
          <div className="mb-4 p-4 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-lg flex items-center gap-3">
            <CheckCircle size={20} />
            <span>File uploaded successfully!</span>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="mb-4 p-4 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 rounded-lg">
            {error}
          </div>
        )}

        {/* File Drop Zone */}
        {!selectedFile ? (
          <div
            onDragEnter={handleDrag}
            onDragOver={handleDrag}
            onDragLeave={handleDrag}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-xl p-12 text-center cursor-pointer transition ${
              dragActive
                ? 'border-accent bg-accent/10'
                : 'border-gray-300 dark:border-gray-700 hover:border-accent'
            }`}
          >
            <Upload size={48} className="mx-auto mb-4 text-gray-400" />
            <p className="text-lg font-medium mb-2">
              Drag & drop your file here
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
              or click to browse
            </p>
            <p className="text-xs text-gray-400">
              Supported: PDF, Images, Videos, Documents (Max 50MB)
            </p>
            
            <input
              ref={fileInputRef}
              type="file"
              onChange={handleFileSelect}
              className="hidden"
              accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.gif,.webp,.mp4,.webm,.txt"
            />
          </div>
        ) : (
          <>
            {/* Selected File Display */}
            <div className="mb-6 p-4 bg-gray-50 dark:bg-[#0b0f15] rounded-lg">
              <div className="flex items-center gap-4">
                <div className="text-4xl">
                  {getFileIcon(selectedFile.type.startsWith('image/') ? 'image' : 
                               selectedFile.type === 'application/pdf' ? 'pdf' : 
                               selectedFile.type.startsWith('video/') ? 'video' : 'document')}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{selectedFile.name}</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {formatFileSize(selectedFile.size)}
                  </p>
                </div>
                <button
                  onClick={removeFile}
                  className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition"
                  disabled={uploading}
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* Metadata Form */}
            <div className="space-y-4 mb-6">
              {/* Title */}
              <div>
                <label className="block text-sm font-medium mb-2">
                  Title <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={metadata.title}
                  onChange={(e) => setMetadata({ ...metadata, title: e.target.value })}
                  placeholder="e.g., DSA Lecture Notes"
                  className="w-full p-3 rounded-lg bg-gray-50 dark:bg-[#0b0f15] border border-gray-200 dark:border-gray-700 outline-none focus:border-accent"
                  disabled={uploading}
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium mb-2">Description</label>
                <textarea
                  value={metadata.description}
                  onChange={(e) => setMetadata({ ...metadata, description: e.target.value })}
                  placeholder="Add a description..."
                  rows="3"
                  className="w-full p-3 rounded-lg bg-gray-50 dark:bg-[#0b0f15] border border-gray-200 dark:border-gray-700 outline-none focus:border-accent resize-none"
                  disabled={uploading}
                />
              </div>

              {/* Subject */}
              <div>
                <label className="block text-sm font-medium mb-2">Subject</label>
                <input
                  type="text"
                  value={metadata.subject}
                  onChange={(e) => setMetadata({ ...metadata, subject: e.target.value })}
                  placeholder="e.g., Computer Science"
                  className="w-full p-3 rounded-lg bg-gray-50 dark:bg-[#0b0f15] border border-gray-200 dark:border-gray-700 outline-none focus:border-accent"
                  disabled={uploading}
                />
              </div>

              {/* Tags */}
              <div>
                <label className="block text-sm font-medium mb-2">Tags</label>
                <form onSubmit={addTag} className="flex gap-2 mb-2">
                  <input
                    type="text"
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    placeholder="Add tags (press Enter)"
                    className="flex-1 p-3 rounded-lg bg-gray-50 dark:bg-[#0b0f15] border border-gray-200 dark:border-gray-700 outline-none focus:border-accent"
                    disabled={uploading}
                  />
                  <button
                    type="submit"
                    className="px-4 py-2 bg-gray-200 dark:bg-gray-700 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition"
                    disabled={uploading}
                  >
                    Add
                  </button>
                </form>
                
                {/* Tag Display */}
                {metadata.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {metadata.tags.map((tag, index) => (
                      <span
                        key={index}
                        className="inline-flex items-center gap-2 px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded-full text-sm"
                      >
                        {tag}
                        <button
                          onClick={() => removeTag(tag)}
                          className="hover:text-blue-900 dark:hover:text-blue-200"
                          disabled={uploading}
                        >
                          <X size={14} />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3">
              <button
                onClick={handleUpload}
                disabled={uploading || !metadata.title.trim()}
                className="flex-1 py-3 bg-accent text-white rounded-lg hover:opacity-90 font-medium transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {uploading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <Upload size={18} />
                    Upload Material
                  </>
                )}
              </button>
              <button
                onClick={onClose}
                disabled={uploading}
                className="px-6 py-3 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-[#0b0f15] transition disabled:opacity-50"
              >
                Cancel
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}