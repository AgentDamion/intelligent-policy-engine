import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText } from "lucide-react";

interface CaseStudiesProps {
  caseStudies: any[];
}

export default function CaseStudies({ caseStudies }: CaseStudiesProps) {
  return (
    <Card className="col-span-2 lg:col-span-1">
      <CardHeader>
        <CardTitle>Case Study Snapshots</CardTitle>
      </CardHeader>
      <CardContent>
        {caseStudies.map((c, i) => (
          <div
            key={i}
            className="mb-4 p-3 rounded-xl border border-muted shadow-sm bg-muted/20"
          >
            <div className="font-semibold">{c.title}</div>
            <div className="text-sm text-muted-foreground">{c.summary}</div>
            <Button
              variant="secondary"
              size="sm"
              className="mt-2"
              onClick={() => window.open(c.proof, "_blank")}
            >
              <FileText className="mr-1 h-4 w-4" /> Download Proof
            </Button>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}