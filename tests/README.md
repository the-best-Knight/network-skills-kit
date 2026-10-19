# Tests

Everything here runs against `index.html` itself, so a test checks the code that ships. Nothing is installed: there is no `package.json` and no dependency.

## Syntax check

```sh
node scripts/check-scripts.mjs
```

Parses every script in `index.html`, including the tools embedded in it. It catches the kind of typo that stops a whole tool from starting.

## Engine tests (Node)

```sh
node tests/engine/suite.mjs      # 71 tests for the Topology Builder's network-data engine
node tests/engine/fuzz.mjs 800   # 800 batches of damaged and mixed-up device output; nothing may throw
```

`tests/engine/load.mjs` cuts the engine out of `index.html` (it is the part of the Topology Builder's script before the drawing code) and runs it with no browser. The inputs are in `tests/fixtures/`: realistic Cisco, Dell, Palo Alto, ESXi, Linux and Windows output written for the tests. The Windows output follows the layout of the real commands but is not captured from a machine.

## Browser tests (headless Firefox)

```sh
sh tests/run.sh                  # every test file
sh tests/run.sh fault-lab        # one file, named without .test.mjs
KIT=file:///path/to/other.html sh tests/run.sh hub-keys   # test a different build
```

Needs Firefox. If it is not in a standard place, set `FIREFOX=/path/to/firefox`. Each file gets a new browser profile, so every test starts like a first-time visitor. Files named `*.light.test.mjs` run with a light browser and `*.dark.test.mjs` with a dark one. A test that checks theme colours must be named for its theme: the GitHub runner opens a light browser, a Mac in dark mode opens a dark one, and an unpinned test passes on one and fails on the other. Downloads land in a temporary folder that the tests read, and screenshots some tests take go to the system temp folder, never into the repository.

| File | What it covers |
| --- | --- |
| `hub-keys` | Arrow keys on the main menu follow the layout of the cards |
| `branding` | The IK logo is at the top of the hub and every tool, and the banned words appear nowhere |
| `fault-lab` | Dell is the default, `?` lists commands per mode in alphabetical order, `show interface` output for Cisco and Dell |
| `fault-lab-free` | Free practice: a working network, no goal, no hints, never touches progress |
| `ping-analyzer` | ping, tracert, traceroute, mtr, WinMTR, pathping, Test-NetConnection, Test-Connection |
| `calculator-ipv6` | IPv6 address parsing and compression, the subnet calculator, split, EUI-64, the hand-over from the IPv4 tab |
| `topology-drawio` | The `.drawio` export: structure, escaping, shapes, links, no configuration data |
| `topology-windows-import` | The import dialog lists Windows and Linux, a pasted Windows session builds one server with its team, the switch joins its NICs by MAC, a PC invents no cable |
| `ui-standard.dark` / `ui-standard.light` | The kit's written UI standard (text of at least 11px, contrast of at least 4.5:1, controls at least 28px) measured on the IPv6 calculator, the analyzer's new cards, and the Fault Lab list and free practice |
| `topology-*` | The Topology Builder: importing files, links and health, manual edits, VLAN and path views, search, projects and snapshots, encrypted copy, layout, contrast in both themes, the written UX standard |

A test counts as a failure when a check fails or when the page logs a console error.

## When a test fails

Run that file on its own and read the first `FAIL` line: it prints what the page returned. The browser tests drive the real page with real key presses and mouse events, so a failure usually means something a person would also see.
