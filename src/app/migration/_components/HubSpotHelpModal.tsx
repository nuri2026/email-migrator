"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Info, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";

export function HubSpotHelpModal() {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <button
          type="button"
          className="inline-flex items-center justify-center rounded-full w-5 h-5 bg-muted hover:bg-muted/80 text-muted-foreground transition-colors ml-2"
          title="How to get a HubSpot Access Token"
        >
          <Info className="h-3 w-3" />
        </button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>How to Generate a HubSpot Access Token</DialogTitle>
          <DialogDescription>
            Follow these steps to create a Private App and get your access token.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4 text-sm">
          <div className="space-y-2">
            <p className="font-semibold">1. Open Private Apps Settings</p>
            <p className="text-muted-foreground">
              Go to your HubSpot portal and navigate to <strong>Settings &gt; Integrations &gt; Private Apps</strong>.
            </p>
            <Button variant="outline" size="sm" asChild className="w-full">
              <a 
                href="https://app.hubspot.com/settings/private-apps" 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center justify-center"
              >
                Open HubSpot Settings <ExternalLink className="ml-2 h-3 w-3" />
              </a>
            </Button>
          </div>

          <div className="space-y-2">
            <p className="font-semibold">2. Create a New App</p>
            <p className="text-muted-foreground">
              Click <strong>Create private app</strong>. Give it a name like "Migration Tool".
            </p>
          </div>

          <div className="space-y-2">
            <p className="font-semibold">3. Select Required Scopes</p>
            <p className="text-muted-foreground">
              In the <strong>Scopes</strong> tab, enable <code>Read</code> and <code>Write</code> for:
            </p>
            <ul className="list-disc list-inside grid grid-cols-2 gap-1 text-[12px] bg-muted p-2 rounded-md">
              <li>crm.objects.contacts</li>
              <li>crm.objects.companies</li>
              <li>crm.objects.deals</li>
              <li>crm.objects.owners (Read)</li>
              <li>crm.objects.notes</li>
              <li>crm.objects.tasks</li>
            </ul>
          </div>

          <div className="space-y-2">
            <p className="font-semibold">4. Generate & Copy Token</p>
            <p className="text-muted-foreground">
              Click <strong>Create app</strong>, then <strong>Show token</strong> and copy it. It should start with <code>pat-</code>.
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
