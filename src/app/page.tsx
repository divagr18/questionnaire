import { ArrowRight, Command, Layers3 } from "lucide-react";
import Link from "next/link";

import { BrandMark } from "@/components/brand-mark";
import { PackCard } from "@/components/pack-card";
import { getStudioStats, listPacks } from "@/lib/repository";

export const dynamic = "force-dynamic";

export default function HomePage() {
  const packs = listPacks({ publishedOnly: true });
  const stats = getStudioStats();

  return (
    <main className="site-shell">
      <header className="site-header">
        <BrandMark />
        <div className="header-actions">
          {packs[0] && <Link className="header-link" href={`/f/${packs[0].slug}`}>Open form</Link>}
          <Link className="button button-quiet" href="/admin">
            <Command size={15} /> Studio
          </Link>
        </div>
      </header>

      <section className="home-hero">
        <div className="hero-copy">
          <h1>Create the questions.<br />Run the room.</h1>
          <p className="hero-lede">
            Build a focused form, collect responses on your local network, and present each
            question full-screen—all from the same pack.
          </p>
          <div className="hero-actions">
            <Link className="button button-primary button-large" href="/admin">
              Create a pack <ArrowRight size={17} />
            </Link>
            {packs[0] && (
              <Link className="text-link" href={`/f/${packs[0].slug}`}>
                Preview form
              </Link>
            )}
          </div>
        </div>
        <div className="hero-board" aria-label="Example question board">
          <div className="hero-board-meta">
            <span>Live queue</span>
            <span>Opening pulse · 03 / 04</span>
          </div>
          <div className="hero-board-question">
            <p>How ready are you to act on what you learn?</p>
            <div className="scale-preview" aria-hidden="true">
              {[1, 2, 3, 4, 5].map((value) => <span key={value}>{value}</span>)}
            </div>
          </div>
          <div className="hero-board-progress"><span /></div>
        </div>
      </section>

      <section className="home-summary" aria-label="Studio summary">
        <div><span>{stats.queued}</span><p>Queued</p></div>
        <div><span>{stats.packs}</span><p>Packs</p></div>
        <div><span>{stats.submissions}</span><p>Submitted</p></div>
        <div className="summary-note"><Layers3 size={18} /><p>Queue and slides stay in sync.</p></div>
      </section>

      <section className="pack-gallery-section">
        <div className="section-heading">
          <div>
            <h2>Live packs</h2>
          </div>
          <Link className="text-link" href="/admin">Manage <ArrowRight size={15} /></Link>
        </div>
        <div className="pack-gallery">
          {packs.length > 0 ? (
            packs.map((pack) => <PackCard key={pack.id} pack={pack} />)
          ) : (
            <div className="empty-state">
              <Layers3 size={28} />
              <h3>No live boards yet</h3>
              <p>Create a board and open it when you are ready for questions.</p>
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
