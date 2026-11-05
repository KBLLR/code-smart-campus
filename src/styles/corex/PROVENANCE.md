# Core-X design tokens — vendored snapshot

Smart Campus does not define its own design system. The two token files in this
folder are **byte-identical copies** of the Core-X design-system adapter that
Core-X UI ships. They are vendored (not imported by path) because Smart Campus
builds as a standalone house repository.

| File | Core-X source path | SHA-256 |
|---|---|---|
| `kbllr.tokens.css` | `core-x/ui/src/design-system/tokens/kbllr.css` | `b8444747ae71a73b8588f168c3b0e0f5b3de17f216f46c32e9e48a24b7b2cb67` |
| `motion.css` | `core-x/ui/src/design-system/vendor/drive-1ZWDmsFh/tokens/motion.css` | `4a7a045adc64b3bf206b01a692004a54f517e48c92581f1a9fbccc56f005d3e3` |

- Copied from KBLLR/core-x at `789a7b86c10c4c23d0deb6ca13518e3c60c236a4` (2026-11-05); last source change `8b8b492` (2026-08-30).
- `motion.css` matches the digest recorded in Core-X `core-x/ui/src/design-system/provenance.json` (Drive item `1CuWj5yFeffxDKQJoce4kz4pAirOiqSUP`).
- Do not edit these files. Re-copy and update this table when Core-X changes them; once a
  `@corex/ds-tokens-core` / `@corex/ds-houses` package is published, replace the copies with the package.

## Usage in Smart Campus

- `kbllr.tokens.css` is scoped to `[data-corex-design-system="kbllr"]`; `index.html` sets it on `<body>`.
- `spacejs-corex.css` maps Space.js `--ui-*` variables onto these tokens so Point3D labels share Core-X type and colour.
- `src/styles/campus-shell.css` is application CSS (layout of the Smart Campus shell). It only consumes tokens.
- Room-category tints in `src/scene/categoryPalette.js` are house-local application colours, **not** Core-X tokens
  (Canon v0.1 has no canonical data-viz or identity palette).

## Known Canon contradiction (not resolved here)

Core-X Canon v0.1 (`core-x/docs/design/core-x-design-system-canon-v0.1.md`, CX-CONFLICT-002) records the
canonical interactive accent as neutral `#2d2824`, while the shipped adapter sets `--accent: #ff7a3d`.
Smart Campus follows the Canon for actions (primary buttons are neutral inverse `--fg1`) and uses
`--accent` only where the adapter's own components do: focus rings and the active-item mark.
