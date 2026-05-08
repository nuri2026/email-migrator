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

    const [dealsCount, notesCount, tasksCount, companiesCount, contactsCount, syncedDealsCount] = await Promise.all([
      (prisma as any).brevoDeal.count({ where: { userId: session.user.id } }),
      (prisma as any).brevoNote.count({ where: { userId: session.user.id } }),
      (prisma as any).brevoTask.count({ where: { userId: session.user.id } }),
      (prisma as any).brevoCompany.count({ where: { userId: session.user.id } }),
      (prisma as any).brevoContact.count({ where: { userId: session.user.id } }),
      (prisma as any).brevoDeal.count({ where: { hubspotId: { not: null }, userId: session.user.id } }),
    ]);

    return NextResponse.json({
      deals: dealsCount,
      notes: notesCount,
      tasks: tasksCount,
      companies: companiesCount,
      contacts: contactsCount,
      syncedDeals: syncedDealsCount,
    });
  } catch (error) {
    return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
  }
}
