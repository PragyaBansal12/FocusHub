import React, { useState } from 'react';
import { Plus, Search, Filter, X, FolderOpen, HardDrive, Hash } from 'lucide-react';
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

  const fileTypes = [
    { value: '', label: 'All Types' },
    { value: 'pdf', label: 'PDFs' },
    { value: 'image', label: 'Images' },
    { value: 'video', label: 'Videos' },
    { value: 'document', label: 'Docs' }
  ];

  const hasActiveFilters = searchQuery || filterType || filterTag;

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">Study Materials</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-2">
            <span className="flex h-2 w-2 rounded-full bg-accent animate-pulse" />
            {stats.totalFiles} files organized in your library
          </p>
        </div>
        
        <button
          onClick={() => setShowUpload(true)}
          className="group flex items-center gap-2 px-5 py-2.5 bg-accent text-white rounded-xl shadow-lg shadow-accent/20 hover:shadow-accent/40 hover:-translate-y-0.5 transition-all duration-200 font-medium"
        >
          <Plus size={20} className="group-hover:rotate-90 transition-transform" />
          Upload Material
        </button>
      </div>

      {/* Storage Intelligence Bar */}
      {stats.totalFiles > 0 && (
        <div className="mb-8 p-5 bg-white dark:bg-[#1E2028] rounded-2xl border border-slate-200 dark:border-slate-800/60 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <HardDrive size={16} className="text-accent" />
              <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">Cloud Storage</span>
            </div>
            <span className="text-xs font-mono text-slate-500">
              {stats.totalSizeMB} MB <span className="text-slate-300">/</span> 1000 MB
            </span>
          </div>
          
          <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2.5 overflow-hidden">
            <div 
              className="bg-gradient-to-r from-accent to-indigo-500 h-full rounded-full transition-all duration-1000 ease-out"
              style={{ width: `${Math.min((parseFloat(stats.totalSizeMB) / 1000) * 100, 100)}%` }}
            />
          </div>
          
          {stats.byType && (
            <div className="flex flex-wrap gap-2 mt-4">
              {Object.entries(stats.byType).map(([type, count]) => (
                <div 
                  key={type}
                  className="flex items-center gap-1.5 px-2.5 py-1 bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/50 rounded-lg text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-accent/60" />
                  {type}: {count}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Search & Utility Bar */}
      <div className="mb-8 space-y-4">
        <div className="flex flex-col md:flex-row gap-3">
          <div className="relative flex-1 group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-accent transition-colors" size={20} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by title, tags, or subject..."
              className="w-full pl-12 pr-12 py-3.5 rounded-2xl bg-white dark:bg-[#1E2028] border border-slate-200 dark:border-slate-800 outline-none focus:ring-4 focus:ring-accent/10 focus:border-accent transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-4 top-1/2 -translate-y-1/2 p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full text-slate-400 transition-colors"
              >
                <X size={16} />
              </button>
            )}
          </div>

          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl border font-medium transition-all ${
              showFilters
                ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 border-slate-900 dark:border-white shadow-lg'
                : 'bg-white dark:bg-[#1E2028] text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:border-accent'
            }`}
          >
            <Filter size={18} />
            Filters
            {hasActiveFilters && (
              <span className="flex items-center justify-center w-5 h-5 bg-accent text-white text-[10px] rounded-full ml-1">
                {[searchQuery, filterType, filterTag].filter(Boolean).length}
              </span>
            )}
          </button>
        </div>

        {/* Filter Panel Expansion */}
        {showFilters && (
          <div className="p-6 bg-white dark:bg-[#1E2028] rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xl animate-in fade-in slide-in-from-top-2 duration-200">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Type Selection */}
              <div>
                <h4 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-widest mb-4">File Category</h4>
                <div className="flex flex-wrap gap-2">
                  {fileTypes.map((type) => (
                    <button
                      key={type.value}
                      onClick={() => setFilterType(type.value)}
                      className={`py-2 px-4 rounded-xl text-sm font-semibold transition-all ${
                        filterType === type.value
                          ? 'bg-accent text-white shadow-md shadow-accent/20'
                          : 'bg-slate-50 dark:bg-slate-800/50 text-slate-600 dark:text-slate-400 hover:bg-slate-100'
                      }`}
                    >
                      {type.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Tag Cloud */}
              {stats.tags && stats.tags.length > 0 && (
                <div>
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-widest mb-4">Popular Tags</h4>
                  <div className="flex flex-wrap gap-2">
                    {stats.tags.slice(0, 12).map((tag) => (
                      <button
                        key={tag}
                        onClick={() => setFilterTag(tag === filterTag ? '' : tag)}
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all border ${
                          filterTag === tag
                            ? 'bg-accent/10 text-accent border-accent'
                            : 'bg-transparent text-slate-500 border-slate-200 dark:border-slate-700 hover:border-slate-400'
                        }`}
                      >
                        <Hash size={12} />
                        {tag}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
            
            {hasActiveFilters && (
              <div className="mt-6 pt-6 border-t border-slate-100 dark:border-slate-800 flex justify-end">
                <button
                  onClick={clearFilters}
                  className="text-sm font-bold text-rose-500 hover:text-rose-600 transition-colors flex items-center gap-2"
                >
                  <X size={16} /> Reset All Parameters
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Main Content Area */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-32">
          <div className="relative">
            <div className="h-16 w-16 rounded-full border-4 border-slate-100 dark:border-slate-800" />
            <div className="absolute top-0 h-16 w-16 rounded-full border-4 border-t-accent animate-spin" />
          </div>
          <p className="mt-6 text-slate-500 dark:text-slate-400 font-medium animate-pulse">Syncing library...</p>
        </div>
      ) : materials.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 bg-slate-50/50 dark:bg-[#121318]/50 rounded-[2rem] border-2 border-dashed border-slate-200 dark:border-slate-800">
          <div className="p-6 bg-white dark:bg-slate-800 rounded-3xl shadow-sm mb-6">
            <FolderOpen size={48} className="text-slate-300" />
          </div>
          <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
            {hasActiveFilters ? 'No matches found' : 'Your library is empty'}
          </h3>
          <p className="text-slate-500 text-center max-w-sm mb-8">
            {hasActiveFilters 
              ? 'We couldn\'t find any materials matching your current filters. Try broadening your search.'
              : 'Start building your knowledge base by uploading your first study guide, video, or document.'
            }
          </p>
          {!hasActiveFilters ? (
            <button
              onClick={() => setShowUpload(true)}
              className="px-8 py-3 bg-accent text-white rounded-xl font-bold shadow-lg shadow-accent/20 hover:bg-accent/90 transition-all"
            >
              Get Started
            </button>
          ) : (
            <button
              onClick={clearFilters}
              className="px-6 py-2 text-accent font-semibold hover:bg-accent/5 rounded-lg transition-colors"
            >
              Clear Search Filters
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">
              Library Results ({materials.length})
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {materials.map((material) => (
              <MaterialCard key={material._id} material={material} />
            ))}
          </div>
        </div>
      )}

      {/* Upload Modal Overlay */}
      {showUpload && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="w-full max-w-2xl bg-white dark:bg-[#1E2028] rounded-[2rem] shadow-2xl overflow-hidden">
             <FileUpload onClose={() => setShowUpload(false)} />
          </div>
        </div>
      )}
    </div>
  );
}