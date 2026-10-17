export const defaultParams={mode:'time',target:60,sets:3,rest:20,pace:0};
export function randomPick(items,count=8,random=Math.random){const copy=[...items];for(let i=copy.length-1;i>0;i--){const j=Math.floor(random()*(i+1));[copy[i],copy[j]]=[copy[j],copy[i]];}return copy.slice(0,count);}
export function orderCards(cards,selected){return [...cards].sort((a,b)=>Number(selected.has(b.id))-Number(selected.has(a.id))||b.createdAt-a.createdAt);}
export function elapsedSeconds(workout,now=Date.now()){return Math.max(0,(workout.elapsed||0)+(workout.running?(now-workout.startedAt)/1000:0));}
export function weekStart(date){const d=new Date(date);d.setHours(0,0,0,0);d.setDate(d.getDate()-(d.getDay()+6)%7);return d;}
export function weekLabel(date,now=new Date()){const start=weekStart(date),current=weekStart(now);if(+start===+current)return '本周';const prev=new Date(current);prev.setDate(prev.getDate()-7);if(+start===+prev)return '上周';return `${start.getMonth()+1} 月 ${start.getDate()} 日这一周`;}
export function formatTime(seconds){const n=Math.max(0,Math.floor(seconds));return `${String(Math.floor(n/60)).padStart(2,'0')}:${String(n%60).padStart(2,'0')}`;}
export function safeParams(p={}){return {mode:p.mode==='reps'?'reps':'time',target:Math.min(3600,Math.max(1,Number(p.target)||60)),sets:Math.min(99,Math.max(1,Math.floor(Number(p.sets)||3))),rest:Math.min(600,Math.max(0,Number(p.rest)||0)),pace:Math.min(60,Math.max(0,Number(p.pace)||0))};}
export function validateBackup(data){if(data?.format!=='fitness-cardbook'||data.version!==1)throw new Error('这不是健身卡册备份');for(const name of ['cards','images','sessions','settings'])if(!Array.isArray(data[name]))throw new Error('备份内容不完整');const ids=new Set();for(const img of data.images){if(typeof img.id!=='string'||ids.has(img.id)||!/^data:image\/(jpeg|png|webp|gif|avif|heic|heif|bmp|svg\+xml);base64,/.test(img.data||'')||typeof img.thumbData!=='string'||!/^data:image\/(jpeg|png|webp);base64,/.test(img.thumbData))throw new Error('备份图片格式不正确');ids.add(img.id);}const cardIds=new Set();for(const c of data.cards){if(typeof c.id!=='string'||cardIds.has(c.id)||!Array.isArray(c.imageIds)||c.imageIds.some(id=>!ids.has(id))||!Array.isArray(c.tags)||c.tags.some(t=>typeof t!=='string')||typeof c.name!=='string'||typeof c.text!=='string'||!Number.isFinite(c.createdAt))throw new Error('备份卡片格式不正确');cardIds.add(c.id);}for(const session of data.sessions){if(typeof session.id!=='string'||!Number.isFinite(session.date)||!Array.isArray(session.items)||session.items.some(i=>!Array.isArray(i.imageIds)||i.imageIds.some(id=>!ids.has(id))||!Array.isArray(i.completed)))throw new Error('备份历史格式不正确');}for(const setting of data.settings)if(typeof setting.id!=='string')throw new Error('备份设置格式不正确');return data;}

// Selection uses image fractions so resizing the dialog does not change the crop.
export function cropPixels(box,width,height){
  const left=Math.max(0,Math.min(width-1,Math.floor(box.left*width)));
  const top=Math.max(0,Math.min(height-1,Math.floor(box.top*height)));
  return {left,top,width:Math.max(1,Math.min(width-left,Math.ceil(box.right*width)-left)),height:Math.max(1,Math.min(height-top,Math.ceil(box.bottom*height)-top))};
}
