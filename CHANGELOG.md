# Changelog

## Unreleased

- Main menu: the arrow keys now follow the layout. Down and Up move between rows in the same column, Left and Right move along the row, and Up from the top row goes back to the search box. Before, Down and Right both stepped to the next card in list order, so Down jumped sideways first.

## 1.0.0 (2026-10-17)

First tagged release.

- Twelve tools in one offline file: seven work tools (Log Sanitizer, OSI & Network Reference, Network Calculator, Cheat Sheet, Config Diff, Ping / Traceroute Analyzer, Network Topology Builder) and five practice labs (DNS, Routing, Firewall Rules, Network Fault, vSphere Sandbox).
- Network Topology Builder opens with a sample network so there is something to explore on first load.
- `scripts/check-scripts.mjs` syntax-checks every script in `index.html`, including the embedded tools. It runs on every push.
