import { start, importText, LAB_CFGS, LAB_SESS, shot, SC, wait, press, fxd } from './topology-lib.mjs';
const T = await start(); const { ok, fr, J, ctx } = T;
await importText(T, LAB_CFGS() + '\n' + LAB_SESS());
await fr(`w.__nmx.fit(); await new Promise(r => setTimeout(r, 300)); return 1;`);

// ---- VLAN tab and view ----
await fr(`d.getElementById('nm-tab-vlan').click(); await new Promise(r => setTimeout(r, 400)); return 1;`);
const vl = await J(`const p = d.getElementById('nm-pane-vlan'); return { rows: [...p.querySelectorAll('.nm-vrow')].map(x => x.innerText.replace(/\\n/g, ' ')), note: /never one colour/.test(p.innerText), disclaim: /does not prove they are in one broadcast domain/.test(p.innerText) };`);
ok('the VLAN tab lists the VLANs with names and where they are used', vl.rows.length >= 4 && vl.rows.some(r => /VLAN 10 USERS/.test(r)) && vl.rows.some(r => /VLAN 99 MGMT/.test(r)), vl);
ok('it says that a shared VLAN ID does not prove a shared broadcast domain', vl.disclaim && vl.note, vl);
await fr(`const b = [...d.querySelectorAll('#nm-pane-vlan .nm-vrow')].find(x => /VLAN 99/.test(x.innerText)); b.click(); await new Promise(r => setTimeout(r, 400)); return 1;`);
const vv = await J(`const x = w.__nmx; const strokes = [...d.querySelectorAll('#svg g[data-kind=link] line, #svg g[data-kind=link] path')].map(e => e.getAttribute('stroke')).filter(s => s && s !== 'transparent'); const ops = [...d.querySelectorAll('#svg g[data-kind=link]')].map(g => g.getAttribute('opacity')).filter(Boolean); return { view: x.ui.view, vlan: x.ui.vlan, badge: d.getElementById('nm-vbadge').innerText, strokes: [...new Set(strokes)], faded: ops.length, hsl: strokes.filter(s => /^hsl/.test(s)).length };`);
ok('focusing a VLAN colours the links that carry it and fades the rest', vv.view === 'vlan' && vv.vlan === 99 && /VLAN 99/.test(vv.badge) && vv.hsl >= 1 && vv.faded >= 1, vv);
await shot(ctx, SC + 'nm5-vlan99.png');
await fr(`d.querySelector('#nm-pane-vlan .nm-vrow.on').click(); await new Promise(r => setTimeout(r, 300)); return 1;`);
const vall = await J(`const strokes = [...d.querySelectorAll('#svg g[data-kind=link] line, #svg g[data-kind=link] path')].map(e => e.getAttribute('stroke')).filter(s => s && s !== 'transparent'); return { strokes: [...new Set(strokes)], hollow: [...d.querySelectorAll('#svg g[data-kind=link] path')].filter(p => p.getAttribute('stroke') === '#212124' || p.getAttribute('stroke') === '#212124').length };`);
ok('trunks are never one VLAN colour in the VLAN view (hollow neutral line)', vall.strokes.some(s => !/^hsl/.test(s)) , vall);
await fr(`d.getElementById('nm-v-phys').click(); await new Promise(r => setTimeout(r, 300)); return 1;`);
const back = await J(`const strokes = [...d.querySelectorAll('#svg g[data-kind=link] line, #svg g[data-kind=link] path')].map(e => e.getAttribute('stroke')).filter(s => s && s !== 'transparent'); return [...new Set(strokes)];`);
ok('back in Link state, health colours return and VLAN colours are gone', back.indexOf('#3ecf8e') >= 0 && !back.some(s => /^hsl/.test(s)), back);

// ---- Path ----
await fr(`d.getElementById('nm-tab-path').click(); await new Promise(r => setTimeout(r, 300)); const x = w.__nmx, m = x.model(); const id = (n) => Object.values(m.devices).find(d => d.name === n).id; const p = d.getElementById('nm-pane-path'); const sels = p.querySelectorAll('select'); sels[0].value = id('esx01'); sels[0].dispatchEvent(new w.Event('change')); sels[1].value = id('FW1'); sels[1].dispatchEvent(new w.Event('change')); [...p.querySelectorAll('button')].find(b => b.textContent === 'Trace').click(); await new Promise(r => setTimeout(r, 400)); return 1;`);
const ph = await J(`const p = d.getElementById('nm-pres'); return { text: p.innerText.slice(0, 900), cards: p.querySelectorAll('.nm-path').length, hi: Object.keys(w.__nmx.ui.pathHi || {}).length };`);
ok('a physical path is listed hop by hop, with a warning when it uses inferred links', ph.cards >= 1 && /uses inferred links/.test(ph.text) && /not proof that traffic is allowed/.test(ph.text) && ph.hi >= 2, ph);
await fr(`const p = d.getElementById('nm-pane-path'); [...p.querySelectorAll('button')].find(b => b.textContent === 'Logical path').click(); await new Promise(r => setTimeout(r, 200)); [...p.querySelectorAll('button')].find(b => b.textContent === 'Trace').click(); await new Promise(r => setTimeout(r, 400)); return 1;`);
const lg = await J(`const p = d.getElementById('nm-pres'); return { text: p.innerText.slice(0, 1800), steps: p.querySelectorAll('.nm-steps li').length };`);
ok('a logical path separates known, assumed and missing, and is not a reachability test', lg.steps >= 1 && /What is missing/i.test(lg.text) && /not a reachability test/.test(lg.text) && /Access lists, firewall rules, NAT/.test(lg.text), lg);
await shot(ctx, SC + 'nm5-path.png');

// ---- Search ----
await fr(`d.getElementById('nm-tab-props').click(); const q = d.getElementById('nm-q'); q.focus(); q.value = '10.0.99.21'; q.dispatchEvent(new w.Event('input', { bubbles: true })); await new Promise(r => setTimeout(r, 300)); return 1;`);
const sr = await J(`const r = d.getElementById('nm-res'); return { hidden: r.classList.contains('hidden'), rows: [...r.querySelectorAll('.nm-r')].map(x => x.innerText.replace(/\\n/g, ' | ')) };`);
ok('searching an address finds the device it belongs to', !sr.hidden && sr.rows.some(x => /esx01/.test(x)), sr);
await press(ctx, 'Enter'); await wait(500);
const sg = await J(`const x = w.__nmx; const st = x.state(); const n = x.nodes().find(n => n.id === (st.sel && st.sel.id)); return { sel: n && n.name, k: st.view.k, found: !!x.ui.found };`);
ok('choosing a result selects the device, centres on it and highlights it', sg.sel === 'esx01' && sg.k >= 0.79 && sg.found, sg);
await fr(`const q = d.getElementById('nm-q'); q.value = '00:50:56:aa:bb:02'; q.dispatchEvent(new w.Event('input', { bubbles: true })); await new Promise(r => setTimeout(r, 300)); return 1;`);
const sm = await J(`return [...d.querySelectorAll('#nm-res .nm-r')].map(x => x.innerText.replace(/\\n/g, ' | '));`);
ok('a MAC address is found whichever way it is typed', sm.some(x => /esx01/.test(x) && /vmnic1/.test(x)), sm);
await fr(`const q = d.getElementById('nm-q'); q.value = 'aabb02'; q.dispatchEvent(new w.Event('input', { bubbles: true })); await new Promise(r => setTimeout(r, 300)); return 1;`);
const sm2 = await J(`return [...d.querySelectorAll('#nm-res .nm-r')].length;`);
ok('...and as a bare fragment', sm2 >= 1, sm2);
await press(ctx, 'Escape');
T.finish();
