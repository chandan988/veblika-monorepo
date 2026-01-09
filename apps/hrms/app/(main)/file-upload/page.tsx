"use client";

import { useState, useRef, type ChangeEvent } from "react";
import { Button } from "@workspace/ui/components/button";
import { 
  Upload, 
  X, 
  File, 
  Image as ImageIcon, 
  FileText, 
  Trash2, 
  ExternalLink,
  AlertCircle,
  CheckCircle2,
  Loader2
} from "lucide-react";
import { cn } from "@workspace/ui/lib/utils";

const MAX_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES = ["image/jpeg", "image/jpg", "image/png", "application/pdf"];

interface UploadedFile {
  key: string;
  publicUrl: string;
  name: string;
  type: string;
  size: number;
}

export default function FileUpload() {
  const [files, setFiles] = useState<File[]>([]);
  const [uploaded, setUploaded] = useState<UploadedFile[]>([]);
  const [uploading, setUploading] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
console.log(files,'files')
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i];
  };

  const getFileIcon = (type: string) => {
    if (type.startsWith("image/")) return <ImageIcon className="h-5 w-5" />;
    if (type === "application/pdf") return <FileText className="h-5 w-5" />;
    return <File className="h-5 w-5" />;
  };

  const handleSelect = (selectedFiles: FileList | null) => {
    setError(null);
    setSuccess(null);

    if (!selectedFiles || selectedFiles.length === 0) return;

    const selected = Array.from(selectedFiles);
    const invalid: string[] = [];
    
    const valid = selected.filter((file) => {
      if (!ALLOWED_TYPES.includes(file.type)) {
        invalid.push(`${file.name} - Invalid file type`);
        return false;
      }
      if (file.size > MAX_SIZE) {
        invalid.push(`${file.name} - File too large (max 5MB)`);
        return false;
      }
      return true;
    });

    if (invalid.length > 0) {
      setError(`Some files were rejected:\n${invalid.join("\n")}`);
    }

    setFiles((prev) => [...prev, ...valid]);
  };

  const handleFileInput = (e: ChangeEvent<HTMLInputElement>) => {
    handleSelect(e.target.files);
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    handleSelect(e.dataTransfer.files);
  };

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const upload = async () => {
    if (files.length === 0) {
      setError("Please select files to upload");
      return;
    }

    setUploading(true);
    setError(null);
    setSuccess(null);

    try {
      // Get presigned URLs
      const res = await fetch("/api/s3/presigned", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          files: files.map((f) => ({
            name: f.name,
            type: f.type,
            size: f.size,
          })),
        }),
      });
console.log(res,'res')
      if (!res.ok) {
        throw new Error("Failed to get upload URLs");
      }

      const data = await res.json();

      if (!data.success || !data.files) {
        throw new Error("Invalid response from server");
      }

      // Upload files to S3
      await Promise.all(
        data.files.map((signed: any, index: number) =>
          fetch(signed.url, {
            method: "PUT",
            headers: {
              "Content-Type": files[index].type,
            },
            body: files[index],
          }).then(response => {
            if (!response.ok) {
              throw new Error(`Failed to upload ${files[index].name}`);
            }
          })
        )
      );

      setUploaded((prev) => [...prev, ...data.files]);
      setFiles([]);
      setSuccess(`Successfully uploaded ${data.files.length} file(s)`);
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to upload files");
      console.error("Upload error:", err);
    } finally {
      setUploading(false);
    }
  };

  const deleteFile = async (file: UploadedFile) => {
    setDeleting(file.key);
    setError(null);
    setSuccess(null);

    try {
      const res = await fetch("/api/s3/delete", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key: file.key }),
      });

      if (!res.ok) {
        throw new Error("Failed to delete file");
      }

      setUploaded((prev) => prev.filter((f) => f.key !== file.key));
      setSuccess("File deleted successfully");
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete file");
      console.error("Delete error:", err);
    } finally {
      setDeleting(null);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-bold text-gray-900">File Upload Manager</h1>
          <p className="text-gray-600">Upload, manage, and share your files securely</p>
        </div>

        {/* Alert Messages */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-red-500 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <h3 className="text-sm font-medium text-red-800">Error</h3>
              <p className="text-sm text-red-700 whitespace-pre-line">{error}</p>
            </div>
            <button onClick={() => setError(null)} className="text-red-500 hover:text-red-700">
              <X className="h-4 w-4" />
            </button>
          </div>
        )}

        {success && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-start gap-3">
            <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <h3 className="text-sm font-medium text-green-800">Success</h3>
              <p className="text-sm text-green-700">{success}</p>
            </div>
            <button onClick={() => setSuccess(null)} className="text-green-500 hover:text-green-700">
              <X className="h-4 w-4" />
            </button>
          </div>
        )}

        {/* Upload Area */}
        <div className="bg-white rounded-xl shadow-md p-6 space-y-4">
          <div
            className={cn(
              "border-2 border-dashed rounded-lg p-8 transition-all duration-200",
              dragActive
                ? "border-blue-500 bg-blue-50"
                : "border-gray-300 hover:border-gray-400"
            )}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            <div className="flex flex-col items-center justify-center gap-4">
              <div className="p-4 bg-blue-50 rounded-full">
                <Upload className="h-8 w-8 text-blue-500" />
              </div>
              <div className="text-center">
                <p className="text-lg font-semibold text-gray-700">
                  Drop files here or click to browse
                </p>
                <p className="text-sm text-gray-500 mt-1">
                  Supports: JPEG, PNG, PDF (Max 5MB per file)
                </p>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                multiple
                onChange={handleFileInput}
                className="hidden"
                accept={ALLOWED_TYPES.join(",")}
              />
              <Button
                onClick={() => fileInputRef.current?.click()}
                variant="outline"
                className="mt-2"
              >
                Select Files
              </Button>
            </div>
          </div>

          {/* Selected Files List */}
          {files.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">
                  Selected Files ({files.length})
                </h3>
                <Button
                  onClick={() => setFiles([])}
                  variant="ghost"
                  size="sm"
                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                >
                  Clear All
                </Button>
              </div>
              <div className="space-y-2">
                {files.map((file, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200"
                  >
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className="text-gray-600">{getFileIcon(file.type)}</div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {file.name}
                        </p>
                        <p className="text-xs text-gray-500">{formatFileSize(file.size)}</p>
                      </div>
                    </div>
                    <Button
                      onClick={() => removeFile(index)}
                      variant="ghost"
                      size="sm"
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
              <Button
                onClick={upload}
                disabled={uploading}
                className="w-full bg-blue-600 hover:bg-blue-700"
              >
                {uploading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <Upload className="h-4 w-4 mr-2" />
                    Upload {files.length} File{files.length !== 1 ? "s" : ""}
                  </>
                )}
              </Button>
            </div>
          )}
        </div>

        {/* Uploaded Files */}
        {uploaded.length > 0 && (
          <div className="bg-white rounded-xl shadow-md p-6 space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">
              Uploaded Files ({uploaded.length})
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {uploaded.map((file) => (
                <div
                  key={file.key}
                  className="group relative p-4 bg-gradient-to-br from-white to-gray-50 rounded-lg border border-gray-200 hover:shadow-lg transition-all duration-200"
                >
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-blue-100 rounded-lg text-blue-600">
                      {getFileIcon(file.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {file.name}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        {formatFileSize(file.size)}
                      </p>
                      <div className="flex gap-2 mt-3">
                        <a
                          href={file.publicUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-xs font-medium text-blue-600 hover:text-blue-700 transition-colors"
                        >
                          <ExternalLink className="h-3 w-3" />
                          View
                        </a>
                        <button
                          onClick={() => deleteFile(file)}
                          disabled={deleting === file.key}
                          className="inline-flex items-center gap-1 text-xs font-medium text-red-600 hover:text-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                          {deleting === file.key ? (
                            <>
                              <Loader2 className="h-3 w-3 animate-spin" />
                              Deleting...
                            </>
                          ) : (
                            <>
                              <Trash2 className="h-3 w-3" />
                              Delete
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {uploaded.length === 0 && files.length === 0 && (
          <div className="bg-white rounded-xl shadow-md p-12 text-center">
            <div className="flex flex-col items-center gap-4">
              <div className="p-6 bg-gray-100 rounded-full">
                <File className="h-12 w-12 text-gray-400" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-700">No files yet</h3>
                <p className="text-sm text-gray-500 mt-1">
                  Upload your first file to get started
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
