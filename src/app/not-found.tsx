import { ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function NotFound() {
  return (
    <main className="not-found-page">
      <p className="eyebrow">404 · Off script</p>
      <h1>That page is not in this pack.</h1>
      <p>The link may have changed, or this board may not be open yet.</p>
      <Link className="button button-primary" href="/"><ArrowLeft size={16} /> Back home</Link>
    </main>
  );
}
