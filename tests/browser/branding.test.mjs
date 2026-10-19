// Branding: the IK logo is the only logo and sits at the top of the hub and of every tool, and certain words never appear.
// The words are kept as character codes on purpose, so that the repository itself never contains them.
import { readFileSync } from 'node:fs';
import { session, KIT } from './lib.mjs';
const BANNED = [[56, 51, 114, 100], [98, 108, 97, 99, 107, 32, 107, 110, 105, 103, 104, 116]].map((c) => String.fromCharCode(...c));
const banned = new RegExp(BANNED.map((w) => w.replace(/ /g, '\\s*')).join('|'), 'i');

// the file itself, everything it ships with, and its screenshots' names
const root = new URL('../../', import.meta.url);
const files = ['index.html', 'README.md', 'CHANGELOG.md'];
const S = await session();
for (const f of files) {
  let text = ''; try { text = readFileSync(new URL(f, root), 'utf8'); } catch { continue; }
  S.ok(`${f} has none of the banned words`, !banned.test(text), f);
}
S.ok('the page icon is the only embedded image (one data: PNG)', (readFileSync(new URL('index.html', root), 'utf8').match(/data:image\/(?:png|jpeg|gif|webp);base64,/g) || []).length === 1, 'count');

await S.load('', 1500);
const hub = await S.ev(`const i = document.getElementById('kitLogo'), r = i.getBoundingClientRect(); return { top: Math.round(r.top), left: Math.round(r.left), w: r.width, nat: i.naturalWidth, same: i.src === document.getElementById('kitIcon').href };`);
S.ok('the hub shows the IK logo at the top left, the same image as the tab icon', hub.top < 40 && hub.left < 400 && hub.w > 20 && hub.nat > 0 && hub.same, hub);
const ids = await S.ev(`return [...document.querySelectorAll('#cardGrid .card')].map(c => c.dataset.id)`);
for (const id of ids) {
  await S.load('#' + id, 1700);
  const r = await S.ev(`const icon = document.getElementById('kitIcon').href, found = [];
    const scan = (doc, ox, oy) => { for (const e of doc.querySelectorAll('img,svg')) { const b = e.getBoundingClientRect(); if (b.width < 18 || b.height < 18 || b.width > 90) continue; const cs = (doc.defaultView || window).getComputedStyle(e); if (cs.display === 'none' || cs.visibility === 'hidden') continue; const isImg = e.tagName === 'IMG' && e.src === icon, isSvg = e.tagName.toLowerCase() === 'svg' && /^\\s*IK\\s*$/.test(e.textContent); if (isImg || isSvg) found.push({ x: Math.round(b.left + ox), y: Math.round(b.top + oy) }); } };
    scan(document, 0, 0); const f = document.querySelector('iframe'); if (f && f.contentDocument) { const fb = f.getBoundingClientRect(); scan(f.contentDocument, fb.left, fb.top); }
    const text = (document.body.innerText || '') + ' ' + (f && f.contentDocument ? f.contentDocument.body.innerText : '');
    return { top: found.filter((c) => c.y < 90 && c.x < 260).length, text };`);
  S.ok(`${id}: the IK logo is at the top left`, r.top >= 1, r.top);
  S.ok(`${id}: none of the banned words is on screen`, !banned.test(r.text), id);
}
S.finish();
