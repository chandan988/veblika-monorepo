import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/db";
import WorkExperience from "@/app/models/ats/workExperience";

// GET - Get all work experiences
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
            query.experience = { $regex: search, $options: "i" };
        }

        if (organisationId) {
            query.organisationId = organisationId;
        }

        const skip = (page - 1) * limit;

        const [workExperiences, total] = await Promise.all([
            WorkExperience.find(query)
                .select("-__v")
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .lean(),
            WorkExperience.countDocuments(query),
        ]);

        return NextResponse.json({
            success: true,
            data: workExperiences,
            pagination: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit),
            },
        });
    } catch (error: any) {
        console.error("Error fetching work experiences:", error);
        return NextResponse.json(
            { success: false, error: error.message || "Failed to fetch work experiences" },
            { status: 500 }
        );
    }
}

// POST - Create a new work experience
export async function POST(req: Request) {
    try {
        await connectDB();
        const body = await req.json();

        const workExperience = await WorkExperience.create({
            ...body,
        });

        return NextResponse.json({ 
            success: true, 
            data: workExperience,
            message: "Work Experience created successfully" 
        });
    } catch (error: any) {
        console.error("Error creating work experience:", error);

        if (error.name === "ValidationError") {
            return NextResponse.json(
                { success: false, error: error.message },
                { status: 400 }
            );
        }

        return NextResponse.json(
            { success: false, error: error.message || "Failed to create work experience" },
            { status: 500 }
        );
    }
}
