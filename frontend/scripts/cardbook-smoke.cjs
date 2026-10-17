const {chromium}=require('playwright');const assert=require('node:assert/strict');
const BASE=(process.env.CARDBOOK_TEST_URL||'http://127.0.0.1:4190/dist').replace(/\/$/,'');
(async()=>{
const browser=await chromium.launch({headless:true,...(process.env.CHROME_CHANNEL?{channel:process.env.CHROME_CHANNEL}:{})});const context=await browser.newContext({viewport:{width:390,height:844},hasTouch:true,isMobile:true});const page=await context.newPage();page.setDefaultTimeout(20000);const errors=[];page.on('pageerror',e=>errors.push(e.message));
await page.goto(BASE+'/cardbook/index.html');
await page.evaluate(async()=>{
const {write}=await import('./db.js');const c=document.createElement('canvas');c.width=400;c.height=600;const x=c.getContext('2d');x.fillStyle='#ca9831';x.fillRect(0,0,400,600);const blob=await new Promise(r=>c.toBlob(r,'image/png'));
await write([{store:'images',value:{id:'legacy-image',blob,thumb:blob,width:400,height:600}},{store:'cards',value:{id:'legacy-card',name:'旧收藏',text:'旧备注',tags:['手臂'],imageIds:['legacy-image'],ratio:2/3,createdAt:123,lastParams:{mode:'time',target:30,sets:1,rest:0}}},{store:'settings',value:{id:'tags',value:['手臂','常练']}},{store:'sessions',value:{id:'legacy-session',date:1792155600000,finished:true,duration:31,items:[{cardId:'legacy-card',name:'旧收藏',text:'旧备注',tags:['手臂'],imageIds:['legacy-image'],params:{mode:'time',target:30,sets:1,rest:0},completed:[{duration:31}]}]}}]);
});
await page.goto(BASE+'/');await page.waitForSelector('iframe[title="我的健身卡册"]');const frame=page.frameLocator('iframe');await frame.locator('.exercise').first().waitFor();
await page.waitForFunction(()=>document.querySelector('.folio-status')?.textContent.includes('原存档已继承'),null,{timeout:15000});
let data=await page.evaluate(()=>JSON.parse(localStorage.getItem('gym_state_v1')));assert.equal(data.customEx.length,1);assert.equal(data.workouts.length,1);assert.equal(data.workouts[0].entries[0].sets[0].sec,31);assert.ok(data.customEx[0].media.hash);
assert.equal(await frame.locator('.exercise').count(),48);assert.ok((await frame.locator('header').innerText()).includes('5632'));
await frame.locator('[data-action="filter"][data-tag="上臂"]').click();assert.ok(await frame.locator('[data-card-id="legacy-card"]').count());
await frame.locator('[data-action="filter"][data-tag="全部"]').click();
// Pick one catalogue exercise and one own card, then run the same training loop.
await frame.locator('body').evaluate(()=>{Math.random=()=>.999999});await frame.locator('[data-action="random"]').click();assert.equal(await frame.locator('[data-pick]:checked').count(),8);assert.ok(await frame.locator('[data-pick="legacy-card"]').isChecked());await frame.locator('[data-action="cancel-select"]').click();await frame.locator('[data-action="custom"]').click();await frame.locator('[data-pick="legacy-card"]').check();const builtin=frame.locator('[data-pick^="og:"]').first();await builtin.check();await frame.locator('[data-action="start"]').click();assert.ok(await frame.locator('[data-action="complete-set"]').count());
await page.reload();await frame.locator('[data-action="complete-set"]').waitFor();assert.ok((await frame.locator('#toast').innerText()).includes('上次训练已恢复'));
// Return the active session to the collection without deleting the old history.
page.on('dialog',d=>{d.accept()});await frame.locator('[data-action="end-workout"]').click();await frame.locator('[data-action="home"]').click();await page.reload();await frame.locator('.nav [data-action="add"]').waitFor();
const png=await page.evaluate(()=>{const c=document.createElement('canvas');c.width=800;c.height=1000;return c.toDataURL().split(',')[1]});
for(let i=0;i<2;i++){
 await frame.locator('#album-input').setInputFiles({name:'new'+i+'.png',mimeType:'image/png',buffer:Buffer.from(png,'base64')});await frame.locator('.photo-thumb').nth(i).waitFor();assert.equal(await frame.locator('.form-photo').getAttribute('src'),await frame.locator('.photo-thumb img').nth(i).getAttribute('src'));
 await frame.locator('[data-action="crop-photo"]').click();assert.equal(await frame.locator('input[type="range"]').count(),0);await frame.locator('.cropper-point.point-nw').waitFor();
 if(i){await frame.locator('[data-crop="ratio"]').click();assert.equal(await frame.locator('[data-crop="ratio"]').getAttribute('aria-pressed'),'true')}
 const h=await frame.locator('.cropper-point.point-nw').boundingBox();await page.mouse.move(h.x+12,h.y+12);await page.mouse.down();await page.mouse.move(h.x+30,h.y+30,{steps:5});await page.mouse.up();await frame.locator('[data-crop="save"]').click();await frame.locator('.crop-dialog').waitFor({state:'detached'});
}
await frame.locator('[data-action="new-tag"]').click();await frame.locator('#new-tag-input').fill('迁移测试');await frame.locator('[data-action="save-draft"]').click();await frame.locator('.nav [data-action="add"]').waitFor();
await page.waitForFunction(()=>JSON.parse(localStorage.getItem('gym_state_v1')).customEx.length===2,null,{timeout:20000});
await page.reload();await frame.locator('.exercise').first().waitFor();data=await page.evaluate(()=>JSON.parse(localStorage.getItem('gym_state_v1')));assert.equal(data.customEx.length,2);assert.equal(data.workouts.length,2);
// Re-importing a backup merges without dropping either original card or history.
await frame.locator('[data-action="settings"]').click();
const merged={format:'fitness-cardbook',version:1,cards:[{id:'merged-text',name:'合并文字',text:'导入文字动作',tags:['全身'],imageIds:[],createdAt:456}],images:[],sessions:[],settings:[]};
for(let i=0;i<2;i++){await frame.locator('[data-action="merge-import"]').click();await frame.locator('#backup-input').setInputFiles({name:'old.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(merged))});await frame.locator('.nav [data-action="add"]').waitFor();await frame.locator('[data-action="settings"]').click();}
await page.waitForFunction(()=>JSON.parse(localStorage.getItem('gym_state_v1')).customEx.length===3,null,{timeout:20000});
await page.reload();await frame.locator('.exercise').first().waitFor();
await page.waitForFunction(()=>navigator.serviceWorker.controller!==null,null,{timeout:20000});await context.setOffline(true);await page.reload();await frame.locator('.exercise').first().waitFor();assert.ok((await frame.locator('header').innerText()).includes('5632'));await context.setOffline(false);
await page.screenshot({path:process.env.CARDBOOK_SCREENSHOT||'/tmp/opengym-integrated.png'});
assert.deepEqual(errors,[]);console.log('PASS old cards/photos/tags/history and active session retained; 5632 catalogue; category aliases; mixed training; crop latest preview, ratio and auto tags; idempotent native migration; no JS errors');await browser.close();
})().catch(e=>{console.error(e);process.exit(1)});
