import { start, importText, LAB_CFGS, LAB_SESS, shot, SC, wait, press, fxd } from './topology-lib.mjs';
const T = await start(); const { ok, fr, J, ctx } = T;
await importText(T, LAB_CFGS() + '\n' + LAB_SESS());
await fr(`w.__nmx.fit(); await new Promise(r => setTimeout(r, 300)); return 1;`);
const nodeBy = (n) => `w.__nmx.nodes().find(n => n.name === ${JSON.stringify(n)})`;
const clickNode = (name) => fr(`d.getElementById('toast').classList.remove('show'); const n = ${nodeBy(name)}; const g = d.querySelector('#svg g[data-kind=device][data-id="' + n.id + '"] rect'); const r = g.getBoundingClientRect(); const px = r.left + r.width / 2, py = r.top + r.height / 2; const t = d.elementFromPoint(px, py); const o = { clientX: px, clientY: py, bubbles: true, button: 0, pointerType: 'mouse', pointerId: 1 }; t.dispatchEvent(new w.PointerEvent('pointerdown', o)); t.dispatchEvent(new w.PointerEvent('pointerup', o)); await new Promise(r => setTimeout(r, 350)); return 1;`);

// ---- a cable drawn by hand between two imported devices ----
await fr(`d.getElementById('toast').classList.remove('show'); const x = w.__nmx; const A = ${nodeBy('SW-ACC2')}, B = ${nodeBy('esx01')}; d.getElementById('m-connect').click(); const pt = (n) => { const r = d.querySelector('#svg g[data-kind=device][data-id="' + n.id + '"] rect').getBoundingClientRect(); return [r.left + r.width / 2, r.top + r.height / 2]; }; const [ax, ay] = pt(A), [bx, by] = pt(B); const svg = d.getElementById('svg'); const o = (X, Y) => ({ clientX: X, clientY: Y, bubbles: true, button: 0, pointerType: 'mouse', pointerId: 1 }); d.elementFromPoint(ax, ay).dispatchEvent(new w.PointerEvent('pointerdown', o(ax, ay))); for (let i = 1; i <= 6; i++) svg.dispatchEvent(new w.PointerEvent('pointermove', o(ax + (bx - ax) * i / 6, ay + (by - ay) * i / 6))); svg.dispatchEvent(new w.PointerEvent('pointerup', o(bx, by))); await new Promise(r => setTimeout(r, 400)); d.getElementById('m-select').click(); return 1;`);
const f1 = await J(`const b = d.getElementById('nm-link'); return { hidden: b.classList.contains('hidden'), text: b.innerText.slice(0, 400), fields: b.querySelectorAll('input[list]').length, drawn: w.__nmx.links().filter(l => !l.nm).length };`);
ok('a line drawn between two imported devices offers to record the interfaces', f1.hidden === false && f1.fields === 2 && /record it as a cable/i.test(f1.text) && f1.drawn === 1, f1);
await fr(`const a = d.getElementById('nm-man-a'), b = d.getElementById('nm-man-b'); a.value = 'Gi1/0/3'; b.value = 'vmnic2'; [...d.querySelectorAll('#nm-link button')].find(x => x.textContent === 'Use as a cable').click(); await new Promise(r => setTimeout(r, 500)); return 1;`);
const f2 = await J(`const x = w.__nmx, v = x.view(); const L = v.links.find(L => L.manualAdded); return { added: x.model().manual.added.length, canvasManual: x.links().filter(l => !l.nm).length, status: L && L.status, how: L && L.how, health: L && L.health.text, ends: L && [x.model().devices[L.a.dev].name + ' ' + L.a.name, x.model().devices[L.b.dev].name + ' ' + L.b.name] };`);
ok('it becomes a confirmed cable in the data, takes its state from the interfaces, and the plain line is gone', f2.added === 1 && f2.canvasManual === 0 && f2.status === 'confirmed' && /drawn by hand/.test(f2.how), f2);
await fr(`d.getElementById('b-undo').click(); await new Promise(r => setTimeout(r, 300)); return 1;`);
const f3 = await J(`const x = w.__nmx; return { added: x.model().manual.added.length, canvasManual: x.links().filter(l => !l.nm).length };`);
ok('Undo restores the plain line', f3.added === 0 && f3.canvasManual === 1, f3);
await fr(`d.getElementById('b-redo').click(); await new Promise(r => setTimeout(r, 300)); return 1;`);
// a re-import must not remove it
await importText(T, fxd('core1-session.txt'));
const f4 = await J(`const x = w.__nmx; return x.model().manual.added.length;`);
ok('an import never removes your recorded cable', f4 === 1, f4);

// ---- groups: collapse and open ----
await fr(`d.getElementById('toast').classList.remove('show'); const x = w.__nmx; const ns = x.nodes(); const A = ${nodeBy('SW-ACC1')}, B = ${nodeBy('SW-ACC2')}; const z = { id: 9000, kind: 'zone', name: 'Access layer', x: Math.min(A.x, B.x) - 30, y: A.y - 40, w: Math.abs(A.x - B.x) + 152 + 60, h: 56 + 90 }; ns.push(z); d.getElementById('b-undo'); await new Promise(r => setTimeout(r, 100)); w.__nmx.sync(); return 1;`);
await fr(`const z = w.__nmx.nodes().find(n => n.kind === 'zone'); window.__z = z; return z.w;`);
const before = await J(`const x = w.__nmx; return { visibleDevices: d.querySelectorAll('#svg g[data-kind=device]').length, links: d.querySelectorAll('#svg g[data-kind=link]').length };`);
await fr(`const z = w.__nmx.nodes().find(n => n.kind === 'zone'); const el = d.querySelector('#svg g[data-kind=zone][data-id="' + z.id + '"] rect'); const r = el.getBoundingClientRect(); const px = r.left + 20, py = r.top + 12; const t = d.elementFromPoint(px, py); const o = { clientX: px, clientY: py, bubbles: true, button: 0, pointerType: 'mouse', pointerId: 1 }; t.dispatchEvent(new w.PointerEvent('pointerdown', o)); t.dispatchEvent(new w.PointerEvent('pointerup', o)); await new Promise(r => setTimeout(r, 350)); const b = [...d.querySelectorAll('#nm-zone button')].find(x => /Collapse/.test(x.textContent)); b.click(); await new Promise(r => setTimeout(r, 450)); return 1;`);
const col = await J(`const z = w.__nmx.nodes().find(n => n.kind === 'zone'); return { collapsed: !!z.collapsed, members: (z.members || []).length, visibleDevices: d.querySelectorAll('#svg g[data-kind=device]').length, links: d.querySelectorAll('#svg g[data-kind=link]').length, text: [...d.querySelectorAll('#svg g[data-kind=zone] text')].map(t => t.textContent).join(' | ') };`);
ok('collapsing a group hides its devices and shows one box with a count', col.collapsed && col.members === 2 && col.visibleDevices === before.visibleDevices - 2 && /2 devices/.test(col.text), { before, col });
ok('links to the hidden devices are drawn to the group box', col.links >= 2, col);
await shot(ctx, SC + 'nm7-collapsed.png');
await fr(`const z = w.__nmx.nodes().find(n => n.kind === 'zone'); const b = [...d.querySelectorAll('#nm-zone button')].find(x => /Open/.test(x.textContent)); b.click(); await new Promise(r => setTimeout(r, 400)); return 1;`);
const opened = await J(`const z = w.__nmx.nodes().find(n => n.kind === 'zone'); return { collapsed: !!z.collapsed, w: z.w, devs: d.querySelectorAll('#svg g[data-kind=device]').length };`);
ok('opening it brings the devices and the original size back', !opened.collapsed && opened.w > 300 && opened.devs === before.visibleDevices, opened);
T.finish();
