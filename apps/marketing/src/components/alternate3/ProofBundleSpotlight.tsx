import React, { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Check, Download, Copy, ExternalLink } from 'lucide-react';
import { alternate3Content } from '@/content/alternate3ProofFirst';
import { toast } from 'sonner';

export const ProofBundleSpotlight = () => {
  const { proofBundleSpotlight } = alternate3Content;
  const [downloadCount, setDownloadCount] = useState(0);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            window.dispatchEvent(new CustomEvent('analytics', {
              detail: { event: 'scroll_to_proof' }
            }));
            observer.disconnect();
          }
        });
      },
      { threshold: 0.5 }
    );

    const section = document.getElementById('proof-bundle-spotlight');
    if (section) observer.observe(section);

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const storedCount = localStorage.getItem('proof_downloads_count');
    if (storedCount) {
      setDownloadCount(parseInt(storedCount, 10));
    }
  }, []);

  const handleDownload = (event: string) => {
    window.dispatchEvent(new CustomEvent('analytics', {
      detail: { event }
    }));

    const newCount = downloadCount + 1;
    setDownloadCount(newCount);
    localStorage.setItem('proof_downloads_count', newCount.toString());

    if (newCount === 2) {
      window.dispatchEvent(new CustomEvent('analytics', {
        detail: { event: 'proof_post_download_prompt_shown' }
      }));
      
      toast('Was this helpful? Get a live run with your workflow →', {
        duration: 8000,
        action: {
          label: 'Request a Demo',
          onClick: () => {
            window.dispatchEvent(new CustomEvent('analytics', {
              detail: { event: 'proof_post_download_cta_clicked' }
            }));
            window.location.href = '/contact';
          }
        }
      });
    }
  };

  const handleThumbnailClick = () => {
    handleDownload('proof_sample_downloaded_pdf');
    const link = document.createElement('a');
    link.href = proofBundleSpotlight.downloads[0].href;
    link.download = 'proof-sample.pdf';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleCopyHash = async () => {
    const sampleHash = 'sha256:7f8a9b2c4e6d8f1a3b5c7e9f0d2b4c6e8a1c3e5f7b9d0c2e4f6a8b0c2e4d6f8a';
    try {
      await navigator.clipboard.writeText(sampleHash);
      toast.success('Hash copied to clipboard');
      window.dispatchEvent(new CustomEvent('analytics', {
        detail: { event: 'proof_hash_copied' }
      }));
    } catch (err) {
      toast.error('Failed to copy hash');
    }
  };

  const handleSpecClick = () => {
    window.dispatchEvent(new CustomEvent('analytics', {
      detail: { event: 'proof_spec_clicked' }
    }));
  };

  return (
    <section id="proof-bundle-spotlight" className="py-16 lg:py-24 bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-3xl lg:text-4xl font-bold text-center mb-12 text-foreground">
          {proofBundleSpotlight.sectionTitle}
        </h2>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Left: Mock PDF Preview */}
          <Card 
            className="shadow-xl cursor-pointer hover:shadow-2xl hover:scale-[1.02] transition-all"
            onClick={handleThumbnailClick}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                handleThumbnailClick();
              }
            }}
            aria-label="Download Proof Bundle sample PDF"
          >
            <CardContent className="p-0">
              <div className="aspect-[3/4] bg-muted rounded-lg flex items-center justify-center overflow-hidden">
                <img 
                  src={proofBundleSpotlight.mockPDFImage}
                  alt="Proof Bundle Sample - Click to download"
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                    const parent = e.currentTarget.parentElement;
                    if (parent) {
                      parent.innerHTML = '<div class="text-center p-8"><div class="text-4xl mb-4">📄</div><div class="text-muted-foreground">Proof Bundle Preview</div></div>';
                    }
                  }}
                />
              </div>
            </CardContent>
          </Card>

          {/* Right: Bullets and Downloads */}
          <div>
            <ul className="space-y-4 mb-8">
              {proofBundleSpotlight.bullets.map((bullet, index) => (
                <li key={index} className="flex items-start gap-3">
                  <div className="p-1 rounded-full bg-brand-teal/10 mt-1">
                    <Check className="w-5 h-5 text-brand-teal" />
                  </div>
                  <span className="text-lg text-muted-foreground">{bullet}</span>
                </li>
              ))}
            </ul>

            {/* Sample Hash with Copy */}
            <div className="mb-6 p-3 bg-muted/50 rounded-lg border border-border">
              <div className="flex items-center justify-between gap-2">
                <p className="text-xs text-muted-foreground font-mono truncate flex-1">
                  Sample hash: <span className="hidden sm:inline">sha256:7f8a9b2c4e6d8f1a3b5c7e9f0d2b4c6e8a1c3e5f7b9d0c2e4f6a8b0c2e4d6f8a</span>
                  <span className="sm:hidden">sha256:7f8a9b2c...e4d6f8a</span>
                </p>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleCopyHash}
                  className="flex-shrink-0 focus-visible:ring-2 focus-visible:ring-brand-teal focus-visible:ring-offset-2"
                >
                  <Copy className="w-4 h-4 mr-1" />
                  Copy
                </Button>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4">
              {proofBundleSpotlight.downloads.map((download, index) => (
                <Button
                  key={index}
                  variant={download.variant as any}
                  size="lg"
                  asChild
                  onClick={() => handleDownload(download.event)}
                  className="flex-1 focus-visible:ring-2 focus-visible:ring-brand-teal focus-visible:ring-offset-2"
                >
                  <a href={download.href} download>
                    <Download className="w-5 h-5 mr-2" />
                    {download.text}
                  </a>
                </Button>
              ))}
            </div>

            {/* Methodology Link */}
            <div className="mt-4 text-center">
              <a 
                href="/proof-bundle-spec" 
                onClick={handleSpecClick}
                className="text-sm text-brand-teal hover:underline inline-flex items-center gap-1 focus-visible:ring-2 focus-visible:ring-brand-teal focus-visible:ring-offset-2 rounded px-2 py-1"
              >
                How we format Proof Bundles
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
