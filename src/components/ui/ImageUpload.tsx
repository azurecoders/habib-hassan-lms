"use client";

import React, { useState, useRef } from "react";
import Image from "next/image";
import { UploadCloud, X, Loader2, Camera } from "lucide-react";

interface ImageUploadProps {
  value?: string;
  onChange: (url: string) => void;
  label?: string;
  folder?: string;
  className?: string;
}

export default function ImageUpload({
  value,
  onChange,
  label = "Upload Image",
  folder = "/school_lms",
  className = "",
}: ImageUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setError("Please select an image file (PNG, JPG, WEBP).");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError("Image size must be under 5MB.");
      return;
    }

    setError(null);
    setUploading(true);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("folder", folder);

      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Upload failed");

      onChange(data.url);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to upload image";
      setError(msg);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className={`space-y-1.5 ${className}`}>
      {label && (
        <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
          {label}
        </label>
      )}

      {value ? (
        <div className="relative inline-block rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 shadow-xs group w-24 h-24">
          <Image
            src={value}
            alt="Uploaded"
            fill
            sizes="96px"
            className="object-cover"
          />
          <div className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center gap-1">
            <button
              type="button"
              onClick={() => onChange("")}
              className="p-1.5 rounded-full bg-rose-600 text-white hover:bg-rose-700 transition"
              title="Remove image"
            >
              <X className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="p-1.5 rounded-full bg-slate-800 text-white hover:bg-slate-700 transition"
              title="Change image"
            >
              <Camera className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      ) : (
        <div
          onClick={() => fileInputRef.current?.click()}
          className="w-full sm:w-64 h-28 border-2 border-dashed border-slate-200 dark:border-slate-800 hover:border-indigo-400 dark:hover:border-indigo-600 rounded-2xl flex flex-col items-center justify-center cursor-pointer bg-slate-50/50 dark:bg-slate-900/50 transition p-3 text-center"
        >
          {uploading ? (
            <div className="flex flex-col items-center gap-2">
              <Loader2 className="w-5 h-5 text-indigo-600 animate-spin" />
              <span className="text-[11px] text-slate-500 font-medium">Uploading to ImageKit...</span>
            </div>
          ) : (
            <>
              <div className="w-8 h-8 rounded-full bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mb-1">
                <UploadCloud className="w-4 h-4" />
              </div>
              <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Click to upload photo
              </span>
              <span className="text-[10px] text-slate-400">PNG, JPG up to 5MB</span>
            </>
          )}
        </div>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="hidden"
      />

      {error && <p className="text-[11px] text-rose-500 font-medium">{error}</p>}
    </div>
  );
}
