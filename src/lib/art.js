// @ts-nocheck
/* eslint-disable */
/**
 * Hình minh họa vẽ bằng canvas — chép NGUYÊN VĂN từ bản prototype để giao diện giống hệt.
 * Chỉ chạy ở trình duyệt. Dùng làm ảnh thay thế khi mục chưa có ảnh thật.
 */
function hash(s){let h=2166136261;for(let i=0;i<s.length;i++){h^=s.charCodeAt(i);h=Math.imul(h,16777619)}return h>>>0}
function rng(a){return function(){a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296}}
const SERIF='"Cormorant Garamond", Georgia, "Times New Roman", serif',SANS='"Be Vietnam Pro", "Segoe UI", Roboto, Arial, sans-serif',TIMES='"Times New Roman", Tinos, "Noto Serif", serif';
const LOTUS_D=["M32 4C26 14 26 26 32 34C38 26 38 14 32 4Z","M32 34C22 30 16 20 16 10C24 14 30 22 32 34Z","M32 34C42 30 48 20 48 10C40 14 34 22 32 34Z","M32 35C20 35 8 30 2 20C14 20 26 26 32 35Z","M32 35C44 35 56 30 62 20C50 20 38 26 32 35Z","M14 36.5h36v2.4H14z"];
/* ===================== Canvas illustrations ===================== */
function mk(w,h){const c=document.createElement("canvas");c.width=w;c.height=h;return c}
function fp(g,d,fill){g.fillStyle=fill;g.fill(new Path2D(d))}
function ell(g,cx,cy,rx,ry,fill){g.beginPath();g.ellipse(cx,cy,rx,ry,0,0,Math.PI*2);g.fillStyle=fill;g.fill()}
function circ(g,cx,cy,r,fill){ell(g,cx,cy,r,r,fill)}
function starPath(cx,cy,R,r){r=r||R*.382;const p=new Path2D();for(let i=0;i<10;i++){const a=-Math.PI/2+i*Math.PI/5,q=i%2?r:R,x=cx+q*Math.cos(a),y=cy+q*Math.sin(a);i?p.lineTo(x,y):p.moveTo(x,y)}p.closePath();return p}
function drawLotus(g,cx,cy,w,color){const s=w/64;g.save();g.translate(cx-32*s,cy-20*s);g.scale(s,s);g.fillStyle=color;LOTUS_D.forEach(d=>g.fill(new Path2D(d)));g.restore()}
function goldGrad(g,x0,y0,x1,y1){const gg=g.createLinearGradient(x0,y0,x1,y1);gg.addColorStop(0,"#f5dc9c");gg.addColorStop(.38,"#a97b2f");gg.addColorStop(.62,"#f1d08a");gg.addColorStop(1,"#8b6224");return gg}
function fitText(g,t,maxW){if(g.measureText(t).width<=maxW)return t;let s=t;while(s.length>1&&g.measureText(s+"…").width>maxW)s=s.slice(0,-1);return s.trimEnd()+"…"}
function wrapText(g,t,maxW,maxLines){const words=String(t).split(" "),lines=[];let cur="";for(const w of words){const test=cur?cur+" "+w:w;if(g.measureText(test).width<=maxW)cur=test;else{if(cur)lines.push(cur);cur=w}}if(cur)lines.push(cur);if(lines.length>maxLines){const k=lines.slice(0,maxLines);k[maxLines-1]=fitText(g,lines.slice(maxLines-1).join(" "),maxW);return k}return lines}

const SKIN=["#eac7a6","#e3b893","#dbab85","#efd0b2"];
function drawPortrait(g,seed,f,gray){
  const r=rng(hash(seed)),pick=a=>a[Math.floor(r()*a.length)];
  const bg=pick([["#7f9cc0","#34557d"],["#93a6bb","#4b5f78"],["#a7b4c4","#56677e"],["#c2ad86","#7a6440"]]);
  const skin=pick(SKIN),hair=gray?pick(["#9a9a9a","#b5b5b5","#7d7d7d"]):pick(["#1b1411","#261b15","#33251c"]);
  const suit=f?pick(["#8a1f33","#1f3d66","#5b2d63","#2f4f4f","#a8413e"]):pick(["#1b2431","#232b37","#2b3442","#1d2b40"]);
  const rg=g.createRadialGradient(60,57,0,60,57,112);rg.addColorStop(0,bg[0]);rg.addColorStop(1,bg[1]);g.fillStyle=rg;g.fillRect(0,0,120,150);
  if(f)fp(g,"M33 74C29 44 43 30 60 30C78 30 91 44 87 74C89 92 86 102 82 108H38C34 102 31 92 33 74Z",hair);
  g.fillStyle=skin;g.fillRect(50,84,20,22);g.fillStyle="rgba(0,0,0,.08)";g.fillRect(50,92,20,6);
  fp(g,"M6 150C8 120 30 104 60 102C90 104 112 120 114 150Z",suit);
  if(f)fp(g,"M47 103L60 122L73 103Z","#f4ede2");
  else{fp(g,"M48 103L60 126L72 103Z","#f7f4ee");fp(g,"M57.5 106h5l2 22-4.5 7-4.5-7z","#9b1b22");fp(g,"M48 103L56 134 44 112zM72 103L64 134 76 112z","rgba(0,0,0,.18)")}
  ell(g,39.5,68,3.2,5.5,skin);ell(g,80.5,68,3.2,5.5,skin);ell(g,60,66,20.5,24.5,skin);
  fp(g,f?"M39 64C39 46 50 39 61 39C73 39 82 47 81 62C74 52 63 49 54 52C47 54 42 58 39 64Z":"M39 63C37 45 48 37 60 37C73 37 84 44 81 63C79 54 74 49 66 48C58 47 50 47 45 51C41 54 40 58 39 63Z",hair);
  const lg=g.createLinearGradient(0,0,120,150);lg.addColorStop(0,"rgba(255,255,255,.22)");lg.addColorStop(.6,"rgba(255,255,255,0)");g.fillStyle=lg;g.fillRect(0,0,120,150);
}
function drawFig(g,x,y,s,shirt,pants,skin,hair){g.save();g.translate(x,y);g.scale(s,s);fp(g,"M-7 0V-16C-7-22-4-25 0-25S7-22 7-16V0Z",shirt);fp(g,"M-6.5 0V-9H6.5V0Z",pants);circ(g,0,-30,5.2,skin);fp(g,"M-5.3-30.5C-5.6-36.5 5.6-36.5 5.3-30.5C3-33.5-3-33.5-5.3-30.5Z",hair);g.restore()}
function drawScene(g,seed,kind,shirt){
  const r=rng(hash(seed)),pick=a=>a[Math.floor(r()*a.length)],hairs=["#1b1411","#261b15","#33251c"];
  if(kind==="stage"){
    let lg=g.createLinearGradient(0,0,0,210);lg.addColorStop(0,"#b81f25");lg.addColorStop(1,"#7d0f13");g.fillStyle=lg;g.fillRect(0,0,320,210);
    const rg=g.createRadialGradient(160,0,0,160,0,260);rg.addColorStop(0,"rgba(255,226,168,.45)");rg.addColorStop(1,"rgba(255,226,168,0)");g.fillStyle=rg;g.fillRect(0,0,320,210);
    g.fillStyle="#7a0d12";g.fillRect(34,14,252,32);g.strokeStyle="#e2bd68";g.lineWidth=1.5;g.strokeRect(34,14,252,32);
    g.fillStyle="#f1d48b";g.fillRect(68,22,184,6);g.fillStyle="rgba(226,189,104,.85)";g.fillRect(100,33,120,4);
    g.fillStyle="#ffd34d";g.fill(starPath(18,30,9));g.fill(starPath(302,30,9));
    g.fillStyle="#5a2e15";g.fillRect(0,118,320,24);g.fillStyle="#8a5228";g.fillRect(0,118,320,3);
    const px=r()<.5?40:246;g.fillStyle="#4a2614";g.fillRect(px,84,34,36);g.fillStyle="#6e3b1e";g.fillRect(px-2,82,38,5);circ(g,px+17,102,6,"#d4ab55");
    const n=2+Math.floor(r()*4);for(let i=0;i<n;i++)drawFig(g,110+i*(100/(n-1))+(r()*8-4),118,1.05,pick(["#f4f1ea","#1d2533","#2a3f63","#f4f1ea"]),"#262b36",pick(SKIN),pick(hairs));
    for(let i=0;i<7;i++)circ(g,70+i*30,121,6.5,pick(["#f2a7bd","#f7d36b","#ffffff","#e9667f"]));
    for(let row=0;row<3;row++){const y=162+row*22,sc=1+row*.2;for(let x=-6+(row%2)*13;x<332;x+=25*sc){g.save();g.translate(x,y);g.scale(sc,sc);ell(g,0,15,12,10,shirt&&r()<.6?shirt:pick(["#f4f1ea","#ece8df","#2a3f63","#1d2533"]));circ(g,0,0,6.5,pick(hairs.concat(["#3d3d3d"])));g.restore()}}
  }else{
    const sport=kind==="sport",bt=sport?56:40,fl=sport?1:3,gy=bt+fl*24+4;
    const lg=g.createLinearGradient(0,0,0,210);lg.addColorStop(0,"#8fc0e6");lg.addColorStop(1,"#e6f1f8");g.fillStyle=lg;g.fillRect(0,0,320,210);
    g.fillStyle="#f0d27e";g.fillRect(24,bt,272,fl*24+4);g.fillStyle="#c9a24c";g.fillRect(20,bt-5,280,6);
    g.fillStyle="#6f8fae";for(let f=0;f<fl;f++)for(let i=0;i<10;i++)g.fillRect(34+i*26,bt+6+f*24,12,12);
    if(!sport){g.fillStyle="#a9171c";g.fillRect(110,18,100,16);g.fillStyle="#f1d48b";g.fillRect(122,24,76,4)}
    if(sport){g.fillStyle="#5e9e48";g.fillRect(0,gy,320,210-gy);g.fillStyle="#69aa52";for(let i=0;i<8;i+=2)g.fillRect(i*40,gy,40,210-gy);
      g.save();g.globalAlpha=.85;g.strokeStyle="#fff";g.lineWidth=2;g.strokeRect(14,gy+12,292,188-gy);g.beginPath();g.moveTo(160,gy+12);g.lineTo(160,200);g.stroke();g.beginPath();g.arc(160,(gy+212)/2,18,0,Math.PI*2);g.stroke();g.restore()}
    else{g.fillStyle="#d9c59c";g.fillRect(0,gy,320,210-gy)}
    for(const tx of [10,310]){g.fillStyle="#6b4423";g.fillRect(tx-2,gy-30,4,30);circ(g,tx,gy-36,16,"#3f7d3a");circ(g,tx+(tx<100?8:-8),gy-28,11,"#57964b")}
    g.fillStyle="#8e8e8e";g.fillRect(58,bt-30,2,gy-bt+30);g.fillStyle="#da251d";g.fillRect(60,bt-30,22,14);g.fillStyle="#ffde00";g.fill(starPath(71,bt-23,4.5));
    if(sport){const ps=[];for(let i=0;i<12;i++){const y=gy+32+r()*(200-gy-32);ps.push([24+r()*272,y,.75+(y-gy)/(210-gy)*.55,i%2?"#c8102e":"#1f5fbf"])}
      ps.sort((a,b)=>a[1]-b[1]).forEach(p=>drawFig(g,p[0],p[1],p[2],p[3],"#f4f1ea",pick(SKIN),pick(hairs)));
      circ(g,100+r()*120,gy+70+r()*30,4,"#fff")}
    else{const main=shirt||"#f4f1ea";for(let row=0;row<3;row++){const y=gy+28+row*28,sc=.95+row*.22;for(let x=14+(row%2)*8;x<310;x+=15*sc){if(r()<.18)continue;drawFig(g,x+r()*4,y,sc,r()<.82?main:pick(["#f4f1ea","#2a3f63","#c8102e"]),pick(["#1d2533","#2a3f63","#262b36"]),pick(SKIN),pick(hairs))}}}
  }
}
const ERAS=[{fl:1,roof:"tile",wall:"#e9dbb8",t:3},{fl:2,roof:"tile",wall:"#efd48a",t:3},{fl:3,roof:"flat",wall:"#f2d37a",t:4,hall:1},{fl:4,roof:"flat",wall:"#f4d16c",t:4,hall:1},{fl:4,roof:"modern",wall:"#f3eee3",t:5,hall:1,solar:1}];
function drawBuilding(g,i){
  const c=ERAS[i],G0=178,fh=26,x0=46,w=230,top=G0-c.fl*fh,glass=c.roof==="modern";
  const lg=g.createLinearGradient(0,0,0,210);lg.addColorStop(0,"#8fbfe4");lg.addColorStop(1,"#eaf3f9");g.fillStyle=lg;g.fillRect(0,0,360,210);
  g.save();g.globalAlpha=.75;fp(g,"M0 150Q60 118 120 138T240 130T360 138V210H0Z","#a6c9a0");g.restore();
  if(c.hall){const hx=x0+w+12;g.fillStyle=c.wall;g.fillRect(hx,G0-44,62,44);fp(g,`M${hx-4} ${G0-44}Q${hx+31} ${G0-70} ${hx+66} ${G0-44}Z`,glass?"#5d7c99":"#b0563a");g.fillStyle="#7d9cb8";for(let k=0;k<3;k++)g.fillRect(hx+10+k*16,G0-34,10,24)}
  g.fillStyle=c.wall;g.fillRect(x0,top,w,G0-top);
  for(let f=0;f<c.fl;f++){const y=top+f*fh;g.fillStyle=glass?"#86b5d9":"#6e8daa";for(let k=0;k<8;k++)g.fillRect(x0+10+k*28,y+6,glass?18:12,13);g.fillStyle="#c99d49";g.fillRect(x0,y+fh-4,w,4)}
  g.fillStyle="#7a4a24";g.fillRect(x0+w/2-11,G0-20,22,20);
  if(c.roof==="tile"){fp(g,`M${x0-12} ${top}H${x0+w+12}L${x0+w-16} ${top-26}H${x0+16}Z`,"#9c4a2c");g.strokeStyle="#7d3820";g.lineWidth=1.5;g.stroke(new Path2D(`M${x0-2} ${top-9}H${x0+w+2}M${x0+8} ${top-18}H${x0+w-8}`))}
  else{g.fillStyle="#d4ab55";g.fillRect(x0-4,top-7,w+8,7);
    if(c.solar){g.strokeStyle="#a9bfd9";g.lineWidth=.8;for(let k=0;k<6;k++){const p=new Path2D(`M${x0+8+k*36} ${top-7}l7-12h24l-7 12z`);g.fillStyle="#24426b";g.fill(p);g.stroke(p)}}
    else{g.fillStyle="#a9171c";g.fillRect(x0+w/2-52,top-25,104,18);g.fillStyle="#f1d48b";g.fillRect(x0+w/2-40,top-18,80,4)}}
  g.fillStyle="#8e8e8e";g.fillRect(x0-26,top-46,2.4,G0-top+46);g.fillStyle="#da251d";g.fillRect(x0-23.6,top-46,24,15);g.fillStyle="#ffde00";g.fill(starPath(x0-11.6,top-38.5,4.8));
  g.fillStyle="#cdb98f";g.fillRect(0,G0,360,210-G0);
  for(let k=0;k<c.t;k++){const tx=14+k*(330/(c.t-1)),rr=8+i*2.2;g.fillStyle="#6b4423";g.fillRect(tx-1.5,G0-6,3,16);circ(g,tx,G0-8-rr*.4,rr,"#3f7d3a");circ(g,tx+rr*.5,G0-4-rr*.3,rr*.7,"#57964b")}
}
function sepia(g,x,y,w,h){g.save();g.globalCompositeOperation="color";g.globalAlpha=.85;g.fillStyle="#7a4a1c";g.fillRect(x,y,w,h);g.restore()}
function drawMedal(g){
  fp(g,"M12 2H48V34L30 46 12 34Z","#c8102e");fp(g,"M22 2h4v38h-4zM34 2h4v38h-4z","#ffd34d");
  const mg=g.createLinearGradient(3,41,57,95);mg.addColorStop(0,"#fff0b8");mg.addColorStop(.5,"#d9a93f");mg.addColorStop(1,"#8a6420");const sp=starPath(30,68,27);g.fillStyle=mg;g.fill(sp);g.strokeStyle="#7a5518";g.lineWidth=.8;g.stroke(sp);
  circ(g,30,68,11,"#c8102e");g.strokeStyle="#f3d27a";g.lineWidth=1.5;g.beginPath();g.arc(30,68,11,0,Math.PI*2);g.stroke();g.fillStyle="#ffd84d";g.fill(starPath(30,68,7));
}
function drawPennant(g){g.fillStyle="#b58a3c";g.fillRect(4,4,72,5);fp(g,"M8 9H72V70L40 93 8 70Z","#c8102e");g.strokeStyle="#f1d48b";g.lineWidth=3;g.stroke(new Path2D("M8 70L40 93 72 70"));g.fillStyle="#ffd84d";g.fill(starPath(40,31,11));g.fillStyle="#f1d48b";g.fillRect(18,49,44,4);g.globalAlpha=.8;g.fillRect(24,57,32,3);g.globalAlpha=1}
function drawCup(g){
  g.fillStyle="#3a1c0d";g.fillRect(16,100,48,16);g.fillStyle="#c9982e";g.fillRect(28,104,24,6);
  const gg=goldGrad(g,10,10,70,90);
  fp(g,"M35 70H45L44 100H36Z",gg);fp(g,"M28 96H52L54 102H26Z",gg);
  g.strokeStyle=gg;g.lineWidth=4;g.stroke(new Path2D("M14 22C2 22 2 46 24 52M66 22C78 22 78 46 56 52"));
  fp(g,"M12 14H68C68 48 56 66 40 72C24 66 12 48 12 14Z",gg);ell(g,40,14,28,4,"#f8e2a2");
  g.fillStyle="#c8102e";g.fill(starPath(40,36,9));
}
function drawCertMini(g,W,H,a){
  g.fillStyle="#3a1c0d";g.fillRect(0,0,W,H);g.strokeStyle="#b88c3f";g.lineWidth=3;g.strokeRect(5,5,W-10,H-10);
  g.fillStyle="#f7eedb";g.fillRect(14,14,W-28,H-28);g.strokeStyle="#a9171c";g.lineWidth=3;g.strokeRect(24,24,W-48,H-48);g.lineWidth=1;g.strokeRect(30,30,W-60,H-60);
  circ(g,W/2,H*.27,18,"#c8102e");g.fillStyle="#ffd84d";g.fill(starPath(W/2,H*.27,10));
  const t=/Giấy khen/i.test(a.title)?"GIẤY KHEN":/chuẩn quốc gia/i.test(a.title)?"BẰNG CÔNG NHẬN":"BẰNG KHEN";
  g.fillStyle="#a9171c";g.textAlign="center";let fs=34;g.font=`700 ${fs}px ${TIMES}`;while(g.measureText(t).width>W-90&&fs>16){fs-=2;g.font=`700 ${fs}px ${TIMES}`}g.fillText(t,W/2,H*.56);
  g.fillStyle="#cdb894";g.fillRect(W*.25,H*.66,W*.5,4);g.fillRect(W*.3,H*.74,W*.4,4);
}
const GEN=new Map();
function drawKeepsake(g,type,seed){
  const r=rng(hash(seed)),pick=a=>a[Math.floor(r()*a.length)];
  const lg=g.createLinearGradient(0,0,320,210);lg.addColorStop(0,"#b98f5c");lg.addColorStop(1,"#86603a");g.fillStyle=lg;g.fillRect(0,0,320,210);
  g.strokeStyle="rgba(60,30,10,.16)";g.lineWidth=1;for(let y=6;y<214;y+=13){g.beginPath();g.moveTo(0,y);g.bezierCurveTo(110,y+r()*6-3,210,y+r()*6-3,320,y+r()*4-2);g.stroke()}
  const scrib=(x,y,w,n,col,lh,lw)=>{g.strokeStyle=col;g.lineWidth=lw||1;for(let i=0;i<n;i++){const yy=y+i*lh,ww=w*(.55+r()*.45);g.beginPath();g.moveTo(x,yy);for(let xx=2;xx<ww;xx+=3)g.lineTo(x+xx,yy+Math.sin(xx*.9+i)*1.1);g.stroke()}};
  const photo=(x,y,w,h,s2,kind)=>{g.fillStyle="#fff";g.fillRect(x-3,y-3,w+6,h+6);g.save();g.beginPath();g.rect(x,y,w,h);g.clip();const sc=Math.max(w/320,h/210);g.translate(x+(w-320*sc)/2,y+(h-210*sc)/2);g.scale(sc,sc);drawScene(g,s2,kind,"");g.restore()};
  const shadow=f=>{g.save();g.fillStyle="rgba(0,0,0,.28)";g.translate(5,7);f();g.restore()};
  g.save();
  if(type==="baotuong"){
    g.translate(160,106);g.rotate((r()-.5)*.07);
    shadow(()=>g.fillRect(-134,-92,268,184));g.fillStyle="#f5ead0";g.fillRect(-134,-92,268,184);
    g.fillStyle=pick(["#c8102e","#1f5fbf","#2f8a3c","#8e1418"]);g.fillRect(-122,-82,244,30);
    g.fillStyle="#fff6cf";g.textAlign="center";g.font="700 17px Georgia, 'Times New Roman', serif";g.fillText(pick(["MÙA TRI ÂN","HOA PHƯỢNG ĐỎ","TUỔI HỌC TRÒ","CHÀO 20 – 11","MÁI TRƯỜNG MẾN YÊU"]),0,-61);
    for(let i=0;i<6;i++){circ(g,-112+i*9,-36+(i%2)*5,4.2,"#e9667f");circ(g,-112+i*9,-36+(i%2)*5,1.5,"#ffd34d")}
    scrib(-122,-22,74,9,"#3a2a1a",8);photo(-36,-38,72,52,seed+"p","outdoor");scrib(-36,26,72,5,"#3a2a1a",8);scrib(46,-38,76,12,"#1f3d66",8);
    circ(g,98,66,9,"#f7c948");g.strokeStyle="#f7c948";g.lineWidth=2;for(let i=0;i<8;i++){const a=i*Math.PI/4;g.beginPath();g.moveTo(98+Math.cos(a)*12,66+Math.sin(a)*12);g.lineTo(98+Math.cos(a)*17,66+Math.sin(a)*17);g.stroke()}
    g.fillStyle="rgba(255,250,225,.65)";g.fillRect(-146,-98,34,12);g.fillRect(112,-98,34,12);
  }else if(type==="kyvat"){
    const jersey=/-j$/.test(seed),col=jersey?"#c8102e":"#f4f1ea";
    g.translate(160,112);g.rotate((r()-.5)*.08);
    const shirt=new Path2D("M-66 -74L-28 -86Q0 -74 28 -86L66 -74L104 -32L80 -14L64 -34V86H-64V-34L-80 -14L-104 -32Z");
    shadow(()=>g.fill(shirt));g.fillStyle=col;g.fill(shirt);g.strokeStyle="rgba(0,0,0,.18)";g.lineWidth=1;g.stroke(shirt);
    if(jersey){g.fillStyle="#ffd34d";g.fillRect(-64,-24,128,6);g.fillStyle="#fff";g.font="700 64px Georgia, serif";g.textAlign="center";g.fillText(String(1+Math.floor(r()*12)),0,44)}
    else{fp(g,"M-28 -86L-12 -58L0 -76L12 -58L28 -86Q0 -74 -28 -86Z","#e7e1d3");g.strokeStyle="rgba(0,0,0,.2)";g.beginPath();g.moveTo(0,-74);g.lineTo(0,86);g.stroke();for(let i=0;i<5;i++)circ(g,5,-52+i*26,2.4,"#d0c9b8");g.strokeRect(-50,-44,28,30);circ(g,-36,-34,6,"#c8102e");g.fillStyle="#ffd34d";g.fill(starPath(-36,-34,3.2));
      for(let i=0;i<10;i++){g.save();g.translate(-56+r()*100,-8+r()*84);g.rotate((r()-.5)*.6);scrib(0,0,22+r()*22,1,pick(["#1f3d66","#1b1411","#8e1418"]),0,1.4);g.restore()}}
  }else if(type==="luubut"){
    g.translate(160,106);g.rotate((r()-.5)*.05);
    shadow(()=>g.fillRect(-140,-88,280,176));g.fillStyle="#7a2a1a";g.fillRect(-144,-92,288,184);
    g.fillStyle="#fbf6e6";g.fillRect(-136,-84,134,168);g.fillRect(2,-84,134,168);
    const fold=g.createLinearGradient(-20,0,20,0);fold.addColorStop(0,"rgba(0,0,0,0)");fold.addColorStop(.5,"rgba(0,0,0,.22)");fold.addColorStop(1,"rgba(0,0,0,0)");g.fillStyle=fold;g.fillRect(-20,-84,40,168);
    g.strokeStyle="rgba(80,120,170,.35)";g.lineWidth=.8;for(let y=-66;y<80;y+=11){g.beginPath();g.moveTo(-130,y);g.lineTo(-8,y);g.moveTo(8,y);g.lineTo(130,y);g.stroke()}
    scrib(-124,-70,108,13,"#1f3d66",11,1.2);photo(26,-72,64,46,seed+"q","outdoor");scrib(14,-8,110,7,"#1f3d66",11,1.2);
    for(let i=0;i<5;i++){g.save();g.translate(104,58);g.rotate(i*Math.PI*2/5+r()*.3);ell(g,0,-9,6,10,i===0?"#f6c343":"#d7261e");g.restore()}circ(g,104,58,3,"#7a2a1a");
  }else{
    g.translate(160,106);g.rotate((r()-.5)*.06);const card=/-card$/.test(seed),W2=236,H2=150;
    shadow(()=>g.fillRect(-W2/2,-H2/2,W2,H2));g.fillStyle="#f7efd9";g.fillRect(-W2/2,-H2/2,W2,H2);g.strokeStyle="#a9171c";g.lineWidth=3;g.strokeRect(-W2/2+7,-H2/2+7,W2-14,H2-14);
    g.fillStyle="#a9171c";g.textAlign="center";g.font="700 15px Georgia, serif";g.fillText(card?"THẺ HỌC SINH":"GIẤY KHEN",card?28:0,-H2/2+30);
    if(card){g.save();g.beginPath();g.rect(-W2/2+18,-34,56,72);g.clip();g.translate(-W2/2+18,-34);g.scale(56/120,72/150);drawPortrait(g,seed+"f",r()<.4,0);g.restore();scrib(-20,-20,118,6,"#3a2a1a",11,1.1)}
    else{scrib(-86,-24,172,6,"#3a2a1a",11,1.1)}
    g.globalAlpha=.55;g.strokeStyle="#c8102e";g.lineWidth=2.5;g.beginPath();g.arc(card?76:62,42,20,0,Math.PI*2);g.stroke();g.beginPath();g.arc(card?76:62,42,14,0,Math.PI*2);g.stroke();g.fillStyle="#c8102e";g.fill(starPath(card?76:62,42,7));g.globalAlpha=1;
  }
  g.restore();
}
function drawGen(g,gen,old,x,y,w,h){const bw=gen[0]==="p"?120:gen[0]==="b"?360:320,bh=gen[0]==="p"?150:210,s=Math.max(w/bw,h/bh);g.save();g.beginPath();g.rect(x,y,w,h);g.clip();g.translate(x+(w-bw*s)/2,y+(h-bh*s)/2);g.scale(s,s);if(gen[0]==="p")drawPortrait(g,gen[1],gen[2],gen[3]);else if(gen[0]==="s")drawScene(g,gen[1],gen[2],gen[3]);else if(gen[0]==="k")drawKeepsake(g,gen[1],gen[2]);else drawBuilding(g,gen[1]);g.restore();if(old)sepia(g,x,y,w,h)}
function genURL(gen,old,big){const key=JSON.stringify(gen)+(old?"o":"")+(big?"B":"");if(GEN.has(key))return GEN.get(key);const p=gen[0]==="p",k=big?1:.5,c=mk(Math.round((p?480:960)*k),Math.round((p?600:630)*k));drawGen(c.getContext("2d"),gen,old,0,0,c.width,c.height);const u=c.toDataURL("image/jpeg",.86);GEN.set(key,u);return u}
const NOIMG="data:image/svg+xml;charset=utf-8,"+encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 150"><rect width="120" height="150" fill="#d8c8a8"/><circle cx="60" cy="58" r="22" fill="#b9a27a"/><path d="M18 150c4-34 22-50 42-50s38 16 42 50z" fill="#b9a27a"/></svg>');
const VIDIMG="data:image/svg+xml;charset=utf-8,"+encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 200"><rect width="300" height="200" fill="#2a140b"/><path d="M0 160h300v40H0z" fill="#3a1c0d"/></svg>');
function imgOf(it,big){if(it.imgData)return it.imgData;if(it.img)return "/_blob/"+it.img;if(it.gen)return genURL(it.gen,it.old,big);return NOIMG}
function awardImg(a){if(a.imgData)return a.imgData;if(a.img)return "/_blob/"+a.img;const key="aw:"+a.k+":"+(a.k==="cert"?a.title:"");if(GEN.has(key))return GEN.get(key);let c;
  if(a.k==="cert"){c=mk(424,300);drawCertMini(c.getContext("2d"),424,300,a)}
  else{const m={medal:[60,100],flag:[80,100],cup:[80,120]}[a.k]||[60,100];c=mk(m[0]*4,m[1]*4);const g=c.getContext("2d");g.scale(4,4);a.k==="medal"?drawMedal(g):a.k==="flag"?drawPennant(g):drawCup(g)}
  const u=c.toDataURL();GEN.set(key,u);return u}
export { genURL, awardImg as awardArtURL, NOIMG, VIDIMG, hash, rng }
