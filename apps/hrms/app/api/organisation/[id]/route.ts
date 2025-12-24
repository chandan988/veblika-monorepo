import { NextRequest, NextResponse } from "next/server";

import { Organisation } from "@/app/models/organisation.model";
import mongoose from "mongoose";

// GET - Get a single organisation by ID
export async function GET(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        

        const { id } = params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return NextResponse.json(
                { success: false, error: "Invalid organisation ID" },
                { status: 400 }
            );
        }

        const organisation = await Organisation.findById(id).select("-__v").lean();

        if (!organisation) {
            return NextResponse.json(
                { success: false, error: "Organisation not found" },
                { status: 404 }
            );
        }

        return NextResponse.json({
            success: true,
            data: organisation,
        });
    } catch (error: any) {
        console.error("Error fetching organisation:", error);
        return NextResponse.json(
            { success: false, error: error.message || "Failed to fetch organisation" },
            { status: 500 }
        );
    }
}

// PATCH - Update an organisation
export async function PATCH(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        

        const { id } = params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return NextResponse.json(
                { success: false, error: "Invalid organisation ID" },
                { status: 400 }
            );
        }

        const body = await request.json();

        // Check if email is being updated and if it already exists
        if (body.email) {
            const existingOrg = await Organisation.findOne({
                email: body.email,
                _id: { $ne: id },
            });

            if (existingOrg) {
                return NextResponse.json(
                    { success: false, error: "Organisation with this email already exists" },
                    { status: 400 }
                );
            }
        }

        const organisation = await Organisation.findByIdAndUpdate(
            id,
            { $set: body },
            { new: true, runValidators: true }
        ).select("-__v");

        if (!organisation) {
            return NextResponse.json(
                { success: false, error: "Organisation not found" },
                { status: 404 }
            );
        }

        return NextResponse.json({
            success: true,
            data: organisation,
            message: "Organisation updated successfully",
        });
    } catch (error: any) {
        console.error("Error updating organisation:", error);

        if (error.code === 11000) {
            return NextResponse.json(
                { success: false, error: "Organisation with this email already exists" },
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
            { success: false, error: error.message || "Failed to update organisation" },
            { status: 500 }
        );
    }
}

// DELETE - Delete an organisation
export async function DELETE(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        
        const { id } = params;
        
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return NextResponse.json(
                { success: false, error: "Invalid organisation ID" },
                { status: 400 }
            );
        }

        const organisation = await Organisation.findByIdAndDelete(id);

        if (!organisation) {
            return NextResponse.json(
                { success: false, error: "Organisation not found" },
                { status: 404 }
            );
        }

        return NextResponse.json({
            success: true,
            message: "Organisation deleted successfully",
            data: organisation,
        });
    } catch (error: any) {
        console.error("Error deleting organisation:", error);
        return NextResponse.json(
            { success: false, error: error.message || "Failed to delete organisation" },
            { status: 500 }
        );
    }
}
