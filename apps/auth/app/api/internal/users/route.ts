import { NextResponse } from "next/server"
import { getDatabase } from "@/lib/mongodb"
import { ObjectId } from "mongodb"

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { ids } = body

    if (!ids || !Array.isArray(ids)) {
      return NextResponse.json(
        { error: "Invalid IDs provided. Expected an array of 'ids'." },
        { status: 400 }
      )
    }

    const { db } = getDatabase()

    const objectIds = ids
      .map((id) => {
        try {
          return new ObjectId(id)
        } catch (e) {
          return null
        }
      })
      .filter((id) => id !== null) as ObjectId[]

    if (objectIds.length === 0 && ids.length > 0) {
      return NextResponse.json(
        { error: "No valid ObjectIds provided" },
        { status: 400 }
      )
    }

    const users = await db
      .collection("user")
      .find({
        _id: { $in: objectIds },
      })
      .toArray()

    return NextResponse.json(users)
  } catch (error) {
    console.error("Error fetching users:", error)
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    )
  }
}
