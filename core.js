/* ===== 入国後講習センター 配属計算 共通ロジック ===== */
(function(global){
  'use strict';
  const DOW=['日','月','火','水','木','金','土'];
  const CLASSES=['一般（男）','一般（女）','介護'];
  const TARGET={'一般（男）':176,'一般（女）':176,'介護':180}; // 修了に必要な総時間

  /* ---- 日付ユーティリティ ---- */
  function iso(d){return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');}
  function parseISO(s){const[y,m,d]=s.split('-').map(Number);return new Date(y,m-1,d);}
  function addDays(s,n){const d=parseISO(s);d.setDate(d.getDate()+n);return iso(d);}
  function dowChar(s){return DOW[parseISO(s).getDay()];}
  function fmtJ(s){const d=parseISO(s);return `${d.getFullYear()}年${d.getMonth()+1}月${d.getDate()}日（${DOW[d.getDay()]}）`;}
  function fmtShort(s){const d=parseISO(s);return `${d.getMonth()+1}/${d.getDate()}`;}

  /* ---- 祝日 ---- */
  const holidayCache={};
  function jpHolidays(year){
    if(holidayCache[year])return holidayCache[year];
    const H={}; const k=(m,d)=>`${year}-${String(m).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
    const nthMon=(m,n)=>{let c=0;for(let day=1;day<=31;day++){const dt=new Date(year,m-1,day);if(dt.getMonth()!==m-1)break;if(dt.getDay()===1){c++;if(c===n)return day;}}};
    H[k(1,1)]='元日'; H[k(1,nthMon(1,2))]='成人の日'; H[k(2,11)]='建国記念の日'; H[k(2,23)]='天皇誕生日';
    H[k(3,Math.floor(20.8431+0.242194*(year-1980)-Math.floor((year-1980)/4)))]='春分の日';
    H[k(4,29)]='昭和の日'; H[k(5,3)]='憲法記念日'; H[k(5,4)]='みどりの日'; H[k(5,5)]='こどもの日';
    H[k(7,nthMon(7,3))]='海の日'; H[k(8,11)]='山の日'; H[k(9,nthMon(9,3))]='敬老の日';
    H[k(9,Math.floor(23.2488+0.242194*(year-1980)-Math.floor((year-1980)/4)))]='秋分の日';
    H[k(10,nthMon(10,2))]='スポーツの日'; H[k(11,3)]='文化の日'; H[k(11,23)]='勤労感謝の日';
    for(let m=1;m<=12;m++)for(let day=1;day<=31;day++){const dt=new Date(year,m-1,day);if(dt.getMonth()!==m-1)continue;const key=iso(dt);if(H[key])continue;if(dt.getDay()===0)continue;if(H[addDays(key,-1)]&&H[addDays(key,1)])H[key]='国民の休日';}
    const adds={};for(const key of Object.keys(H)){const d=parseISO(key);if(d.getDay()===0){let nx=addDays(key,1);while(H[nx]||adds[nx])nx=addDays(nx,1);adds[nx]='振替休日';}}
    Object.assign(H,adds); holidayCache[year]=H; return H;
  }
  function holidayName(s){return jpHolidays(Number(s.slice(0,4)))[s]||null;}

  /* ---- カレンダー参照 ----
     補講（公式にカウントしない授業）は講習日に数えない。内容='補講'は除外。 */
  function counted(v){return v!=null && v!=='' && v!=='補講';}
  function isClass(cal,s,cls){const r=cal.days[s];if(!r||!r[cls])return false;return counted(r[cls].AM)||counted(r[cls].PM);}
  function isHoceka(cal,s,cls){const r=cal.days[s];if(!r||!r[cls])return false;return r[cls].AM==='補講'||r[cls].PM==='補講';}
  function subjects(cal,s,cls){const r=cal.days[s];if(!r||!r[cls])return{AM:null,PM:null};return r[cls];}
  function classDays(cal,cls){return Object.keys(cal.days).filter(s=>isClass(cal,s,cls)).sort();}

  /* ---- 中核：修了日・配属可能日の計算 ----
     entry: 'YYYY-MM-DD'  ampm:'AM'|'PM'
     ルール：
       入国が午前 かつ その日に講習あり → 初日4時間（午後の部）
       入国が午後 または 講習なし日     → 初日0時間（その日はカウントせず）、翌講習日から8時間
       以降の講習日は8時間ずつ加算。残りが4時間になったら最終日は4時間（午前で終了）。
       最終日が8時間 → 翌日午前から配属可能 ／ 最終日が4時間 → 当日午後から配属可能
  */
  function compute(cal,cls,entry,ampm){
    const target=TARGET[cls];
    const days=classDays(cal,cls);
    if(!days.length) return {ok:false,reason:'no_calendar'};
    const entryClass=isClass(cal,entry,cls);
    let startIdx, firstH;
    if(entryClass && ampm==='AM'){
      startIdx=days.indexOf(entry); firstH=4;
    }else{
      const after=days.find(d=>d>entry);
      if(!after) return {ok:false,reason:'short'};
      startIdx=days.indexOf(after); firstH=8;
    }
    let rem=target; const used=[]; let grad=null, gradH=null;
    for(let i=startIdx;i<days.length;i++){
      const h=(i===startIdx)?firstH:8;
      const u=Math.min(h,rem); rem-=u;
      used.push({date:days[i],hours:u,session:(u===4 ? (i===startIdx?'PM':'AM') : 'FULL')});
      if(rem<=0){grad=days[i]; gradH=u; break;}
    }
    if(grad===null) return {ok:false,reason:'short',
      reached: target-rem, used};
    const assignDay = gradH===8 ? addDays(grad,1) : grad;
    const assignAP  = gradH===8 ? '午前' : '午後';
    return {ok:true,target,firstH,used,grad,gradH,assignDay,assignAP,
      classDayCount:used.length, totalHours:target,
      entryContributes: (entryClass&&ampm==='AM')};
  }

  /* ---- 日程表（休講日を含む全日）を組み立て ---- */
  function buildSchedule(cal,cls,entry,res){
    // 入国日 〜 配属可能日 の全暦日を行にする
    const rows=[]; const usedMap={};
    res.used.forEach(u=>usedMap[u.date]=u);
    const end=res.assignDay;
    let cum=0;
    for(let d=entry; d<=end; d=addDays(d,1)){
      const u=usedMap[d];
      const hol=holidayName(d);
      const w=parseISO(d).getDay();
      let row={date:d, dow:dowChar(d), weekend:(w===0||w===6), holiday:hol,
               isEntry:(d===entry), isGrad:(d===res.grad), isAssign:(d===res.assignDay)};
      if(u){
        cum+=u.hours;
        const sub=subjects(cal,d,cls);
        row.hours=u.hours; row.cum=cum; row.session=u.session;
        if(u.session==='AM') row.subject=sub.AM||sub.PM||'';
        else if(u.session==='PM') row.subject=sub.PM||sub.AM||'';
        else row.subject=[sub.AM,sub.PM].filter(Boolean).join(' / ');
      }else{
        row.hours=0; row.cum=cum;
        row.subject = hol ? hol : (row.weekend ? (w===6?'土曜・休講':'日曜・休講') : '休講');
        row.rest=true;
      }
      rows.push(row);
    }
    return rows;
  }

  global.KoshuCore={DOW,CLASSES,TARGET,iso,parseISO,addDays,dowChar,fmtJ,fmtShort,
    jpHolidays,holidayName,counted,isClass,isHoceka,subjects,classDays,compute,buildSchedule};
})(window);
