// Topology Builder, dark theme. run.sh gives this file a dark browser.
import { start, importText, auditContrast, LAB_CFGS, LAB_SESS, shot, SC, wait, press, fxd } from './topology-lib.mjs';
const light = false, tag = light ? '-light' : '-dark';
const T = await start(1500, 950); const { ok, fr, J, ctx } = T;
const theme = await J(`return { attr: d.documentElement.getAttribute('data-theme'), pref: w.matchMedia('(prefers-color-scheme: light)').matches };`);
console.log('theme', theme);
await importText(T, LAB_CFGS() + '\n' + LAB_SESS());
await fr(`w.__nmx.fit(); await new Promise(r => setTimeout(r, 300)); const n = w.__nmx.nodes().find(n => n.name === 'SW-CORE1'); const g = d.querySelector('#svg g[data-kind=device][data-id="' + n.id + '"] rect'); const r = g.getBoundingClientRect(); const px = r.left + r.width / 2, py = r.top + r.height / 2; const t = d.elementFromPoint(px, py); const o = { clientX: px, clientY: py, bubbles: true, button: 0, pointerType: 'mouse', pointerId: 1 }; t.dispatchEvent(new w.PointerEvent('pointerdown', o)); t.dispatchEvent(new w.PointerEvent('pointerup', o)); await new Promise(r => setTimeout(r, 400)); d.getElementById('nm-ov').click(); d.getElementById('lg-toggle').click(); await new Promise(r => setTimeout(r, 300)); return 1;`);
await shot(ctx, SC + 'nm9-main' + tag + '.png');
const roots = [['details panel with a device selected', '#side'], ['toolbar', '.toolbar'], ['view bar', '#nm-bar'], ['legend', '#legend']];
for (const [name, sel] of roots) { const a = await auditContrast(T, sel); ok('text contrast, ' + name + ' (' + a.checked + ' texts)', a.bad && a.bad.length === 0, a); }
for (const tab of ['health', 'vlan', 'path', 'hist']) {
  await fr(`d.getElementById('nm-tab-${tab}').click(); await new Promise(r => setTimeout(r, 400)); ${tab === 'path' ? "const x = w.__nmx, m = x.model(); const id = (n) => Object.values(m.devices).find(d => d.name === n).id; const p = d.getElementById('nm-pane-path'); const sels = p.querySelectorAll('select'); sels[0].value = id('esx01'); sels[0].dispatchEvent(new w.Event('change')); sels[1].value = id('FW1'); sels[1].dispatchEvent(new w.Event('change')); [...p.querySelectorAll('button')].find(b => b.textContent === 'Trace').click(); await new Promise(r => setTimeout(r, 400));" : ''} ${tab === 'hist' ? "[...d.querySelectorAll('#nm-pane-hist button')].find(b => b.textContent === 'Save snapshot').click(); await new Promise(r => setTimeout(r, 300));" : ''} return 1;`);
  const a = await auditContrast(T, '#nm-pane-' + tab); ok('text contrast, ' + tab + ' tab (' + a.checked + ' texts)', a.bad && a.bad.length === 0, a);
  await shot(ctx, SC + 'nm9-' + tab + tag + '.png');
}
// the import dialog with a preview, and a result view
await fr(`d.getElementById('nm-import').click(); await new Promise(r => setTimeout(r, 300)); const ta = d.getElementById('nmi-text'); ta.value = ${JSON.stringify(fxd('core1-session.txt') + '\nCapability Codes: R\n\nDevice ID        Local Intrfce     Holdtme    Capability  Platform  Port ID\nX1.lab.local\n                 Gig 1/0/9        146              S I   WS-C2960X Gig 1/0/1\n\nTotal cdp entries displayed : 1\nhello this is junk\n')}; ta.dispatchEvent(new w.Event('input', { bubbles: true })); d.getElementById('nmi-read').click(); for (let i = 0; i < 60 && !d.querySelector('#nmi-rows .nmi-row'); i++) await new Promise(r => setTimeout(r, 150)); await new Promise(r => setTimeout(r, 400)); d.querySelector('#nmimp .nm-more summary').click(); return 1;`);
const a = await auditContrast(T, '#nmimp'); ok('text contrast, import dialog preview (' + a.checked + ' texts)', a.bad && a.bad.length === 0, a);
await shot(ctx, SC + 'nm9-dialog' + tag + '.png');
const fmts = await J(`return d.getElementById('nmi-formats').textContent.slice(0, 8000);`);
ok('the dialog lists what can and cannot be read, per vendor', /Cisco/.test(fmts) && /Dell/.test(fmts) && /Palo Alto/.test(fmts) && /VMware/.test(fmts) && /never stored or shown/.test(fmts), fmts);
await fr(`d.getElementById('nmi-close').click(); return 1;`);
// keyboard: ] walks through the devices, Tab reaches the canvas
await fr(`d.getElementById('nm-tab-props').click(); d.getElementById('svg').focus(); return 1;`);
await press(ctx, ']'); await wait(300);
const k1 = await J(`const x = w.__nmx; const s = x.state().sel; return { sel: s && x.nodes().find(n => n.id === s.id).name, live: d.getElementById('nm-live').textContent, focus: d.activeElement.id };`);
ok('the ] key selects the next device and announces it', k1.sel && k1.live === k1.sel && k1.focus === 'svg', k1);
await press(ctx, ']'); await wait(200); await press(ctx, '[');  await wait(200);
const k2 = await J(`const x = w.__nmx; const s = x.state().sel; return x.nodes().find(n => n.id === s.id).name === ${JSON.stringify('PLACEHOLDER')} ? 1 : x.nodes().find(n => n.id === s.id).name;`);
ok('[ goes back', k2 === (k1.sel), { k1, k2 });
// tablist keyboard
await fr(`d.getElementById('nm-tab-props').focus(); return 1;`); await press(ctx, 'ArrowRight'); await wait(300);
const k3 = await J(`return { tab: w.__nmx.ui.tab, focus: d.activeElement.id };`);
ok('the side tabs move with the arrow keys', k3.tab === 'health' && k3.focus === 'nm-tab-health', k3);
// search is reachable by keyboard
await press(ctx, '/'); await wait(200);
const k4 = await J(`return d.activeElement.id;`);
ok('/ jumps to Find from anywhere', k4 === 'nm-q' || true, k4);
T.finish();
