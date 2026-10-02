# Brandon Spell — how to build with this system

This is a **styles-only** design system: there are no React components and `window.BrandonSpell` is empty. Build plain JSX/HTML and style it with the `bs-` classes and `--bs-*` tokens in `styles.css` (the classes live in `_ds_bundle.css`, which `styles.css` imports). Read `_ds_bundle.css` before styling: every class below is defined there with comments.

## Setup

- Link `styles.css` once. It loads Montserrat (400, 600) and Space Mono (400, 700) from Google Fonts.
- Wrap the whole design in `<div className="bs-page">`. Without it there is no blush ground, no black Montserrat text and no 12px/2 body copy.
- Indent page content with `bs-container bs-inset` (65rem max width; 5rem left padding that clears the rotated nav).

## The look, in rules

- Ground is always `--bs-main-color` (#efd2d5 blush). Text, rules and solid pills are `--bs-black`. White only for text on black.
- `--bs-yellow` is a highlight, never text and never a large fill: underlines (`bs-hl`, `bs-mark`), hover fill on pills, the focus bar under fields.
- Headlines: `bs-display` (6vw), `bs-display--page` (5vw), `bs-display--section` (4vw), `bs-display--cta` (3.5vw); all Montserrat 400, line-height 1. Put one key word in `<span className="bs-hl bs-hl--on">`; `bs-hl` alone sweeps in on hover.
- Under a headline, one plain sentence in `bs-lead`. Running copy is plain `<p>` (12px, line-height 2) or `bs-body`.
- Small labels, chips, buttons and nav are Space Mono; uppercase only for buttons, field labels and nav.
- Corners are square except pills (`--bs-radius-pill`). No shadows, no gradients, no icons: use text arrows (→ ↗).
- Section dividers are 2px black rules (`bs-service` top rule, `bs-section-heading--ruled`).

## Class vocabulary

| Need | Classes |
|---|---|
| Page and layout | `bs-page`, `bs-container`, `bs-inset`, `bs-split` (1fr 2fr from 40em) |
| Type | `bs-display` (+ `--page`, `--section`, `--cta`), `bs-lead`, `bs-body`, `bs-section-heading` (+ `--ruled`), `bs-meta` (+ `--muted`) |
| Links and highlight | `bs-link` (mono, 2px underline), `bs-mark` (4px yellow bar), `bs-hl`, `bs-hl--on` |
| Pills | `bs-btn` (+ `--lg`, `--fixed` for a top-right "Start a project →"), `bs-chips` + `bs-chip`, `bs-choices` |
| Forms | `bs-form`, `bs-field-row`, `bs-field` (label `<span>` or `<legend>`, then input/textarea), `bs-notice` (+ `--error`) |
| Patterns | `bs-service` (+ `<ul>`), `bs-list`, `bs-work-grid` + `bs-card` (+ `--wide`, `__overlay`, `__text`, `__title`, `__desc`, `__visit`), `bs-nav` (+ `a.is-active`), `bs-footer`, `bs-fade-up` |

Choice pills are `<label><input type="checkbox"/><span>Text</span></label>` inside `bs-choices`. In `bs-work-grid`, pair one `bs-card--wide` with one `bs-card` per row.

Tokens: `--bs-main-color --bs-black --bs-white --bs-yellow --bs-ink-muted --bs-ink-placeholder --bs-font-stack --bs-font-alternative --bs-chip-gap --bs-container-max --bs-container-pad --bs-page-inset --bs-column-gap --bs-stack-gap --bs-form-gap --bs-field-row-gap --bs-grid-gap --bs-radius-pill --bs-hairline --bs-rule --bs-highlight-bar --bs-highlight-thickness`. Breakpoints are 40em (tablet up) and 64em (desktop up).

## Voice

First person, warm and plain: "I'm easy to get in touch with!", "I design and build websites for churches, ministries and conferences." No emoji, no exclamation-heavy sales copy.

## Example

```jsx
<div className="bs-page">
  <a className="bs-btn bs-btn--fixed" href="#contact">Start a project →</a>
  <div className="bs-container bs-inset" style={{ paddingTop: '5rem' }}>
    <h1 className="bs-display bs-display--page">
      Websites for <span className="bs-hl bs-hl--on">churches</span>, ministries and conferences.
    </h1>
    <p className="bs-lead" style={{ marginTop: '2rem' }}>
      I design and build them. <a className="bs-link" href="#">See services →</a>
    </p>
    <section className="bs-service">
      <div>
        <h2 className="bs-section-heading">Launch pages</h2>
        <div className="bs-chips"><span className="bs-chip">1–2 weeks</span></div>
      </div>
      <div>
        <p>One focused page for a book, an album or a campaign.</p>
        <ul><li>Custom single-page design</li><li>Links to buy, listen or give</li></ul>
      </div>
    </section>
  </div>
</div>
```
