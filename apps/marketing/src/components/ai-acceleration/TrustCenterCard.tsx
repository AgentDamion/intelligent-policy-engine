import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { ScoreRing } from './ScoreRing';
import { BandBadge } from './BandBadge';
import { Share2, Copy, ExternalLink, Globe, Shield, Calendar } from 'lucide-react';
import { toast } from 'sonner';

export function TrustCenterCard() {
  const [published, setPublished] = useState(false);
  const [slug, setSlug] = useState('acme-agency');
  const [profileData] = useState({
    orgName: 'ACME Agency',
    score: 78,
    band: 'enabled' as const,
    lastAssessed: '2024-01-15',
    domainsSnapshot: [
      { name: 'Data Governance', score: 85 },
      { name: 'Audit Trail', score: 92 },
      { name: 'Security Controls', score: 68 },
      { name: 'Human Oversight', score: 75 }
    ],
    clientsServed: ['Healthcare', 'Financial Services', 'Manufacturing'],
    useCases: ['Document Processing', 'Risk Assessment', 'Compliance Monitoring']
  });

  const profileUrl = `https://trust.aicomplyr.io/${slug}`;
  const badgeUrl = `https://trust.aicomplyr.io/badge/${slug}.svg`;

  const handlePublish = () => {
    // Mock API call
    setTimeout(() => {
      setPublished(true);
      toast.success('Trust Center profile published successfully!');
    }, 1000);
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied to clipboard`);
  };

  const imgBadgeCode = `<!-- Live score badge (SVG) -->
<a href="${profileUrl}" target="_blank" rel="noopener">
  <img
    src="${badgeUrl}"
    alt="AI Acceleration: Enabled — Verified by aicomplyr.io"
    width="220" height="64"
    style="border:0; max-width:100%;"
  />
</a>`;

  const iframeBadgeCode = `<!-- Live score badge (iframe) -->
<iframe
  src="https://aicomplyr.io/badge/${slug}"
  title="AI Acceleration Badge — aicomplyr.io"
  width="240" height="80"
  style="border:0; overflow:hidden;"
  loading="lazy">
</iframe>`;

  if (!published) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Globe className="w-5 h-5 mr-2" />
            Publish Trust Center Profile
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <label className="block text-sm font-medium mb-2">Public Profile URL</label>
            <div className="flex items-center space-x-2">
              <span className="text-sm text-muted-foreground">https://trust.aicomplyr.io/</span>
              <Input
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                className="max-w-40"
                placeholder="your-agency"
              />
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Choose a unique identifier for your public profile
            </p>
          </div>

          <div className="border border-border rounded-lg p-4 bg-muted/20">
            <h4 className="font-medium mb-3">Profile Preview</h4>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <h5 className="font-medium text-foreground">{profileData.orgName}</h5>
                <div className="flex items-center space-x-2 mt-1">
                  <BandBadge band={profileData.band} size="sm" />
                  <span className="text-sm text-muted-foreground">Score: {profileData.score}</span>
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  Evidence on file • Last assessed {profileData.lastAssessed}
                </p>
              </div>
              <div className="flex justify-center">
                <ScoreRing score={profileData.score} band={profileData.band} size="small" />
              </div>
            </div>
          </div>

          <div className="flex items-start space-x-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <Shield className="w-5 h-5 text-yellow-600 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-yellow-800">Publishing Consent</p>
              <p className="text-xs text-yellow-700">
                Your compliance score and domain breakdown will be publicly visible. 
                Detailed evidence remains private unless explicitly shared.
              </p>
            </div>
          </div>

          <Button onClick={handlePublish} className="w-full">
            <Share2 className="w-4 h-4 mr-2" />
            Publish Trust Center Profile
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Published Profile Card */}
      <Card className="border-green-200 bg-green-50">
        <CardContent className="p-6">
          <div className="flex items-center space-x-2 text-green-800 mb-4">
            <Shield className="w-5 h-5" />
            <span className="font-medium">Trust Center Profile Published</span>
          </div>
          
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-xl font-bold text-foreground mb-2">{profileData.orgName}</h3>
              <div className="flex items-center space-x-3 mb-3">
                <BandBadge band={profileData.band} />
                <span className="text-lg font-semibold">Score: {profileData.score}</span>
              </div>
              
              <div className="space-y-2 text-sm">
                <div className="flex items-center text-muted-foreground">
                  <Calendar className="w-4 h-4 mr-2" />
                  Last assessed: {profileData.lastAssessed}
                </div>
                <div className="flex items-center text-muted-foreground">
                  <Shield className="w-4 h-4 mr-2" />
                  Evidence on file: {profileData.domainsSnapshot.length} domains
                </div>
              </div>
              
              <div className="mt-4">
                <h4 className="font-medium mb-2">Clients Served</h4>
                <div className="flex flex-wrap gap-2">
                  {profileData.clientsServed.map((client, index) => (
                    <Badge key={index} variant="outline" className="text-xs">
                      {client}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
            
            <div className="text-center">
              <ScoreRing score={profileData.score} band={profileData.band} size="medium" />
            </div>
          </div>
          
          <div className="mt-6 pt-4 border-t border-green-200">
            <div className="flex items-center justify-between">
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.open(profileUrl, '_blank')}
              >
                <ExternalLink className="w-4 h-4 mr-2" />
                View Public Profile
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => copyToClipboard(profileUrl, 'Profile URL')}
              >
                <Copy className="w-4 h-4 mr-2" />
                Copy Link
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Embeddable Badge */}
      <Card>
        <CardHeader>
          <CardTitle>Embeddable Badge</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <p className="text-sm text-muted-foreground mb-4">
              Embed this live badge on your site. It updates automatically when your score changes.
            </p>
            
            <div className="bg-white border border-border rounded-lg p-6 text-center">
              <div className="inline-flex items-center space-x-3 bg-white border border-gray-200 rounded-full px-4 py-2">
                <div className="w-8 h-8 bg-brand-teal rounded-full flex items-center justify-center">
                  <Shield className="w-5 h-5 text-white" />
                </div>
                <div className="text-left">
                  <div className="text-sm font-medium text-gray-900">AI Enabled ({profileData.score})</div>
                  <div className="text-xs text-gray-500">Verified by aicomplyr.io</div>
                </div>
              </div>
            </div>
          </div>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">IMG Option</label>
              <div className="flex space-x-2">
                <Input
                  value={imgBadgeCode}
                  readOnly
                  className="font-mono text-xs"
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => copyToClipboard(imgBadgeCode, 'IMG embed code')}
                >
                  <Copy className="w-4 h-4" />
                </Button>
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2">IFRAME Option (fixed size)</label>
              <div className="flex space-x-2">
                <Input
                  value={iframeBadgeCode}
                  readOnly
                  className="font-mono text-xs"
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => copyToClipboard(iframeBadgeCode, 'IFRAME embed code')}
                >
                  <Copy className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
          
          <p className="text-xs text-muted-foreground">
            Need help? Ask your web team to paste one of the code blocks above into your site's HTML. 
            The badge reflects your current band (Blocked, Cautious, Enabled, Native).
          </p>
          
          <div className="text-center">
            <Button variant="outline" size="sm">
              Request Evidence Access
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}