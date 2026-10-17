import {createPortal} from 'react-dom'
import {useEffect,useRef,useState} from 'react'
import {useStore} from '../store/useStore.js'
import {useNavigate,useLocation} from 'react-router-dom'
import {EXIDX} from '../lib/exercises.js'
import {exerciseDetailSheet} from '../sheets.jsx'
import {readCardbook,customFromCard,workoutFromSession,PARTS} from '../lib/cardbook-migration.js'
import {mediaStore} from '../lib/media-store.js'
import {MEDIA_MIMES} from '../lib/media-refs.js'

export default function Cardbook(){
 const frame=useRef(null),nav=useNavigate(),loc=useLocation(),[status,setStatus]=useState('正在读取原卡册…')
 useEffect(()=>{
  let stopped=false,queue=Promise.resolve(),receiving=false,frameReady=false
  const params=new URLSearchParams(loc.search),from=params.get('from'),token=params.get('transfer')
  const localTransfer=token&&/^http:\/\/(127\.0\.0\.1|localhost):4186$/.test(from||'')&&window.opener
  const signal=(type,extra={})=>{if(localTransfer)window.opener.postMessage({type,token,...extra},from)}
  async function sync(){
   const legacy=await readCardbook(),custom=[]
   for(const card of legacy.cards){
    let media
    const image=legacy.images.find(i=>i.id===card.imageIds?.[0])
    if(image?.blob&&MEDIA_MIMES[image.blob.type]){
     const hash=[...new Uint8Array(await crypto.subtle.digest('SHA-256',await image.blob.arrayBuffer()))].map(n=>n.toString(16).padStart(2,'0')).join('')
     await mediaStore.put(hash,image.blob,{mime:image.blob.type,pending:false})
     media={hash,mime:image.blob.type,kind:MEDIA_MIMES[image.blob.type].kind,size:image.blob.size,width:image.width,height:image.height}
    }
    custom.push(customFromCard(card,media))
   }
   // History may refer to a card already deleted from the collection; retain the recorded name.
   for(const session of legacy.sessions)for(const item of session.items||[]){if(!item.cardId?.startsWith('og:')&&!custom.some(c=>c.folioCardId===item.cardId))custom.push(customFromCard({id:item.cardId,name:item.name,tags:item.tags,text:item.text}))}
   const workouts=legacy.sessions.map(workoutFromSession),current=useStore.getState().S
   const fingerprints=JSON.stringify({custom,workouts})
   if(current.folioFingerprint!==fingerprints){
    useStore.getState().update(s=>{
     s.folioSources=s.folioSources||{};for(const exercise of custom){const source=JSON.stringify(exercise),key='exercise:'+exercise.id;if(s.folioSources[key]===source)continue;const index=s.customEx.findIndex(c=>c.id===exercise.id);if(index<0)s.customEx.push(exercise);else s.customEx[index]=exercise;s.folioSources[key]=source}
     for(const workout of workouts){const source=JSON.stringify(workout),key='workout:'+workout.id;if(s.folioSources[key]===source)continue;const index=s.workouts.findIndex(w=>w.id===workout.id);if(index<0)s.workouts.push(workout);else s.workouts[index]=workout;s.folioSources[key]=source}
     s.folioFingerprint=fingerprints
    })
    const saved=JSON.parse(localStorage.getItem('gym_state_v1')||'{}')
    if(!custom.every(c=>saved.customEx?.some(x=>x.id===c.id))||!workouts.every(w=>saved.workouts?.some(x=>x.id===w.id)))throw new Error('OpenGym 副本尚未保存，原卡册数据仍保留，请导出备份后重试')
   }
   const reverse=Object.fromEntries(Object.entries(PARTS).map(([cn,en])=>[en,cn]))
   const native=[]
   for(const c of useStore.getState().S.customEx.filter(c=>!c.folioCardId)){
    const image=c.media?.hash?await mediaStore.get(c.media.hash):null
    native.push({id:`native:${c.id}`,name:c.n,text:c.desc||'',tags:[reverse[c.bp]||c.bp||'未分类'],imageIds:image?[`native:${c.id}`]:[],createdAt:0,ratio:c.media?c.media.width/c.media.height:1,source:'native',blob:image?.blob,width:c.media?.width,height:c.media?.height})
   }
   if(stopped)return
   frame.current?.contentWindow?.postMessage({type:'cardbook:native',cards:native},location.origin)
   if(frameReady)signal('cardbook:transfer-ready');setStatus(legacy.cards.length||legacy.sessions.length?`原存档已继承：${legacy.cards.length} 张卡片 · ${legacy.images.length} 张照片 · ${legacy.sessions.length} 次训练`:'内置动作与个人收藏可一起随机；设置里可恢复旧卡册备份')
  }
  const run=()=>{queue=queue.then(sync).catch(error=>{if(!stopped)setStatus(`迁移未完成：${error.message}。原存档未删除。`)})}
  const receive=e=>{
   if(localTransfer&&e.source===window.opener&&e.origin===from&&e.data?.type==='cardbook:transfer'&&e.data.token===token&&!receiving){receiving=true;frame.current?.contentWindow?.postMessage({type:'cardbook:merge-data',token,data:e.data.data},location.origin);return}
   if(e.origin!==location.origin||e.source!==frame.current?.contentWindow)return
   if(e.data?.type==='cardbook:changed'){frameReady=true;run()}
   if(e.data?.type==='cardbook:merged'&&e.data.token===token){signal('cardbook:transfer-done');run()}
   if(e.data?.type==='cardbook:merge-error'){receiving=false;signal('cardbook:transfer-error',{message:e.data.message})}
   if(e.data?.type==='cardbook:exercise'){nav('/library');if(EXIDX[e.data.id])exerciseDetailSheet(EXIDX[e.data.id])}
  }
  window.addEventListener('message',receive);frame.current?.addEventListener('load',run);run()
  return ()=>{stopped=true;window.removeEventListener('message',receive);frame.current?.removeEventListener('load',run)}
 },[nav,loc.search])
 return createPortal(<section className="folio-host"><p role="status" className="folio-status">{status} · <a href="https://github.com/chinheki/opengym" target="_blank" rel="noreferrer">源代码 / AGPL</a></p><iframe ref={frame} src="cardbook/index.html" title="我的健身卡册" allow="camera; screen-wake-lock" /></section>,document.body)
}
