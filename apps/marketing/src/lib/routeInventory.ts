import registry from "@/appRegistry";

function getRegisteredRoutes(): string[] {
  // Current actual functional routes in the application (excluding redirects)
  return [
    "/",
    "/velocity-calculator",
    "/portal",
    "/admin",
    "/auth",
    // Public routes
    "/platform",
    "/marketplace-public",
    "/proof-center",
    "/pricing",
    "/contact",
    "/onboarding",
    "/about",
    "/industries/pharmaceutical",
    "/industries/marketing-services",
    "/premium",
    "/ai-acceleration-score",
    "/policy-settings",
    // Enterprise routes
    "/dashboard",
    "/analytics",
    "/policies",
    "/policies/new",
    "/policies/:id",
    "/workflows",
    "/workflows/runs",
    "/audit-trail",
    "/partners",
    "/partners/:id",
    "/marketplace-dashboard",
    "/marketplace",
    "/marketplace/tools",
    "/marketplace/tools/:id",
    "/tool-intelligence",
    "/submissions",
    "/submissions/:id",
    "/decisions",
    "/decisions/:id",
    // Agency routes
    "/agency/dashboard",
    "/agency/requirements",
    "/agency/performance", 
    "/agency/ai-readiness",
    "/agency/my-tools",
    "/agency/compliance-status",
    "/agency/ai-tool-tracking",
    "/agency/integrations",
    "/agency/project-setup",
    "/agency/submissions",
    "/agency/submissions/:id",
    "/agency/reviews",
    "/agency/conflicts",
    "/agency/trust-center",
    "/requirements",
    // Shared utility routes
    "/notifications",
    "/search",
    "/settings",
    // Demo and submission routes
    "/invite/:token",
    "/submission",
    "/submission-confirmation",
    "/lighthouse",
    "/demo",
    "/tier-demo",
    "/document-processing-demo",
    "/demos",
    // Portal routes
    "/portal/dashboard",
    "/portal/billing",
    // Internal routes
    "/internal/dashboard",
    "/internal/governance",
    "/internal/sales",
    "/internal/*",
    // Admin routes
    "/agency/admin/team",
    "/agency/admin/clients",
    "/agency/admin/projects",
    "/agency/admin/settings",
    "/enterprise/admin/users",
    "/enterprise/admin/roles",
    "/enterprise/admin/settings",
    "/enterprise/admin/compliance",
    // Public website routes
    "/industries",
    "/resources",
    // Development routes
    "/dev/route-schema",
    "/dev/spec-status",
    "/dev/route-validation"
  ];
}

export function diffRoutes() {
  const actual = new Set(getRegisteredRoutes());
  const expected = (registry as any).pages.map((p: any) => p.route);

  const missing = expected.filter((r: string) => !actual.has(r));
  const extra = Array.from(actual).filter((r: string) => !expected.includes(r));

  console.table({
    expected: expected.length,
    actual: actual.size,
    missing: missing.length,
    extra: extra.length
  });

  if (missing.length) {
    console.log("Missing routes (expected but not found):");
    missing.forEach((r: string) => console.log(" -", r));
  }
  if (extra.length) {
    console.log("Extra routes (found but not in spec):");
    extra.forEach((r: string) => console.log(" -", r));
  }
}

// After compiling to JS, run: node routeInventory.js
