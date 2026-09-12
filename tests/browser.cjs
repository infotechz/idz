/* Run with Playwright installed. All authenticated tests use isolated SDK/API fixtures.
   No production database writes, notifications or payments are sent. */
const {chromium}=require('playwright');const fs=require('fs'),path=require('path'),http=require('http'),assert=require('assert/strict');
const root=path.resolve(__dirname,'..'),out=process.env.IDZ_QA_OUTPUT||path.join(root,'qa-output');fs.mkdirSync(out,{recursive:true});
const widths=[360,375,390,412,430,768,1024,1280,1366,1440,1920];const results=[],errors=[],network=[];
const mime={'.html':'text/html','.js':'text/javascript','.css':'text/css','.svg':'image/svg+xml','.png':'image/png','.webp':'image/webp','.ico':'image/x-icon','.webmanifest':'application/manifest+json'};
const server=http.createServer((req,res)=>{const name=decodeURIComponent(req.url.split('?')[0]);const file=path.resolve(root,'.'+(name==='/'?'/index.html':name));if(!file.startsWith(root+path.sep)){res.writeHead(403);return res.end();}fs.readFile(file,(e,b)=>{if(e){res.writeHead(404);return res.end();}res.setHeader('Content-Type',mime[path.extname(file)]||'application/octet-stream');res.end(b);});});
async function fixture(context,role){
 await context.addInitScript(({role})=>{
   localStorage.setItem('idz_cookie_consent','necessary');window.__writes=[];window.__role=role;
   window.__profile={uid:'qa-user',email:'aluno@example.invalid',fullname:'Marina de Oliveira',paid:role!=='UNPAID',courseAccess:role!=='UNPAID',emailVerified:true,createdAt:'2026-09-01T12:00:00Z'};
   window.__fixtureUser=role==='VISITOR'||role==='LOADING'?null:{uid:'qa-user',email:'aluno@example.invalid',displayName:'Marina de Oliveira',emailVerified:true,providerData:[{providerId:'password'}],getIdToken:async()=> 'isolated-fixture-token',getIdTokenResult:async()=>({claims:{admin:role==='ADMIN'}}),reload:async()=>{}};
   window.auth={currentUser:window.__fixtureUser};window.db={};window.storage={};
   const snapshot=(value,id='qa-record')=>({id,exists:()=>!!value,data:()=>value});
   window.firebaseModules={
     onAuthStateChanged:(_auth,cb)=>{window.__authCallback=cb;if(role!=='LOADING')setTimeout(()=>cb(window.__fixtureUser),0);return()=>{};},
     doc:(_db,collection,id)=>({collection,id}),collection:(_db,name)=>({collection:name}),query:r=>r,where:()=>({}),orderBy:()=>({}),limit:()=>({}),
     getDoc:async r=>snapshot(r.collection==='users'?window.__profile:r.collection==='progress'?{lessons:{101:true,102:true},exercises:{},projects:{}}:null),
     getDocs:async r=>{const data=r.collection==='supportTickets'?[snapshot({subject:'Dúvida sobre a aula',message:'Como baixar o material?',status:'respondido',createdAt:'2026-09-10T12:00:00Z',category:'Aulas',reply:'O material fica na aba Materiais.'})]:r.collection==='coupons'?[snapshot({code:'ESTUDAR',type:'percent',value:10,active:true})]:r.collection==='users'?[snapshot(window.__profile)]:[];return{docs:data,empty:!data.length};},
     onSnapshot:(r,cb)=>{if(r.collection==='modules')setTimeout(()=>cb({docs:[]}),0);else if(r.collection==='users'){window.__entitlementCallback=cb;setTimeout(()=>cb(snapshot(window.__profile)),0);}return()=>{if(r.collection==='users')window.__entitlementCallback=null;};},
     setDoc:async(r,data)=>{window.__writes.push({r,data});},deleteDoc:async()=>{},ref:()=>({}),uploadBytes:async()=>({}),getDownloadURL:async()=>'',
     signOut:async()=>{window.auth.currentUser=null;await window.__authCallback(null);},sendPasswordResetEmail:async()=>{},sendEmailVerification:async()=>{},updateProfile:async()=>{},updateEmail:async()=>{},updatePassword:async()=>{},setPersistence:async()=>{},browserLocalPersistence:{},browserSessionPersistence:{},
     signInWithEmailAndPassword:async()=>({user:window.__fixtureUser}),createUserWithEmailAndPassword:async()=>({user:window.__fixtureUser})
   };window.firebaseMessaging={messaging:null};window.__approve=()=>{window.__profile.paid=true;window.__profile.courseAccess=true;window.__profile.paymentStatus='approved';window.__entitlementCallback?.(snapshot(window.__profile));};
 },{role});
 await context.route('**/*',async route=>{
   const url=route.request().url();
   if(url.endsWith('/index.html')||url==='http://127.0.0.1:4174/'){
     let html=fs.readFileSync(path.join(root,'index.html'),'utf8');html=html.replace(/<script(?: type="module")?>[\s\S]*?<\/script>/g,s=>s.includes('initializeApp')?'':s);return route.fulfill({body:html,contentType:'text/html'});
   }
   if(url.includes('up.railway.app')){
     const pathname=new URL(url).pathname;let value={};
     if(pathname==='/api/auth/me')value={authenticated:true,uid:'qa-user',email:'aluno@example.invalid',admin:role==='ADMIN'};
     if(pathname==='/api/admin/users')value={students:[{uid:'qa-user',email:'aluno@example.invalid',fullname:'Marina de Oliveira',paid:true,createdAt:'2026-09-01',progress:{lessonsCompleted:2}}]};
     if(pathname==='/api/admin/notification-recipients')value={students:[]};
     if(pathname==='/api/config')value={mercadoPagoPublicKey:'fixture-public-key',mercadoPagoCredentialsCompatible:true,mercadoPagoConfigured:true};
     if(pathname==='/api/payments/pix')value={status:'pending',pix:{qr_code:'FIXTURE-PIX-CODE',qr_code_base64:fs.readFileSync(path.join(root,'assets/favicon/favicon-192x192.png')).toString('base64')}};
     if(pathname==='/api/coupons/validate')value={valid:true,finalAmount:26.91,discount:2.99};
     network.push({fixture:true,path:pathname,method:route.request().method()});return route.fulfill({json:value});
   }
   if(url.includes('sdk.mercadopago.com'))return route.fulfill({contentType:'text/javascript',body:`window.MercadoPago=class{cardForm(config){window.__cardConfig=config;setTimeout(()=>config.callbacks.onFormMounted(),0);return{getCardFormData:()=>({token:'fixture',paymentMethodId:'visa',installments:1,cardholderEmail:'aluno@example.invalid',identificationType:'CPF',identificationNumber:'00000000000'}),unmount(){}}}};`});
   if(url.startsWith('http://127.0.0.1:4174/')||url.includes('fonts.googleapis.com')||url.includes('fonts.gstatic.com')||url.includes('cdnjs.cloudflare.com'))return route.continue();
   if(url.includes('youtube'))return route.fulfill({body:'<html><body>Vídeo de teste isolado</body></html>',contentType:'text/html'});
   return route.fulfill({body:'',status:200});
 });
}
async function overflow(page,label,width){
 const check=await page.evaluate(()=>({width:innerWidth,scroll:document.documentElement.scrollWidth,bad:[...document.querySelectorAll('body *')].filter(el=>{const r=el.getBoundingClientRect();return r.width&&r.right>innerWidth+1&&getComputedStyle(el).position!=='fixed';}).slice(0,6).map(el=>el.tagName+'#'+el.id+'.'+el.className)}));
 results.push({view:label,width,scrollWidth:check.scroll,pass:check.scroll<=width});assert.ok(check.scroll<=width,JSON.stringify({label,...check}));
}
async function capture(page,label){await page.screenshot({path:path.join(out,label+'.png'),fullPage:false});}
(async()=>{await new Promise(r=>server.listen(4174,'127.0.0.1',r));const browser=await chromium.launch({headless:true,...(process.env.IDZ_BROWSER_PATH?{executablePath:process.env.IDZ_BROWSER_PATH}:{})});try{
 for(const role of ['LOADING','VISITOR','STUDENT','ADMIN','UNPAID']){
  const context=await browser.newContext({viewport:{width:1366,height:900},reducedMotion:'reduce'});await fixture(context,role);const page=await context.newPage();page.on('pageerror',e=>errors.push({role,message:e.message}));page.on('response',r=>{if(r.url().startsWith('http://127.0.0.1:4174')&&r.status()>=400)errors.push({role,message:r.url()+': '+r.status()});});
  await page.goto('http://127.0.0.1:4174/',{waitUntil:'domcontentloaded'});await page.waitForFunction(()=>typeof renderStudentView==='function');
  if(role==='LOADING'){assert.equal(await page.evaluate(()=>window.IDZ_AUTH_STATE),'AUTH_LOADING');await page.setViewportSize({width:390,height:844});await page.click('.hamburger');assert.match(await page.locator('#idz20a-drawer').innerText(),/Carregando sessão/);assert.doesNotMatch(await page.locator('#idz20a-drawer').innerText(),/Começar agora/);await page.keyboard.press('Escape');await context.close();continue;}
  await page.waitForFunction(role=>window.IDZ_AUTH_STATE===(role==='UNPAID'?'STUDENT':role),role);
  if(role==='VISITOR'){
   await capture(page,'home-desktop');
   assert.equal(await page.locator('#public-modules details').count(),12);
   for(const width of widths){await page.setViewportSize({width,height:900});await overflow(page,'home',width);await page.locator('#public-modules summary').first().click();await overflow(page,'module-open',width);await page.locator('#public-modules summary').first().click();await page.evaluate(()=>openFreeLesson());await overflow(page,'free-lesson',width);await page.evaluate(()=>closeFreeLesson());await page.evaluate(()=>openAuthModal('login'));await overflow(page,'login',width);await page.evaluate(()=>switchAuthTab('register'));await overflow(page,'register',width);await page.evaluate(()=>closeModal('modal-auth'));await page.evaluate(()=>openCertificatePreview());await overflow(page,'certificate-preview',width);await page.evaluate(()=>closeModal('certificate-preview-modal'));}
   await page.setViewportSize({width:390,height:844});await page.evaluate(()=>scrollTo(0,0));await capture(page,'home-mobile');await page.click('.hamburger');await capture(page,'visitor-menu-mobile');await page.keyboard.press('Escape');assert.equal(await page.locator('.hamburger').getAttribute('aria-expanded'),'false');
   for(const [id,name]of [['course-details','modules'],['idz-free-lesson','free-lesson'],['idz-project-preview','project'],['idz-bonuses','bonuses'],['idz-certificate-preview','certificate'],['faq','faq']]){await page.setViewportSize({width:1366,height:900});await page.locator('#'+id).scrollIntoViewIfNeeded();await capture(page,name+'-desktop');}
  }
  if(role==='STUDENT'){
   await page.waitForSelector('#student-dashboard .continue-card');
   const themeColors=[];
   for(const theme of ['azul','roxo','vermelho','rosa','rgb']){
    await page.evaluate(theme=>changeTheme(theme),theme);
    themeColors.push(await page.locator('.continue-card').evaluate(el=>getComputedStyle(el).backgroundImage));
    for(const width of [360,390,412,768,1366,1920]){await page.setViewportSize({width,height:900});await overflow(page,'theme-'+theme,width);}
    await capture(page,'theme-'+theme);
   }
   assert.equal(new Set(themeColors).size,5,'Every theme must visibly change the card surface');
   assert.equal(await page.locator('.continue-card .btn').evaluate(el=>getComputedStyle(el).animationName),'none');
   await page.evaluate(()=>changeTheme('roxo'));await page.reload({waitUntil:'domcontentloaded'});await page.waitForSelector('#student-dashboard .continue-card');assert.equal(await page.evaluate(()=>document.body.classList.contains('theme-roxo')),true);
   await page.evaluate(()=>changeTheme('azul'));
   for(const width of widths){await page.setViewportSize({width,height:900});for(const view of ['dashboard','lessons','exercises','modules','progress','project','bonuses','certificate']){await page.evaluate(view=>showMemberArea(view),view);await overflow(page,view,width);if([390,1366].includes(width))await capture(page,view+'-'+width);}
    for(const tab of ['perfil','verificacao','seguranca','tema','conexoes','notificacoes','suporte','reembolso']){await page.evaluate(tab=>openSettingsSection(tab),tab);await overflow(page,'settings-'+tab,width);if([390,1366].includes(width)&&['perfil','suporte','verificacao'].includes(tab))await capture(page,tab+'-'+width);}
   }
   await page.setViewportSize({width:390,height:844});await page.evaluate(()=>showMemberArea());await page.click('.hamburger');await capture(page,'student-menu-mobile');assert.doesNotMatch(await page.locator('#idz20a-drawer').innerText(),/Começar agora|Entrar/);await page.keyboard.press('Escape');
   await page.evaluate(()=>{showMemberArea('exercises');showCourseExercise(1,101);});await page.locator('#student-exercises-view .quiz-option-btn').nth(1).click();assert.match(await page.locator('#student-exercises-view .quiz-feedback.error').innerText(),/incorreta/);await page.locator('#student-exercises-view .quiz-option-btn').first().click();assert.ok(await page.locator('#student-exercises-view .quiz-feedback.success').count());assert.equal(await page.locator('#student-exercises-view').isVisible(),true);
   await page.evaluate(()=>showMemberArea('project'));await page.locator('.project-step input').first().check();assert.equal(await page.evaluate(()=>getCourseProgressStats().completedProjectStepCount),1);
   await page.evaluate(()=>{showMemberArea('lessons');loadLessonContent(2,201);showMemberArea();});assert.match(await page.locator('.continue-card').innerText(),/Teclado e mouse/);
   // Denial remains enforced when an authenticated profile has no entitlement.
   await page.evaluate(()=>{currentProfile().paid=false;currentProfile().courseAccess=false;showMemberArea('lessons');});assert.equal(await page.locator('#member-area').isVisible(),false);
  }
  if(role==='ADMIN'){
   await page.waitForSelector('#admin-area',{state:'visible'});await page.waitForFunction(()=>adminUsersLoaded);
   for(const width of widths){await page.setViewportSize({width,height:900});for(const tab of ['overview','alunos','vendas','cart','modules','certificates','testcheckout','support','refunds','coupons']){await page.evaluate(tab=>switchAdminTab(tab),tab);await overflow(page,'admin-'+tab,width);if([390,1366].includes(width)&&['overview','alunos','modules'].includes(tab))await capture(page,'admin-'+tab+'-'+width);}}
   await page.setViewportSize({width:390,height:844});await page.click('.hamburger');await page.locator('#idz20a-drawer summary').filter({hasText:'Financeiro'}).click();await capture(page,'admin-menu-mobile');assert.match(await page.locator('#idz20a-drawer').innerText(),/Pagamentos/);await page.keyboard.press('Escape');
  }
  if(role==='UNPAID'){
   await page.evaluate(()=>openCheckoutModal());await page.waitForSelector('#modal-custom-checkout.active');
   for(const width of widths){await page.setViewportSize({width,height:900});await overflow(page,'checkout-pix',width);await page.evaluate(()=>selectCheckoutMethod('card'));await overflow(page,'checkout-card',width);await page.evaluate(()=>selectCheckoutMethod('pix'));if([390,1366].includes(width))await capture(page,'checkout-'+width);}
   await page.evaluate(()=>submitIdzPix());assert.equal(await page.locator('#pix-copy-code').inputValue(),'FIXTURE-PIX-CODE');assert.equal(await page.locator('#payment-confirmed-modal').count(),0);await page.evaluate(()=>selectCheckoutMethod('card'));assert.equal(await page.locator('#pix-payment-panel').isVisible(),false);await page.evaluate(()=>selectCheckoutMethod('pix'));assert.equal(await page.locator('#pix-payment-panel').isVisible(),true);await page.evaluate(()=>window.__approve());await page.waitForSelector('#payment-confirmed-modal.active');await capture(page,'payment-confirmation-mobile');await overflow(page,'confirmation',1920);
  }
  const duplicates=await page.evaluate(()=>{const ids=[...document.querySelectorAll('[id]')].map(el=>el.id);return ids.filter((id,i)=>ids.indexOf(id)!==i);});assert.deepEqual(duplicates,[]);await context.close();
 }
 assert.deepEqual(errors,[]);fs.writeFileSync(path.join(out,'results.json'),JSON.stringify({results,errors,network},null,2));console.log(`${results.length} viewport/view checks passed. SDK/API fixtures only.`);
}finally{await browser.close();server.close();fs.writeFileSync(path.join(out,'results.json'),JSON.stringify({results,errors,network},null,2));}})().catch(error=>{console.error(error);server.close();process.exitCode=1;});
