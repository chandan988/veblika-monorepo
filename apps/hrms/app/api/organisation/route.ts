import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/db";
import Organisation from "@/app/models/organisation";
import mongoose from "mongoose";

// Import OrganisationMember with proper model handling
const getOrganisationMemberModel = () => {
    if (mongoose.models.organisationMember) {
        return mongoose.models.organisationMember;
    }
    // If not exists, import and return
    const { OrganisationMember } = require("@/app/models/organisationMember");
    return OrganisationMember;
};

// GET - Get all organisations
export async function GET(request: NextRequest) {

    try {
        console.log("Fetching organisations...");
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

export async function POST(req: Request) {
    //   const session = await auth.api.getSession({
    //     headers: req.headers,
    //   });

    //   if (!session) {
    //     return NextResponse.json({ error: "Unauthorized" }, {status: 401 });
    // }



    const body=await req.json();

    await connectDB();
    const organisation = await Organisation.create({
        ...body,
        ownerId: "6944ff331fa8459b5926c7c8", // Replace with session user ID when auth is implemented
    });
 // Get OrganisationMember model safely
        const OrganisationMember = getOrganisationMemberModel();

    // Make creator ORG_ADMIN
    await OrganisationMember.create({
        userId: "6944ff331fa8459b5926c7c8",
        organisationId: organisation._id,
        role: "ORG_ADMIN",
    });

    return NextResponse.json({ success: true /*, data: organisation */ });

}

