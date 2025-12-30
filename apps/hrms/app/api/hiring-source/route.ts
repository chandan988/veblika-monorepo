import { NextRequest, NextResponse } from "next/server";
import HiringSource from "@/app/models/hiringSource";
import connectDB from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const search = searchParams.get("search") || "";
    const organisationId = searchParams.get("organisationId");

    if (!organisationId) {
      return NextResponse.json(
        { error: "Organisation ID is required" },
        { status: 400 }
      );
    }

    const query: any = { organisationId };

    if (search) {
      query.source = { $regex: search, $options: "i" };
    }

    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      HiringSource.find(query).skip(skip).limit(limit).sort({ createdAt: -1 }),
      HiringSource.countDocuments(query),
    ]);

    return NextResponse.json({
      data,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error: any) {
    console.error("Error fetching hiring sources:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch hiring sources" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const body = await request.json();
    console.log("Request body:", body);

    const { source, organisationId, } = body;

    if (!source || !organisationId) {
      return NextResponse.json(
        { error: "Source and organisation ID are required" },
        { status: 400 }
      );
    }

    // Check if hiring source already exists
    const existingSource = await HiringSource.findOne({
      source: { $regex: new RegExp(`^${source}$`, "i") },
      organisationId,
    });

    if (existingSource) {
      return NextResponse.json(
        { error: "Hiring source already exists" },
        { status: 400 }
      );

    }

    const hiringSource = await HiringSource.create({
      source,
      organisationId,
    });

    return NextResponse.json(hiringSource, { status: 201 });
  } catch (error: any) {
    console.error("Error creating hiring source:", error);
    return NextResponse.json(
      { error: error.message || "Failed to create hiring source"},
      { status: 500 }
    );
  }
}