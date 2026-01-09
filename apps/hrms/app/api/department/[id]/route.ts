import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import connectDB from "@/lib/db";
import Department from "@/app/models/department";

// GET - Get a single department by ID
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        await connectDB();
        const { id } = await params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return NextResponse.json(
                { success: false, error: "Invalid department ID" },
                { status: 400 }
            );
        }

        const department = await Department.findById(id);

        if (!department) {
            return NextResponse.json(
                { success: false, error: "Department not found" },
                { status: 404 }
            );
        }

        return NextResponse.json({
            success: true,
            data: department,
        });
    } catch (error: any) {
        console.error("Error fetching department:", error);
        return NextResponse.json(
            { success: false, error: error.message || "Failed to fetch department" },
            { status: 500 }
        );
    }
}

// PATCH - Update a department
export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        await connectDB();
        const { id } = await params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return NextResponse.json(
                { success: false, error: "Invalid department ID" },
                { status: 400 }
            );
        }

        const body = await request.json();

        // Check if code is being updated and if it already exists
        if (body.code) {
            const existingDepartment = await Department.findOne({
                code: body.code,
                _id: { $ne: id },
            });

            if (existingDepartment) {
                return NextResponse.json(
                    { success: false, error: "Department code already exists" },
                    { status: 400 }
                );
            }
        }

        const department = await Department.findByIdAndUpdate(
            id,
            { $set: body },
            { new: true, runValidators: true }
        ).select("-__v");

        if (!department) {
            return NextResponse.json(
                { success: false, error: "Department not found" },
                { status: 404 }
            );
        }

        return NextResponse.json({
            success: true,
            data: department,
            message: "Department updated successfully",
        });
    } catch (error: any) {
        console.error("Error updating department:", error);

        if (error.code === 11000) {
            return NextResponse.json(
                { success: false, error: "Department code already exists" },
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
            { success: false, error: error.message || "Failed to update department" },
            { status: 500 }
        );
    }
}

// DELETE - Delete a department
export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        await connectDB();
        const { id } = await params;
        
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return NextResponse.json(
                { success: false, error: "Invalid department ID" },
                { status: 400 }
            );
        }

        const department = await Department.findByIdAndDelete(id);

        if (!department) {
            return NextResponse.json(
                { success: false, error: "Department not found" },
                { status: 404 }
            );
        }

        return NextResponse.json({
            success: true,
            message: "Department deleted successfully",
            data: department,
        });
    } catch (error: any) {
        console.error("Error deleting department:", error);
        return NextResponse.json(
            { success: false, error: error.message || "Failed to delete department" },
            { status: 500 }
        );
    }
}
