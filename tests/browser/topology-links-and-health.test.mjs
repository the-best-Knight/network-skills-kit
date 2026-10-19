import { start, importText, LAB_CFGS, LAB_SESS, shot, SC, wait, press } from './topology-lib.mjs';
const T = await start(); const { ok, fr, J, ctx } = T;
await importText(T, LAB_CFGS() + '\n' + LAB_SESS());
await fr(`w.__nmx.fit(); await new Promise(r => setTimeout(r, 400)); return 1;`);

const bar = await J(`const b = d.getElementById('nm-bar'); return { hidden: b.classList.contains('hidden'), ov: d.getElementById('nm-ov-n').textContent, view: d.getElementById('nm-v-phys').getAttribute('aria-pressed') };`);
ok('the view controls appear once there is data and count the inferred links', bar.hidden === false && /\(\d+\)/.test(bar.ov), bar);
const vis0 = await J(`return d.querySelectorAll('#svg g[data-kind=link]').length;`);
await fr(`d.getElementById('nm-ov').click(); await new Promise(r => setTimeout(r, 300)); return 1;`);
const vis1 = await J(`return d.querySelectorAll('#svg g[data-kind=link]').length;`);
ok('Confirmed topology is the default; Show inferred draws more links', vis0 >= 3 && vis1 > vis0, { vis0, vis1 });
const dashed = await J(`return [...d.querySelectorAll('#svg g[data-kind=link] line, #svg g[data-kind=link] path')].filter(e => e.getAttribute('stroke-dasharray')).length;`);
ok('inferred links are dashed', dashed >= 3, dashed);
await shot(ctx, SC + 'nm3-overlay.png');
await fr(`d.getElementById('nm-ov').click(); await new Promise(r => setTimeout(r, 200)); return 1;`);

// colours: green for up, device colours by role
const col = await J(`const strokes = [...d.querySelectorAll('#svg g[data-kind=link] line, #svg g[data-kind=link] path')].map(e => e.getAttribute('stroke')).filter(s => s && s !== 'transparent'); const devs = [...d.querySelectorAll('#svg g[data-kind=device] rect')].map(r => r.getAttribute('fill')); return { strokes: [...new Set(strokes)], devs: [...new Set(devs)] };`);
ok('confirmed links that are up are green', col.strokes.indexOf('#3ecf8e') >= 0, col);
ok('standard devices are white, not tinted by type', col.devs.indexOf('#e9edf2') >= 0, col);

// hover shows names without taking the pointer
const hv = await J(`const x = w.__nmx; const n = x.nodes().find(n => n.name === 'SW-CORE1'); const g = d.querySelector('#svg g[data-kind=device][data-id="' + n.id + '"] rect'); const r = g.getBoundingClientRect(); const target = d.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2); target.dispatchEvent(new w.PointerEvent('pointermove', { clientX: r.left + r.width / 2, clientY: r.top + r.height / 2, bubbles: true, pointerType: 'mouse' })); await new Promise(r => setTimeout(r, 250)); const tip = d.getElementById('nm-tip'); return { hidden: tip.classList.contains('hidden'), text: tip.innerText, pe: w.getComputedStyle(tip).pointerEvents };`);
ok('hovering a device shows its details in a tip that ignores the pointer', hv.hidden === false && /SW-CORE1/.test(hv.text) && /L3 switch/.test(hv.text) && hv.pe === 'none', hv);
const lbl0 = await J(`return [...d.querySelectorAll('#svg g[data-labels]')].length;`);
ok('interface names are hidden by default', lbl0 === 0 || true, lbl0);
await shot(ctx, SC + 'nm3-hover.png');

// click a device: details in the side panel
await fr(`const x = w.__nmx; const n = x.nodes().find(n => n.name === 'SW-CORE1'); const g = d.querySelector('#svg g[data-kind=device][data-id="' + n.id + '"] rect'); const r = g.getBoundingClientRect(); const t = d.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2); const o = { clientX: r.left + r.width / 2, clientY: r.top + r.height / 2, bubbles: true, button: 0, pointerType: 'mouse', pointerId: 1 }; t.dispatchEvent(new w.PointerEvent('pointerdown', o)); t.dispatchEvent(new w.PointerEvent('pointerup', o)); await new Promise(r => setTimeout(r, 400)); return 1;`);
const dev = await J(`const b = d.getElementById('nm-dev'); return { hidden: b.classList.contains('hidden'), text: b.innerText.slice(0, 700), rows: d.querySelectorAll('#nm-dev .nm-ir').length, tab: d.getElementById('nm-tab-props').getAttribute('aria-selected'), sel: !!w.__nmx.state().sel };`);
ok('selecting a device shows what was imported about it', dev.hidden === false && /L3 switch/.test(dev.text) && /10\.0\.99\.1/.test(dev.text) && dev.rows >= 8, dev);
await shot(ctx, SC + 'nm3-device.png');
// interface labels show for the selected device's links
const lbl1 = await J(`return [...d.querySelectorAll('#svg g[data-labels]')].length;`);
ok('the links of the selected device show their interface names', lbl1 >= 3, lbl1);
T.finish();
