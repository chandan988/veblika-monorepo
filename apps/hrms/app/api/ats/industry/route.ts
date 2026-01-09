import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/db";
import Industry from "@/app/models/ats/industry";

// GET - Get all industries
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
            query.industry = { $regex: search, $options: "i" };
        }

        if (organisationId) {
            query.organisationId = organisationId;
        }

        const skip = (page - 1) * limit;

        const [industries, total] = await Promise.all([
            Industry.find(query)
                .select("-__v")
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .lean(),
            Industry.countDocuments(query),
        ]);

        return NextResponse.json({
            success: true,
            data: industries,
            pagination: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit),
            },
        });
    } catch (error: any) {
        console.error("Error fetching industries:", error);
        return NextResponse.json(
            { success: false, error: error.message || "Failed to fetch industries" },
            { status: 500 }
        );
    }
}

// POST - Create a new industry
export async function POST(req: Request) {
    try {
        await connectDB();
        const body = await req.json();

        const industry = await Industry.create({
            ...body,
        });

        return NextResponse.json({ 
            success: true, 
            data: industry,
            message: "Industry created successfully" 
        });
    } catch (error: any) {
        console.error("Error creating industry:", error);

        if (error.name === "ValidationError") {
            return NextResponse.json(
                { success: false, error: error.message },
                { status: 400 }
            );
        }

        return NextResponse.json(
            { success: false, error: error.message || "Failed to create industry" },
            { status: 500 }
        );
    }
}
