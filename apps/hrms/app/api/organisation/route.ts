import { NextRequest, NextResponse } from "next/server";
import { Organisation } from "@/app/models/organisation.model";

// GET - Get all organisations
export async function GET(request: NextRequest) {
    try {
       

        const { searchParams } = new URL(request.url);
        const page = parseInt(searchParams.get("page") || "1");
        const limit = parseInt(searchParams.get("limit") || "10");
        const search = searchParams.get("search") || "";
        const isActive = searchParams.get("isActive");

        const query: any = {};

        if (search) {
            query.$or = [
                { name: { $regex: search, $options: "i" } },
                { email: { $regex: search, $options: "i" } },
            ];
        }

        if (isActive !== null && isActive !== undefined) {
            query.isActive = isActive === "true";
        }

        const skip = (page - 1) * limit;

        const [organisations, total] = await Promise.all([
            Organisation.find(query)
                .select("-__v")
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .lean(),
            Organisation.countDocuments(query),
        ]);

        return NextResponse.json({
            success: true,
            data: organisations,
            pagination: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit),
            },
        });
    } catch (error: any) {
        console.error("Error fetching organisations:", error);
        return NextResponse.json(
            { success: false, error: error.message || "Failed to fetch organisations" },
            { status: 500 }
        );
    }
}

// POST - Create a new organisation
export async function POST(request: NextRequest) {
    try {

        const body = await request.json();

        // Check if organisation with same email already exists
        const existingOrg = await Organisation.findOne({ email: body.email });
        if (existingOrg) {
            return NextResponse.json(
                { success: false, error: "Organisation with this email already exists" },
                { status: 400 }
            );
        }

        const organisation = await Organisation.create(body);

        return NextResponse.json(
            {
                success: true,
                data: organisation,
                message: "Organisation created successfully",
            },
            { status: 201 }
        );
    } catch (error: any) {
        console.error("Error creating organisation:", error);
        
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
            { success: false, error: error.message || "Failed to create organisation" },
            { status: 500 }
        );
    }
}
