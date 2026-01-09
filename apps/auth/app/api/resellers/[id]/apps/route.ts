import { NextRequest, NextResponse } from "next/server"
import { getDatabase } from "@/lib/mongodb"
import { z } from "zod"
import { ObjectId, WithId, Document } from "mongodb"

const createAppSchema = z.object({
  appType: z.enum(["hrms", "social-media", "backend-assist"], {
    errorMap: () => ({ message: "Invalid app type" }),
  }),
  host: z
    .string()
    .min(1, "Host is required")
    .regex(/^[a-zA-Z0-9.-]+$/, "Invalid host format"),
  settings: z.record(z.any()).optional(),
  isActive: z.boolean().default(true),
})

// GET - List all apps for a reseller
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    if (!ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid ID" }, { status: 400 })
    }

    const db = getDatabase().db

    // Check if reseller exists
    const reseller = await db
      .collection("reseller")
      .findOne({ _id: new ObjectId(id) })

    if (!reseller) {
      return NextResponse.json({ error: "Reseller not found" }, { status: 404 })
    }

    const apps = await db
      .collection("reseller_app")
      .find({ resellerId: id })
      .toArray()

    return NextResponse.json({
      success: true,
      data: apps.map((app: WithId<Document>) => ({
        ...app,
        _id: app._id.toString(),
      })),
    })
  } catch (error) {
    console.error("Error fetching apps:", error)
    return NextResponse.json({ error: "Failed to fetch apps" }, { status: 500 })
  }
}

// POST - Add a new app to a reseller
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    if (!ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid ID" }, { status: 400 })
    }

    const body = await request.json()
    const validatedData = createAppSchema.parse(body)

    const db = getDatabase().db

    // Check if reseller exists
    const reseller = await db
      .collection("reseller")
      .findOne({ _id: new ObjectId(id) })

    if (!reseller) {
      return NextResponse.json({ error: "Reseller not found" }, { status: 404 })
    }

    // Check if app with same host already exists
    const existingApp = await db
      .collection("reseller_app")
      .findOne({ host: validatedData.host })

    if (existingApp) {
      return NextResponse.json(
        { error: "An app with this host already exists" },
        { status: 400 }
      )
    }

    const appData = {
      resellerId: new ObjectId(id),
      appType: validatedData.appType,
      host: validatedData.host,
      settings: validatedData.settings || {},
      isActive: validatedData.isActive,
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    const result = await db.collection("reseller_app").insertOne(appData)

    return NextResponse.json(
      {
        success: true,
        message: "App added successfully",
        data: {
          _id: result.insertedId.toString(),
          ...appData,
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

    console.error("Error adding app:", error)
    return NextResponse.json({ error: "Failed to add app" }, { status: 500 })
  }
}
