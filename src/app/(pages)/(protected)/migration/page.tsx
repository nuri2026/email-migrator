import { Metadata } from "next";
import { ConfigForm } from "./_components/ConfigForm";
import { MigrationDashboard } from "./_components/MigrationDashboard";

export const metadata: Metadata = {
  title: "Data Migration | Brevo to HubSpot",
  description: "Migrate your CRM data from Brevo to HubSpot seamlessly",
};

export default function MigrationPage() {
  return (
    <div className="container mx-auto py-10 space-y-8">
      <div>
        <h1 className="text-4xl font-bold tracking-tight">CRM Data Migration</h1>
        <p className="text-muted-foreground mt-2">
          Stage your data from Brevo and sync it directly to HubSpot.
        </p>
      </div>

      <div className="grid gap-8 lg:grid-cols-2">
        <div className="space-y-8">
          <ConfigForm />
        </div>
        <div className="space-y-8">
          <MigrationDashboard />
        </div>
      </div>
    </div>
  );
}
