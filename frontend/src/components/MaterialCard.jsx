import React, { useState } from 'react';
import { Download, Trash2, Eye, Calendar, Tag as TagIcon } from 'lucide-react';
import { formatFileSize, getFileIcon, getFileColor } from '../utils/fileHelpers';
import { useMaterials } from '../context/MaterialsContext';

/**
 * FINAL ATTEMPT: Uses the original '/image/upload/' path (as saved in the database) 
 * but forces the format to PDF (f_pdf) for display in the iframe.
 * @param {object} material - The material object from the database.
 * @returns {string} The constructed file URL.
 */
function getCloudinaryPreviewUrl(material) {
    if (!material.publicId || !material.fileUrl) {
        return material.fileUrl; 
    }
    
    // 1. Extract the Version Number
    const versionMatch = material.fileUrl.match(/\/(v\d+)\//);
    const version = versionMatch ? `${versionMatch[1]}/` : ''; // e.g., 'v1765563391/'

    
    if (material.fileType === 'pdf') {
        
        // This is the CRITICAL change: We revert the path to /image/upload/ 
        // and inject the transformation f_pdf to render the file inline.
        
        // Start with the original URL, remove the extension, and remove the raw/upload attempts
        let correctedUrl = material.fileUrl
            .replace('/raw/upload/', '/image/upload/') // Ensure it's /image/upload/
            .replace('/image/upload/', `/image/upload/f_pdf/`); // Inject the f_pdf transformation
            
        // We ensure the version is present, though it should be.
        if (!correctedUrl.includes(version) && version) {
             correctedUrl = correctedUrl.replace('/image/upload/f_pdf/', `/image/upload/f_pdf/${version}`);
        }
        
        // Remove the file extension (which can break viewing)
        return correctedUrl.replace(/\.[0-9a-z]+$/i, '');
    }
    
    // Default return for all other types (images, etc.)
    return material.fileUrl; 
}

export default function MaterialCard({ material }) {
  const { deleteMaterial, downloadMaterial } = useMaterials();
  const [showPreview, setShowPreview] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // ============================================
  // HANDLERS
  // ============================================
  
  async function handleDelete() {
    if (!confirm(`Delete "${material.title}"?`)) return;
    
    setDeleting(true);
    const result = await deleteMaterial(material._id);
    
    if (!result.success) {
      alert(`Failed to delete: ${result.error}`);
      setDeleting(false);
    }
  }

  async function handleDownload() {
    await downloadMaterial(material._id, material.originalName);
  }

  function handlePreview() {
    if (material.fileType === 'image' || material.fileType === 'pdf') {
      setShowPreview(true);
    }
  }

  // ============================================
  // RENDER
  // ============================================
  
  return (
    <>
      <div className="bg-white dark:bg-[#121318] rounded-xl shadow-md border border-gray-200 dark:border-gray-800 hover:shadow-lg transition-all overflow-hidden group">
        
        {/* Preview/Thumbnail */}
        <div 
          className="relative h-48 bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-900 flex items-center justify-center cursor-pointer"
          onClick={handlePreview}
        >
          {material.fileType === 'image' ? (
            <img
              src={getCloudinaryPreviewUrl(material)}
              alt={material.title}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="text-6xl">
              {getFileIcon(material.fileType)}
            </div>
          )}
          
          {/* Hover Overlay */}
          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
            {(material.fileType === 'image' || material.fileType === 'pdf') && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handlePreview();
                }}
                className="p-3 bg-white rounded-full hover:bg-gray-100 transition"
                title="Preview"
              >
                <Eye size={20} />
              </button>
            )}
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleDownload();
              }}
              className="p-3 bg-white rounded-full hover:bg-gray-100 transition"
              title="Download"
            >
              <Download size={20} />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-4">
          {/* Title */}
          <h3 className="font-semibold text-lg mb-2 truncate" title={material.title}>
            {material.title}
          </h3>

          {/* Description */}
          {material.description && (
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 line-clamp-2">
              {material.description}
            </p>
          )}

          {/* File Info */}
          <div className="flex items-center gap-2 mb-3 text-xs text-gray-500 dark:text-gray-400 flex-wrap">
            <span className={`px-2 py-1 rounded ${getFileColor(material.fileType)}`}>
              {material.fileType.toUpperCase()}
            </span>
            <span>{formatFileSize(material.fileSize)}</span>
            <span>•</span>
            <span className="flex items-center gap-1">
              <Calendar size={12} />
              {new Date(material.createdAt).toLocaleDateString()}
            </span>
          </div>

          {/* Tags */}
          {material.tags && material.tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mb-3">
              {material.tags.slice(0, 3).map((tag, index) => (
                <span
                  key={index}
                  className="inline-flex items-center gap-1 text-xs px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded"
                >
                  <TagIcon size={10} />
                  {tag}
                </span>
              ))}
              {material.tags.length > 3 && (
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  +{material.tags.length - 3} more
                </span>
              )}
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-2">
            <button
              onClick={handleDownload}
              className="flex-1 py-2 px-3 bg-accent text-white rounded-lg hover:opacity-90 transition text-sm font-medium flex items-center justify-center gap-2"
            >
              <Download size={16} />
              Download
            </button>
            <button
              onClick={handleDelete}
              disabled={deleting}
              className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition disabled:opacity-50"
              title="Delete"
            >
              {deleting ? (
                <div className="w-5 h-5 border-2 border-red-500 border-t-transparent rounded-full animate-spin" />
              ) : (
                <Trash2 size={18} />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Preview Modal */}
      {showPreview && (
        <div 
          className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 p-4"
          onClick={() => setShowPreview(false)}
        >
          <div className="max-w-5xl max-h-[90vh] w-full">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-white font-semibold">{material.title}</h3>
              <button
                onClick={() => setShowPreview(false)}
                className="p-2 text-white hover:bg-white/20 rounded transition"
              >
                ✕
              </button>
            </div>
            
            {material.fileType === 'image' ? (
              <img
                src={getCloudinaryPreviewUrl(material)}
                alt={material.title}
                className="w-full h-auto max-h-[80vh] object-contain"
                onClick={(e) => e.stopPropagation()}
              />
            ) : material.fileType === 'pdf' ? (
              <iframe
                src={getCloudinaryPreviewUrl(material)}
                className="w-full h-[80vh] bg-white"
                onClick={(e) => e.stopPropagation()}
                title={material.title}
              />
            ) : null}
          </div>
        </div>
      )}
    </>
  );
}