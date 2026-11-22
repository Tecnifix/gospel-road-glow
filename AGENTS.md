<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.

## What Lovable manages

Rules outside this block are the project's own. Change the pieces below in
Lovable, not by hand. With the [Lovable MCP](https://mcp.lovable.dev)
connected, `send_message` asks Lovable to do it; otherwise ask the user to
use the editor.

- **Database.** Do not add or edit `supabase/migrations/` or `drizzle/`.
  Ask Lovable to change the schema.
- **Generated files.** Do not edit a file whose header says it is automatically
  generated.
- **AI gateway.** Keep model calls on Lovable's gateway, and keep
  `LOVABLE_API_KEY` out of browser code.
- **Connectors.** Lovable provides native connectors. `list_connectors` shows
  which are enabled; `add_connector` only returns the dashboard link. When a
  connector is enabled, calls go through the connector gateway and need
  `LOVABLE_API_KEY`. When Lovable does not provide one, users can bring their
  own key and store it in Secrets.
- **Secrets.** Lovable manages them. Do not put secret values in the repo.
<!-- LOVABLE:END -->

- Halo background videos share the image's stage and gauge coordinates, play muted in a loop only while animation is enabled, and retain the still image as a loading/error fallback to preserve dashboard alignment.
- Keep theme variants in the shared catalog with separate IDs for distinct artwork and static/animated versions so new media never replaces an existing selection.
- Theme animation is independent of access status; persist selections across reloads and migrate legacy trial selections without a deadline, preserving existing catalog IDs.
- Theme palettes belong to the shared catalog and apply through a single app-level data attribute with semantic CSS tokens, never through the current tab, so navigation and preview expiry keep every view synchronized.
- Each catalog artwork has its own sky-only asset shared by its free and animated variants; secondary views and worship use that sky while home retains figures, rings and videos, keeping navigation and trial expiry coordinated.
- Scanner uses a transparent fixed-aspect SVG stage with an orthographic overhead, brand-neutral cutaway showing seats, chassis and wheels, plus clipped CSS scan effects driven by existing scan state; this preserves USB/demo diagnostics and exposes the selected page background.
- Scanner transport supports aborts and treats missing PIDs separately from connection errors; USB failures never fall back to demo so fictitious results cannot be mistaken for vehicle readings.
- Scanner history is account-scoped in Cloud with RLS; unsigned readings stay in session memory only, and comparisons match vehicle label and source so demo and USB readings are never mixed.
- Scanner code explanations and comparison logic live in a browser-safe shared module; descriptions are educational, not a definitive parts diagnosis.
- Below 1024px, use bottom navigation and a contained 16:9 Halo stage above telemetry; mount only the visible stage to avoid duplicate video playback, and keep the full-screen stage on wider displays so artwork and gauge stay aligned without cropping mobile previews.
- Commerce screens are separate leaf routes using a shared theme-aware shell; never fabricate prices or checkout links, and keep application licensing independent of theme selection.
- Offline application licenses use ECDSA signatures and a nonextractable installation key in IndexedDB; reverify signatures on load, never treat local flags as authorization, and do not claim a browser identity is a physical hardware identifier.
- License issuance requires authenticated server-side role verification before privileged imports; only encrypted signing keys persist in Cloud, key-pair installation is atomic, and repeated issuance for a device recovers its original license.
- Offline verification requires public verification keys downloaded over the configured Cloud connection; it is not an offline installer or DRM, and cached client state is not a production payment entitlement.
