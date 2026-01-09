import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/db";
import JobOpeningStatus from "@/app/models/ats/jobOpeningStatus";

// GET - Get all job opening statuses
export async function GET(request: NextRequest) {
    try {
        await connectDB();
        const { searchParams } = new URL(request.url);
        const page = parseInt(searchParams.get("page") || "1");
        const limit = parseInt(searchParams.get("limit") || "10");
        const search = searchParams.get("search") || "";
        const organisationId = searchParams.get("organisationId");

        const query: any = {};

        if (search) {
            query.status = { $regex: search, $options: "i" };
        }

        if (organisationId) {
            query.organisationId = organisationId;
        }

        const skip = (page - 1) * limit;

        const [jobOpeningStatuses, total] = await Promise.all([
            JobOpeningStatus.find(query)
                .select("-__v")
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .lean(),
            JobOpeningStatus.countDocuments(query),
        ]);

        return NextResponse.json({
            success: true,
            data: jobOpeningStatuses,
            pagination: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit),
            },
        });
    } catch (error: any) {
        console.error("Error fetching job opening statuses:", error);
        return NextResponse.json(
            { success: false, error: error.message || "Failed to fetch job opening statuses" },
            { status: 500 }
        );
    }
}

// POST - Create a new job opening status
export async function POST(req: Request) {
    try {
        await connectDB();
        const body = await req.json();

        const jobOpeningStatus = await JobOpeningStatus.create({
            ...body,
        });

        return NextResponse.json({ 
            success: true, 
            data: jobOpeningStatus,
            message: "Job Opening Status created successfully" 
        });
    } catch (error: any) {
        console.error("Error creating job opening status:", error);

        if (error.name === "ValidationError") {
            return NextResponse.json(
                { success: false, error: error.message },
                { status: 400 }
            );
        }

        return NextResponse.json(
            { success: false, error: error.message || "Failed to create job opening status" },
            { status: 500 }
        );
    }
}
