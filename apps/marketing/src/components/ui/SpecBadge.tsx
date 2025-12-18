import registry from "@/appRegistry";

type Status = "YES" | "PART" | "NO";

export default function SpecBadge({ id }: { id: string }) {
  const page = (registry as any).pages.find((p: any) => p.specId === id);
  const status: Status = (page?.status ?? "NO") as Status;

  const label =
    status === "YES" ? "Implemented" :
    status === "PART" ? "Partial" : "Not Implemented";

  const cls =
    status === "YES"  ? "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200" :
    status === "PART" ? "bg-amber-50 text-amber-700 ring-1 ring-amber-200" :
                        "bg-rose-50 text-rose-700 ring-1 ring-rose-200";

  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-medium ${cls}`}>
      <span className="opacity-70">Spec</span> {id}
      <span className="opacity-60">•</span>
      {label}
    </span>
  );
}
