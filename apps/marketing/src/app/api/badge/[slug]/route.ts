/**
 * SVG Badge Generation API
 * Generates live SVG badges for Trust Center profiles
 */
// NextRequest not available in this setup

const bandColors = {
  blocked: '#6b7280', // gray-500
  cautious: '#f59e0b', // amber-500  
  enabled: '#3b82f6', // blue-500
  native: '#8b5cf6'   // purple-500
};

const bandLabels = {
  blocked: 'Blocked',
  cautious: 'Cautious', 
  enabled: 'Enabled',
  native: 'Native'
};

export async function GET(
  request: Request,
  { params }: { params: { slug: string } }
) {
  try {
    const slug = params.slug.replace('.svg', '');
    
    // In production, fetch actual profile data from database by slug
    // For now, mock data based on slug
    const profileData = {
      orgName: slug.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase()),
      score: 78,
      band: 'enabled' as keyof typeof bandColors,
      verified: true
    };

    const color = bandColors[profileData.band];
    const label = bandLabels[profileData.band];
    
    // Generate SVG badge
    const svg = `
<svg width="220" height="64" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" style="stop-color:${color};stop-opacity:0.1" />
      <stop offset="100%" style="stop-color:${color};stop-opacity:0.2" />
    </linearGradient>
    <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="2" stdDeviation="4" flood-color="${color}" flood-opacity="0.25"/>
    </filter>
  </defs>
  
  <!-- Background -->
  <rect width="220" height="64" rx="32" fill="white" stroke="${color}" stroke-width="2" filter="url(#shadow)"/>
  <rect width="220" height="64" rx="32" fill="url(#grad)"/>
  
  <!-- Shield Icon -->
  <g transform="translate(20, 20)">
    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" 
          fill="${color}" stroke="white" stroke-width="1"/>
  </g>
  
  <!-- Text -->
  <text x="60" y="30" font-family="system-ui, -apple-system, sans-serif" font-size="14" font-weight="600" fill="#1f2937">
    AI ${label} (${profileData.score})
  </text>
  <text x="60" y="46" font-family="system-ui, -apple-system, sans-serif" font-size="11" fill="#6b7280">
    Verified by aicomplyr.io
  </text>
  
  <!-- Score Ring (small) -->
  <g transform="translate(180, 32)">
    <circle cx="0" cy="0" r="16" fill="none" stroke="#e5e7eb" stroke-width="3"/>
    <circle cx="0" cy="0" r="16" fill="none" stroke="${color}" stroke-width="3" 
            stroke-dasharray="${2 * Math.PI * 16}" 
            stroke-dashoffset="${2 * Math.PI * 16 * (1 - profileData.score / 100)}"
            stroke-linecap="round" transform="rotate(-90)"/>
    <text x="0" y="4" text-anchor="middle" font-family="system-ui" font-size="10" font-weight="600" fill="${color}">
      ${profileData.score}
    </text>
  </g>
</svg>`.trim();

    return new Response(svg, {
      headers: {
        'Content-Type': 'image/svg+xml',
        'Cache-Control': 'public, max-age=300', // 5 minute cache
        'Access-Control-Allow-Origin': '*',
      },
    });

  } catch (error) {
    console.error('Badge generation error:', error);
    
    // Return error badge
    const errorSvg = `
<svg width="220" height="64" xmlns="http://www.w3.org/2000/svg">
  <rect width="220" height="64" rx="32" fill="#fee2e2" stroke="#dc2626" stroke-width="2"/>
  <text x="110" y="35" text-anchor="middle" font-family="system-ui" font-size="12" fill="#dc2626">
    Badge Error
  </text>
</svg>`.trim();

    return new Response(errorSvg, {
      headers: {
        'Content-Type': 'image/svg+xml',
        'Cache-Control': 'no-cache',
      },
      status: 500,
    });
  }
}

// Handle CORS preflight
export async function OPTIONS() {
  return new Response(null, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}