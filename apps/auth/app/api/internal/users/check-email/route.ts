import { NextResponse } from "next/server"
import { getDatabase } from "@/lib/mongodb"

/**
 * Internal API endpoint to check if a user exists by email
 * Used by other services (like backend-assist-api) to verify user existence
 */
export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { email } = body

    if (!email || typeof email !== "string") {
      return NextResponse.json(
        { error: "Invalid email provided. Expected a string 'email'." },
        { status: 400 }
      )
    }

    const { db } = getDatabase()

    const user = await db.collection("user").findOne({
      email: email.toLowerCase().trim(),
    })

    return NextResponse.json({
      exists: !!user,
      userId: user?._id?.toString() || null,
    })
  } catch (error) {
    console.error("Error checking user existence:", error)
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    )
  }
}
