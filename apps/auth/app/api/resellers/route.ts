import { NextRequest, NextResponse } from "next/server"
import { getDatabase } from "@/lib/mongodb"
import { z } from "zod"
import { WithId, Document } from "mongodb"

const createResellerSchema = z.object({
  name: z.string().min(1, "Name is required"),
  contactEmail: z.string().email().optional().or(z.literal("")),
})

// GET - List all resellers with their apps
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const page = parseInt(searchParams.get("page") || "1")
    const limit = parseInt(searchParams.get("limit") || "10")
    const search = searchParams.get("search") || ""
    const appType = searchParams.get("appType") || ""

    const db = getDatabase().db

    // Build query
    const query: Record<string, unknown> = {}
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { contactEmail: { $regex: search, $options: "i" } },
      ]
    }

    const skip = (page - 1) * limit

    // Get total count
    const total = await db.collection("reseller").countDocuments(query)

    const resellers = await db
      .collection("reseller")
      .find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .toArray()

    // Fetch apps for each reseller
    const resellersWithApps = await Promise.all(
      resellers.map(async (reseller: WithId<Document>) => {
        const appsQuery: Record<string, unknown> = {
          resellerId: reseller._id.toString(),
          ...(appType && { appType }),
        }

        const apps = await db
          .collection("reseller_app")
          .find(appsQuery)
          .toArray()

        return {
          ...reseller,
          _id: reseller._id.toString(),
          apps: apps.map((app: WithId<Document>) => ({
            ...app,
            _id: app._id.toString(),
          })),
        }
      })
    )

    return NextResponse.json({
      success: true,
      data: resellersWithApps,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error("Error fetching resellers:", error)
    return NextResponse.json(
      { error: "Failed to fetch resellers" },
      { status: 500 }
    )
  }
}

// POST - Create a new reseller
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validatedData = createResellerSchema.parse(body)

    const db = getDatabase().db

    const resellerData = {
      name: validatedData.name,
      contactEmail: validatedData.contactEmail || undefined,
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    const result = await db.collection("reseller").insertOne(resellerData)

    return NextResponse.json(
      {
        success: true,
        message: "Reseller created successfully",
        data: {
          _id: result.insertedId.toString(),
          ...resellerData,
        },
      },
      { status: 201 }
    )
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation error", details: error.errors },
        { status: 400 }
      )
    }

    console.error("Error creating reseller:", error)
    return NextResponse.json(
      { error: "Failed to create reseller" },
      { status: 500 }
    )
  }
}
