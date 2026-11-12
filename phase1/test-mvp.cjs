/* Run: node phase1/test-mvp.cjs
   Deterministic headless state/interaction smoke tests (no real webcam). */
const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");
const path = require("node:path");
const source = fs.readFileSync(path.join(__dirname,"game.js"),"utf8");

const noop = () => {};
const ctx2d = new Proxy({}, {get(target,prop) {
  if(prop === "createLinearGradient") return () => ({addColorStop:noop});
  if(prop in target) return target[prop];
  return noop;
}});
function element() {
  return {
    hidden:false, disabled:false, textContent:"", className:"", children:[],
    addEventListener(type,handler){this.listeners ||= {};this.listeners[type]=handler;},
    replaceChildren(){this.children=[];},
    appendChild(child){this.children.push(child);},
    setAttribute:noop,
    click(){this.listeners?.click?.();}
  };
}
const elements=new Map();
const get=(id)=>{
  if(!elements.has(id))elements.set(id,element());
  return elements.get(id);
};
get("game").getContext=()=>ctx2d;
let time=1000;
let callback;
const document={
  getElementById:get,createElement:()=>element(),
  addEventListener(type,fn){ if(type==="keydown")this.key=fn; }
};
const sandbox={
  document,console,
  performance:{now:()=>time},
  requestAnimationFrame:(fn)=>{callback=fn;},
  navigator:{},
  Math
};
vm.createContext(sandbox);
vm.runInContext(source,sandbox,{filename:"game.js"});
const evalJs=(src)=>vm.runInContext(src,sandbox);
const mode=()=>evalJs("s.mode");
const lane=()=>evalJs("s.lane");
function frame() {time+=40;const cb=callback;cb(time);}
function runUntil(target,limit=2500) {
  for(let i=0;i<limit && mode()!==target;i++)frame();
  assert.equal(mode(),target,"Expected mode "+target);
}
function key(k){document.key({key:k,repeat:false,preventDefault:noop});}
function interact(){time+=300;key("e");}
function reset(){evalJs("reset()");}
assert.equal(mode(),"intro");
interact();
assert.equal(mode(),"running");
runUntil("npc_wait");
assert.equal(evalJs("s.npcDone"),false);
interact();
assert.equal(mode(),"npc_wait","NPC should require right lane");
key("ArrowRight");
assert.equal(lane(),2);
interact();
assert.equal(mode(),"dialogue");
for(let i=0;i<4;i++)interact();
assert.equal(mode(),"running");
assert.equal(evalJs("s.hasPaper"),true);
assert.equal(evalJs("s.npcDone"),true);
runUntil("bridge_wait");
interact();
assert.equal(mode(),"bridge_wait","Bridge requires center lane");
key("ArrowLeft");
assert.equal(lane(),1);
interact();
assert.equal(mode(),"building");
for(let i=0;i<45;i++)frame();
assert.equal(evalJs("s.bridgeBuilt"),true);
assert.equal(evalJs("s.hasPaper"),false);
runUntil("complete");
assert.equal(evalJs("s.progress"),232);
interact();
assert.equal(mode(),"intro");

// Collision must cause fail-forward, not a Game Over.
reset();interact();
evalJs("s.progress=16.9; s.lane=1;");
for(let i=0;i<8;i++)frame();
assert.equal(mode(),"recovering");
assert.equal(evalJs("s.route"),"lower");

// A timed jump must avoid the matching obstacle.
reset();interact();
evalJs("s.progress=16.9; s.lane=1;");
key(" ");
time+=200;
for(let i=0;i<8;i++)frame();
assert.equal(evalJs("s.collisions"),0);
assert.equal(mode(),"running");
console.log("PASS: chapter flow, NPC, inventory, paper bridge, finish, restart, fail-forward and jump.");
