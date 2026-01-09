import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/db";
import JobOpening from "@/app/models/ats/jobOpening";
import { s3Service } from "@/services/s3";

// POST - Upload file(s) to a job opening
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectDB();

    const formData = await request.formData();
    const files = formData.getAll("files") as File[];
    const organisationId = formData.get("organisationId") as string;
    const bucketName = formData.get("bucketName") as string | undefined;

    if (!files || files.length === 0) {
      return NextResponse.json(
        { success: false, error: "No files provided" },
        { status: 400 }
      );
    }

    if (!organisationId) {
      return NextResponse.json(
        { success: false, error: "Organisation ID is required" },
        { status: 400 }
      );
    }

    // Find the job opening
    const jobOpening = await JobOpening.findById(params.id);
    if (!jobOpening) {
      return NextResponse.json(
        { success: false, error: "Job opening not found" },
        { status: 404 }
      );
    }

    // Upload files to S3
    const uploadedFiles = [];
    for (const file of files) {
      const buffer = Buffer.from(await file.arrayBuffer());
      
      const uploadResult = await s3Service.uploadFile({
        orgId: organisationId,
        fileName: file.name,
        fileBuffer: buffer,
        mimeType: file.type,
        folder: `job-openings/${params.id}`,
        bucketName, // Will use default if not provided
        metadata: {
          jobOpeningId: params.id,
          uploadedBy: "system", // You can add user info here
        },
      });

      uploadedFiles.push({
        key: uploadResult.key,
        url: uploadResult.url,
        fileName: uploadResult.fileName,
        mimeType: uploadResult.mimeType,
        size: uploadResult.size,
        uploadedAt: new Date(),
      });
    }

    // Update job opening with new attachments
    jobOpening.attachments = jobOpening.attachments || [];
    jobOpening.attachments.push(...uploadedFiles);
    await jobOpening.save();

    return NextResponse.json({
      success: true,
      data: {
        attachments: uploadedFiles,
        jobOpening,
      },
      message: `${uploadedFiles.length} file(s) uploaded successfully`,
    });
  } catch (error: any) {
    console.error("Error uploading files:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to upload files" },
      { status: 500 }
    );
  }
}

// DELETE - Remove an attachment from a job opening
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectDB();

    const { searchParams } = new URL(request.url);
    const attachmentKey = searchParams.get("key");
    const bucketName = searchParams.get("bucketName");

    if (!attachmentKey) {
      return NextResponse.json(
        { success: false, error: "Attachment key is required" },
        { status: 400 }
      );
    }

    // Find the job opening
    const jobOpening = await JobOpening.findById(params.id);
    if (!jobOpening) {
      return NextResponse.json(
        { success: false, error: "Job opening not found" },
        { status: 404 }
      );
    }

    // Find the attachment
    const attachmentIndex = jobOpening.attachments?.findIndex(
      (att: any) => att.key === attachmentKey
    );

    if (attachmentIndex === undefined || attachmentIndex === -1) {
      return NextResponse.json(
        { success: false, error: "Attachment not found" },
        { status: 404 }
      );
    }

    // Delete from S3
    await s3Service.deleteFile(attachmentKey, bucketName || undefined);

    // Remove from job opening
    jobOpening.attachments?.splice(attachmentIndex, 1);
    await jobOpening.save();

    return NextResponse.json({
      success: true,
      message: "Attachment deleted successfully",
      data: jobOpening,
    });
  } catch (error: any) {
    console.error("Error deleting attachment:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to delete attachment" },
      { status: 500 }
    );
  }
}