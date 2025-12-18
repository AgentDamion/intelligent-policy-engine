import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";

interface KeyMetricsProps {
  metrics: any[];
  trendData: any[];
}

export default function KeyMetrics({ metrics, trendData }: KeyMetricsProps) {
  return (
    <Card className="col-span-2 lg:col-span-1">
      <CardHeader>
        <CardTitle>Key Metrics</CardTitle>
      </CardHeader>
      <CardContent>
        <ul>
          {metrics.map((m, i) => (
            <li key={i} className="flex justify-between items-center mb-2">
              <span className="font-medium">{m.label}</span>
              <span className="text-xl font-bold">{m.value}</span>
            </li>
          ))}
        </ul>
        <div className="mt-6">
          <div className="font-medium mb-2">Compliance Trend</div>
          <ResponsiveContainer width="100%" height={120}>
            <LineChart data={trendData}>
              <XAxis dataKey="date" hide />
              <YAxis hide />
              <CartesianGrid strokeDasharray="3 3" />
              <Tooltip />
              <Line type="monotone" dataKey="complianceScore" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}