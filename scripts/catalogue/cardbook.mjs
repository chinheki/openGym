// Non-commercial openGym fork: catalogue media stay unmodified, staged by stage-media.mjs.
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../..')
const zh=JSON.parse(fs.readFileSync(path.join(root,'catalogue/i18n/zh.json')))
const aliases={'full body':'全身','back':'背部','chest':'胸部','cardio':'有氧','lower arms':'前臂','lower legs':'小腿','neck':'颈部','shoulders':'肩部','upper arms':'上臂','upper legs':'大腿','waist':'腰腹'}
const {EXDB}=await import('../../frontend/src/lib/exercises-data.js')
const records=EXDB.map(ex=>{
 const text=JSON.parse(fs.readFileSync(path.join(root,`catalogue/exercises/${ex.id}.json`)))
 const tr=zh[ex.id]||{}
 return {id:`og:${ex.id}`,name:tr.name||ex.n,text:[tr.description||text.description,...(tr.instructions||text.instructions||[])].filter(Boolean).join('\n'),tags:[aliases[ex.bp]||ex.bp],imageIds:[`og:${ex.id}`],ratio:1,createdAt:0,source:'opengym',bodyPart:ex.bp,equipment:ex.eq,target:ex.tg,searchText:[ex.n,ex.bp,ex.eq,ex.tg].join(' '),still:`../exercise-media/still/${ex.img}`,clip:`../exercise-media/clip/${ex.gif}`}
})
const dest=path.join(root,'frontend/public/cardbook/catalogue.json')
fs.writeFileSync(dest,JSON.stringify(records))
console.log(`Cardbook: ${records.length} native catalogue exercises`)
