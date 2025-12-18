import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, ResponsiveContainer, Tooltip } from 'recharts';

interface RiskRadarChartProps {
  dimensionScores: {
    dataSensitivity: number;
    externalExposure: number;
    modelTransparency: number;
    misuseVectors: number;
    legalIPRisk: number;
    operationalCriticality: number;
  };
}

export const RiskRadarChart = ({ dimensionScores }: RiskRadarChartProps) => {
  const chartData = [
    { dimension: 'Data Sensitivity', score: dimensionScores.dataSensitivity, fullMark: 100 },
    { dimension: 'External Exposure', score: dimensionScores.externalExposure, fullMark: 100 },
    { dimension: 'Model Transparency', score: 100 - dimensionScores.modelTransparency, fullMark: 100 },
    { dimension: 'Misuse Vectors', score: dimensionScores.misuseVectors, fullMark: 100 },
    { dimension: 'Legal/IP Risk', score: dimensionScores.legalIPRisk, fullMark: 100 },
    { dimension: 'Operational Criticality', score: dimensionScores.operationalCriticality, fullMark: 100 },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm">6-Dimensional Risk Profile</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <RadarChart data={chartData}>
            <PolarGrid />
            <PolarAngleAxis dataKey="dimension" tick={{ fontSize: 11 }} />
            <PolarRadiusAxis angle={90} domain={[0, 100]} />
            <Radar name="Risk Score" dataKey="score" stroke="hsl(var(--primary))" fill="hsl(var(--primary))" fillOpacity={0.6} />
            <Tooltip />
          </RadarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};
