"use client";

import { motion } from "framer-motion";
import { ArrowRight, Check, RefreshCw } from "lucide-react";
import { FormEvent, useState } from "react";
import type { Pack } from "@/lib/types";

export function FormExperience({ pack }: { pack: Pack }) {
  const [name, setName] = useState(""); const [question, setQuestion] = useState("");
  const [busy, setBusy] = useState(false); const [error, setError] = useState(""); const [receipt, setReceipt] = useState("");

  async function submit(event: FormEvent) {
    event.preventDefault(); if (!name.trim() || question.trim().length < 3) return;
    setBusy(true); setError("");
    try {
      const token = crypto.randomUUID();
      const response = await fetch(`/api/forms/${pack.slug}/submit`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ submissionToken: token, name, question }) });
      const result = await response.json() as { receiptCode?: string; error?: string };
      if (!response.ok) throw new Error(result.error || "Could not save your question.");
      setReceipt(result.receiptCode ?? "Saved");
    } catch (caught) { setError(caught instanceof Error ? caught.message : "Could not save your question."); }
    finally { setBusy(false); }
  }

  if (receipt) return <main className="form-shell tally-form-shell"><motion.section className="form-panel complete-panel" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}><div className="complete-check"><Check /></div><h1>Question sent.</h1><p>The host can now add it to the live queue.</p><span className="receipt">{receipt}</span><button className="button button-quiet" type="button" onClick={() => { setName(""); setQuestion(""); setReceipt(""); }}><RefreshCw size={15} /> Ask another</button></motion.section></main>;

  return <main className="form-shell tally-form-shell">
    <section className="tally-document">
      <div className="tally-heading"><h1>Ask a question</h1><p>Send your question to the host. It may be selected for the live discussion.</p></div>
      <form className="question-submit-card" onSubmit={submit}>
        <label>Your name<input autoComplete="name" autoFocus value={name} onChange={(event) => setName(event.target.value)} placeholder="Name" /></label>
        <label>Your question<textarea value={question} onChange={(event) => setQuestion(event.target.value)} placeholder="Ask one clear question..." rows={6} /></label>
        {error && <p className="form-error">{error}</p>}
        <button className="button button-primary" disabled={busy || !name.trim() || question.trim().length < 3} type="submit">{busy ? "Sending..." : "Send question"}<ArrowRight size={16} /></button>
      </form>
    </section>
  </main>;
}
