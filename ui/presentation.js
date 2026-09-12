/* Presentation only. Auth, entitlement, writes and certificate generation remain in idz-app.js. */
let studentView='dashboard';
let activeLesson=null;
let activeLessonTab='content';
let drawerTrigger=null;
let checkoutUnsubscribe=null;
function waitForFirebaseServices(timeout=15000){
  if(window.db&&window.firebaseModules?.getDoc)return Promise.resolve();
  return new Promise((resolve,reject)=>{const finish=()=>{clearTimeout(timer);window.removeEventListener('idz:firebase-services-ready',ready);};const ready=()=>{if(window.db&&window.firebaseModules?.getDoc){finish();resolve();}};const timer=setTimeout(()=>{finish();reject(new Error('Não foi possível conectar aos dados. Recarregue a página.'));},timeout);window.addEventListener('idz:firebase-services-ready',ready);ready();});
}
function stopCheckoutWatcher(){if(checkoutUnsubscribe){checkoutUnsubscribe();checkoutUnsubscribe=null;}}
async function watchCheckoutEntitlement(){
  stopCheckoutWatcher();const uid=window.auth?.currentUser?.uid;if(!uid)return;
  try{await waitForFirebaseServices();if(window.auth?.currentUser?.uid!==uid||!document.getElementById('modal-custom-checkout').classList.contains('active'))return;
    const {doc,onSnapshot}=window.firebaseModules;
    checkoutUnsubscribe=onSnapshot(doc(window.db,'users',uid),snapshot=>{
      if(window.auth?.currentUser?.uid!==uid)return stopCheckoutWatcher();
      const profile=snapshot.data();
      // The server/webhook owns these fields. This listener never grants access locally.
      if(profile?.paid===true&&profile.adminAccessRevoked!==true){
        const index=registeredUsers.findIndex(u=>u.uid===uid);if(index>=0)registeredUsers[index]={...registeredUsers[index],...profile};else registeredUsers.push({...profile,uid});
        stopCheckoutWatcher();closeCheckoutModalSafe();
        let modal=document.getElementById('payment-confirmed-modal');if(!modal){modal=document.createElement('div');modal.id='payment-confirmed-modal';modal.className='modal-overlay';modal.innerHTML='<div class="modal-card payment-confirmed"><button class="close-btn" aria-label="Fechar confirmação" onclick="closeModal(\'payment-confirmed-modal\')">×</button><div class="confirmation-mark">✓</div><h2>Pagamento confirmado!</h2><p>Seu acesso já foi liberado.<br>É hora de começar a estudar.</p><button class="btn" onclick="closeModal(\'payment-confirmed-modal\');showMemberArea()">Acessar meu curso</button><button class="btn-outline" onclick="closeModal(\'payment-confirmed-modal\');showPublicSite()">Explorar a plataforma</button></div>';document.body.appendChild(modal);}openModal(modal.id);
      }
    },()=>showToast('A confirmação ainda não pôde ser consultada. Reabra o checkout para tentar novamente.'));
  }catch(error){showToast(error.message);}
}
const moduleIcons=['desktop','keyboard','folder','globe','envelope','file-word','file-excel','file-powerpoint','cloud','shield-halved','wand-magic-sparkles','diagram-project'];
const moduleNames=['Conhecendo o computador','Teclado e mouse','Arquivos e pastas','Internet','E-mail','Word','Excel','PowerPoint','Google Drive','Segurança digital','Inteligência artificial','Projeto final'];
const icon=(name)=>`<i class="fa-solid fa-${name}" aria-hidden="true"></i>`;
const progressBar=(value)=>`<div class="progress-track" role="progressbar" aria-label="Progresso do curso" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${value}"><span style="width:${value}%"></span></div>`;
function navigationForPresentation(state){
  if(state==='AUTH_LOADING')return [{icon:'fa-spinner',label:'Carregando sessão…',action:'noop'}];
  if(state==='VISITOR')return [['house','Início','home'],['book-open','Curso','course'],['layer-group','Conteúdo','content'],['award','Certificado','public-certificate'],['circle-question','FAQ','faq'],['cart-shopping','Começar agora','buy'],['user','Entrar','auth']].map(([i,label,action])=>({icon:'fa-'+i,label,action}));
  const student=[['house','Início','dashboard'],['book-open','Aulas','lessons'],['layer-group','Módulos','modules'],['chart-line','Progresso','progress'],['list-check','Exercícios','exercises'],['diagram-project','Projeto Final','project'],['award','Certificado','certificate'],['gift','Bônus','bonuses'],['headset','Suporte','support'],['user','Perfil','profile']];
  const admin=[['gauge-high','Dashboard','admin'],['users','Alunos','admin-students'],['wallet','Pagamentos','admin-finance'],['layer-group','Conteúdo','admin-content'],['list-check','Exercícios','admin-exercises'],['diagram-project','Projeto Final','admin-project'],['award','Certificados','admin-certificates'],['ticket','Cupons','admin-coupons'],['bell','Notificações','admin-notifications'],['headset','Suporte','admin-support'],['rotate-left','Reembolsos','admin-refunds'],['cart-shopping','Pendentes','admin-cart'],['gear','Configurações','settings'],['graduation-cap','Acessar aulas','lessons']];
  return [...(state==='ADMIN'?admin:student).map(([i,label,action])=>({icon:'fa-'+i,label,action})),{icon:'fa-right-from-bracket',label:'Sair',action:'logout',danger:true}];
}
function renderShellNavigation(){
  const state=window.IDZ_AUTH_STATE||'AUTH_LOADING';
  document.body.dataset.auth=state;
  for(const id of ['student-navigation','settings-navigation','admin-navigation']){
    const el=document.getElementById(id);if(!el)continue;
    const items=navigationForPresentation(id==='student-navigation'?'STUDENT':state);
    el.innerHTML=`<span class="idz20a-menu-title">${state==='ADMIN'?'ADMINISTRAÇÃO':'ÁREA DO ALUNO'}</span>`+items.map(item=>navigationButton(item,'idz20a-menu-item')).join('');
  }
  const publicNav=document.getElementById('desktop-public-nav');if(publicNav)publicNav.hidden=state!=='VISITOR';
  document.querySelectorAll('.idz-nav-purchase').forEach(el=>el.hidden=state!=='VISITOR');
  document.querySelectorAll('#hero-btn-text').forEach(el=>el.textContent=state==='AUTH_LOADING'?'CARREGANDO SESSÃO…':state==='VISITOR'?'COMEÇAR AGORA':state==='ADMIN'?'ACESSAR PAINEL':'ACESSAR MEU CURSO');
  document.querySelectorAll('[data-idz-nav-action]').forEach(el=>{if(el.dataset.idzNavAction===studentView)el.setAttribute('aria-current','page');else el.removeAttribute('aria-current');});
}
function renderAdminOverview(){
  const host=document.getElementById('admin-recent-users');if(!host)return;
  if(!adminUsersLoaded){host.innerHTML='<p>Carregando alunos…</p>';return;}
  host.innerHTML=adminUsersCache.length?`<table class="sales-table"><thead><tr><th>Nome</th><th>E-mail</th><th>Status</th><th>Data</th><th>Ações</th></tr></thead><tbody>${[...adminUsersCache].sort((a,b)=>String(b.createdAt||'').localeCompare(String(a.createdAt||''))).slice(0,6).map(u=>`<tr><td>${escapeHTML(u.fullname||'Aluno')}</td><td>${escapeHTML(u.email||'')}</td><td><span class="status-chip ${u.paid?'ok':''}">${u.paid?'Aprovado':'Pendente'}</span></td><td>${u.createdAt?escapeHTML(new Date(u.createdAt).toLocaleDateString('pt-BR')):'—'}</td><td><button class="btn-outline" onclick="openManageStudent(decodeURIComponent('${encodeURIComponent(u.uid||'')}'))">Gerenciar</button></td></tr>`).join('')}</tbody></table>`:'<p>Nenhum aluno cadastrado.</p>';
  enhanceAccessibility(host);
}
function renderPublicCourse(){
  const stats=getCourseProgressStats();
  safeSetHTML('hero-tag-lessons',`${icon('graduation-cap')} CURSO ONLINE COMPLETO`);
  const items=[['layer-group',courseData.length,'Módulos'],['circle-play',stats.totalLessons,'Aulas'],['list-check',stats.totalExercises,'Exercícios práticos'],['diagram-project',stats.totalProjectSteps+' etapas','Projeto Final'],['gift',(courseV2.bonuses||[]).length,'Bônus'],['award','Certificado','Após conclusão']];
  safeSetHTML('public-stats',items.map(([i,n,t])=>`<div>${icon(i)}<strong>${n}</strong><span>${t}</span></div>`).join(''));
  const openIds=[...document.querySelectorAll('#public-modules details[open]')].map(el=>el.dataset.module);
  safeSetHTML('public-modules',courseData.map((m,i)=>`<details class="module-card" data-module="${m.id}" ${openIds.includes(String(m.id))?'open':''}><summary><span class="icon-tile">${icon(moduleIcons[i]||'book')}</span><span><small>Módulo ${i+1}</small><strong>${escapeHTML(moduleNames[i]||m.title)}</strong><small>${m.lessons.length} aulas</small></span></summary><ol class="public-lesson-list">${m.lessons.map(l=>`<li>${escapeHTML(l.title)}</li>`).join('')}</ol></details>`).join(''));
  safeSetText('free-lesson-title',courseData[0]?.lessons[0]?.title||'Introdução ao IDZ');
}
function currentResumeLesson(){
  let saved;try{saved=JSON.parse(localStorage.getItem('idz_resume_'+progressKey())||'null');}catch{}
  const all=courseData.flatMap(m=>m.lessons.map(l=>({mod:m,lesson:l})));
  return all.find(x=>x.mod.id==saved?.modId&&x.lesson.id==saved?.lessonId)||all.find(x=>!isLessonCompleted(x.lesson))||all[0];
}
function renderStudentDashboard(){
  const host=document.getElementById('student-dashboard');if(!host)return;
  const stats=getCourseProgressStats(),resume=currentResumeLesson();
  const metrics=[['Progresso geral',stats.percent+'%'],['Módulos',stats.completedModuleCount+'/'+courseData.length],['Aulas',stats.completedLessonCount+'/'+stats.totalLessons],['Exercícios',stats.completedExerciseCount+'/'+stats.totalExercises]];
  host.innerHTML=`${resume?`<article class="card continue-card"><div><span class="eyebrow">CONTINUE DE ONDE PAROU</span><h2>${escapeHTML(resume.mod.title)}</h2><p>${escapeHTML(resume.lesson.title)}</p>${progressBar(stats.percent)}<button class="btn" onclick="showStudentPage('lessons')">Continuar assistindo ${icon('arrow-right')}</button></div><img src="assets/hero/idz-laptop.webp" alt="Seu curso IDZ" width="1200" height="800" loading="lazy"></article>`:'<div class="empty-state">As aulas estarão disponíveis em breve.</div>'}<div class="stat-grid">${metrics.map(([label,val])=>`<article class="card stat-card"><small>${label}</small><strong>${val}</strong>${progressBar(label==='Progresso geral'?stats.percent:label==='Módulos'?Math.round(stats.completedModuleCount/courseData.length*100):label==='Aulas'?Math.round(stats.completedLessonCount/Math.max(1,stats.totalLessons)*100):Math.round(stats.completedExerciseCount/Math.max(1,stats.totalExercises)*100))}</article>`).join('')}</div><div class="quick-grid"><button class="card quick-card" onclick="showStudentPage('project')"><span class="icon-tile">${icon('diagram-project')}</span><span><strong>Projeto Final</strong><small>${stats.completedProjectStepCount}/${stats.totalProjectSteps} etapas concluídas</small></span></button><button class="card quick-card" onclick="showStudentPage('certificate')"><span class="icon-tile">${icon('award')}</span><span><strong>Certificado</strong><small>${certificateAvailable()?'Disponível':'Complete os requisitos'}</small></span></button></div>`;
}
function certificateAvailable(){const p=currentProfile();return p?.certificateOverride===true||(p?.certificateOverride!==false&&getCourseProgressStats().complete);}
function showStudentPage(view){showMemberArea(view);}
let selectedModuleId=null;
function selectedCourseModule(){
  const resume=currentResumeLesson();
  if(selectedModuleId==null){try{selectedModuleId=localStorage.getItem('idz_selected_module_'+progressKey())||resume?.mod?.id||courseData[0]?.id;}catch{selectedModuleId=resume?.mod?.id||courseData[0]?.id;}}
  return courseData.find(m=>String(m.id)===String(selectedModuleId))||courseData[0];
}
function coursePrimaryTabs(view){
  document.querySelectorAll('[data-course-view]').forEach(tab=>{const active=(view==='lessons'&&tab.dataset.courseView==='lessons')||(view==='exercises'&&tab.dataset.courseView==='exercises')||(view==='modules'&&tab.dataset.courseView==='modules');tab.classList.toggle('active',active);tab.setAttribute('aria-selected',String(active));});
}
function selectCourseModule(id){selectedModuleId=String(id);try{localStorage.setItem('idz_selected_module_'+progressKey(),selectedModuleId);}catch{};showMemberArea('lessons');}
function renderModulePicker(){
  const host=document.getElementById('module-list');if(!host)return;
  const stats=getCourseProgressStats();
  host.innerHTML=courseData.map((m,i)=>{const done=m.lessons.filter(isLessonCompleted).length,total=m.lessons.length,pct=Math.round(done/Math.max(1,total)*100),selected=String(m.id)===String(selectedCourseModule()?.id);return `<button type="button" class="module-picker-card ${selected?'selected':''}" data-module-id="${m.id}" onclick="selectCourseModule(${m.id})"><span class="icon-tile">${icon(moduleIcons[i]||'book')}</span><span class="module-picker-copy"><small>Módulo ${i+1}</small><strong>${escapeHTML(m.title)}</strong><span>${done}/${total} aulas · ${pct}%</span>${progressBar(pct)}</span><span class="module-status">${pct===100?'Concluído':selected?'Selecionado':'Abrir'}</span></button>`;}).join('');
  enhanceAccessibility(host);
}
function renderSelectedModuleLessons(){
  const host=document.getElementById('selected-module-lessons'),mod=selectedCourseModule();if(!host||!mod)return;
  host.innerHTML=`<div class="course-lesson-picker"><div class="course-lesson-picker-heading"><span><small>MÓDULO ${courseData.indexOf(mod)+1}</small><strong>${escapeHTML(mod.title)}</strong></span><button type="button" class="btn-outline" onclick="showMemberArea('modules')">Trocar módulo</button></div><div class="course-lesson-list">${mod.lessons.map((lesson,i)=>`<button type="button" class="course-lesson-button ${activeLesson?.lessonId==lesson.id?'active':''} ${isLessonCompleted(lesson)?'done':''}" data-lesson-id="${lesson.id}" onclick="loadLessonContent(${mod.id},${lesson.id})"><span>${i+1}. ${escapeHTML(lesson.title)}</span><span>${isLessonCompleted(lesson)?'✓':'›'}</span></button>`).join('')}</div></div>`;
}
function renderExercisesView(){
  const host=document.getElementById('student-exercises-view');if(!host)return;
  host.innerHTML=`<div class="section-header"><h2>Exercícios</h2><p>Pratique por módulo e acompanhe seu aproveitamento.</p></div>`+courseData.map((m,i)=>`<details class="exercise-module" ${String(m.id)===String(selectedCourseModule()?.id)?'open':''}><summary><span class="icon-tile">${icon(moduleIcons[i]||'book')}</span><span><strong>Módulo ${i+1} · ${escapeHTML(m.title)}</strong><small>${m.lessons.reduce((n,l)=>n+lessonExercises(l).length,0)} exercícios</small></span></summary><div class="exercise-list">${m.lessons.flatMap(lesson=>lessonExercises(lesson).map(ex=>`<button type="button" class="exercise-row" data-exercise-id="${escapeHTML(ex.id||ex.question||'exercise')}" onclick="showCourseExercise(${m.id},${lesson.id})"><span><strong>${escapeHTML(ex.question||ex.title||'Exercício')}</strong><small>${escapeHTML(lesson.title)}</small></span><span>${isExerciseCompleted(lesson,ex)?'✓':'›'}</span></button>`)).join('')||'<p class="empty-state">Nenhum exercício cadastrado neste módulo.</p>'}</div></details>`).join('');
  enhanceAccessibility(host);
}
function showCourseExercise(modId,lessonId){selectedModuleId=String(modId);activeLessonTab='exercises';showMemberArea('lessons');loadLessonContent(modId,lessonId);}
function renderStudentView(view='dashboard'){
  studentView=view;
  const courseView=['lessons','exercises','modules'].includes(view);
  document.getElementById('student-dashboard').hidden=view!=='dashboard';
  document.getElementById('student-detail').hidden=['dashboard',...courseView?['lessons','exercises','modules']:[]].includes(view);
  document.getElementById('student-classroom').hidden=!courseView;
  document.getElementById('student-lessons-view').hidden=view!=='lessons';
  document.getElementById('student-exercises-view').hidden=view!=='exercises';
  document.getElementById('student-modules-view').hidden=view!=='modules';
  coursePrimaryTabs(view);renderShellNavigation();
  if(view==='dashboard')renderStudentDashboard();
  else if(view==='lessons'){activeLessonTab='content';renderSelectedModuleLessons();const mod=selectedCourseModule(),resume=currentResumeLesson();const lesson=activeLesson&&String(activeLesson.modId)===String(mod?.id)?mod.lessons.find(l=>String(l.id)===String(activeLesson.lessonId)):resume?.mod?.id===mod?.id?resume.lesson:mod?.lessons?.[0];if(mod&&lesson)loadLessonContent(mod.id,lesson.id);}
  else if(view==='exercises')renderExercisesView();
  else if(view==='modules')renderModulePicker();
  else renderStudentDetail(view);
}
function renderStudentDetail(view){
  const host=document.getElementById('student-detail'),s=getCourseProgressStats();
  if(view==='progress')host.innerHTML=`<div class="card"><span class="eyebrow">SUA JORNADA</span><h2>Meu progresso</h2><div class="progress-layout"><div class="progress-ring" style="--progress:${s.percent}" role="img" aria-label="${s.percent}% concluído"><div><strong>${s.percent}%</strong><small>Concluído</small></div></div><ul class="progress-list">${[['Módulos concluídos',s.completedModuleCount+'/'+courseData.length],['Aulas concluídas',s.completedLessonCount+'/'+s.totalLessons],['Exercícios concluídos',s.completedExerciseCount+'/'+s.totalExercises],['Projeto Final',s.completedProjectStepCount+'/'+s.totalProjectSteps],['Certificado',certificateAvailable()?'Disponível':'Bloqueado']].map(([a,b])=>`<li><span>${a}</span><strong>${b}</strong></li>`).join('')}</ul></div><button class="btn" onclick="showStudentPage('lessons')">Continuar estudando ${icon('arrow-right')}</button></div>`;
  if(view==='project')host.innerHTML=`<div class="section-header"><h2>PROJETO FINAL</h2><span class="eyebrow gold">COLOQUE EM PRÁTICA O QUE APRENDEU</span><p>${s.completedProjectStepCount} de ${s.totalProjectSteps} etapas concluídas</p></div><div class="project-steps">${finalProjectSteps().map((step,i)=>`<label class="card project-step"><input type="checkbox" ${isProjectStepCompleted(step.id)?'checked':''} onchange="toggleFinalProjectStep('${escapeHTML(step.id)}',this.checked)"><span><strong>Etapa ${i+1} · ${escapeHTML(step.title)}</strong><small>${escapeHTML(step.description||step.instructions||'Confira a entrega desta etapa na aula do Projeto Final.')}</small><small>${isProjectStepCompleted(step.id)?'Concluída':'Em andamento'}</small></span></label>`).join('')}</div><button class="btn-outline" style="margin-top:20px" onclick="openProjectLesson()">Abrir conteúdo do projeto ${icon('arrow-right')}</button>`;
  if(view==='bonuses')host.innerHTML=`<div class="section-header"><h2>3 BÔNUS EXCLUSIVOS</h2><p>Seus materiais complementares.</p></div><div class="bonus-grid">${(courseV2.bonuses||[]).map((b,i)=>`<article class="card bonus-card"><span class="icon-tile">${icon(['keyboard','file-lines','chart-column'][i])}</span><h3>${escapeHTML(b.title.replace(/^🎁 Bônus \d+ — /,''))}</h3><p>${escapeHTML(b.description||'Material complementar do curso.')}</p><button class="btn-outline" onclick="openBonus('${escapeHTML(b.id)}')">Abrir material</button><button class="btn-outline" onclick="toggleStudentBonus('${escapeHTML(b.id)}').then(()=>renderStudentDetail('bonuses'))">${completedBonuses[progressKey()]?.[b.id]?'Concluído · reabrir':'Marcar como concluído'}</button></article>`).join('')}</div>`;
  if(view==='certificate')host.innerHTML=`<div class="section-header"><h2>Seu certificado</h2><p>${certificateAvailable()?'Você já pode emitir seu certificado.':'Conclua os requisitos para liberar seu certificado.'}</p></div><div class="card certificate-layout"><img src="assets/certificado-idz-clean-template.png" alt="Template oficial do certificado IDZ"><div><ul class="checklist"><li>Aulas: ${s.completedLessonCount}/${s.totalLessons}</li><li>Exercícios: ${s.completedExerciseCount}/${s.totalExercises}</li><li>Projeto Final: ${s.completedProjectStepCount}/${s.totalProjectSteps}</li></ul><button class="btn" ${certificateAvailable()?'':'disabled'} onclick="generateOfficialCertificatePDF()">BAIXAR CERTIFICADO</button><button class="btn-outline" ${certificateAvailable()?'':'disabled'} onclick="requestPhysicalCertificate()">Solicitar versão física</button>${currentProfile()?.physicalCertificateRequestedAt?`<p class="delivery-status">Versão física: ${escapeHTML(currentProfile().physicalCertificateStatus||'Solicitada')}</p>${currentProfile().physicalCertificateStatus==='entregue'?'<button class="btn-outline" onclick="confirmPhysicalReceipt()">Confirmar recebimento</button>':''}`:''}</div></div>`;
}
function openProjectLesson(){const m=courseData.find(m=>m.type==='project');if(!m?.lessons[0])return;showMemberArea('lessons');loadLessonContent(m.id,m.lessons[0].id);}
function openBonus(id){const b=courseV2.bonuses.find(b=>b.id===id);if(!b)return;const url=b.pdfUrl||b.downloadUrl||b.url; if(url&&isSafeHttpUrl(url)){window.open(url,'_blank','noopener');return;}showCustomAlert(b.title,b.content?String(b.content):'O arquivo deste bônus ainda não foi disponibilizado no conteúdo do curso.');}
function setLessonTab(tab){activeLessonTab=tab;document.querySelectorAll('[data-lesson-panel]').forEach(el=>el.hidden=el.dataset.lessonPanel!==tab);document.querySelectorAll('[data-lesson-tab]').forEach(el=>{const active=el.dataset.lessonTab===tab;el.classList.toggle('active',active);el.setAttribute('aria-selected',String(active));el.tabIndex=active?0:-1;});}
function renderLessonPresentation(data){
  const {mod,lesson,mediaHtml,imgHtml,pdfHtml,quizHtml,finalProjectHtml,certificateSectionHtml,lessonDone,previousLesson,nextLesson,progressStats}=data;
  activeLesson={modId:mod.id,lessonId:lesson.id};
  localStorage.setItem('idz_resume_'+progressKey(),JSON.stringify(activeLesson));
  document.getElementById('student-dashboard').hidden=true;document.getElementById('student-detail').hidden=true;document.getElementById('student-classroom').hidden=false;
  document.getElementById('lms-main-content').innerHTML=`<header class="lesson-heading"><small>${escapeHTML(mod.title)}</small><h2>${escapeHTML(lesson.title)}</h2></header>${mediaHtml||'<div class="card empty-state"><i class="fa-solid fa-book-open"></i><h3>Aula em texto</h3><p>Estude o conteúdo e pratique nos exercícios abaixo.</p></div>'}<div style="margin:18px 0">${progressBar(progressStats.percent)}</div><div class="lesson-actions"><button class="btn-outline" ${previousLesson?'':'disabled'} ${previousLesson?`onclick="loadLessonContent('${previousLesson.modId}','${previousLesson.lessonId}')"`:''}>${icon('arrow-left')} Aula anterior</button><button class="btn" ${nextLesson?'':'disabled'} ${nextLesson?`onclick="loadLessonContent('${nextLesson.modId}','${nextLesson.lessonId}')"`:''}>Próxima aula ${icon('arrow-right')}</button></div><div class="tabs lesson-tabs" role="tablist" aria-label="Conteúdo da aula">${[['content','Conteúdo'],['exercises','Exercício'],['materials','Materiais']].map(([id,label])=>`<button class="tab" id="tab-${id}" role="tab" aria-controls="panel-${id}" data-lesson-tab="${id}" onclick="setLessonTab('${id}')">${label}</button>`).join('')}</div><section class="card lesson-panel" id="panel-content" role="tabpanel" aria-labelledby="tab-content" data-lesson-panel="content"><h3>Sobre esta aula</h3><p>${escapeHTML(lesson.bloco1||lesson.introduction||'')}</p><p>${escapeHTML(lesson.bloco2||lesson.description||'')}</p><h3>O que você vai aprender</h3><p>${escapeHTML(lesson.bloco3||(lesson.objectives||[]).join(' · '))}</p>${imgHtml}${finalProjectHtml}<button class="btn" ${lessonDone?'disabled':''} onclick="markLessonAsDone(${mod.id},${lesson.id})">${icon('check')} ${lessonDone?'Aula concluída':'Marcar aula como concluída'}</button></section><section id="panel-exercises" role="tabpanel" aria-labelledby="tab-exercises" data-lesson-panel="exercises">${quizHtml||'<div class="card empty-state">Esta aula não possui exercícios.</div>'}<div class="lesson-actions"><button class="btn-outline" onclick="nextExercise()">Próximo exercício ${icon('arrow-right')}</button></div></section><section class="card lesson-panel" id="panel-materials" role="tabpanel" aria-labelledby="tab-materials" data-lesson-panel="materials">${pdfHtml||'<h3>Materiais da aula</h3><p>Nenhum arquivo complementar disponível nesta aula.</p>'}</section>${certificateSectionHtml}`;
  document.querySelectorAll('.activity-panel').forEach(el=>el.classList.add('is-open'));document.querySelectorAll('.exercise-toggle').forEach(el=>el.remove());
  setLessonTab(activeLessonTab);
  renderSelectedModuleLessons();
  document.querySelectorAll('[data-lesson-id]').forEach(el=>{if(el.dataset.lessonId==lesson.id)el.setAttribute('aria-current','page');else el.removeAttribute('aria-current');});
  const current=document.querySelector(`[data-lesson-id="${lesson.id}"]`);if(current){current.closest('.lms-module-body')?.classList.add('expanded');current.closest('.lms-module-box')?.querySelector('button')?.setAttribute('aria-expanded','true');}
  enhanceAccessibility(document.getElementById('lms-main-content'));
}
function nextExercise(){const cards=[...document.querySelectorAll('.quiz-container')];const next=cards.find(c=>!c.querySelector('.quiz-feedback.success'));if(next){next.scrollIntoView({block:'center',behavior:'smooth'});next.querySelector('button:not(:disabled)')?.focus();}else if(activeLesson){const next=adjacentLesson(activeLesson.modId,activeLesson.lessonId,1);if(next){activeLessonTab='exercises';loadLessonContent(next.modId,next.lessonId);}else showToast('Exercícios desta aula concluídos.');}}
function openCertificatePreview(){let el=document.getElementById('certificate-preview-modal');if(!el){el=document.createElement('div');el.className='modal-overlay';el.id='certificate-preview-modal';el.innerHTML='<div class="modal-card"><button class="close-btn" aria-label="Fechar exemplo" onclick="closeModal(\'certificate-preview-modal\')">×</button><h2>Certificado IDZ</h2><img src="assets/certificado-idz-clean-template.png" alt="Template oficial do certificado IDZ"><p>Exemplo do template oficial. Os dados são preenchidos na emissão após a conclusão.</p></div>';document.body.append(el);}openModal(el.id);}
function enhanceAccessibility(root=document){
  root.querySelectorAll('.input-group').forEach(group=>{const label=group.querySelector('label'),input=group.querySelector('input,select,textarea');if(label&&input?.id&&!label.htmlFor)label.htmlFor=input.id;});
  root.querySelectorAll('button').forEach(button=>{if(!button.textContent.trim()&&!button.getAttribute('aria-label'))button.setAttribute('aria-label',button.title|| (button.classList.contains('close-btn')?'Fechar':'Mostrar opções'));});
  root.querySelectorAll('img').forEach(img=>{img.decoding='async';});
  root.querySelectorAll('table').forEach(table=>{const headers=[...table.querySelectorAll('th')].map(x=>x.textContent);table.querySelectorAll('tbody tr').forEach(tr=>[...tr.children].forEach((td,i)=>{if(!td.hasAttribute('colspan'))td.dataset.label=headers[i]||'';}));});
}
function focusModal(el){if(!el)return;el.setAttribute('role','dialog');el.setAttribute('aria-modal','true');el.setAttribute('aria-label',el.querySelector('h2,h3')?.textContent||'Janela IDZ');el._trigger=document.activeElement;setTimeout(()=>el.querySelector('button,input,[href]')?.focus(),0);}
document.addEventListener('keydown',event=>{
  const drawer=document.getElementById('idz20a-drawer');const modals=[...document.querySelectorAll('.modal-overlay.active')].sort((a,b)=>Number(a.style.zIndex)-Number(b.style.zIndex));const dialog=!drawer.hidden?drawer:modals.at(-1);
  if(event.key==='Escape'&&dialog){if(dialog===drawer)closeNavigationDrawer();else if(dialog.id==='modal-custom-checkout')closeCheckoutModalSafe();else closeModal(dialog.id);}
  if(event.key==='Tab'&&dialog){const focusable=[...dialog.querySelectorAll('button:not(:disabled),a[href],input,select,textarea,[tabindex="0"]')].filter(el=>el.getClientRects().length);const first=focusable[0],last=focusable.at(-1);if(event.shiftKey&&document.activeElement===first){event.preventDefault();last?.focus();}else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first?.focus();}}
  if(event.target.matches('[data-lesson-tab]')&&['ArrowLeft','ArrowRight','Home','End'].includes(event.key)){event.preventDefault();const tabs=[...document.querySelectorAll('[data-lesson-tab]')];let index=tabs.indexOf(event.target);index=event.key==='Home'?0:event.key==='End'?tabs.length-1:(index+(event.key==='ArrowRight'?1:-1)+tabs.length)%tabs.length;tabs[index].click();tabs[index].focus();}
});
document.getElementById('idz20a-backdrop').addEventListener('click',()=>closeNavigationDrawer());
renderPublicCourse();renderNavigation();enhanceAccessibility();
