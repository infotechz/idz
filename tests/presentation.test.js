const test=require('node:test');const assert=require('node:assert/strict');const fs=require('fs'),path=require('path'),vm=require('vm');
const root=path.resolve(__dirname,'..');const ui=fs.readFileSync(path.join(root,'ui/presentation.js'),'utf8');
function section(start,end){return ui.slice(ui.indexOf(start),ui.indexOf(end,ui.indexOf(start)));}
test('navigation keeps loading, visitor, student and admin actions separate',()=>{
 const ctx=vm.createContext({});vm.runInContext(section('function navigationForPresentation','function renderShellNavigation'),ctx);
 const actions=role=>Array.from(ctx.navigationForPresentation(role),item=>item.action);
 assert.deepEqual(actions('AUTH_LOADING'),['noop']);assert.ok(actions('VISITOR').includes('auth'));
 for(const role of ['STUDENT','ADMIN']){assert.ok(!actions(role).includes('auth'));assert.ok(!actions(role).includes('buy'));assert.ok(actions(role).includes('logout'));}
 assert.ok(!actions('STUDENT').some(action=>action.startsWith('admin')));assert.ok(actions('ADMIN').includes('admin-finance'));
});
test('resume uses the account-specific lesson and falls back when content changes',()=>{
 const values=new Map();const ctx=vm.createContext({courseData:[{id:1,lessons:[{id:101},{id:102}]},{id:2,lessons:[{id:201}]}],progressKey:()=> 'user-a',localStorage:{getItem:k=>values.get(k)},isLessonCompleted:l=>l.id===101});
 vm.runInContext(section('function currentResumeLesson','function renderStudentDashboard'),ctx);
 assert.equal(ctx.currentResumeLesson().lesson.id,102);
 values.set('idz_resume_user-a',JSON.stringify({modId:2,lessonId:201}));assert.equal(ctx.currentResumeLesson().lesson.id,201);
 values.set('idz_resume_user-a',JSON.stringify({modId:4,lessonId:999}));assert.equal(ctx.currentResumeLesson().lesson.id,102);
 values.set('idz_resume_user-a','invalid json');assert.equal(ctx.currentResumeLesson().lesson.id,102);
});
test('late Firestore services resolve initialization without a second auth observer',async()=>{
 const window=new EventTarget();window.firebaseModules={};const ctx=vm.createContext({window,setTimeout,clearTimeout,Promise,Error});
 vm.runInContext(section('function waitForFirebaseServices','function stopCheckoutWatcher'),ctx);
 const pending=ctx.waitForFirebaseServices(1000);window.db={};window.firebaseModules.getDoc=()=>{};window.dispatchEvent(new Event('idz:firebase-services-ready'));await pending;
 await ctx.waitForFirebaseServices(10);
});
test('Firestore service timeout is explicit instead of rendering private data',async()=>{
 const ctx=vm.createContext({window:new EventTarget(),setTimeout,clearTimeout,Promise,Error});vm.runInContext(section('function waitForFirebaseServices','function stopCheckoutWatcher'),ctx);
 await assert.rejects(ctx.waitForFirebaseServices(5),/conectar aos dados/);
});
test('certificate availability honors a denied override even with all requirements complete',()=>{
 let profile={},complete=false;const ctx=vm.createContext({currentProfile:()=>profile,getCourseProgressStats:()=>({complete})});vm.runInContext(section('function certificateAvailable','function showStudentPage'),ctx);
 assert.equal(ctx.certificateAvailable(),false);complete=true;assert.equal(ctx.certificateAvailable(),true);profile={certificateOverride:false};assert.equal(ctx.certificateAvailable(),false);profile={certificateOverride:true};complete=false;assert.equal(ctx.certificateAvailable(),true);
});
