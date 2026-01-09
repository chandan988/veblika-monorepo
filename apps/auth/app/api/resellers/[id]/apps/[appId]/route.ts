import { NextRequest, NextResponse } from "next/server"
import { getDatabase } from "@/lib/mongodb"
import { z } from "zod"
import { ObjectId } from "mongodb"

const updateAppSchema = z.object({
  appType: z
    .enum(["hrms", "social-media", "backend-assist"], {
      errorMap: () => ({ message: "Invalid app type" }),
    })
    .optional(),
  host: z
    .string()
    .min(1, "Host is required")
    .regex(/^[a-zA-Z0-9.-]+$/, "Invalid host format")
    .optional(),
  settings: z.record(z.any()).optional(),
  isActive: z.boolean().optional(),
})

// PUT - Update an app
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; appId: string }> }
) {
  try {
    const { id, appId } = await params

    if (!ObjectId.isValid(appId)) {
      return NextResponse.json({ error: "Invalid app ID" }, { status: 400 })
    }

    const body = await request.json()
    const validatedData = updateAppSchema.parse(body)

    const db = getDatabase().db

    // If host is being updated, check if it's already in use
    if (validatedData.host) {
      const existingApp = await db.collection("reseller_app").findOne({
        host: validatedData.host,
        _id: { $ne: new ObjectId(appId) },
      })

      if (existingApp) {
        return NextResponse.json(
          { error: "An app with this host already exists" },
          { status: 400 }
        )
      }
    }

    const updateData: Record<string, unknown> = {
      updatedAt: new Date(),
    }

    if (validatedData.appType) updateData.appType = validatedData.appType
    if (validatedData.host) updateData.host = validatedData.host
    if (validatedData.settings !== undefined)
      updateData.settings = validatedData.settings
    if (validatedData.isActive !== undefined)
      updateData.isActive = validatedData.isActive

    const result = await db
      .collection("reseller_app")
      .updateOne(
        {
          _id: new ObjectId(appId),
          $or: [
            { resellerId: id },
            { resellerId: new ObjectId(id) },
          ],
        },
        { $set: updateData }
      )

    if (result.matchedCount === 0) {
      return NextResponse.json({ error: "App not found" }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      message: "App updated successfully",
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation error", details: error.errors },
        { status: 400 }
      )
    }

    console.error("Error updating app:", error)
    return NextResponse.json({ error: "Failed to update app" }, { status: 500 })
  }
}

// DELETE - Delete an app
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; appId: string }> }
) {
  try {
    const { id, appId } = await params

    if (!ObjectId.isValid(appId)) {
      return NextResponse.json({ error: "Invalid app ID" }, { status: 400 })
    }

    const db = getDatabase().db

    const result = await db
      .collection("reseller_app")
      .deleteOne({
        _id: new ObjectId(appId),
        $or: [
          { resellerId: id },
          { resellerId: new ObjectId(id) },
        ],
      })

    if (result.deletedCount === 0) {
      return NextResponse.json({ error: "App not found" }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      message: "App deleted successfully",
    })
  } catch (error) {
    console.error("Error deleting app:", error)
    return NextResponse.json({ error: "Failed to delete app" }, { status: 500 })
  }
}
