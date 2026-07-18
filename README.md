# Questions

Local event Q&A for an offline Wi-Fi network. Attendees submit a name and question, the host curates an ordered live queue, and the presentation updates as the queue changes.

## Run locally

Requirements: Node.js 22+ and pnpm.

```bash
pnpm install
pnpm build
pnpm start
```

Open:

- `/f/opening-pulse` — attendee form
- `/admin` — queue editor
- `/present/opening-pulse` — live presentation

Set `DATABASE_PATH` to move the SQLite file. It defaults to `data/event-studio.db`. SQLite runs in WAL mode with full synchronous writes, foreign keys, and a five-second busy timeout.

## Live behavior

The presentation requests `/api/live/[slug]` every 800 ms with caching disabled. Queue changes and text edits therefore appear without reloading. If the item currently on screen is reordered, the presentation follows its submission ID. If it is removed, the deck moves to the nearest valid slide.

The admin inbox refreshes every 1.5 seconds so new attendee questions appear automatically.
