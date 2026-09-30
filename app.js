(() => {
  'use strict';
  const DATA = window.HW_DATA;
  const app = document.getElementById('app');
  const modal = document.getElementById('modal');
  const modalContent = document.getElementById('modalContent');
  const importFile = document.getElementById('importFile');
  const STORAGE_KEY = 'hearWrite.progress.v1';
  const SETTINGS_KEY = 'hearWrite.settings.v1';

  const state = {
    view:'home', grade:null, section:null, topic:null, level:null,
    session:null, voices:[],
    settings: loadJSON(SETTINGS_KEY, {voice:'', grade1Rate:.72, grade5Rate:.82, grade7Rate:.88, sessionSize:10})
  };

  function defaultProgress(){
    return {version:2, grade1:{attempts:0,correct:0,sessions:0,categories:{}}, grade5:{attempts:0,correct:0,sessions:0,categories:{}}, grade7:{attempts:0,correct:0,sessions:0,categories:{}}, mistakes:{grade1:{},grade5:{},grade7:{}}};
  }
  let progress = Object.assign(defaultProgress(), loadJSON(STORAGE_KEY, {}));
  progress.grade1 = Object.assign(defaultProgress().grade1, progress.grade1||{});
  progress.grade5 = Object.assign(defaultProgress().grade5, progress.grade5||{});
  progress.grade7 = Object.assign(defaultProgress().grade7, progress.grade7||{});
  progress.mistakes = Object.assign({grade1:{},grade5:{},grade7:{}}, progress.mistakes||{});

  function loadJSON(key,fallback){try{return JSON.parse(localStorage.getItem(key))||fallback}catch{return fallback}}
  function save(){localStorage.setItem(STORAGE_KEY,JSON.stringify(progress));localStorage.setItem(SETTINGS_KEY,JSON.stringify(state.settings))}
  function esc(s=''){return String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
  function dec(s=''){try{return decodeURIComponent(s)}catch{return s}}
  function shuffle(a){const out=[...a];for(let i=out.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[out[i],out[j]]=[out[j],out[i]]}return out}
  function pct(a,b){return b?Math.round((a/b)*100):0}
  function normalize(s){return String(s).toLowerCase().replace(/[’]/g,"'").replace(/[^a-z0-9' ]/g,' ').replace(/\s+/g,' ').trim()}
  function gradeKey(){return `grade${state.grade}`}
  function categoryKey(meta){return `${meta.section}::${meta.topic}${meta.level?`::${meta.level}`:''}`}

  function setView(view){state.view=view;render();window.scrollTo({top:0,behavior:'smooth'});setTimeout(()=>app.focus({preventScroll:true}),0)}
  function home(){speechSynthesis.cancel();state.grade=null;state.section=null;state.topic=null;state.level=null;state.session=null;setView('home')}

  function render(){
    if(state.view==='home') return renderHome();
    if(state.view==='dashboard') return renderDashboard();
    if(state.view==='section') return renderSection();
    if(state.view==='topic') return renderTopic();
    if(state.view==='practice') return renderPractice();
    if(state.view==='complete') return renderComplete();
  }

  function renderHome(){
    const p1=progress.grade1,p5=progress.grade5,p7=progress.grade7;
    app.innerHTML=`
      <section class="hero">
        <div>
          <div class="kicker">Hearly · Listen. Write. Grow.</div>
          <h1>English practice that grows with them.</h1>
          <p>Three school-aligned paths: playful foundations for Grade 1, strong core English for Grade 5, and structured vocabulary, grammar and dictation for Grade 7.</p>
          <div class="hero-actions">
            <a class="world-game-button" href="https://ziraddingulumjanly.github.io/Alps/" target="_blank" rel="noopener noreferrer" aria-label="Play the World Map Game in a new tab">
              <span class="mini-map" aria-hidden="true">🌍</span>
              <span><strong>Play World Map Game</strong><small>Bonus geography game · opens in a new tab</small></span>
              <b aria-hidden="true">↗</b>
            </a>
          </div>
        </div>
        <aside class="hero-note">
          <strong>Private by design.</strong>
          <p>No account, no database and no analytics. Mistakes and progress stay in this browser on this device unless you export them yourself.</p>
        </aside>
      </section>
      <section class="grid grade-grid">
        ${gradeCard(1,'Grade 1','Words → combinations → tiny sentences','A school-aligned starter path with extra vocabulary packs.',p1,'primary')}
        ${gradeCard(5,'Grade 5','Vocabulary → patterns → grammar','A bridge level built around the Grade 5 school book and everyday English.',p5,'middle')}
        ${gradeCard(7,'Grade 7','Vocabulary → grammar → real dictation','Starts easy, then builds toward the structures used in the school book.',p7,'secondary')}
      </section>`;
  }

  function gradeCard(g,title,subtitle,desc,p,cls){
    const accuracy=pct(p.correct,p.attempts);
    return `<article class="card grade-card ${cls} clickable" data-action="choose-grade" data-grade="${g}">
      <span class="number">${g}</span><div class="card-icon">${g===1?'Aa':g===5?'5':'7'}</div>
      <h2>${title}</h2><p><strong>${subtitle}</strong><br>${desc}</p>
      <div class="badge-row"><span class="badge local">Local progress</span>${p.attempts?`<span class="badge practice">${accuracy}% accuracy</span>`:''}</div>
      <span class="card-arrow">Open →</span>
    </article>`;
  }
    function tone(index){
    return ['sun','sky','violet','mint','coral','aqua','rose','peach'][index % 8];
  }

  function renderDashboard(){
    const g=state.grade, d=DATA[`grade${g}`], p=progress[gradeKey()];
    const mistakes=Object.keys(progress.mistakes[gradeKey()]||{}).length;
    let cards='';
    if(g===1){
      cards+=dashCard('School path','8 textbook-aligned topics','Numbers, feelings, school, colours, clothes, body, family and animals.','▦','school','sun');
      cards+=dashCard('Extra words','5 bonus vocabulary packs','Fruits, home, food, transport and toys for extra listening practice.','＋','extra','mint');
      cards+=dashCard('My mistakes', mistakes?`${mistakes} items to revisit`:'Nothing saved yet','Missed words and sentences return here for focused practice.','↺','mistakes','coral');
    }else if(g===5){
      cards+=dashCard('Vocabulary','12 Grade 5 word groups','School objects, personal details, countries, home, family, routines, clothes, sports and more.','Aa','vocabulary','sky');
      cards+=dashCard('Basic sentences','Gentle dictation first','Very short sentences, questions, classroom English and daily routines.','1','basics','sun');
      cards+=dashCard('Grammar','9 core grammar sets','To be, possessives, there is/are, have/has, present simple, present continuous, can and more.','⌁','grammar','violet');
      cards+=dashCard('School units','8 textbook-aligned themes','Who Am I, English Everywhere, Home, Family, Daily Life, School, Clothes and Sports.','▦','schoolTopics','mint');
      cards+=dashCard('My mistakes', mistakes?`${mistakes} items to revisit`:'Nothing saved yet','Practise the words and sentences that need more repetition.','↺','mistakes','coral');
    }else{
      cards+=dashCard('Vocabulary','8 useful word groups','Nouns, verbs, adjectives, adverbs, pronouns, prepositions, conjunctions and more.','Aa','vocabulary','sky');
      cards+=dashCard('Basic sentences','Start here if dictation feels hard','Short, clear patterns before grammar-focused practice.','1','basics','sun');
      cards+=dashCard('Grammar','12 focused listening sets','Tenses, used to, too/enough, conditionals, tag questions and more.','⌁','grammar','violet');
      cards+=dashCard('School topics','6 textbook-aligned themes','Schools, technology, talent, travel, friendship and the future.','▦','schoolTopics','mint');
      cards+=dashCard('My mistakes', mistakes?`${mistakes} items to revisit`:'Nothing saved yet','Practise the items that have caused trouble most often.','↺','mistakes','coral');
    }
    app.innerHTML=`
      ${crumb(`<button data-action="home">Home</button><span class="crumb-sep">/</span><span>Grade ${g}</span>`)}
      <div class="section-head"><div><div class="kicker">${d.title}</div><h1>${esc(d.subtitle)}</h1><p>${g===1?'The main path follows the level and core themes of the Grade 1 book, while the bonus packs add gentle extra vocabulary.':g===5?'This path follows the Grade 5 book’s vocabulary and grammar progression, with extra listening and spelling practice around every unit.':'The school book sets the difficulty and grammar map; this site adds much more listening and spelling repetition around it.'}</p></div></div>
      <div class="badge-row" style="margin-bottom:22px"><span class="badge school">School-book aligned</span><span class="badge local">Stored on this device</span>${p.attempts?`<span class="badge practice">${p.correct}/${p.attempts} correct overall</span>`:''}</div>
      <section class="grid card-grid">${cards}</section>`;
  }

  function dashCard(title,meta,desc,icon,section,accent){
    return `<article class="card clickable section-card tone-${accent}" data-action="open-section" data-section="${section}"><div class="card-icon">${icon}</div><h3>${title}</h3><div class="card-meta">${meta}</div><p>${desc}</p><span class="card-arrow">Open →</span></article>`;
  }

  function renderSection(){
    if(state.section==='mistakes') return renderMistakesSection();
    const g=state.grade;
    let title='',sub='',source={},back='dashboard';
    if(g===1 && state.section==='school'){title='School path';sub='Each topic moves from single words to short combinations and then tiny sentences.';source=DATA.grade1.schoolTopics}
    if(g===1 && state.section==='extra'){title='Extra vocabulary';sub='Useful everyday words beyond the core school units.';source=DATA.grade1.extraTopics}
    if(g===5 && state.section==='vocabulary'){title='Vocabulary';sub='Grade 5 vocabulary grouped by the themes and language areas used in the school course.';source=DATA.grade5.vocabulary}
    if(g===5 && state.section==='basics'){title='Basic sentences';sub='Short and friendly dictation before grammar-focused practice.';source=DATA.grade5.basics}
    if(g===5 && state.section==='grammar'){title='Grammar listening';sub='Core Grade 5 structures practised through clear, age-appropriate sentences.';source=DATA.grade5.grammar}
    if(g===5 && state.section==='schoolTopics'){title='School units';sub='Practice the eight main themes used across the Grade 5 textbook.';source=DATA.grade5.schoolTopics}
    if(g===7 && state.section==='vocabulary'){title='Vocabulary';sub='Hear and spell useful Grade 7 words by language category.';source=DATA.grade7.vocabulary}
    if(g===7 && state.section==='basics'){title='Basic sentences';sub='Short dictation before the more demanding grammar sets.';source=DATA.grade7.basics}
    if(g===7 && state.section==='grammar'){title='Grammar listening';sub='Focused sentence sets based on the grammar level used in the Grade 7 course.';source=DATA.grade7.grammar}
    if(g===7 && state.section==='schoolTopics'){title='School topics';sub='Practice the six themes used across the Grade 7 textbook.';source=DATA.grade7.schoolTopics}
    const cards=Object.entries(source).map(([name,obj],idx)=>{
      const n=(obj.words?.length||0)+(obj.sentences?.length||0)+(obj.phrases?.length||0);
      const cstat=progress[gradeKey()].categories[`${state.section}::${name}`];
      const accent=obj.accent || tone(idx);
      return `<article class="card topic-card clickable tone-${accent}" data-action="open-topic" data-topic="${encodeURIComponent(name)}">
        <div class="card-icon" ${obj.color?`style="background:${obj.color}"`:''}>${esc(obj.icon||'•')}</div>
        <h3>${esc(name)}</h3>${obj.unit?`<div class="card-meta">${esc(obj.unit)} · ${n} practice items</div>`:`<div class="card-meta">${n} practice items</div>`}
        ${obj.note?`<p>${esc(obj.note)}</p>`:''}
        ${cstat?.attempts?`<div class="badge-row"><span class="badge practice">${pct(cstat.correct,cstat.attempts)}% accuracy</span></div>`:''}
        <span class="card-arrow">Open →</span>
      </article>`
    }).join('');
    app.innerHTML=`${crumb(`<button data-action="dashboard">Grade ${g}</button><span class="crumb-sep">/</span><span>${esc(title)}</span>`)}
      <div class="section-head"><div><div class="kicker">Grade ${g}</div><h1>${esc(title)}</h1><p>${esc(sub)}</p></div></div>
      <section class="grid card-grid">${cards}</section>`;
  }

  function renderTopic(){
    const g=state.grade, name=state.topic;
    const obj=getTopicObject();
    if(!obj){state.view='dashboard';return renderDashboard()}
    let modes=[];
    if(g===1){
      if(obj.words?.length)modes.push({id:'words',title:'1 · Words',desc:'Single-word listening and spelling.',count:obj.words.length,icon:'Aa'});
      if(obj.phrases?.length)modes.push({id:'phrases',title:'2 · Build',desc:'Two-word combinations and short phrases.',count:obj.phrases.length,icon:'＋'});
      if(obj.sentences?.length)modes.push({id:'sentences',title:'3 · Tiny sentences',desc:'Short school-level sentence dictation.',count:obj.sentences.length,icon:'→'});
      if(obj.words?.length && obj.phrases?.length && obj.sentences?.length)modes.push({id:'mixed',title:'Mix it up',desc:'A little of every level in this topic.',count:obj.words.length+obj.phrases.length+obj.sentences.length,icon:'↗'});
    }else{
      if(state.section==='vocabulary') modes=[{id:'words',title:'Word practice',desc:'Hear one word or expression and spell it.',count:obj.words.length,icon:'Aa'}];
      else if(state.section==='schoolTopics'){
        modes=[{id:'words',title:'Topic vocabulary',desc:'Start with the important words.',count:obj.words.length,icon:'Aa'},{id:'sentences',title:'Topic sentences',desc:'Use those ideas in natural dictation.',count:obj.sentences.length,icon:'→'},{id:'mixed',title:'Mixed practice',desc:'Vocabulary and sentences together.',count:obj.words.length+obj.sentences.length,icon:'↗'}]
      } else modes=[{id:'sentences',title:'Start practice',desc:obj.note||'Focused sentence dictation.',count:obj.sentences.length,icon:'▶'}];
    }
    app.innerHTML=`${crumb(`<button data-action="dashboard">Grade ${g}</button><span class="crumb-sep">/</span><button data-action="back-section">${esc(sectionTitle())}</button><span class="crumb-sep">/</span><span>${esc(name)}</span>`)}
      <div class="section-head"><div><div class="kicker">${esc(obj.unit||`Grade ${g}`)}</div><h1>${esc(name)}</h1><p>${g===1?'Start with the easiest layer and move up when it feels comfortable.':obj.note?`Focus: ${esc(obj.note)}.`:'Choose the kind of practice you want.'}</p></div></div>
      <section class="grid card-grid">${modes.map((m,idx)=>`<article class="card clickable mode-card tone-${tone(idx)}" data-action="start-mode" data-level="${m.id}"><div class="card-icon">${m.icon}</div><h3>${m.title}</h3><div class="card-meta">${m.count} available items</div><p>${m.desc}</p><span class="card-arrow">Start →</span></article>`).join('')}</section>`;
  }

  function sectionTitle(){
    return ({school:'School path',extra:'Extra vocabulary',vocabulary:'Vocabulary',basics:'Basic sentences',grammar:'Grammar',schoolTopics:'School topics',mistakes:'My mistakes'})[state.section]||'Practice';
  }
  function getTopicObject(){
    if(state.grade===1) return (state.section==='school'?DATA.grade1.schoolTopics:DATA.grade1.extraTopics)[state.topic];
    return DATA[`grade${state.grade}`]?.[state.section]?.[state.topic];
  }

  function startSession(level, customItems=null, metaOverride=null){
    speechSynthesis.cancel();
    const obj=getTopicObject();
    let pool=[];
    if(customItems) pool=customItems;
    else if(level==='words') pool=(obj.words||[]).map(text=>({text,kind:'word'}));
    else if(level==='phrases') pool=(obj.phrases||[]).map(text=>({text,kind:'phrase'}));
    else if(level==='sentences') pool=(obj.sentences||[]).map(text=>({text,kind:'sentence'}));
    else if(level==='mixed') pool=[...(obj.words||[]).map(text=>({text,kind:'word'})),...(obj.phrases||[]).map(text=>({text,kind:'phrase'})),...(obj.sentences||[]).map(text=>({text,kind:'sentence'}))];
    const size=Math.min(Number(state.settings.sessionSize)||10,pool.length);
    const items=shuffle(pool).slice(0,size);
    state.level=level;
    state.session={items,index:0,correct:0,attempts:0,answered:false,feedback:null,startedAt:Date.now(),meta:metaOverride||{section:state.section,topic:state.topic,level},mistakeMode:!!metaOverride?.mistakeMode};
    setView('practice');
    setTimeout(speakCurrent,260);
  }

  function renderPractice(){
    const s=state.session,item=s.items[s.index],g=state.grade;
    const rate=g===1?state.settings.grade1Rate:g===5?state.settings.grade5Rate:state.settings.grade7Rate;
    const accuracy=pct(s.correct,s.attempts);
    app.innerHTML=`
      ${crumb(`<button data-action="exit-practice">${s.mistakeMode?'My mistakes':esc(state.topic)}</button><span class="crumb-sep">/</span><span>Practice</span>`)}
      <div class="practice-layout">
        <section class="practice-card">
          <div class="practice-top"><span class="practice-label">${esc(s.mistakeMode?'Mistake review':`${sectionTitle()} · ${state.topic}`)}</span><span class="counter">${s.index+1} / ${s.items.length}</span></div>
          <div class="progress-track"><i style="width:${Math.round((s.index/s.items.length)*100)}%"></i></div>
          <button class="listen-button" data-action="speak"><span class="listen-dot">▶</span><span>${g===1?'Listen':'Play audio'}</span></button>
          <div class="control-row">
            <button class="chip-button ${rate<=.74?'active':''}" data-action="rate" data-rate=".70">Slow</button>
            <button class="chip-button ${rate>.74&&rate<.97?'active':''}" data-action="rate" data-rate=".88">Normal</button>
            <button class="chip-button ${rate>=.97?'active':''}" data-action="rate" data-rate="1.02">Fast</button>
            <button class="chip-button" data-action="speak">↻ Repeat</button>
          </div>
          <label class="answer-label" for="answerInput">Type what you hear</label>
          <input id="answerInput" class="answer-input" autocomplete="off" autocapitalize="sentences" spellcheck="false" placeholder="${g===1?'Type here…':'Type the word or sentence…'}" ${s.answered?'disabled':''} value="${s.feedback?esc(s.feedback.input):''}" />
          ${s.answered?renderFeedback(s.feedback):`<button class="primary-button full" style="margin-top:12px" data-action="check">Check answer</button>`}
        </section>
        <aside class="side-panel">
          <div class="side-card"><h3>This session</h3>${statRow('Correct',`${s.correct}/${s.attempts||0}`)}${statRow('Accuracy',s.attempts?`${accuracy}%`:'—')}${statRow('Remaining',String(s.items.length-s.index-1))}</div>
          <div class="side-card"><h3>${g===1?'Gentle scoring':'What counts as correct?'}</h3><p>${g===1?'Capital letters and punctuation are not used to mark listening wrong. The important thing is hearing and spelling the words correctly.':'Capitalization and punctuation are ignored for the listening score. Word choice and spelling must match the audio.'}</p></div>
          <div class="side-card"><h3>Private progress</h3><p>This answer is checked in your browser. Nothing is sent to a server.</p></div>
        </aside>
      </div>`;
    const input=document.getElementById('answerInput');
    if(input && !s.answered){input.focus();input.addEventListener('keydown',e=>{if(e.key==='Enter')checkAnswer()})}
  }

  function statRow(a,b){return `<div class="stat-row"><span>${a}</span><b>${b}</b></div>`}

  function renderFeedback(f){
    let cls=f.ok?'success':(f.distance<=1?'near':'error');
    let title=f.ok?'✓ Correct':(f.distance<=1?'Almost there':'Have another look');
    const diff=f.ok?'':renderTokenDiff(f.input,f.target);
    return `<div class="feedback ${cls}"><div class="feedback-title">${title}</div>
      ${f.ok?`<p>You heard it correctly.</p>`:`<p>Listen once more, then compare your answer with the correct version.</p>`}
      <div class="answer-compare"><div class="compare-line"><small>Your answer</small>${esc(f.input)}</div><div class="compare-line"><small>Correct answer</small><strong>${esc(f.target)}</strong></div></div>
      ${diff}
      <div class="button-row"><button class="secondary-button" data-action="speak">🔊 Hear again</button><button class="primary-button" data-action="next">${state.session.index===state.session.items.length-1?'Finish':'Next →'}</button></div>
    </div>`;
  }

  function tokenDistance(a,b){
    const A=normalize(a).split(' ').filter(Boolean),B=normalize(b).split(' ').filter(Boolean);
    const dp=Array.from({length:A.length+1},()=>Array(B.length+1).fill(0));
    for(let i=0;i<=A.length;i++)dp[i][0]=i;for(let j=0;j<=B.length;j++)dp[0][j]=j;
    for(let i=1;i<=A.length;i++)for(let j=1;j<=B.length;j++)dp[i][j]=Math.min(dp[i-1][j]+1,dp[i][j-1]+1,dp[i-1][j-1]+(A[i-1]===B[j-1]?0:1));
    return dp[A.length][B.length];
  }

  function renderTokenDiff(input,target){
    const A=normalize(input).split(' ').filter(Boolean),B=normalize(target).split(' ').filter(Boolean);
    const dp=Array.from({length:A.length+1},()=>Array(B.length+1).fill(0));
    for(let i=0;i<=A.length;i++)dp[i][0]=i;for(let j=0;j<=B.length;j++)dp[0][j]=j;
    for(let i=1;i<=A.length;i++)for(let j=1;j<=B.length;j++)dp[i][j]=Math.min(dp[i-1][j]+1,dp[i][j-1]+1,dp[i-1][j-1]+(A[i-1]===B[j-1]?0:1));
    let i=A.length,j=B.length,ops=[];
    while(i>0||j>0){
      if(i>0&&j>0&&A[i-1]===B[j-1]){i--;j--;continue}
      if(i>0&&j>0&&dp[i][j]===dp[i-1][j-1]+1){ops.push(`<span class="diff-chip wrong">${esc(A[i-1])} → ${esc(B[j-1])}</span>`);i--;j--;continue}
      if(j>0&&dp[i][j]===dp[i][j-1]+1){ops.push(`<span class="diff-chip missing">missing: ${esc(B[j-1])}</span>`);j--;continue}
      if(i>0){ops.push(`<span class="diff-chip wrong">extra: ${esc(A[i-1])}</span>`);i--}
    }
    return ops.length?`<div class="token-diff">${ops.reverse().join('')}</div>`:'';
  }

  function checkAnswer(){
    const input=document.getElementById('answerInput')?.value.trim(); if(!input) return;
    const s=state.session,item=s.items[s.index],target=item.text;
    const ok=normalize(input)===normalize(target),dist=tokenDistance(input,target);
    s.attempts++; if(ok)s.correct++;
    s.answered=true;s.feedback={input,target,ok,distance:dist};
    recordAttempt(target,ok,item.kind,s.meta);
    renderPractice();
  }

  function recordAttempt(text,ok,kind,meta){
    const gk=gradeKey(),p=progress[gk];p.attempts++;if(ok)p.correct++;
    const ck=categoryKey(meta);p.categories[ck]=p.categories[ck]||{attempts:0,correct:0};p.categories[ck].attempts++;if(ok)p.categories[ck].correct++;
    const key=normalize(text),bag=progress.mistakes[gk];
    if(ok){
      if(bag[key]){bag[key].streak=(bag[key].streak||0)+1;bag[key].lastCorrect=new Date().toISOString();if(bag[key].streak>=3)delete bag[key]}
    }else{
      const old=bag[key]||{text,wrong:0,streak:0,kind,section:meta.section,topic:meta.topic,level:meta.level};old.text=text;old.wrong=(old.wrong||0)+1;old.streak=0;old.lastWrong=new Date().toISOString();old.kind=kind;old.section=meta.section;old.topic=meta.topic;old.level=meta.level;bag[key]=old;
    }
    save();
  }

  function nextItem(){
    const s=state.session;s.index++;s.answered=false;s.feedback=null;
    if(s.index>=s.items.length){progress[gradeKey()].sessions++;save();setView('complete')}else{renderPractice();setTimeout(speakCurrent,220)}
  }

  function speakCurrent(){
    const s=state.session;if(!s)return;speechSynthesis.cancel();
    const u=new SpeechSynthesisUtterance(s.items[s.index].text);u.lang='en-GB';u.rate=state.grade===1?state.settings.grade1Rate:state.grade===5?state.settings.grade5Rate:state.settings.grade7Rate;
    const voice=state.voices.find(v=>v.name===state.settings.voice);if(voice)u.voice=voice;
    speechSynthesis.speak(u);
  }

  function renderComplete(){
    const s=state.session,score=pct(s.correct,s.attempts);
    app.innerHTML=`<section class="complete-card"><div class="complete-mark">✓</div><div class="kicker">Session complete</div><h1>${score>=90?'Excellent work.':score>=70?'Good progress.':'Keep practising.'}</h1><div class="score-big">${s.correct}/${s.attempts}</div><div class="score-label">correct answers · ${score}%</div><p>${s.mistakeMode?'Correct answers build a streak. Difficult items stay in My Mistakes until they are consistently correct.':'Anything missed has been saved locally so it can return in My Mistakes.'}</p><div class="button-row"><button class="secondary-button" data-action="dashboard">Grade ${state.grade} home</button><button class="primary-button" data-action="repeat-session">Practise again</button></div></section>`;
  }

  function renderMistakesSection(){
    const bag=progress.mistakes[gradeKey()]||{},items=Object.values(bag).sort((a,b)=>(b.wrong-(b.streak||0))-(a.wrong-(a.streak||0)));
    app.innerHTML=`${crumb(`<button data-action="dashboard">Grade ${state.grade}</button><span class="crumb-sep">/</span><span>My mistakes</span>`)}
      <div class="section-head"><div><div class="kicker">Personal review</div><h1>My mistakes</h1><p>Items you miss are saved only on this device. Getting an item right repeatedly increases its streak and eventually removes it from this list.</p></div></div>
      ${items.length?`<div class="notice">Review priority is based on how often an item was missed and how many times it has since been answered correctly.</div><div class="button-row" style="max-width:520px;margin-bottom:22px"><button class="primary-button" data-action="practice-mistakes">Practise ${Math.min(12,items.length)} mistakes</button><button class="secondary-button" data-action="clear-mistakes">Clear mistake list</button></div><div class="grid card-grid">${items.slice(0,30).map(m=>`<article class="card" style="min-height:145px"><div class="card-meta">${esc(m.topic||'Practice')} · ${esc(m.kind||'item')}</div><h3>${esc(m.text)}</h3><div class="badge-row"><span class="badge">Missed ${m.wrong}×</span><span class="badge ${m.streak?'local':''}">Correct streak ${m.streak||0}/3</span></div></article>`).join('')}</div>`: `<div class="empty-state"><div class="big">✓</div><h3>No mistakes saved yet</h3><p>When an answer is incorrect, it will appear here automatically. Nothing is uploaded anywhere.</p><button class="primary-button" data-action="dashboard">Choose an activity</button></div>`}`;
  }

  function practiceMistakes(){
    const bag=Object.values(progress.mistakes[gradeKey()]||{}).sort((a,b)=>(b.wrong-(b.streak||0))-(a.wrong-(a.streak||0)));
    if(!bag.length)return;
    const picks=bag.slice(0,12).map(m=>({text:m.text,kind:m.kind||'review'}));
    state.topic='My mistakes';state.level='review';startSession('review',shuffle(picks),{section:'mistakes',topic:'My mistakes',level:'review',mistakeMode:true});
  }

  function renderProgressModal(){
    const p1=progress.grade1,p5=progress.grade5,p7=progress.grade7,m1=Object.keys(progress.mistakes.grade1||{}).length,m5=Object.keys(progress.mistakes.grade5||{}).length,m7=Object.keys(progress.mistakes.grade7||{}).length;
    modalContent.innerHTML=`<h2>Progress on this device</h2><p>This summary comes only from this browser’s local storage.</p><div class="progress-list">
      ${progressItem('Grade 1',p1,m1)}${progressItem('Grade 5',p5,m5)}${progressItem('Grade 7',p7,m7)}
    </div><div class="modal-actions"><button class="secondary-button" data-action="export-progress">Export backup</button><button class="secondary-button" data-action="import-progress">Import backup</button></div>`;
    modal.showModal();
  }
  function progressItem(label,p,m){return `<div class="progress-item"><div><strong>${label}</strong><small>${p.sessions} sessions · ${m} mistake items</small></div><div><strong>${p.attempts?pct(p.correct,p.attempts)+'%':'—'}</strong><small>accuracy</small></div></div>`}

  function renderSettingsModal(){
    const englishVoices=state.voices.filter(v=>/^en[-_]/i.test(v.lang));
    modalContent.innerHTML=`<h2>Settings</h2><p>Speech uses voices already available in your browser or operating system.</p><div class="settings-grid">
      <div class="setting"><label>English voice</label><small>Choose any English voice installed on this device.</small><select id="voiceSelect"><option value="">Browser default</option>${englishVoices.map(v=>`<option value="${esc(v.name)}" ${v.name===state.settings.voice?'selected':''}>${esc(v.name)} · ${esc(v.lang)}</option>`).join('')}</select></div>
      <div class="setting"><label>Session length</label><small>How many items appear in a normal practice session.</small><select id="sessionSize"><option ${state.settings.sessionSize==8?'selected':''}>8</option><option ${state.settings.sessionSize==10?'selected':''}>10</option><option ${state.settings.sessionSize==12?'selected':''}>12</option><option ${state.settings.sessionSize==15?'selected':''}>15</option></select></div>
    </div><div class="modal-actions"><button class="primary-button" data-action="save-settings">Save settings</button><button class="danger-button" data-action="reset-all">Reset all local progress</button></div>`;
    modal.showModal();
  }

  function renderPrivacyModal(){
    modalContent.innerHTML=`<h2>How storage works</h2><p> This project has no backend. Progress, scores and mistakes are stored with the browser’s <code>localStorage</code> on the phone, tablet or computer being used.</p><p>That also means progress normally does not follow the learner to another device. Clearing site/browser data can remove it. Use <strong>Export backup</strong> if you want to move progress between devices without creating accounts.</p><p>The only browser feature used for audio is built-in text-to-speech. The published GitHub Pages site can remain fully static.</p>`;modal.showModal();
  }

  function exportProgress(){
    const payload={app:'Hearly',exportedAt:new Date().toISOString(),progress,settings:state.settings};
    const blob=new Blob([JSON.stringify(payload,null,2)],{type:'application/json'});const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=`hearly-progress-${new Date().toISOString().slice(0,10)}.json`;a.click();setTimeout(()=>URL.revokeObjectURL(a.href),2000)
  }
  function importProgress(){importFile.click()}
  importFile.addEventListener('change',async()=>{
    const f=importFile.files?.[0];if(!f)return;try{const data=JSON.parse(await f.text());if(!data.progress)throw new Error('Not a Hearly backup');progress=data.progress;if(data.settings)state.settings=Object.assign(state.settings,data.settings);save();alert('Progress imported on this device.');modal.close();render()}catch(e){alert('Could not import this file.')}finally{importFile.value=''}
  });

  function crumb(html){return `<nav class="breadcrumb">${html}</nav>`}

  document.addEventListener('click',e=>{
    const el=e.target.closest('[data-action]');if(!el)return;const a=el.dataset.action;
    if(a==='home')home();
    if(a==='choose-grade'){state.grade=Number(el.dataset.grade);state.section=null;setView('dashboard')}
    if(a==='dashboard'){speechSynthesis.cancel();state.section=null;state.topic=null;state.session=null;setView('dashboard')}
    if(a==='open-section'){state.section=el.dataset.section;state.topic=null;setView('section')}
    if(a==='back-section')setView('section');
    if(a==='open-topic'){state.topic=dec(el.dataset.topic);setView('topic')}
    if(a==='start-mode')startSession(el.dataset.level);
    if(a==='speak')speakCurrent();
    if(a==='rate'){const r=Number(el.dataset.rate);if(state.grade===1)state.settings.grade1Rate=r;else if(state.grade===5)state.settings.grade5Rate=r;else state.settings.grade7Rate=r;save();renderPractice();setTimeout(speakCurrent,50)}
    if(a==='check')checkAnswer();
    if(a==='next')nextItem();
    if(a==='exit-practice'){speechSynthesis.cancel();setView(state.session?.mistakeMode?'section':'topic')}
    if(a==='repeat-session'){const lvl=state.level;if(state.session?.mistakeMode)practiceMistakes();else startSession(lvl)}
    if(a==='practice-mistakes')practiceMistakes();
    if(a==='clear-mistakes'){if(confirm('Clear the saved mistake list for this grade?')){progress.mistakes[gradeKey()]={};save();renderMistakesSection()}}
    if(a==='open-progress')renderProgressModal();
    if(a==='open-settings')renderSettingsModal();
    if(a==='open-privacy')renderPrivacyModal();
    if(a==='close-modal')modal.close();
    if(a==='export-progress')exportProgress();
    if(a==='import-progress')importProgress();
    if(a==='save-settings'){state.settings.voice=document.getElementById('voiceSelect').value;state.settings.sessionSize=Number(document.getElementById('sessionSize').value);save();modal.close()}
    if(a==='reset-all'){if(confirm('Delete all saved progress and mistakes from this browser?')){progress=defaultProgress();save();modal.close();home()}}
  });

  modal.addEventListener('click',e=>{if(e.target===modal)modal.close()});
  function loadVoices(){state.voices=speechSynthesis.getVoices()||[]} loadVoices();speechSynthesis.addEventListener?.('voiceschanged',loadVoices);
  if('serviceWorker' in navigator && location.protocol.startsWith('http')) window.addEventListener('load',()=>navigator.serviceWorker.register('./sw.js').catch(()=>{}));
  render();
})();
