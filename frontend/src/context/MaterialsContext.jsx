import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
} from "react";

// Create Context
const MaterialsContext = createContext(null);

// Custom Hook
export const useMaterials = () => {
  const context = useContext(MaterialsContext);
  if (!context) {
    throw new Error("useMaterials must be used within MaterialsProvider");
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
    tags: [],
  });

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState("");
  const [filterTag, setFilterTag] = useState("");

  const API_BASE_URL = `${import.meta.env.VITE_API_URL || "http://localhost:5000"}/api`;

  // ============================================
  // API FUNCTIONS
  // ============================================

  /**
   * Fetch all materials with optional filters
   */
  const fetchMaterials = useCallback(async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");

      const params = new URLSearchParams();
      if (searchQuery) params.append("search", searchQuery);
      if (filterType) params.append("type", filterType);
      if (filterTag) params.append("tag", filterTag);

      const url = `${API_BASE_URL}/materials?${params.toString()}`;

      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await res.json();

      if (res.ok) {
        setMaterials(data.materials);
      } else {
        console.error("Failed to fetch materials:", data.message);
      }
    } catch (error) {
      console.error("Error fetching materials:", error);
    } finally {
      setLoading(false);
    }
  }, [searchQuery, filterType, filterTag]);

  /**
   * Fetch storage statistics
   */
  const fetchStats = useCallback(async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_BASE_URL}/materials/stats`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await res.json();
      if (res.ok) {
        setStats(data);
      }
    } catch (error) {
      console.error("Error fetching stats:", error);
    }
  }, []);

  /**
   * Upload a new material
   */
  const uploadMaterial = useCallback(
    async (file, metadata) => {
      // 1. Optimistic UI update for immediate feedback
      const tempId = "temp-" + Date.now();
      const tempMaterial = {
        _id: tempId,
        title: metadata.title || file.name,
        description: metadata.description || "",
        subject: metadata.subject || "",
        tags: metadata.tags || [],
        fileType: file.type.startsWith("image/")
          ? "image"
          : file.type.startsWith("video/")
            ? "video"
            : file.type === "application/pdf"
              ? "pdf"
              : "document",
        fileSize: file.size || 0,
        fileUrl: "", // Not downloadable yet
        createdAt: new Date().toISOString(),
        isOptimistic: true, // Optional flag if the UI wants to show a spinner on this specific card
      };

      setMaterials((prev) => [tempMaterial, ...prev]);
      setUploading(true);

      try {
        const token = localStorage.getItem("token");

        const formData = new FormData();
        formData.append("file", file);
        formData.append("title", metadata.title || file.name);
        formData.append("description", metadata.description || "");
        formData.append("subject", metadata.subject || "");
        formData.append("tags", JSON.stringify(metadata.tags || []));

        const res = await fetch(`${API_BASE_URL}/materials`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: formData,
        });

        const data = await res.json();

        if (res.ok) {
          const newMaterial = data.material;
          // Replace temp material with real material from server
          setMaterials((prev) =>
            prev.map((m) => (m._id === tempId ? newMaterial : m)),
          );
          // Fetch stats in background
          fetchStats();
          return { success: true, material: newMaterial };
        } else {
          // Revert on failure
          setMaterials((prev) => prev.filter((m) => m._id !== tempId));
          return { success: false, error: data.message };
        }
      } catch (error) {
        // Revert on failure
        setMaterials((prev) => prev.filter((m) => m._id !== tempId));
        return { success: false, error: error.message };
      } finally {
        setUploading(false);
      }
    },
    [fetchStats],
  );

  /**
   * Delete a material
   */
  const deleteMaterial = useCallback(
    async (id) => {
      // Save previous state for reverting
      const previousMaterial = materials.find((m) => m._id === id);

      // Optimistic UI update
      setMaterials((prev) => prev.filter((m) => m._id !== id));

      try {
        const token = localStorage.getItem("token");
        const res = await fetch(`${API_BASE_URL}/materials/${id}`, {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        });

        if (res.ok) {
          // Fetch stats in background
          fetchStats();
          return { success: true };
        } else {
          // Revert on failure
          if (previousMaterial)
            setMaterials((prev) => [...prev, previousMaterial]);
          const data = await res.json();
          return { success: false, error: data.message };
        }
      } catch (error) {
        // Revert on failure
        if (previousMaterial)
          setMaterials((prev) => [...prev, previousMaterial]);
        return { success: false, error: error.message };
      }
    },
    [materials, fetchStats],
  );

  /**
   * Download a material
   */
  const downloadMaterial = useCallback(
    async (id) => {
      try {
        const token = localStorage.getItem("token");

        // 1. Fetch directly from YOUR backend proxy, bypassing Cloudinary completely
        const res = await fetch(
          `${import.meta.env.VITE_API_URL || "http://localhost:5000"}/api/materials/${id}/download`,
          {
            headers: { Authorization: `Bearer ${token}` },
          },
        );

        const data = await res.json();

        if (res.ok && data.success) {
          // 2. Trigger the browser's native download manager
          window.location.href = data.downloadUrl;

          // Fetch stats again in the background to update the download count
          fetchStats();

          return { success: true };
        } else {
          return { success: false, error: data.message };
        }
      } catch (error) {
        console.error("Download failed:", error);
        return { success: false, error: error.message };
      }
    },
    [fetchStats],
  );

  /**
   * Clear all filters
   */
  const clearFilters = useCallback(() => {
    setSearchQuery("");
    setFilterType("");
    setFilterTag("");
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
    downloadMaterial,
  };

  return (
    <MaterialsContext.Provider value={value}>
      {children}
    </MaterialsContext.Provider>
  );
}