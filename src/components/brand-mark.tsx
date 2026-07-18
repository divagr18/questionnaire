import Link from "next/link";
export function BrandMark({ compact = false }: { compact?: boolean }) {
  return <Link className="plain-wordmark" href="/" aria-label="Questions home">{compact ? "Questions" : "Questions"}</Link>;
}
