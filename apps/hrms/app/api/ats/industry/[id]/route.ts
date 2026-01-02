import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/db";
import Industry from "@/app/models/ats/industry";

// GET - Get single industry by ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    const { id } = await params;
    const industry = await Industry.findById({_id: id}).select("-__v");
    if (!industry) {
      return NextResponse.json(
        { success: false, error: "Industry not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: industry });
  } catch (error: any) {
    console.error("Error fetching industry:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to fetch industry" },
      { status: 500 }
    );
  }
}

// PATCH - Update industry
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    const body = await req.json();
    const { id } = await params;

    const industry = await Industry.findByIdAndUpdate(
      {_id: id},
      { ...body },
      { new: true, runValidators: true }
    ).select("-__v");

    if (!industry) {
      return NextResponse.json(
        { success: false, error: "Industry not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: industry,
      message: "Industry updated successfully",
    });
  } catch (error: any) {
    console.error("Error updating industry:", error);

    if (error.name === "ValidationError") {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: false, error: error.message || "Failed to update industry" },
      { status: 500 }
    );
  }
}

// DELETE - Delete industry
export async function DELETE(
  request: NextRequest,
  { params }: { params:Promise< { id: string }> }
) {
  try {
    await connectDB();
    const {id}=await params;

    const industry = await Industry.findByIdAndDelete({_id: id});

    if (!industry) {
      return NextResponse.json(
        { success: false, error: "Industry not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Industry deleted successfully",
    });
  } catch (error: any) {
    console.error("Error deleting industry:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to delete industry" },
      { status: 500 }
    );
  }
}
