// Scopes vendor XP.css to [data-theme="xp"] so it never leaks into other themes.
// - :root/html/body selectors become the theme root itself.
// - Every other selector is prefixed with the theme root and gets an opt-out:
//   anything inside [data-xp-off] keeps the design-system styling.
// Usage: node scripts/scope-xp.mjs  (reads vendor/xp/XP.css → src/vendor/xp-scoped.css)
import fs from "node:fs";
import postcss from "postcss";
import parser from "postcss-selector-parser";

const ROOT = '[data-theme="xp"]';
const OFF = ":where(:not([data-xp-off], [data-xp-off] *))";
const src = fs.readFileSync(new URL("../vendor/xp/XP.css", import.meta.url), "utf8");

const scopeSelector = (sel) =>
  parser((root) => {
    root.each((s) => {
      const first = s.first;
      // :root / html / body → theme root
      if (first && ((first.type === "pseudo" && first.value === ":root") || (first.type === "tag" && ["html", "body"].includes(first.value)))) {
        first.replaceWith(parser.attribute({ attribute: "data-theme", operator: "=", value: "xp", quoteMark: '"' }));
        return;
      }
      // insert opt-out before trailing pseudo-element of the last compound
      const nodes = s.nodes;
      let insertAt = nodes.length;
      for (let i = nodes.length - 1; i >= 0; i--) {
        const n = nodes[i];
        if (n.type === "combinator") break;
        if (n.type === "pseudo" && (n.value.startsWith("::") || [":before", ":after", ":first-line", ":first-letter"].includes(n.value))) insertAt = i;
      }
      const off = parser().astSync(OFF).first.first;
      if (insertAt === nodes.length) s.append(off);
      else s.insertBefore(nodes[insertAt], off);
      s.prepend(parser.combinator({ value: " " }));
      s.prepend(parser.attribute({ attribute: "data-theme", operator: "=", value: "xp", quoteMark: '"' }));
    });
  }).processSync(sel);

const out = postcss([
  {
    postcssPlugin: "drop-fonts",
    AtRule: { "font-face": (at) => at.remove() }, // XP UI text is Tahoma; the pixel fonts are not shipped
  },
  {
    postcssPlugin: "scope-xp",
    Rule(rule) {
      if (rule.parent?.type === "atrule" && /keyframes/.test(rule.parent.name)) return;
      if (rule._scoped) return;
      // Drop docs-page typography from GUI.css (headings, code, pre): the app owns its type scale.
      if (/^(h[1-6]|code|pre|u)\b/.test(rule.selector.trim())) return rule.remove();
      // Root rule: keep custom properties only; the app sets its own font and colour.
      if (/^(:root|html|body)$/.test(rule.selector.trim())) {
        rule.walkDecls((d) => {
          if (!d.prop.startsWith("--")) d.remove();
        });
      }
      rule.selector = scopeSelector(rule.selector);
      rule._scoped = true;
    },
  },
]).process(src, { from: undefined }).css;

fs.writeFileSync(new URL("../src/vendor/xp-scoped.css", import.meta.url), `/* Generated from vendor/xp/XP.css by scripts/scope-xp.mjs. Do not edit. */\n${out}`);
console.log("wrote src/vendor/xp-scoped.css", out.length, "bytes");
