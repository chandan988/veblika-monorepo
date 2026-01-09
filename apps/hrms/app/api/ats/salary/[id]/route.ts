import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/db";
import Salary from "@/app/models/ats/salary";

// GET - Get single salary by ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    const { id } = await params;
    const salary = await Salary.findById({_id: id}).select("-__v");

    if (!salary) {
      return NextResponse.json(
        { success: false, error: "Salary not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: salary });
  } catch (error: any) {
    console.error("Error fetching salary:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to fetch salary" },
      { status: 500 }
    );
  }
}

// PATCH - Update salary
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    const body = await req.json();
    const { id } = await params;

    const salary = await Salary.findByIdAndUpdate(
      {_id: id},
      { ...body },
      { new: true, runValidators: true }
    ).select("-__v");

    if (!salary) {
      return NextResponse.json(
        { success: false, error: "Salary not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: salary,
      message: "Salary updated successfully",
    });
  } catch (error: any) {
    console.error("Error updating salary:", error);

    if (error.name === "ValidationError") {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: false, error: error.message || "Failed to update salary" },
      { status: 500 }
    );
  }
}

// DELETE - Delete salary
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();

    const { id } = await params;
    const salary = await Salary.findByIdAndDelete({_id: id});

    if (!salary) {
      return NextResponse.json(
        { success: false, error: "Salary not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Salary deleted successfully",
    });
  } catch (error: any) {
    console.error("Error deleting salary:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to delete salary" },
      { status: 500 }
    );
  }
}
