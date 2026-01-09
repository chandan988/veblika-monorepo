import { NextResponse } from "next/server";
import { getPresignedUploadUrl } from "@/lib/s3-presigned";
import { validateFile } from "@/lib/file-validation";

export async function POST(req: Request) {
  const body = await req.json();
  const files = body.files as {
    name: string;
    type: string;
    size: number;
  }[];

  const result = [];

  for (const file of files) {
    validateFile(file);

    const signed = await getPresignedUploadUrl(
      file.name,
      file.type,
      "users"
    );

    result.push(signed);
  }

  return NextResponse.json({
    success: true,
    files: result,
  });
}
