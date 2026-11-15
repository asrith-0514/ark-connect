"use client";

import React, { useState, useRef, useEffect } from "react";
import { Icon } from "@/components/ui/Icon";
import { TierPricingArticle } from "@/data/mockData";
import {
  imageStore,
  useEntityImages,
  validateImageFile,
  StoredImage,
} from "@/lib/storage/imageStore";

interface ProductImageUploadModalProps {
  article: TierPricingArticle | null;
  isOpen: boolean;
  onClose: () => void;
}

export const ProductImageUploadModal: React.FC<ProductImageUploadModalProps> = ({
  article,
  isOpen,
  onClose,
}) => {
  const articleId = article ? article.id : "";
  const [selectedColourCode, setSelectedColourCode] = useState<string>("ALL");
  const [activeTab, setActiveTab] = useState<"style" | "colour">("style");

  const colourFilter = activeTab === "colour" && selectedColourCode !== "ALL" ? selectedColourCode : undefined;
  const { images, refresh } = useEntityImages(
    activeTab === "colour" ? "colour" : "style",
    articleId,
    colourFilter
  );

  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<{ [fileName: string]: number }>({});
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [editingAltId, setEditingAltId] = useState<string | null>(null);
  const [altTextMap, setAltTextMap] = useState<{ [id: string]: string }>({});
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Available shades for this article if any
  const availableShades = ((article as any)?.availableShades || (article as any)?.shades || []) as {
    name: string;
    code?: string;
    hex?: string;
  }[];

  useEffect(() => {
    if (images.length > 0) {
      const initialAlt: { [id: string]: string } = {};
      images.forEach(img => {
        initialAlt[img.id] = img.altText || "";
      });
      setAltTextMap(initialAlt);
    }
  }, [images]);

  if (!isOpen || !article) return null;

  const handleFiles = async (files: FileList | File[]) => {
    setErrorMessage(null);
    const fileArray = Array.from(files);

    // Validate all files
    for (const f of fileArray) {
      const validation = validateImageFile(f);
      if (!validation.valid) {
        setErrorMessage(validation.error || "Invalid file");
        return;
      }
    }

    setIsUploading(true);
    try {
      for (let i = 0; i < fileArray.length; i++) {
        const file = fileArray[i];
        await imageStore.upload(file, {
          entityType: activeTab === "colour" ? "colour" : "style",
          entityId: article.id,
          colourCode: activeTab === "colour" && selectedColourCode !== "ALL" ? selectedColourCode : undefined,
          altText: `${article.title} - ${file.name}`,
          onProgress: p => {
            setUploadProgress(prev => ({ ...prev, [file.name]: p }));
          },
        });
      }
      await refresh();
      setUploadProgress({});
      setIsUploading(false);
    } catch (err: any) {
      setIsUploading(false);
      setErrorMessage(err.message || "Failed to upload images");
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFiles(e.dataTransfer.files);
    }
  };

  const handleDelete = async (id: string) => {
    await imageStore.remove(id);
    await refresh();
  };

  const handleSetPrimary = async (id: string) => {
    await imageStore.setPrimary(
      article.id,
      id,
      activeTab === "colour" ? "colour" : "style"
    );
    await refresh();
  };

  const handleMoveOrder = async (index: number, direction: "up" | "down") => {
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= images.length) return;

    const newOrder = [...images];
    const temp = newOrder[index];
    newOrder[index] = newOrder[targetIndex];
    newOrder[targetIndex] = temp;

    await imageStore.reorder(article.id, newOrder.map(img => img.id));
    await refresh();
  };

  const handleSaveAltText = async (id: string) => {
    const text = altTextMap[id] || "";
    await imageStore.updateAltText(id, text);
    setEditingAltId(null);
    await refresh();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-3 sm:p-4 animate-in fade-in duration-150">
      <div
        className="relative w-full max-w-2xl bg-surface rounded-2xl shadow-soft-xl border border-border text-ink overflow-hidden max-h-[92vh] flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 sm:p-5 bg-surface border-b border-border flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold border border-primary/20 shrink-0">
              <Icon name="add_photo_alternate" size={22} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-sm sm:text-base text-ink">{article.title}</span>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-surface-raised border border-border text-ink-muted font-mono num">
                  Art #{article.artNumber}
                </span>
              </div>
              <p className="text-xs text-ink-muted mt-0.5">
                {article.brand} • {article.category} • Upload style &amp; colour photos
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

        {/* Scope Tabs: Style Photos vs Per-Colour Photos */}
        <div className="px-4 sm:px-5 py-2 bg-surface-raised/50 border-b border-border flex items-center justify-between gap-3 shrink-0 flex-wrap">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setActiveTab("style")}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === "style"
                  ? "bg-primary text-primary-foreground shadow-soft-xs"
                  : "bg-surface border border-border text-ink hover:bg-surface-raised"
              }`}
            >
              General Style Photos ({images.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("colour")}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === "colour"
                  ? "bg-primary text-primary-foreground shadow-soft-xs"
                  : "bg-surface border border-border text-ink hover:bg-surface-raised"
              }`}
            >
              Per-Colour Photos
            </button>
          </div>

          {activeTab === "colour" && availableShades.length > 0 && (
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] font-bold text-ink-muted">Colour:</span>
              <select
                value={selectedColourCode}
                onChange={e => setSelectedColourCode(e.target.value)}
                className="px-2.5 py-1 text-xs rounded-lg bg-surface border border-border text-ink font-semibold focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer"
              >
                <option value="ALL">All Colours</option>
                {availableShades.map((s: { name: string; code?: string }, idx: number) => (
                  <option key={idx} value={s.code || s.name}>
                    {s.name} {s.code ? `(${s.code})` : ""}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Scrollable Body */}
        <div className="p-4 sm:p-5 overflow-y-auto flex-1 space-y-4">
          {/* Error Message */}
          {errorMessage && (
            <div className="p-3 bg-danger/10 border border-danger/20 rounded-xl text-danger text-xs flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Icon name="error" size={18} className="shrink-0" />
                <span>{errorMessage}</span>
              </div>
              <button
                type="button"
                onClick={() => setErrorMessage(null)}
                className="text-danger hover:text-ink cursor-pointer"
              >
                <Icon name="close" size={16} />
              </button>
            </div>
          )}

          {/* Drag & Drop Multi-file Upload Zone */}
          <div
            onDragOver={e => {
              e.preventDefault();
              setIsDragOver(true);
            }}
            onDragLeave={() => setIsDragOver(false)}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-colors ${
              isDragOver
                ? "border-primary bg-primary/5"
                : "border-border hover:border-primary/50 hover:bg-background"
            }`}
          >
            <input
              type="file"
              ref={fileInputRef}
              multiple
              accept=".jpg,.jpeg,.png,.webp"
              onChange={e => {
                if (e.target.files && e.target.files.length > 0) {
                  handleFiles(e.target.files);
                }
              }}
              className="hidden"
            />
            <Icon name="add_photo_alternate" size={36} className="text-primary mb-1" />
            <p className="text-xs sm:text-sm font-bold text-ink">
              Drag &amp; drop images or <span className="text-primary underline">browse multiple files</span>
            </p>
            <p className="text-[11px] text-ink-muted mt-0.5">
              JPG, PNG, WebP up to 5 MB • Automatically resized to max 1200px &amp; WebP compressed
            </p>
          </div>

          {/* Upload Progress Indicator */}
          {isUploading && (
            <div className="p-3 bg-background rounded-xl border border-border space-y-2">
              <span className="text-xs font-bold text-ink flex items-center gap-2">
                <Icon name="progress_activity" size={16} className="animate-spin text-primary" />
                Optimizing &amp; Compressing Photos...
              </span>
              {Object.entries(uploadProgress).map(([name, pct]) => (
                <div key={name} className="space-y-1">
                  <div className="flex justify-between text-[11px] text-ink-muted font-mono num">
                    <span className="truncate max-w-[200px]">{name}</span>
                    <span>{pct}%</span>
                  </div>
                  <div className="w-full h-1 bg-border rounded-full overflow-hidden">
                    <div className="h-full bg-primary" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Gallery View */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-ink-muted uppercase tracking-wider">
                Photo Gallery ({images.length} {images.length === 1 ? "image" : "images"})
              </span>
              <span className="text-[11px] text-ink-muted">
                First image or marked Primary will appear as main catalog cover
              </span>
            </div>

            {images.length === 0 ? (
              <div className="p-8 text-center bg-background rounded-xl border border-border">
                <Icon name="hide_image" size={32} className="text-ink-muted mb-1" />
                <p className="text-xs font-semibold text-ink">No photos uploaded for this style</p>
                <p className="text-[11px] text-ink-muted mt-0.5">
                  Drop images above to add high-resolution catalog photos.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {images.map((img, idx) => {
                  const isEditingAlt = editingAltId === img.id;

                  return (
                    <div
                      key={img.id}
                      className={`p-3 rounded-xl border flex flex-col justify-between transition-all ${
                        img.isPrimary
                          ? "bg-primary/5 border-primary/40 shadow-soft-xs"
                          : "bg-surface border-border hover:border-primary/20"
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        {/* Thumbnail */}
                        <div className="relative w-20 h-20 rounded-lg overflow-hidden bg-background border border-border shrink-0">
                          <img
                            src={img.dataUrl}
                            alt={img.altText || article.title}
                            className="w-full h-full object-cover"
                          />
                          {img.isPrimary && (
                            <span className="absolute top-1 left-1 bg-primary text-white text-[9px] font-bold px-1.5 py-0.5 rounded shadow-soft-sm">
                              Primary
                            </span>
                          )}
                        </div>

                        {/* Metadata & Controls */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-1">
                            <span className="text-xs font-bold text-ink truncate font-mono num">
                              {img.width}×{img.height} • WebP
                            </span>
                            <span className="text-[10px] text-ink-muted font-mono num">
                              {(img.sizeBytes / 1024).toFixed(0)} KB
                            </span>
                          </div>

                          {/* Alt text display or inline edit */}
                          <div className="mt-1">
                            {isEditingAlt ? (
                              <div className="flex items-center gap-1">
                                <input
                                  type="text"
                                  value={altTextMap[img.id] || ""}
                                  onChange={e =>
                                    setAltTextMap({ ...altTextMap, [img.id]: e.target.value })
                                  }
                                  placeholder="Alt description..."
                                  className="w-full text-xs px-2 py-1 bg-background border border-primary rounded text-ink focus:outline-none"
                                />
                                <button
                                  type="button"
                                  onClick={() => handleSaveAltText(img.id)}
                                  className="p-1 rounded bg-primary text-white hover:bg-primary/90 cursor-pointer"
                                  title="Save Alt Text"
                                >
                                  <Icon name="check" size={14} />
                                </button>
                              </div>
                            ) : (
                              <div className="flex items-center justify-between gap-1">
                                <span className="text-[11px] text-ink-muted truncate italic">
                                  {img.altText || "No alt text"}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => setEditingAltId(img.id)}
                                  className="text-ink-muted hover:text-primary cursor-pointer p-0.5"
                                  title="Edit alt text"
                                >
                                  <Icon name="edit" size={14} />
                                </button>
                              </div>
                            )}
                          </div>

                          {/* Reorder & Primary Actions */}
                          <div className="mt-2 flex items-center justify-between gap-1 pt-2 border-t border-border">
                            {/* Order Steppers */}
                            <div className="flex items-center gap-1">
                              <button
                                type="button"
                                disabled={idx === 0}
                                onClick={() => handleMoveOrder(idx, "up")}
                                className="w-6 h-6 rounded bg-background hover:bg-surface-raised disabled:opacity-30 flex items-center justify-center text-ink-muted hover:text-ink cursor-pointer border border-border"
                                title="Move Earlier"
                              >
                                <Icon name="arrow_back" size={14} />
                              </button>
                              <button
                                type="button"
                                disabled={idx === images.length - 1}
                                onClick={() => handleMoveOrder(idx, "down")}
                                className="w-6 h-6 rounded bg-background hover:bg-surface-raised disabled:opacity-30 flex items-center justify-center text-ink-muted hover:text-ink cursor-pointer border border-border"
                                title="Move Later"
                              >
                                <Icon name="arrow_forward" size={14} />
                              </button>
                            </div>

                            {/* Set Primary Button */}
                            {!img.isPrimary && (
                              <button
                                type="button"
                                onClick={() => handleSetPrimary(img.id)}
                                className="px-2 py-0.5 rounded text-[10px] font-bold bg-background hover:bg-primary/10 hover:text-primary border border-border text-ink-muted cursor-pointer"
                              >
                                Make Primary
                              </button>
                            )}

                            {/* Delete Button */}
                            <button
                              type="button"
                              onClick={() => handleDelete(img.id)}
                              className="w-6 h-6 rounded bg-background hover:bg-danger/10 hover:text-danger text-ink-muted flex items-center justify-center cursor-pointer border border-border"
                              title="Delete photo"
                            >
                              <Icon name="delete" size={14} />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-surface border-t border-border flex items-center justify-between gap-3 shrink-0">
          <span className="text-[11px] text-ink-muted">
            Stored in client IndexedDB • Max 1200px WebP compressed
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-5 min-h-[40px] rounded-xl bg-primary text-primary-foreground font-bold text-xs hover:bg-primary/90 cursor-pointer shadow-soft-sm"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
