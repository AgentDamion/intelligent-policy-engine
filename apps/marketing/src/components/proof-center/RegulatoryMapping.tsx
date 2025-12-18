import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

interface RegulatoryMappingProps {
  regulatoryCoverage: any[];
}

export default function RegulatoryMapping({ regulatoryCoverage }: RegulatoryMappingProps) {
  const [selectedReg, setSelectedReg] = useState<any>(null);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Regulatory Mapping</CardTitle>
      </CardHeader>
      <CardContent>
        <ul>
          {regulatoryCoverage.map((reg, i) => (
            <li key={i} className="mb-3">
              <Button
                variant="link"
                onClick={() => setSelectedReg(reg)}
                className="font-semibold px-0"
              >
                {reg.name}
              </Button>
              <span className="ml-2 text-sm">
                {reg.decisions} decisions, {reg.conflicts} conflicts,{" "}
                <span className="font-medium text-primary">{reg.complete} audit complete</span>
              </span>
            </li>
          ))}
        </ul>
        {/* Modal for regulation drill-down */}
        <Dialog open={!!selectedReg} onOpenChange={() => setSelectedReg(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{selectedReg?.name}</DialogTitle>
            </DialogHeader>
            <div>
              <div className="mb-2 font-semibold">Audit History:</div>
              <ul className="list-disc list-inside text-sm">
                <li>{selectedReg?.decisions} policy decisions reviewed</li>
                <li>{selectedReg?.conflicts} conflicts flagged/resolved</li>
                <li>Compliance documentation: <a href={selectedReg?.documentation} className="text-primary underline" target="_blank" rel="noopener noreferrer">View regulation</a></li>
              </ul>
            </div>
            <Button variant="secondary" size="sm" className="mt-3" onClick={() => setSelectedReg(null)}>
              Close
            </Button>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}