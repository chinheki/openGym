// The old IndexedDB remains authoritative and untouched. IDs make retries additive and idempotent.
export const folioId = id => id?.startsWith('og:') ? id.slice(3) : id?.startsWith('native:') ? id.slice(7) : `folio:${id}`
export const PARTS={'全身':'full body','背部':'back','胸部':'chest','有氧':'cardio','前臂':'lower arms','小腿':'lower legs','颈部':'neck','肩部':'shoulders','上臂':'upper arms','手臂':'upper arms','大腿':'upper legs','腿部':'upper legs','腰腹':'waist','腹部':'waist'}
export function customFromCard(card,media){
 return {id:folioId(card.id),n:card.name||card.tags?.join(' · ')||'收藏动作',bp:(card.tags||[]).map(t=>PARTS[t]).find(Boolean)||'',eq:'',tg:'',sm:[],desc:card.text||'',custom:true,folioCardId:card.id,folioTags:card.tags||[],...(media?{media}:{})}
}
export function workoutFromSession(session){
 const date=new Date(session.date)
 if(!Number.isFinite(+date)||!Array.isArray(session.items))throw new Error('旧训练记录格式不完整，原存档未改动')
 return {id:`folio:${session.id}`,d:`${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`,name:'卡册训练',start:session.date,end:session.date+(session.duration||0)*1000,duration:session.duration||0,routineId:null,folioSessionId:session.id,folioFinished:!!session.finished,entries:session.items.map(item=>{
 const p=item.params||{},timed=p.mode!=='reps'
 return {id:folioId(item.cardId),mode:timed?'time':'reps',notes:item.text||'',target:{sets:p.sets||1,reps:p.target||1,weight:0,mode:timed?'time':'reps',rest:p.rest||0},sets:(item.completed||[]).map(set=>({w:0,r:timed?0:p.target||1,sec:timed?(set.duration??set.seconds??set.elapsed??p.target??0):0,done:true})),folioOriginal:item}
 })}
}
export async function readCardbook(){
 if(indexedDB.databases){const dbs=await indexedDB.databases();if(!dbs.some(d=>d.name==='fitness-cardbook'))return {cards:[],images:[],sessions:[],settings:[]}}
 const db=await new Promise((resolve,reject)=>{const r=indexedDB.open('fitness-cardbook');r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error)})
 try{
  const result={};for(const store of ['cards','images','sessions','settings']){
   if(!db.objectStoreNames.contains(store)){result[store]=[];continue}
   result[store]=await new Promise((resolve,reject)=>{const r=db.transaction(store).objectStore(store).getAll();r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error)})
  }return result
 }finally{db.close()}
}
