import registry from "../.well-known/app-registry.json";

export default registry;

export type AppRegistryPage = {
  specId: string;
  appKey: string;
  route: string;
  component: string;
  status: string;
  dataWired: boolean;
};

export type AppRegistryApp = {
  key: string;
  name: string;
  root: string;
};

export type AppRegistry = {
  generated_at?: string;
  version?: string;
  lastUpdated?: string;
  apps?: AppRegistryApp[];
  pages: AppRegistryPage[];
};

export function findPageByRoute(route: string): any {
  return registry.pages.find((page: any) => page.route === route);
}

export function findPageBySpecId(specId: string): any {
  return registry.pages.find((page: any) => page.specId === specId);
}