import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/db";
import Designation from "@/app/models/designation";

// GET - Get all designations
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
            query.name = { $regex: search, $options: "i" };
        }

        if (isActive !== null && isActive !== undefined) {
            query.isActive = isActive === "true";
        }

        if (organisationId) {
            query.organisationId = organisationId;
        }

        const skip = (page - 1) * limit;

        const [designations, total] = await Promise.all([
            Designation.find(query)
                .select("-__v")
                .sort({ level: 1, createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .lean(),
            Designation.countDocuments(query),
        ]);

        return NextResponse.json({
            success: true,
            data: designations,
            pagination: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit),
            },
        });
    } catch (error: any) {
        console.error("Error fetching designations:", error);
        return NextResponse.json(
            { success: false, error: error.message || "Failed to fetch designations" },
            { status: 500 }
        );
    }
}

// POST - Create a new designation
export async function POST(req: Request) {
    try {
        await connectDB();
        const body = await req.json();

        const designation = await Designation.create({
            ...body,
            userId: "6944ff331fa8459b5926c7c8", // Replace with session user ID when auth is implemented
        });

        return NextResponse.json({ 
            success: true, 
            data: designation,
            message: "Designation created successfully" 
        });
    } catch (error: any) {
        console.error("Error creating designation:", error);

        if (error.name === "ValidationError") {
            return NextResponse.json(
                { success: false, error: error.message },
                { status: 400 }
            );
        }

        return NextResponse.json(
            { success: false, error: error.message || "Failed to create designation" },
            { status: 500 }
        );
    }
}
