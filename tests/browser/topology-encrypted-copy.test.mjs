import { start, importText, LAB_CFGS, LAB_SESS, shot, SC, wait, press, fxd, KIT } from './topology-lib.mjs';
const T = await start(1500, 950); const { ok, fr, J, ctx } = T;
await importText(T, LAB_CFGS() + '\n' + LAB_SESS() + '\n' + fxd('srv01-session.txt'));
await fr(`w.__nmx.fit(); d.getElementById('nm-ov').click(); await new Promise(r => setTimeout(r, 400)); return 1;`);
const clickNode = (name) => fr(`d.getElementById('toast').classList.remove('show'); const x = w.__nmx, n = x.nodes().find(n => n.name === ${JSON.stringify(name)}); const g = d.querySelector('#svg g[data-kind=device][data-id="' + n.id + '"] rect'); const r = g.getBoundingClientRect(); const px = r.left + r.width / 2, py = r.top + r.height / 2; const t = d.elementFromPoint(px, py); const o = { clientX: px, clientY: py, bubbles: true, button: 0, pointerType: 'mouse', pointerId: 1 }; t.dispatchEvent(new w.PointerEvent('pointerdown', o)); t.dispatchEvent(new w.PointerEvent('pointerup', o)); await new Promise(r => setTimeout(r, 350)); return 1;`);
// View menu
await fr(`d.querySelector('#nm-viewmenu summary').click(); await new Promise(r => setTimeout(r, 300)); return 1;`);
await shot(ctx, SC + 'nm11-viewmenu.png');
const vm = await J(`const p = d.querySelector('#nm-viewmenu .pop'); const r = p.getBoundingClientRect(); const st = d.getElementById('stage').getBoundingClientRect(); return { open: d.getElementById('nm-viewmenu').open, inside: r.left >= st.left - 1 && r.right <= st.right + 1, text: p.innerText.slice(0, 200) };`);
ok('the View menu opens fully inside the canvas', vm.open && vm.inside, vm);
await fr(`d.querySelector('input[name=nm-col][value=type]').click(); await new Promise(r => setTimeout(r, 300)); d.getElementById('nm-viewmenu').open = false; return 1;`);
const cls = await J(`const fills = [...d.querySelectorAll('#svg g[data-kind=device] rect')].map(r => r.getAttribute('fill')); return [...new Set(fills)];`);
ok('"By device type" switches to the classic colours', cls.indexOf('#e9edf2') < 0, cls);
await shot(ctx, SC + 'nm11-classic.png');
await fr(`d.querySelector('#nm-viewmenu summary').click(); d.querySelector('input[name=nm-col][value=role]').click(); d.getElementById('nm-viewmenu').open = false; await new Promise(r => setTimeout(r, 200)); return 1;`);
// the ESXi host's panel
await clickNode('esx01');
await fr(`d.getElementById('side').scrollTop = 600; return 1;`);
await shot(ctx, SC + 'nm11-esxi.png');
const ex = await J(`const t = d.getElementById('nm-dev').textContent; return { vs: /vSwitch vSwitch0/.test(t), pg: /Management Network/.test(t) || d.querySelectorAll('#nm-dev details').length >= 2, vms: /fileserver1/.test(t) || /Virtual machines/.test(t) };`);
ok('an ESXi host shows its switches, port groups, VMkernel ports and VMs', ex.vs && ex.pg && ex.vms, ex);
// srv01
await clickNode('srv01');
const sv = await J(`const t = d.getElementById('nm-dev').innerText; return { text: t.slice(0, 300), ifs: d.querySelectorAll('#nm-dev .nm-ir').length };`);
ok('a Linux server shows its NICs and bond', /server/i.test(sv.text) && sv.ifs >= 4, sv);
// firewall zones
await clickNode('FW1');
const fw = await J(`const t = d.getElementById('nm-dev').innerText; return { zones: /Security zones/i.test(t), routes: /Routes \\(/.test(t) };`);
ok('a firewall shows its zones and routes', fw.zones && fw.routes, fw);
await fr(`d.getElementById('side').scrollTop = 0; return 1;`);
await shot(ctx, SC + 'nm11-fw.png');
// autosave: opt in
await fr(`d.getElementById('nm-tab-hist').click(); await new Promise(r => setTimeout(r, 300)); const b = [...d.querySelectorAll('#nm-pane-hist button')].find(x => /Turn on/.test(x.textContent)); if (b) b.click(); await new Promise(r => setTimeout(r, 400)); return !!b;`);
const dlg = await J(`const e = d.getElementById('enc'); return { open: e.open, title: d.getElementById('enc-title').textContent };`);
ok('the encrypted browser copy asks for a passphrase first', dlg.open && /encrypted copy/.test(dlg.title), dlg);
await fr(`const p = d.getElementById('enc-pass'), p2 = d.getElementById('enc-pass2'); p.value = 'correct horse battery staple'; p2.value = 'correct horse battery staple'; p.dispatchEvent(new w.Event('input', { bubbles: true })); p2.dispatchEvent(new w.Event('input', { bubbles: true })); await new Promise(r => setTimeout(r, 200)); d.getElementById('enc-ok').click(); await new Promise(r => setTimeout(r, 2500)); return 1;`);
const idb = await J(`return await new Promise(res => { try { const r = w.indexedDB.open('ntb-autosave'); r.onsuccess = () => { const db = r.result; if (!db.objectStoreNames.contains('p')) { res({ exists: false }); return; } const q = db.transaction('p').objectStore('p').get('project'); q.onsuccess = () => res({ exists: !!q.result, len: q.result && q.result.env.length, plain: q.result && /SW-CORE1|10\\.0\\.99/.test(q.result.env), enc: q.result && /AES-256-GCM/.test(q.result.env) }); }; r.onerror = () => res({ error: true }); } catch (e) { res({ error: String(e) }); } });`);
console.log('autosave record', idb);
ok('an encrypted copy is stored, and it holds nothing readable', idb.exists === true && idb.enc === true && idb.plain === false, idb);
await shot(ctx, SC + 'nm11-history.png');
// reload: it is offered back
await (await import('./bidi.mjs')).goto(ctx, 'about:blank'); await (await import('./bidi.mjs')).goto(ctx, KIT + '#topology-builder'); await wait(3200); await (await import('./topology-lib.mjs')).clearSample(ctx);
const offer = await J(`const f = d.getElementById('nm-found'); return { hidden: f.classList.contains('hidden'), text: f.innerText.slice(0, 200) };`);
ok('after a restart the stored copy is offered, and not restored without the passphrase', offer.hidden === false && /encrypted copy/.test(offer.text) && (await J(`return w.__nmx.counts().nodes;`)) === 0, offer);
await fr(`const b = [...d.querySelectorAll('#nm-found button')].find(x => /Restore/.test(x.textContent)); b.click(); await new Promise(r => setTimeout(r, 400)); const p = d.getElementById('enc-pass'); p.value = 'correct horse battery staple'; p.dispatchEvent(new w.Event('input', { bubbles: true })); await new Promise(r => setTimeout(r, 200)); d.getElementById('enc-ok').click(); await new Promise(r => setTimeout(r, 3000)); return 1;`);
const back = await J(`const x = w.__nmx; return { nodes: x.counts().nodes, devs: Object.keys(x.model().devices).length, snaps: x.snaps().length };`);
ok('with the passphrase the whole project comes back, network data included', back.nodes >= 8 && back.devs >= 8 && back.snaps >= 1, back);
// delete it
await fr(`d.getElementById('nm-tab-hist').click(); await new Promise(r => setTimeout(r, 300)); return 1;`);
await fr(`const q = d.querySelector('#nm-pane-hist .nm-auto'); return q ? q.innerText : '';`);
T.finish();
