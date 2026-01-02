import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/db";
import JobType from "@/app/models/ats/jobType";

// GET - Get single job type by ID
export async function GET(
  request: NextRequest,
  { params }: { params:Promise<{ id: string }> }
) {
  try {
    await connectDB();
    const { id } = await params;
    const jobType = await JobType.findById({_id: id}).select("-__v");
    
    if (!jobType) {
      return NextResponse.json(
        { success: false, error: "Job Type not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: jobType });
  } catch (error: any) {
    console.error("Error fetching job type:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to fetch job type" },
      { status: 500 }
    );
  }
}

// PATCH - Update job type
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    const body = await req.json();
    const {id}= await params;

    const jobType = await JobType.findByIdAndUpdate(
      {_id: id},
      { ...body },
      { new: true, runValidators: true }
    ).select("-__v");

    if (!jobType) {
      return NextResponse.json(
        { success: false, error: "Job Type not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: jobType,
      message: "Job Type updated successfully",
    });
  } catch (error: any) {
    console.error("Error updating job type:", error);

    if (error.name === "ValidationError") {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: false, error: error.message || "Failed to update job type" },
      { status: 500 }
    );
  }
}

// DELETE - Delete job type
export async function DELETE(
  request: NextRequest,
  { params }: { params:Promise< { id: string } >}
) {
  try {
    await connectDB();
    const {id}=await params;

    const jobType = await JobType.findByIdAndDelete({_id: id});

    if (!jobType) {
      return NextResponse.json(
        { success: false, error: "Job Type not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Job Type deleted successfully",
    });
  } catch (error: any) {
    console.error("Error deleting job type:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to delete job type" },
      { status: 500 }
    );
  }
}
