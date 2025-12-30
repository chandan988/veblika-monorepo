import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import connectDB from "@/lib/db";
import Designation from "@/app/models/designation";

// GET - Get a single designation by ID
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        await connectDB();
        const { id } = await params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return NextResponse.json(
                { success: false, error: "Invalid designation ID" },
                { status: 400 }
            );
        }

        const designation = await Designation.findById(id);

        if (!designation) {
            return NextResponse.json(
                { success: false, error: "Designation not found" },
                { status: 404 }
            );
        }

        return NextResponse.json({
            success: true,
            data: designation,
        });
    } catch (error: any) {
        console.error("Error fetching designation:", error);
        return NextResponse.json(
            { success: false, error: error.message || "Failed to fetch designation" },
            { status: 500 }
        );
    }
}

// PATCH - Update a designation
export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        await connectDB();
        const { id } = await params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return NextResponse.json(
                { success: false, error: "Invalid designation ID" },
                { status: 400 }
            );
        }

        const body = await request.json();

        const designation = await Designation.findByIdAndUpdate(
            id,
            { $set: body },
            { new: true, runValidators: true }
        ).select("-__v");

        if (!designation) {
            return NextResponse.json(
                { success: false, error: "Designation not found" },
                { status: 404 }
            );
        }

        return NextResponse.json({
            success: true,
            data: designation,
            message: "Designation updated successfully",
        });
    } catch (error: any) {
        console.error("Error updating designation:", error);

        if (error.name === "ValidationError") {
            return NextResponse.json(
                { success: false, error: error.message },
                { status: 400 }
            );
        }

        return NextResponse.json(
            { success: false, error: error.message || "Failed to update designation" },
            { status: 500 }
        );
    }
}

// DELETE - Delete a designation
export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        await connectDB();
        const { id } = await params;
        
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return NextResponse.json(
                { success: false, error: "Invalid designation ID" },
                { status: 400 }
            );
        }

        const designation = await Designation.findByIdAndDelete(id);

        if (!designation) {
            return NextResponse.json(
                { success: false, error: "Designation not found" },
                { status: 404 }
            );
        }

        return NextResponse.json({
            success: true,
            message: "Designation deleted successfully",
            data: designation,
        });
    } catch (error: any) {
        console.error("Error deleting designation:", error);
        return NextResponse.json(
            { success: false, error: error.message || "Failed to delete designation" },
            { status: 500 }
        );
    }
}
