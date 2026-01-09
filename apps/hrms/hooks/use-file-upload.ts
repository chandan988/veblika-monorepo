import { useState } from "react";
import { toast } from "sonner";

export interface UploadFileOptions {
  endpoint: string; // API endpoint for upload
  files: File[];
  organisationId: string;
  bucketName?: string;
  onSuccess?: (data: any) => void;
  onError?: (error: string) => void;
}

export interface DeleteFileOptions {
  endpoint: string; // API endpoint for deletion
  fileKey: string;
  bucketName?: string;
  onSuccess?: (data: any) => void;
  onError?: (error: string) => void;
}

export function useFileUpload() {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const uploadFiles = async (options: UploadFileOptions) => {
    const { endpoint, files, organisationId, bucketName, onSuccess, onError } = options;

    if (!files || files.length === 0) {
      toast.error("No files selected");
      return;
    }
    
    setIsUploading(true);
    setUploadProgress(0);

    try {
      const formData = new FormData();
      
      // Append all files
      files.forEach((file) => {
        formData.append("files", file);
      });
      
      formData.append("organisationId", organisationId);
      if (bucketName) {
        formData.append("bucketName", bucketName);
      }

      const response = await fetch(endpoint, {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || "Failed to upload files");
      }

      toast.success(data.message || "Files uploaded successfully");
      setUploadProgress(100);
      
      if (onSuccess) {
        onSuccess(data);
      }

      return data;
    } catch (error: any) {
      const errorMessage = error.message || "Failed to upload files";
      toast.error(errorMessage);
      
      if (onError) {
        onError(errorMessage);
      }
      
      throw error;
    } finally {
      setIsUploading(false);
      setTimeout(() => setUploadProgress(0), 1000);
    }
  };

  const deleteFile = async (options: DeleteFileOptions) => {
    const { endpoint, fileKey, bucketName, onSuccess, onError } = options;

    try {
      const url = new URL(endpoint);
      url.searchParams.append("key", fileKey);
      if (bucketName) {
        url.searchParams.append("bucketName", bucketName);
      }

      const response = await fetch(url.toString(), {
        method: "DELETE",
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || "Failed to delete file");
      }

      toast.success("File deleted successfully");
      
      if (onSuccess) {
        onSuccess(data);
      }

      return data;
    } catch (error: any) {
      const errorMessage = error.message || "Failed to delete file";
      toast.error(errorMessage);
      
      if (onError) {
        onError(errorMessage);
      }
      
      throw error;
    }
  };

  return {
    uploadFiles,
    deleteFile,
    isUploading,
    uploadProgress,
  };
}
