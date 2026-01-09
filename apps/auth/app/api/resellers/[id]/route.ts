import { NextRequest, NextResponse } from "next/server"
import { getDatabase } from "@/lib/mongodb"
import { z } from "zod"
import { ObjectId, WithId, Document } from "mongodb"

const updateResellerSchema = z.object({
  name: z.string().min(1, "Name is required"),
  contactEmail: z.string().email().optional().or(z.literal("")),
})

// GET - Get single reseller with apps
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
      data: {
        ...reseller,
        _id: reseller._id.toString(),
        apps: apps.map((app: WithId<Document>) => ({
          ...app,
          _id: app._id.toString(),
        })),
      },
    })
  } catch (error) {
    console.error("Error fetching reseller:", error)
    return NextResponse.json(
      { error: "Failed to fetch reseller" },
      { status: 500 }
    )
  }
}

// PUT - Update reseller
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    if (!ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid ID" }, { status: 400 })
    }

    const body = await request.json()
    const validatedData = updateResellerSchema.parse(body)

    const db = getDatabase().db

    const updateData = {
      name: validatedData.name,
      contactEmail: validatedData.contactEmail || undefined,
      updatedAt: new Date(),
    }

    const result = await db
      .collection("reseller")
      .updateOne({ _id: new ObjectId(id) }, { $set: updateData })

    if (result.matchedCount === 0) {
      return NextResponse.json({ error: "Reseller not found" }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      message: "Reseller updated successfully",
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation error", details: error.errors },
        { status: 400 }
      )
    }

    console.error("Error updating reseller:", error)
    return NextResponse.json(
      { error: "Failed to update reseller" },
      { status: 500 }
    )
  }
}

// DELETE - Delete reseller and all associated apps
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    if (!ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid ID" }, { status: 400 })
    }

    const db = getDatabase().db

    // Delete all apps for this reseller
    await db.collection("reseller_app").deleteMany({ resellerId: id })

    // Delete the reseller
    const result = await db
      .collection("reseller")
      .deleteOne({ _id: new ObjectId(id) })

    if (result.deletedCount === 0) {
      return NextResponse.json({ error: "Reseller not found" }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      message: "Reseller and associated apps deleted successfully",
    })
  } catch (error) {
    console.error("Error deleting reseller:", error)
    return NextResponse.json(
      { error: "Failed to delete reseller" },
      { status: 500 }
    )
  }
}
