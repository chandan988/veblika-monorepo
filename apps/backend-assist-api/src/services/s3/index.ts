import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
  HeadObjectCommand,
} from "@aws-sdk/client-s3"
import { Upload } from "@aws-sdk/lib-storage"
import { config } from "../../config"
import { logger } from "../../config/logger"
import { v4 as uuidv4 } from "uuid"

// Initialize S3 Client
const s3Client = new S3Client({
  region: config.aws.region,
  credentials: {
    accessKeyId: config.aws.accessKeyId,
    secretAccessKey: config.aws.secretAccessKey,
  },
  ...(config.aws.s3.endpoint && { endpoint: config.aws.s3.endpoint }),
})

const BUCKET_NAME = config.aws.s3.bucket

export interface UploadFileOptions {
  orgId: string
  fileName: string
  fileBuffer: Buffer
  mimeType: string
  folder?: string // Additional folder path (e.g., 'attachments/gmail')
  metadata?: Record<string, string>
}

export interface UploadedFile {
  key: string
  url: string
  bucket: string
  fileName: string
  mimeType: string
  size: number
}

/**
 * Generate a unique S3 key with orgId prefix for organization isolation
 * Format: {orgId}/{folder}/{uuid}-{originalFileName}
 */
const generateS3Key = (
  orgId: string,
  fileName: string,
  folder?: string
): string => {
  const sanitizedFileName = fileName.replace(/[^a-zA-Z0-9._-]/g, "_")
  const uniqueId = uuidv4()
  const basePath = folder ? `${orgId}/${folder}` : orgId
  return `${basePath}/${uniqueId}-${sanitizedFileName}`
}

/**
 * Get the public URL for an S3 object
 */
const getS3Url = (key: string): string => {
  if (config.aws.s3.endpoint) {
    // For S3-compatible services (MinIO, etc.)
    return `${config.aws.s3.endpoint}/${BUCKET_NAME}/${key}`
  }
  // Standard AWS S3 URL
  return `https://${BUCKET_NAME}.s3.${config.aws.region}.amazonaws.com/${key}`
}

export const s3Service = {
  /**
   * Upload a file to S3
   */
  uploadFile: async (options: UploadFileOptions): Promise<UploadedFile> => {
    const { orgId, fileName, fileBuffer, mimeType, folder, metadata } = options

    const key = generateS3Key(orgId, fileName, folder)

    try {
      // Use multipart upload for larger files (handled automatically)
      const upload = new Upload({
        client: s3Client,
        params: {
          Bucket: BUCKET_NAME,
          Key: key,
          Body: fileBuffer,
          ContentType: mimeType,
          Metadata: {
            orgId,
            originalFileName: fileName,
            ...metadata,
          },
        },
      })

      await upload.done()

      const url = getS3Url(key)

      logger.info(
        {
          key,
          bucket: BUCKET_NAME,
          fileName,
          mimeType,
          size: fileBuffer.length,
          orgId,
        },
        "File uploaded to S3 successfully"
      )

      return {
        key,
        url,
        bucket: BUCKET_NAME,
        fileName,
        mimeType,
        size: fileBuffer.length,
      }
    } catch (error) {
      logger.error(
        { error, key, fileName, orgId },
        "Failed to upload file to S3"
      )
      throw error
    }
  },

  /**
   * Upload multiple files to S3
   */
  uploadFiles: async (
    files: UploadFileOptions[]
  ): Promise<UploadedFile[]> => {
    const results: UploadedFile[] = []

    for (const file of files) {
      try {
        const result = await s3Service.uploadFile(file)
        results.push(result)
      } catch (error) {
        logger.error(
          { error, fileName: file.fileName, orgId: file.orgId },
          "Failed to upload file in batch"
        )
        // Continue with other files even if one fails
      }
    }

    return results
  },

  /**
   * Get a file from S3
   */
  getFile: async (key: string): Promise<Buffer> => {
    try {
      const command = new GetObjectCommand({
        Bucket: BUCKET_NAME,
        Key: key,
      })

      const response = await s3Client.send(command)

      if (!response.Body) {
        throw new Error("Empty response body from S3")
      }

      // Convert stream to buffer
      const chunks: Uint8Array[] = []
      for await (const chunk of response.Body as AsyncIterable<Uint8Array>) {
        chunks.push(chunk)
      }

      return Buffer.concat(chunks)
    } catch (error) {
      logger.error({ error, key }, "Failed to get file from S3")
      throw error
    }
  },

  /**
   * Delete a file from S3
   */
  deleteFile: async (key: string): Promise<void> => {
    try {
      const command = new DeleteObjectCommand({
        Bucket: BUCKET_NAME,
        Key: key,
      })

      await s3Client.send(command)

      logger.info({ key }, "File deleted from S3")
    } catch (error) {
      logger.error({ error, key }, "Failed to delete file from S3")
      throw error
    }
  },

  /**
   * Check if a file exists in S3
   */
  fileExists: async (key: string): Promise<boolean> => {
    try {
      const command = new HeadObjectCommand({
        Bucket: BUCKET_NAME,
        Key: key,
      })

      await s3Client.send(command)
      return true
    } catch (error: any) {
      if (error.name === "NotFound" || error.$metadata?.httpStatusCode === 404) {
        return false
      }
      throw error
    }
  },

  /**
   * Get the public URL for an S3 key
   */
  getUrl: (key: string): string => {
    return getS3Url(key)
  },
}
