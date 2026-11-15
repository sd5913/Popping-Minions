const canvas=document.querySelector('canvas');
const ctx=canvas.getContext('2d');
const status=document.querySelector('output');
const pause=document.querySelector('#pause');
const backdrop=new Image();
const lanes=[-3,0,3];
const roadWidth=11;
const segmentLength=5;
const finish=148;
const landmarks=Array.from({length:18},(_,i)=>({
 kind:'scenery',x:(i%2?-1:1)*(6.2+(i%3)*.75),z:9+i*7.5,
 w:1.1+(i%3)*.6,h:2.2+(i%5)*.67,d:1.6
}));
let finished=false;
const course=[
 ['wall',0],['rubble',-3],['gate',3],['wall',-3],['rubble',0],
 ['gate',-3],['wall',3],['rubble',3],['wall',0],['gate',0]
];
let objects=[],travel=0,lane=1,x=0,jump=0,vy=0,stun=0,flash=0,previous=0,paused=false;
let width,height,focal,horizon;
function resize(){
 const scale=Math.min(devicePixelRatio||1,2);
 width=canvas.clientWidth;height=canvas.clientHeight;
 canvas.width=Math.round(width*scale);canvas.height=Math.round(height*scale);
 ctx.setTransform(scale,0,0,scale,0,0);
 focal=Math.min(width*.83,height*1.07);horizon=height*.48;
}
function spawn(index){
 const [kind,center]=course[index%course.length];
 const z=18+index*13;
 if(kind==='gate') return [-1,1].map(side=>({
  kind,x:center+side*1.27,z,w:.55,h:3.9,d:1.05,hit:false
 }));
 if(kind==='wall')return [{kind,x:center,z,w:2.2,h:3.35,d:2.25,hit:false}];
 return [{kind,x:center,z,w:1.9,h:.65,d:1.2,hit:false}];
}
let next=0;
function reset(){
 objects=[];next=0;travel=0;lane=1;x=0;jump=0;vy=0;stun=0;flash=0;
 paused=false;finished=false;pause.disabled=false;pause.textContent='暂停';
}
function update(dt){
 if(paused||finished)return;
 x+=(lanes[lane]-x)*Math.min(1,dt*11);
 if(jump>0||vy>0){
  jump=Math.max(0,jump+vy*dt);vy-=17*dt;
  if(jump===0)vy=0;
 }
 const before=travel;
 travel=Math.min(finish,travel+dt*(stun>0?3.1:9));
 stun=Math.max(0,stun-dt);flash=Math.max(0,flash-dt);
 while(next<course.length&&18+next*13<travel+105)objects.push(...spawn(next++));
 for(const o of objects){
  const near=o.z-o.d/2,far=o.z+o.d/2;
  if(!o.hit&&before<far&&travel+.38>=near&&Math.abs(x-o.x)<o.w/2+.29&&jump<o.h-.12){
   o.hit=true;stun=.65;flash=.28;
  }
 }
 objects=objects.filter(o=>o.z>travel-4);
 if(travel>=finish){
  finished=true;pause.disabled=true;
  status.value='已抵达光门';
 }else{
  status.value=stun>0?'撞到了 · 继续前进':'距光门 '+Math.ceil(finish-travel)+' m';
 }
}
function point(px,py,z){
 const scale=focal/Math.max(z,.24);
 const bob=Math.sin(travel*2)*.028;
 return [width/2+(px-x)*scale,horizon+(1.63+jump+bob-py)*scale];
}
function polygon(points,fill,stroke){
 ctx.beginPath();points.forEach(([x,y],i)=>i?ctx.lineTo(x,y):ctx.moveTo(x,y));
 ctx.closePath();ctx.fillStyle=fill;ctx.fill();
 if(stroke){ctx.strokeStyle=stroke;ctx.lineWidth=1;ctx.stroke();}
}
function road(near,far,i){
 const half=roadWidth/2;
 polygon([point(-half,0,near),point(half,0,near),point(half,0,far),point(-half,0,far)],i%2?'#986644':'#a8754e','#523827');
 for(let j=-2;j<=2;j++){
  const cut=j*2.1+(i%2)*.44;
  polygon([point(cut,0,near),point(cut+.025,0,near),point(cut+.025,0,far),point(cut,0,far)],'#65422f');
 }
 for(const side of [-1,1]){
  const a=side*half,b=side*(half+.24);
  polygon([point(a,0,near),point(b,0,near),point(b,0,far),point(a,0,far)],'#e4ac74');
 }
}
function block(o){
 const near=Math.max(.24,o.z-o.d/2-travel),far=o.z+o.d/2-travel;
 if(far<=.24)return;
 const l=o.x-o.w/2,r=o.x+o.w/2,h=o.h;
 const a=point(l,0,near),b=point(r,0,near),c=point(r,h,near),d=point(l,h,near);
 const e=point(l,h,far),f=point(r,h,far);
 polygon([point(l-.3,0,near),point(r+.65,0,near),point(r+.85,0,far),point(l,0,far)],'#463020');
 polygon([d,c,f,e],'#e6af74','#613d26');
 if(x<o.x) polygon([a,d,e,point(l,0,far)],'#865032','#5d3a26');
 else polygon([b,c,f,point(r,0,far)],'#75472e','#5d3a26');
 polygon([a,b,c,d],o.kind==='rubble'?'#c38355':'#ad7148','#513223');
 const rows=o.kind==='rubble'?2:6;
 for(let i=1;i<rows;i++){
  const y=h*i/rows;
  const [ax,ay]=point(l,y,near),[bx,by]=point(r,y,near);
  ctx.beginPath();ctx.moveTo(ax,ay);ctx.lineTo(bx,by);
  ctx.strokeStyle='#71472f';ctx.stroke();
 }
}
function scenery(){
 if(!backdrop.complete||!backdrop.naturalWidth)return;
 const progress=travel/finish;
 const cover=Math.max(width/backdrop.width,height/backdrop.height);
 const portalY=.54;
 const count=56;
 for(let i=0;i<count;i++){
  const left=i*width/count,right=(i+1)*width/count;
  const edge=Math.abs((left+right)/width-1);
  const zoom=cover*(1.12+progress*(.27+edge*.52)+progress**5*.26);
  const w=backdrop.width*zoom,h=backdrop.height*zoom;
  ctx.save();
  ctx.beginPath();ctx.rect(left-.5,0,right-left+1,height);ctx.clip();
  ctx.drawImage(backdrop,(width-w)/2-x*(2+edge*8),
    horizon-h*portalY+Math.sin(travel*2)*height*.002,w,h);
  ctx.restore();
 }
}
function portal(){
 const z=Math.max(.6,finish-travel+.6);
 const topLeft=point(-4.4,5,z),bottomRight=point(4.4,0,z);
 const [left,top]=topLeft,[right,bottom]=bottomRight;
 const glow=ctx.createLinearGradient(0,top,0,bottom);
 glow.addColorStop(0,'#ffbe72aa');glow.addColorStop(1,'#fff0ba');
 ctx.save();
 ctx.shadowColor='#ffad5e';ctx.shadowBlur=Math.min(36,8+180/z);
 ctx.fillStyle=glow;ctx.fillRect(left,top,right-left,bottom-top);
 ctx.strokeStyle='#fff2c8';ctx.lineWidth=Math.min(9,1+22/z);
 ctx.strokeRect(left,top,right-left,bottom-top);
 ctx.restore();
}
function draw(){
 ctx.fillStyle='#4f3020';ctx.fillRect(0,0,width,height);
 scenery();
 const end=Math.ceil((travel+110)/segmentLength);
 const start=Math.floor(travel/segmentLength);
 for(let i=end;i>=start;i--){
  const near=Math.max(.24,i*segmentLength-travel);
  const far=(i+1)*segmentLength-travel;
  if(far>.24)road(near,far,i);
 }
 if(finish-travel<55)portal();
 for(const o of [...landmarks,...objects].filter(o=>o.z>travel+.25&&o.z<travel+85).sort((a,b)=>b.z-a.z))block(o);
 if(finished){
  ctx.fillStyle='#28190fbc';ctx.fillRect(0,0,width,height);
  ctx.textAlign='center';ctx.fillStyle='#fff2d5';
  ctx.font='bold '+Math.min(54,width*.11)+'px system-ui';
  ctx.fillText('抵达光门',width/2,height*.48);
  ctx.font='18px system-ui';
  ctx.fillText('点击「重开」再跑一次',width/2,height*.56);
 }
 if(flash>0){ctx.fillStyle='rgba(172,62,23,'+(flash*.8)+')';ctx.fillRect(0,0,width,height);}
}
function frame(now){
 const dt=previous?Math.min(.04,(now-previous)/1000):0;
 previous=now;update(dt);draw();requestAnimationFrame(frame);
}
function move(direction){if(!paused&&!finished)lane=Math.max(0,Math.min(2,lane+direction));}
function leap(){if(!paused&&!finished&&jump===0&&vy===0)vy=6.3;}
window.ruinsRunControls = {
  move,
  leap
};
function toggle(){if(finished)return;paused=!paused;pause.textContent=paused?'继续':'暂停';}
pause.onclick=toggle;
document.querySelector('#restart').onclick=reset;
addEventListener('keydown',e=>{
 if(e.target instanceof HTMLButtonElement&&e.code==='Space')return;
 if(!['ArrowLeft','ArrowRight','ArrowUp','Space','KeyP'].includes(e.code))return;
 e.preventDefault();if(e.repeat)return;
 if(e.code==='ArrowLeft')move(-1);
 if(e.code==='ArrowRight')move(1);
 if(e.code==='ArrowUp'||e.code==='Space')leap();
 if(e.code==='KeyP')toggle();
});
let startTouch;
canvas.addEventListener('pointerdown',e=>{startTouch=[e.clientX,e.clientY];canvas.setPointerCapture(e.pointerId);});
canvas.addEventListener('pointerup',e=>{
 if(!startTouch)return;
 const dx=e.clientX-startTouch[0],dy=e.clientY-startTouch[1];startTouch=null;
 if(Math.abs(dx)>25&&Math.abs(dx)>Math.abs(dy))move(Math.sign(dx));
 else if(dy< -22)leap();
});
canvas.addEventListener('pointercancel',()=>{startTouch=null;});
addEventListener('resize',resize);
backdrop.src='assets/backdrop.png';
resize();reset();requestAnimationFrame(frame);
