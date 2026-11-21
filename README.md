# Hearts

Play the classic card game Hearts in the browser, on a phone or a desktop. Play online with friends, or offline against bots.

**Play:** https://heart-game.jirachai.me

- **Creator:** [wytesk133](https://github.com/wytesk133). The original game is kept in [`legacy/`](legacy/).
- **Modernized by:** [antronic](https://github.com/antronic) + Claude

## What's inside

| Path | What it is |
| --- | --- |
| `packages/engine` | The rules of Hearts and the bots, as pure TypeScript with no I/O. Shared by the browser and the server. |
| `packages/protocol` | The JSON messages sent over the WebSocket, validated with valibot. |
| `packages/ui` | The design system: SolidJS components, the game screens, 4 themes × light/dark, and Storybook. |
| `apps/web` | The app: Solid + Vite + PWA. Solo games run entirely in the browser and work offline. |
| `apps/server` | Online rooms. `worker.ts` runs on Cloudflare Workers + Durable Objects; `node.ts` runs the same rooms on plain Node. |
| `legacy/` | The original Node + Socket.io version by wytesk133. |

Rules: 2♣ leads, follow suit, no points on the first trick, hearts must be broken before they're led, Q♠ = 13, shooting the moon gives everyone else 26, and the game ends at 100 (or 50).

## Develop

Requires Node 22+ and pnpm 10.

```sh
pnpm install
pnpm test            # engine + room tests (vitest)
pnpm dev:web         # Vite dev server at http://localhost:5173 (proxies /api to :8787)
pnpm dev             # builds the web app, then runs the Worker locally with wrangler at :8787
pnpm dev:node        # or run the server on plain Node at :8787, no Cloudflare needed
pnpm storybook       # design system at http://localhost:6006
```

## Deploy

**Cloudflare (default).** Every push to `master` runs `.github/workflows/deploy.yml`. Add these repository secrets first:

- `CLOUDFLARE_API_TOKEN`: needs Workers Scripts Edit and Account Settings Read for the account, plus Workers Routes Edit, DNS Edit and Zone Read for the zone.
- `CLOUDFLARE_ACCOUNT_ID`

To deploy by hand, run `pnpm deploy`. The custom domain is set in `apps/server/wrangler.jsonc`.

**Anywhere else.** Run `pnpm build`, then `node --import tsx apps/server/src/node.ts` (`PORT` defaults to 8787). It serves `apps/web/dist` and the API from a single process. Nothing in the engine, protocol, UI or web app depends on Cloudflare.

## License

GPL-3.0, the same as the original. See [LICENSE.txt](LICENSE.txt).
