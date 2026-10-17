import {describe,it,expect,vi} from 'vitest'
import {checkVersion,prepareUpdate} from '../../public/cardbook/pwa-update.js'
describe('PWA updates',()=>{
 it('checks a fresh manifest and validates the response',async()=>{
  const fetcher=vi.fn(async()=>({ok:true,json:async()=>({version:'1.4.1+9'})}));
  expect(await checkVersion(fetcher)).toBe('1.4.1+9');expect(fetcher.mock.calls[0][1].cache).toBe('no-store');
  await expect(checkVersion(async()=>({ok:false}))).rejects.toThrow('检查更新失败');
  await expect(checkVersion(async()=>({ok:true,json:async()=>({})}))).rejects.toThrow('版本信息无效');
 });
 it('updates the existing registration without touching storage',async()=>{
  const registration={update:vi.fn(async()=>{}),active:{}};
  await prepareUpdate({getRegistration:async()=>registration});expect(registration.update).toHaveBeenCalledOnce();
  await expect(prepareUpdate({getRegistration:async()=>null})).rejects.toThrow('尚未准备好');
  await expect(prepareUpdate({getRegistration:async()=>({...registration,active:null})})).rejects.toThrow('尚未就绪');
 });
 it('waits until a downloaded worker activates',async()=>{
  vi.useFakeTimers();const worker={state:'installing'},registration={update:async()=>{},installing:worker,active:{}};
  const promise=prepareUpdate({getRegistration:async()=>registration});await vi.advanceTimersByTimeAsync(200);worker.state='activated';registration.installing=null;await vi.advanceTimersByTimeAsync(200);await promise;vi.useRealTimers();
 });
});
