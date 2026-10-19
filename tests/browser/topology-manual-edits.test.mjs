import { start, importText, LAB_CFGS, LAB_SESS, shot, SC, wait, press } from './topology-lib.mjs';
const T = await start(); const { ok, fr, J, ctx } = T;
await importText(T, LAB_CFGS() + '\n' + LAB_SESS());
await fr(`w.__nmx.fit(); await new Promise(r => setTimeout(r, 300)); return 1;`);
const names = await J(`return w.__nmx.nodes().filter(n => n.kind === 'device').map(n => n.name);`);
ok('every config pasted back to back became its own device', ['SW-CORE1', 'SW-ACC1', 'SW-ACC2', 'DELL-S1', 'FW1', 'esx01'].every(x => names.indexOf(x) >= 0) && names.indexOf('SW-ACC2.lab.local') < 0, names);

// click the SW-CORE1 / SW-ACC1 bundle link
const clickLink = (a, b) => fr(`const x = w.__nmx, ns = x.nodes(); const A = ns.find(n => n.name === ${JSON.stringify(a)}), B = ns.find(n => n.name === ${JSON.stringify(b)}); const l = x.links().find(l => (l.from === A.id && l.to === B.id) || (l.from === B.id && l.to === A.id)); const el = d.querySelector('#svg g[data-kind=link][data-id="' + l.id + '"]'); const hit = el.querySelector('line, path'); const sr = d.getElementById('svg').getBoundingClientRect(), v = x.state().view; let done = null; for (const t of [0.35, 0.25, 0.45, 0.6, 0.15, 0.7]) { let wx, wy; if (hit.tagName === 'line') { const x1 = +hit.getAttribute('x1'), y1 = +hit.getAttribute('y1'), x2 = +hit.getAttribute('x2'), y2 = +hit.getAttribute('y2'); wx = x1 + (x2 - x1) * t; wy = y1 + (y2 - y1) * t; } else { const p = hit.getPointAtLength(hit.getTotalLength() * t); wx = p.x; wy = p.y; } const px = sr.left + v.tx + wx * v.k, py = sr.top + v.ty + wy * v.k; const tg = d.elementFromPoint(px, py); const g = tg && tg.closest('[data-kind]'); if (g && g.getAttribute('data-kind') === 'link' && +g.getAttribute('data-id') === l.id) { const o = { clientX: px, clientY: py, bubbles: true, button: 0, pointerType: 'mouse', pointerId: 1 }; tg.dispatchEvent(new w.PointerEvent('pointerdown', o)); tg.dispatchEvent(new w.PointerEvent('pointerup', o)); done = t; break; } } await new Promise(r => setTimeout(r, 400)); return done;`);
await clickLink('SW-CORE1', 'SW-ACC1');
const lp = await J(`const b = d.getElementById('nm-link'); return { hidden: b.classList.contains('hidden'), text: b.innerText.slice(0, 4000), buttons: [...b.querySelectorAll('button')].map(x => x.textContent) };`);
ok('selecting the bundle shows it as a port-channel with its members and evidence', !lp.hidden && /Port-channel \(2 members\)/.test(lp.text) && /Confirmed/.test(lp.text) && /CDP/.test(lp.text) && /member cables/i.test(lp.text), lp);
ok('a confirmed link can be rejected but offers no redundant confirm', lp.buttons.indexOf('Reject this link') >= 0 && lp.buttons.indexOf('Confirm this link') < 0, lp.buttons);
await shot(ctx, SC + 'nm4-link.png');

// an inferred link: turn the overlay on, select it, confirm it
await fr(`d.getElementById('nm-ov').click(); await new Promise(r => setTimeout(r, 300)); return 1;`);
await clickLink('SW-CORE1', 'esx01');
const lp2 = await J(`const b = d.getElementById('nm-link'); return { text: b.innerText.slice(0, 1500), buttons: [...b.querySelectorAll('button')].map(x => x.textContent), chip: (b.querySelector('.nm-chip') || {}).textContent };`);
ok('an inferred link says who reported it and offers Confirm', lp2.chip === 'Inferred' && /reported by SW-CORE1 only/.test(lp2.text) && lp2.buttons.indexOf('Confirm this link') >= 0, lp2);
await fr(`const b = [...d.querySelectorAll('#nm-link button')].find(x => x.textContent === 'Confirm this link'); b.click(); await new Promise(r => setTimeout(r, 400)); return 1;`);
const afterConfirm = await J(`const x = w.__nmx, v = x.view(); const L = v.links.find(L => L.manual === 'confirmed'); return { confirmed: !!L, how: L && L.how, man: Object.keys(x.model().manual.link).length };`);
ok('confirming records your decision apart from the imported facts', afterConfirm.confirmed && /confirmed by you/.test(afterConfirm.how) && afterConfirm.man === 1, afterConfirm);
// reject another, then undo
await clickLink('SW-ACC1', 'esx01');
await fr(`const b = [...d.querySelectorAll('#nm-link button')].find(x => x.textContent === 'Reject this link'); b.click(); await new Promise(r => setTimeout(r, 400)); return 1;`);
const rej = await J(`const x = w.__nmx; return { rejected: Object.values(x.model().manual.link).filter(m => m.state === 'rejected').length, onCanvas: x.links().filter(l => l.nm && /^d\\d+:vmnic1/.test(l.nm.split('~')[0] + '')).length };`);
ok('a rejected link leaves the diagram', rej.rejected === 1, rej);
await fr(`d.getElementById('b-undo').click(); await new Promise(r => setTimeout(r, 400)); return 1;`);
const und = await J(`const x = w.__nmx; return { rejected: Object.values(x.model().manual.link).filter(m => m.state === 'rejected').length, confirmed: Object.values(x.model().manual.link).filter(m => m.state === 'confirmed').length };`);
ok('Undo takes the rejection back (the confirmation before it stays)', und.rejected === 0 && und.confirmed === 1, und);
await fr(`d.getElementById('b-redo').click(); await new Promise(r => setTimeout(r, 300)); d.getElementById('b-undo').click(); await new Promise(r => setTimeout(r, 300)); return 1;`);

// Health tab
await fr(`d.getElementById('nm-tab-health').click(); await new Promise(r => setTimeout(r, 400)); return 1;`);
const hl = await J(`const p = d.getElementById('nm-pane-health'); return { text: p.innerText.slice(0, 900), items: p.querySelectorAll('.nm-issue').length, badge: d.getElementById('nm-c-health').textContent, selects: p.querySelectorAll('select').length };`);
ok('Health lists the issues with reasons and filters', hl.items >= 3 && hl.selects >= 3 && /Only what the imported data shows is listed/.test(hl.text), hl);
await shot(ctx, SC + 'nm4-health.png');
await fr(`const s = d.querySelector('#nm-pane-health select[aria-label="Kind of issue"]'); const o = [...s.options].find(o => /Unresolved/.test(o.text)); s.value = o.value; s.dispatchEvent(new w.Event('change', { bubbles: true })); await new Promise(r => setTimeout(r, 300)); return 1;`);
const hl2 = await J(`const p = d.getElementById('nm-pane-health'); return { items: p.querySelectorAll('.nm-issue').length, kinds: [...p.querySelectorAll('.nm-it2 b')].map(x => x.textContent).slice(0, 3) };`);
ok('the kind filter narrows the list', hl2.items >= 1 && hl2.items < hl.items, hl2);
await fr(`const b = d.querySelector('#nm-pane-health .nm-issue .nm-ia button'); b.click(); await new Promise(r => setTimeout(r, 400)); return 1;`);
const shown = await J(`const x = w.__nmx; return { sel: x.state().sel, tab: d.getElementById('nm-tab-health').getAttribute('aria-selected') };`);
ok('Show selects what the issue is about and stays in Health', !!shown.sel && shown.tab === 'true', shown);
T.finish();
