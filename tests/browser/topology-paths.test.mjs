// scale: 120+ devices in the real page
import { start, SC, wait, shot } from './topology-lib.mjs';
const T = await start(1500, 950); const { ok, fr, J, ctx } = T;
const build = await J(`
  const x = w.__nmx, NM = x.NM; const acc = 114, dist = 6, files = [];
  for (let dd = 0; dd < dist; dd++) {
    let c = 'hostname DS' + dd + '\\nip routing\\nvlan 10\\n name USERS\\n'; for (let p = 1; p <= 24; p++) c += 'interface GigabitEthernet1/0/' + p + '\\n description to AS' + ((dd * 19 + p - 1) % acc) + ' Gi1/0/48\\n switchport mode trunk\\n'; files.push({ name: 'ds' + dd + '.cfg', text: c });
    let n = 'DS' + dd + '#show cdp neighbors detail\\n'; for (let p = 1; p <= 19; p++) { const a = dd * 19 + p - 1; n += '-------------------------\\nDevice ID: AS' + a + '.lab.local\\nEntry address(es): \\n  IP address: 10.20.' + (a >> 8) + '.' + (a & 255) + '\\nPlatform: cisco WS-C2960X,  Capabilities: Switch IGMP \\nInterface: GigabitEthernet1/0/' + p + ',  Port ID (outgoing port): GigabitEthernet1/0/48\\nHoldtime : 150 sec\\n\\n'; } files.push({ name: 'dscdp' + dd + '.txt', text: n });
  }
  for (let a = 0; a < acc; a++) {
    let c = 'hostname AS' + a + '\\nvlan 10\\n name USERS\\nvlan 20\\n name VOICE\\n'; for (let p = 1; p <= 48; p++) c += 'interface GigabitEthernet1/0/' + p + '\\n description ' + (p === 48 ? 'uplink DS' + Math.floor(a / 19) : 'user ' + p) + '\\n switchport mode ' + (p === 48 ? 'trunk' : 'access') + '\\n' + (p === 48 ? '' : ' switchport access vlan ' + (p % 2 ? 10 : 20) + '\\n'); files.push({ name: 'as' + a + '.cfg', text: c });
    let s = 'AS' + a + '#show interfaces status\\nPort      Name               Status       Vlan       Duplex  Speed Type\\n'; for (let p = 1; p <= 48; p++) s += 'Gi1/0/' + p + '   x                  ' + (p % 3 ? 'connected   ' : 'notconnect  ') + ' ' + (p === 48 ? 'trunk' : '10   ') + '      a-full a-1000 10/100/1000BaseTX\\n'; files.push({ name: 'asst' + a + '.txt', text: s });
  }
  window.__files = files;
  const t0 = performance.now(); const secs = NM.parseInputs(files); const t1 = performance.now();
  x.model(); return { files: files.length, secs: secs.length, parseMs: Math.round(t1 - t0), bytes: files.reduce((s, f) => s + f.text.length, 0) };`);
console.log('built', build);
// import through the dialog's own code path: paste in chunks into the real dialog
await fr(`d.getElementById('nm-import').click(); await new Promise(r => setTimeout(r, 200)); const dt = new w.DataTransfer(); for (const f of window.__files || w.__files) dt.items.add(new w.File([f.text], f.name, { type: 'text/plain' })); d.getElementById('nmi-drop').dispatchEvent(new w.DragEvent('drop', { dataTransfer: dt, bubbles: true, cancelable: true })); await new Promise(r => setTimeout(r, 1500)); return 1;`);
const t0 = Date.now();
await fr(`d.getElementById('nmi-read').click(); for (let i = 0; i < 400 && !d.querySelector('#nmi-rows .nmi-row'); i++) await new Promise(r => setTimeout(r, 100)); return 1;`);
const readMs = Date.now() - t0;
const prog = await J(`return { rows: d.querySelectorAll('#nmi-rows .nmi-row').length, sum: d.getElementById('nmi-sum').innerText.slice(0, 300) };`);
console.log('read ms (240+ files, 3 MB):', readMs, prog.sum.split('\n')[0]);
ok('a large multi-file import is read and previewed', prog.rows >= 240, prog);
const t1 = Date.now();
await fr(`d.getElementById('nmi-apply').click(); await new Promise(r => setTimeout(r, 300)); return 1;`);
const applyMs = Date.now() - t1;
await fr(`d.getElementById('nmi-close').click(); await new Promise(r => setTimeout(r, 400)); w.__nmx.fit(); await new Promise(r => setTimeout(r, 600)); return 1;`);
const st = await J(`const x = w.__nmx; return { c: x.counts(), devs: Object.keys(x.model().devices).length, ifs: Object.values(x.model().devices).reduce((a, dv) => a + Object.keys(dv.ifaces).length, 0) };`);
console.log('apply ms:', applyMs, st);
ok('120+ devices and thousands of interfaces are in', st.devs >= 120 && st.ifs >= 5000 && st.c.nodes >= 120, st);
await shot(ctx, SC + 'nm8-big.png');
const perf = await J(`const x = w.__nmx; const time = (f, n) => { const t = performance.now(); for (let i = 0; i < n; i++) f(); return Math.round((performance.now() - t) / n * 10) / 10; };
  const r = time(() => x.render(), 20); x.ui.overlay = true; const rOv = time(() => x.render(), 20); x.ui.overlay = false; x.ui.labels = true; const rLb = time(() => x.render(), 10); x.ui.labels = false;
  const sy = time(() => x.sync(), 5); const sr = time(() => x.NM.search(x.model(), 'user 17'), 20);
  x.model().rev++; const vw = time(() => { x.model().rev++; x.view(); }, 5);
  return { render: r, renderWithInferred: rOv, renderWithLabels: rLb, sync: sy, search: sr, viewRebuild: vw };`);
console.log('ms per call', perf);
ok('redrawing the diagram stays under a frame or two', perf.render < 40 && perf.renderWithInferred < 60, perf);
ok('syncing, searching and rebuilding the view are quick', perf.sync < 150 && perf.search < 10 && perf.viewRebuild < 200, perf);
// dragging a node many times stays responsive
const drag = await J(`const x = w.__nmx; const n = x.nodes().find(n => n.name === 'DS0'); const g = d.querySelector('#svg g[data-kind=device][data-id="' + n.id + '"] rect'); const r = g.getBoundingClientRect(); const px = r.left + r.width / 2, py = r.top + r.height / 2; const svg = d.getElementById('svg'); const o = (X, Y) => ({ clientX: X, clientY: Y, bubbles: true, button: 0, pointerType: 'mouse', pointerId: 1 }); const t = d.elementFromPoint(px, py); const t0 = performance.now(); t.dispatchEvent(new w.PointerEvent('pointerdown', o(px, py))); let frames = 0; await new Promise(res => { let i = 0; function step() { i++; svg.dispatchEvent(new w.PointerEvent('pointermove', o(px + i * 4, py + i * 2))); if (i < 60) w.requestAnimationFrame(step); else res(); } step(); }); svg.dispatchEvent(new w.PointerEvent('pointerup', o(px + 240, py + 120))); return { ms: Math.round(performance.now() - t0), perFrame: Math.round((performance.now() - t0) / 60 * 10) / 10 };`);
console.log('60-frame drag', drag);
ok('dragging a device is smooth with 120 devices on the canvas', drag.perFrame < 40, drag);
// pan/zoom
const zoom = await J(`const x = w.__nmx; const t = performance.now(); for (let i = 0; i < 30; i++) { d.getElementById(i % 2 ? 'z-in' : 'z-out').click(); x.render(); } return Math.round((performance.now() - t) / 30 * 10) / 10;`);
ok('zooming is responsive', zoom < 50, zoom);
// health panel and device panel with many items
await fr(`d.getElementById('nm-tab-health').click(); await new Promise(r => setTimeout(r, 400)); return 1;`);
const hp = await J(`const t = performance.now(); w.__nmx.tab('health'); const p = d.getElementById('nm-pane-health'); return { ms: Math.round(performance.now() - t), items: p.querySelectorAll('.nm-issue').length };`);
ok('the Health panel handles hundreds of items without freezing', hp.ms < 400 && hp.items >= 20, hp);
const arr = await J(`const x = w.__nmx; const t = performance.now(); const m = x.arrange(); return { ms: Math.round(performance.now() - t), moved: m };`);
console.log('arrange ms', arr);
ok('arranging 120+ devices takes well under a second', arr.ms < 1500 && arr.moved >= 120, arr);
await fr(`w.__nmx.fit(); await new Promise(r => setTimeout(r, 500)); return 1;`);
await shot(ctx, SC + 'nm8-arranged.png');
T.finish();
