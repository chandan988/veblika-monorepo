import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/db";
import Department from "@/app/models/department";

// GET - Get all departments
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

        const [departments, total] = await Promise.all([
            Department.find(query)
                .select("-__v")
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .lean(),
            Department.countDocuments(query),
        ]);

        return NextResponse.json({
            success: true,
            data: departments,
            pagination: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit),
            },
        });
    } catch (error: any) {
        console.error("Error fetching departments:", error);
        return NextResponse.json(
            { success: false, error: error.message || "Failed to fetch departments" },
            { status: 500 }
        );
    }
}

// POST - Create a new department
export async function POST(req: Request) {
    try {
        await connectDB();
        const body = await req.json();

        // Check if code already exists
        const existingDepartment = await Department.findOne({ code: body.code });
        if (existingDepartment) {
            return NextResponse.json(
                { success: false, error: "Department code already exists" },
                { status: 400 }
            );
        }

        const department = await Department.create({
            ...body,
            userId: "6944ff331fa8459b5926c7c8", // Replace with session user ID when auth is implemented
        });

        return NextResponse.json({ 
            success: true, 
            data: department,
            message: "Department created successfully" 
        });
    } catch (error: any) {
        console.error("Error creating department:", error);
        
        if (error.code === 11000) {
            return NextResponse.json(
                { success: false, error: "Department code already exists" },
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
            { success: false, error: error.message || "Failed to create department" },
            { status: 500 }
        );
    }
}
