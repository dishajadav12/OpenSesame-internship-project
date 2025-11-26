import { NextRequest, NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";

export const runtime = 'nodejs';

// GET - Fetch a single plan by ID
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    if (!ObjectId.isValid(id)) {
      return NextResponse.json(
        { error: "Invalid plan ID" },
        { status: 400 }
      );
    }

    const client = await clientPromise;
    const db = client.db("opensesame");
    const collection = db.collection("learning_plans");

    const plan = await collection.findOne({ _id: new ObjectId(id) });

    if (!plan) {
      return NextResponse.json(
        { error: "Plan not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ plan }, { status: 200 });
  } catch (error: any) {
    console.error("Error fetching plan:", error);
    return NextResponse.json(
      { error: "Failed to fetch plan", message: error.message },
      { status: 500 }
    );
  }
}
