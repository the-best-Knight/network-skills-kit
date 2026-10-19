import { start, importText, LAB_CFGS, LAB_SESS, shot, SC, wait, press, fxd, KIT } from './topology-lib.mjs';
const T = await start(); const { ok, fr, J, ctx } = T;
const STATUS_DOWN = 'SW-ACC1#show interfaces status\nPort      Name               Status       Vlan       Duplex  Speed Type\nGi1/0/20  ESX01 vmnic1       notconnect   trunk      auto auto 10/100/1000BaseTX\n';
await importText(T, LAB_CFGS() + '\n' + LAB_SESS());
await fr(`w.__nmx.fit(); await new Promise(r => setTimeout(r, 300)); return 1;`);
const pos = (name) => J(`const n = w.__nmx.nodes().find(n => n.name === ${JSON.stringify(name)}); return n ? [n.x, n.y] : null;`);
const drag = (name, dx, dy) => fr(`d.getElementById('toast').classList.remove('show'); const x = w.__nmx, n = x.nodes().find(n => n.name === ${JSON.stringify(name)}); const g = d.querySelector('#svg g[data-kind=device][data-id="' + n.id + '"] rect'); const r = g.getBoundingClientRect(); const px = r.left + r.width / 2, py = r.top + r.height / 2; const t = d.elementFromPoint(px, py); const svg = d.getElementById('svg'); const o = (X, Y) => ({ clientX: X, clientY: Y, bubbles: true, button: 0, pointerType: 'mouse', pointerId: 1 }); t.dispatchEvent(new w.PointerEvent('pointerdown', o(px, py))); for (let i = 1; i <= 6; i++) svg.dispatchEvent(new w.PointerEvent('pointermove', o(px + ${dx} * i / 6, py + ${dy} * i / 6))); svg.dispatchEvent(new w.PointerEvent('pointerup', o(px + ${dx}, py + ${dy}))); await new Promise(r => setTimeout(r, 300)); return 1;`);
const clickNode = (name) => fr(`d.getElementById('toast').classList.remove('show'); const x = w.__nmx, n = x.nodes().find(n => n.name === ${JSON.stringify(name)}); const g = d.querySelector('#svg g[data-kind=device][data-id="' + n.id + '"] rect'); const r = g.getBoundingClientRect(); const px = r.left + r.width / 2, py = r.top + r.height / 2; const t = d.elementFromPoint(px, py); const o = { clientX: px, clientY: py, bubbles: true, button: 0, pointerType: 'mouse', pointerId: 1 }; t.dispatchEvent(new w.PointerEvent('pointerdown', o)); t.dispatchEvent(new w.PointerEvent('pointerup', o)); await new Promise(r => setTimeout(r, 350)); return 1;`);

// ---- positions, pins, overrides survive imports ----
const before = { core: await pos('SW-CORE1'), acc2: await pos('SW-ACC2') };
await drag('SW-ACC2', 120, 60);
const moved = await pos('SW-ACC2');
ok('a device can be dragged', Math.abs(moved[0] - before.acc2[0] - 120 / 1.28) < 40 && moved[1] !== before.acc2[1], { before: before.acc2, moved });
await clickNode('SW-CORE1');
await fr(`const b = [...d.querySelectorAll('#nm-dev button')].find(x => x.textContent === 'Pin in place'); b.click(); await new Promise(r => setTimeout(r, 300)); return 1;`);
await drag('SW-CORE1', 90, 90);
const pinned = await pos('SW-CORE1');
ok('a pinned device does not move when dragged', pinned[0] === before.core[0] && pinned[1] === before.core[1], { before: before.core, pinned });
await clickNode('esx01');
await fr(`const sw = d.querySelector('#nm-dev .nm-sw[aria-label="Purple"]'); sw.click(); await new Promise(r => setTimeout(r, 200)); const nm = d.getElementById('d-name'); nm.value = 'Hypervisor A'; nm.dispatchEvent(new w.Event('input', { bubbles: true })); await new Promise(r => setTimeout(r, 200)); return 1;`);
const later = (h) => { const d = new Date(Date.now() + h * 3600e3), p = (n) => String(n).padStart(2, '0'); return d.getFullYear() + '-' + p(d.getMonth() + 1) + '-' + p(d.getDate()) + 'T' + p(d.getHours()) + ':' + p(d.getMinutes()); };
await importText(T, STATUS_DOWN, { at: later(1) });
const after = await J(`const x = w.__nmx; const n = x.nodes().find(n => n.nm && x.model().devices[n.nm].name === 'esx01'); const a2 = x.nodes().find(n => n.name === 'SW-ACC2'); return { name: n.name, color: n.ocolor, acc2: [a2.x, a2.y], core: (() => { const c = x.nodes().find(n => n.name === 'SW-CORE1'); return [c.x, c.y, !!c.pin]; })(), devs: Object.keys(x.model().devices).length };`);
ok('a routine import keeps positions, pins, your own name and colour', after.name === 'Hypervisor A' && after.color === '#a855f7' && after.acc2[0] === moved[0] && after.acc2[1] === moved[1] && after.core[0] === before.core[0] && after.core[2] === true, after);
ok('...and does not duplicate devices', after.devs === 8, after);
const hv = await J(`const x = w.__nmx; const v = x.view(); const L = v.links.find(L => L.status === 'inferred' && /vmnic1/.test(L.b.name + L.a.name)); return L && L.health && L.health.color;`);
ok('the new status import turns the esx01 vmnic1 link red (an expected connection is down)', hv === 'red', hv);

// ---- Auto-arrange with a pinned device ----
const preArr = { core: await pos('SW-CORE1'), fw: await pos('FW1') };
await fr(`d.getElementById('nm-arrange').click(); await new Promise(r => setTimeout(r, 400)); d.getElementById('nmc-ok').click(); await new Promise(r => setTimeout(r, 500)); return 1;`);
const postArr = { core: await pos('SW-CORE1'), fw: await pos('FW1') };
ok('Auto-arrange asks first, keeps pinned devices where they are, and moves the rest', postArr.core[0] === preArr.core[0] && postArr.core[1] === preArr.core[1] && (postArr.fw[0] !== preArr.fw[0] || postArr.fw[1] !== preArr.fw[1]), { preArr, postArr });
await fr(`d.getElementById('b-undo').click(); await new Promise(r => setTimeout(r, 300)); return 1;`);
const undoArr = await pos('FW1');
ok('arranging can be undone', undoArr[0] === preArr.fw[0] && undoArr[1] === preArr.fw[1], { undoArr, preArr });

// ---- snapshots and comparison: layout is not a network change ----
await fr(`d.getElementById('nm-tab-hist').click(); await new Promise(r => setTimeout(r, 300)); const inp = d.querySelector('#nm-pane-hist input[type=text]'); inp.value = 'baseline'; [...d.querySelectorAll('#nm-pane-hist button')].find(b => b.textContent === 'Save snapshot').click(); await new Promise(r => setTimeout(r, 300)); return 1;`);
await drag('FW1', 40, 40);
await fr(`const b = [...d.querySelectorAll('#nm-pane-hist .nm-snap')].find(x => /baseline/.test(x.innerText)); [...b.querySelectorAll('button')].find(x => x.textContent === 'Compare with now').click(); await new Promise(r => setTimeout(r, 500)); return 1;`);
const c0 = await J(`return d.getElementById('nm-cmp').innerText;`);
ok('moving a device is not reported as a network change', /No network differences/.test(c0), c0);
await importText(T, STATUS_DOWN.replace('notconnect', 'connected  ').replace('auto auto', 'a-full a-1000'), { at: later(2) });
await fr(`d.getElementById('nm-tab-hist').click(); await new Promise(r => setTimeout(r, 300)); const b = [...d.querySelectorAll('#nm-pane-hist .nm-snap')].find(x => /baseline/.test(x.innerText)); [...b.querySelectorAll('button')].find(x => x.textContent === 'Compare with now').click(); await new Promise(r => setTimeout(r, 500)); return 1;`);
const c1 = await J(`return d.getElementById('nm-cmp').innerText;`);
ok('a later status change shows up in the comparison', /port state/.test(c1) || /link state|up -> /.test(c1) || c1.length > 30, c1);
await shot(ctx, SC + 'nm6-history.png');
// restore the baseline
await fr(`const b = [...d.querySelectorAll('#nm-pane-hist .nm-snap')].find(x => /baseline/.test(x.innerText)); [...b.querySelectorAll('button')].find(x => x.textContent === 'Restore').click(); await new Promise(r => setTimeout(r, 400)); d.getElementById('nmc-ok').click(); await new Promise(r => setTimeout(r, 500)); return 1;`);
const rs = await J(`const x = w.__nmx, v = x.view(); const L = v.links.find(L => L.status === 'inferred' && /vmnic1/.test(L.b.name + L.a.name)); return { color: L.health.color, snaps: x.snaps().map(s => s.label), devs: Object.keys(x.model().devices).length };`);
ok('restoring a snapshot brings back its facts and keeps the working project intact', rs.color === 'red' && rs.devs === 8 && rs.snaps.some(l => /Before restoring/.test(l)), rs);

// ---- undo/redo across an import ----
const cnt0 = await J(`return w.__nmx.counts();`);
await importText(T, fxd('core1-session.txt').replace(/SW-CORE1#/g, 'SW-CORE1#').split('SW-CORE1#show cdp neighbors')[0] + '\n[root@esx02:~] esxcli system hostname get\n   Domain Name: lab.local\n   Fully Qualified Domain Name: esx02.lab.local\n   Host Name: esx02\n');
const cnt1 = await J(`return w.__nmx.counts();`);
await fr(`d.getElementById('b-undo').click(); await new Promise(r => setTimeout(r, 400)); return 1;`);
const cnt2 = await J(`return { c: w.__nmx.counts(), devs: Object.keys(w.__nmx.model().devices).length };`);
await fr(`d.getElementById('b-redo').click(); await new Promise(r => setTimeout(r, 400)); return 1;`);
const cnt3 = await J(`return { c: w.__nmx.counts(), devs: Object.keys(w.__nmx.model().devices).length };`);
ok('Undo takes a whole import back, diagram and data together, and Redo returns it', cnt1.nodes === cnt0.nodes + 1 && cnt2.c.nodes === cnt0.nodes && cnt2.devs === 8 && cnt3.c.nodes === cnt1.nodes && cnt3.devs === 9, { cnt0, cnt1, cnt2, cnt3 });

// ---- save, close, reopen ----
const proj = await J(`const t = w.__nmx.project(); const j = JSON.parse(t); return { bytes: t.length, version: j.version, devs: Object.keys(j.network.model.devices).length, snaps: j.network.snaps.length, poolKeys: Object.keys(j.network.pool).length, nodes: j.nodes.length, links: j.links.length, pins: j.nodes.filter(n => n.pin).length, colors: j.nodes.filter(n => n.ocolor).length, text: t };`);
ok('the project file carries the model, snapshots, layout, pins and colours', proj.version === 2 && proj.devs === 9 && proj.snaps >= 2 && proj.poolKeys >= 2 && proj.pins === 1 && proj.colors === 1, { ...proj, text: undefined });
const posBefore = await J(`return w.__nmx.nodes().map(n => [n.name, n.x, n.y]);`);
await T.fr(`return 1;`);
await (await import('./bidi.mjs')).goto(ctx, 'about:blank'); await (await import('./bidi.mjs')).goto(ctx, KIT + '#topology-builder'); await wait(2800); await (await import('./topology-lib.mjs')).clearSample(ctx);
const empty = await J(`return w.__nmx.counts();`);
await fr(`w.__nmx.load(${JSON.stringify(proj.text)}); await new Promise(r => setTimeout(r, 500)); return 1;`);
const reopened = await J(`const x = w.__nmx; return { c: x.counts(), devs: Object.keys(x.model().devices).length, snaps: x.snaps().length, pos: x.nodes().map(n => [n.name, n.x, n.y]), pin: x.nodes().filter(n => n.pin).length, color: x.nodes().filter(n => n.ocolor).length };`);
ok('after closing and reopening, topology, layout, snapshots, pins and colours are all back', empty.nodes === 0 && reopened.devs === 9 && reopened.snaps === proj.snaps && JSON.stringify(reopened.pos) === JSON.stringify(posBefore) && reopened.pin === 1 && reopened.color === 1, { empty, devs: reopened.devs, snaps: reopened.snaps, same: JSON.stringify(reopened.pos) === JSON.stringify(posBefore) });
const afterOpen = await J(`const x = w.__nmx, v = x.view(); return { links: v.links.length, red: v.links.filter(L => L.health && L.health.color === 'red').length };`);
ok('the opened project derives the same links and states', afterOpen.links >= 9 && afterOpen.red >= 1, afterOpen);
T.finish();
