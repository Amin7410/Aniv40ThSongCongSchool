// @ts-nocheck
/* eslint-disable */
/**
 * Đồ họa SVG tĩnh của gian trung tâm và bộ biểu tượng — chép NGUYÊN VĂN từ prototype.
 * Là hằng số trong mã nguồn (không chứa dữ liệu người dùng) nên an toàn khi chèn dạng HTML.
 */
import { rng } from './art'

export const LOTUS_D=["M32 4C26 14 26 26 32 34C38 26 38 14 32 4Z","M32 34C22 30 16 20 16 10C24 14 30 22 32 34Z","M32 34C42 30 48 20 48 10C40 14 34 22 32 34Z","M32 35C20 35 8 30 2 20C14 20 26 26 32 35Z","M32 35C44 35 56 30 62 20C50 20 38 26 32 35Z","M14 36.5h36v2.4H14z"];
export const lotus=`<svg viewBox="0 0 64 40" aria-hidden="true"><g fill="currentColor">${LOTUS_D.map(d=>`<path d="${d}"/>`).join("")}</g></svg>`;
export const I: Record<string, string> ={
  search:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="M20 20l-3.5-3.5"/></svg>',
  play:'<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M8 5v14l11-7z"/></svg>',
  pause:'<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M7 5h4v14H7zM13 5h4v14h-4z"/></svg>',
  music:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M9 18V5l11-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="17" cy="16" r="3"/></svg>',
  book:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round" aria-hidden="true"><path d="M2 5c3-1.5 7-1.5 10 1 3-2.5 7-2.5 10-1v14c-3-1.5-7-1.5-10 1-3-2.5-7-2.5-10-1z"/><path d="M12 6v14"/></svg>',
  cube:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round" aria-hidden="true"><path d="M12 2 3 7v10l9 5 9-5V7z"/><path d="M3 7l9 5 9-5M12 12v10"/></svg>',
  mic:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><rect x="9" y="2" width="6" height="12" rx="3"/><path d="M5 11a7 7 0 0 0 14 0M12 18v4"/></svg>',
  msg:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round" aria-hidden="true"><path d="M21 12a8 8 0 0 1-11.6 7.1L4 20l1-4.6A8 8 0 1 1 21 12z"/></svg>',
  user:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/></svg>',
  arrows:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9 6l-6 6 6 6M15 6l6 6-6 6"/></svg>',
  live:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" aria-hidden="true"><circle cx="12" cy="12" r="2.5" fill="currentColor"/><path d="M7.8 7.8a6 6 0 0 0 0 8.4M16.2 7.8a6 6 0 0 1 0 8.4M5 5a10 10 0 0 0 0 14M19 5a10 10 0 0 1 0 14"/></svg>'
};
export const BUST=`<svg class="bust" viewBox="0 0 160 170" role="img" aria-label="Vị trí đặt tượng Bác Hồ"><defs><radialGradient id="bustG" cx="40%" cy="30%" r="80%"><stop offset="0" stop-color="#fff2c4"/><stop offset=".35" stop-color="#e2b65c"/><stop offset=".75" stop-color="#a87a2c"/><stop offset="1" stop-color="#6d4c17"/></radialGradient></defs><path d="M10 170C12 130 40 114 80 112C120 114 148 130 150 170Z" fill="url(#bustG)"/><path d="M66 98h28v20l-14 10-14-10z" fill="url(#bustG)"/><path d="M60 113L80 134L100 113" fill="none" stroke="#7a5518" stroke-width="2"/><path d="M80 134V170" stroke="#7a5518" stroke-width="1.5"/><circle cx="80" cy="146" r="2" fill="#7a5518"/><circle cx="80" cy="160" r="2" fill="#7a5518"/><ellipse cx="53" cy="74" rx="4" ry="8" fill="url(#bustG)"/><ellipse cx="107" cy="74" rx="4" ry="8" fill="url(#bustG)"/><ellipse cx="80" cy="70" rx="27" ry="33" fill="url(#bustG)"/><path d="M54 60C54 40 66 34 80 34C95 34 106 42 106 60C100 50 92 47 80 47C68 47 59 51 54 60Z" fill="#b8892f" opacity=".7"/></svg>`;
const sp=(cx,cy,R)=>{const p=[];for(let i=0;i<10;i++){const a=-Math.PI/2+i*Math.PI/5,q=i%2?R*.382:R;p.push((cx+q*Math.cos(a)).toFixed(2)+","+(cy+q*Math.sin(a)).toFixed(2))}return p.join(" ")};
const FP="M0 4C20 0 40 8 60 4S88 0 90 3V57C70 61 50 53 30 57S2 61 0 57Z";
export const FLAGS=`<svg viewBox="0 0 90 60" role="img" aria-label="Cờ Đảng"><defs><linearGradient id="fw1" x1="0" x2="1"><stop offset="0" stop-color="#000" stop-opacity=".14"/><stop offset=".33" stop-color="#fff" stop-opacity=".14"/><stop offset=".66" stop-color="#000" stop-opacity=".1"/><stop offset="1" stop-color="#fff" stop-opacity=".1"/></linearGradient></defs><path d="${FP}" fill="#d7141a"/><g fill="none" stroke="#ffd400" stroke-width="3.4" stroke-linecap="round"><path d="M23.3 12.2A10 10 0 1 0 34.4 25.4"/><path d="M19.3 30.2L13 37"/><path d="M34 36L19.5 19.5"/></g><rect x="11.5" y="14.5" width="13" height="5" fill="#ffd400" transform="rotate(-45 18 17)"/><path d="${FP}" fill="url(#fw1)"/></svg><svg viewBox="0 0 90 60" role="img" aria-label="Quốc kỳ Việt Nam"><path d="${FP}" fill="#da251d"/><polygon points="${sp(45,30,14)}" fill="#ffde00"/><path d="${FP}" fill="url(#fw1)"/></svg>`;
export function flowersSVG(){const r=rng(7);let s='<defs><radialGradient id="fl" cx="40%" cy="35%"><stop offset="0" stop-color="#ffe3ec"/><stop offset=".6" stop-color="#ec8fb0"/><stop offset="1" stop-color="#b83a68"/></radialGradient></defs>';
  for(let i=0;i<14;i++){const a=Math.PI*(i/13),x=100-Math.cos(a)*88,y=66-Math.sin(a)*34;s+=`<ellipse cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" rx="13" ry="6" transform="rotate(${(-Math.cos(a)*35).toFixed(0)} ${x.toFixed(1)} ${y.toFixed(1)})" fill="${i%2?"#2f6b34":"#3f8a43"}"/>`}
  [[9,18,182,60],[7,34,166,44],[4,62,138,30]].forEach(([n,a,b,y])=>{for(let i=0;i<n;i++){const x=a+(b-a)*i/(n-1);s+=`<circle cx="${x.toFixed(1)}" cy="${(y+r()*3).toFixed(1)}" r="10.5" fill="url(#fl)"/><circle cx="${x.toFixed(1)}" cy="${(y-1).toFixed(1)}" r="3.5" fill="#f6c6d6"/>`}});
  return `<svg class="flowers" viewBox="0 0 200 80" aria-hidden="true">${s}</svg>`}
