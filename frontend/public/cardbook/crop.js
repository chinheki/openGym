import './vendor/cropperjs/cropper.min.js';
import {cropPixels} from './logic.js';
export async function cropPhoto(photo,previousRatio=null){
  const image=new Image();image.src=photo.url;await image.decode();
  const dialog=document.createElement('dialog');dialog.className='crop-dialog';dialog.setAttribute('aria-label','裁剪照片');
  dialog.innerHTML=`<div class="between"><strong>框选裁剪</strong><button data-crop="cancel">取消</button></div><p class="preview-note">拖动四个角调整范围，拖动框内移动选区。</p>${Number.isFinite(previousRatio)&&previousRatio>0?'<button class="ratio-toggle" data-crop="ratio" aria-pressed="false">沿用上次比例</button>':''}<div class="crop-stage"><img draggable="false" alt="待裁剪照片"></div><div class="row"><button data-crop="reset">重新框选</button><button class="primary" data-crop="save">使用裁剪照片</button></div>`;
  dialog.querySelector('img').src=photo.url;document.body.append(dialog);dialog.showModal();
  let box={left:0,top:0,right:1,bottom:1},busy=false,cropper;
  cropper=new window.Cropper(dialog.querySelector('.crop-stage img'),{
    viewMode:1,dragMode:'crop',autoCropArea:.85,background:false,
    movable:false,zoomable:false,rotatable:false,scalable:false,
    toggleDragModeOnDblclick:false,minCropBoxWidth:44,minCropBoxHeight:44,
    crop(e){const d=e.detail;box={left:d.x/photo.width,top:d.y/photo.height,right:(d.x+d.width)/photo.width,bottom:(d.y+d.height)/photo.height};}
  });
  return new Promise(resolve=>{
    let result=null;dialog.onclose=()=>{cropper.destroy();dialog.remove();resolve(result);};
    dialog.oncancel=e=>{if(busy)e.preventDefault();};
    dialog.onclick=async e=>{
      const action=e.target.closest('[data-crop]')?.dataset.crop;if(!action||busy)return;
      if(action==='cancel')return dialog.close();
      if(action==='ratio'){
        const button=e.target.closest('[data-crop]'),locked=button.getAttribute('aria-pressed')!=='true';
        cropper.setAspectRatio(locked?previousRatio:NaN);
        button.setAttribute('aria-pressed',String(locked));button.textContent=locked?'已沿用上次比例 · 点此解除':'沿用上次比例';return;
      }
      if(action==='reset'){cropper.reset();return;}
      busy=true;cropper.disable();dialog.querySelectorAll('button,input').forEach(el=>el.disabled=true);
      try{
        const rect=cropPixels(box,photo.width,photo.height),canvas=document.createElement('canvas');canvas.width=rect.width;canvas.height=rect.height;
        canvas.getContext('2d').drawImage(image,rect.left,rect.top,rect.width,rect.height,0,0,rect.width,rect.height);
        const file=await new Promise((res,rej)=>canvas.toBlob(blob=>blob?res(blob):rej(new Error('无法生成裁剪照片，请重试')),'image/png'));
        result={file,url:URL.createObjectURL(file),width:rect.width,height:rect.height};dialog.close();
      }catch(err){let error=dialog.querySelector('[role="alert"]');if(!error){error=document.createElement('p');error.setAttribute('role','alert');dialog.append(error);}error.textContent=err.message||'裁剪失败，请重试';}
      finally{busy=false;if(dialog.open)cropper.enable();dialog.querySelectorAll('button,input').forEach(el=>el.disabled=false);}
    };
  });
}
