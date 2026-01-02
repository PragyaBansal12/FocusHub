import React, { useState } from 'react';
import { Plus, Search, Filter, X, FolderOpen } from 'lucide-react';
import { useMaterials } from '../context/MaterialsContext';
import FileUpload from '../components/FileUpload';
import MaterialCard from '../components/MaterialCard';

export default function Materials() {
  const {
    materials,
    loading,
    stats,
    searchQuery,
    setSearchQuery,
    filterType,
    setFilterType,
    filterTag,
    setFilterTag,
    clearFilters
  } = useMaterials();

  const [showUpload, setShowUpload] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  // ============================================
  // FILTER OPTIONS
  // ============================================
  
  const fileTypes = [
    { value: '', label: 'All Types' },
    { value: 'pdf', label: 'PDFs' },
    { value: 'image', label: 'Images' },
    { value: 'video', label: 'Videos' },
    { value: 'document', label: 'Documents' }
  ];

  const hasActiveFilters = searchQuery || filterType || filterTag;

  // ============================================
  // RENDER
  // ============================================
  
  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-semibold mb-2">Study Materials</h1>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {stats.totalFiles} files • {stats.totalSizeMB} MB used
          </p>
        </div>
        
        <button
          onClick={() => setShowUpload(true)}
          className="flex items-center gap-2 px-4 py-2 bg-accent text-white rounded-lg hover:opacity-90 transition"
        >
          <Plus size={18} />
          Upload Material
        </button>
      </div>

      {/* Storage Stats Bar */}
      {stats.totalFiles > 0 && (
        <div className="mb-6 p-4 bg-white dark:bg-[#121318] rounded-lg border border-gray-200 dark:border-gray-800">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">Storage Usage</span>
            <span className="text-sm text-gray-600 dark:text-gray-400">
              {stats.totalSizeMB} MB / 1000 MB
            </span>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
            <div 
              className="bg-accent h-2 rounded-full transition-all"
              style={{ width: `${Math.min((parseFloat(stats.totalSizeMB) / 1000) * 100, 100)}%` }}
            />
          </div>
          
          {/* File Type Breakdown */}
          {stats.byType && Object.keys(stats.byType).length > 0 && (
            <div className="flex flex-wrap gap-3 mt-3">
              {Object.entries(stats.byType).map(([type, count]) => (
                <span 
                  key={type}
                  className="text-xs px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded"
                >
                  {type.toUpperCase()}: {count}
                </span>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Search & Filter Bar */}
      <div className="mb-6 space-y-3">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by title, tags, or subject..."
            className="w-full pl-10 pr-10 py-3 rounded-lg bg-white dark:bg-[#121318] border border-gray-200 dark:border-gray-800 outline-none focus:border-accent"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              <X size={18} />
            </button>
          )}
        </div>

        {/* Filter Toggle */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition ${
              showFilters
                ? 'bg-accent text-white border-accent'
                : 'bg-white dark:bg-[#121318] border-gray-200 dark:border-gray-800 hover:border-accent'
            }`}
          >
            <Filter size={18} />
            Filters
            {hasActiveFilters && (
              <span className="ml-1 px-2 py-0.5 bg-white/20 rounded-full text-xs">
                {[searchQuery, filterType, filterTag].filter(Boolean).length}
              </span>
            )}
          </button>

          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 transition"
            >
              Clear all filters
            </button>
          )}
        </div>

        {/* Filter Options Panel */}
        {showFilters && (
          <div className="p-4 bg-white dark:bg-[#121318] rounded-lg border border-gray-200 dark:border-gray-800 space-y-4">
            {/* File Type Filter */}
            <div>
              <label className="block text-sm font-medium mb-2">File Type</label>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                {fileTypes.map((type) => (
                  <button
                    key={type.value}
                    onClick={() => setFilterType(type.value)}
                    className={`py-2 px-3 rounded-lg text-sm font-medium transition ${
                      filterType === type.value
                        ? 'bg-accent text-white'
                        : 'bg-gray-100 dark:bg-[#0b0f15] hover:bg-gray-200 dark:hover:bg-[#0f1218]'
                    }`}
                  >
                    {type.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Tag Filter */}
            {stats.tags && stats.tags.length > 0 && (
              <div>
                <label className="block text-sm font-medium mb-2">Filter by Tag</label>
                <div className="flex flex-wrap gap-2">
                  {stats.tags.slice(0, 15).map((tag) => (
                    <button
                      key={tag}
                      onClick={() => setFilterTag(tag === filterTag ? '' : tag)}
                      className={`px-3 py-1 rounded-full text-sm transition ${
                        filterTag === tag
                          ? 'bg-accent text-white'
                          : 'bg-gray-100 dark:bg-[#0b0f15] hover:bg-gray-200 dark:hover:bg-[#0f1218]'
                      }`}
                    >
                      #{tag}
                    </button>
                  ))}
                  {stats.tags.length > 15 && (
                    <span className="text-sm text-gray-500 dark:text-gray-400 px-3 py-1">
                      +{stats.tags.length - 15} more tags
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Active Filters Display */}
      {hasActiveFilters && (
        <div className="mb-4 flex flex-wrap gap-2">
          {searchQuery && (
            <span className="inline-flex items-center gap-2 px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded-full text-sm">
              Search: "{searchQuery}"
              <button onClick={() => setSearchQuery('')} className="hover:text-blue-900">
                <X size={14} />
              </button>
            </span>
          )}
          {filterType && (
            <span className="inline-flex items-center gap-2 px-3 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 rounded-full text-sm">
              Type: {fileTypes.find(t => t.value === filterType)?.label}
              <button onClick={() => setFilterType('')} className="hover:text-purple-900">
                <X size={14} />
              </button>
            </span>
          )}
          {filterTag && (
            <span className="inline-flex items-center gap-2 px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-full text-sm">
              Tag: {filterTag}
              <button onClick={() => setFilterTag('')} className="hover:text-green-900">
                <X size={14} />
              </button>
            </span>
          )}
        </div>
      )}

      {/* Materials Grid */}
      {loading ? (
        <div className="flex flex-col items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent mb-4"></div>
          <p className="text-sm text-gray-500 dark:text-gray-400">Loading materials...</p>
        </div>
      ) : materials.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-64 bg-white dark:bg-[#121318] rounded-lg border border-gray-200 dark:border-gray-800">
          <FolderOpen size={64} className="text-gray-300 dark:text-gray-700 mb-4" />
          <h3 className="text-lg font-semibold mb-2">
            {hasActiveFilters ? 'No materials found' : 'No materials yet'}
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-4 text-center max-w-md">
            {hasActiveFilters 
              ? 'Try adjusting your filters or search query'
              : 'Upload your first study material to get started!'
            }
          </p>
          {!hasActiveFilters && (
            <button
              onClick={() => setShowUpload(true)}
              className="flex items-center gap-2 px-6 py-3 bg-accent text-white rounded-lg hover:opacity-90 transition"
            >
              <Plus size={18} />
              Upload Material
            </button>
          )}
          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="text-sm text-accent hover:underline"
            >
              Clear all filters
            </button>
          )}
        </div>
      ) : (
        <>
          {/* Results Count */}
          <div className="mb-4 text-sm text-gray-600 dark:text-gray-400">
            Showing {materials.length} {materials.length === 1 ? 'material' : 'materials'}
          </div>

          {/* Materials Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {materials.map((material) => (
              <MaterialCard key={material._id} material={material} />
            ))}
          </div>
        </>
      )}

      {/* Upload Modal */}
      {showUpload && <FileUpload onClose={() => setShowUpload(false)} />}
    </div>
  );
}