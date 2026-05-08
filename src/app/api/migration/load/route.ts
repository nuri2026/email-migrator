import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { prisma } from "@/lib/prisma";
import { HubSpotLoadingService } from "@/services/migration/hubspot-loading-service";

export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const config = await prisma.apiConfiguration.findUnique({
      where: { userId: session.user.id },
    });

    if (!config?.hubspotToken) {
      return NextResponse.json({ message: "HubSpot Token not configured" }, { status: 400 });
    }

    const service = new HubSpotLoadingService(config.hubspotToken);
    await service.syncAll();

    return NextResponse.json({ message: "Sync completed successfully" });
  } catch (error) {
    console.error("Sync error:", error);
    return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
  }
}
