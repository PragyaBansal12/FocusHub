import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';

// Create Context
const MaterialsContext = createContext(null);

// Custom Hook
export const useMaterials = () => {
  const context = useContext(MaterialsContext);
  if (!context) {
    throw new Error('useMaterials must be used within MaterialsProvider');
  }
  return context;
};

// Provider Component
export function MaterialsProvider({ children }) {
  // ============================================
  // STATE
  // ============================================
  const [materials, setMaterials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [stats, setStats] = useState({
    totalFiles: 0,
    totalSizeMB: 0,
    byType: {},
    tags: []
  });
  
  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState(''); // 'pdf', 'image', 'video', 'document'
  const [filterTag, setFilterTag] = useState('');

  const API_BASE_URL = 'http://localhost:5000/api';

  // ============================================
  // API FUNCTIONS
  // ============================================
  
  /**
   * Fetch all materials with optional filters
   */
  const fetchMaterials = useCallback(async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      const params = new URLSearchParams();
      if (searchQuery) params.append('search', searchQuery);
      if (filterType) params.append('type', filterType);
      if (filterTag) params.append('tag', filterTag);
      
      const url = `${API_BASE_URL}/materials?${params.toString()}`;
      
      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      const data = await res.json();
      
      if (res.ok) {
        setMaterials(data.materials);
      } else {
        console.error('Failed to fetch materials:', data.message);
      }
    } catch (error) {
      console.error('Error fetching materials:', error);
    } finally {
      setLoading(false);
    }
  }, [searchQuery, filterType, filterTag]);

  /**
   * Fetch storage statistics
   */
  const fetchStats = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_BASE_URL}/materials/stats`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      const data = await res.json();
      if (res.ok) {
        setStats(data);
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  }, []);

  /**
   * Upload a new material
   */
  const uploadMaterial = useCallback(async (file, metadata) => {
    try {
      setUploading(true);
      const token = localStorage.getItem('token');
      
      const formData = new FormData();
      formData.append('file', file);
      formData.append('title', metadata.title || file.name);
      formData.append('description', metadata.description || '');
      formData.append('subject', metadata.subject || '');
      formData.append('tags', JSON.stringify(metadata.tags || []));
      
      const res = await fetch(`${API_BASE_URL}/materials`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`
          // Browser sets Content-Type for FormData automatically
        },
        body: formData
      });
      
      const data = await res.json();
      
      if (res.ok) {
        await fetchMaterials();
        await fetchStats();
        return { success: true, material: data.material };
      } else {
        return { success: false, error: data.message };
      }
    } catch (error) {
      return { success: false, error: error.message };
    } finally {
      setUploading(false);
    }
  }, [fetchMaterials, fetchStats]);

  /**
   * Delete a material
   */
  const deleteMaterial = useCallback(async (id) => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_BASE_URL}/materials/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (res.ok) {
        setMaterials(prev => prev.filter(m => m._id !== id));
        await fetchStats();
        return { success: true };
      } else {
        const data = await res.json();
        return { success: false, error: data.message };
      }
    } catch (error) {
      return { success: false, error: error.message };
    }
  }, [fetchStats]);

  /**
   * Download a material
   * 🛑 FIX: Uses a direct anchor click to handle the Backend redirect properly.
   */
  const downloadMaterial = useCallback(async (id) => {
    try {
      const token = localStorage.getItem('token');
      
      // We pass the token in the URL because a direct window/link request 
      // cannot send 'Authorization' headers like fetch can.
      const downloadUrl = `${API_BASE_URL}/materials/${id}/download?token=${token}`;
      
      const a = document.createElement('a');
      a.href = downloadUrl;
      a.style.display = 'none';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      
      return { success: true };
    } catch (error) {
      console.error('❌ Error downloading:', error);
      return { success: false, error: error.message };
    }
  }, []);

  /**
   * Clear all filters
   */
  const clearFilters = useCallback(() => {
    setSearchQuery('');
    setFilterType('');
    setFilterTag('');
  }, []);

  // ============================================
  // EFFECTS
  // ============================================
  
  useEffect(() => {
    fetchMaterials();
  }, [fetchMaterials]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  // ============================================
  // CONTEXT VALUE
  // ============================================
  const value = {
    materials,
    loading,
    uploading,
    stats,
    searchQuery,
    setSearchQuery,
    filterType,
    setFilterType,
    filterTag,
    setFilterTag,
    clearFilters,
    fetchMaterials,
    fetchStats,
    uploadMaterial,
    deleteMaterial,
    downloadMaterial
  };

  return (
    <MaterialsContext.Provider value={value}>
      {children}
    </MaterialsContext.Provider>
  );
}