import React, { useState } from 'react';
import { Download, Trash2, Eye, Calendar, Tag as TagIcon } from 'lucide-react';
import { formatFileSize, getFileIcon, getFileColor } from '../utils/fileHelpers';
import { useMaterials } from '../context/MaterialsContext';

/**
 * Handles Cloudinary URLs specifically to avoid 401 Unauthorized errors.
 * 1. Thumbnails (.jpg) are always allowed.
 * 2. Original PDFs are allowed as long as we don't apply restricted transformations.
 */
function getCloudinaryPreviewUrl(material, isThumbnail = false) {
  if (!material || !material.fileUrl) return '';

  // Images are straightforward
  if (material.fileType === 'image') return material.fileUrl;

  if (material.fileType === 'pdf') {
    // 1. Ensure we are using the /image/ path since the backend forces 'image' type
    let url = material.fileUrl.replace('/raw/upload/', '/image/upload/');

    if (isThumbnail) {
      // CARD VIEW: Return a JPG of page 1
      return url.replace(/\.pdf$/i, '.jpg');
    } else {
      /**
       * 🛑 THE FIX:
       * Browsers block iframes if they think tracking is involved.
       * Adding 'dn_true' (client-side hint) or simply stripping 
       * transformations often bypasses strict tracking prevention.
       */
      return url.replace('/image/upload/', '/image/upload/f_auto,q_auto/');
    }
  }

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
          {(material.fileType === 'image' || material.fileType === 'pdf') ? (
            <img
              src={getCloudinaryPreviewUrl(material, true)}
              alt={material.title}
              className="w-full h-full object-cover"
              onError={(e) => {
                // If the thumbnail fails, hide the image and let the icon show
                e.target.style.display = 'none';
              }}
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
                className="p-3 bg-white rounded-full hover:bg-gray-100 transition shadow-lg"
                title="Preview"
              >
                <span className="text-gray-900"><Eye size={20} /></span>
              </button>
            )}
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleDownload();
              }}
              className="p-3 bg-white rounded-full hover:bg-gray-100 transition shadow-lg"
              title="Download"
            >
              <span className="text-gray-900"><Download size={20} /></span>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-4">
          <h3 className="font-semibold text-lg mb-2 truncate" title={material.title}>
            {material.title}
          </h3>

          {material.description && (
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 line-clamp-2">
              {material.description}
            </p>
          )}

          <div className="flex items-center gap-2 mb-3 text-xs text-gray-500 dark:text-gray-400 flex-wrap">
            <span className={`px-2 py-1 rounded font-bold ${getFileColor(material.fileType)}`}>
              {material.fileType.toUpperCase()}
            </span>
            <span>{formatFileSize(material.fileSize)}</span>
            <span>•</span>
            <span className="flex items-center gap-1">
              <Calendar size={12} />
              {new Date(material.createdAt).toLocaleDateString()}
            </span>
          </div>

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
            </div>
          )}

          <div className="flex gap-2">
            <button
              onClick={handleDownload}
              className="flex-1 py-2 px-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-sm font-medium flex items-center justify-center gap-2"
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
          <div className="max-w-5xl max-h-[90vh] w-full" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-white font-semibold">{material.title}</h3>
              <button
                onClick={() => setShowPreview(false)}
                className="p-2 text-white hover:bg-white/20 rounded transition text-xl"
              >
                ✕
              </button>
            </div>
            
            <div className="bg-white rounded-lg overflow-hidden h-[80vh]">
              {material.fileType === 'image' ? (
                <img
                  src={getCloudinaryPreviewUrl(material, false)}
                  alt={material.title}
                  className="w-full h-full object-contain mx-auto"
                />
              ) : material.fileType === 'pdf' ? (
                <iframe
                  src={getCloudinaryPreviewUrl(material, false)}
                  className="w-full h-full border-none"
                  title={material.title}
                />
              ) : null}
            </div>
          </div>
        </div>
      )}
    </>
  );
}