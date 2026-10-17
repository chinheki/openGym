import {describe,it,expect} from 'vitest'
import {folioId,customFromCard,workoutFromSession} from './cardbook-migration.js'
describe('personal cardbook migration',()=>{
 it('keeps stable ids and existing catalogue references',()=>{expect(folioId('a')).toBe('folio:a');expect(folioId('og:0025')).toBe('0025');expect(folioId('native:custom_1')).toBe('custom_1')})
 it('keeps name, notes, tags, muscle classification and media',()=>{const media={hash:'a'.repeat(64)};expect(customFromCard({id:'a',name:'自定义',text:'备注',tags:['手臂','常练']},media)).toMatchObject({id:'folio:a',n:'自定义',desc:'备注',bp:'upper arms',folioTags:['手臂','常练'],media})})
 it('retains real completed time, reps, date and unfinished status without fabricating sets',()=>{
  const w=workoutFromSession({id:'s',date:+new Date(2026,9,17,12),duration:91,finished:false,items:[{cardId:'a',text:'记录',params:{mode:'time',sets:3,target:60},completed:[{duration:31}]},{cardId:'og:0025',params:{mode:'reps',target:10},completed:[{duration:60}]}]})
  expect(w.id).toBe('folio:s');expect(w.d).toBe('2026-10-17');expect(w.folioFinished).toBe(false);expect(w.entries[0].target.sec).toBe(60);expect(w.entries[0].sets).toEqual([{w:0,r:0,sec:31,done:true}]);expect(w.entries[1].sets[0].r).toBe(10);expect(w.entries[1].id).toBe('0025');expect(w.end-w.start).toBe(91000)
 })
 it('rejects damaged history without changing the source',()=>expect(()=>workoutFromSession({date:'bad',items:[]})).toThrow(/原存档未改动/))
})
