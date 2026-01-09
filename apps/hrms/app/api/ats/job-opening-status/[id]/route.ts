import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/db";
import JobOpeningStatus from "@/app/models/ats/jobOpeningStatus";

// GET - Get single job opening status by ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    const { id } = await params;
    const jobOpeningStatus = await JobOpeningStatus.findById({_id: id}).select("-__v");
    if (!jobOpeningStatus) {
      return NextResponse.json(
        { success: false, error: "Job Opening Status not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: jobOpeningStatus });
  } catch (error: any) {
    console.error("Error fetching job opening status:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to fetch job opening status" },
      { status: 500 }
    );
  }
}

// PATCH - Update job opening status
export async function PATCH(
  req: Request,
  { params }: { params: Promise< { id: string }> }
) {
  try {
    await connectDB();
    const body = await req.json();
    const { id } = await params;

    const jobOpeningStatus = await JobOpeningStatus.findByIdAndUpdate(
      {_id: id},
      { ...body },
      { new: true, runValidators: true }
    ).select("-__v");

    if (!jobOpeningStatus) {
      return NextResponse.json(
        { success: false, error: "Job Opening Status not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: jobOpeningStatus,
      message: "Job Opening Status updated successfully",
    });
  } catch (error: any) {
    console.error("Error updating job opening status:", error);

    if (error.name === "ValidationError") {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: false, error: error.message || "Failed to update job opening status" },
      { status: 500 }
    );
  }
}

// DELETE - Delete job opening status
export async function DELETE(
  request: NextRequest,
  { params }: { params:Promise< { id: string }> }
) {
  try {
    await connectDB();
const {id}=await params;
    const jobOpeningStatus = await JobOpeningStatus.findByIdAndDelete({_id: id});

    if (!jobOpeningStatus) {
      return NextResponse.json(
        { success: false, error: "Job Opening Status not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Job Opening Status deleted successfully",
    });
  } catch (error: any) {
    console.error("Error deleting job opening status:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to delete job opening status" },
      { status: 500 }
    );
  }
}
