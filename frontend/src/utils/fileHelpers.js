/**
 * Utility functions for file handling
 */

/**
 * Format file size from bytes to human-readable format
 * @param {number} bytes - File size in bytes
 * @returns {string} - Formatted string (e.g., "2.5 MB")
 */
export function formatFileSize(bytes) {
 if (bytes === 0) return '0 Bytes';
 
 const k = 1024;
 const sizes = ['Bytes', 'KB', 'MB', 'GB'];
 const i = Math.floor(Math.log(bytes) / Math.log(k));
 
 return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
}

/**
 * Get file icon based on file type
 * @param {string} fileType - Type of file (pdf, image, video, document)
 * @returns {string} - Emoji icon
 */
export function getFileIcon(fileType) {
 const icons = {
  pdf: '📄',
  image: '🖼️',
  video: '🎥',
  document: '📝'
 };
 return icons[fileType] || '📎';
}

/**
 * Get file color based on file type
 * @param {string} fileType - Type of file
 * @returns {string} - Tailwind color class
 */
export function getFileColor(fileType) {
 const colors = {
  pdf: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400',
  image: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400',
  video: 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400',
  document: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
 };
 return colors[fileType] || 'bg-gray-100 dark:bg-gray-900/30 text-gray-700 dark:text-gray-400';
}

/**
 * Validate file before upload
 * @param {File} file - File object to validate
 * @returns {object} - { valid: boolean, error: string }
 */
export function validateFile(file) {
 const maxSize = 50 * 1024 * 1024; // 50MB
 
 const allowedTypes = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'video/mp4',
  'video/webm',
  'text/plain'
 ];
 
 if (file.size > maxSize) {
  return { valid: false, error: 'File size must be less than 50MB' };
 }
 
 if (!allowedTypes.includes(file.type)) {
  return { valid: false, error: 'File type not allowed' };
 }
 
 return { valid: true, error: null };
}

// 🛑 REMOVED getFilePreviewUrl function 🛑
// The function below is removed because the frontend now uses the direct Cloudinary URL (material.fileUrl).
/*
export function getFilePreviewUrl(fileName) {
 return `http://localhost:5000/uploads/${fileName}`;
}
*/