# IT Skills Kit

A single-file, offline suite of networking and IT tools and labs. No build step, no server, no external requests — open [`index.html`](./index.html) in a browser and everything runs client-side.

It started as one tool ([Log Sanitizer](#log-sanitizer)) and keeps growing — this is a running project, not a finished release.

**[Download the latest `index.html`](https://raw.githubusercontent.com/the-best-Knight/network-skills-kit/main/index.html)** — right-click → Save As, or open it directly. Same file that's live at [ianknight.org/tools/network-skills-kit.html](https://ianknight.org/tools/network-skills-kit.html).

## Log Sanitizer

The tool this kit was built around, and still the one used the most. Paste a log, config dump, or command output and it finds and redacts sensitive values in real time — internal IPs, hostnames, usernames, API keys, tokens, passwords, and anything matching a custom pattern — before that log goes into a support ticket, a vendor case, a chat message, or an AI tool.

- **Nothing uploads.** A strict CSP blocks outbound network requests entirely; settings persist to that browser's local storage only.
- **Extra-sandboxed.** Its iframe runs with a restrictive sandbox (`allow-scripts allow-modals allow-downloads allow-popups`, deliberately missing `allow-same-origin`) so the frame holding your secrets is opaque even to the kit's own parent page.
- **Configurable detection.** Sensitivity presets (Strict / Standard / Technical / Audit-only), vendor-aware detection profiles (Cisco, Dell OS10, VMware/ESXi, Windows/AD, Kubernetes), and per-session operator rules.
- **Encrypted export.** Anything downloaded or copied out is AES-GCM (or OpenSSL-compatible) encrypted.

## The rest of the kit

| Tool | What it does |
| --- | --- |
| Log Sanitizer | Redacts secrets/identifiers from logs before you share them |
| Command Translator | Converts a command between CLI dialects (shells, package managers, Docker, Kubernetes) |
| Network Calculator Toolkit | Subnet/VLSM calculators, base/hex converters, hash verifier, ACL builder, port matrix |
| Cheat Sheet | Switch CLI reference (Cisco / Dell / Junos), prefix tables, plain-English glossary |
| DNS Lab | Offline DNS simulator — dig-style queries, zone database, broken-record scenarios |
| Routing Lab | Longest-prefix match, live routing tables, packet path visualization, BGP best-path quiz |
| Firewall Rules Lab | ACL simulator — ordered rules, packet tester, implicit deny, policy scenarios |
| Network Fault Lab | Diagnose-and-fix scenarios with a live topology, multi-vendor CLI lessons (Dell OS10 / Cisco IOS / Junos) |

More gets added as it's built. See the [writeup](https://ianknight.org/blog/it-skills-kit/) for the story behind each one.

## Mobile

The tool switcher collapses into a horizontally-scrolling strip under 640px wide instead of wrapping into multiple rows, so it stays usable from a phone.

## Usage

Just open `index.html`. Each tool is embedded inline and loaded into an iframe on demand — nothing to install, nothing to configure.
