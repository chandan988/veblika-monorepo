import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/db";
import JobType from "@/app/models/ats/jobType";

// GET - Get all job types
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
            query.type = { $regex: search, $options: "i" };
        }

        if (organisationId) {
            query.organisationId = organisationId;
        }

        const skip = (page - 1) * limit;

        const [jobTypes, total] = await Promise.all([
            JobType.find(query)
                .select("-__v")
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .lean(),
            JobType.countDocuments(query),
        ]);

        return NextResponse.json({
            success: true,
            data: jobTypes,
            pagination: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit),
            },
        });
    } catch (error: any) {
        console.error("Error fetching job types:", error);
        return NextResponse.json(
            { success: false, error: error.message || "Failed to fetch job types" },
            { status: 500 }
        );
    }
}

// POST - Create a new job type
export async function POST(req: Request) {
    try {
        await connectDB();
        const body = await req.json();

        const jobType = await JobType.create({
            ...body,
        });

        return NextResponse.json({ 
            success: true, 
            data: jobType,
            message: "Job Type created successfully" 
        });
    } catch (error: any) {
        console.error("Error creating job type:", error);

        if (error.name === "ValidationError") {
            return NextResponse.json(
                { success: false, error: error.message },
                { status: 400 }
            );
        }

        return NextResponse.json(
            { success: false, error: error.message || "Failed to create job type" },
            { status: 500 }
        );
    }
}
