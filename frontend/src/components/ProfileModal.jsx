import React, { useState, useRef } from "react";
import { useAuth } from "../context/AuthContext";
import { X, Camera, Loader2, User as UserIcon, Mail } from "lucide-react";
import axios from "axios";

export default function ProfileModal({ isOpen, onClose }) {
  const { user, updateUser } = useAuth();
  const [name, setName] = useState(user?.name || "");
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(user?.profilePicture);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef(null);

  if (!isOpen) return null;

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file)); 
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    const formData = new FormData();
    formData.append("name", name);
    if (selectedFile) {
      formData.append("image", selectedFile);
    }

    try {
      const response = await axios.put("http://localhost:5000/api/user/update", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      if (response.data) {
        updateUser(response.data); 
        onClose();
      }
    } catch (error) {
      console.error("Error updating profile:", error.response?.data || error.message);
      alert("Failed to update profile. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-white dark:bg-[#0f1116] w-full max-w-md rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-800 overflow-hidden animate-in fade-in zoom-in duration-200">
        
        {/* Header */}
        <div className="flex justify-between items-center p-5 border-b dark:border-gray-800">
          <h2 className="text-xl font-bold dark:text-white">Profile Settings</h2>
          <button 
            onClick={onClose} 
            className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          
          {/* 🔥 IDENTITY SECTION: Shows Signup Name First */}
          <div className="flex items-center gap-5 bg-gray-50 dark:bg-[#16181d] p-4 rounded-xl border border-gray-100 dark:border-gray-800">
            <div className="relative group cursor-pointer" onClick={() => fileInputRef.current.click()}>
              <img 
                src={previewUrl} 
                alt="Profile" 
                className="w-20 h-20 rounded-full object-cover border-2 border-accent shadow-sm group-hover:opacity-80 transition-opacity"
              />
              <div className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                <Camera className="text-white" size={20} />
              </div>
              <input 
                type="file" 
                ref={fileInputRef}
                onChange={handleFileChange} 
                accept="image/*" 
                className="hidden" 
              />
            </div>
            <div className="flex flex-col overflow-hidden">
              <span className="text-xs font-bold text-accent uppercase tracking-wide">Username</span>
              <h3 className="text-xl font-bold dark:text-white truncate">
                {user?.name}
              </h3>
              <span className="text-xs text-gray-500 italic">Member since {new Date(user?.createdAt).toLocaleDateString()}</span>
            </div>
          </div>

          {/* EDITABLE SECTION */}
          <div className="space-y-4">
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                <UserIcon size={14} /> Edit Your Username
              </label>
              <input 
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="w-full px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-transparent dark:text-white focus:ring-2 focus:ring-accent outline-none transition-all"
                placeholder="Type new username..."
              />
            </div>

            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-gray-400 mb-1">
                <Mail size={14} /> Registered Email
              </label>
              <input 
                type="email"
                value={user?.email}
                disabled
                className="w-full px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50 text-gray-400 cursor-not-allowed"
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-2">
            <button 
              type="button" 
              onClick={onClose}
              className="flex-1 px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 font-medium hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
            >
              Cancel
            </button>
            <button 
              type="submit" 
              disabled={isSubmitting}
              className="flex-1 px-4 py-2 rounded-lg bg-accent text-white font-medium hover:opacity-90 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
            >
              {isSubmitting ? <Loader2 className="animate-spin" size={18} /> : "Update Username"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}