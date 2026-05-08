import { MigrationDashboard } from "./_components/MigrationDashboard";
import { ConfigForm } from "./_components/ConfigForm";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";

export default async function MigrationPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect("/login");
  }

  const config = await prisma.apiConfiguration.findUnique({
    where: { userId: session.user.id },
  });

  return (
    <div className="container mx-auto py-10 space-y-10">
      <div>
        <h1 className="text-3xl font-bold tracking-tight mb-2">
          Data Migration
        </h1>
        <p className="text-muted-foreground">
          Migrate your deals, notes, and tasks from Brevo to HubSpot.
        </p>
      </div>

      <div className="grid gap-10 lg:grid-cols-2">
        <div className="space-y-6">
          <h2 className="text-xl font-semibold">1. Configuration</h2>
          <ConfigForm />
        </div>

        <div className="space-y-6">
          <h2 className="text-xl font-semibold">2. Migration Control</h2>
          <MigrationDashboard />
        </div>
      </div>
    </div>
  );
}
