import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/db";
import JobOpening from "@/app/models/ats/jobOpening";

// GET - Get a single job opening by ID
export async function GET(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        await connectDB();
        const jobOpening = await JobOpening.findById(params.id).select("-__v");

        if (!jobOpening) {
            return NextResponse.json(
                { success: false, error: "Job opening not found" },
                { status: 404 }
            );
        }

        return NextResponse.json({
            success: true,
            data: jobOpening,
        });
    } catch (error: any) {
        console.error("Error fetching job opening:", error);
        return NextResponse.json(
            { success: false, error: error.message || "Failed to fetch job opening" },
            { status: 500 }
        );
    }
}

// PATCH - Update a job opening
export async function PATCH(
    req: Request,
    { params }: { params: { id: string } }
) {
    try {
        await connectDB();
        const body = await req.json();

        const jobOpening = await JobOpening.findByIdAndUpdate(
            params.id,
            { $set: body },
            { new: true, runValidators: true }
        );

        if (!jobOpening) {
            return NextResponse.json(
                { success: false, error: "Job opening not found" },
                { status: 404 }
            );
        }

        return NextResponse.json({
            success: true,
            data: jobOpening,
            message: "Job opening updated successfully",
        });
    } catch (error: any) {
        console.error("Error updating job opening:", error);
        return NextResponse.json(
            { success: false, error: error.message || "Failed to update job opening" },
            { status: 500 }
        );
    }
}

// DELETE - Delete a job opening
export async function DELETE(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        await connectDB();
        const jobOpening = await JobOpening.findByIdAndDelete(params.id);

        if (!jobOpening) {
            return NextResponse.json(
                { success: false, error: "Job opening not found" },
                { status: 404 }
            );
        }

        return NextResponse.json({
            success: true,
            message: "Job opening deleted successfully",
        });
    } catch (error: any) {
        console.error("Error deleting job opening:", error);
        return NextResponse.json(
            { success: false, error: error.message || "Failed to delete job opening" },
            { status: 500 }
        );
    }
}
