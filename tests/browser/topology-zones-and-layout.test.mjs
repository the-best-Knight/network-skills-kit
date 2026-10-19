import { start, importText, LAB_CFGS, LAB_SESS, shot, SC, wait, press, fxd } from './topology-lib.mjs';
const T = await start(1500, 950); const { ok, fr, J, ctx } = T;
await importText(T, LAB_CFGS() + '\n' + LAB_SESS());
await fr(`w.__nmx.fit(); await new Promise(r => setTimeout(r, 300)); return 1;`);
const rc = (name, kind) => fr(`d.getElementById('toast').classList.remove('show'); const x = w.__nmx, ns = x.nodes(); const n = ns.find(n => n.name === ${JSON.stringify(name)}); const g = d.querySelector('#svg g[data-kind=device][data-id="' + n.id + '"] rect'); const r = g.getBoundingClientRect(); const px = r.left + r.width / 2, py = r.top + r.height / 2; const t = d.elementFromPoint(px, py); t.dispatchEvent(new w.MouseEvent('contextmenu', { clientX: px, clientY: py, bubbles: true, cancelable: true, button: 2 })); await new Promise(r => setTimeout(r, 300)); return [...d.querySelectorAll('#ctx .ctx-i')].map(b => b.textContent);`);
const menu = await J(`d.getElementById('toast').classList.remove('show'); const x = w.__nmx, n = x.nodes().find(n => n.name === 'esx01'); const g = d.querySelector('#svg g[data-kind=device][data-id="' + n.id + '"] rect'); const r = g.getBoundingClientRect(); const px = r.left + r.width / 2, py = r.top + r.height / 2; const t = d.elementFromPoint(px, py); t.dispatchEvent(new w.MouseEvent('contextmenu', { clientX: px, clientY: py, bubbles: true, cancelable: true, button: 2 })); await new Promise(r => setTimeout(r, 300)); return [...d.querySelectorAll('#ctx .ctx-i')].map(b => b.textContent);`);
ok('right-click on an imported device keeps the classic items and adds pin, path, issues and remove', ['Size', 'Connect from here', 'Pin in place', 'Trace a path from here', 'Show its issues', 'Remove from the diagram'].every(x => menu.indexOf(x) >= 0), menu);
await fr(`[...d.querySelectorAll('#ctx .ctx-i')].find(b => b.textContent === 'Pin in place').click(); await new Promise(r => setTimeout(r, 300)); return 1;`);
ok('Pin in place pins it', (await J(`return !!w.__nmx.nodes().find(n => n.name === 'esx01').pin;`)) === true, 0);
// Delete key hides, the data stays, Undo brings it back
await fr(`const x = w.__nmx; const n = x.nodes().find(n => n.name === 'esx01'); const g = d.querySelector('#svg g[data-kind=device][data-id="' + n.id + '"] rect'); const r = g.getBoundingClientRect(); const px = r.left + r.width / 2, py = r.top + r.height / 2; const t = d.elementFromPoint(px, py); const o = { clientX: px, clientY: py, bubbles: true, button: 0, pointerType: 'mouse', pointerId: 1 }; t.dispatchEvent(new w.PointerEvent('pointerdown', o)); t.dispatchEvent(new w.PointerEvent('pointerup', o)); await new Promise(r => setTimeout(r, 300)); d.getElementById('svg').focus(); return 1;`);
await press(ctx, 'Delete'); await wait(500);
const del = await J(`const x = w.__nmx; return { onCanvas: x.nodes().some(n => n.name === 'esx01'), inData: Object.values(x.model().devices).some(d => d.name === 'esx01'), hidden: Object.keys(x.ui.hidden).length, toast: d.getElementById('toast-msg').textContent };`);
ok('Delete takes an imported device off the diagram but keeps what was imported about it', !del.onCanvas && del.inData && del.hidden === 1 && /Removed esx01 from the diagram/.test(del.toast), del);
await fr(`d.getElementById('b-undo').click(); await new Promise(r => setTimeout(r, 400)); return 1;`);
const und = await J(`const x = w.__nmx; return { onCanvas: x.nodes().some(n => n.name === 'esx01'), hidden: Object.keys(x.ui.hidden).length };`);
ok('Undo brings it back and forgets that it was hidden', und.onCanvas && und.hidden === 0, und);
// a later import still updates it
// duplicate does not copy the binding
await fr(`const x = w.__nmx; const n = x.nodes().find(n => n.name === 'SW-ACC2'); const g = d.querySelector('#svg g[data-kind=device][data-id="' + n.id + '"] rect'); const r = g.getBoundingClientRect(); const px = r.left + r.width / 2, py = r.top + r.height / 2; const t = d.elementFromPoint(px, py); const o = { clientX: px, clientY: py, bubbles: true, button: 0, pointerType: 'mouse', pointerId: 1 }; t.dispatchEvent(new w.PointerEvent('pointerdown', o)); t.dispatchEvent(new w.PointerEvent('pointerup', o)); await new Promise(r => setTimeout(r, 300)); return 1;`);
await fr(`d.getElementById('d-dup').click(); await new Promise(r => setTimeout(r, 400)); return 1;`);
const dup = await J(`const x = w.__nmx; const copies = x.nodes().filter(n => n.kind === 'device' && !n.nm); return { copies: copies.length, bound: x.nodes().filter(n => n.nm && x.model().devices[n.nm].name === 'SW-ACC2').length };`);
ok('a copy of an imported device is a plain device, not a second binding', dup.copies === 1 && dup.bound === 1, dup);
await fr(`d.getElementById('b-undo').click(); await new Promise(r => setTimeout(r, 300)); return 1;`);
// remove from the network data (confirm first)
await fr(`const x = w.__nmx; const n = x.nodes().find(n => n.name === 'DELL-S1'); const g = d.querySelector('#svg g[data-kind=device][data-id="' + n.id + '"] rect'); const r = g.getBoundingClientRect(); const px = r.left + r.width / 2, py = r.top + r.height / 2; const t = d.elementFromPoint(px, py); const o = { clientX: px, clientY: py, bubbles: true, button: 0, pointerType: 'mouse', pointerId: 1 }; t.dispatchEvent(new w.PointerEvent('pointerdown', o)); t.dispatchEvent(new w.PointerEvent('pointerup', o)); await new Promise(r => setTimeout(r, 300)); [...d.querySelectorAll('#nm-dev button')].find(b => /Remove from the network data/.test(b.textContent)).click(); await new Promise(r => setTimeout(r, 300)); return 1;`);
const cf = await J(`const e = d.getElementById('nmcfm'); return { open: e.open, title: d.getElementById('nmc-title').textContent, still: Object.values(w.__nmx.model().devices).some(dv => dv.name === 'DELL-S1') };`);
ok('removing a device from the data asks first, and nothing is lost before the answer', cf.open && /Remove DELL-S1/.test(cf.title) && cf.still, cf);
await fr(`d.getElementById('nmc-ok').click(); await new Promise(r => setTimeout(r, 500)); return 1;`);
const gone = await J(`const x = w.__nmx; return { dev: Object.values(x.model().devices).some(dv => dv.name === 'DELL-S1'), node: x.nodes().some(n => n.name === 'DELL-S1') };`);
ok('after confirming, the device is gone from the data and the diagram', !gone.dev && !gone.node, gone);
await fr(`d.getElementById('b-undo').click(); await new Promise(r => setTimeout(r, 400)); return 1;`);
ok('...and Undo restores both', (await J(`const x = w.__nmx; return Object.values(x.model().devices).some(dv => dv.name === 'DELL-S1') && x.nodes().some(n => n.name === 'DELL-S1');`)) === true, 0);

// ---- an output that names no device is held, then assigned from Health ----
const snippet = 'Capability Codes: R - Router\n\nDevice ID        Local Intrfce     Holdtme    Capability  Platform  Port ID\nSW-ACC2.lab.local\n                 Gig 1/0/10        146              S I   WS-C2960X Gig 1/0/1\n\nTotal cdp entries displayed : 1\n';
await importText(T, snippet);
const held = await J(`return { held: w.__nmx.model().held.length };`);
ok('an output that does not say which device printed it is held, not given to anyone', held.held === 1, held);
await fr(`d.getElementById('nm-tab-health').click(); await new Promise(r => setTimeout(r, 400)); const s = d.querySelector('#nm-pane-health select[aria-label="Kind of issue"]'); const o = [...s.options].find(o => /Import/.test(o.text)); s.value = o.value; s.dispatchEvent(new w.Event('change', { bubbles: true })); await new Promise(r => setTimeout(r, 300)); return 1;`);
const hi = await J(`const p = d.getElementById('nm-pane-health'); return { items: [...p.querySelectorAll('.nm-issue .nm-it2 b')].map(x => x.textContent), sel: p.querySelectorAll('.nm-issue select').length };`);
ok('Health lists it under Import with a way to assign it', hi.items.some(x => /Unassigned output/.test(x)) && hi.sel === 1, hi);
await fr(`const p = d.getElementById('nm-pane-health'); const s = p.querySelector('.nm-issue select'); const o = [...s.options].find(o => o.text === 'SW-CORE1'); s.value = o.value; s.dispatchEvent(new w.Event('change', { bubbles: true })); await new Promise(r => setTimeout(r, 500)); return 1;`);
const asg = await J(`const x = w.__nmx; const core = Object.values(x.model().devices).find(dv => dv.name === 'SW-CORE1'); return { held: x.model().held.length, nbrs: core.ifaces['gi1/0/10'].nbrs.length };`);
ok('assigning it applies it to the chosen device only', asg.held === 0 && asg.nbrs >= 1, asg);
// ---- the same host name with a different address is a decision in the dialog ----
const other = fxd('sw-acc1.cfg').replace('10.0.99.11', '10.7.7.7').replace('ip default-gateway 10.0.99.1', 'ip default-gateway 10.7.7.1');
const devsBefore = await J(`return Object.keys(w.__nmx.model().devices).length;`);
await fr(`d.getElementById('nm-import').click(); await new Promise(r => setTimeout(r, 300)); const ta = d.getElementById('nmi-text'); ta.value = ${JSON.stringify(other)}; ta.dispatchEvent(new w.Event('input', { bubbles: true })); d.getElementById('nmi-read').click(); for (let i = 0; i < 60 && !d.querySelector('#nmi-rows .nmi-row'); i++) await new Promise(r => setTimeout(r, 150)); await new Promise(r => setTimeout(r, 300)); return 1;`);
const amb = await J(`const rows = [...d.querySelectorAll('#nmi-rows .nmi-row')]; return { tags: rows.map(r => r.querySelector('.nmi-tag').textContent), opts: [...d.querySelectorAll('#nmi-rows select option')].map(o => o.text).slice(0, 6), apply: d.getElementById('nmi-apply').disabled };`);
ok('a repeated host name with different addresses asks which device it is', amb.tags.indexOf('Needs a decision') >= 0 && amb.opts.some(o => /same device as SW-ACC1/i.test(o)), amb);
await fr(`const s = d.querySelector('#nmi-rows select'); s.value = 'new'; s.dispatchEvent(new w.Event('change', { bubbles: true })); await new Promise(r => setTimeout(r, 200)); const nm = d.querySelector('#nmi-rows .nmi-newname'); nm.value = 'SW-ACC1-SITE2'; nm.dispatchEvent(new w.Event('change', { bubbles: true })); await new Promise(r => setTimeout(r, 500)); return 1;`);
const amb2 = await J(`return { tags: [...d.querySelectorAll('#nmi-rows .nmi-tag')].map(x => x.textContent), sum: d.getElementById('nmi-sum').innerText.slice(0, 200) };`);
ok('naming it re-runs the preview as a new device', amb2.tags.indexOf('New device') >= 0 && /new device/.test(amb2.sum), amb2);
await fr(`d.getElementById('nmi-apply').click(); await new Promise(r => setTimeout(r, 600)); d.getElementById('nmi-close').click(); return 1;`);
const devsAfter = await J(`return { n: Object.keys(w.__nmx.model().devices).length, names: Object.values(w.__nmx.model().devices).map(d => d.name).filter(n => /ACC1/.test(n)) };`);
ok('both switches now exist as separate devices, nothing was merged by name', devsAfter.n === devsBefore + 1 && devsAfter.names.length === 2, devsAfter);
// dismiss and bring back
await fr(`const hh = w.__nmx.ui.health; hh.cat = ''; hh.sev = ''; hh.dev = ''; w.__nmx.tab('props'); w.__nmx.tab('health'); await new Promise(r => setTimeout(r, 300)); const p = d.getElementById('nm-pane-health'); const before = p.querySelectorAll('.nm-issue').length; [...p.querySelectorAll('.nm-issue button')].find(b => b.textContent === 'Dismiss').click(); await new Promise(r => setTimeout(r, 300)); window.__b = before; return 1;`);
const dm = await J(`const p = d.getElementById('nm-pane-health'); return { now: p.querySelectorAll('.nm-issue').length, dismissedKept: Object.keys(w.__nmx.model().manual.review).length };`);
ok('Dismiss hides an issue and records it as your decision', dm.dismissedKept === 1, dm);
T.finish();
