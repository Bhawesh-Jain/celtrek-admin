'use client';

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { X, ImageIcon, AlertCircle, Loader2 } from "lucide-react";

export type UploaderFile = { file: File, previewUrl: string, id?: string };

interface ImageUploaderProps {
  label?: string;
  value?: string; 
  existingUrl?: string; 
  onChange: (file: File | null, url?: string) => void;
  maxSize?: number; // in MB
  accept?: string;
  disabled?: boolean;
  className?: string;
  required?: boolean;
  onError?: (error: string) => void;
  enableCompression?: boolean;
  compressionQuality?: number; // 0.1 to 1.0
  maxWidth?: number;
  maxHeight?: number;
}

export default function ImageUploader({
  label = "Upload Image",
  value,
  existingUrl,
  onChange,
  maxSize = 15,
  accept = "image/*",
  disabled = false,
  className = "",
  required = false,
  onError,
  enableCompression = false,
  compressionQuality = 0,
  maxWidth = 1920,
  maxHeight = 1080
}: ImageUploaderProps) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(existingUrl || null);
  const [file, setFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isCompressing, setIsCompressing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [compressionProgress, setCompressionProgress] = useState(0);
  const [originalSize, setOriginalSize] = useState<number | null>(null);
  const [compressedSize, setCompressedSize] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const compressionAbortRef = useRef<boolean>(false);

  useEffect(() => {
    if (existingUrl && !file) {
      setPreviewUrl(existingUrl);
    }
  }, [existingUrl, file]);


  const validateFile = (file: File): string | null => {
    if (file.size > maxSize * 1024 * 1024) {
      return `File size must be less than ${maxSize}MB`;
    }
    
    if (!file.type.startsWith('image/') && accept == 'images/*') {
      return 'Please select a valid image file';
    }
    
    return null;
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getCompressionRatio = (): string => {
    if (!originalSize || !compressedSize) return '';
    const ratio = ((originalSize - compressedSize) / originalSize) * 100;
    return ratio.toFixed(1);
  };

  const compressImage = useCallback(async (file: File): Promise<File> => {
    if (!enableCompression) return file;
    
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new window.Image();
      
      img.onload = () => {
        if (compressionAbortRef.current) {
          resolve(file);
          return;
        }
        
        // Calculate new dimensions
        let { width, height } = img;
        
        if (width > maxWidth || height > maxHeight) {
          const ratio = Math.min(maxWidth / width, maxHeight / height);
          width = Math.round(width * ratio);
          height = Math.round(height * ratio);
        }
        
        canvas.width = width;
        canvas.height = height;
        
        // Draw and compress
        ctx?.drawImage(img, 0, 0, width, height);
        
        // Simulate compression progress
        let progress = 0;
        const progressInterval = setInterval(() => {
          if (compressionAbortRef.current) {
            clearInterval(progressInterval);
            resolve(file);
            return;
          }
          
          progress += 20;
          setCompressionProgress(progress);
          
          if (progress >= 100) {
            clearInterval(progressInterval);
            
            canvas.toBlob(
              (blob) => {
                if (blob && !compressionAbortRef.current) {
                  const compressedFile = new File([blob], file.name, {
                    type: file.type,
                    lastModified: Date.now(),
                  });
                  // Store compressed size for comparison
                  setCompressedSize(compressedFile.size);
                  resolve(compressedFile);
                } else {
                  resolve(file);
                }
              },
              file.type,
              compressionQuality
            );
          }
        }, 100);
      };
      
      img.onerror = () => resolve(file);
      img.src = URL.createObjectURL(file);
    });
  }, [enableCompression, compressionQuality, maxWidth, maxHeight]);

  const processFile = useCallback(async (selectedFile: File) => {
    // Abort any ongoing compression
    compressionAbortRef.current = true;
    
    setError(null);
    setIsLoading(true);
    setIsCompressing(false);
    setCompressionProgress(0);
    setOriginalSize(selectedFile.size);
    setCompressedSize(null);
    
    const validationError = validateFile(selectedFile);
    if (validationError) {
      setError(validationError);
      onError?.(validationError);
      setIsLoading(false);
      return;
    }

    try {
      // Reset abort flag for new compression
      compressionAbortRef.current = false;
      
      // Create initial preview
      const initialBlobUrl = URL.createObjectURL(selectedFile);
      setPreviewUrl(initialBlobUrl);
      
      // Start compression if enabled
      if (enableCompression) {
        setIsCompressing(true);
        const compressedFile = await compressImage(selectedFile);
        
        // Check if compression was aborted
        if (compressionAbortRef.current) {
          setIsLoading(false);
          setIsCompressing(false);
          return;
        }
        
        // Update with compressed file
        const compressedBlobUrl = URL.createObjectURL(compressedFile);
        // Clean up initial preview URL
        URL.revokeObjectURL(initialBlobUrl);
        setPreviewUrl(compressedBlobUrl);
        setFile(compressedFile);
        onChange(compressedFile, compressedBlobUrl);
      } else {
        setFile(selectedFile);
        setCompressedSize(selectedFile.size);
        onChange(selectedFile, initialBlobUrl);
      }
    } catch (err) {
      const errorMessage = 'Failed to process image';
      setError(errorMessage);
      onError?.(errorMessage);
    } finally {
      setIsLoading(false);
      setIsCompressing(false);
      setCompressionProgress(0);
    }
  }, [validateFile, onError, enableCompression, compressImage, onChange]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      processFile(selectedFile);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    if (!disabled) {
      setIsDragging(true);
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    if (disabled) return;
    
    const files = Array.from(e.dataTransfer.files);
    const imageFile = files.find(file => file.type.startsWith('image/'));
    
    if (imageFile) {
      processFile(imageFile);
    } else {
      const errorMessage = 'Please drop a valid image file';
      setError(errorMessage);
      onError?.(errorMessage);
    }
  };

  const removeImage = () => {
    // Abort any ongoing compression
    compressionAbortRef.current = true;
    
    if (previewUrl?.startsWith("blob:")) {
      URL.revokeObjectURL(previewUrl);
    }
    setFile(null);
    setPreviewUrl(null);
    setError(null);
    setIsLoading(false);
    setIsCompressing(false);
    setCompressionProgress(0);
    setOriginalSize(null);
    setCompressedSize(null);
    onChange(null);
    
    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const openFileDialog = () => {
    if (!disabled) {
      fileInputRef.current?.click();
    }
  };

  // Cleanup blob URLs and abort compression on unmount
  useEffect(() => {
    return () => {
      compressionAbortRef.current = true;
      if (previewUrl?.startsWith("blob:")) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  return (
    <div className={`space-y-2 ${className}`}>
      <label className={`block text-sm font-medium ${disabled ? 'text-gray-400' : ''}`}>
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      
      <div
        className={`
          border-2 border-dashed rounded-lg p-4 text-center transition-all duration-200
          ${isDragging ? 'border-primary bg-primary/5' : 'border-gray-300'}
          ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:border-primary/50'}
          ${error ? 'border-red-300 bg-red-50' : ''}
        `}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={!previewUrl ? openFileDialog : undefined}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if ((e.key === 'Enter' || e.key === ' ') && !previewUrl && !disabled) {
            e.preventDefault();
            openFileDialog();
          }
        }}
        aria-label={previewUrl ? 'Image preview' : 'Upload image area'}
      >
        {isLoading || isCompressing ? (
          <div className="flex flex-col items-center gap-3 py-8">
            <div className="relative">
              <Loader2 className="w-8 h-8 text-primary animate-spin" />
              {isCompressing && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-6 h-6 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
                </div>
              )}
            </div>
            <div className="space-y-2 text-center">
              <span className="text-sm font-medium text-gray-600">
                {isCompressing ? 'Compressing image...' : 'Processing...'}
              </span>
              {isCompressing && (
                <div className="w-48 mx-auto">
                  <div className="bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-primary h-2 rounded-full transition-all duration-300"
                      style={{ width: `${compressionProgress}%` }}
                    />
                  </div>
                  <span className="text-xs text-gray-500 mt-1 block">
                    {compressionProgress}% complete
                  </span>
                </div>
              )}
            </div>
          </div>
        ) : previewUrl ? (
          <div className="relative inline-block group">
            <Image
              src={previewUrl}
              alt="Preview"
              width={200}
              height={150}
              className="object-cover rounded shadow-sm"
            />
            <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity rounded" />
            <Button
              type="button"
              variant="destructive"
              size="sm"
              className="absolute top-2 right-2 w-7 h-7 p-0 shadow-sm opacity-80 hover:opacity-100"
              onClick={(e) => {
                e.stopPropagation();
                removeImage();
              }}
              disabled={disabled}
              aria-label="Remove image"
            >
              <X className="w-4 h-4" />
            </Button>
            {!disabled && (
              <Button
                type="button"
                variant="secondary"
                size="sm"
                className="absolute bottom-2 left-2 h-7 px-2 text-xs shadow-sm opacity-80 hover:opacity-100"
                onClick={(e) => {
                  e.stopPropagation();
                  openFileDialog();
                }}
                aria-label="Change image"
              >
                Change
              </Button>
            )}
          </div>
        ) : (
          <div className="flex flex-col items-center gap-3 py-8">
            <div className="p-3 bg-gray-100 rounded-full">
              <ImageIcon className="w-8 h-8 text-gray-400" />
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium text-gray-600">
                {isDragging ? 'Drop your image here' : 'Click to upload or drag and drop'}
              </p>
              <p className="text-xs text-gray-500">
                Supports: PNG, JPG, GIF up to {maxSize}MB
                {enableCompression && (
                  <span className="block mt-1">
                    Images will be compressed to {compressionQuality * 100}% quality
                  </span>
                )}
              </p>
            </div>
          </div>
        )}
        
        <input
          ref={fileInputRef}
          type="file"
          accept={accept}
          onChange={handleImageChange}
          className="hidden"
          disabled={disabled}
          aria-describedby={error ? 'upload-error' : undefined}
        />
      </div>
      
      {/* File Size Information */}
      {originalSize && compressedSize && (
        <div className="text-xs text-gray-600 bg-gray-50 p-2 rounded space-y-1">
          <div className="flex justify-between">
            <span>Original:</span>
            <span className="font-medium">{formatFileSize(originalSize)}</span>
          </div>
          <div className="flex justify-between">
            <span>Compressed:</span>
            <span className="font-medium">{formatFileSize(compressedSize)}</span>
          </div>
          {getCompressionRatio() && (
            <div className="flex justify-between text-green-600">
              <span>Saved:</span>
              <span className="font-medium">{getCompressionRatio()}%</span>
            </div>
          )}
        </div>
      )}
      
      {error && (
        <div 
          id="upload-error"
          className="flex items-center gap-2 text-sm text-red-600 bg-red-50 p-2 rounded"
          role="alert"
        >
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
}