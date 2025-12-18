import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";

export default function ProofPacks() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Downloadable Proof Packs</CardTitle>
      </CardHeader>
      <CardContent>
        <Button variant="default" className="mb-2 w-full">
          <Download className="mr-2 h-4 w-4" /> RFP Pack
        </Button>
        <Button variant="secondary" className="mb-2 w-full">
          <Download className="mr-2 h-4 w-4" /> Audit Pack
        </Button>
        <Button variant="outline" className="w-full">
          <Download className="mr-2 h-4 w-4" /> Custom Export
        </Button>
        <p className="text-xs text-muted-foreground mt-3">
          Packs include audit logs, policy mappings, and conflict details for any period/client.
        </p>
      </CardContent>
    </Card>
  );
}