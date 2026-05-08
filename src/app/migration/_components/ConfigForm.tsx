"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Eye, EyeOff, Info } from "lucide-react";
import { HubSpotHelpModal } from "./HubSpotHelpModal";

export function ConfigForm() {
  const [brevoApiKey, setBrevoApiKey] = useState("");
  const [hubspotToken, setHubspotToken] = useState("");
  const [showBrevoKey, setShowBrevoKey] = useState(false);
  const [showHubspotToken, setShowHubspotToken] = useState(false);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const fetchConfig = async () => {
      setLoading(true);
      try {
        const res = await fetch("/api/migration/config");
        if (res.ok) {
          const data = await res.json();
          setBrevoApiKey(data.brevoApiKey || "");
          setHubspotToken(data.hubspotToken || "");
        }
      } catch (error) {
        console.error("Failed to fetch config", error);
      } finally {
        setLoading(false);
      }
    };
    fetchConfig();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch("/api/migration/config", {
        method: "POST",
        body: JSON.stringify({ brevoApiKey, hubspotToken }),
      });
      if (res.ok) {
        toast({
          title: "Success",
          description: "Configuration saved successfully",
        });
      } else {
        throw new Error("Failed to save config");
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save configuration",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading)
    return (
      <div className="flex justify-center p-8">
        <Loader2 className="animate-spin" />
      </div>
    );

  return (
    <Card>
      <CardHeader>
        <CardTitle>API Configuration</CardTitle>
        <CardDescription>
          Configure your Brevo and HubSpot credentials
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSave} className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-medium">Brevo API Key</label>
              <div className="relative">
                <Input
                  type={showBrevoKey ? "text" : "password"}
                  value={brevoApiKey}
                  onChange={(e) => setBrevoApiKey(e.target.value)}
                  placeholder="xkeysib-..."
                  required
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowBrevoKey(!showBrevoKey)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showBrevoKey ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium flex items-center">
                HubSpot Private App Token
                <HubSpotHelpModal />
              </label>
              <div className="relative">
                <Input
                  type={showHubspotToken ? "text" : "password"}
                  value={hubspotToken}
                  onChange={(e) => setHubspotToken(e.target.value)}
                  placeholder="pat-na1-..."
                  required
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowHubspotToken(!showHubspotToken)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showHubspotToken ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>
          </div>
          <Button type="submit" disabled={saving} className="w-full md:w-auto">
            {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Save Configuration
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
