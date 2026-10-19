// Network Calculator: the IPv6 tab (subnet calculator, split, EUI-64) and the hand-over from the IPv4 Subnet Calc.
import { session } from './lib.mjs';
const S = await session();
await S.load('#toolkit', 2200);

// pure helpers, checked against values worked out by hand
const parse = (s) => S.frame(`const a = w.v6Parse(${JSON.stringify(s)}); return a ? { c: w.v6Compress(a.n), e: w.v6Expand(a.n), z: a.zone } : null;`);
const cases = [
  ['2001:db8:acad:10::25', '2001:db8:acad:10::25', '2001:0db8:acad:0010:0000:0000:0000:0025'],
  ['2001:0db8:0000:0000:0001:0000:0000:0001', '2001:db8::1:0:0:1', null],
  ['2001:db8:0:1:1:1:1:1', '2001:db8:0:1:1:1:1:1', null],
  ['::', '::', '0000:0000:0000:0000:0000:0000:0000:0000'],
  ['::1', '::1', null], ['1::', '1::', null], ['0:0:0:0:0:0:0:0', '::', null],
  ['2001:DB8::A', '2001:db8::a', null],
  ['::ffff:192.0.2.1', '::ffff:c000:201', null], ['::1.2.3.4', '::102:304', null],
  ['1:2:3:4:5:6:7::', '1:2:3:4:5:6:7:0', null],
  ['[2001:db8::1]', '2001:db8::1', null],
  ['ffff:ffff:ffff:ffff:ffff:ffff:ffff:ffff', 'ffff:ffff:ffff:ffff:ffff:ffff:ffff:ffff', null],
];
for (const [inp, comp, exp] of cases) {
  const r = await parse(inp);
  S.ok(`parse ${inp} -> ${comp}`, r && r.c === comp && (exp === null || r.e === exp), r);
}
S.ok('a zone ID is kept apart from the address', (await parse('fe80::1%eth0')).z === 'eth0' && (await parse('fe80::1%eth0')).c === 'fe80::1', await parse('fe80::1%eth0'));
for (const bad of ['2001:db8::1::2', '12345::1', 'g::1', '1:2:3:4:5:6:7:8:9', ':1:2:3:4:5:6:7', '1.2.3.4', '2001:db8::256.1.1.1', '', '1:2:3:4:5:6:7:8::', 'fe80::1::']) {
  S.ok(`rejects ${JSON.stringify(bad)}`, (await parse(bad)) === null, await parse(bad));
}

// the tab and the calculator
S.ok('the sidebar has an IPv6 Calc tab', await S.frame(`const b = d.querySelector('.tab[data-tab="v6"]'); return !!b && /IPv6/.test(b.textContent);`));
await S.frame(`d.querySelector('.tab[data-tab="v6"]').click(); return 1;`);
S.ok('clicking it shows the IPv6 pane and hides the IPv4 one', await S.frame(`return d.getElementById('pane-v6').classList.contains('active') && !d.getElementById('pane-calc').classList.contains('active');`));
const calc = (addr, pref) => S.frame(`d.getElementById('v6Addr').value = ${JSON.stringify(addr)}; d.getElementById('v6Prefix').value = ${JSON.stringify(pref || '')}; d.getElementById('btnV6').click(); await new Promise(r => setTimeout(r, 150)); const t = (id) => d.getElementById(id).textContent; const rows = {}; d.querySelectorAll('#v6Table tbody tr').forEach(tr => rows[tr.querySelector('th').textContent] = tr.querySelector('td').textContent); return { net: t('v6resNetwork'), cidr: t('v6resNetworkCidr'), first: t('v6resFirst'), last: t('v6resLast'), total: t('v6resTotal'), sub: t('v6resTotalSub'), s64: t('v6res64'), type: t('v6resType'), note: t('v6Note'), rows, shown: d.getElementById('v6Cards').style.display !== 'none', toast: d.getElementById('toast-container').lastChild ? d.getElementById('toast-container').lastChild.textContent : '' };`);

let r = await calc('2001:db8:acad:10::25', '64');
S.ok('/64: network, range and counts', r.net === '2001:db8:acad:10::' && r.cidr === '2001:db8:acad:10::/64' && r.first === '2001:db8:acad:10::' && r.last === '2001:db8:acad:10:ffff:ffff:ffff:ffff' && r.total === '18,446,744,073,709,551,616' && r.sub === '2^64 addresses' && r.s64 === '1', r);
S.ok('/64: documentation address, standard LAN note', r.type === 'Documentation address' && /standard size for a LAN/.test(r.note), r);
S.ok('/64: compressed and expanded forms', r.rows['Compressed'] === '2001:db8:acad:10::25' && r.rows['Expanded'] === '2001:0db8:acad:0010:0000:0000:0000:0025', r.rows);
S.ok('/64: reverse DNS name (all 32 nibbles) is right', r.rows['Reverse DNS name (PTR)'] === '5.2.0.0.0.0.0.0.0.0.0.0.0.0.0.0.0.1.0.0.d.a.c.a.8.b.d.0.1.0.0.2.ip6.arpa', r.rows['Reverse DNS name (PTR)']);
S.ok('/64: reverse DNS zone (16 nibbles) is right', r.rows['Reverse DNS zone for the prefix'] === '0.1.0.0.d.a.c.a.8.b.d.0.1.0.0.2.ip6.arpa', r.rows['Reverse DNS zone for the prefix']);
S.ok('/64: solicited-node multicast address is right', r.rows['Solicited-node multicast'] === 'ff02::1:ff00:25', r.rows);
S.ok('/64: a plain interface ID is not called EUI-64', /Not EUI-64/.test(r.rows['Interface ID (last 64 bits)']), r.rows['Interface ID (last 64 bits)']);

r = await calc('2001:db8:acad::1/48', '');
S.ok('the prefix can be typed after a slash in the address box', r.cidr === '2001:db8:acad::/48' && r.s64 === '65,536' && /holds 65,536 subnets of \/64/.test(r.note), r);
S.ok('/48: reverse zone has 12 nibbles', r.rows['Reverse DNS zone for the prefix'] === 'd.a.c.a.8.b.d.0.1.0.0.2.ip6.arpa', r.rows['Reverse DNS zone for the prefix']);
r = await calc('2001:db8::1', '62');
S.ok('/62 is not on a nibble boundary, and the zone note says what to delegate', /delegate the \/60 zone/.test(r.rows['Reverse DNS zone for the prefix']), r.rows['Reverse DNS zone for the prefix']);
r = await calc('2001:db8::1', '127');
S.ok('/127: 2 addresses, point-to-point note', r.total === '2' && /point-to-point link between two routers/.test(r.note) && r.last === '2001:db8::1', r);
r = await calc('2001:db8::1', '128');
S.ok('/128: a single address', r.total === '1' && r.first === r.last && /single address/.test(r.note), r);
r = await calc('2001:db8::1', '0');
S.ok('/0: the whole address space is counted exactly', r.total === '340,282,366,920,938,463,463,374,607,431,768,211,456' && r.net === '::', r);
r = await calc('2001:db8::1', '96');
S.ok('/96: smaller than a /64 says SLAAC will not work', r.s64 === 'Less than one' && /SLAAC will not work/.test(r.note), r);

// address types
const types = [
  ['::', 'Unspecified address'], ['::1', 'Loopback'], ['fe80::1', 'Link-local unicast'], ['fd12:3456:789a::1', 'Unique local address (ULA)'],
  ['2606:4700::1111', 'Global unicast'], ['2001:db8::5', 'Documentation address'], ['3fff:abc::1', 'Documentation address'], ['2002:c000:204::1', '6to4 address'],
  ['2001:0:4136:e378:8000:63bf:3fff:fdd2', 'Teredo tunnel address'], ['64:ff9b::c000:221', 'NAT64 well-known prefix'], ['::ffff:192.0.2.1', 'IPv4-mapped address'],
  ['fec0::1', 'Site-local (deprecated)'], ['100::1', 'Discard-only prefix'], ['ff02::1', 'Multicast'], ['4000::1', 'Reserved or unassigned'],
];
for (const [a, t] of types) {
  r = await calc(a, a === '::' || a === '::1' ? '128' : '64');
  S.ok(`${a} is ${t}`, r.type === t, r.type);
}
r = await calc('ff02::1', '128');
S.ok('ff02::1 is described as all nodes on the link', /link-local scope.*All nodes on the link/.test(r.rows['Address type']), r.rows['Address type']);
r = await calc('ff02::1:ff3c:4d5e', '128');
S.ok('a solicited-node multicast address is recognised', /solicited-node group/.test(r.rows['Address type']), r.rows['Address type']);
r = await calc('ff05::1:3', '128');
S.ok('ff05::1:3 is the site-scope DHCPv6 servers group', /site-local scope.*DHCPv6 servers/.test(r.rows['Address type']), r.rows['Address type']);
r = await calc('ff0e::1234', '128');
S.ok('multicast flags and global scope are read', /global scope/.test(r.rows['Address type']) && !/temporary/.test(r.rows['Address type']), r.rows['Address type']);
r = await calc('ff1e::1234', '128');
S.ok('the T flag is read as temporary', /temporary/.test(r.rows['Address type']), r.rows['Address type']);
r = await calc('fe80::21a:2bff:fe3c:4d5e', '64');
S.ok('an EUI-64 interface ID is traced back to its MAC address', /Looks like EUI-64.*00:1a:2b:3c:4d:5e/.test(r.rows['Interface ID (last 64 bits)']), r.rows['Interface ID (last 64 bits)']);
r = await calc('::ffff:192.0.2.1', '128');
S.ok('an IPv4-mapped address shows the IPv4 address inside it', r.rows['Embedded IPv4 address'] === '192.0.2.1', r.rows);
r = await calc('2002:c000:204::1', '48');
S.ok('a 6to4 address shows the IPv4 address inside it', r.rows['Embedded IPv4 address'] === '192.0.2.4', r.rows);
r = await calc('64:ff9b::c000:221', '96');
S.ok('a NAT64 address shows the IPv4 address inside it', r.rows['Embedded IPv4 address'] === '192.0.2.33', r.rows);
r = await calc('fe80::1%eth0', '64');
S.ok('a zone ID is shown with a warning that it is local', /eth0/.test(r.rows['Zone ID'] || ''), r.rows);

// bad input is told so
r = await calc('2001:db8::1::2', '64');
S.ok('a bad address gives a clear message', /Not a valid IPv6 address/.test(r.toast), r.toast);
r = await calc('2001:db8::1', '129');
S.ok('a prefix over 128 gives a clear message', /Not a valid prefix length/.test(r.toast), r.toast);
r = await calc('2001:db8::1', '');
S.ok('a missing prefix asks for one', /Enter a prefix length/.test(r.toast), r.toast);

// split
const split = (parent, to, show, start) => S.frame(`for (const [id, v] of [['v6SplitParent', ${JSON.stringify(parent)}], ['v6SplitTo', ${JSON.stringify(to)}], ['v6SplitShow', ${JSON.stringify(show ?? '16')}], ['v6SplitStart', ${JSON.stringify(start ?? '')}]]) d.getElementById(id).value = v; w.runV6Split(); const rows = [...d.querySelectorAll('#v6SplitTable tbody tr')].map(tr => [...tr.children].map(c => c.textContent)); return { rows, msg: d.getElementById('v6SplitMsg').textContent, shown: d.getElementById('v6SplitOut').style.display !== 'none' };`);
let sp = await split('2001:db8:acad::/48', '64', '8', '');
S.ok('split /48 into /64: 8 shown, first and last rows', sp.rows.length === 8 && sp.rows[0][1] === '2001:db8:acad::/64' && sp.rows[7][1] === '2001:db8:acad:7::/64' && sp.rows[7][3] === '2001:db8:acad:7:ffff:ffff:ffff:ffff', sp);
S.ok('split /48 into /64: says there are 65,536', /holds 65,536 subnets of \/64, each with 18,446,744,073,709,551,616 addresses/.test(sp.msg), sp.msg);
sp = await split('2001:db8:acad::/48', '64', '16', '255');
S.ok('start at number 255 lands on 2001:db8:acad:ff::/64', sp.rows[0][0] === '255' && sp.rows[0][1] === '2001:db8:acad:ff::/64', sp.rows[0]);
sp = await split('2001:db8:acad::/48', '64', '16', '65535');
S.ok('the last /64 is number 65,535 and only that one is listed', sp.rows.length === 1 && sp.rows[0][1] === '2001:db8:acad:ffff::/64', sp);
sp = await split('2001:db8:acad::/48', '64', '16', '65536');
S.ok('a start past the end is refused with the real range', !sp.shown && /only 65,536 subnets, numbered 0 to 65,535/.test(sp.msg), sp);
sp = await split('2001:db8::/32', '36', '4', '');
S.ok('split /32 into /36 gives 16 and the second starts at 1000::', /holds 16 subnets/.test(sp.msg) && sp.rows[1][1] === '2001:db8:1000::/36', sp);
sp = await split('2001:db8::/126', '128', '16', '');
S.ok('split /126 into /128 lists exactly 4 addresses', sp.rows.length === 4 && sp.rows[3][1] === '2001:db8::3/128', sp);
sp = await split('2001:db8::/48', '40', '', '');
S.ok('a new prefix shorter than the network is refused', !sp.shown && /shorter than the network/.test(sp.msg), sp);
sp = await split('nonsense', '64', '', '');
S.ok('a bad network is refused', !sp.shown && /address and prefix length/.test(sp.msg), sp);
sp = await split('2001:db8::/48', '64', '0', '');
S.ok('showing zero subnets is refused', !sp.shown && /between 1 and 256/.test(sp.msg), sp);
sp = await split('2001:db8:acad::5/48', '64', '2', '');
S.ok('a host address in the prefix is rounded down to the network', sp.rows[0][1] === '2001:db8:acad::/64', sp.rows[0]);

// EUI-64
const eui = (mac, prefix) => S.frame(`d.getElementById('v6Mac').value = ${JSON.stringify(mac)}; d.getElementById('v6EuiPrefix').value = ${JSON.stringify(prefix ?? 'fe80::/64')}; w.runV6Eui(); const rows = {}; d.querySelectorAll('#v6EuiTable tbody tr').forEach(tr => rows[tr.querySelector('th').textContent] = tr.querySelector('td').textContent); return { rows, msg: d.getElementById('v6EuiMsg').textContent, shown: d.getElementById('v6EuiOut').style.display !== 'none' };`);
let e = await eui('00:1A:2B:3C:4D:5E');
S.ok('EUI-64: 00:1A:2B:3C:4D:5E gives fe80::21a:2bff:fe3c:4d5e', e.rows['IPv6 address'] === 'fe80::21a:2bff:fe3c:4d5e' && e.rows['Interface ID (modified EUI-64)'] === '021a:2bff:fe3c:4d5e', e);
S.ok('EUI-64: solicited-node multicast is ff02::1:ff3c:4d5e', e.rows['Solicited-node multicast'] === 'ff02::1:ff3c:4d5e', e.rows);
for (const m of ['001a.2b3c.4d5e', '00-1a-2b-3c-4d-5e', '001a2b3c4d5e', '00 1A 2B 3C 4D 5E']) {
  e = await eui(m);
  S.ok(`EUI-64 accepts the MAC written as ${m}`, e.rows['IPv6 address'] === 'fe80::21a:2bff:fe3c:4d5e', e);
}
e = await eui('00:1A:2B:3C:4D:5E', '2001:db8:acad:10::/64');
S.ok('EUI-64 on a global prefix', e.rows['IPv6 address'] === '2001:db8:acad:10:21a:2bff:fe3c:4d5e', e.rows);
e = await eui('02:00:5e:10:00:01');
S.ok('EUI-64 with a locally administered MAC flips the bit the other way', e.rows['IPv6 address'] === 'fe80::5eff:fe10:1' && /locally administered/.test(e.msg), e);
e = await eui('00:1A:2B');
S.ok('EUI-64 rejects a short MAC', !e.shown && /12 hex digits/.test(e.msg), e);
e = await eui('00:1A:2B:3C:4D:5E', '2001:db8::/48');
S.ok('EUI-64 insists on a /64', !e.shown && /\/64/.test(e.msg), e);

// hand-over from the IPv4 Subnet Calc
const hand = (ip, pref) => S.frame(`d.querySelector('.tab[data-tab="calc"]').click(); d.getElementById('ipAddr').value = ${JSON.stringify(ip)}; d.getElementById('prefixOrMask').value = ${JSON.stringify(pref)}; d.getElementById('v6Addr').value = ''; d.getElementById('v6Prefix').value = ''; d.getElementById('btnCalc').click(); await new Promise(r => setTimeout(r, 200)); return { v6: d.getElementById('pane-v6').classList.contains('active'), calc: d.getElementById('pane-calc').classList.contains('active'), addr: d.getElementById('v6Addr').value, pref: d.getElementById('v6Prefix').value, net: d.getElementById('v6resNetworkCidr').textContent, v4net: d.getElementById('resNetwork').textContent, focus: d.activeElement && d.activeElement.id };`);
let hv = await hand('2001:db8::1/64', '');
S.ok('an IPv6 address with its prefix typed into the IPv4 tab is calculated in the IPv6 tab', hv.v6 && !hv.calc && hv.net === '2001:db8::/64', hv);
hv = await hand('fd00::1', '56');
S.ok('a prefix above 32 is carried across', hv.v6 && hv.pref === '56' && hv.net === 'fd00::/56', hv);
hv = await hand('fd00::1', '24');
S.ok('a prefix that could be IPv4 is not carried across; the IPv6 prefix box is focused instead', hv.v6 && hv.pref === '' && hv.focus === 'v6Prefix', hv);
hv = await hand('192.168.10.25', '24');
S.ok('IPv4 still works in the IPv4 tab', hv.calc && !hv.v6 && hv.v4net === '192.168.10.0', hv);

// the hub finds it
await S.load('', 1500);
const found = await S.ev(`const hs = document.getElementById('homeSearch'); hs.focus(); hs.value = 'ipv6'; hs.dispatchEvent(new Event('input', { bubbles: true })); await new Promise(r => setTimeout(r, 400)); return [...document.querySelectorAll('#homeResults li')].map(li => li.textContent.trim().slice(0, 60));`);
S.ok('searching the hub for ipv6 finds the Network Calculator', found.some((t) => /Network Calculator/.test(t)), found);
S.finish();
