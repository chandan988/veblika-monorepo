import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import connectDB from "@/lib/db";
import EmploymentStatus from "@/app/models/employmentStatus";

// GET - Get a single employmentStatus by ID
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        await connectDB();
        const { id } = await params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return NextResponse.json(
                { success: false, error: "Invalid employment Status ID" },
                { status: 400 }
            );
        }

        const employmentStatus = await EmploymentStatus.findById(id);

        if (!employmentStatus) {
            return NextResponse.json(
                { success: false, error: "Employment Status not found" },
                { status: 404 }
            );
        }

        return NextResponse.json({
            success: true,
            data: employmentStatus,
        });
    } catch (error: any) {
        console.error("Error fetching employment Status:", error);
        return NextResponse.json(
            { success: false, error: error.message || "Failed to fetch employmentStatus" },
            { status: 500 }
        );
    }
}

// PATCH - Update a employmentStatus
export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        await connectDB();
        const { id } = await params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return NextResponse.json(
                { success: false, error: "Invalid employment Status ID" },
                { status: 400 }
            );
        }

        const body = await request.json();

        const employmentStatus = await EmploymentStatus.findByIdAndUpdate(
            id,
            { $set: body },
            { new: true, runValidators: true }
        ).select("-__v");

        if (!employmentStatus) {
            return NextResponse.json(
                { success: false, error: "Employment Status not found" },
                { status: 404 }
            );
        }

        return NextResponse.json({
            success: true,
            data: employmentStatus,
            message: "Employment Status updated successfully",
        });
    } catch (error: any) {
        console.error("Error updating employmentStatus:", error);

        if (error.name === "ValidationError") {
            return NextResponse.json(
                { success: false, error: error.message },
                { status: 400 }
            );
        }

        return NextResponse.json(
            { success: false, error: error.message || "Failed to update employment Status" },
            { status: 500 }
        );
    }
}

// DELETE - Delete a employmentStatus
export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        await connectDB();
        const { id } = await params;
        
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return NextResponse.json(
                { success: false, error: "Invalid employment Status ID" },
                { status: 400 }
            );
        }

        const employmentStatus = await EmploymentStatus.findByIdAndDelete(id);

        if (!employmentStatus) {
            return NextResponse.json(
                { success: false, error: "Employment Status not found" },
                { status: 404 }
            );
        }

        return NextResponse.json({
            success: true,
            message: "Employment Status deleted successfully",
            data: employmentStatus,
        });
    } catch (error: any) {
        console.error("Error deleting employment Status:", error);
        return NextResponse.json(
            { success: false, error: error.message || "Failed to delete employment Status" },
            { status: 500 }
        );
    }
}
