import { S3Client, PutObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { v4 as uuidv4 } from "uuid";

const BUCKET = process.env.AWS_S3_BUCKET || process.env.AWS_BUCKET_NAME || "";

// Create a dedicated S3Client instance for presigned URLs
const s3Client = new S3Client({
  region: process.env.AWS_REGION!,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
  ...(process.env.AWS_S3_ENDPOINT && {
    endpoint: process.env.AWS_S3_ENDPOINT,
  }),
});

export async function getPresignedUploadUrl(
  fileName: string,
  fileType: string,
  folder = "hrms"
) {
  const key = `${folder}/${uuidv4()}-${fileName}`;

  const command = new PutObjectCommand({
    Bucket: BUCKET,
    Key: key,
    ContentType: fileType,
  });

  const url = await getSignedUrl(s3Client, command, {
    expiresIn: 3600, // 1 hour
  });

  return {
    key,
    url,
    publicUrl: process.env.AWS_S3_ENDPOINT 
      ? `${process.env.AWS_S3_ENDPOINT}/${BUCKET}/${key}`
      : `https://${BUCKET}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`,
  };
}

export async function getPresignedDownloadUrl(
  key: string,
  expiresIn = 3600
) {
  const command = new GetObjectCommand({
    Bucket: BUCKET,
    Key: key,
  });

  const url = await getSignedUrl(s3Client, command, {
    expiresIn,
  });

  return url;
}
