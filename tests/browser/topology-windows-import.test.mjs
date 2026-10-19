import { start, importText, fxd, shot, SC, wait } from './topology-lib.mjs';
// Windows readers in the Topology Builder: the import dialog lists them, a pasted Windows session builds one
// server with its team, the switch's LLDP-by-MAC output joins the NICs to it, and a PC invents no cable.
const T = await start(); const { ok, fr, J, ctx } = T;

// the import dialog says what it reads
await fr(`d.getElementById('nm-import').click(); await new Promise(r => setTimeout(r, 300)); return 1;`);
const fmt = await J(`const f = d.getElementById('nmi-formats'); return { heads: [...f.querySelectorAll('h4')].map(h => h.textContent), text: f.textContent };`);
ok('the import dialog lists Windows and Linux servers', fmt.heads.indexOf('Windows servers and PCs') >= 0 && fmt.heads.indexOf('Linux servers') >= 0, fmt.heads);
ok('it names the Windows commands and the English-only limit', /ipconfig \/all/.test(fmt.text) && /Get-NetAdapter/.test(fmt.text) && /Get-NetLbfoTeam/.test(fmt.text) && /English output only/.test(fmt.text), fmt.text.slice(0, 300));
await fr(`d.getElementById('nmi-close').click(); await new Promise(r => setTimeout(r, 300)); return 1;`);

// the switch first, then the Windows session pasted with its prompts
await importText(T, fxd('dell-s2-session.txt'));
await importText(T, fxd('win-srv02-session.txt'));
await fr(`w.__nmx.fit(); await new Promise(r => setTimeout(r, 400)); return 1;`);
const m = await J(`const mod = w.__nmx.model(); const named = (re) => Object.values(mod.devices).filter(x => re.test(x.name)); const s = named(/^srv02$/i); const ifs = s[0] ? Object.values(s[0].ifaces).map(i => i.name + ':' + i.type) : []; return { srv: s.length, held: (mod.held || mod.unassigned || []).length, ifs, kind: s[0] && s[0].kind, os: s[0] && s[0].os };`);
ok('the stub from the switch and the Windows host are one device', m.srv === 1, m);
ok('the server has its team and NICs, each with the right type', m.ifs.some(x => /^team1:po$/i.test(x)) && m.ifs.some(x => /^nic1:nic$/i.test(x)) && m.ifs.some(x => /^nic2:nic$/i.test(x)), m.ifs);
ok('nothing from the session was left unassigned', m.held === 0, m);

const links = await J(`const x = w.__nmx, v = x.view(); const out = []; for (const L of (v.links || [])) out.push([L.a.name, L.b.name, L.status, L.kind].join('|')); return { n: out.length, out, drawn: d.querySelectorAll('#svg g[data-kind=link]').length };`);
ok('the switch sees the server by MAC, so the NICs are cabled to its ports', /ethernet1\/1\/5/.test(links.out.join(';')) && /ethernet1\/1\/6/.test(links.out.join(';')), links.out);
ok('no cable is invented for the team interface', !links.out.some(l => /team1/i.test(l) && /phys/.test(l)), links.out);
const inf = await J(`const g = [...d.querySelectorAll('#svg g[data-kind=link]')]; return { drawn: g.length, dashed: g.filter(x => [...x.querySelectorAll('line, path')].some(e => e.getAttribute('stroke-dasharray'))).length, on: d.getElementById('nm-ov').checked };`);
ok('only the switch reports the cables, so they are drawn dashed as inferred', inf.drawn >= 3 && inf.dashed === inf.drawn, inf);
await shot(ctx, SC + 'nm-windows-server.png');

// a PC: Wi-Fi, Bluetooth and Hyper-V adapters are listed, never drawn as cables
await importText(T, fxd('win-pc01-ipconfig.txt'));
const pc = await J(`const mod = w.__nmx.model(); const p = Object.values(mod.devices).filter(x => /^laptop-ian$/i.test(x.name)); const ifs = p[0] ? Object.values(p[0].ifaces).map(i => i.name + ':' + i.type) : []; const v = w.__nmx.view(); const cabled = (v.links || []).filter(L => mod.devices[L.a.dev] === p[0] || mod.devices[L.b.dev] === p[0]).length; return { pcs: p.length, ifs, cabled };`);
ok('the PC is read as one device with its adapters', pc.pcs === 1 && pc.ifs.length >= 2, pc);
ok('the PC invents no cable', pc.cabled === 0, pc);
T.finish();
