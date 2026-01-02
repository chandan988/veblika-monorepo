import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/db";
import JobOpening from "@/app/models/ats/jobOpening";

// GET - Get all job openings
export async function GET(request: NextRequest) {
    try {
        await connectDB();
        const { searchParams } = new URL(request.url);
        const page = parseInt(searchParams.get("page") || "1");
        const limit = parseInt(searchParams.get("limit") || "10");
        const search = searchParams.get("search") || "";
        const organisationId = searchParams.get("organisationId");
        const jobOpeningStatus = searchParams.get("jobOpeningStatus");
        const jobType = searchParams.get("jobType");
        const industry = searchParams.get("industry");
        const isRemote = searchParams.get("isRemote");

        const query: any = {};

        if (search) {
            query.$or = [
                { title: { $regex: search, $options: "i" } },
                { organisation: { $regex: search, $options: "i" } },
                { description: { $regex: search, $options: "i" } },
            ];
        }

        if (organisationId) {
            query.organisationId = organisationId;
        }

        if (jobOpeningStatus) {
            query.jobOpeningStatus = jobOpeningStatus;
        }

        if (jobType) {
            query.jobType = jobType;
        }

        if (industry) {
            query.industry = industry;
        }

        if (isRemote !== null && isRemote !== undefined) {
            query.isRemote = isRemote === "true";
        }

        const skip = (page - 1) * limit;

        const [jobOpenings, total] = await Promise.all([
            JobOpening.find(query)
                .select("-__v")
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .lean(),
            JobOpening.countDocuments(query),
        ]);

        return NextResponse.json({
            success: true,
            data: jobOpenings,
            pagination: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit),
            },
        });
    } catch (error: any) {
        console.error("Error fetching job openings:", error);
        return NextResponse.json(
            { success: false, error: error.message || "Failed to fetch job openings" },
            { status: 500 }
        );
    }
}

// POST - Create a new job opening
export async function POST(req: Request) {
    try {
        await connectDB();
        const body = await req.json();

        // Check if job opening with same title already exists for this organization
        const existingJobOpening = await JobOpening.findOne({
            title: body.title,
            organisationId: body.organisationId,
        });

        if (existingJobOpening) {
            return NextResponse.json(
                { success: false, error: "A job opening with this title already exists" },
                { status: 400 }
            );
        }

        const jobOpening = await JobOpening.create(body);

        return NextResponse.json(
            {
                success: true,
                data: jobOpening,
                message: "Job opening created successfully",
            },
            { status: 201 }
        );
    } catch (error: any) {
        console.error("Error creating job opening:", error);
        return NextResponse.json(
            { success: false, error: error.message || "Failed to create job opening" },
            { status: 500 }
        );
    }
}
