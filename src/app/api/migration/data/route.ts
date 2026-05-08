import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type");

    let data: any[] = [];
    if (type === "deals") {
      data = await prisma.brevoDeal.findMany({
        orderBy: { createdAt: "desc" },
      });
    } else if (type === "notes") {
      data = await prisma.brevoNote.findMany({
        orderBy: { createdAt: "desc" },
        include: { deal: true },
      });
    } else if (type === "tasks") {
      data = await prisma.brevoTask.findMany({
        orderBy: { createdAt: "desc" },
        include: { deal: true },
      });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error("Fetch data error:", error);
    return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
  }
}
