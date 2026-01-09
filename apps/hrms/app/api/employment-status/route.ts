import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/db";
import EmploymentStatus from "@/app/models/employmentStatus";

// GET - Get all employmentStatus
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

        const [employmentStatus, total] = await Promise.all([
            EmploymentStatus.find(query)
                .select("-__v")
                .sort({ level: 1, createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .lean(),
            EmploymentStatus.countDocuments(query),
        ]);

        return NextResponse.json({
            success: true,
            data: employmentStatus,
            pagination: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit),
            },
        });
    } catch (error: any) {
        console.error("Error fetching employment Status:", error);
        return NextResponse.json(
            { success: false, error: error.message || "Failed to fetch employment Status" },
            { status: 500 }
        );
    }
}

// POST - Create a new employmentStatus
export async function POST(req: Request) {
    try {
        await connectDB();
        const body = await req.json();

        const employmentStatus = await EmploymentStatus.create({
            ...body,
            userId: "6944ff331fa8459b5926c7c8", // Replace with session user ID when auth is implemented
        });

        return NextResponse.json({ 
            success: true, 
            data: employmentStatus,
            message: "Employment Status created successfully" 
        });
    } catch (error: any) {
        console.error("Error creating employment status:", error);

        if (error.name === "ValidationError") {
            return NextResponse.json(
                { success: false, error: error.message },
                { status: 400 }
            );
        }

        return NextResponse.json(
            { success: false, error: error.message || "Failed to create employment status" },
            { status: 500 }
        );
    }
}
