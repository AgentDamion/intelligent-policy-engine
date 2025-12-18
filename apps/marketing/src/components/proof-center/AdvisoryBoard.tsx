import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export default function AdvisoryBoard() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>
          Advisory Board <Badge variant="default" className="ml-2">Reviewed</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="mb-2 text-sm">
          <span className="font-semibold">"aicomplyr.io Proof Center workflows have been reviewed and endorsed by the Pharma Compliance Advisory Board."</span>
        </div>
        <Button
          variant="secondary"
          size="sm"
          onClick={() => alert("Contact us for 1:1 walkthrough or to submit a question.")}
        >
          Submit a Question / Request a Demo
        </Button>
        <div className="mt-3 text-xs text-muted-foreground">
          Most recent feedback: <br />
          <span className="italic">
            "Live audit export and regulatory mapping is game-changing for pharma compliance." – Compliance Officer, Novartis
          </span>
        </div>
      </CardContent>
    </Card>
  );
}