import { ArrowUpRight, MonitorPlay, Rows3 } from "lucide-react";
import Link from "next/link";

import type { Pack } from "@/lib/types";

export function PackCard({ pack }: { pack: Pack }) {
  return (
    <article className={`pack-card accent-${pack.accent}`}>
      <div className="pack-card-topline">
        <span className="status-dot" />
        <span>{pack.isPublished ? "Live pack" : "Draft"}</span>
        <span className="pack-question-count">
          <Rows3 size={14} /> {pack.queue.length} queued
        </span>
      </div>
      <div className="pack-card-body">
        <h2>{pack.name}</h2>
        <p>{pack.description || "A focused set of questions ready for the room."}</p>
      </div>
      <div className="pack-card-actions">
        <Link className="button button-primary" href={`/f/${pack.slug}`}>
          Open form <ArrowUpRight size={16} />
        </Link>
        <Link className="button button-quiet" href={`/present/${pack.slug}`}>
          <MonitorPlay size={16} /> Present
        </Link>
      </div>
    </article>
  );
}
