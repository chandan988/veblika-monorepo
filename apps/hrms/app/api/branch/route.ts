import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/db";
import Branch from "@/app/models/branch";

// GET - Get all branches
export async function GET(request: NextRequest) {
    try {
        await connectDB();
        const { searchParams } = new URL(request.url);
        const page = parseInt(searchParams.get("page") || "1");
        const limit = parseInt(searchParams.get("limit") || "10");
        const search = searchParams.get("search") || "";
        const isActive = searchParams.get("isActive");
        const organisationId = searchParams.get("organisationId");

        const query: any = {};

        if (search) {
            query.$or = [
                { name: { $regex: search, $options: "i" } },
                { code: { $regex: search, $options: "i" } },
            ];
        }

        if (isActive !== null && isActive !== undefined) {
            query.isActive = isActive === "true";
        }

        if (organisationId) {
            query.organisationId = organisationId;
        }

        const skip = (page - 1) * limit;

        const [branches, total] = await Promise.all([
            Branch.find(query)
                .select("-__v")
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .lean(),
            Branch.countDocuments(query),
        ]);

        return NextResponse.json({
            success: true,
            data: branches,
            pagination: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit),
            },
        });
    } catch (error: any) {
        console.error("Error fetching branches:", error);
        return NextResponse.json(
            { success: false, error: error.message || "Failed to fetch branches" },
            { status: 500 }
        );
    }
}

// POST - Create a new branch
export async function POST(req: Request) {
    try {
        await connectDB();
        const body = await req.json();

        // Check if code already exists
        const existingBranch = await Branch.findOne({ code: body.code });
        if (existingBranch) {
            return NextResponse.json(
                { success: false, error: "Branch code already exists" },
                { status: 400 }
            );
        }

        const branch = await Branch.create({
            ...body,
            userId: "6944ff331fa8459b5926c7c8", // Replace with session user ID when auth is implemented
        });

        return NextResponse.json({ 
            success: true, 
            data: branch,
            message: "Branch created successfully" 
        });
    } catch (error: any) {
        console.error("Error creating branch:", error);
        
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
            { success: false, error: error.message || "Failed to create branch" },
            { status: 500 }
        );
    }
}
