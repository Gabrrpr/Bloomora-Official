import { useState } from "react";
import { api } from "../services/api"; // Make sure this path correctly points to your api.js

export default function ImageUploader({ bucketName = "hero-images", onUploadComplete }) {
  const [uploading, setUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState(null);

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Optional: Check file size (e.g., limit to 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert("File is too large. Please select an image under 5MB.");
      return;
    }

    setUploading(true);
    try {
      // 1. Send the file to your FastAPI backend
      const response = await api.uploadImage(bucketName, file);
      
      // 2. The backend returns the new Supabase URL!
      const newImageUrl = response.url;
      setPreviewUrl(newImageUrl);
      
      // 3. Pass the URL back to your main component to save to the database
      onUploadComplete(newImageUrl);
      
    } catch (error) {
      alert(error.message || "Failed to upload image to the server.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="p-4 rounded-xl border shadow-sm w-full transition-all" 
         style={{ backgroundColor: "var(--input-bg, white)", borderColor: "var(--input-bdr, #dde3ec)" }}>
      
      {/* ── Image Preview ── */}
      {previewUrl && (
        <div className="mb-4 rounded-lg overflow-hidden border shadow-sm relative h-32 bg-gray-50">
          <img src={previewUrl} alt="Upload Preview" className="w-full h-full object-cover" />
        </div>
      )}

      {/* ── The File Input ── */}
      <input 
        type="file" 
        accept="image/png, image/jpeg, image/webp" 
        onChange={handleFileChange}
        disabled={uploading}
        className="block w-full text-sm text-gray-500
          file:mr-4 file:py-2 file:px-4
          file:rounded-md file:border-0
          file:text-sm file:font-semibold
          file:bg-green-50 file:text-green-700
          hover:file:bg-green-100 cursor-pointer outline-none transition-all
          disabled:opacity-50 disabled:cursor-not-allowed"
      />
      
      {uploading && (
        <p className="text-xs font-bold text-green-600 mt-3 animate-pulse">
          Uploading image... Please wait.
        </p>
      )}
    </div>
  );
}