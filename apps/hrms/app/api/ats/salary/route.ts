import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/db";
import Salary from "@/app/models/ats/salary";

// GET - Get all salaries
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
            query.salary = { $regex: search, $options: "i" };
        }

        if (organisationId) {
            query.organisationId = organisationId;
        }

        const skip = (page - 1) * limit;

        const [salaries, total] = await Promise.all([
            Salary.find(query)
                .select("-__v")
                .sort({ salary: 1, createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .lean(),
            Salary.countDocuments(query),
        ]);

        return NextResponse.json({
            success: true,
            data: salaries,
            pagination: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit),
            },
        });
    } catch (error: any) {
        console.error("Error fetching salaries:", error);
        return NextResponse.json(
            { success: false, error: error.message || "Failed to fetch salaries" },
            { status: 500 }
        );
    }
}

// POST - Create a new salary
export async function POST(req: Request) {
    try {
        await connectDB();
        const body = await req.json();

        const salary = await Salary.create({
            ...body,
        });

        return NextResponse.json({ 
            success: true, 
            data: salary,
            message: "Salary created successfully" 
        });
    } catch (error: any) {
        console.error("Error creating salary:", error);

        if (error.name === "ValidationError") {
            return NextResponse.json(
                { success: false, error: error.message },
                { status: 400 }
            );
        }

        return NextResponse.json(
            { success: false, error: error.message || "Failed to create salary" },
            { status: 500 }
        );
    }
}
