import { NextRequest, NextResponse } from "next/server";
import HiringSource from "@/app/models/hiringSource";
import connectDB from "@/lib/db";
import mongoose from "mongoose";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectDB();

    const hiringSource = await HiringSource.findById(params.id);

    if (!hiringSource) {
      return NextResponse.json(
        { error: "Hiring source not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(hiringSource);
  } catch (error: any) {
    console.error("Error fetching hiring source:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch hiring source" },
      { status: 500 }
    );
  }
}

export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        await connectDB();
        const { id } = await params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return NextResponse.json(
                { success: false, error: "Invalid hiring source ID" },
                { status: 400 }
            );
        }

        const body = await request.json();

        const hiringSource = await HiringSource.findByIdAndUpdate(
            id,
            { $set: body },
            { new: true, runValidators: true }
        ).select("-__v");

        if (!hiringSource) {
            return NextResponse.json(
                { success: false, error: "Hiring source not found" },
                { status: 400 }
            );
        }

        return NextResponse.json({
            success: true,
            data: hiringSource,
            message: "Hiring source updated successfully",
        });
    } catch (error: any) {
        console.error("Error updating hiring source:", error);
        if (error.name === "ValidationError") {
            return NextResponse.json(
                { success: false, error: error.message },
                { status: 400 }
            );
        }

        return NextResponse.json(
            { success: false, error: error.message || "Failed to update hiring source" },
            { status: 500 }
        );
    }
}

export async function DELETE(
  request: NextRequest,
   { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();

    const { id } = await params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { error: "Invalid hiring source ID" },
        { status: 400 }
      );
    }

    const hiringSource = await HiringSource.findByIdAndDelete(id);

    if (!hiringSource) {
      return NextResponse.json(
        { error: "Hiring source not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ message: "Hiring source deleted successfully" });
  } catch (error: any) {
    console.error("Error deleting hiring source:", error);
    return NextResponse.json(
      { error: error.message || "Failed to delete hiring source" },
      { status: 500 }
    );
  }
}