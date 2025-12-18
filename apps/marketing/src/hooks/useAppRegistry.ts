import { useMemo } from 'react';
import registry, { AppRegistry, AppRegistryPage, findPageByRoute, findPageBySpecId } from '@/appRegistry';

export function useAppRegistry() {
  const data = registry;

  const stats = useMemo(() => {
    const pages = data.pages;
    const total = pages.length;
    const implemented = pages.filter(p => p.status === "YES").length;
    const partial = pages.filter(p => p.status === "PART").length;
    const notImplemented = pages.filter(p => p.status === "NO").length;
    
    const byApp = data.apps?.map(app => {
      const appPages = pages.filter(p => p.appKey === app.key);
      return {
        ...app,
        total: appPages.length,
        implemented: appPages.filter(p => p.status === "YES").length,
        partial: appPages.filter(p => p.status === "PART").length,
        notImplemented: appPages.filter(p => p.status === "NO").length,
        completionRate: appPages.length > 0 ? (appPages.filter(p => p.status === "YES").length / appPages.length) * 100 : 0
      };
    }) || [];

    return {
      total,
      implemented,
      partial,
      notImplemented,
      completionRate: total > 0 ? (implemented / total) * 100 : 0,
      byApp
    };
  }, [data]);

  return {
    data,
    stats,
    findPageByRoute,
    findPageBySpecId,
    pages: data.pages,
    apps: data.apps || []
  };
}

export function usePageStatus(route: string) {
  const page = findPageByRoute(route);
  return {
    page,
    status: page?.status || "NO",
    specId: page?.specId,
    isImplemented: page?.status === "YES",
    isPartial: page?.status === "PART",
    isNotImplemented: page?.status === "NO"
  };
}