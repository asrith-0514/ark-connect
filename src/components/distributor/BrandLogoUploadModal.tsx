"use client";

import React, { useState, useRef } from "react";
import { Icon } from "@/components/ui/Icon";
import { Brand } from "@/data/mockData";
import { imageStore, useEntityImages, validateImageFile } from "@/lib/storage/imageStore";

interface BrandLogoUploadModalProps {
  brand: Brand | null;
  isOpen: boolean;
  onClose: () => void;
}

export const BrandLogoUploadModal: React.FC<BrandLogoUploadModalProps> = ({
  brand,
  isOpen,
  onClose,
}) => {
  const brandId = brand ? brand.id : "";
  const { images, primaryUrl, refresh } = useEntityImages("brand", brandId);

  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen || !brand) return null;

  const handleFile = async (file: File) => {
    setErrorMessage(null);
    const validation = validateImageFile(file);
    if (!validation.valid) {
      setErrorMessage(validation.error || "Invalid file");
      return;
    }

    try {
      setIsUploading(true);
      setProgress(10);
      await imageStore.upload(file, {
        entityType: "brand",
        entityId: brand.id,
        isPrimary: true,
        altText: `${brand.name} official brand logo`,
        onProgress: p => setProgress(p),
      });
      await refresh();
      setIsUploading(false);
      setProgress(0);
    } catch (err: any) {
      setIsUploading(false);
      setProgress(0);
      setErrorMessage(err.message || "Failed to upload logo");
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleDelete = async () => {
    if (images.length > 0) {
      await imageStore.remove(images[0].id);
      await refresh();
    }
  };

  const brandColor = brand.colorHex || brand.accentColor || "#2F6BFF";
  const displayImage = primaryUrl || brand.logo || brand.image;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-150">
      <div
        className="relative w-full max-w-md bg-surface rounded-lg shadow-soft-xl border border-border text-ink overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 sm:p-5 bg-surface border-b border-border flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold text-xs shadow-soft-sm"
              style={{ backgroundColor: brandColor }}
            >
              {brand.name.substring(0, 2).toUpperCase()}
            </div>
            <div>
              <h3 className="font-bold text-base text-ink leading-tight">
                Upload Brand Logo • {brand.name}
              </h3>
              <p className="text-xs text-ink-muted">
                Circular crop preview for mobile story rings &amp; store cards
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-background hover:bg-surface-raised flex items-center justify-center text-ink-muted hover:text-ink cursor-pointer border border-border"
          >
            <Icon name="close" size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-5">
          {/* Circular Crop Preview */}
          <div className="flex flex-col items-center justify-center pt-2">
            <span className="text-[11px] font-bold text-ink-muted uppercase tracking-wider mb-2">
              Story Ring Circular Preview (~64px)
            </span>
            <div className="relative p-1 rounded-full border-2 border-dashed border-primary/40 bg-background">
              <div
                className="w-24 h-24 rounded-full overflow-hidden flex items-center justify-center text-white font-bold text-2xl shadow-soft-md border border-border relative bg-surface-raised"
                style={{ backgroundColor: !displayImage ? brandColor : undefined }}
              >
                {displayImage ? (
                  <img
                    src={displayImage}
                    alt={brand.name}
                    className="w-full h-full object-cover rounded-full"
                  />
                ) : (
                  <span>{brand.name.substring(0, 2).toUpperCase()}</span>
                )}
              </div>
            </div>
            <span className="text-xs text-ink-muted mt-2">
              {primaryUrl ? "Custom uploaded WebP logo active" : "Default monogram fallback active"}
            </span>
          </div>

          {/* Error Message */}
          {errorMessage && (
            <div className="p-3 bg-danger/10 border border-danger/20 rounded-xl text-danger text-xs flex items-center gap-2">
              <Icon name="error" size={18} className="shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Drag & Drop Upload Zone */}
          <div
            onDragOver={e => {
              e.preventDefault();
              setIsDragOver(true);
            }}
            onDragLeave={() => setIsDragOver(false)}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-xl p-5 text-center cursor-pointer transition-colors ${
              isDragOver
                ? "border-primary bg-primary/5"
                : "border-border hover:border-primary/50 hover:bg-background"
            }`}
          >
            <input
              type="file"
              ref={fileInputRef}
              accept=".jpg,.jpeg,.png,.webp"
              onChange={e => {
                if (e.target.files && e.target.files[0]) {
                  handleFile(e.target.files[0]);
                }
              }}
              className="hidden"
            />
            <Icon name="cloud_upload" size={32} className="text-primary mb-1" />
            <p className="text-xs font-bold text-ink">
              Drag &amp; drop logo or <span className="text-primary underline">browse</span>
            </p>
            <p className="text-[11px] text-ink-muted mt-0.5">
              JPG, PNG, WebP up to 5 MB • Auto-resized to 1200px
            </p>
          </div>

          {/* Upload Progress Bar */}
          {isUploading && (
            <div className="space-y-1">
              <div className="flex justify-between text-xs text-ink-muted font-mono num">
                <span>Optimizing &amp; Compressing...</span>
                <span>{progress}%</span>
              </div>
              <div className="w-full h-1.5 bg-background rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary transition-all duration-200"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          )}

          {/* Storage Disclaimer Banner */}
          <div className="p-3 bg-primary/5 border border-primary/15 rounded-xl text-xs text-ink-muted flex items-start gap-2">
            <Icon name="info" size={18} className="text-primary shrink-0 mt-0.5" />
            <span className="leading-snug">
              Stored in local browser storage (IndexedDB). Logo appears across the retailer portal and brand row in this browser.
            </span>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-surface border-t border-border flex items-center justify-between gap-3">
          {primaryUrl ? (
            <button
              type="button"
              onClick={handleDelete}
              className="px-3 min-h-[40px] rounded-xl text-danger hover:bg-danger/10 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Icon name="delete" size={16} />
              <span>Remove Logo</span>
            </button>
          ) : (
            <span />
          )}

          <button
            type="button"
            onClick={onClose}
            className="px-4 min-h-[40px] rounded-xl bg-surface-raised hover:bg-background border border-border text-ink text-xs font-bold cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
