(() => {
  'use strict';
  const main = document.getElementById('main');
  const config = PPA_CONFIG, rules = PPA_RULES, storage = PPA_STORAGE;
  const names = {20:'基礎探索',50:'進階探索',100:'完整探索'};
  const stages = {A:'生活情境與保養習慣',B:'保養需求與選購偏好',C:'PPA 產品認識與資訊介紹',D:'購買意願與下一步'};
  const esc = value => String(value).replace(/[&<>"']/g, c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  let state = storage.load();
  const save = () => storage.save(state);
  const focus = () => { const el=main.querySelector('h1, legend'); if(el){el.tabIndex=-1;el.focus();} window.scrollTo(0,0); };
  function confirmReset(action) {
    if (!state || !Object.keys(state.answers).length) return action();
    const dialog = document.getElementById('confirm-dialog');
    document.getElementById('confirm-copy').textContent = `重新開始或切換版本會清除目前 ${state.version} 題版的答案與進度。`;
    const opener = document.activeElement;
    document.getElementById('confirm-cancel').onclick = () => {dialog.close();opener?.focus();};
    document.getElementById('confirm-ok').onclick = () => {dialog.close();action();};
    dialog.showModal(); document.getElementById('confirm-cancel').focus();
  }
  function start(version) {
    confirmReset(() => {
      PPA_EVENTS.emit('select_version', version);
      state={schema:1,version,index:0,answers:{},completed:false}; save();
      PPA_EVENTS.emit('start_questionnaire',version); question();
    });
  }
  function home() {
    document.body.classList.remove('is-question');
    main.className='home';
    main.innerHTML=`
      <section class="hero"><div class="hero-copy"><p class="eyebrow">A LITTLE CARE, EVERY DAY</p><h1>探索你的<br>日常保養<span class="title-dot">。</span></h1><p class="intro">從生活裡的小習慣出發，<br>找到適合自己的保養節奏。</p><p class="hero-detail">透過生活與保養習慣的回答，整理自己的保養重點，並認識 PPA。沒有標準答案，照著你的日常回答就好。</p><a class="text-link" href="#explore">選擇你的探索方式 <span aria-hidden="true">↓</span></a></div>
      <div class="hero-art" aria-hidden="true"><div class="art-label">DAILY CARE JOURNAL <span>01 — 03</span></div><div class="orbit orbit-one"></div><div class="orbit orbit-two"></div><div class="art-note"><span>從了解自己開始</span><strong>把保養，<br>放回日常。</strong><div class="note-line"></div><small>習慣 · 需求 · 自己的節奏</small></div><div class="art-bottom">A MOMENT FOR YOURSELF <span>✳</span></div></div></section>
      ${state ? `<section class="resume"><div><strong>${state.completed?'你的探索結果已保存':'上次的探索，還在這裡'}</strong><p>${state.version} 題・${names[state.version]}${state.completed?'・已完成':`・停在第 ${state.index+1} 題`}</p></div><div class="actions"><button class="secondary" id="restart">重新開始</button><button class="primary" id="resume">${state.completed?'查看結果':'繼續填寫'} →</button></div></section>`:''}
      <section id="explore" class="explore"><div class="section-heading"><div><p class="eyebrow">CHOOSE YOUR EXPLORATION</p><h2>留一點時間，認識自己的習慣</h2></div><p>選擇適合自己的題數<br>三種版本，都有完整的探索結果</p></div>
      <div class="plans">${[20,50,100].map((n,i)=>`<article class="plan"><div class="plan-top"><span>0${i+1}</span><span>${['從日常開始','多了解一點','細看生活全貌'][i]}</span></div><h3>${names[n]}</h3><p class="count">${n}<span>題</span></p><p>${['回顧保養習慣，整理當下的重點。','加入生活情境，探索更細緻的偏好。','從生活到選購，完整梳理保養想法。'][i]}</p><div class="plan-gift">${n===20?'完整結果，從這裡開始':n===100?'完成保證送公司電子高級優惠券':'完成保證送公司電子優惠券'}</div><button class="secondary" data-version="${n}">開始${names[n]} <span aria-hidden="true">↗</span></button></article>`).join('')}</div>
      <p class="fine">優惠券為提案中的規劃，50／100 題分屬不同等級；面額、折扣與使用條件尚待公司確認。本展示版不提供實際優惠券。</p></section>
      <section class="takeaways"><p class="eyebrow">WHAT YOU WILL TAKE AWAY</p><h2>每一種探索，都帶回一份日常靈感</h2><div class="three-col">${[['01','保養習慣摘要','回看你的使用頻率、生活環境與關注項目。'],['02','依回答整理的保養安排','用簡單、日常的建議，留出自己調整的空間。'],['03','認識 PPA','了解產品基本資訊，並保留官網購買入口。']].map(x=>`<div><span class="step">${x[0]}</span><h3>${x[1]}</h3><p>${x[2]}</p></div>`).join('')}</div></section>
      <p class="privacy">答案只保存在這個瀏覽器，用於續填與結果整理，你可隨時重新開始清除。本展示不傳送答案、不接入追蹤服務；Email 僅作流程預覽，不會保存。</p>`;
    main.querySelectorAll('[data-version]').forEach(b=>b.onclick=()=>start(Number(b.dataset.version)));
    if(state){document.getElementById('resume').onclick=()=>state.completed?results():question(); document.getElementById('restart').onclick=()=>start(state.version);}
    focus();
  }
  function question() {
    document.body.classList.add('is-question');
    main.className='question-page';
    const ids=PPA_VERSIONS[state.version], q=PPA_QUESTIONS.find(q=>q.id===ids[state.index]);
    const a=state.answers[q.id] || {values:[],other:''};
    const stage=q.id[0], progress=Math.round(state.index/ids.length*100);
    main.innerHTML=`<div class="question-layout"><aside class="question-aside"><p class="eyebrow">YOUR DAILY CARE JOURNAL</p><h2>慢慢探索，<br>照自己的節奏。</h2><p>${state.version} 題・${names[state.version]}</p><ol class="stage-list">${Object.entries(stages).map(([k,v])=>`<li class="${k===stage?'current':''}" ${k===stage?'aria-current="step"':''}><span>${k}</span>${v}</li>`).join('')}</ol><p class="fine">沒有標準答案，也沒有評分。<br>${storage.available?'答案會自動保存在此瀏覽器。':'此瀏覽器無法保存進度。'}</p><button id="pause" class="text-button">暫停，回到首頁</button></aside>
      <section class="question-card"><div class="progress-top"><span>${stages[stage]}</span><span>第 <strong>${state.index+1}</strong> / ${ids.length} 題</span></div><div class="progress" role="progressbar" aria-label="問卷完成進度" aria-valuemin="0" aria-valuemax="${ids.length}" aria-valuenow="${state.index}"><span style="width:${progress}%"></span></div>
      <form id="question-form" novalidate><fieldset aria-describedby="question-help question-error"><legend>${esc(q.title)}</legend><p id="question-help" class="question-help">${q.type==='multi'?'此題可複選；若沒有符合的選項，請選「其他」。':'此題為單選，請選擇一項。'} <span class="required">必填</span>${q.max?`<br>最多選 ${q.max} 項（「其他」也算一項）。`:''}</p>${config.questionIntros[q.id]?`<div class="info-box">${esc(config.questionIntros[q.id])}</div>`:''}
      <div class="options">${q.options.map((v,i)=>`<label class="option"><input type="${q.type==='multi'?'checkbox':'radio'}" name="answer" value="${esc(v)}" ${a.values.includes(v)?'checked':''}><span>${esc(v)}</span>${q.exclusive.includes(v)?'<small>單獨選取</small>':''}</label>`).join('')}</div>
      <div id="other-wrap" class="other-wrap" ${a.values.includes('其他')?'':'hidden'}><label for="other">請補充「其他」的內容 <span>（最多 100 字）</span></label><textarea id="other" maxlength="100" rows="2" aria-describedby="question-error">${esc(a.other)}</textarea></div>
      <p id="question-error" class="error" role="status" aria-live="polite"></p></fieldset><div class="question-nav"><button type="button" class="secondary" id="prev" ${state.index===0?'disabled':''}>← 上一題</button><span>${state.version} 題版</span><button type="submit" class="primary">${state.index===ids.length-1?'完成探索，查看結果':'下一題'} →</button></div></form></section></div>`;
    const err=document.getElementById('question-error'), other=document.getElementById('other'), wrap=document.getElementById('other-wrap');
    const current=()=>state.answers[q.id] || {values:[],other:''};
    main.querySelectorAll('input[name="answer"]').forEach(input=>input.onchange=()=>{
      const old=current(); const values=rules.toggle(q,old.values,input.value,input.checked);
      state.answers[q.id]={values,other:values.includes('其他')?old.other:''};
      main.querySelectorAll('input[name="answer"]').forEach(el=>el.checked=values.includes(el.value));
      wrap.hidden=!values.includes('其他'); if(wrap.hidden)other.value='';
      err.textContent=values.length ? rules.validate(q,state.answers[q.id]) : ''; save();
    });
    other.oninput=()=>{state.answers[q.id]={values:current().values,other:other.value};err.textContent='';save();};
    document.getElementById('question-form').onsubmit=e=>{
      e.preventDefault(); const message=rules.validate(q,current()); err.textContent=message;
      if(message){main.querySelector('fieldset').setAttribute('aria-invalid','true'); if(current().values.includes('其他')&&!other.value.trim())other.focus();else main.querySelector('input').focus();return;}
      if(state.index<ids.length-1){state.index++;save();question();} else {
        const invalid=ids.findIndex(id=>rules.validate(PPA_QUESTIONS.find(q=>q.id===id),state.answers[id]));
        if(invalid!==-1){state.index=invalid;save();question();document.getElementById('question-error').textContent='這題尚未完成，請補齊後繼續。';return;}
        state.completed=true;save();PPA_EVENTS.emit('complete_questionnaire',state.version);results();
      }
    };
    document.getElementById('prev').onclick=()=>{state.index--;state.completed=false;save();question();};
    document.getElementById('pause').onclick=home;focus();
  }
  function officialUrl() {
    try { const url=new URL(config.officialUrl); return url.protocol==='https:'||url.protocol==='http:' ? url.href : ''; } catch {return '';}
  }
  function results() {
    document.body.classList.remove('is-question');
    main.className='results'; const data=rules.result(state.answers), coupon=config.coupons[state.version], url=officialUrl();
    main.innerHTML=`<section class="result-hero"><p class="eyebrow">YOUR DAILY CARE NOTES</p><span class="result-check" aria-hidden="true">✓</span><p class="version-tag">${state.version} 題・${names[state.version]}・已完成</p><h1>你的日常，<br>有了新的保養筆記。</h1><p>從回答裡整理出重點，把適合自己的安排留在生活裡。</p><p class="fine">${esc(data.context)}</p><a class="text-link" href="#summary">看看我的整理 ↓</a></section>
      <section id="summary" class="result-section"><div class="section-heading"><div><p class="eyebrow">01 / YOUR HABITS</p><h2>保養習慣摘要</h2></div><p>每一項重點，都來自你的回答</p></div><dl class="summary-grid">${data.summary.map(x=>`<div><dt>${esc(x.label)}</dt><dd>${esc(x.text)}</dd></div>`).join('')||'<div><dt>資料尚不足</dt><dd>目前沒有足夠回答可整理，以下提供一般性安排。</dd></div>'}</dl></section>
      <section class="result-section arrangement"><p class="eyebrow">02 / A ROUTINE THAT FITS</p><h2>留給日常的保養安排</h2><p>選擇你想嘗試的部分就好。以下為日常參考，不是醫療建議或 PPA 的使用處方。</p><div class="three-col">${data.plan.map((x,i)=>`<article><span class="step">0${i+1}</span><h3>${esc(x.title)}</h3><p>${esc(x.text)}</p><small>${esc(x.basis)}</small></article>`).join('')}</div></section>
      <section class="result-section product"><figure class="product-photo"><img src="${esc(config.productImage)}" alt="${esc(config.productImageAlt)}" width="1122" height="1402" loading="lazy" decoding="async"><figcaption>${esc(config.productImageCaption)}</figcaption></figure><div><p class="eyebrow">03 / MEET PPA</p><h2>從認識 PPA 開始</h2><h3>${esc(config.productName)}</h3><p>${esc(config.productUsage)}</p><div class="product-texture"><h3>質地</h3><p>${esc(config.details['質地'])}</p></div><div class="next-step">${url?`<a id="official" class="primary button-link" href="${esc(url)}" target="_blank" rel="noopener noreferrer">前往官網了解與購買 ↗</a>`:'<button class="primary" disabled>官網連結待補</button>'}</div></div></section>
      ${coupon?`<section class="coupon result-section"><div><p class="eyebrow">A THANK YOU FOR YOUR TIME</p><span class="version-tag">${esc(coupon.level)}</span><h2>${esc(coupon.name)}</h2><p>${esc(coupon.description)}</p><p class="fine">領取資格不受購買意願或產品評價影響。</p></div><form id="coupon-form" novalidate><p class="demo-note">展示流程，Email 不會送出，優惠券不會實際寄送。</p><label for="email">Email（僅在此頁預覽，不會保存）</label><input id="email" type="email" autocomplete="off" inputmode="email" placeholder="your@email.com" aria-describedby="coupon-status" required><p id="coupon-status" role="status" class="error"></p><button class="primary" type="submit">預覽領取流程 →</button></form></section>`:''}
      <div class="result-actions"><button class="secondary" id="edit">返回問卷修改答案</button><button class="secondary" id="home">回到首頁</button><button class="primary" id="again">重新探索 ↗</button></div>`;
    if(url)document.getElementById('official').onclick=()=>PPA_EVENTS.emit('official_click',state.version);
    if(coupon){const form=document.getElementById('coupon-form'), email=document.getElementById('email'), status=document.getElementById('coupon-status');
      form.onsubmit=e=>{e.preventDefault();if(!email.value.trim()||!email.checkValidity()){status.textContent='請輸入有效的 Email 格式，例如 name@example.com。';email.setAttribute('aria-invalid','true');email.focus();return;}
        email.value='';email.removeAttribute('aria-invalid');status.className='success';status.textContent='模擬流程完成。正式活動確認後，將在此說明領取方式；本次未送出 Email，也未實際寄送優惠券。';PPA_EVENTS.emit('preview_coupon',state.version);
      }; email.oninput=()=>{status.textContent='';status.className='error';email.removeAttribute('aria-invalid');};
    }
    document.getElementById('edit').onclick=()=>{state.completed=false;state.index=0;save();question();};
    document.getElementById('home').onclick=home;
    document.getElementById('again').onclick=()=>confirmReset(()=>{storage.clear();state=null;home();}); focus();
  }
  document.getElementById('brand-home').onclick=home;
  home();
})();
