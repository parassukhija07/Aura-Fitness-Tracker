/* Active Workout — main app: overview, rest pill, modals, summary, celebration. */
const { useState, useEffect, useRef } = React;
const clone = o => JSON.parse(JSON.stringify(o));
const fmt = s => `${Math.floor(s/60)}:${String(s%60).padStart(2,'0')}`;
const num = v => v === '' || v == null ? 0 : Number(v);

function App() {
  const [wk, setWk] = useState(() => {
    const saved = localStorage.getItem('aura_wk');
    return saved ? JSON.parse(saved) : clone(WORKOUT);
  });
  const [view, setView] = useState('overview');     // overview | exercise | summary
  const [idx, setIdx] = useState(0);
  const [elapsed, setElapsed] = useState(() => Number(localStorage.getItem('aura_elapsed')||1487));
  const [rest, setRest] = useState({ active:false, total:60, left:60, running:true });
  const [pos, setPos] = useState(() => JSON.parse(localStorage.getItem('aura_pill')||'null') || { x: 96, y: 690 });
  const [modal, setModal] = useState(null);          // {kind, exIdx, setIdx}
  const [celeb, setCeleb] = useState(null);
  const drag = useRef(null);

  // persist
  useEffect(()=>{ localStorage.setItem('aura_wk', JSON.stringify(wk)); }, [wk]);
  useEffect(()=>{ localStorage.setItem('aura_elapsed', elapsed); }, [elapsed]);
  useEffect(()=>{ localStorage.setItem('aura_pill', JSON.stringify(pos)); }, [pos]);

  // workout timer
  useEffect(()=>{ if(view==='summary')return; const t=setInterval(()=>setElapsed(e=>e+1),1000); return ()=>clearInterval(t); },[view]);
  // rest timer
  useEffect(()=>{
    if(!rest.active||!rest.running) return;
    const t=setInterval(()=>setRest(r=>{ if(r.left<=1){clearInterval(t);return{...r,active:false,left:0};} return{...r,left:r.left-1};}),1000);
    return ()=>clearInterval(t);
  },[rest.active,rest.running]);

  // celebration auto-dismiss
  useEffect(()=>{ if(celeb){ const t=setTimeout(()=>setCeleb(null),2400); return ()=>clearTimeout(t);} },[celeb]);

  function startRest(total){ setRest({active:true,total,left:total,running:true}); }

  function mutate(fn){ setWk(prev=>{ const w=clone(prev); fn(w); return w; }); }

  // ---- set handlers ----
  const onChange=(setIdx,field,val)=>mutate(w=>{ w.exercises[idx].sets[setIdx][field]=val.replace(/[^0-9.]/g,''); });
  const onToggle=(setIdx,done)=>{
    const ex=wk.exercises[idx]; const s=ex.sets[setIdx];
    mutate(w=>{ w.exercises[idx].sets[setIdx].done=done; });
    if(done){
      // celebration checks
      if(num(s.weight)>ex.lastPR.weight) setCeleb({emoji:'\uD83C\uDFC6',title:'New PR!',msg:`${s.weight} kg beats your ${ex.lastPR.weight} kg best.`});
      else if(num(s.reps)>ex.target.reps && num(s.weight)>=ex.target.weight) setCeleb({emoji:'\uD83D\uDD25',title:'Extra reps!',msg:`${s.reps} reps — above today\u2019s target. Keep it up.`});
      // rest unless final set
      if(setIdx < ex.sets.length-1) startRest(60);
    }
  };
  const onAddSet=()=>{ const ex=wk.exercises[idx]; const last=ex.sets[ex.sets.length-1]||{type:'normal'};
    mutate(w=>{ w.exercises[idx].sets.push({weight:'',reps:'',done:false,type:'normal'}); });
    startRest(60); };
  const onDelete=(setIdx)=>mutate(w=>{ w.exercises[idx].sets.splice(setIdx,1); });
  const onSetNote=(setIdx,val)=>mutate(w=>{ w.exercises[idx].sets[setIdx].note=val; });
  const onPulley=(p)=>mutate(w=>{ w.exercises[idx].pulley=p; });
  const setType=(setIdx,type)=>{ mutate(w=>{ w.exercises[idx].sets[setIdx].type=type; }); setModal(null); };

  const onComplete=()=>{
    const ex=wk.exercises[idx];
    mutate(w=>{ const e=w.exercises[idx];
      e.sets = e.sets.filter(s=>!(s.weight===''&&s.reps===''&&!s.done));
      e.sets.forEach(s=>{ if(s.weight!==''&&s.reps!=='') s.done=true; });
      e.completed=true;
    });
    const doneSets=ex.sets.filter(s=>s.weight!==''&&s.reps!=='').length;
    setCeleb({emoji:'\uD83D\uDCAA',title:'Exercise done',msg:`${doneSets} solid sets logged. On to the next.`});
    startRest(90);
    setView('overview');
  };

  // ---- exercise handlers ----
  const substitute=(opt)=>{ const ei=modal.exIdx; mutate(w=>{ const e=w.exercises[ei];
    e.name=opt.name; e.equipment=opt.equipment; e.isCable=opt.equipment==='Cable'; }); setModal(null); };
  const removeEx=(ei)=>{ mutate(w=>{ w.exercises.splice(ei,1); }); setModal(null); };
  const addEx=(opt)=>{ mutate(w=>{ w.exercises.push({ id:'x'+Date.now(),name:opt.name,muscle:opt.muscle,groups:[opt.muscle],
    equipment:opt.equipment,isCable:opt.equipment==='Cable',repRange:'8–12',planned:3,
    lastPR:{weight:0,reps:0,date:'—'},target:{weight:0,reps:10,note:'First time'},warmup:[],hint:'Focus on controlled form.',pulley:'single',
    sets:[{weight:'',reps:'',done:false,type:'normal'},{weight:'',reps:'',done:false,type:'normal'},{weight:'',reps:'',done:false,type:'normal'}] }); }); setModal(null); };
  const makeSuperset=(ei)=>{ mutate(w=>{ if(w.exercises[ei+1]) w.exercises[ei].superset=true; }); setModal(null); };

  // ---- pill drag ----
  const onPillDown=(e)=>{ const r=e.currentTarget.getBoundingClientRect(); drag.current={dx:e.clientX-r.left,dy:e.clientY-r.top}; e.currentTarget.setPointerCapture(e.pointerId); };
  const onPillMove=(e)=>{ if(!drag.current)return; const phone=e.currentTarget.closest('.phone').getBoundingClientRect();
    let x=e.clientX-phone.left-drag.current.dx, y=e.clientY-phone.top-drag.current.dy;
    x=Math.max(8,Math.min(x,393-200)); y=Math.max(60,Math.min(y,852-70)); setPos({x,y}); };
  const onPillUp=()=>{ drag.current=null; };

  // computed
  const totalSets=wk.exercises.reduce((a,e)=>a+e.sets.length,0);
  const doneSets=wk.exercises.reduce((a,e)=>a+e.sets.filter(s=>s.done).length,0);
  const volume=wk.exercises.reduce((a,e)=>a+e.sets.filter(s=>s.done).reduce((b,s)=>b+num(s.weight)*num(s.reps),0),0);

  // ================= RENDER =================
  if(view==='exercise'){
    return React.createElement(React.Fragment,null,
      React.createElement(ExerciseView,{ ex:wk.exercises[idx], exIdx:idx, onBack:()=>setView('overview'),
        onChange,onToggle,onAddSet,onDelete,onSetNote,onPulley,onComplete,
        onOpenType:(si)=>setModal({kind:'type',setIdx:si}),
        onOpenMenu:(ei)=>setModal({kind:'menu',exIdx:ei}) }),
      restPill(), modalEl(), celebEl()
    );
  }
  if(view==='summary') return React.createElement(React.Fragment,null, summaryEl(), celebEl());

  // ---- OVERVIEW ----
  function overview(){
    return React.createElement('div',{className:'phone','data-theme':'light'},
      React.createElement('div',{className:'dynamic-island'}),
      React.createElement('div',{className:'statusbar auto'}),
      React.createElement('div',{className:'navbar bordered'},
        React.createElement('div',{className:'navbar-row'},
          React.createElement('button',{className:'nav-btn',style:{color:'var(--red)'},onClick:()=>setModal({kind:'end'})},'End'),
          React.createElement('div',{className:'col',style:{alignItems:'center'}},
            React.createElement('div',{className:'tiny muted',style:{fontWeight:700}},wk.name),
            React.createElement('div',{className:'stat-num',style:{fontSize:'19px',color:'var(--accent)'}},fmt(elapsed))),
          React.createElement('button',{className:'nav-icon-btn',onClick:()=>setModal({kind:'add'})},
            React.createElement(Icon,{name:'plus',size:20}))
        )
      ),
      React.createElement('div',{className:'screen-body pad pad-b'},
        React.createElement('div',{className:'between',style:{margin:'14px 4px 4px'}},
          React.createElement('div',{style:{fontWeight:800,fontSize:'15px'}},`${doneSets}/${totalSets} sets`),
          React.createElement('div',{className:'tiny muted'},wk.program)),
        React.createElement('div',{className:'bar',style:{marginBottom:'16px'}},
          React.createElement('i',{style:{width:`${totalSets?doneSets/totalSets*100:0}%`}})),
        wk.exercises.map((e,i)=>{
          const d=e.sets.filter(s=>s.done).length;
          const allDone=e.completed||d===e.sets.length&&d>0;
          return React.createElement('button',{key:e.id,className:'ex-card'+(allDone?' done':''),onClick:()=>{setIdx(i);setView('exercise');}},
            React.createElement('span',{className:'ex-grip'},React.createElement(Icon,{name:'grip',size:18,color:'var(--text-3)'})),
            React.createElement('div',{className:'grow',style:{textAlign:'left'}},
              React.createElement('div',{className:'between'},
                React.createElement('div',{style:{fontWeight:700,fontSize:'16px',letterSpacing:'-.01em'}},e.name),
                allDone&&React.createElement(Icon,{name:'check-c',size:20,color:'var(--green)'})),
              React.createElement('div',{className:'tiny muted',style:{marginTop:'2px'}},
                `${e.sets.length} sets · ${e.repRange} reps · ${e.equipment}`,
                e.superset&&React.createElement('span',{className:'badge badge-accent',style:{marginLeft:'8px',fontSize:'10px',padding:'2px 7px'}},'Superset')),
              React.createElement('div',{className:'mini-bar'},React.createElement('i',{style:{width:`${d/e.sets.length*100}%`}}))
            ));
        }),
        React.createElement('button',{className:'btn btn-tinted',style:{marginTop:'14px'},onClick:()=>setModal({kind:'add'})},
          React.createElement(Icon,{name:'plus',size:18}),' Add Exercise'),
        React.createElement('button',{className:'btn btn-primary',style:{marginTop:'10px'},onClick:()=>setView('summary')},
          React.createElement(Icon,{name:'check',size:19}),' Finish Workout')
      ),
      React.createElement('div',{className:'home-indicator'})
    );
  }

  // ---- REST PILL ----
  function restPill(){
    if(!rest.active) return null;
    const pct=rest.left/rest.total*100;
    return React.createElement('div',{className:'rest-pill',style:{left:pos.x+'px',top:pos.y+'px'},
      onPointerDown:onPillDown,onPointerMove:onPillMove,onPointerUp:onPillUp},
      React.createElement('div',{className:'rest-ring',style:{background:`conic-gradient(var(--accent) ${pct}%, var(--track) 0)`}},
        React.createElement(Icon,{name:'timer',size:16,color:'var(--accent)'})),
      React.createElement('div',{className:'col',style:{lineHeight:1.05}},
        React.createElement('div',{className:'tiny muted',style:{fontWeight:700,fontSize:'10px'}},'REST'),
        React.createElement('div',{className:'stat-num',style:{fontSize:'18px'}},fmt(rest.left))),
      React.createElement('button',{className:'rest-mini',onClick:()=>setRest(r=>({...r,left:r.left+15}))},'+15'),
      React.createElement('button',{className:'rest-mini',onClick:()=>setRest(r=>({...r,running:!r.running}))},
        React.createElement(Icon,{name:rest.running?'pause':'play',size:14})),
      React.createElement('button',{className:'rest-mini',onClick:()=>setRest(r=>({...r,active:false}))},
        React.createElement(Icon,{name:'x',size:14}))
    );
  }

  // ---- CELEBRATION ----
  function celebEl(){ if(!celeb)return null;
    return React.createElement('div',{className:'celeb'},
      React.createElement('div',{className:'celeb-card'},
        React.createElement('div',{style:{fontSize:'46px'}},celeb.emoji),
        React.createElement('div',{style:{fontWeight:800,fontSize:'20px',marginTop:'4px'}},celeb.title),
        React.createElement('div',{className:'tiny muted',style:{marginTop:'4px',maxWidth:'220px',lineHeight:1.4}},celeb.msg)));
  }

  // ---- MODALS ----
  function sheet(title, body, max){
    return React.createElement('div',{className:'sheet'},
      React.createElement('div',{className:'scrim',onClick:()=>setModal(null)}),
      React.createElement('div',{className:'sheet-card',style:{maxHeight:max||'70%'}},
        React.createElement('div',{className:'grabber'}),
        title&&React.createElement('div',{className:'between pad',style:{paddingBottom:'8px'}},
          React.createElement('div',{className:'nav-title'},title),
          React.createElement('button',{className:'nav-icon-btn',onClick:()=>setModal(null)},React.createElement(Icon,{name:'x',size:18}))),
        React.createElement('div',{className:'pad',style:{overflow:'auto',paddingBottom:'26px'}},body)));
  }
  function modalEl(){
    if(!modal) return null;
    if(modal.kind==='type'){
      return sheet('Set type', React.createElement('div',{className:'list'},
        Object.entries(SET_TYPES).filter(([k])=>k!=='warmup').map(([k,v])=>
          React.createElement('button',{key:k,className:'row',style:{width:'100%',background:'var(--surface)',border:0,textAlign:'left'},onClick:()=>setType(modal.setIdx,k)},
            React.createElement('div',{className:'row-ic',style:{background:v.color,width:'28px',height:'28px',fontSize:'12px',fontWeight:800}},v.short||'N'),
            React.createElement('div',{className:'row-main'},React.createElement('div',{className:'row-title'},v.label)),
            React.createElement(Icon,{name:'chevron-right',size:18,color:'var(--text-3)'})))), '58%');
    }
    if(modal.kind==='menu'){
      const ei=modal.exIdx;
      return sheet(null, React.createElement('div',null,
        React.createElement('div',{className:'list'},
          row('swap','var(--blue)','Substitute exercise',()=>setModal({kind:'sub',exIdx:ei})),
          row('add-set','var(--accent)','Create superset with next',()=>makeSuperset(ei)),
          row('plus-c','var(--green)','Add exercise after',()=>setModal({kind:'add'}))),
        React.createElement('div',{className:'list',style:{marginTop:'12px'}},
          row('trash','var(--red)','Remove exercise',()=>removeEx(ei),'var(--red)')),
        React.createElement('button',{className:'btn btn-gray',style:{marginTop:'12px'},onClick:()=>setModal(null)},'Cancel')), '64%');
    }
    if(modal.kind==='sub'){
      return sheet('Substitute', React.createElement('div',{className:'col',style:{gap:'10px'}},
        SUB_OPTIONS.map((o,i)=>React.createElement('button',{key:i,className:'src-card',onClick:()=>substitute(o)},
          React.createElement('div',{className:'ph rounded',style:{width:'46px',height:'46px',flex:'0 0 auto'}}),
          React.createElement('div',{className:'grow',style:{textAlign:'left'}},
            React.createElement('div',{className:'src-t',style:{fontSize:'15px'}},o.name),
            React.createElement('div',{className:'src-s'},`${o.muscle} · ${o.equipment}`)),
          React.createElement(Icon,{name:'swap',size:18,color:'var(--text-3)'})))), '72%');
    }
    if(modal.kind==='add'){
      return sheet('Add exercise', React.createElement('div',null,
        React.createElement('div',{className:'search-box'},React.createElement(Icon,{name:'swap',size:0}),
          React.createElement('input',{placeholder:'Search exercise library…'})),
        React.createElement('div',{className:'col',style:{gap:'10px',marginTop:'12px'}},
          ADD_OPTIONS.map((o,i)=>React.createElement('button',{key:i,className:'src-card',onClick:()=>addEx(o)},
            React.createElement('div',{className:'ph rounded',style:{width:'46px',height:'46px',flex:'0 0 auto'}}),
            React.createElement('div',{className:'grow',style:{textAlign:'left'}},
              React.createElement('div',{className:'src-t',style:{fontSize:'15px'}},o.name),
              React.createElement('div',{className:'src-s'},`${o.muscle} · ${o.equipment}`)),
            React.createElement(Icon,{name:'plus-c',size:20,color:'var(--accent)'}))))), '74%');
    }
    if(modal.kind==='end'){
      return sheet(null, React.createElement('div',null,
        React.createElement('div',{className:'center',style:{margin:'4px 0 16px'}},
          React.createElement('div',{style:{fontWeight:800,fontSize:'18px'}},'End this workout?'),
          React.createElement('div',{className:'tiny muted',style:{marginTop:'4px'}},`${doneSets} of ${totalSets} sets completed · ${fmt(elapsed)}`)),
        React.createElement('button',{className:'btn btn-primary',onClick:()=>{setModal(null);setView('summary');}},'Finish & Save'),
        React.createElement('button',{className:'btn btn-danger',style:{marginTop:'10px'},onClick:()=>{setModal(null);resetAll();}},'Discard Workout'),
        React.createElement('button',{className:'btn btn-gray',style:{marginTop:'10px'},onClick:()=>setModal(null)},'Continue Workout')), '52%');
    }
    return null;
  }
  function row(ic,color,label,onClick,textColor){
    return React.createElement('button',{className:'row',style:{width:'100%',background:'var(--surface)',border:0,textAlign:'left'},onClick},
      React.createElement('div',{className:'row-ic',style:{background:color}},React.createElement(Icon,{name:ic,size:17})),
      React.createElement('div',{className:'row-main'},React.createElement('div',{className:'row-title',style:{color:textColor||'var(--text)'}},label)));
  }

  function resetAll(){ localStorage.removeItem('aura_wk'); localStorage.removeItem('aura_elapsed');
    setWk(clone(WORKOUT)); setElapsed(0); setView('overview'); setIdx(0); setRest({active:false,total:60,left:60,running:true}); }

  // ---- SUMMARY ----
  function summaryEl(){
    const prs=wk.exercises.filter(e=>e.sets.some(s=>num(s.weight)>e.lastPR.weight)).length;
    return React.createElement('div',{className:'phone','data-theme':'light'},
      React.createElement('div',{className:'dynamic-island'}),
      React.createElement('div',{className:'statusbar auto'}),
      React.createElement('div',{className:'screen-body',style:{paddingBottom:'24px'}},
        React.createElement('div',{className:'summary-hero'},
          React.createElement('div',{style:{fontSize:'46px'}},'\uD83D\uDD25'),
          React.createElement('div',{style:{fontWeight:800,fontSize:'26px',letterSpacing:'-.02em',marginTop:'6px'}},'Workout Complete'),
          React.createElement('div',{className:'tiny',style:{opacity:.85,marginTop:'4px'}},`${wk.name} · ${wk.program}`)),
        React.createElement('div',{className:'pad',style:{marginTop:'-26px'}},
          React.createElement('div',{className:'card card-pad',style:{borderRadius:'var(--r-xl)'}},
            React.createElement('div',{className:'sum-grid'},
              stat(fmt(elapsed),'Duration'),stat(doneSets,'Sets'),
              stat(Math.round(volume).toLocaleString(),'Volume (kg)'),stat(prs,'New PRs'))),
          prs>0&&React.createElement('div',{className:'hint-card',style:{marginTop:'14px',background:'var(--accent-soft)',border:'1px solid var(--accent)'}},
            React.createElement(Icon,{name:'trophy',size:20,color:'var(--accent)'}),
            React.createElement('div',null,React.createElement('div',{style:{fontWeight:700,fontSize:'14px'}},`${prs} new personal record${prs>1?'s':''}!`),
              React.createElement('div',{className:'tiny muted'},'Logged to your Progress tab.'))),
          React.createElement('div',{className:'sec-label'},'Exercises'),
          React.createElement('div',{className:'list'},
            wk.exercises.map((e,i)=>{const d=e.sets.filter(s=>s.done).length;
              return React.createElement('div',{key:i,className:'row'},
                React.createElement('div',{className:'row-main'},React.createElement('div',{className:'row-title',style:{fontWeight:600}},e.name),
                  React.createElement('div',{className:'row-sub'},`${d} sets · ${Math.round(e.sets.filter(s=>s.done).reduce((b,s)=>b+num(s.weight)*num(s.reps),0)).toLocaleString()} kg`)),
                React.createElement(Icon,{name:'check-c',size:20,color:'var(--green)'}));})),
          React.createElement('div',{className:'sec-label'},'Session notes'),
          React.createElement('textarea',{className:'notes-area',placeholder:'How did it feel? Anything to remember for next time…'}),
          React.createElement('button',{className:'btn btn-primary',style:{marginTop:'16px'},onClick:resetAll},'Save Workout'),
          React.createElement('button',{className:'btn btn-gray',style:{marginTop:'10px'},onClick:()=>setView('overview')},'Back to workout')
        )),
      React.createElement('div',{className:'home-indicator'}));
  }
  function stat(v,l){ return React.createElement('div',{className:'sum-stat'},
    React.createElement('div',{className:'stat-num',style:{fontSize:'24px'}},v),
    React.createElement('div',{className:'tiny muted',style:{marginTop:'2px'}},l)); }

  return React.createElement(React.Fragment,null, overview(), restPill(), modalEl(), celebEl());
}
ReactDOM.createRoot(document.getElementById('root')).render(React.createElement(App));
