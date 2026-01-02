import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/db";
import WorkExperience from "@/app/models/ats/workExperience";

// GET - Get single work experience by ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    const { id } = await params;
    const workExperience = await WorkExperience.findById({_id: id}).select("-__v");
    if (!workExperience) {
      return NextResponse.json(
        { success: false, error: "Work Experience not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: workExperience });
  } catch (error: any) {
    console.error("Error fetching work experience:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to fetch work experience" },
      { status: 500 }
    );
  }
}

// PATCH - Update work experience
export async function PATCH(
  req: Request,
     { params }: { params: Promise<{ id: string }> }

) {
  try {
    await connectDB();
    
    const body = await req.json();
        const { id } = await params;

    const workExperience = await WorkExperience.findByIdAndUpdate(
     {_id: id},
      { ...body },
      { new: true, runValidators: true }
    ).select("-__v");

    if (!workExperience) {
      return NextResponse.json(
        { success: false, error: "Work Experience not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: workExperience,
      message: "Work Experience updated successfully",
    });
  } catch (error: any) {
    console.error("Error updating work experience:", error);

    if (error.name === "ValidationError") {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: false, error: error.message || "Failed to update work experience" },
      { status: 500 }
    );
  }
}

// DELETE - Delete work experience
export async function DELETE(
  request: NextRequest,
  { params }: { params:Promise<{ id: string }> }
) {
  try {
    await connectDB();

    const { id } = await params;
    const workExperience = await WorkExperience.findByIdAndDelete({_id: id});

    if (!workExperience) {
      return NextResponse.json(
        { success: false, error: "Work Experience not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Work Experience deleted successfully",
    });
  } catch (error: any) {
    console.error("Error deleting work experience:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to delete work experience" },
      { status: 500 }
    );
  }
}
