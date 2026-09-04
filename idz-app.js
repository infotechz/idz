const courseV2 = window.IDZ_COURSE_V2 || { modules: [] };
const RAILWAY_BACKEND_URL = "https://backend-informatica-do-zero-production.up.railway.app";
const ADMIN_COMPAT_LOGIN_URL = "https://backend-informatica-do-zero-production.up.railway.app/admin/compat-login";
const TARGET_ADMIN_EMAIL = "olliveirazvz@gmail.com";
window.IDZ_AUTH_STATE = window.IDZ_AUTH_STATE || 'AUTH_LOADING';

function safeSetText(id, text) {
  const el = document.getElementById(id);
  if (el) el.innerText = text;
}
function safeSetHTML(id, html) {
  const el = document.getElementById(id);
  if (el) el.innerHTML = html;
}
function safeGetValue(id) {
  const el = document.getElementById(id);
  return el ? el.value.trim() : '';
}
function safeSetValue(id, val) {
  const el = document.getElementById(id);
  if (el) el.value = val;
}
function escapeHTML(value = '') {
  return String(value).replace(/[&<>'"]/g, char => ({
    '&':'&amp;', '<':'&lt;', '>':'&gt;', "'":'&#39;', '"':'&quot;'
  })[char]);
}
function normalizeEmail(value = '') {
  return String(value).trim().toLowerCase();
}
function isSafeHttpUrl(value = '') {
  try { const url = new URL(value); return ['https:','http:'].includes(url.protocol); }
  catch { return false; }
}

const canvas = document.getElementById('particles-canvas');
const ctx = canvas ? canvas.getContext('2d') : null;
let particlesArray = [];
let particlesFrame = 0;
let particlesRunning = false;
let particlesResizeTimer = 0;
let particlesLastPaint = 0;
let particlesColor = '#49d9ef';
function refreshParticlesColor() {
  particlesColor = getComputedStyle(document.body).getPropertyValue('--accent-cyan').trim() || '#49d9ef';
}
function resizeCanvas() { 
  if (canvas) {
    const ratio = Math.min(window.devicePixelRatio || 1, 1.5);
    canvas.width = Math.floor(window.innerWidth * ratio);
    canvas.height = Math.floor(window.innerHeight * ratio);
    canvas.style.width = window.innerWidth + 'px';
    canvas.style.height = window.innerHeight + 'px';
    ctx?.setTransform(ratio, 0, 0, ratio, 0, 0);
  }
}
window.addEventListener('resize', () => {
  clearTimeout(particlesResizeTimer);
  particlesResizeTimer = setTimeout(() => { resizeCanvas(); initParticles(); }, 140);
}, { passive: true });
resizeCanvas();

class Particle {
  constructor() {
    this.x = Math.random() * window.innerWidth;
    this.y = Math.random() * window.innerHeight;
    this.depth = Math.random() * .8 + .2;
    this.size = (Math.random() * 1.8 + 0.55) * this.depth;
    this.speedX = (Math.random() - 0.42) * 0.52 * this.depth;
    this.speedY = (Math.random() - 0.5) * 0.38 * this.depth;
    this.opacity = Math.random() * 0.42 + 0.16;
    this.phase = Math.random() * Math.PI * 2;
  }
  update() {
    if (!canvas) return;
    this.x += this.speedX; this.y += this.speedY; this.phase += .006 + this.depth * .004;
    if (this.x < -8) this.x = window.innerWidth + 8; if (this.x > window.innerWidth + 8) this.x = -8;
    if (this.y < -8) this.y = window.innerHeight + 8; if (this.y > window.innerHeight + 8) this.y = -8;
  }
  draw() {
    if (!ctx) return;
    ctx.save(); ctx.globalAlpha = this.opacity * (.72 + Math.sin(this.phase) * .28);
    ctx.fillStyle = particlesColor;
    ctx.beginPath(); ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2); ctx.fill(); ctx.restore();
  }
}
function initParticles() {
  if (!canvas) return;
  particlesArray = [];
  const area = window.innerWidth * window.innerHeight;
  let numberOfParticles = window.innerWidth < 600 ? Math.min(30, Math.max(20, Math.floor(area / 19000))) : Math.min(60, Math.max(40, Math.floor(area / 27000)));
  for (let i = 0; i < numberOfParticles; i++) particlesArray.push(new Particle());
}
function animateParticles(timestamp = 0) {
  if (!ctx || !canvas) return;
  if (!particlesRunning || document.hidden || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  // Em celulares o fundo anima a ~30 FPS: mantém o efeito sem disputar a thread principal.
  if (window.innerWidth < 600 && timestamp - particlesLastPaint < 33) {
    particlesFrame = requestAnimationFrame(animateParticles);
    return;
  }
  particlesLastPaint = timestamp;
  ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
  particlesArray.forEach(p => { p.update(); p.draw(); });
  particlesFrame = requestAnimationFrame(animateParticles);
}
function startParticles(){ if (particlesRunning || document.hidden) return; particlesRunning = true; particlesFrame = requestAnimationFrame(animateParticles); }
function stopParticles(){ particlesRunning = false; if (particlesFrame) cancelAnimationFrame(particlesFrame); }
document.addEventListener('visibilitychange', () => document.hidden ? stopParticles() : startParticles());
refreshParticlesColor(); initParticles(); startParticles();

// ESTRUTURA CURRICULAR V2
const courseV2Runtime = courseV2.modules.map((mod, moduleIndex) => Object.assign({}, mod, {
  id: moduleIndex + 1,
  courseVersion: 2,
  lessons: (mod.lessons || []).map((item, lessonIndex) => Object.assign({}, item, {
    id: (moduleIndex + 1) * 100 + lessonIndex + 1,
    moduleId: moduleIndex + 1,
    quiz: item.exercises?.[0] ? {
      question: item.exercises[0].question,
      options: item.exercises[0].options,
      correct: item.exercises[0].correctAnswer
    } : null
  }))
}));


function selectCourseData(snapshotData) {
  const v2Modules = (snapshotData || []).filter(mod => mod && mod.type !== 'bonus' && !String(mod.id || '').startsWith('bonus-'));
  const hasV2 = v2Modules.length === 12 && v2Modules.every(mod => mod.courseVersion === 2 || mod.type === 'lesson' || mod.type === 'project');
  if (!hasV2 && snapshotData.length) {
    try {
      localStorage.setItem('course_migration_v1_history', JSON.stringify({
        savedAt: new Date().toISOString(),
        modules: snapshotData
      }));
    } catch (_) {}
  }
  return hasV2
    ? normalizeCourseData(v2Modules)
    : normalizeCourseData(courseV2Runtime);
}


let courseData = [];
let registeredUsers = [];
let salesTransactions = JSON.parse(localStorage.getItem('admin_sales_transactions')) || [];
let notificationsList = [];
let completedLessons = JSON.parse(localStorage.getItem('user_completed_lessons')) || {};
let completedQuizzes = JSON.parse(localStorage.getItem('user_completed_quizzes')) || {};
let completedProjects = JSON.parse(localStorage.getItem('user_completed_projects')) || {};
let completedBonuses = JSON.parse(localStorage.getItem('user_completed_bonuses')) || {};

let currentUser = null;
let currentUserUid = null;
let usersUnsubscribe = null;
let isAdmin = false;
let videoWatchedState = {};
let cardFormController = null;
let currentCheckoutAmount = 29.90;
let appliedCouponCode = '';
let checkoutTargetUser = null;
let activePaymentInterval = null;
let pixCountdownInterval = null;
let verificationResendAvailableAt = 0;
let activeManagedStudentUid = '';
let managedStudentData = null;

function normalizeLessonContent(lesson) {
  if (!lesson) return lesson;
  const title = lesson.title || `Aula ${lesson.id}`;
  const bloco1 = lesson.bloco1 || lesson.introduction || 'Conceitos fundamentais do tema.';
  const bloco2 = lesson.bloco2 || lesson.description || 'Aplicação prática do conteúdo.';
  const bloco3 = lesson.bloco3 || 'Boas práticas e revisão.';
  const base = { ...lesson,
    introduction: lesson.introduction || bloco1,
    description: lesson.description || bloco2,
    objectives: lesson.objectives || [bloco1, bloco2, bloco3],
    learningOutcomes: lesson.learningOutcomes || [
      `Explicar os conceitos apresentados em ${title}.`,
      `Aplicar ${bloco2.toLowerCase()}`
    ],
    contentSummary: lesson.contentSummary || `${bloco1} ${bloco2} ${bloco3}`,
    practicalExample: lesson.practicalExample || `Pratique o conteúdo de ${title.toLowerCase()} em uma tarefa do dia a dia.`,
    commonMistakes: lesson.commonMistakes || ['Pular a prática antes de revisar os conceitos.', 'Não conferir o resultado final.'],
    finalSummary: lesson.finalSummary || `Revise ${title.toLowerCase()} e refaça o exemplo prático.`
  };
  if (!Array.isArray(base.exercises) || base.exercises.length < 3) {
    const oldQuiz = base.quiz;
    const options = oldQuiz?.options || ['Aplicar o conceito principal', 'Ignorar o conteúdo', 'Apagar os dados', 'Não realizar a atividade'];
    base.exercises = [
      { id: `${lesson.id}-1`, number: 1, title: 'Verificação de compreensão', question: oldQuiz?.question || `Qual é o objetivo principal de ${title.toLowerCase()}?`, options, correctAnswer: oldQuiz?.correct ?? 0, explanation: `A resposta está relacionada a: ${bloco1}`, difficulty: 'facil', mandatory: true, estimatedMinutes: 3 },
      { id: `${lesson.id}-2`, number: 2, title: 'Aplicação prática', question: `Qual ação coloca em prática o conteúdo de ${title.toLowerCase()}?`, options: [`Executar: ${bloco2}`, 'Pular a etapa prática', 'Compartilhar senha', 'Apagar o trabalho'], correctAnswer: 0, explanation: bloco2, difficulty: 'medio', mandatory: true, estimatedMinutes: 5 },
      { id: `${lesson.id}-3`, number: 3, title: 'Boas práticas', question: `Qual atitude ajuda a evitar erros em ${title.toLowerCase()}?`, options: [`Seguir: ${bloco3}`, 'Ignorar instruções', 'Usar dados aleatórios', 'Não revisar'], correctAnswer: 0, explanation: bloco3, difficulty: 'medio', mandatory: false, estimatedMinutes: 4 }
    ];
  }
  return base;
}

function normalizeCourseData(modules) {
  return (modules || []).map(mod => ({ ...mod, lessons: (mod.lessons || []).map(normalizeLessonContent) }));
}

function showCustomAlert(title, message) {
  safeSetText('custom-alert-title', title);
  safeSetText('custom-alert-text', message);
  openModal('custom-alert-modal');
}
function closeCustomAlert() { closeModal('custom-alert-modal'); }

function showSuccessModal(msg) {
  safeSetText('success-modal-text', msg);
  openModal('success-modal');
}
function closeSuccessModal() { closeModal('success-modal'); }
function showToast(message,type='info'){
  const stack=document.getElementById('idz-toast-stack');if(!stack)return;
  const toast=document.createElement('div');toast.className=`idz-toast ${['success','error','warning','info'].includes(type)?type:'info'}`;toast.setAttribute('role','status');toast.textContent=String(message||'');stack.appendChild(toast);
  setTimeout(()=>toast.remove(),4200);
}

function currentProfile() {
  return registeredUsers.find(u => u.uid === currentUserUid) || registeredUsers.find(u => u.email === currentUser) || null;
}
function progressKey() { return currentUserUid || currentUser || 'anonymous'; }

function lessonExercises(lesson) {
  return Array.isArray(lesson?.exercises) ? lesson.exercises : [];
}

function isExerciseCompleted(lesson, exercise) {
  const saved = completedQuizzes[progressKey()] || {};
  // Compatibilidade com o progresso antigo, que gravava somente o ID da aula.
  return saved[exercise.id] === true || saved[lesson.id] === true;
}

function isLessonCompleted(lesson) {
  const lessonDone = completedLessons[progressKey()]?.[lesson.id] === true;
  const mandatory = lessonExercises(lesson).filter(exercise => exercise.mandatory !== false);
  return lessonDone && mandatory.every(exercise => isExerciseCompleted(lesson, exercise));
}

function finalProjectSteps() {
  return Array.isArray(courseV2.finalProject?.steps) ? courseV2.finalProject.steps : [];
}

function isProjectStepCompleted(stepId) {
  return completedProjects[progressKey()]?.[stepId] === true;
}

function getCourseProgressStats() {
  let totalLessons = 0;
  let completedLessonCount = 0;
  let totalExercises = 0;
  let completedExerciseCount = 0;
  let completedProjectStepCount = 0;
  courseData.forEach(module => module.lessons?.forEach(lesson => {
    totalLessons += 1;
    if (isLessonCompleted(lesson)) completedLessonCount += 1;
    lessonExercises(lesson).filter(exercise => exercise.mandatory !== false).forEach(exercise => {
      totalExercises += 1;
      if (isExerciseCompleted(lesson, exercise)) completedExerciseCount += 1;
    });
  }));
  const totalProjectSteps = finalProjectSteps().length;
  finalProjectSteps().forEach(step => {
    if (isProjectStepCompleted(step.id)) completedProjectStepCount += 1;
  });
  const totalRequired = totalLessons + totalExercises + totalProjectSteps;
  const completedRequired = completedLessonCount + completedExerciseCount + completedProjectStepCount;
  const completedModuleCount = courseData.filter(module => (module.lessons || []).length > 0 && module.lessons.every(isLessonCompleted)).length;
  const totalBonuses = Array.isArray(courseV2.bonuses) ? courseV2.bonuses.length : 0;
  const completedBonusCount = (courseV2.bonuses || []).filter(bonus => completedBonuses[progressKey()]?.[bonus.id] === true).length;
  return {
    totalLessons, completedLessonCount, totalExercises, completedExerciseCount,
    totalProjectSteps, completedProjectStepCount, completedModuleCount, totalModules:12, totalBonuses, completedBonusCount,
    totalRequired, completedRequired,
    percent: totalRequired ? Math.round((completedRequired / totalRequired) * 100) : 0,
    complete: totalRequired > 0 && completedRequired === totalRequired
  };
}

function autoCompleteEmail(inputId) {
  let val = safeGetValue(inputId);
  if (val && !val.includes('@')) {
    safeSetValue(inputId, val + '@gmail.com');
  }
}

function isValidFullName(name) {
  if (!name || typeof name !== 'string') return false;
  const parts = name.trim().split(/\s+/);
  if (parts.length < 2) return false;
  for (let p of parts) {
    if (p.length < 2 || /^([a-zA-Z])\1+$/.test(p)) return false;
  }
  return true;
}

let authBootstrapStarted = false;
function startAuthBootstrap() {
  if (authBootstrapStarted) return;
  authBootstrapStarted = true;
  const rememberedEmail = localStorage.getItem('remembered_email');
  if (rememberedEmail) {
    safeSetValue('login-email', rememberedEmail);
    const remElem = document.getElementById('remember-me');
    if (remElem) remElem.checked = true;
  }

  /* A área pública sempre inicia no Azul IDZ; preferências só são carregadas após autenticação. */
  changeTheme('azul', false);

  const checkDbInterval = setInterval(() => {
    // Auth é suficiente para restaurar a sessão e atualizar o menu.
    // Firestore pode chegar depois, sem bloquear os handlers básicos.
    if (window.auth && window.firebaseModules) {
      clearInterval(checkDbInterval);
      const { collection, onSnapshot, doc, setDoc, getDoc, getDocs, onAuthStateChanged } = window.firebaseModules;

      onAuthStateChanged(window.auth, async (user) => {
        // O menu deve refletir o Auth imediatamente, sem esperar Firestore.
        // Dados privados continuam sendo carregados abaixo, depois desta atualização.
        updateNavState(!!user, user?.email || null, user ? 'STUDENT' : 'VISITOR');
        if (user) {
          currentUser = user.email;
          currentUserUid = user.uid;
          if (currentUser && completedLessons[currentUser] && !completedLessons[user.uid]) completedLessons[user.uid] = completedLessons[currentUser];
          if (currentUser && completedQuizzes[currentUser] && !completedQuizzes[user.uid]) completedQuizzes[user.uid] = completedQuizzes[currentUser];
          localStorage.setItem('user_completed_lessons', JSON.stringify(completedLessons));
          localStorage.setItem('user_completed_quizzes', JSON.stringify(completedQuizzes));
          let tokenClaims = {};
          try { tokenClaims = (await user.getIdTokenResult()).claims || {}; } catch (_) {}
          isAdmin = tokenClaims.admin === true;
          window.IDZ_ADMIN_CLAIM = isAdmin;
          updateNavState(true, currentUser, isAdmin ? 'ADMIN' : 'STUDENT');

          try {
            // Usuários comuns leem somente o próprio documento UID. A coleção
            // completa só é carregada para o painel administrativo.
            const uidRef = doc(window.db, 'users', user.uid);
            const uidSnap = await getDoc(uidRef);
            let uObj = uidSnap.exists() ? uidSnap.data() : null;
            if (!uObj) {
              const legacyId = currentUser.replace(/[^a-z0-9]/gi, '_');
              const legacySnap = await getDoc(doc(window.db, 'users', legacyId));
              if (legacySnap.exists()) {
                uObj = { ...legacySnap.data(), uid: user.uid, email: currentUser };
                await setDoc(uidRef, uObj, { merge: true });
              }
            }
            if (!uObj && isAdmin) {
              const snap = await getDocs(collection(window.db, 'users'));
              const legacy = snap.docs.map(d => d.data()).find(u => u.email?.toLowerCase() === currentUser.toLowerCase());
              if (legacy) {
                uObj = { ...legacy, uid: user.uid, email: currentUser };
                await setDoc(uidRef, uObj, { merge: true });
              }
            }
            
            if (!uObj) {
              uObj = {
                uid: user.uid,
                email: currentUser,
                paid: isAdmin,
                role: isAdmin ? 'admin' : 'student',
                emailVerified: !!user.emailVerified,
                fullname: user.displayName || currentUser.split('@')[0],
                createdAt: new Date().toISOString()
              };
              await setDoc(uidRef, uObj);
            }
            uObj = { ...uObj, uid: user.uid, email: currentUser, emailVerified: !!user.emailVerified };
            registeredUsers = isAdmin ? registeredUsers : [uObj];

            // /progress/{uid} é a fonte principal; o campo legado do usuário
            // continua sendo aceito para preservar conclusões anteriores.
            try {
              const progressSnap = await getDoc(doc(window.db, 'progress', user.uid));
              const cloudProgress = progressSnap.exists() ? progressSnap.data() : (uObj.progress || {});
              completedLessons[user.uid] = { ...(completedLessons[user.uid] || {}), ...(cloudProgress.courseProgress?.lessons || {}), ...(cloudProgress.lessons || {}) };
              completedQuizzes[user.uid] = { ...(completedQuizzes[user.uid] || {}), ...(cloudProgress.exercises || {}) };
              completedProjects[user.uid] = { ...(completedProjects[user.uid] || {}), ...(cloudProgress.finalProjectProgress || {}), ...(cloudProgress.projects || {}) };
              completedBonuses[user.uid] = { ...(completedBonuses[user.uid] || {}), ...(cloudProgress.bonusProgress || {}), ...(cloudProgress.bonuses || {}) };
              localStorage.setItem('user_completed_lessons', JSON.stringify(completedLessons));
              localStorage.setItem('user_completed_quizzes', JSON.stringify(completedQuizzes));
              localStorage.setItem('user_completed_projects', JSON.stringify(completedProjects));
              localStorage.setItem('user_completed_bonuses', JSON.stringify(completedBonuses));
            } catch (progressError) {
              console.warn('Não foi possível carregar o progresso da nuvem.', progressError);
            }

            isAdmin = tokenClaims.admin === true;
            if (isAdmin && !usersUnsubscribe) {
              usersUnsubscribe = onSnapshot(collection(window.db, 'users'), (snapshot) => {
                registeredUsers = snapshot.docs.map(docSnap => docSnap.data());
                if (document.getElementById('admin-area')?.style.display === 'block') {
                  renderDashboard();
                  populateTestStudentSelect();
                }
              });
            }
            changeTheme(localStorage.getItem(`app_theme_${user.uid}`) || 'azul', false);
            loadNotificationsForCurrentAccount();
            updateNavState(true, currentUser, isAdmin ? 'ADMIN' : 'STUDENT');

            if (!user.emailVerified && !isAdmin && user.providerData.every(p => p.providerId === 'password')) {
              showEmailVerificationGate(user);
            } else if (isAdmin) {
              // A área administrativa é a tela inicial do Admin, mesmo quando
              // a leitura do Firestore demora ou falha.
              showAdminArea();
            } else if (uObj && uObj.paid) {
              showMemberArea();
            } else {
              showPublicSite();
            }
          } catch(err) {
            console.error("Erro ao sincronizar Firestore:", err);
            updateNavState(true, currentUser, isAdmin ? 'ADMIN' : 'STUDENT');
            if (isAdmin) showAdminArea();
            else showPublicSite();
          }
        } else {
          currentUser = null;
          currentUserUid = null;
          if (usersUnsubscribe) { usersUnsubscribe(); usersUnsubscribe = null; }
          isAdmin = false;
          notificationsList = [];
          changeTheme('azul', false);
          updateNavState(false, null, 'VISITOR');
          updateNotificationsBadge();
          showPublicSite();
        }
      });

      if (window.db) onSnapshot(collection(window.db, "modules"), (snapshot) => {
        const snapshotData = snapshot.docs.map(docSnap => docSnap.data());
        courseData = selectCourseData(snapshotData);
        courseData.sort((a, b) => Number(a.id) - Number(b.id));
        updateCourseStatsUI();

        if (currentUser && document.getElementById('member-area')?.style.display === 'block') {
          renderMemberSidebar();
          updateStudentDashboard();
        }
        if (isAdmin && document.getElementById('admin-area')?.style.display === 'block') {
          renderAdminModules();
          renderDashboard();
        }
      });

    }
  }, 100);

  updateNotificationsBadge();
}

// Não aguarde o evento load: recursos opcionais (Messaging/fontes) podem atrasá-lo.
// Assim que o módulo Auth estiver disponível, a sessão é restaurada e o menu atualizado.
window.addEventListener('load', startAuthBootstrap, { once: true });
const authReadyPoll = setInterval(() => {
  if (window.auth && window.firebaseModules) {
    clearInterval(authReadyPoll);
    startAuthBootstrap();
  }
}, 50);

function closeNavigationDrawer() {
  document.getElementById('idz20a-drawer')?.classList.remove('open');
  document.getElementById('idz20a-backdrop')?.classList.remove('open');
  document.getElementById('mobile-menu')?.classList.remove('active');
  document.getElementById('mobile-overlay')?.classList.remove('active');
}

function idzNavigationItems(state) {
  if (state === 'AUTH_LOADING') return [{ icon: 'fa-spinner', label: 'Carregando sessão…', action: 'noop' }];
  if (state === 'ADMIN') return [
    { icon: 'fa-house', label: 'Início', action: 'home' },
    { icon: 'fa-gauge-high', label: 'Visão geral', action: 'admin' },
    { icon: 'fa-users', label: 'Alunos', action: 'admin-students' },
    { icon: 'fa-layer-group', label: 'Conteúdo', action: 'admin-content' },
    { icon: 'fa-wallet', label: 'Financeiro', action: 'admin-finance' },
    { icon: 'fa-headset', label: 'Atendimentos', action: 'admin-support' },
    { icon: 'fa-certificate', label: 'Certificados', action: 'admin-certificates' },
    { icon: 'fa-ticket', label: 'Cupons', action: 'admin-coupons' },
    { icon: 'fa-gear', label: 'Configurações', action: 'settings' },
    { icon: 'fa-graduation-cap', label: 'Acessar aulas', action: 'lessons' },
    { icon: 'fa-right-from-bracket', label: 'Sair', action: 'logout', danger: true }
  ];
  if (state === 'STUDENT') return [
    { icon: 'fa-house', label: 'Início', action: 'home' },
    { icon: 'fa-graduation-cap', label: 'Aulas', action: 'lessons' },
    { icon: 'fa-chart-line', label: 'Progresso', action: 'progress' },
    { icon: 'fa-award', label: 'Certificado', action: 'certificate' },
    { icon: 'fa-headset', label: 'Suporte', action: 'support' },
    { icon: 'fa-user', label: 'Perfil', action: 'profile' },
    { icon: 'fa-gear', label: 'Configurações', action: 'settings' },
    { icon: 'fa-right-from-bracket', label: 'Sair', action: 'logout', danger: true }
  ];
  return [
    { icon: 'fa-user', label: 'Entrar / Criar conta', action: 'auth' },
    { icon: 'fa-house', label: 'Início', action: 'home' },
    { icon: 'fa-book-open', label: 'Conhecer o curso', action: 'course' },
    { icon: 'fa-cart-shopping', label: 'Comprar', action: 'buy' }
  ];
}

function navigationButton(item, className = '') {
  return `<button type="button" class="${className}${item.danger ? ' danger' : ''}" data-idz-nav-action="${item.action}"><i class="fa-solid ${item.icon}"></i><span>${escapeHTML(item.label)}</span></button>`;
}

function renderNavigation() {
  const state = window.IDZ_AUTH_STATE || 'AUTH_LOADING';
  const items = idzNavigationItems(state);
  const nativeMenu = document.getElementById('mobile-menu-options');
  const drawerBody = document.getElementById('idz20a-drawer-body');
  if (nativeMenu) nativeMenu.innerHTML = items.map(item => navigationButton(item)).join('');
  if (drawerBody) drawerBody.innerHTML = `<div class="idz20a-menu-group"><span class="idz20a-menu-title">NAVEGAÇÃO</span>${items.map(item => navigationButton(item, 'idz20a-menu-item')).join('')}</div>`;
}
window.renderNavigation = renderNavigation;

function openSettingsSection(name) {
  showSettingsArea();
  const tab = [...document.querySelectorAll('.settings-tab-btn')]
    .find(button => (button.textContent || '').trim().toLowerCase() === name);
  if (tab) switchSettingsTab({ currentTarget: tab }, name);
}

function navigateIdz(action) {
  closeNavigationDrawer();
  if (action === 'noop') return;
  if (action === 'auth') return openAuthModal('login');
  if (action === 'home') return showPublicSite();
  if (action === 'course') return document.querySelector('.hero, #course-details')?.scrollIntoView({ behavior: 'smooth' });
  if (action === 'buy') return handlePurchaseAction();
  if (action === 'lessons') return showMemberArea();
  if (action === 'progress') { showMemberArea(); return document.getElementById('student-welcome-title')?.scrollIntoView({ behavior: 'smooth', block: 'start' }); }
  if (action === 'certificate') { showMemberArea(); return document.querySelector('[onclick*="generateOfficialCertificatePDF"]')?.scrollIntoView({ behavior: 'smooth', block: 'center' }); }
  if (action === 'support') return openSettingsSection('suporte');
  if (action === 'profile') return openSettingsSection('perfil');
  if (action === 'settings') return showSettingsArea();
  if (action === 'logout') return logout();
  if (action === 'admin') return showAdminArea();
  const adminSections = { 'admin-students': 'alunos', 'admin-content': 'modules', 'admin-finance': 'vendas', 'admin-support': 'support', 'admin-certificates': 'certificates', 'admin-coupons': 'coupons' };
  if (adminSections[action]) { showAdminArea(); return switchAdminTab(adminSections[action]); }
}

if (!window.__idzNavigationDelegationBound) {
  window.__idzNavigationDelegationBound = true;
  document.addEventListener('click', (event) => {
    const button = event.target.closest('[data-idz-nav-action]');
    if (!button) return;
    event.preventDefault();
    navigateIdz(button.dataset.idzNavAction);
  });
}

function updateNavState(isLoggedIn, email, requestedState) {
  const navGuest = document.getElementById('nav-guest');
  const navUser = document.getElementById('nav-user');
  const state = requestedState || (isLoggedIn ? (isAdmin ? 'ADMIN' : 'STUDENT') : 'VISITOR');
  window.IDZ_AUTH_STATE = state;

  document.querySelectorAll('[data-auth-only],#logout-btn,[onclick*="logout()"]')
    .forEach(el => { el.style.display = isLoggedIn ? '' : 'none'; });

  if (isLoggedIn) {
    if (navGuest) navGuest.style.display = 'none';
    if (navUser) navUser.style.display = 'flex';
    safeSetText('user-display', email);
    updateNavAvatar();

    safeSetText('hero-btn-text', isAdmin ? "IR AO PAINEL ADMIN" : "ACESSAR MINHAS AULAS");
  } else {
    if (navGuest) navGuest.style.display = 'block';
    if (navUser) navUser.style.display = 'none';
    /* Visitante: nunca exibir ações privadas ou logout. */
    safeSetText('hero-btn-text', "ACESSAR MINHA CONTA");
  }
  renderNavigation();
}

function changeTheme(themeName, save = true) {
  const allowed = ['azul','roxo','vermelho','rosa','rgb'];
  const selected = allowed.includes(themeName) ? themeName : 'azul';
  allowed.forEach(theme => document.body.classList.remove(`theme-${theme}`));
  document.body.classList.add(`theme-${selected}`);
  refreshParticlesColor();
  if(save && currentUser) localStorage.setItem(`app_theme_${window.auth?.currentUser?.uid || currentUser}`, selected);
}

function notificationOwnerKey(audience = isAdmin ? 'admin' : 'student', userId = null) {
  if (audience === 'admin') return `notifications_admin_${TARGET_ADMIN_EMAIL}`;
  const owner = userId || window.auth?.currentUser?.uid || currentUser || 'guest';
  return `notifications_student_${owner}`;
}

async function loadNotificationsForCurrentAccount() {
  if (!currentUser) { notificationsList = []; updateNotificationsBadge(); return; }
  const key = notificationOwnerKey(isAdmin ? 'admin' : 'student');
  notificationsList = JSON.parse(localStorage.getItem(key) || '[]');
  if (window.db && window.firebaseModules) {
    try {
      const { collection, getDocs, query, where, limit } = window.firebaseModules;
      const uid = window.auth?.currentUser?.uid;
      const filter = isAdmin ? where('audience', '==', 'admin') : where('uid', '==', uid);
      const snap = await getDocs(query(collection(window.db, 'notifications'), filter, limit(100)));
      const cloudItems = snap.docs.map(item => ({ firestoreId:item.id, ...item.data() }));
      notificationsList = [...cloudItems, ...notificationsList]
        .filter((item, index, all) => all.findIndex(other => String(other.id) === String(item.id)) === index)
        .sort((a,b) => Number(b.createdAt || b.id || 0) - Number(a.createdAt || a.id || 0))
        .slice(0,100);
      localStorage.setItem(key, JSON.stringify(notificationsList));
    } catch (error) { console.warn('Notificações em nuvem indisponíveis.', error); }
  }
  updateNotificationsBadge();
}

function showEmailVerificationGate(user) {
  ['public-site','member-area','admin-area','settings-area'].forEach(id => { const el=document.getElementById(id); if(el) el.style.display='none'; });
  showCustomAlert('Verifique seu e-mail', `Enviamos um link de confirmação para ${user.email}. Confirme a conta para acessar as aulas.`);
  const modal = document.getElementById('modal-auth');
  if (modal) {
    switchAuthTab('login');
    openModal('modal-auth');
    const box = modal.querySelector('.auth-box');
    if (box && !box.querySelector('#verification-actions')) {
      const actions = document.createElement('div');
      actions.id = 'verification-actions';
      actions.style.cssText = 'margin-top:14px;display:flex;gap:8px;flex-wrap:wrap';
      actions.innerHTML = `<button type="button" class="btn-outline" onclick="resendVerificationEmail()">Reenviar e-mail</button><button type="button" class="btn-primary" onclick="refreshVerificationStatus()">Já confirmei</button>`;
      box.appendChild(actions);
    }
  }
}

async function resendVerificationEmail() {
  const now = Date.now();
  if (now < verificationResendAvailableAt) {
    const seconds = Math.ceil((verificationResendAvailableAt - now) / 1000);
    showCustomAlert('Aguarde um pouco', 'Você poderá reenviar o e-mail em ' + seconds + 's.');
    return;
  }
  try {
    await window.firebaseModules.sendEmailVerification(window.auth.currentUser);
    verificationResendAvailableAt = Date.now() + 60000;
    showSuccessModal('E-mail reenviado. Verifique também a pasta de spam.');
  } catch (_) {
    showCustomAlert('Não foi possível reenviar agora', 'Verifique sua conexão e tente novamente em instantes.');
  }
}

async function refreshVerificationStatus() {
  const user = window.auth.currentUser;
  if (!user) return;
  await user.reload();
  if (user.emailVerified) { closeModal('modal-auth'); window.location.reload(); }
  else showCustomAlert('Ainda não confirmado', 'Abra o link recebido no e-mail e tente novamente.');
}

function updateCourseStatsUI() {
  const totalMod = 12;
  let totalLes = 0;
  courseData.forEach(m => { if(m.lessons) totalLes += m.lessons.length; });

  safeSetHTML('hero-tag-lessons', `<i class="fa-solid fa-bolt"></i> FORMAÇÃO COMPLETA • ${totalLes} AULAS EM ${totalMod} MÓDULOS`);
  safeSetHTML('benefit-lessons-count', `<i class="fa-solid fa-check"></i> ${totalLes} Aulas práticas em ${totalMod} Módulos`);
  safeSetHTML('sidebar-title-header', `<i class="fa-solid fa-book-open"></i> Conteúdo do Curso`);
  safeSetHTML('admin-total-modules-lessons', `${totalMod} Módulos • Projeto Final 7 etapas • 3 Bônus`);
}

async function saveCourseToCloud(successMsg = "Alterações salvas com sucesso!") {
  if (!window.db) return;
  const { doc, setDoc } = window.firebaseModules;
  try {
    for (const mod of courseData) {
      await setDoc(doc(window.db, "modules", mod.id.toString()), mod);
    }
    showSuccessModal(successMsg);
  } catch (err) {
    showCustomAlert("Erro no Banco", "Erro ao sincronizar dados com a nuvem.");
  }
}

async function saveUserToCloud(userObj) {
  if (!window.db) return;
  const { doc, setDoc } = window.firebaseModules;
  try {
    const uid = userObj.uid || window.auth?.currentUser?.uid;
    userObj.updatedAt = new Date().toISOString();
    if (!uid) throw new Error('UID ausente');
    await setDoc(doc(window.db, "users", uid), { ...userObj, uid }, { merge: true });
  } catch (err) {
    console.error("Erro ao salvar usuário:", err);
  }
}

async function saveProgressToCloud() {
  const uid = window.auth?.currentUser?.uid;
  if (!uid || !window.db) return;
  try {
    const { doc, setDoc } = window.firebaseModules;
    const lessons = completedLessons[progressKey()] || {};
    const exercises = completedQuizzes[progressKey()] || {};
    const projects = completedProjects[progressKey()] || {};
    const bonuses = completedBonuses[progressKey()] || {};
    const progress = {
      uid,
      courseVersion: 2,
      lessons, exercises, projects, bonuses,
      courseProgress: { lessons, exercises },
      finalProjectProgress: projects,
      bonusProgress: bonuses,
      updatedAt: new Date().toISOString()
    };
    await setDoc(doc(window.db, 'progress', uid), progress, { merge:true });
    await setDoc(doc(window.db, 'users', uid), { progress }, { merge:true });
  } catch (e) { console.warn('Progresso será mantido localmente até a próxima sincronização.', e); }
}

function toggleMobileMenu() {
  if (document.getElementById('idz20a-drawer')) {
    const drawer = document.getElementById('idz20a-drawer');
    if (drawer.classList.contains('open')) window.IDZ_PHASE_20A?.closeDrawer?.();
    else window.IDZ_PHASE_20A?.openDrawer?.();
    return;
  }
  const mm = document.getElementById('mobile-menu');
  const mo = document.getElementById('mobile-overlay');
  if (mm) mm.classList.toggle('active');
  if (mo) mo.classList.toggle('active');
}

let modalStackLevel = 6000;
function openModal(id) { 
  const el = document.getElementById(id);
  if (!el) return;
  modalStackLevel += 2;
  el.style.zIndex = String(modalStackLevel);
  el.classList.add('active');
}
function closeModal(id) { 
  const el = document.getElementById(id);
  if (el) el.classList.remove('active'); 
  if(activePaymentInterval) { clearInterval(activePaymentInterval); activePaymentInterval = null; }
  if(pixCountdownInterval) { clearInterval(pixCountdownInterval); pixCountdownInterval = null; }
}

async function destroyCardForm() {
  const controller = cardFormController;
  cardFormController = null;
  if (controller?.unmount) {
    try { await controller.unmount(); } catch (_) {}
  }
  ['form-checkout__cardNumber','form-checkout__expirationDate','form-checkout__securityCode'].forEach(id=>{
    const host=document.getElementById(id);if(host)host.innerHTML='';
  });
}

async function closeCheckoutModalSafe() {
  closeModal('modal-custom-checkout');
  await destroyCardForm();
  resetPixPanel();
  currentCheckoutAmount = 29.90;
  appliedCouponCode = '';
  checkoutTargetUser = null;
}

async function requireFirebaseSession() {
  if (!window.auth) throw new Error('Entre na sua conta para continuar o pagamento.');
  let user=window.auth.currentUser;
  if(!user&&window.firebaseModules?.onAuthStateChanged){
    user=await new Promise(resolve=>{
      let settled=false,unsubscribe=null;
      const finish=value=>{if(settled)return;settled=true;clearTimeout(timer);unsubscribe?.();resolve(value||null)};
      const timer=setTimeout(()=>finish(window.auth.currentUser),2500);
      unsubscribe=window.firebaseModules.onAuthStateChanged(window.auth,finish,()=>finish(null));
    });
  }
  if(!user)throw new Error('Entre na sua conta para continuar o pagamento.');
  const token=await user.getIdToken();
  if(typeof token!=='string'||!token.trim())throw new Error('Sua sessão expirou. Entre novamente para continuar.');
  return {user,token};
}

function friendlyBackendError(response,payload={}){
  if(response.status===401)return 'Sua sessão expirou. Entre novamente para continuar.';
  const raw=String(payload.error||payload.message||'');
  if(/authorization value not present|unauthorized|token invalid|token expir/i.test(raw))return 'Não foi possível autenticar o pagamento. Entre novamente e tente de novo.';
  return raw||'Operação não concluída.';
}

function getFriendlyCheckoutError(error,fallback='Não foi possível carregar o pagamento por cartão. Tente novamente em alguns instantes.'){
  const candidates=[error?.message,error?.error,error?.cause?.message,typeof error==='string'?error:''];
  const message=candidates.map(value=>String(value||'').trim()).find(value=>value&&!/^(undefined|null|\[object Object\])$/i.test(value));
  return message||fallback;
}

async function backendRequest(path, options = {}) {
  const {token}=await requireFirebaseSession();
  const headers=new Headers(options.headers||{});
  headers.set('Content-Type','application/json');
  headers.set('Authorization',`Bearer ${token}`);
  const response = await fetch(`${RAILWAY_BACKEND_URL}${path}`, { ...options, headers });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(friendlyBackendError(response,payload));
  return payload;
}

async function enablePushNotifications() {
  try {
    if (!('Notification' in window)) throw new Error('Este navegador não oferece notificações web.');
    if (Notification.permission === 'denied') throw new Error('As notificações estão bloqueadas neste navegador. Ative a permissão nas configurações do site para receber avisos.');
    const permission=await Notification.requestPermission();if(permission!=='granted')throw new Error('Permissão de notificações não concedida.');
    const configResponse=await fetch(`${RAILWAY_BACKEND_URL}/api/config`),config=await configResponse.json();
    if(!config.webPushVapidPublicKey)throw new Error('Web Push ainda não foi configurado pelo administrador.');
    const registration=await navigator.serviceWorker.register('./firebase-messaging-sw.js');
    if(!window.firebaseMessaging?.messaging)throw new Error('Push não é compatível com este navegador.');
    const token=await window.firebaseMessaging.getToken(window.firebaseMessaging.messaging,{vapidKey:config.webPushVapidPublicKey,serviceWorkerRegistration:registration});
    if(!token)throw new Error('O dispositivo não forneceu um token de notificação.');
    const uid=window.auth.currentUser.uid;
    await window.firebaseModules.setDoc(window.firebaseModules.doc(window.db,'users',uid),{fcmTokens:{[token]:true}},{merge:true});
    showSuccessModal('Notificações ativadas neste dispositivo.');
  } catch(e) { showCustomAlert('Notificações',e.message); }
}

async function applyCheckoutCoupon() {
  const code = safeGetValue('checkout-coupon').toUpperCase();
  const result = document.getElementById('checkout-coupon-result');
  if (!code) { if(result) result.textContent='Digite um cupom.'; return; }
  try {
    const data = await backendRequest('/api/coupons/validate',{method:'POST',body:JSON.stringify({code})});
    appliedCouponCode = code; currentCheckoutAmount = Number(data.finalAmount);
    if(result) result.textContent = `Cupom aplicado: desconto de R$ ${Number(data.discountAmount).toFixed(2).replace('.',',')}. Total R$ ${currentCheckoutAmount.toFixed(2).replace('.',',')}.`;
    updateCheckoutPrice();
    await openCheckoutModal();
    safeSetValue('checkout-coupon', code);
    const nextResult=document.getElementById('checkout-coupon-result');if(nextResult)nextResult.textContent=`Cupom aplicado. Total R$ ${currentCheckoutAmount.toFixed(2).replace('.',',')}.`;
  } catch(e) { appliedCouponCode='';currentCheckoutAmount=29.90;if(result)result.textContent=e.message; }
}

function resetPixPanel() {
  const panel = document.getElementById('pix-payment-panel');
  const image = document.getElementById('pix-qr-image');
  const code = document.getElementById('pix-copy-code');
  if (panel) panel.classList.remove('active');
  if (image) { image.removeAttribute('src'); image.style.display = 'none'; }
  if (code) code.value = '';
  const countdown = document.getElementById('pix-countdown');
  if (countdown) countdown.textContent = '15:00';
}

function showPixPayment(response = {}) {
  const panel = document.getElementById('pix-payment-panel');
  const image = document.getElementById('pix-qr-image');
  const code = document.getElementById('pix-copy-code');
  const status = document.getElementById('pix-status');
  if (!panel || !image || !code || !status) return false;

  const pix = response.pix || response.point_of_interaction?.transaction_data || response.transaction_data || response;
  const copyCode = pix.qr_code || pix.copy_paste || pix.emv || pix.pixCopyPaste || '';
  const rawQr = pix.qr_code_base64 || pix.qrCodeBase64 || pix.qr_code_image || pix.qrCode || '';
  const qrSource = rawQr
    ? (String(rawQr).startsWith('data:') || String(rawQr).startsWith('http') ? rawQr : `data:image/png;base64,${rawQr}`)
    : '';

  if (!copyCode && !qrSource) return false;
  code.value = copyCode;
  status.textContent = pix.ticket_url ? 'Pix criado. Você também pode abrir o comprovante do pagamento.' : 'Pix criado. Pague pelo QR Code ou copie o código abaixo.';
  if (qrSource) { image.src = qrSource; image.style.display = 'block'; }
  panel.classList.add('active');
  const countdown = document.getElementById('pix-countdown');
  const expiresAt = Number(pix.date_of_expiration ? new Date(pix.date_of_expiration).getTime() : 0) || (Date.now() + 15 * 60 * 1000);
  if (pixCountdownInterval) clearInterval(pixCountdownInterval);
  const tick = () => {
    const left = Math.max(0, expiresAt - Date.now());
    const total = Math.floor(left / 1000);
    if (countdown) countdown.textContent = `${String(Math.floor(total / 60)).padStart(2,'0')}:${String(total % 60).padStart(2,'0')}`;
    if (!left) { clearInterval(pixCountdownInterval); pixCountdownInterval = null; if (status) status.textContent = 'Este Pix expirou. Gere um novo pagamento.'; }
  };
  tick(); pixCountdownInterval = setInterval(tick, 1000);
  panel.scrollIntoView({ behavior:'smooth', block:'start' });
  return true;
}

async function copyPixCode() {
  const code = document.getElementById('pix-copy-code')?.value;
  if (!code) { showCustomAlert('QR Code pendente', 'O gateway ainda não devolveu o código Pix. Verifique a configuração do backend.'); return; }
  try {
    await navigator.clipboard.writeText(code);
    showSuccessModal('Código Pix copiado. Abra o app do seu banco e use “Pix Copia e Cola”.');
  } catch {
    const field = document.getElementById('pix-copy-code');
    field?.focus(); field?.select();
    showCustomAlert('Copie o código', 'Selecione e copie manualmente o código Pix exibido.');
  }
}

function openAuthModal(tab) { switchAuthTab(tab); openModal('modal-auth'); }

function switchAuthTab(tab) {
  const btnL = document.getElementById('tab-btn-login'); 
  const btnR = document.getElementById('tab-btn-register');
  const formL = document.getElementById('form-login'); 
  const formR = document.getElementById('form-register');
  
  if (tab === 'login') {
    if (btnL) { btnL.style.background = 'rgba(0,240,255,0.15)'; btnL.style.color = 'var(--accent-cyan)'; }
    if (btnR) { btnR.style.background = 'transparent'; btnR.style.color = 'var(--text-secondary)'; }
    if (formL) formL.style.display = 'block';
    if (formR) formR.style.display = 'none';
  } else {
    if (btnR) { btnR.style.background = 'rgba(0,240,255,0.15)'; btnR.style.color = 'var(--accent-cyan)'; }
    if (btnL) { btnL.style.background = 'transparent'; btnL.style.color = 'var(--text-secondary)'; }
    if (formR) formR.style.display = 'block';
    if (formL) formL.style.display = 'none';
  }
}

function togglePasswordVisibility(id, btn) {
  const inp = document.getElementById(id); 
  if (!inp) return;
  const icon = btn.querySelector('i');
  if(inp.type === 'password'){ inp.type = 'text'; if(icon) icon.className = 'fa-solid fa-eye-slash'; }
  else { inp.type = 'password'; if(icon) icon.className = 'fa-solid fa-eye'; }
}

function updateNavAvatar() {
  const avatarContainer = document.getElementById('nav-user-avatar');
  if(!avatarContainer || !currentUser) return;
  let uObj = currentProfile();
  if(uObj && uObj.avatar) {
    avatarContainer.innerHTML = `<img src="${uObj.avatar}" alt="Avatar" style="width:100%; height:100%; object-fit:cover;">`;
  } else {
    avatarContainer.innerHTML = `<i class="fa-solid fa-user" style="font-size: 13px; color: var(--accent-cyan);"></i>`;
  }
}

function updateNotificationsBadge() {
  const badge = document.getElementById('notif-badge');
  if(!badge) return;
  let unread = notificationsList.filter(n => n.unread).length;
  if(unread > 0) {
    badge.style.display = 'flex';
    badge.innerText = unread;
  } else {
    badge.style.display = 'none';
  }
}

async function openNotificationsModal() {
  await loadNotificationsForCurrentAccount();
  const listContainer = document.getElementById('notifications-list-modal');
  if (!listContainer) return;
  listContainer.innerHTML = '';
  if(notificationsList.length === 0) {
    listContainer.innerHTML = `<p style="text-align:center; color:var(--text-muted); padding:20px;">Nenhuma notificação no momento.</p>`;
  } else {
    notificationsList.forEach(n => {
      listContainer.innerHTML += `
        <div style="background:rgba(255,255,255,0.03); border:1px solid var(--glass-border); padding:12px; border-radius:12px; ${n.unread?'border-left:4px solid var(--accent-cyan);':''}">
          <p style="font-size:13px; color:#fff; margin-bottom:4px;">${escapeHTML(n.text)}</p>
          <span style="font-size:10.5px; color:var(--text-muted);">${escapeHTML(n.date)}</span>
        </div>
      `;
    });
    notificationsList.forEach(n => n.unread = false);
    localStorage.setItem(notificationOwnerKey(isAdmin ? 'admin' : 'student'), JSON.stringify(notificationsList));
    if (window.db && window.firebaseModules) {
      const { doc, setDoc } = window.firebaseModules;
      notificationsList.filter(n => n.firestoreId).forEach(n => setDoc(doc(window.db, 'notifications', n.firestoreId), { unread:false }, { merge:true }).catch(() => {}));
    }
    updateNotificationsBadge();
  }
  openModal('modal-notifications');
}

function addNotification(text, audience = 'student', userId = null, type = 'info') {
  const key = notificationOwnerKey(audience, userId);
  const list = JSON.parse(localStorage.getItem(key) || '[]');
  const now = Date.now();
  const notification = { id: now, type, audience, userId: userId || null, text, unread: true, date: new Date(now).toLocaleString('pt-BR'), createdAt:now };
  list.unshift(notification);
  localStorage.setItem(key, JSON.stringify(list.slice(0, 100)));
  const uid = window.auth?.currentUser?.uid;
  const canPersist = uid && window.db && window.firebaseModules && ((audience === 'student' && !userId) || (audience === 'admin' && isAdmin));
  if (canPersist) {
    const { doc, setDoc } = window.firebaseModules;
    setDoc(doc(window.db, 'notifications', `${uid}_${now}`), { ...notification, uid }).catch(error => console.warn('Aviso salvo apenas neste dispositivo.', error));
  }
  if ((audience === 'admin' && isAdmin) || (audience === 'student' && !isAdmin && currentUser)) loadNotificationsForCurrentAccount();
}

async function handleLogin(e) {
  e.preventDefault();
  autoCompleteEmail('login-email');
  const em = normalizeEmail(safeGetValue('login-email')); 
  const pw = safeGetValue('login-pass');
  const rememberMe = document.getElementById('remember-me')?.checked;
  const { signInWithEmailAndPassword, setPersistence, browserLocalPersistence, browserSessionPersistence } = window.firebaseModules;

  if (rememberMe) {
    localStorage.setItem('remembered_email', em);
  } else {
    localStorage.removeItem('remembered_email');
  }

  try {
    await setPersistence(window.auth, rememberMe ? browserLocalPersistence : browserSessionPersistence);
    await signInWithEmailAndPassword(window.auth, em, pw);
    closeModal('modal-auth');
    showSuccessModal("Login realizado com sucesso!");
  } catch (err) {
    console.error("Erro no Auth (código):", err.code, "| mensagem:", err.message);
    /*
      Compatibilidade segura com a credencial administrativa antiga:
      a senha curta nunca é gravada ou comparada neste HTML público.
      O backend valida a credencial, aplica rate limit e devolve um
      Firebase Custom Token para a conta administrativa.
    */
    if (em.toLowerCase() === TARGET_ADMIN_EMAIL.toLowerCase() && ['auth/invalid-credential','auth/wrong-password','auth/user-not-found'].includes(err.code)) {
      const compatResult = await loginLegacyAdminSecure(em, pw);
      if (compatResult) return;
    }
    let errorMap = {
      'auth/invalid-credential': "E-mail ou senha incorretos.",
      'auth/user-not-found': "Conta não encontrada para este e-mail.",
      'auth/wrong-password': "Senha incorreta.",
      'auth/too-many-requests': "Muitas tentativas sem sucesso. Aguarde um momento.",
      'auth/user-disabled': "Esta conta de usuário foi desativada.",
      'auth/network-request-failed': "Falha de conexão com a rede."
    };
    showCustomAlert("Erro de Acesso", errorMap[err.code] || "E-mail ou senha incorretos.");
  }
}

async function loginLegacyAdminSecure(email, password) {
  try {
    const response = await fetch(ADMIN_COMPAT_LOGIN_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok || !data.customToken) {
      showCustomAlert('Acesso administrativo', data.message || 'A credencial administrativa antiga ainda precisa ser ativada no backend seguro. Use “Esqueci minha senha” para entrar pelo Firebase agora.');
      return false;
    }
    await window.firebaseModules.signInWithCustomToken(window.auth, data.customToken);
    closeModal('modal-auth');
    showSuccessModal('Acesso administrativo confirmado com segurança.');
    return true;
  } catch (error) {
    console.error('Falha na compatibilidade administrativa:', error);
    showCustomAlert('Acesso administrativo', 'O servidor de compatibilidade do administrador ainda não está configurado. A senha não será exposta no HTML. Configure o endpoint seguro ou use a recuperação do Firebase.');
    return false;
  }
}

async function loginWithGoogle() {
  const { signInWithPopup, GoogleAuthProvider, doc, setDoc, getDoc } = window.firebaseModules;
  const provider = new GoogleAuthProvider();
  try {
    const result = await signInWithPopup(window.auth, provider);
    const user = result.user;
    
    let userRef = doc(window.db, "users", user.uid);
    let userSnap = await getDoc(userRef);

    if (!userSnap.exists()) {
      let newUser = { 
        email: user.email, 
        uid: user.uid,
        paid: false,
        role: 'student',
        fullname: user.displayName || 'Aluno Google', 
        avatar: user.photoURL || '',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        emailVerified: !!user.emailVerified,
        courseVersion: 2
      };
      await setDoc(userRef, newUser);
    } else {
      await setDoc(userRef, { uid:user.uid, email:user.email, fullname:user.displayName || userSnap.data().fullname || 'Aluno Google', avatar:user.photoURL || userSnap.data().avatar || '' }, { merge:true });
    }

    closeModal('modal-auth');
    showSuccessModal("Autenticado com sucesso via Google!");
  } catch(e) {
    console.error("Erro Google Auth:", e);
    showCustomAlert("Erro no Google Login", "Não foi possível autenticar com a conta Google.");
  }
}

async function handleForgotPassword(e) {
  e.preventDefault();
  autoCompleteEmail('login-email');
  const em = normalizeEmail(safeGetValue('login-email'));
  if(!em) {
    showCustomAlert("Campo Obrigatório", "Digite seu e-mail no campo de login para receber o link de recuperação.");
    return;
  }
  const sendPasswordResetEmail = window.firebaseModules?.sendPasswordResetEmail;
  try {
    if(!window.auth||typeof sendPasswordResetEmail!=='function')throw new Error('Serviço de autenticação indisponível.');
    await sendPasswordResetEmail(window.auth, em);
    showSuccessModal("Enviamos um link de redefinição para seu e-mail. Verifique também a caixa de spam.");
    closeModal('modal-auth');
  } catch (err) {
    console.warn('password_reset_failed',{code:String(err?.code||'unknown')});
    showCustomAlert("Recuperação de senha", "Não foi possível solicitar a redefinição agora. Confira o e-mail e tente novamente em alguns instantes.");
  }
}

async function handleRegister(e) {
  e.preventDefault();
  autoCompleteEmail('reg-email');
  const fullname = safeGetValue('reg-fullname');
  const em = normalizeEmail(safeGetValue('reg-email')); 
  const pw = safeGetValue('reg-pass');
  const { createUserWithEmailAndPassword, sendEmailVerification, updateProfile, doc, setDoc } = window.firebaseModules;

  if (!isValidFullName(fullname)) {
    showCustomAlert("Nome Inválido", "Por favor, digite seu Nome Completo real (Nome e Sobrenome).");
    return;
  }

  if (pw.length < 6) {
    showCustomAlert("Senha Curta", "A senha precisa ter no mínimo 6 caracteres.");
    return;
  }

  try {
    const credential = await createUserWithEmailAndPassword(window.auth, em, pw);
    await updateProfile(credential.user, { displayName: fullname });
    await sendEmailVerification(credential.user);
    const newUserDoc = { 
      uid: credential.user.uid,
      email: em, 
      paid: false,
      role: 'student',
      fullname: fullname,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      emailVerified: !!credential.user.emailVerified,
      courseVersion: 2
    };
    await setDoc(doc(window.db, "users", credential.user.uid), newUserDoc);
    addNotification("Novo aluno cadastrado: " + fullname, 'admin', TARGET_ADMIN_EMAIL, 'novo_aluno');
    addNotification("Bem-vindo ao Informática do Zero! Sua conta foi criada com sucesso.", 'student', window.auth.currentUser?.uid || em, 'boas_vindas');
    closeModal('modal-auth');
    showSuccessModal("Conta criada! Enviamos um link de confirmação para seu e-mail.");
  } catch (authErr) {
    console.error("Erro Cadastro:", authErr);
    if (authErr.code === 'auth/email-already-in-use') {
      showCustomAlert("Conta Existente", "Este e-mail já possui conta cadastrada. Faça login para prosseguir.");
      switchAuthTab('login');
      safeSetValue('login-email', em);
    } else {
      showCustomAlert("Erro no Cadastro", authErr.message);
    }
  }
}

async function logout() {
  const { signOut } = window.firebaseModules;
  if(window.auth) await signOut(window.auth);
  currentUser = null; currentUserUid = null; isAdmin = false;
  if (usersUnsubscribe) { usersUnsubscribe(); usersUnsubscribe = null; }
  notificationsList = [];
  document.querySelectorAll('.modal-overlay.active').forEach(modal => modal.classList.remove('active'));
  document.getElementById('mobile-menu')?.classList.remove('active');
  document.getElementById('mobile-overlay')?.classList.remove('active');
  localStorage.removeItem('app_theme');
  changeTheme('azul', false);
  updateNotificationsBadge();
  showPublicSite();
}

function handleAccountAction() {
  if (!window.auth || !window.auth.currentUser) {
    openAuthModal('login');
  } else {
    if (isAdmin) showAdminArea();
    else showMemberArea();
  }
}

function handleLogoClick() {
  if (currentUser) {
    let uObj = currentProfile();
    if (isAdmin || uObj?.paid) {
      showMemberArea();
    } else {
      showPublicSite();
    }
  } else {
    showPublicSite();
  }
}

function showPublicSite() {
  const p = document.getElementById('public-site'); if(p) p.style.display = 'block'; 
  const m = document.getElementById('member-area'); if(m) m.style.display = 'none'; 
  const a = document.getElementById('admin-area'); if(a) a.style.display = 'none';
  const s = document.getElementById('settings-area'); if(s) s.style.display = 'none';
}

function switchSettingsTab(e, tabName) {
  document.querySelectorAll('.settings-tab-btn').forEach(b => b.classList.remove('active'));
  document.querySelectorAll('.settings-panel').forEach(p => p.classList.remove('active'));
  if (e && e.currentTarget) e.currentTarget.classList.add('active');
  const targetP = document.getElementById(`spanel-${tabName}`);
  if (targetP) targetP.classList.add('active');
  if (tabName === 'suporte' || tabName === 'reembolso') loadAccountRequests();
}

function maskCpf(input) {
  const digits = String(input.value || '').replace(/\D/g, '').slice(0, 11);
  input.value = digits.replace(/(\d{3})(\d)/, '$1.$2').replace(/(\d{3})(\d)/, '$1.$2').replace(/(\d{3})(\d{1,2})$/, '$1-$2');
}

function isValidCpf(value) {
  const cpf = String(value || '').replace(/\D/g, '');
  if (cpf.length !== 11 || /^(\d)\1+$/.test(cpf)) return false;
  let sum = 0;
  for (let i = 0; i < 9; i++) sum += Number(cpf[i]) * (10 - i);
  let d1 = (sum * 10) % 11; if (d1 === 10) d1 = 0;
  if (d1 !== Number(cpf[9])) return false;
  sum = 0; for (let i = 0; i < 10; i++) sum += Number(cpf[i]) * (11 - i);
  let d2 = (sum * 10) % 11; if (d2 === 10) d2 = 0;
  return d2 === Number(cpf[10]);
}

let cepLookupTimer = null;
function lookupCep(value) {
  const cep = String(value || '').replace(/\D/g, '').slice(0, 8);
  const input = document.getElementById('v-cep'); if (input) input.value = cep.length > 5 ? `${cep.slice(0,5)}-${cep.slice(5)}` : cep;
  if (cep.length !== 8) return;
  clearTimeout(cepLookupTimer);
  cepLookupTimer = setTimeout(async () => {
    try {
      const response = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
      const data = await response.json();
      if (data.erro) throw new Error('CEP não encontrado');
      safeSetValue('v-end', data.logradouro || safeGetValue('v-end'));
      safeSetValue('v-bairro', data.bairro || '');
      safeSetValue('v-cidade', data.localidade || '');
      safeSetValue('v-uf', data.uf || '');
    } catch (_) { /* permite preenchimento manual quando o serviço estiver indisponível */ }
  }, 250);
}

function previewAvatar(event) {
  const file = event.target.files?.[0]; const preview = document.getElementById('profile-avatar-preview');
  if (!file || !preview) return;
  if (!/^image\/(jpeg|jpg|png|webp)$/.test(file.type) || file.size > 5 * 1024 * 1024) {
    event.target.value = ''; showCustomAlert('Foto inválida', 'Escolha uma imagem JPG, PNG ou WEBP de até 5 MB.'); return;
  }
  preview.src = URL.createObjectURL(file); preview.style.display = 'block';
}

function removeAvatar() {
  const input = document.getElementById('set-avatar-file'); const preview = document.getElementById('profile-avatar-preview');
  if (input) input.value = ''; if (preview) { preview.src = ''; preview.style.display = 'none'; }
}

async function uploadProfileAvatar(file, uid) {
  if (!file || !uid || !window.storage) return '';
  const { ref, uploadBytes, getDownloadURL } = window.firebaseModules;
  const avatarRef = ref(window.storage, `profilePictures/${uid}/avatar.webp`);
  const bitmap = await createImageBitmap(file);
  const canvas = document.createElement('canvas'); const max = 512;
  const side = Math.min(bitmap.width, bitmap.height);
  const sx = Math.round((bitmap.width - side) / 2);
  const sy = Math.round((bitmap.height - side) / 2);
  canvas.width = max; canvas.height = max;
  canvas.getContext('2d').drawImage(bitmap, sx, sy, side, side, 0, 0, max, max);
  const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/webp', .82));
  await uploadBytes(avatarRef, blob, { contentType: 'image/webp', cacheControl: 'public,max-age=3600' });
  return getDownloadURL(avatarRef);
}

function showSettingsArea() {
  showPublicSite();
  document.getElementById('public-site').style.display = 'none';
  const s = document.getElementById('settings-area'); if(s) s.style.display = 'block';
  
  let uObj = currentProfile();
  safeSetValue('set-email', currentUser || '');
  safeSetValue('set-fullname', uObj?.fullname || '');
  safeSetValue('set-avatar', uObj?.avatar || '');
  const avatarPreview = document.getElementById('profile-avatar-preview');
  if (avatarPreview && uObj?.avatar) { avatarPreview.src = uObj.avatar; avatarPreview.style.display = 'block'; }

  if(uObj && uObj.verifiedData) {
    safeSetHTML('verified-badge-status', `<span style="color:var(--green);"><i class="fa-solid fa-circle-check"></i> Status: Verificado</span>`);
    safeSetValue('v-name', uObj.verifiedData.name || '');
    safeSetValue('v-nasc', uObj.verifiedData.nasc || '');
    safeSetValue('v-cpf', uObj.verifiedData.cpf || '');
    safeSetValue('v-end', uObj.verifiedData.end || '');
    safeSetValue('v-cep', uObj.verifiedData.cep || '');
    safeSetValue('v-num', uObj.verifiedData.num || '');
    safeSetValue('v-comp', uObj.verifiedData.comp || '');
    safeSetValue('v-bairro', uObj.verifiedData.bairro || '');
    safeSetValue('v-cidade', uObj.verifiedData.cidade || '');
    safeSetValue('v-uf', uObj.verifiedData.uf || '');
  } else {
    safeSetHTML('verified-badge-status', `<span style="color:var(--yellow);"><i class="fa-solid fa-triangle-exclamation"></i> Status: Não Verificado (Preencha para liberar o certificado)</span>`);
  }
}

async function handleUpdateProfile(e) {
  e.preventDefault();
  const newName = safeGetValue('set-fullname');
  const file = document.getElementById('set-avatar-file')?.files?.[0];

  let uObj = currentProfile();
  if (uObj) {
    uObj.fullname = newName;
    uObj.nome = newName;
    if (file) uObj.avatar = await uploadProfileAvatar(file, currentUserUid);
    await saveUserToCloud(uObj);
    showSuccessModal("Perfil atualizado com sucesso!");
    updateNavAvatar();
    updateStudentDashboard();
  }
}

async function handleSaveVerification(e) {
  e.preventDefault();
  let vData = {
    name: safeGetValue('v-name'),
    nasc: safeGetValue('v-nasc'),
    cpf: safeGetValue('v-cpf'),
    end: safeGetValue('v-end'),
    cep: safeGetValue('v-cep'),
    num: safeGetValue('v-num'),
    comp: safeGetValue('v-comp'),
    bairro: safeGetValue('v-bairro'),
    cidade: safeGetValue('v-cidade'),
    uf: safeGetValue('v-uf')
  };

  if (!isValidCpf(vData.cpf)) { showCustomAlert('CPF inválido', 'Confira os números do CPF informado.'); return; }

  let uObj = currentProfile();
  if (uObj) {
    if (uObj.physicalCertificateRequestedAt && uObj.physicalAddressEditUntil && Date.now() > uObj.physicalAddressEditUntil) {
      showCustomAlert('Prazo encerrado', 'O endereço só pode ser alterado até 3 dias após a solicitação do certificado físico.');
      return;
    }
    uObj.verifiedData = vData;
    uObj.nome = vData.name;
    uObj.dataNascimento = vData.nasc;
    uObj.cpf = vData.cpf.replace(/\D/g, '');
    uObj.endereco = { cep: vData.cep.replace(/\D/g, ''), logradouro: vData.end, numero: vData.num, complemento: vData.comp, bairro: vData.bairro, cidade: vData.cidade, estado: vData.uf };
    await saveUserToCloud(uObj);
    showSuccessModal("Dados de verificação vinculados ao perfil!");
  }
}

async function handleUpdatePassword(e) {
  e.preventDefault();
  const newPass = safeGetValue('set-new-pass');
  if (newPass.length < 6) {
    showCustomAlert("Senha Curta", "A senha deve ter no mínimo 6 caracteres.");
    return;
  }
  const user = window.auth.currentUser;
  if (!user) return;
  const { updatePassword } = window.firebaseModules;
  try {
    await updatePassword(user, newPass);
    showSuccessModal("Senha atualizada com sucesso!");
    addNotification("Sua senha foi alterada com sucesso.");
  } catch (err) {
    showCustomAlert("Erro", "Erro ao atualizar senha: " + err.message);
  }
}

function showMemberArea() {
  if (!window.auth?.currentUser) {
    openAuthModal('login');
    return;
  }
  let uObj = currentProfile();
  const isPaid = isAdmin || (uObj?.adminAccessRevoked !== true && (uObj?.courseAccess === true || uObj?.paid === true));

  if (!isPaid) {
    showPublicSite();
    openCheckoutModal();
    return;
  }

  showPublicSite();
  document.getElementById('public-site').style.display = 'none';
  const m = document.getElementById('member-area'); if(m) m.style.display = 'block';
  window.IDZ_ACTIVE_VIEW = isAdmin ? 'admin-preview' : 'student';
  if (isAdmin && m && !document.getElementById('admin-preview-return')) {
    const header = m.querySelector('.student-dashboard-header');
    const back = document.createElement('button');
    back.id = 'admin-preview-return';
    back.type = 'button';
    back.className = 'btn-outline';
    back.innerHTML = '<i class="fa-solid fa-shield-halved"></i> Voltar ao painel Admin';
    back.addEventListener('click', () => showAdminArea());
    header?.appendChild(back);
  }
  
  updateStudentDashboard();
  renderMemberSidebar();
  if(courseData.length > 0 && courseData[0].lessons?.length > 0) {
    loadLessonContent(courseData[0].id, courseData[0].lessons[0].id);
  } else {
    safeSetHTML('lms-main-content', '<div class="empty-state"><i class="fa-solid fa-hourglass-half"></i><h3>Carregando suas aulas</h3><p>O conteúdo será exibido assim que a estrutura do curso estiver disponível.</p></div>');
  }
}

function handlePurchaseAction() {
  const profile=currentProfile();
  if (isAdmin || (profile?.adminAccessRevoked !== true && (profile?.courseAccess === true || profile?.paid === true))) {
    showSuccessModal('Acesso já liberado', 'Sua compra já foi confirmada. Abrindo suas aulas.');
    setTimeout(() => showMemberArea(), 500);
    return;
  }
  openCheckoutModal();
}

function startCourseJourney() {
  // A Etapa 0 faz parte da área de aulas real e segue as mesmas regras de acesso.
  showMemberArea();
}

async function sendAdminNotificationTest() {
  if (!isAdmin) return showCustomAlert('Acesso restrito', 'Somente administradores podem enviar notificações de teste.');
  const result = document.getElementById('notification-test-result');
  const uid = safeGetValue('notification-test-student');
  const title = safeGetValue('notification-test-title');
  const message = safeGetValue('notification-test-message');
  if (!uid || !title || !message) return showCustomAlert('Notificação', 'Selecione um aluno e preencha título e mensagem.');
  if (result) result.textContent = 'Enviando notificação…';
  try {
    await adminApi('/api/admin/notifications/test', { method: 'POST', body: JSON.stringify({ uid, title, message }) });
    if (result) result.textContent = 'Notificação enviada ao backend para entrega.';
  } catch (error) {
    if (result) result.textContent = `Não foi possível enviar: ${error.message}`;
  }
}

function updateStudentDashboard() {
  let uObj = currentProfile();
  const displayName = String(uObj?.fullname || '').trim();
  safeSetText('student-welcome-title', `Olá, ${displayName || 'Aluno'} 👋`);
  safeSetText('student-welcome-subtitle', currentUser ? `${currentUser} · continue de onde parou e conquiste sua autonomia digital.` : 'Continue de onde parou e conquiste sua autonomia digital.');

  const stats = getCourseProgressStats();
  safeSetText('dash-stat-progress', `Progresso: ${stats.percent}%`);
  safeSetText('dash-stat-lessons', `Curso: ${stats.completedModuleCount}/12 módulos · Projeto Final: ${stats.completedProjectStepCount}/7 etapas · Bônus: ${stats.completedBonusCount}/3`);
  safeSetText('dash-stat-cert', stats.complete ? "Certificado: Liberado 🏆" : "Certificado: Bloqueado 🔒");
}

function showAdminArea() {
  if(!isAdmin || window.IDZ_AUTH_STATE !== 'ADMIN'){
    showCustomAlert("Acesso Restrito", "Você não possui permissão de administrador."); 
    showPublicSite();
    return; 
  }
  window.IDZ_ACTIVE_VIEW = 'admin';
  showPublicSite();
  document.getElementById('public-site').style.display = 'none';
  const a = document.getElementById('admin-area'); if(a) a.style.display = 'block';
  
  switchAdminTab('alunos'); 
  populateLessonModuleSelect(); 
  populateTestStudentSelect();
}

function renderMemberSidebar() {
  const container = document.getElementById('module-list'); 
  if(!container) return;
  container.innerHTML = '';

  courseData.forEach((mod, index) => {
    let html = '';
    if (mod.lessons) {
      mod.lessons.forEach(l => {
        let isDone = isLessonCompleted(l);
        html += `<div class="lms-lesson-item" onclick="loadLessonContent(${mod.id}, ${l.id})">
          <span><i class="fa-regular fa-circle-play" style="margin-right: 8px;"></i> ${l.title}</span>
          ${isDone ? '<i class="fa-solid fa-check-circle"></i>' : ''}
        </div>`;
      });
    }
    const box = document.createElement('div'); box.className = 'lms-module-box';
    box.innerHTML = `
      <div class="lms-module-header" onclick="toggleAccordion(this)">
        <span><i class="fa-regular fa-folder" style="margin-right:8px; color:var(--accent-cyan);"></i> ${mod.title}</span>
        <i class="fa-solid ${index===0?'fa-chevron-up':'fa-chevron-down'} arrow" style="font-size:10px;"></i>
      </div>
      <div class="lms-module-body ${index===0?'expanded':''}">${html}</div>
    `;
    container.appendChild(box);
  });

  const bonusHeading = document.createElement('div');
  bonusHeading.className = 'lms-module-header';
  bonusHeading.style.marginTop = '12px';
  bonusHeading.innerHTML = '<span><i class="fa-solid fa-gift" style="margin-right:8px;color:var(--yellow)"></i>3 Bônus</span>';
  container.appendChild(bonusHeading);
  (courseV2.bonuses || []).forEach(bonus => {
    const done = completedBonuses[progressKey()]?.[bonus.id] === true;
    const item = document.createElement('button');
    item.type = 'button';
    item.className = 'lms-lesson-item';
    item.style.width = '100%';
    item.style.border = '0';
    item.style.textAlign = 'left';
    item.innerHTML = `<span><i class="fa-regular fa-star" style="margin-right:8px"></i>${escapeHTML(bonus.title)}</span>${done ? '<i class="fa-solid fa-check-circle"></i>' : ''}`;
    item.addEventListener('click', () => toggleStudentBonus(bonus.id));
    container.appendChild(item);
  });
}

async function toggleStudentBonus(bonusId) {
  const uid = progressKey();
  if (!uid) return;
  completedBonuses[uid] = completedBonuses[uid] || {};
  completedBonuses[uid][bonusId] = completedBonuses[uid][bonusId] !== true;
  localStorage.setItem('user_completed_bonuses', JSON.stringify(completedBonuses));
  await saveProgressToCloud();
  renderMemberSidebar();
  updateCourseStatsUI();
}

function toggleAccordion(headerElem) {
  const bodyElem = headerElem.nextElementSibling;
  const isAlreadyExpanded = bodyElem.classList.contains('expanded');
  
  document.querySelectorAll('.lms-module-body').forEach(b => b.classList.remove('expanded'));
  document.querySelectorAll('.lms-module-header .arrow').forEach(a => {
    a.classList.remove('fa-chevron-up'); a.classList.add('fa-chevron-down');
  });

  if (!isAlreadyExpanded) {
    bodyElem.classList.add('expanded');
    const arrow = headerElem.querySelector('.arrow');
    if(arrow) { arrow.classList.remove('fa-chevron-down'); arrow.classList.add('fa-chevron-up'); }
  }
}

function toggleAdminAccordion(headerElem) {
  const bodyElem = headerElem.nextElementSibling;
  if(bodyElem) bodyElem.classList.toggle('expanded');
}

function setAllAdminModules(expanded){
  document.querySelectorAll('#admin-modules-list-container .admin-mod-body').forEach(body=>body.classList.toggle('expanded',expanded));
}

function getYouTubeId(url) {
  if (!url) return '';
  let videoId = '';
  if (url.includes('youtu.be/')) videoId = url.split('youtu.be/')[1].split('?')[0];
  else if (url.includes('watch?v=')) videoId = url.split('watch?v=')[1].split('&')[0];
  else if (url.includes('embed/')) videoId = url.split('embed/')[1].split('?')[0];
  else videoId = url.trim();
  return videoId;
}

function adjacentLesson(modId,lessonId,offset){
  const flat=courseData.flatMap(mod=>mod.lessons.map(lesson=>({modId:mod.id,lessonId:lesson.id})));
  const index=flat.findIndex(item=>String(item.modId)===String(modId)&&String(item.lessonId)===String(lessonId));
  return flat[index+offset]||null;
}

function loadLessonContent(modId, lessonId) {
  const mod = courseData.find(m => m.id == modId); 
  const lesson = mod?.lessons?.find(l => l.id == lessonId);
  if(!lesson) return;
  const container = document.getElementById('lms-main-content');
  if(!container) return;
  
  const hasVideo = lesson.video && lesson.video.trim() !== '';
  videoWatchedState[lessonId] = !hasVideo;

  let mediaHtml = '';
  if (hasVideo) {
    let videoId = getYouTubeId(lesson.video);
    mediaHtml = `
      <div class="video-frame" id="yt-player-container-${lesson.id}" style="position: relative; background: #000; display: flex; align-items: center; justify-content: center; cursor: pointer;" onclick="activateYouTubePlayer('${lesson.id}', '${videoId}')">
        <img src="https://img.youtube.com/vi/${videoId}/hqdefault.jpg" alt="Capa" style="width: 100%; height: 100%; object-fit: cover; opacity: 0.85;">
        <div style="position: absolute; width: 75px; height: 52px; background: rgba(0, 240, 255, 0.9); border-radius: 14px; display: flex; align-items: center; justify-content: center;">
          <i class="fa-solid fa-play" style="color: #030712; font-size: 20px;"></i>
        </div>
      </div>`;
  }

  let imgHtml = lesson.imgUrl ? `<div class="image-frame"><img src="${lesson.imgUrl}" alt="Ilustração"></div>` : '';
  let pdfHtml = lesson.pdfUrl ? `
    <div style="margin-top: 15px; padding: 14px; background: rgba(245, 158, 11, 0.1); border: 1px solid rgba(245, 158, 11, 0.3); border-radius: 12px; display: flex; justify-content: space-between; align-items: center;">
      <div><h4 style="color: #f59e0b; font-size: 14px;"><i class="fa-solid fa-file-pdf"></i> Material PDF Complementar</h4></div>
      <a href="${lesson.pdfUrl}" target="_blank" class="btn-outline" style="border-color: #f59e0b; color: #f59e0b;"><i class="fa-solid fa-download"></i> Baixar PDF</a>
    </div>` : '';

  let lessonDone = completedLessons[progressKey()] && completedLessons[progressKey()][lesson.id];
  let uObj = currentProfile();
  const previousLesson=adjacentLesson(mod.id,lesson.id,-1),nextLesson=adjacentLesson(mod.id,lesson.id,1);

  const progressStats = getCourseProgressStats();
  let courseFullyCompleted = progressStats.complete;
  const certificateAllowed = uObj?.certificateOverride === true || (uObj?.certificateOverride !== false && courseFullyCompleted);
  if (courseFullyCompleted && uObj) ensureCertificateRecord(uObj);

  let quizHtml = '';
  const exercises = lessonExercises(lesson);
  if (exercises.length) {
    const exerciseCards = exercises.map((exercise, exerciseIndex) => {
      const completed = isExerciseCompleted(lesson, exercise);
      const optionsHtml = (exercise.options || []).map((option, optionIndex) => {
        const extraClass = completed && optionIndex === exercise.correctAnswer ? 'correct' : '';
        return `<button class="quiz-option-btn ${extraClass}" ${completed ? 'disabled' : ''} onclick="checkExerciseAnswer(this, ${optionIndex}, ${exercise.correctAnswer}, '${exercise.id}', ${mod.id}, ${lesson.id})"><span>${String.fromCharCode(65 + optionIndex)}) ${escapeHTML(option)}</span></button>`;
      }).join('');
      return `<section class="quiz-container" data-exercise-id="${escapeHTML(exercise.id)}">
        <div class="quiz-header-badge"><i class="fa-solid fa-brain"></i> Exercício ${exerciseIndex + 1} de ${exercises.length}${exercise.mandatory === false ? ' · opcional' : ' · obrigatório'}</div>
        <div class="quiz-question-title">${escapeHTML(exercise.question)}</div>
        <div class="quiz-options-list">${optionsHtml}</div>
        <div class="quiz-feedback ${completed ? 'success' : ''}" style="${completed ? 'display:flex' : ''}">${completed ? '<i class="fa-solid fa-circle-check"></i> Respondido com sucesso!' : ''}</div>
      </section>`;
    }).join('');
    quizHtml = `
      <button type="button" class="btn-outline exercise-toggle" onclick="document.getElementById('activity-${lesson.id}').classList.toggle('is-open'); this.classList.toggle('is-open')"><i class="fa-solid fa-list-check"></i> Abrir atividade desta aula <i class="fa-solid fa-chevron-down"></i></button>
      <div class="activity-panel" id="activity-${lesson.id}">${exerciseCards}</div>
    `;
  }

  let certificateSectionHtml = '';
  if (certificateAllowed) {
    certificateSectionHtml = `
      <div style="margin-top: 35px; padding: 32px; background: radial-gradient(circle at center, rgba(16, 185, 129, 0.15), rgba(15, 23, 42, 0.95)); border: 2px solid var(--green); border-radius: 24px; text-align: center; box-shadow: 0 0 30px rgba(16,185,129,0.25);">
        <div style="font-size: 52px; margin-bottom: 12px; filter: drop-shadow(0 0 10px rgba(16,185,129,0.5));">🏆🎉</div>
        <h3 style="color: #fff; font-size: 22px; font-weight: 800; margin-bottom: 6px;">PARABÉNS! CURSO CONCLUÍDO COM SUCESSO!</h3>
        <p style="color: var(--accent-cyan); font-size: 14px; font-weight: 700; margin-bottom: 14px;">Sua Autonomia Digital foi conquistada!</p>
        <p style="font-size: 13px; color: var(--text-secondary); margin-bottom: 20px;">Aluno: <strong>${uObj?.fullname || currentUser}</strong></p>
        <p id="certificate-meta" style="font-size:12px;color:var(--text-secondary);margin:-8px 0 18px">Conclusão: ${uObj?.courseCompletedAt ? new Date(uObj.courseCompletedAt).toLocaleDateString('pt-BR') : new Date().toLocaleDateString('pt-BR')} · Nº ${uObj?.certificateNumber || 'será gerado ao baixar'}</p>
        ${uObj?.physicalCertificateRequestedAt ? `<div class="delivery-status"><i class="fa-solid fa-truck"></i> Certificado físico: <strong>${uObj.physicalCertificateStatus === 'entregue' ? 'Entregue' : uObj.physicalCertificateStatus === 'a_caminho' ? 'A caminho' : 'Solicitado'}</strong>${uObj.physicalCertificateStatus === 'entregue' ? ' <button class="btn-outline" onclick="confirmPhysicalReceipt()">Confirmar recebimento</button>' : ''}</div>` : ''}
        <div style="display:flex;gap:10px;justify-content:center;flex-wrap:wrap">
          <button class="btn" style="background: linear-gradient(135deg, #10b981, #059669); color:#fff; font-size: 14px; padding: 14px 22px;" onclick="generateOfficialCertificatePDF()"><i class="fa-solid fa-file-pdf"></i> Baixar certificado</button>
          <button class="btn-outline" style="font-size:13px;padding:14px 18px" onclick="requestPhysicalCertificate()"><i class="fa-solid fa-truck"></i> Solicitar versão física</button>
        </div>
      </div>
    `;
  }

  let finalProjectHtml = '';
  if (mod.type === 'project') {
    const steps = finalProjectSteps();
    const completedCount = steps.filter(step => isProjectStepCompleted(step.id)).length;
    const stepRows = steps.map(step => `<label style="display:flex;gap:12px;align-items:flex-start;padding:12px 0;border-bottom:1px solid var(--glass-border);cursor:pointer">
      <input type="checkbox" ${isProjectStepCompleted(step.id) ? 'checked' : ''} onchange="toggleFinalProjectStep('${step.id}', this.checked)" style="margin-top:3px;accent-color:var(--accent-cyan)">
      <span><strong>${escapeHTML(step.title)}</strong><small style="display:block;color:var(--text-secondary);margin-top:3px">Confirme somente depois de concluir esta entrega.</small></span>
    </label>`).join('');
    finalProjectHtml = `<section class="glass-panel" style="padding:22px;margin-top:20px">
      <div class="quiz-header-badge"><i class="fa-solid fa-diagram-project"></i> Projeto Final · ${completedCount}/${steps.length}</div>
      <h3 style="font-size:18px;margin:12px 0 6px">Checklist de entrega</h3>
      <p style="color:var(--text-secondary);font-size:13.5px">Conclua e confira cada item. Todos são obrigatórios para finalizar o curso.</p>
      <div style="margin-top:12px">${stepRows}</div>
    </section>`;
  }

  container.innerHTML = `
    <div style="display:flex;justify-content:space-between;gap:12px;align-items:flex-start;margin-bottom:13px"><div><span style="font-size:11px;color:var(--accent-cyan);font-weight:800;text-transform:uppercase">Aula atual · ${mod.title}</span><h2 style="margin:4px 0 0;font-size:clamp(19px,3vw,25px);color:#fff">${lesson.title}</h2></div><span class="status-chip ${lessonDone?'ok':''}">${lessonDone?'Concluída':'Em andamento'}</span></div>
    ${mediaHtml} ${imgHtml} ${pdfHtml}
    <div style="display:flex;align-items:center;gap:10px;margin:13px 0"><div class="stage-zero-bar" style="flex:1"><span style="width:${progressStats.percent}%"></span></div><small style="color:var(--text-secondary)">${progressStats.percent}%</small></div>
    <div class="student-admin-actions" style="justify-content:space-between;margin:16px 0">
      ${previousLesson?`<button class="btn-outline" onclick="loadLessonContent('${previousLesson.modId}','${previousLesson.lessonId}')"><i class="fa-solid fa-arrow-left"></i> Anterior</button>`:'<span></span>'}
      ${nextLesson?`<button class="btn-outline" onclick="loadLessonContent('${nextLesson.modId}','${nextLesson.lessonId}')">Próxima <i class="fa-solid fa-arrow-right"></i></button>`:''}
    </div>
    <div class="lesson-meta-compact">
      <details><summary><i class="fa-solid fa-list-check"></i> O que vai aprender</summary><p>${escapeHTML(lesson.bloco1 || 'Introdução pedagógica aos conceitos principais.')}</p></details>
      <details><summary><i class="fa-solid fa-align-left"></i> Descrição detalhada</summary><p>${escapeHTML(lesson.bloco2 || 'Acompanhe com atenção todos os passos recomendados.')}</p></details>
      <details><summary><i class="fa-solid fa-bullseye"></i> Objetivos pedagógicos</summary><p>${escapeHTML(lesson.bloco3 || 'Dominar a prática do tópico abordado.')}</p></details>
    </div>
    
    ${quizHtml}
    ${finalProjectHtml}
    
    <div style="margin-top: 25px; text-align: center;">
      ${!lessonDone ? `<button class="btn" onclick="markLessonAsDone(${mod.id}, ${lesson.id})"><i class="fa-solid fa-check"></i> Marcar Aula como Concluída</button>` : ''}
    </div>
    ${certificateSectionHtml}
  `;
}

function toggleFinalProjectStep(stepId, checked) {
  if (!completedProjects[progressKey()]) completedProjects[progressKey()] = {};
  completedProjects[progressKey()][stepId] = checked === true;
  localStorage.setItem('user_completed_projects', JSON.stringify(completedProjects));
  saveProgressToCloud();
  renderMemberSidebar();
  updateStudentDashboard();
  checkAndIssueCertificate();
  addNotification(checked ? 'Etapa do Projeto Final concluída!' : 'Etapa do Projeto Final reaberta.');
}

function activateYouTubePlayer(lessonId, videoId) {
  const container = document.getElementById(`yt-player-container-${lessonId}`);
  if (!container) return;
  container.innerHTML = `<iframe src="https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1&rel=0" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen style="width: 100%; height: 100%;"></iframe>`;
}

function markLessonAsDone(modId, lessonId) {
  if(!completedLessons[progressKey()]) completedLessons[progressKey()] = {};
  completedLessons[progressKey()][lessonId] = true;
  localStorage.setItem('user_completed_lessons', JSON.stringify(completedLessons));
  saveProgressToCloud();
  renderMemberSidebar();
  updateStudentDashboard();
  checkAndIssueCertificate();
  loadLessonContent(modId, lessonId);
  addNotification("Aula concluída com sucesso!");
}

function checkExerciseAnswer(buttonElem, selectedIdx, correctIdx, exerciseId, modId, lessonId) {
  const parentContainer = buttonElem.closest('.quiz-container');
  const allBtns = parentContainer.querySelectorAll('.quiz-option-btn');
  const feedbackDiv = parentContainer.querySelector('.quiz-feedback');

  allBtns.forEach(btn => btn.disabled = true);

  if(!completedQuizzes[progressKey()]) completedQuizzes[progressKey()] = {};
  if(!completedLessons[progressKey()]) completedLessons[progressKey()] = {};

  if (selectedIdx === correctIdx) {
    buttonElem.classList.add('correct');
    feedbackDiv.innerHTML = `<i class="fa-solid fa-circle-check"></i> Resposta correta!`;
    feedbackDiv.className = 'quiz-feedback success';
    
    completedQuizzes[progressKey()][exerciseId] = true;
    localStorage.setItem('user_completed_lessons', JSON.stringify(completedLessons));
    localStorage.setItem('user_completed_quizzes', JSON.stringify(completedQuizzes));
    saveProgressToCloud();
    renderMemberSidebar();
    updateStudentDashboard();
    checkAndIssueCertificate();
    addNotification("Exercício concluído com sucesso!");
    loadLessonContent(modId, lessonId);
  } else {
    buttonElem.classList.add('incorrect');
    allBtns[correctIdx].classList.add('correct');
    feedbackDiv.innerHTML = `<i class="fa-solid fa-circle-xmark"></i> Resposta incorreta. Revise a aula.`;
    feedbackDiv.className = 'quiz-feedback error';
    allBtns.forEach((btn, index) => { btn.disabled = index === selectedIdx; });
  }
}

function checkAndIssueCertificate() {
  const uObj = currentProfile();
  if (!uObj || isAdmin) return;
  if (getCourseProgressStats().complete) ensureCertificateRecord(uObj);
}

function ensureCertificateRecord(userObj) {
  if (!userObj) return null;
  if (!userObj.certificateNumber) {
    const year = new Date(userObj.courseCompletedAt || Date.now()).getFullYear();
    const initial = String(userObj.fullname || userObj.email || 'A').trim().charAt(0).toUpperCase();
    const uniquePart = (window.crypto?.randomUUID ? crypto.randomUUID().replace(/-/g,'').slice(0,8) : `${Date.now()}${Math.floor(Math.random()*1000)}`).toUpperCase();
    userObj.certificateNumber = `IDZ-${year}-${uniquePart}X-${initial}`;
    userObj.courseCompletedAt = userObj.courseCompletedAt || new Date().toISOString();
    saveUserToCloud(userObj);
    addNotification(`Conclusão de curso: ${userObj.fullname || userObj.email}`, 'admin', TARGET_ADMIN_EMAIL, 'conclusao');
  }
  return userObj;
}

function splitCertificateName(fullName) {
  const normalized = String(fullName || '').trim().replace(/\s+/g, ' ').toUpperCase();
  const words = normalized.split(' ').filter(Boolean);
  if (words.length < 2 || normalized.length <= 27) return [normalized];
  let best = [normalized];
  let smallestDifference = Infinity;
  const particles = new Set(['DA', 'DE', 'DO', 'DAS', 'DOS', 'E']);
  for (let index = 1; index < words.length; index += 1) {
    const first = words.slice(0, index).join(' ');
    const second = words.slice(index).join(' ');
    if (particles.has(words[index - 1]) && index < words.length - 1) continue;
    const difference = Math.abs(first.length - second.length);
    if (difference < smallestDifference) {
      best = [first, second];
      smallestDifference = difference;
    }
  }
  return best;
}

async function requestPhysicalCertificate() {
  const uObj = currentProfile();
  if (!uObj) return;
  if (uObj.physicalCertificateRequestedAt) {
    showCustomAlert('Solicitação já enviada', 'Você só pode solicitar um certificado físico. Para alterar o endereço, use o prazo de até 3 dias após a solicitação.');
    return;
  }
  const address = uObj.verifiedData || {};
  if (!address.end || !address.cep || !address.cidade || !address.uf) {
    showSettingsArea();
    showCustomAlert('Complete seu endereço', 'Preencha os dados de endereço na aba Verificação e clique novamente em Solicitar versão física.');
    return;
  }
  uObj.physicalCertificateRequestedAt = new Date().toISOString();
  uObj.physicalAddressEditUntil = Date.now() + 3 * 24 * 60 * 60 * 1000;
  await saveUserToCloud(uObj);
  const requests = JSON.parse(localStorage.getItem('physical_certificate_requests') || '[]');
  requests.push({ email:uObj.email, fullname:uObj.fullname || uObj.email, address, requestedAt:uObj.physicalCertificateRequestedAt, status:'pendente' });
  localStorage.setItem('physical_certificate_requests', JSON.stringify(requests));
  if (window.db && window.firebaseModules) {
    const { doc, setDoc } = window.firebaseModules;
    setDoc(doc(window.db, 'certificate_requests', uObj.uid), { uid:uObj.uid, email:uObj.email, fullname:uObj.fullname || uObj.email, address, requestedAt:uObj.physicalCertificateRequestedAt, physicalAddressEditUntil:uObj.physicalAddressEditUntil, status:'pendente' }).catch(() => {});
  }
  ensureCertificateRecord(uObj);
  addNotification(`Solicitação de certificado físico: ${uObj.fullname || uObj.email}`, 'admin', TARGET_ADMIN_EMAIL, 'certificado_fisico');
  showSuccessModal('Solicitação enviada', 'O administrador recebeu sua solicitação de certificado físico.');
}

let jsPdfLoaderPromise = null;
function loadJsPdf() {
  if (window.jspdf?.jsPDF) return Promise.resolve();
  if (jsPdfLoaderPromise) return jsPdfLoaderPromise;
  jsPdfLoaderPromise = new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js';
    script.async = true;
    script.dataset.jspdfSdk = 'true';
    script.onload = resolve;
    script.onerror = () => reject(new Error('Falha ao carregar o gerador de PDF.'));
    document.head.appendChild(script);
  });
  return jsPdfLoaderPromise;
}

async function generateOfficialCertificatePDF(targetEmail = currentUser) {
  if (String(targetEmail).includes('%')) targetEmail = decodeURIComponent(targetEmail);
  const uObj = ensureCertificateRecord(registeredUsers.find(u => u.email === targetEmail));
  if (!uObj) return;
  const studentName = uObj.fullname || targetEmail;
  try { await loadJsPdf(); } catch { showCustomAlert('Certificado indisponível', 'Não foi possível carregar o gerador de PDF. Tente novamente.'); return; }
  if (!window.jspdf?.jsPDF) { showCustomAlert('Certificado indisponível', 'O gerador de PDF não está disponível. Tente novamente.'); return; }
  const { jsPDF } = window.jspdf;
  const img = new Image();
  img.onload = () => {
    const doc = new jsPDF({ orientation:'landscape', unit:'pt', format:[1080,720] });
    const imageFormat = img.src.toLowerCase().includes('.png') ? 'PNG' : 'JPEG';
    doc.addImage(img, imageFormat, 0, 0, 1080, 720);
    const date = new Date(uObj.courseCompletedAt || Date.now()).toLocaleDateString('pt-BR');
    const nameLines = splitCertificateName(studentName);
    doc.setTextColor(8,27,56); doc.setFont('times','bold');
    let nameSize = nameLines.length === 1 ? 34 : 30;
    doc.setFontSize(nameSize);
    const widestLine = Math.max(...nameLines.map(line => doc.getTextWidth(line)));
    if (widestLine > 520) nameSize = Math.max(26, Math.floor(nameSize * 520 / widestLine));
    doc.setFontSize(nameSize);
    if (nameLines.length === 1) {
      doc.text(nameLines[0], 585, 250, {align:'center'});
    } else {
      doc.text(nameLines[0], 585, 238, {align:'center'});
      doc.text(nameLines[1], 585, 270, {align:'center'});
    }
    // O rótulo "IDZ:" já pertence à arte; desenhamos somente o código.
    doc.setFont('helvetica','bold'); doc.setFontSize(11); doc.setTextColor(20,65,105); doc.text(date, 368, 672, {align:'center'});
    doc.setFontSize(10); doc.text(uObj.certificateNumber, 553, 672, {align:'center'});
    const output = doc.output('blob'); const url = URL.createObjectURL(output); const link = document.createElement('a');
    link.href = url; link.download = `Certificado_IDZ_${studentName.replace(/\s+/g,'_')}.pdf`; link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000); addNotification('Certificado oficial baixado em PDF!');
  };
  img.onerror = () => {
    if (!img.dataset.fallback) { img.dataset.fallback = '1'; img.src = 'assets/certificado-idz-template.png'; return; }
    showCustomAlert('Certificado indisponível', 'Envie certificado-idz-template.jpg ou certificado-idz-template.png para a pasta assets do GitHub.');
  };
  img.src = 'assets/certificado-idz-clean-template.png';
}

function switchAdminTab(secName) {
  ['alunos', 'vendas', 'cart', 'modules', 'certificates', 'testcheckout', 'support', 'refunds', 'coupons'].forEach(s => {
    let elem = document.getElementById(`admin-sec-${s}`);
    if(elem) elem.style.display = (s === secName) ? 'block' : 'none';
  });
  if(secName === 'alunos') renderDashboard();
  else if(secName === 'vendas') renderSalesTab();
  else if(secName === 'cart') renderCartTab();
  else if(secName === 'modules') renderAdminModules();
  else if(secName === 'certificates') renderCertificateRequests();
  else if(secName === 'testcheckout') populateTestStudentSelect();
  else if(secName === 'support') renderAdminCollection('supportTickets','admin-support-list');
  else if(secName === 'refunds') renderAdminCollection('refundRequests','admin-refunds-list');
  else if(secName === 'coupons') renderAdminCollection('coupons','admin-coupons-list');
}

async function submitSupportTicket(event) {
  event.preventDefault(); const user=window.auth?.currentUser; if(!user)return;
  const subject=safeGetValue('support-subject'),message=safeGetValue('support-message'); if(!subject||!message)return;
  const {doc,setDoc}=window.firebaseModules,id=`${user.uid}_${Date.now()}`;
  await setDoc(doc(window.db,'supportTickets',id),{uid:user.uid,email:user.email,subject,message,status:'aberto',createdAt:new Date().toISOString()});
  event.target.reset();addNotification('Solicitação de suporte enviada.');showSuccessModal('Solicitação enviada para o suporte.');loadAccountRequests();
}
async function submitRefundRequest(event) {
  event.preventDefault();const user=window.auth?.currentUser;if(!user)return;const reason=safeGetValue('refund-reason');if(!reason)return;
  const {doc,setDoc}=window.firebaseModules,id=`${user.uid}_${Date.now()}`;
  await setDoc(doc(window.db,'refundRequests',id),{uid:user.uid,email:user.email,reason,status:'solicitado',createdAt:new Date().toISOString()});
  event.target.reset();addNotification('Pedido de reembolso enviado para análise.');showSuccessModal('Pedido enviado para análise.');loadAccountRequests();
}
async function loadAccountRequests() {
  const user=window.auth?.currentUser;if(!user||!window.db)return;const {collection,getDocs,query,where}=window.firebaseModules;
  for(const [name,target] of [['supportTickets','support-history'],['refundRequests','refund-history']]){const host=document.getElementById(target);if(!host)continue;try{const snap=await getDocs(query(collection(window.db,name),where('uid','==',user.uid)));host.innerHTML=snap.empty?'':snap.docs.map(d=>{const x=d.data();return `<div class="glass-panel" style="padding:12px;margin-top:8px"><strong>${escapeHTML(x.subject||'Reembolso')}</strong><br><small>Status: ${escapeHTML(x.status||'aberto')}</small></div>`}).join('')}catch(_){host.innerHTML='<small>Não foi possível carregar o histórico agora.</small>'}}
}
async function adminApi(path,options={}){return backendRequest(path,options)}
async function renderAdminCollection(name,targetId){if(!isAdmin)return;const host=document.getElementById(targetId);if(!host)return;try{const {collection,getDocs}=window.firebaseModules,snap=await getDocs(collection(window.db,name));host.innerHTML=snap.empty?'<p>Nenhum registro.</p>':snap.docs.map(d=>{const x=d.data(),id=encodeURIComponent(d.id);let actions='';if(name==='supportTickets')actions=`<button class="btn-outline" onclick="adminReplySupport('${id}')">Responder</button> <button class="btn-outline" onclick="adminReplySupport('${id}','resolvido')">Resolvido</button>`;if(name==='refundRequests')actions=`<button class="btn-outline" onclick="adminRefundStatus('${id}','em_analise')">Analisar</button> <button class="btn-outline" onclick="adminRefundStatus('${id}','aprovado')">Aprovar</button> <button class="btn-outline" onclick="adminRefundStatus('${id}','recusado')">Recusar</button> <button class="btn-outline" onclick="adminExecuteRefund('${id}','${escapeHTML(String(x.paymentId||''))}')">Reembolsar</button>`;if(name==='coupons')actions=`<button class="btn-outline" onclick="adminToggleCoupon('${id}',${x.active===false?'true':'false'})">${x.active===false?'Ativar':'Desativar'}</button>`;const detail=x.message||x.reason||(x.type?`${x.type}: ${x.value} · usos: ${x.usageCount||0}`:'');return `<div class="glass-panel" style="padding:14px;margin:8px 0"><strong>${escapeHTML(x.code||x.subject||x.email||d.id)}</strong><p style="color:var(--text-secondary)">${escapeHTML(detail)}</p><small>Status: ${escapeHTML(x.status||(x.active===false?'inativo':'ativo'))}</small><div style="margin-top:10px">${actions}</div></div>`}).join('')}catch(e){host.innerHTML='<p>Não foi possível carregar.</p>'}}
async function saveCoupon(event){event.preventDefault();if(!isAdmin)return;const code=safeGetValue('coupon-code-admin').toUpperCase().replace(/[^A-Z0-9_-]/g,''),percent=Number(safeGetValue('coupon-percent-admin'));if(!code||percent<1||percent>90)return;try{await adminApi('/api/admin/coupons',{method:'POST',body:JSON.stringify({code,type:'percent',value:percent,active:true,eligibleProducts:['idz-course-v2']})});event.target.reset();renderAdminCollection('coupons','admin-coupons-list');showSuccessModal('Cupom salvo com segurança.')}catch(e){showCustomAlert('Cupom',e.message)}}
async function adminReplySupport(encodedId,status='em_atendimento'){const reply=status==='resolvido'?'':(prompt('Resposta ao aluno:')||'').trim();if(status!=='resolvido'&&!reply)return;await adminApi(`/api/admin/support/${encodedId}`,{method:'PATCH',body:JSON.stringify({status,reply})});renderAdminCollection('supportTickets','admin-support-list')}
async function adminRefundStatus(encodedId,status){await adminApi(`/api/admin/refunds/${encodedId}`,{method:'PATCH',body:JSON.stringify({status})});renderAdminCollection('refundRequests','admin-refunds-list')}
async function adminExecuteRefund(encodedId,paymentId){await adminApi('/api/refunds',{method:'POST',headers:{'Idempotency-Key':`refund-${decodeURIComponent(encodedId)}`},body:JSON.stringify({requestId:decodeURIComponent(encodedId),paymentId})});renderAdminCollection('refundRequests','admin-refunds-list')}
async function adminToggleCoupon(encodedCode,active){await adminApi(`/api/admin/coupons/${encodedCode}`,{method:'PATCH',body:JSON.stringify({active})});renderAdminCollection('coupons','admin-coupons-list')}

async function renderCertificateRequests() {
  const body = document.getElementById('certificate-requests-body');
  if (!body) return;
  let rows = JSON.parse(localStorage.getItem('physical_certificate_requests') || '[]');
  if (window.db && window.firebaseModules) {
    try { const { collection, getDocs } = window.firebaseModules; const snap = await getDocs(collection(window.db, 'certificate_requests')); rows = snap.docs.map(d => ({uid:d.id,...d.data()})); } catch (_) {}
  }
  body.innerHTML = rows.length ? rows.map(r => `<tr><td><strong>${escapeHTML(r.fullname||'Aluno')}</strong><br><small>${escapeHTML(r.email||'')}</small></td><td>${escapeHTML(r.address?.cidade||'')}/${escapeHTML(r.address?.uf||'')}</td><td>${r.requestedAt?new Date(r.requestedAt).toLocaleDateString('pt-BR'):''}</td><td><span class="status-badge pending">${escapeHTML(r.status||'pendente')}</span><br><button class="btn-outline cert-details-toggle" type="button">VER DETALHES</button><div class="cert-request-details" hidden><p><strong>Detalhes da solicitação</strong><br>Endereço: ${escapeHTML(r.address?.end||'')}, ${escapeHTML(r.address?.num||'')} — ${escapeHTML(r.address?.bairro||'')}<br>Código: ${escapeHTML(r.certificateCode||'—')} · Envio: ${escapeHTML(r.shippingMethod||'—')}</p><p><strong>Acompanhamento da entrega</strong><br>Solicitado → Em preparação → Postado → A caminho → Entregue</p><div class="cert-actions"><button class="btn-outline" onclick="generateOfficialCertificatePDF('${encodeURIComponent(r.email||'')}')">Baixar PDF</button><button class="btn-outline" onclick="updatePhysicalCertificateStatus('${encodeURIComponent(r.uid||'')}','a_caminho')">Marcar a caminho</button><button class="btn-outline" onclick="updatePhysicalCertificateStatus('${encodeURIComponent(r.uid||'')}','entregue')">Marcar entregue</button></div></div></td></tr>`).join('') : '<tr><td colspan="4" style="text-align:center;color:var(--text-secondary)">Nenhuma solicitação recebida.</td></tr>';
  body.querySelectorAll('.cert-details-toggle').forEach(b=>b.onclick=()=>{const d=b.nextElementSibling;d.hidden=!d.hidden;b.textContent=d.hidden?'VER DETALHES':'OCULTAR DETALHES'});
}

function filterCertificateRequests(){
  const query=(document.getElementById('certificate-search')?.value||'').trim().toLowerCase();
  const status=(document.getElementById('certificate-status-filter')?.value||'').replace('_',' ');
  const isoDate=document.getElementById('certificate-date-filter')?.value||'';
  const date=isoDate?isoDate.split('-').reverse().join('/'):'';
  document.querySelectorAll('#certificate-requests-body tr').forEach(row=>{
    const text=(row.textContent||'').toLowerCase();
    row.hidden=Boolean((query&&!text.includes(query))||(status&&!text.includes(status))||(date&&!text.includes(date)));
  });
}

async function updatePhysicalCertificateStatus(encodedUid, status) {
  if (!isAdmin) return; const uid=decodeURIComponent(encodedUid); if(!uid)return;
  const trackingCode=status==='a_caminho'?(prompt('Código de rastreio:')||'').trim():'';if(status==='a_caminho'&&!trackingCode)return;
  await adminApi(`/api/admin/certificates/${encodeURIComponent(uid)}`,{method:'PATCH',body:JSON.stringify({status,trackingCode})});
  renderCertificateRequests(); showSuccessModal('Status atualizado', `O certificado foi marcado como ${status === 'a_caminho' ? 'a caminho' : 'entregue'}.`);
}

async function confirmPhysicalReceipt() {
  const u = registeredUsers.find(x => x.email === currentUser); if (!u || u.physicalCertificateStatus !== 'entregue') return;
  u.physicalCertificateStatus = 'recebido'; await saveUserToCloud(u); addNotification('Aluno confirmou o recebimento do certificado físico.', 'admin', TARGET_ADMIN_EMAIL, 'certificado_recebido'); showSuccessModal('Recebimento confirmado', 'Obrigado por confirmar a entrega.');
}

function renderDashboard() {
  safeSetText('admin-total-users', `${registeredUsers.length}`);
  updateCourseStatsUI();
  
  const tbody = document.getElementById('users-list-body'); 
  if(!tbody) return;
  tbody.innerHTML = '';

  let totalLessonsInCourse = 0;
  let totalQuizInCourse = 0;
  courseData.forEach(m => {
    if(m.lessons) {
      totalLessonsInCourse += m.lessons.length;
      m.lessons.forEach(l => { if(l.quiz && l.quiz.question) totalQuizInCourse++; });
    }
  });

  registeredUsers.forEach((u) => {
    let studentEmail = u.email;
    const safeStudentEmail = escapeHTML(studentEmail);
    const actionUid = encodeURIComponent(u.uid || '');
    const progress=u.progress||{},lessonsDoneCount=Object.values(progress.lessons||{}).filter(Boolean).length;
    const projectsDone=Object.values(progress.projects||{}).filter(Boolean).length,bonusesDone=Object.values(progress.bonuses||{}).filter(Boolean).length;

    let verifiedLabel = u.verifiedData ? `<span style="color:var(--green); font-size:10px;"><i class="fa-solid fa-circle-check"></i> Verificado</span>` : `<span style="color:var(--yellow); font-size:10px;"><i class="fa-solid fa-triangle-exclamation"></i> Pendente</span>`;

    let studentInfo = `<div style="font-weight:600; color:#fff;">${escapeHTML(u.fullname || 'Aluno')} ${verifiedLabel}</div>`;
    studentInfo += `<div style="font-size:11px; color:var(--accent-cyan);">${safeStudentEmail}</div>`;

    tbody.innerHTML += `<tr>
      <td>${studentInfo}</td>
      <td><span class="badge-status" style="${u.paid?'background:rgba(16,185,129,0.2); color:var(--green);':'background:rgba(239,68,68,0.2); color:var(--red);'}">${u.paid?'Pago':'Pendente'}</span></td>
      <td><div style="font-size:11.5px; color:#fff;">Curso: ${lessonsDoneCount}/${totalLessonsInCourse} aulas<br>Projeto Final: ${projectsDone}/7 etapas<br>Bônus: ${bonusesDone}/3</div></td>
      <td>
        <button class="btn-outline" onclick="openManageStudent(decodeURIComponent('${actionUid}'))"><i class="fa-solid fa-user-gear"></i> Gerenciar aluno</button>
      </td>
    </tr>`;
  });
}

function renderSalesTab() {
  const salesTbody = document.getElementById('sales-list-body'); 
  if(!salesTbody) return;
  salesTbody.innerHTML = '';
  salesTransactions.forEach((tx) => {
    let badgeColor = tx.status==='aprovado'?'var(--green)':(tx.status==='pendente'?'var(--yellow)':'var(--red)');
    salesTbody.innerHTML += `<tr>
      <td><strong>${escapeHTML(tx.id)}</strong><br><span style="font-size:11px; color:var(--text-secondary);">${escapeHTML(tx.email)}</span></td>
      <td>R$ ${tx.amount.toFixed(2)} (${tx.method})</td>
      <td><span class="badge-status" style="background:${badgeColor}22; color:${badgeColor};">${escapeHTML(tx.status)}</span></td>
      <td><span style="font-size:11px; color:var(--text-muted);">${escapeHTML(tx.date)}</span></td>
    </tr>`;
  });
}

async function openManageStudent(uid){
  if(!isAdmin||!uid)return;
  activeManagedStudentUid=uid;
  try{
    const data=await adminApi(`/api/admin/students/${encodeURIComponent(uid)}`);
    managedStudentData=data;
    renderManagedStudent();
    switchManagerTab('overview');
    openModal('modal-manage-student');
  }catch(e){showCustomAlert('Gerenciar aluno',e.message);}
}

function statusChip(label,ok=false,blocked=false){return `<span class="status-chip ${ok?'ok':blocked?'blocked':''}">${escapeHTML(label)}</span>`;}
function managerItem(title,subtitle,done,action,id,positive='Aprovar',negative='Remover'){
  const encoded=encodeURIComponent(String(id));
  return `<div class="manager-item"><div><strong>${escapeHTML(title)}</strong><small>${escapeHTML(subtitle)} · ${done?'Concluído':'Pendente'}</small></div><div class="manager-item-actions"><button class="btn-outline" onclick="adminStudentAction('${action}',true,{id:decodeURIComponent('${encoded}')})">${positive}</button><button class="btn-outline" onclick="adminStudentAction('${action}',false,{id:decodeURIComponent('${encoded}')})">${negative}</button></div></div>`;
}
function switchManagerTab(tab){
  document.querySelectorAll('[data-manager-tab]').forEach(button=>button.classList.toggle('active',button.dataset.managerTab===tab));
  document.querySelectorAll('.manager-panel').forEach(panel=>panel.classList.toggle('active',panel.id===`manager-panel-${tab}`));
}
function renderManagedStudent(){
  if(!managedStudentData)return;
  const {uid,profile={}}=managedStudentData,progress=managedStudentData.progress||{};
  const lessons=progress.lessons||progress.courseProgress?.lessons||{},exercises=progress.exercises||progress.courseProgress?.exercises||{},projects=progress.projects||progress.finalProjectProgress||{},bonuses=progress.bonuses||progress.bonusProgress||{};
  const completedModules=courseData.filter(mod=>(mod.lessons||[]).length&&(mod.lessons||[]).every(lesson=>lessons[lesson.id]===true&&lessonExercises(lesson).every(exercise=>exercises[exercise.id]===true))).length;
  const projectDone=finalProjectSteps().filter(step=>projects[step.id]===true).length,bonusDone=(courseV2.bonuses||[]).filter(bonus=>bonuses[bonus.id]===true).length;
  const allLessons=courseData.flatMap(mod=>mod.lessons||[]),automaticEligible=completedModules===12&&allLessons.every(lesson=>lessons[lesson.id]===true&&lessonExercises(lesson).every(exercise=>exercises[exercise.id]===true))&&projectDone===7;
  const certificateLabel=profile.certificateOverride===true?'Liberado':profile.certificateOverride===false?'Bloqueado':'Automático';
  safeSetHTML('manage-student-summary',`<div class="student-profile-main"><strong>${escapeHTML(profile.fullname||'Aluno')}</strong><span>${escapeHTML(profile.email||'')}</span><code>UID ${escapeHTML(String(uid).slice(0,10))}…</code></div><div class="manager-status"><small>Pagamento</small>${statusChip(profile.paymentStatus||'none',profile.paymentStatus==='approved')}</div><div class="manager-status"><small>Acesso</small>${statusChip(profile.courseAccess?'Liberado':'Bloqueado',profile.courseAccess,!profile.courseAccess)}</div><div class="manager-status"><small>E-mail</small>${statusChip(profile.emailVerified?'Verificado':'Não verificado',profile.emailVerified,!profile.emailVerified)}</div><div class="manager-status"><small>Certificado</small>${statusChip(certificateLabel,profile.certificateOverride===true,profile.certificateOverride===false)}</div>`);
  safeSetHTML('manager-panel-overview',`<div class="manager-overview-grid"><div class="manager-card"><h4>Progresso do curso</h4><strong>${completedModules} / 12 módulos</strong></div><div class="manager-card"><h4>Projeto Final</h4><strong>${projectDone} / 7 etapas</strong></div><div class="manager-card"><h4>Bônus</h4><strong>${bonusDone} / 3</strong></div><div class="manager-card"><h4>Pagamento</h4>${statusChip(profile.paymentStatus||'none',profile.paymentStatus==='approved')}</div><div class="manager-card"><h4>Acesso</h4>${statusChip(profile.courseAccess?'Liberado':'Bloqueado',profile.courseAccess,!profile.courseAccess)}</div><div class="manager-card"><h4>Certificado</h4>${statusChip(certificateLabel,profile.certificateOverride===true,profile.certificateOverride===false)}</div></div><div class="manager-actions"><button class="btn-outline" onclick="adminSetAccess(true)">Liberar curso</button><button class="btn-outline" onclick="adminSetAccess(false)">Revogar acesso</button><button class="btn-outline" onclick="adminCompleteCourse()">Liberar tudo</button><button class="btn-outline" onclick="adminStudentAction('courseReset')">Resetar progresso</button></div>`);
  safeSetHTML('manager-panel-course',courseData.map((mod,index)=>{const modLessons=mod.lessons||[],done=modLessons.filter(lesson=>lessons[lesson.id]===true).length;return `<details class="manager-module"><summary><div><strong>Módulo ${index+1} — ${escapeHTML(mod.title)}</strong><span>Progresso: ${done}/${modLessons.length} aulas</span></div><i class="fa-solid fa-chevron-down"></i></summary><div class="manager-module-body"><div class="manager-actions"><button class="btn-outline" onclick="adminSetModuleById('${encodeURIComponent(String(mod.id))}',true)">Aprovar módulo</button><button class="btn-outline" onclick="adminSetModuleById('${encodeURIComponent(String(mod.id))}',false)">Remover módulo</button></div>${modLessons.map((lesson,lessonIndex)=>managerItem(`Aula ${lessonIndex+1} — ${lesson.title}`,'Aula',lessons[lesson.id]===true,'lesson',lesson.id)+(lessonExercises(lesson).map(exercise=>managerItem(exercise.title||'Exercício','Exercício',exercises[exercise.id]===true,'exercise',exercise.id)).join(''))).join('')}</div></details>`}).join(''));
  safeSetHTML('manager-panel-project',`<div class="manager-actions"><button class="btn-outline" onclick="adminApproveAllProjects()">Aprovar todas</button><button class="btn-outline" onclick="adminStudentAction('projectReset')">Resetar projeto</button></div>${finalProjectSteps().map((step,index)=>managerItem(`${index+1}. ${step.title}`,'Projeto Final',projects[step.id]===true,'projectStep',step.id)).join('')}`);
  safeSetHTML('manager-panel-bonus',(courseV2.bonuses||[]).map((bonus,index)=>managerItem(`Bônus ${index+1} — ${bonus.title}`,'Conteúdo bônus',bonuses[bonus.id]===true,'bonus',bonus.id,'Liberar','Remover')).join(''));
  safeSetHTML('manager-panel-certificate',`<div class="manager-card"><h4>Elegibilidade automática</h4>${statusChip(automaticEligible?'SIM':'NÃO',automaticEligible,!automaticEligible)}<p>Override administrativo: ${escapeHTML(certificateLabel.toUpperCase())}. A liberação manual não altera o progresso.</p></div><div class="manager-actions"><button class="btn-outline" onclick="adminStudentAction('certificate',true)">Liberar certificado</button><button class="btn-outline" onclick="adminStudentAction('certificateAuto')">Voltar para automático</button><button class="btn-outline" onclick="adminStudentAction('certificate',false)">Bloquear certificado</button></div>`);
  safeSetHTML('manager-panel-access',`<div class="manager-overview-grid"><div class="manager-card"><h4>Pagamento real</h4>${statusChip(profile.paymentStatus||'none',profile.paymentStatus==='approved')}</div><div class="manager-card"><h4>Acesso ao curso</h4>${statusChip(profile.courseAccess?'Liberado':'Bloqueado',profile.courseAccess,!profile.courseAccess)}</div><div class="manager-card"><h4>Revogação administrativa</h4>${statusChip(profile.adminAccessRevoked?'SIM':'NÃO',!profile.adminAccessRevoked,profile.adminAccessRevoked)}</div></div><div class="manager-card"><strong>Revogar acesso não é reembolsar.</strong><p>O status financeiro e o histórico do Mercado Pago não serão alterados.</p></div><div class="manager-actions"><button class="btn-outline" onclick="adminSetAccess(false)">Revogar acesso</button><button class="btn-outline" onclick="adminSetAccess(true)">Restaurar acesso</button><button class="btn-outline danger-action" onclick="adminDeleteStudent()">Excluir conta</button></div>`);
  safeSetHTML('manager-panel-support','<div class="manager-card"><h4>Suporte</h4><p>Abra a seção Suporte do painel para visualizar e responder aos tickets deste aluno.</p><button class="btn-outline" onclick="closeModal(\'modal-manage-student\');switchAdminTab(\'support\')">Abrir suporte</button></div>');
  safeSetHTML('manager-panel-refund','<div class="manager-card"><h4>Reembolso</h4><p>Reembolsos financeiros permanecem separados da revogação de acesso e exigem confirmação do Mercado Pago.</p><button class="btn-outline" onclick="closeModal(\'modal-manage-student\');switchAdminTab(\'refunds\')">Abrir reembolsos</button></div>');
}
async function adminStudentAction(action,value=false,extra={}){
  if(!activeManagedStudentUid)return;
  try{await adminApi(`/api/admin/students/${encodeURIComponent(activeManagedStudentUid)}/progress`,{method:'PATCH',body:JSON.stringify({action,value,...extra})});showSuccessModal('Ação administrativa registrada com segurança.');await openManageStudent(activeManagedStudentUid);}catch(e){showCustomAlert('Ação administrativa',e.message);}
}
function adminSetItem(action,value){const ids={lesson:'manage-lesson-select',exercise:'manage-exercise-select',projectStep:'manage-project-select',bonus:'manage-bonus-select'};return adminStudentAction(action,value,{id:safeGetValue(ids[action])});}
function adminSetModule(value){const mod=courseData.find(item=>String(item.id)===safeGetValue('manage-module-select'));if(!mod)return;const lessons={},exercises={};(mod.lessons||[]).forEach(lesson=>{lessons[lesson.id]=value;lessonExercises(lesson).forEach(exercise=>exercises[exercise.id]=value)});return adminStudentAction('module',value,{lessons,exercises});}
function adminSetModuleById(encodedId,value){const mod=courseData.find(item=>String(item.id)===decodeURIComponent(encodedId));if(!mod)return;const lessons={},exercises={};(mod.lessons||[]).forEach(lesson=>{lessons[lesson.id]=value;lessonExercises(lesson).forEach(exercise=>exercises[exercise.id]=value)});return adminStudentAction('module',value,{lessons,exercises});}
async function adminApproveAllProjects(){for(const step of finalProjectSteps())await adminStudentAction('projectStep',true,{id:step.id});}
function adminCompleteCourse(){const lessons={},exercises={};courseData.forEach(mod=>(mod.lessons||[]).forEach(lesson=>{lessons[lesson.id]=true;lessonExercises(lesson).forEach(exercise=>exercises[exercise.id]=true)}));return adminStudentAction('courseAll',true,{lessons,exercises});}
async function adminSetAccess(enabled){try{await adminApi(`/api/admin/students/${encodeURIComponent(activeManagedStudentUid)}/access`,{method:'PATCH',body:JSON.stringify({enabled})});showSuccessModal(enabled?'Acesso restaurado.':'Acesso revogado sem alterar o pagamento.');await openManageStudent(activeManagedStudentUid);}catch(e){showCustomAlert('Acesso',e.message)}}
async function adminDeleteStudent(){if(!activeManagedStudentUid||!confirm('Excluir esta conta do Firebase Authentication? O histórico financeiro será preservado.'))return;try{await adminApi(`/api/admin/students/${encodeURIComponent(activeManagedStudentUid)}/delete`,{method:'POST'});closeModal('modal-manage-student');showSuccessModal('Conta excluída. O histórico financeiro foi preservado.')}catch(e){showCustomAlert('Excluir conta',e.message)}}

function renderCartTab() {
  const cBody = document.getElementById('cart-list-body');
  if(!cBody) return;
  cBody.innerHTML = '';
  let pendingSales = salesTransactions.filter(s => s.status === 'pendente' || s.status === 'recusado');
  if(pendingSales.length === 0) {
    cBody.innerHTML = `<tr><td colspan="4" style="text-align:center; color:var(--text-muted); padding:20px;">Nenhum carrinho pendente.</td></tr>`;
    return;
  }
  pendingSales.forEach((tx) => {
    const student = registeredUsers.find(user => user.email === tx.email);
    const actionUid = encodeURIComponent(student?.uid || '');
    cBody.innerHTML += `<tr>
      <td><strong>${tx.email}</strong><br><span style="font-size:11px; color:var(--text-secondary);">${tx.id}</span></td>
      <td>R$ ${tx.amount.toFixed(2)}</td>
      <td><span class="badge-status" style="background:rgba(245,158,11,0.2); color:var(--yellow);">${tx.status}</span></td>
      <td>
        ${actionUid ? `<button class="btn-outline" style="border-color:var(--green); color:var(--green); padding:6px 10px;" onclick="openManageStudent(decodeURIComponent('${actionUid}'))"><i class="fa-solid fa-user-gear"></i> Gerenciar aluno</button>` : '<small>UID não localizado</small>'}
      </td>
    </tr>`;
  });
}

function updateTxStatus(email, st) {
  let tx = salesTransactions.find(s => s.email.includes(email));
  if(tx) tx.status = st;
  localStorage.setItem('admin_sales_transactions', JSON.stringify(salesTransactions));
}

function populateTestStudentSelect() {
  const sel = document.getElementById('test-student-select');
  if(!sel) return;
  sel.innerHTML = '';
  registeredUsers.forEach(u => {
    sel.innerHTML += `<option value="${u.email}">${u.fullname || u.email} (${u.email})</option>`;
  });
}

function openTestCheckoutCustom() {
  if(!isAdmin) {
    showCustomAlert("Acesso Negado", "Apenas administradores podem testar pagamentos.");
    return;
  }
  checkoutTargetUser = window.auth?.currentUser?.uid || null;
  currentCheckoutAmount = 29.90;
  safeSetText('checkout-modal-title', 'Teste Sandbox — R$ 29,90');
  openCheckoutModal();
}

function populateLessonModuleSelect(){
  const s = document.getElementById('lesson-mod-select'); 
  if(!s) return;
  s.innerHTML='';
  courseData.forEach(m => s.innerHTML += `<option value="${m.id}">${m.title}</option>`);
}

function saveModuleData() {
  const t = safeGetValue('mod-title-input');
  if(!t) { showCustomAlert("Atenção", "Preencha o título do módulo."); return; }
  if (courseData.length >= 12) { showCustomAlert("Currículo oficial protegido", "O Course V2 possui exatamente 12 módulos. Edite os módulos existentes sem criar um currículo paralelo."); return; }
  courseData.push({ id: Date.now(), title: t, lessons: [] });
  saveCourseToCloud("Módulo criado na nuvem!"); 
  renderAdminModules(); 
  populateLessonModuleSelect();
  updateCourseStatsUI();
}

function saveLessonData() {
  const mId = safeGetValue('lesson-mod-select');
  const t = safeGetValue('lesson-title-input');
  if(!t) { showCustomAlert("Atenção", "Preencha o título da aula."); return; }

  const m = courseData.find(x => x.id == mId);
  if(!m) return;
  if(!m.lessons) m.lessons = [];

  const qText = safeGetValue('new-quiz-question');
  let quiz = null;
  if(qText) {
    quiz = {
      question: qText,
      options: [
        safeGetValue('new-quiz-opt0'),
        safeGetValue('new-quiz-opt1'),
        safeGetValue('new-quiz-opt2'),
        safeGetValue('new-quiz-opt3')
      ],
      correct: parseInt(safeGetValue('new-quiz-correct') || '0')
    };
  }

  m.lessons.push({ 
    id: Date.now(), 
    title: t, 
    bloco1: safeGetValue('lesson-bloco1-input'), 
    bloco2: safeGetValue('lesson-bloco2-input'), 
    bloco3: safeGetValue('lesson-bloco3-input'), 
    video: safeGetValue('lesson-video-url'), 
    pdfUrl: safeGetValue('lesson-pdf-url'), 
    imgUrl: safeGetValue('lesson-img-url'),
    quiz: quiz
  });

  saveCourseToCloud("Aula e quiz publicados!"); 
  renderAdminModules();
  updateCourseStatsUI();
}

function renderAdminModules() {
  const c = document.getElementById('admin-modules-list-container'); 
  if(!c) return;
  c.innerHTML = '';
  courseData.forEach((m) => {
    let lessonsHtml = '';
    if (m.lessons) {
      m.lessons.forEach((l) => {
        lessonsHtml += `<div class="admin-lesson-item-box">
          <span><i class="fa-solid fa-file-video" style="color:var(--accent-cyan); margin-right:6px;"></i> ${escapeHTML(l.title)}</span>
          <div>
            <button class="btn-outline" style="padding:4px 8px; font-size:11px;" onclick="openEditLessonModal(${m.id}, ${l.id})" title="Editar"><i class="fa-solid fa-pen"></i></button>
            <button class="btn-outline" style="padding:4px 8px; font-size:11px; border-color:var(--red); color:var(--red);" onclick="deleteLesson(${m.id}, ${l.id})" title="Excluir"><i class="fa-solid fa-trash"></i></button>
          </div>
        </div>`;
      });
    }
    c.innerHTML += `<div class="admin-mod-box">
      <div class="admin-mod-header" onclick="toggleAdminAccordion(this)">
        <span><i class="fa-regular fa-folder" style="color:var(--accent-cyan); margin-right:8px;"></i> ${escapeHTML(m.title)}</span>
        <i class="fa-solid fa-chevron-down" style="font-size:10px;"></i>
      </div>
      <div class="admin-mod-body">
        <h5 style="font-size:12px; color:var(--text-secondary); margin-bottom:8px;">Aulas do Módulo:</h5>
        ${lessonsHtml || '<p style="font-size:12px; color:var(--text-muted);">Nenhuma aula.</p>'}
      </div>
    </div>`;
  });
}

function openEditLessonModal(modId, lessonId) {
  const mod = courseData.find(m => m.id == modId);
  const lesson = mod?.lessons?.find(l => l.id == lessonId);
  if(!lesson) return;

  safeSetValue('edit-mod-id', modId);
  safeSetValue('edit-lesson-id', lessonId);
  safeSetValue('edit-lesson-title', lesson.title || '');
  safeSetValue('edit-lesson-bloco1', lesson.bloco1 || '');
  safeSetValue('edit-lesson-bloco2', lesson.bloco2 || '');
  safeSetValue('edit-lesson-bloco3', lesson.bloco3 || '');
  safeSetValue('edit-lesson-video', lesson.video || '');
  safeSetValue('edit-lesson-pdf', lesson.pdfUrl || '');
  safeSetValue('edit-lesson-img', lesson.imgUrl || '');

  if(lesson.quiz) {
    safeSetValue('edit-quiz-question', lesson.quiz.question || '');
    safeSetValue('edit-quiz-opt0', lesson.quiz.options?.[0] || '');
    safeSetValue('edit-quiz-opt1', lesson.quiz.options?.[1] || '');
    safeSetValue('edit-quiz-opt2', lesson.quiz.options?.[2] || '');
    safeSetValue('edit-quiz-opt3', lesson.quiz.options?.[3] || '');
    safeSetValue('edit-quiz-correct', lesson.quiz.correct || 0);
  } else {
    safeSetValue('edit-quiz-question', '');
    safeSetValue('edit-quiz-opt0', '');
    safeSetValue('edit-quiz-opt1', '');
    safeSetValue('edit-quiz-opt2', '');
    safeSetValue('edit-quiz-opt3', '');
  }

  openModal('modal-edit-lesson');
}

function saveEditedLesson() {
  const modId = safeGetValue('edit-mod-id');
  const lessonId = safeGetValue('edit-lesson-id');
  const mod = courseData.find(m => m.id == modId);
  if(!mod) return;
  const lesson = mod.lessons.find(l => l.id == lessonId);
  if(!lesson) return;

  lesson.title = safeGetValue('edit-lesson-title');
  lesson.bloco1 = safeGetValue('edit-lesson-bloco1');
  lesson.bloco2 = safeGetValue('edit-lesson-bloco2');
  lesson.bloco3 = safeGetValue('edit-lesson-bloco3');
  lesson.video = safeGetValue('edit-lesson-video');
  lesson.pdfUrl = safeGetValue('edit-lesson-pdf');
  lesson.imgUrl = safeGetValue('edit-lesson-img');

  const qText = safeGetValue('edit-quiz-question');
  if(qText) {
    lesson.quiz = {
      question: qText,
      options: [
        safeGetValue('edit-quiz-opt0'),
        safeGetValue('edit-quiz-opt1'),
        safeGetValue('edit-quiz-opt2'),
        safeGetValue('edit-quiz-opt3')
      ],
      correct: parseInt(safeGetValue('edit-quiz-correct') || '0')
    };
  }

  saveCourseToCloud("Aula e quiz atualizados na nuvem!");
  closeModal('modal-edit-lesson');
  renderAdminModules();
}

function deleteLesson(modId, lessonId) {
  if(!confirm("Deseja realmente excluir esta aula?")) return;
  const mod = courseData.find(m => m.id === modId);
  if (mod && mod.lessons) {
    mod.lessons = mod.lessons.filter(l => l.id !== lessonId);
    saveCourseToCloud("Aula removida!");
    renderAdminModules();
    updateCourseStatsUI();
  }
}

async function openCheckoutModal() {
  try {
    const {user}=await requireFirebaseSession();
    checkoutTargetUser=user;
  } catch (_) {
    sessionStorage.setItem('pending_checkout', JSON.stringify({ amount: currentCheckoutAmount, createdAt: Date.now() }));
    openAuthModal('login');
    showCustomAlert('Entre para continuar', 'Entre na sua conta para continuar o pagamento.');
    return;
  }
  await destroyCardForm();
  resetPixPanel();
  updateCheckoutPrice();
  openModal('modal-custom-checkout');
  selectCheckoutMethod('pix');
}

function updateCheckoutPrice(){
  const label=`R$ ${Number(currentCheckoutAmount).toFixed(2).replace('.',',')}`;
  safeSetText('checkout-modal-title',label);
  document.querySelectorAll('[data-checkout-price]').forEach(element=>element.textContent=label);
  const submit=document.getElementById('form-checkout__submit');if(submit)submit.textContent=`PAGAR ${label}`;
}

async function selectCheckoutMethod(method) {
  const selected=method==='card'?'card':'pix';
  document.querySelectorAll('.checkout-method').forEach(button=>button.classList.toggle('active',button.id===`checkout-method-${selected}`));
  document.querySelectorAll('.checkout-panel').forEach(panel=>panel.classList.toggle('active',panel.id===`checkout-panel-${selected}`));
  if(selected==='card')await initializeCardForm();
}

async function mercadoPagoBrowserConfig(){
  const response=await fetch(`${RAILWAY_BACKEND_URL}/api/config`),config=await response.json().catch(()=>({}));
  if(!response.ok||!config.mercadoPagoPublicKey)throw new Error('A Public Key do Mercado Pago não está configurada no backend.');
  if(config.mercadoPagoCredentialsCompatible!==true)throw new Error('As credenciais pública e privada do Mercado Pago não pertencem ao mesmo ambiente.');
  return config;
}

let mercadoPagoSdkPromise = null;
function loadMercadoPagoSdk(){
  if(window.MercadoPago)return Promise.resolve();
  if(mercadoPagoSdkPromise)return mercadoPagoSdkPromise;
  mercadoPagoSdkPromise=new Promise((resolve,reject)=>{
    const existing=document.querySelector('script[data-mercado-pago-sdk]');
    if(existing){existing.addEventListener('load',resolve,{once:true});existing.addEventListener('error',()=>reject(new Error('Não foi possível carregar o pagamento seguro.')),{once:true});return;}
    const script=document.createElement('script');
    script.src='https://sdk.mercadopago.com/js/v2';
    script.async=true;
    script.dataset.mercadoPagoSdk='true';
    script.onload=resolve;
    script.onerror=()=>reject(new Error('Não foi possível carregar o pagamento seguro.'));
    document.head.appendChild(script);
  });
  return mercadoPagoSdkPromise;
}

async function initializeCardForm(){
  const form=document.getElementById('form-checkout');
  if(!form||cardFormController)return;
  const status=document.getElementById('card-submit-status');if(status)status.textContent='Carregando cartão seguro…';
  try{
    const {user}=await requireFirebaseSession();
    const config=await mercadoPagoBrowserConfig();
    await loadMercadoPagoSdk();
    if (!window.MercadoPago) throw new Error('O SDK seguro do Mercado Pago não carregou.');
    const mp = new MercadoPago(config.mercadoPagoPublicKey, { locale: 'pt-BR' });
    document.getElementById('form-checkout__cardholderEmail').value=user.email||'';
    cardFormController=mp.cardForm({
      amount:Number(currentCheckoutAmount).toFixed(2),
      iframe:true,
      form:{
        id:'form-checkout',
        cardNumber:{id:'form-checkout__cardNumber',placeholder:'0000 0000 0000 0000'},
        expirationDate:{id:'form-checkout__expirationDate',placeholder:'MM/AA'},
        securityCode:{id:'form-checkout__securityCode',placeholder:'CVV'},
        cardholderName:{id:'form-checkout__cardholderName',placeholder:'Como está no cartão'},
        issuer:{id:'form-checkout__issuer',placeholder:'Banco emissor'},
        installments:{id:'form-checkout__installments',placeholder:'Parcelas'},
        identificationType:{id:'form-checkout__identificationType',placeholder:'Tipo'},
        identificationNumber:{id:'form-checkout__identificationNumber',placeholder:'Somente números'},
        cardholderEmail:{id:'form-checkout__cardholderEmail',placeholder:'seu@email.com'}
      },
      callbacks: {
        onFormMounted:error=>{
          if(error){const message=getFriendlyCheckoutError(error);if(status)status.textContent=message;console.warn('card_form_mount_failed',{type:String(error?.type||error?.name||'unknown')});return;}
          if(status)status.textContent='Cartão seguro carregado.';
        },
        onSubmit:async event=>{
          event.preventDefault();
          const submit=document.getElementById('form-checkout__submit');if(submit)submit.disabled=true;
          try{
            const data=cardFormController.getCardFormData();
            if(!data?.token)throw new Error('A tokenização segura do cartão não foi concluída. Confira os campos.');
            const payload=await backendRequest('/api/payments/card',{method:'POST',headers:{'Idempotency-Key':crypto.randomUUID()},body:JSON.stringify({token:data.token,payment_method_id:data.paymentMethodId,issuer_id:data.issuerId,installments:Number(data.installments),payer:{email:data.cardholderEmail,identification:{type:data.identificationType,number:data.identificationNumber}},couponCode:appliedCouponCode||undefined})});
            if(status)status.textContent=`Status: ${payload.status||'em processamento'}.`;
            showSuccessModal('Pagamento enviado para processamento. O acesso depende da aprovação confirmada.');
          }catch(error){const message=getFriendlyCheckoutError(error,'Não foi possível processar o cartão. Confira os dados e tente novamente.');if(status)status.textContent=message;showCustomAlert('Pagamento não concluído',message)}finally{if(submit)submit.disabled=false}
        },
        onFetching:()=>{if(status)status.textContent='Validando dados seguros…';return Promise.resolve();}
      }
    });
    if(!cardFormController||typeof cardFormController.getCardFormData!=='function')throw new Error('O formulário seguro do cartão não foi inicializado.');
  }catch(e){cardFormController=null;const message=getFriendlyCheckoutError(e);if(status)status.textContent=message;console.warn('card_form_initialization_failed',{type:String(e?.name||e?.type||'unknown')});showCustomAlert('Checkout indisponível',message);}
}

async function submitIdzPix(){
  const status=document.getElementById('pix-submit-status');if(status)status.textContent='Gerando PIX seguro…';
  try{
    const {user}=await requireFirebaseSession();
    const cpf=safeGetValue('pix-payer-cpf').replace(/\D/g,'');
    const payload=await backendRequest('/api/payments/pix',{method:'POST',headers:{'Idempotency-Key':crypto.randomUUID()},body:JSON.stringify({payment_method_id:'pix',payer:{email:user.email,identification:cpf?{type:'CPF',number:cpf}:undefined},couponCode:appliedCouponCode||undefined})});
    showPixPayment(payload);if(status)status.textContent=`Status: ${payload.status||'pending'}. O acesso continua bloqueado até aprovação.`;
  }catch(e){if(status)status.textContent=e.message;showCustomAlert('Não foi possível gerar o PIX',e.message);}
}
