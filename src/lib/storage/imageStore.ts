/**
 * ============================================================================
 * ARK Platform Image Storage Layer
 * ============================================================================
 * 
 * Architecture Note:
 * This layer defines the standard `ImageStore` contract for brand logos, style
 * imagery, and per-colour variant photos.
 * 
 * CURRENT IMPLEMENTATION: IndexedDB (Client-side, zero external backend dependencies).
 * IMPORTANT: Because IndexedDB is local to the current browser profile, uploads
 * made here will be visible only in this browser session. A retailer testing on a
 * different browser/phone will not see these locally stored photos.
 * 
 * SWAP POINT FOR PRODUCTION BACKEND:
 * To migrate to Google Cloud Storage or Firebase Storage, create a class implementing
 * `ImageStore` (e.g. `FirebaseImageStore`) and export it as the singleton instance:
 * 
 * ```ts
 * class FirebaseImageStore implements ImageStore {
 *   async upload(file, options) { ...upload to firebase storage and write firestore doc... }
 *   ...
 * }
 * export const imageStore: ImageStore = new FirebaseImageStore();
 * ```
 */

export interface StoredImage {
  id: string;
  entityType: "brand" | "style" | "colour";
  entityId: string; // brand id (e.g. 'flybirds') or style id / artNumber (e.g. 'FB-101')
  colourCode?: string; // optional shade/colour code (e.g. 'BLK', 'SKN', 'WHT', 'Color')
  dataUrl: string; // WebP compressed data URL
  name: string;
  altText?: string;
  isPrimary: boolean;
  order: number;
  sizeBytes: number;
  mimeType: string;
  width: number;
  height: number;
  createdAt: string;
}

export interface ImageUploadOptions {
  entityType: "brand" | "style" | "colour";
  entityId: string;
  colourCode?: string;
  altText?: string;
  isPrimary?: boolean;
  onProgress?: (percent: number) => void;
}

export interface ImageStore {
  upload(file: File | Blob, options: ImageUploadOptions): Promise<StoredImage>;
  list(entityType: "brand" | "style" | "colour", entityId: string, colourCode?: string): Promise<StoredImage[]>;
  remove(imageId: string): Promise<void>;
  getUrl(imageId: string): Promise<string | null>;
  getPrimaryUrl(entityType: "brand" | "style" | "colour", entityId: string, colourCode?: string): Promise<string | null>;
  setPrimary(entityId: string, imageId: string, entityType?: "brand" | "style" | "colour"): Promise<void>;
  reorder(entityId: string, imageIds: string[]): Promise<void>;
  updateAltText(imageId: string, altText: string): Promise<void>;
  getAllEntityIdsWithImages(entityType: "brand" | "style" | "colour"): Promise<Set<string>>;
}

// ----------------------------------------------------------------------------
// Client-Side Image Validation, Resizing & WebP Compression
// ----------------------------------------------------------------------------

export const MAX_IMAGE_FILE_SIZE = 5 * 1024 * 1024; // 5 MB
export const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/jpg"];
export const MAX_RESIZED_DIMENSION = 1200; // max width or height in px

export function validateImageFile(file: File | Blob): { valid: boolean; error?: string } {
  if (file.size > MAX_IMAGE_FILE_SIZE) {
    const sizeMb = (file.size / (1024 * 1024)).toFixed(1);
    return {
      valid: false,
      error: `File size (${sizeMb} MB) exceeds maximum allowed size of 5 MB.`,
    };
  }

  // Type check if available
  if (file.type && !ALLOWED_IMAGE_TYPES.includes(file.type.toLowerCase())) {
    return {
      valid: false,
      error: `Invalid file type "${file.type}". Only JPG, PNG, and WebP images are supported.`,
    };
  }

  return { valid: true };
}

/**
 * Resizes an image file to max 1200px (preserving aspect ratio) and encodes it
 * as an optimized WebP data URL with upload progress reporting.
 */
export async function processAndCompressImage(
  file: File | Blob,
  maxDimension: number = MAX_RESIZED_DIMENSION,
  quality: number = 0.85,
  onProgress?: (percent: number) => void
): Promise<{ blob: Blob; dataUrl: string; width: number; height: number; sizeBytes: number }> {
  const validation = validateImageFile(file);
  if (!validation.valid) {
    throw new Error(validation.error || "Invalid image file");
  }

  if (onProgress) onProgress(15);

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Failed to read image file"));
    reader.onload = () => {
      if (onProgress) onProgress(40);
      const img = new Image();
      img.onerror = () => reject(new Error("Failed to decode image data"));
      img.onload = () => {
        if (onProgress) onProgress(65);

        let { width, height } = img;
        if (width > maxDimension || height > maxDimension) {
          if (width > height) {
            height = Math.round((height * maxDimension) / width);
            width = maxDimension;
          } else {
            width = Math.round((width * maxDimension) / height);
            height = maxDimension;
          }
        }

        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          return reject(new Error("Canvas 2D context not supported"));
        }

        // Draw and compress to WebP
        ctx.drawImage(img, 0, 0, width, height);

        if (onProgress) onProgress(85);

        // Check if toBlob with webp is supported
        canvas.toBlob(
          blob => {
            if (!blob) {
              // Fallback to dataURL if toBlob fails
              const fallbackUrl = canvas.toDataURL("image/webp", quality);
              if (onProgress) onProgress(100);
              resolve({
                blob: new Blob([fallbackUrl], { type: "image/webp" }),
                dataUrl: fallbackUrl,
                width,
                height,
                sizeBytes: fallbackUrl.length,
              });
              return;
            }

            const dataUrl = canvas.toDataURL("image/webp", quality);
            if (onProgress) onProgress(100);
            resolve({
              blob,
              dataUrl,
              width,
              height,
              sizeBytes: blob.size,
            });
          },
          "image/webp",
          quality
        );
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  });
}

// ----------------------------------------------------------------------------
// IndexedDB Implementation of ImageStore
// ----------------------------------------------------------------------------

const DB_NAME = "ARK_CATALOGUE_IMAGES_V1";
const STORE_NAME = "images";
const DB_VERSION = 1;

class IndexedDBImageStore implements ImageStore {
  private dbPromise: Promise<IDBDatabase> | null = null;
  private memoryFallback: Map<string, StoredImage> = new Map();

  private isIDBAvailable(): boolean {
    return typeof window !== "undefined" && typeof window.indexedDB !== "undefined";
  }

  private getDB(): Promise<IDBDatabase> {
    if (!this.isIDBAvailable()) {
      return Promise.reject(new Error("IndexedDB not available in this environment"));
    }

    if (this.dbPromise) return this.dbPromise;

    this.dbPromise = new Promise((resolve, reject) => {
      const request = window.indexedDB.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = event => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          const store = db.createObjectStore(STORE_NAME, { keyPath: "id" });
          store.createIndex("by_entity", ["entityType", "entityId"], { unique: false });
          store.createIndex("by_entity_colour", ["entityType", "entityId", "colourCode"], { unique: false });
          store.createIndex("by_entityType", "entityType", { unique: false });
        }
      };

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });

    return this.dbPromise;
  }

  private dispatchUpdateEvent(entityType: string, entityId: string) {
    if (typeof window !== "undefined") {
      window.dispatchEvent(
        new CustomEvent("ark:image-store-updated", {
          detail: { entityType, entityId, timestamp: Date.now() },
        })
      );
    }
  }

  async upload(file: File | Blob, options: ImageUploadOptions): Promise<StoredImage> {
    const { blob, dataUrl, width, height, sizeBytes } = await processAndCompressImage(
      file,
      MAX_RESIZED_DIMENSION,
      0.85,
      options.onProgress
    );

    const existing = await this.list(options.entityType, options.entityId, options.colourCode);
    const isFirstImage = existing.length === 0;
    const isPrimary = options.isPrimary !== undefined ? options.isPrimary : isFirstImage;

    const id = `img_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    const fileName = (file as File).name || `image_${id}.webp`;

    const record: StoredImage = {
      id,
      entityType: options.entityType,
      entityId: options.entityId,
      colourCode: options.colourCode,
      dataUrl,
      name: fileName,
      altText: options.altText || `${options.entityType} ${options.entityId}`,
      isPrimary,
      order: existing.length,
      sizeBytes,
      mimeType: "image/webp",
      width,
      height,
      createdAt: new Date().toISOString(),
    };

    if (this.isIDBAvailable()) {
      try {
        const db = await this.getDB();
        await new Promise<void>((resolve, reject) => {
          const tx = db.transaction(STORE_NAME, "readwrite");
          const store = tx.objectStore(STORE_NAME);

          // If marking this as primary, unmark other images for this entity
          if (isPrimary && existing.length > 0) {
            existing.forEach(ex => {
              if (ex.isPrimary) {
                store.put({ ...ex, isPrimary: false });
              }
            });
          }

          store.put(record);
          tx.oncomplete = () => resolve();
          tx.onerror = () => reject(tx.error);
        });
      } catch (err) {
        console.warn("IndexedDB write failed, falling back to in-memory store:", err);
        this.memoryFallback.set(id, record);
      }
    } else {
      this.memoryFallback.set(id, record);
    }

    this.dispatchUpdateEvent(options.entityType, options.entityId);
    return record;
  }

  async list(
    entityType: "brand" | "style" | "colour",
    entityId: string,
    colourCode?: string
  ): Promise<StoredImage[]> {
    if (!this.isIDBAvailable()) {
      return Array.from(this.memoryFallback.values()).filter(
        img =>
          img.entityType === entityType &&
          img.entityId.toLowerCase() === entityId.toLowerCase() &&
          (!colourCode || img.colourCode === colourCode)
      );
    }

    try {
      const db = await this.getDB();
      const records = await new Promise<StoredImage[]>((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, "readonly");
        const store = tx.objectStore(STORE_NAME);
        const index = store.index("by_entity");
        const request = index.getAll(IDBKeyRange.only([entityType, entityId]));

        request.onsuccess = () => resolve(request.result || []);
        request.onerror = () => reject(request.error);
      });

      // Filter by colour if requested and sort by order
      const filtered = colourCode
        ? records.filter(r => r.colourCode === colourCode)
        : records;

      return filtered.sort((a, b) => {
        if (a.isPrimary) return -1;
        if (b.isPrimary) return 1;
        return a.order - b.order;
      });
    } catch (err) {
      console.warn("IndexedDB read failed, returning memory fallback:", err);
      return Array.from(this.memoryFallback.values()).filter(
        img =>
          img.entityType === entityType &&
          img.entityId.toLowerCase() === entityId.toLowerCase() &&
          (!colourCode || img.colourCode === colourCode)
      );
    }
  }

  async remove(imageId: string): Promise<void> {
    let deletedRecord: StoredImage | null = null;

    if (this.isIDBAvailable()) {
      try {
        const db = await this.getDB();
        deletedRecord = await new Promise<StoredImage | null>((resolve, reject) => {
          const tx = db.transaction(STORE_NAME, "readwrite");
          const store = tx.objectStore(STORE_NAME);
          const getReq = store.get(imageId);
          getReq.onsuccess = () => {
            const rec = getReq.result;
            store.delete(imageId);
            resolve(rec || null);
          };
          getReq.onerror = () => reject(getReq.error);
        });
      } catch (err) {
        console.warn("IndexedDB delete failed:", err);
      }
    }

    if (!deletedRecord && this.memoryFallback.has(imageId)) {
      deletedRecord = this.memoryFallback.get(imageId) || null;
      this.memoryFallback.delete(imageId);
    }

    if (deletedRecord) {
      // If we deleted the primary image, promote the first remaining image
      const remaining = await this.list(deletedRecord.entityType, deletedRecord.entityId);
      if (deletedRecord.isPrimary && remaining.length > 0) {
        await this.setPrimary(deletedRecord.entityId, remaining[0].id, deletedRecord.entityType);
      }
      this.dispatchUpdateEvent(deletedRecord.entityType, deletedRecord.entityId);
    }
  }

  async getUrl(imageId: string): Promise<string | null> {
    if (!this.isIDBAvailable()) {
      const rec = this.memoryFallback.get(imageId);
      return rec ? rec.dataUrl : null;
    }

    try {
      const db = await this.getDB();
      return new Promise<string | null>((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, "readonly");
        const store = tx.objectStore(STORE_NAME);
        const req = store.get(imageId);
        req.onsuccess = () => resolve(req.result ? req.result.dataUrl : null);
        req.onerror = () => reject(req.error);
      });
    } catch {
      return null;
    }
  }

  async getPrimaryUrl(
    entityType: "brand" | "style" | "colour",
    entityId: string,
    colourCode?: string
  ): Promise<string | null> {
    const list = await this.list(entityType, entityId, colourCode);
    if (list.length === 0) return null;
    const primary = list.find(img => img.isPrimary) || list[0];
    return primary ? primary.dataUrl : null;
  }

  async setPrimary(
    entityId: string,
    imageId: string,
    entityType: "brand" | "style" | "colour" = "style"
  ): Promise<void> {
    const images = await this.list(entityType, entityId);
    if (this.isIDBAvailable()) {
      try {
        const db = await this.getDB();
        await new Promise<void>((resolve, reject) => {
          const tx = db.transaction(STORE_NAME, "readwrite");
          const store = tx.objectStore(STORE_NAME);
          images.forEach(img => {
            const isTarget = img.id === imageId;
            if (img.isPrimary !== isTarget) {
              store.put({ ...img, isPrimary: isTarget });
            }
          });
          tx.oncomplete = () => resolve();
          tx.onerror = () => reject(tx.error);
        });
      } catch (err) {
        console.warn("IndexedDB setPrimary failed:", err);
      }
    }

    this.dispatchUpdateEvent(entityType, entityId);
  }

  async reorder(entityId: string, imageIds: string[]): Promise<void> {
    const images = await this.list("style", entityId);
    if (this.isIDBAvailable()) {
      try {
        const db = await this.getDB();
        await new Promise<void>((resolve, reject) => {
          const tx = db.transaction(STORE_NAME, "readwrite");
          const store = tx.objectStore(STORE_NAME);
          imageIds.forEach((id, index) => {
            const found = images.find(img => img.id === id);
            if (found) {
              store.put({ ...found, order: index });
            }
          });
          tx.oncomplete = () => resolve();
          tx.onerror = () => reject(tx.error);
        });
      } catch (err) {
        console.warn("IndexedDB reorder failed:", err);
      }
    }

    this.dispatchUpdateEvent("style", entityId);
  }

  async updateAltText(imageId: string, altText: string): Promise<void> {
    if (this.isIDBAvailable()) {
      try {
        const db = await this.getDB();
        await new Promise<void>((resolve, reject) => {
          const tx = db.transaction(STORE_NAME, "readwrite");
          const store = tx.objectStore(STORE_NAME);
          const getReq = store.get(imageId);
          getReq.onsuccess = () => {
            if (getReq.result) {
              store.put({ ...getReq.result, altText });
            }
            resolve();
          };
          getReq.onerror = () => reject(getReq.error);
        });
      } catch (err) {
        console.warn("IndexedDB updateAltText failed:", err);
      }
    }
  }

  async getAllEntityIdsWithImages(entityType: "brand" | "style" | "colour"): Promise<Set<string>> {
    const ids = new Set<string>();
    if (!this.isIDBAvailable()) {
      this.memoryFallback.forEach(img => {
        if (img.entityType === entityType) ids.add(img.entityId.toLowerCase());
      });
      return ids;
    }

    try {
      const db = await this.getDB();
      const records = await new Promise<StoredImage[]>((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, "readonly");
        const store = tx.objectStore(STORE_NAME);
        const index = store.index("by_entityType");
        const req = index.getAll(IDBKeyRange.only(entityType));
        req.onsuccess = () => resolve(req.result || []);
        req.onerror = () => reject(req.error);
      });

      records.forEach(r => ids.add(r.entityId.toLowerCase()));
      return ids;
    } catch {
      return ids;
    }
  }
}

// ----------------------------------------------------------------------------
// Export Singleton Instance
// ----------------------------------------------------------------------------
export const imageStore: ImageStore = new IndexedDBImageStore();

// ----------------------------------------------------------------------------
// React Hook for Entity Images
// ----------------------------------------------------------------------------
import { useState, useEffect, useCallback } from "react";

export function useEntityImages(
  entityType: "brand" | "style" | "colour",
  entityId: string,
  colourCode?: string
) {
  const [images, setImages] = useState<StoredImage[]>([]);
  const [primaryUrl, setPrimaryUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const refresh = useCallback(async () => {
    if (!entityId) {
      setImages([]);
      setPrimaryUrl(null);
      setIsLoading(false);
      return;
    }
    try {
      const list = await imageStore.list(entityType, entityId, colourCode);
      setImages(list);
      const primary = list.find(img => img.isPrimary) || list[0];
      setPrimaryUrl(primary ? primary.dataUrl : null);
    } catch (err) {
      console.warn("Failed to load entity images:", err);
    } finally {
      setIsLoading(false);
    }
  }, [entityType, entityId, colourCode]);

  useEffect(() => {
    refresh();

    const handleUpdate = (e: Event) => {
      const customEvent = e as CustomEvent;
      if (
        customEvent.detail &&
        customEvent.detail.entityType === entityType &&
        customEvent.detail.entityId?.toLowerCase() === entityId?.toLowerCase()
      ) {
        refresh();
      }
    };

    if (typeof window !== "undefined") {
      window.addEventListener("ark:image-store-updated", handleUpdate);
      return () => window.removeEventListener("ark:image-store-updated", handleUpdate);
    }
  }, [refresh, entityType, entityId]);

  return { images, primaryUrl, isLoading, refresh };
}
