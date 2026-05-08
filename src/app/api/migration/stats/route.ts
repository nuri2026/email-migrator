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

    const [dealsCount, notesCount, tasksCount, syncedDealsCount] = await Promise.all([
      prisma.brevoDeal.count(),
      prisma.brevoNote.count(),
      prisma.brevoTask.count(),
      prisma.brevoDeal.count({ where: { hubspotId: { not: null } } }),
    ]);

    return NextResponse.json({
      deals: dealsCount,
      notes: notesCount,
      tasks: tasksCount,
      syncedDeals: syncedDealsCount,
    });
  } catch (error) {
    return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
  }
}
