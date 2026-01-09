import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import connectDB from "@/lib/db";
import Branch from "@/app/models/branch";

// GET - Get a single branch by ID
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        await connectDB();
        const { id } = await params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return NextResponse.json(
                { success: false, error: "Invalid branch ID" },
                { status: 400 }
            );
        }

        const branch = await Branch.findById(id);

        if (!branch) {
            return NextResponse.json(
                { success: false, error: "Branch not found" },
                { status: 404 }
            );
        }

        return NextResponse.json({
            success: true,
            data: branch,
        });
    } catch (error: any) {
        console.error("Error fetching branch:", error);
        return NextResponse.json(
            { success: false, error: error.message || "Failed to fetch branch" },
            { status: 500 }
        );
    }
}

// PATCH - Update a branch
export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        await connectDB();
        const { id } = await params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return NextResponse.json(
                { success: false, error: "Invalid branch ID" },
                { status: 400 }
            );
        }

        const body = await request.json();

        // Check if code is being updated and if it already exists
        if (body.code) {
            const existingBranch = await Branch.findOne({
                code: body.code,
                _id: { $ne: id },
            });

            if (existingBranch) {
                return NextResponse.json(
                    { success: false, error: "Branch code already exists" },
                    { status: 400 }
                );
            }
        }

        const branch = await Branch.findByIdAndUpdate(
            id,
            { $set: body },
            { new: true, runValidators: true }
        ).select("-__v");

        if (!branch) {
            return NextResponse.json(
                { success: false, error: "Branch not found" },
                { status: 404 }
            );
        }

        return NextResponse.json({
            success: true,
            data: branch,
            message: "Branch updated successfully",
        });
    } catch (error: any) {
        console.error("Error updating branch:", error);

        if (error.code === 11000) {
            return NextResponse.json(
                { success: false, error: "Branch code already exists" },
                { status: 400 }
            );
        }

        if (error.name === "ValidationError") {
            return NextResponse.json(
                { success: false, error: error.message },
                { status: 400 }
            );
        }

        return NextResponse.json(
            { success: false, error: error.message || "Failed to update branch" },
            { status: 500 }
        );
    }
}

// DELETE - Delete a branch
export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        await connectDB();
        const { id } = await params;
        
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return NextResponse.json(
                { success: false, error: "Invalid branch ID" },
                { status: 400 }
            );
        }

        const branch = await Branch.findByIdAndDelete(id);

        if (!branch) {
            return NextResponse.json(
                { success: false, error: "Branch not found" },
                { status: 404 }
            );
        }

        return NextResponse.json({
            success: true,
            message: "Branch deleted successfully",
            data: branch,
        });
    } catch (error: any) {
        console.error("Error deleting branch:", error);
        return NextResponse.json(
            { success: false, error: error.message || "Failed to delete branch" },
            { status: 500 }
        );
    }
}
