---
name: flowpay-ui
description: Design system + code conventions for the FlowPay frontend. Use this skill whenever you write, restyle, or refactor any React component, page, or asset in `frontend/src/`. It covers the grayscale theme tokens, typography stack, primitive library, landing-page patterns, and node-graph builder patterns so new work stays consistent with the existing system.
---

# FlowPay UI skill

A short, strict guide for working on the FlowPay frontend. The goal is to keep the system coherent across landing and builder surfaces without drifting into gradients, chromatic accents, or ad-hoc inline styles.

When you are unsure about a value, reach for a CSS variable from `frontend/src/styles.css` before inventing a new one. When you need a button, input, modal, chip, or badge, use `frontend/src/ui/*` before writing one from scratch.

---

## 1. Theme

Pure grayscale. No gradients. No chromatic accents. The single emphasis color is white (`#FAFAFA`). Red is permitted only for inline danger signals.

### Surfaces
```
--bg-canvas:  #000000   /* body, builder canvas */
--bg-panel:   #0A0A0A   /* section panels, cards */
--bg-elev:    #111111   /* elevated cards, modals, menus */
--bg-sunken:  #050505   /* inputs, code blocks */
--bg-hover:   #1A1A1A
--bg-active:  #242424
```

### Borders
```
--border:        #1F1F1F   /* default */
--border-strong: #2E2E2E   /* emphasis / hover / active */
--hairline:      #141414   /* very subtle dividers */
```

### Text
```
--text:       #FAFAFA   /* primary */
--text-muted: #A3A3A3   /* secondary */
--text-dim:   #6B6B6B   /* tertiary, timestamps, hints */
```

### Accent (white as emphasis)
```
--accent:        #FAFAFA
--accent-hover:  #FFFFFF
--accent-press:  #E5E5E5
--accent-soft:   rgba(255, 255, 255, 0.08)
--accent-ring:   rgba(255, 255, 255, 0.22)
```

### Semantic (grayscale + one red)
```
--mint, --amber, --info  → retargeted to grayscale tones
--mint-soft, --amber-soft, --info-soft → near-white low-alpha
--danger:      #F87171   /* inline errors only */
--danger-soft: rgba(248, 113, 113, 0.10)
```

The `Badge` and `Chip` primitives keep their `tone` API (`violet | mint | amber | red | blue | neutral`), but only `red` renders chromatically; everything else maps to grayscale. This preserves API stability while enforcing the monochrome look.

### Node kind tints (builder only)
```
--kind-trigger, --kind-strategy, --kind-action, --kind-asset
--kind-*-soft (low-alpha background tints)
```
All grayscale. Differentiation comes from position + icon + subtitle text, not color.

### Shape (sharp)
```
--radius-xs:   2px
--radius-sm:   4px   /* buttons, inputs, chips */
--radius-md:   6px   /* cards, menus */
--radius-lg:   10px  /* large cards, modals */
--radius-xl:   14px  /* hero canvas, waitlist card */
--radius-pill: 9999px /* floating nav, pill form, CTAs inside the nav */
```

Floating or marketing-surface elements use `--radius-xl` or `--radius-pill`. In-app chrome (buttons, inputs, menus) use `--radius-sm` or `--radius-md`. Never hand-type `borderRadius: 8` — pick a token.

### Motion
```
--dur-fast: 120ms   /* hover, press */
--dur-mid:  200ms   /* panel enter, drawer */
--ease-out: cubic-bezier(0.2, 0, 0, 1)
```
Also respect `prefers-reduced-motion: reduce` (globally short-circuited in `styles.css`).

### Elevation
```
--shadow-lift: tight 2/6 drop + 1px inset highlight
--shadow-pop:  tighter 4/16 drop + 1px inset highlight
```
No glows, no soft blur halos, no colored shadows.

---

## 2. Typography

Three fonts. Each has one job.

```
--font-display: "Instrument Serif", serif   /* hero H1, section H2, brand wordmark */
--font-sans:    "Inter Variable", Inter, ... /* everything UI */
--font-mono:    "Geist Mono Variable", ...   /* addresses, tx hashes, timestamps, small labels */
```

Loaded via `@fontsource-variable/inter`, `@fontsource-variable/geist-mono`, and `@fontsource/instrument-serif` (400 + 400-italic) in `src/main.tsx`.

### Where each font goes
- **Instrument Serif**: `<h1>` in hero, `<h2>` in every `SectionHead`, the brand wordmark "FlowPay" in `Nav`, `TopBar`, and `Footer`. Also used italic for pull-quote-style muted lines in hero headlines.
- **Inter**: all body copy, all form elements, all buttons, badges, chips, eyebrows, nav links, FAQ bodies, etc.
- **Geist Mono**: inline-only; timestamps, Stellar issuer/account strings, run IDs, kbd-like keys. Never for chips, buttons, or headings.

### Type helpers (in `styles.css`)
- `.fp-display` — display serif, 400, -0.02em tracking
- `.fp-display-italic` — italic variant
- `.fp-eyebrow` — uppercase sans eyebrow (11px, 600, 1.4px tracking)
- `.fp-mono` — monospace span utility

### Sizing
- Hero H1: `clamp(48px, 7vw, 84px)` / `line-height: 0.98`
- Section H2: `clamp(32px, 4.2vw, 48px)` / `line-height: 1.05`
- Body: 13–15px / `line-height: 1.55–1.6`
- Eyebrow: 11px uppercase

---

## 3. File layout

```
frontend/src/
├── main.tsx               # Router + font + styles bootstrap
├── App.tsx                # Routes: "/" → Landing, "/app" → WorkflowBuilder (lazy)
├── styles.css             # Design tokens + global resets + React Flow overrides
│
├── ui/                    # PRIMITIVE LIBRARY — use these first
│   ├── Button.tsx         # primary | secondary | ghost | danger
│   ├── Input.tsx          # with leading/trailing adornments, invalid state
│   ├── Field.tsx          # label + hint/error wrapper
│   ├── Card.tsx           # surface or elevated wrapper
│   ├── Modal.tsx          # portal + focus trap + Escape + scroll lock
│   ├── Badge.tsx          # tone pill
│   ├── Chip.tsx           # interactive pill with optional dot
│   ├── Tabs.tsx           # generic tabs bar
│   ├── Kbd.tsx            # keyboard key render
│   ├── EmptyState.tsx     # icon + title + body + optional action
│   ├── Toast.tsx          # toaster container (reads toastStore)
│   └── toastStore.ts      # zustand toast bus — call toast.success/error/info
│
├── components/            # builder shell (TopBar, NodePalette, Inspector, ActivityPanel, modals)
├── nodes/                 # React Flow custom node types + BaseNode wrapper
├── pages/
│   ├── Landing.tsx
│   ├── WorkflowBuilder.tsx
│   └── landing/           # Nav, Hero, HeroGraph, HowItWorks, Features, Showcase, Waitlist, FAQ, Footer
├── store/                 # zustand stores (graphStore, walletStore)
├── api/                   # fetch clients (workflows, events, waitlist)
└── lib/                   # workflow serializer, Freighter adapter, asset presets
```

---

## 4. Code conventions

### Styling
- **CSS variables only** for color / spacing / radius / motion. Never hand-type `#0A0A0A` when `var(--bg-panel)` exists.
- **Inline `CSSProperties`** is the pattern — no CSS modules, no Tailwind, no styled-components. Keep style objects local to the component; hoist to module-scope `const xxxStyle: CSSProperties = {...}` when they are static and reused.
- Use module-scoped constants for static styles, inline literals only for per-render variations (hover state, active flag, etc.).
- Hover / focus / active variations: handle via `onMouseEnter/Leave` mutations of `e.currentTarget.style` or via `:focus-visible` in `styles.css`. Do not write new CSS files.
- Only one CSS file: `frontend/src/styles.css`. Everything else is inline.

### Component shape
- Components are functional + typed. Export the default component; keep helper subcomponents in the same file.
- Extract a shared chrome wrapper when 3+ variants repeat it (see `nodes/BaseNode.tsx` wrapping the four kind-specific node components).
- Keep per-kind code in leaf components (`TriggerNode`, `StrategyNode`, `AssetNode`, `ActionNode`).
- Modals should wrap `ui/Modal`. Never re-implement the overlay + dialog chrome.

### Primitives to reach for (before writing new ones)
| Need | Use |
|---|---|
| Any button | `ui/Button` (`primary | secondary | ghost | danger`, `sm | md`, `loading`, `leadingIcon`, `trailingIcon`) |
| Text input | `ui/Input` + wrap in `ui/Field` for label/hint/error |
| Labeled form row | `ui/Field` |
| Elevated panel | `ui/Card elevated` |
| Dialog | `ui/Modal` with `title`, `description`, `children`, `footer` |
| Status chip | `ui/Badge` (`tone`, `dot`, `mono`) |
| Interactive pill | `ui/Chip` (wallet chip, preset chip) |
| Tab bar | `ui/Tabs` |
| Empty state | `ui/EmptyState` |
| Toast | `import { toast } from "./ui/toastStore"; toast.success("…")` |
| Dropdown | existing `components/Select.tsx` (API-stable, dark-restyled) |

### Routing
- Router is `react-router-dom@6` in `main.tsx`.
- `/` is the Landing; `/app` is the builder (`lazy` + `Suspense`). Unknown routes → `Navigate` to `/`.
- Navigate between surfaces with `<Link to="/" />` or `<Link to="/app" />`.

### Landing page patterns
- All section heads go through `SectionHead({ eyebrow, title, sub })` from `pages/landing/HowItWorks.tsx`. Centered, serif H2, optional eyebrow, optional sub copy. Do not re-roll a section header.
- Standard section container: `padding: "72px 24px"`, `max-width: 1200` or `820` depending on whether the section has a grid or long-form prose.
- Full-bleed visual moments (hero canvas, waitlist card) use the dotted-grid background pattern:
  ```
  backgroundImage:
    "radial-gradient(circle at 1px 1px, rgba(255,255,255,0.06) 1px, transparent 0)",
  backgroundSize: "22px 22px",
  maskImage:
    "radial-gradient(ellipse 90% 80% at 50% 50%, black 30%, transparent 85%)"
  ```
- Nav is a floating centered pill (`position: fixed; top: 16px; left: 50%; transform: translateX(-50%);`) with backdrop blur. Only the CTA inside the pill uses the primary button style; inline links use the `NavLink` helper (hover → `var(--bg-hover)` pill).

### Builder patterns
- The builder shell (`pages/WorkflowBuilder.tsx`) is three columns: NodePalette (264px) / Canvas + ActivityPanel (flex) / Inspector (340px, animated width).
- React Flow is dark-themed via overrides in `styles.css`. Controls, minimap, edges, handles all pull from the same tokens.
- Every custom node is a thin wrapper around `nodes/BaseNode` which handles card chrome, the left accent border, the hover toolbar, and handle positioning.
- Activity log events are tagged with `kind` (tick / decision / error / info). Each maps to a `Badge` tone + a left border color. The tones are mostly grayscale; only `error` stands out chromatically.

### Waitlist backend
- `POST /waitlist` on the Express backend. Zod-validated email. In-memory IP rate limit (5/min/IP). Upsert on conflict (does not leak membership).
- Frontend client: `frontend/src/api/waitlist.ts → postWaitlist({ email, source?, referrer? })`.
- Supabase table: `waitlist_signups (id bigserial, email unique, source, referrer, created_at)` defined in `backend/drizzle/0002_waitlist.sql`.

---

## 5. Dos and don'ts

**Do**
- Compose pages out of primitives. If it is not in `ui/`, check if the pattern should be promoted there.
- Keep copy pragmatic and declarative. No hype, no adjective stacks, no rocket emojis.
- Ship every new surface in the grayscale + serif-display + sans-body + mono-accent mix.
- Use commas and periods for pauses, not em-dashes.
- Verify `tsc --noEmit` and `vite build` before committing anything non-trivial.

**Don't**
- Introduce gradients, colored shadows, neon glows, or accent hues beyond the existing palette.
- Hand-roll a button / input / modal / toast. Extend the primitive instead.
- Add a second global CSS file, Tailwind, CSS-in-JS library, or emotion.
- Reach for emojis in UI unless the user explicitly asks.
- Write multi-paragraph comments in component files; one short line at most when the WHY is non-obvious.
- Ship a feature without looking at it in the browser at both landing and builder surfaces.

---

## 6. Quick recipes

**A new landing section**
```tsx
import { SectionHead } from "./HowItWorks";

export default function MySection() {
  return (
    <section id="my-section" style={{ padding: "72px 24px", maxWidth: 1200, margin: "0 auto" }}>
      <SectionHead eyebrow="Section label" title="Section headline." sub="One sentence." />
      <div style={{ marginTop: 48, /* grid, cards, etc. */ }}>
        {/* content using ui/* primitives */}
      </div>
    </section>
  );
}
```

**A new modal**
```tsx
import Modal from "../ui/Modal";
import Button from "../ui/Button";

<Modal
  open={open}
  onClose={close}
  title="Title"
  description="One short sentence."
  footer={<>
    <Button variant="ghost" onClick={close}>Cancel</Button>
    <Button variant="primary" onClick={submit}>Confirm</Button>
  </>}
>
  {/* body */}
</Modal>
```

**A new node type (builder)**
```tsx
import { Position, type NodeProps } from "@xyflow/react";
import { MyIcon } from "lucide-react";
import BaseNode from "./BaseNode";
import type { FlowNode } from "../store/graphStore";

export default function MyNode({ id, data, selected }: NodeProps<FlowNode>) {
  return (
    <BaseNode
      id={id}
      kind="strategy" /* drives the accent color */
      selected={!!selected}
      icon={<MyIcon size={15} strokeWidth={2} />}
      title={data.label}
      subtitle="optional small copy"
      handles={[
        { type: "target", position: Position.Left, id: "assets" },
        { type: "source", position: Position.Right },
      ]}
    />
  );
}
```

**Toast from anywhere**
```ts
import { toast } from "../ui/toastStore";

toast.success("Saved");
toast.error("Network error");
toast.info("Already running");
```
