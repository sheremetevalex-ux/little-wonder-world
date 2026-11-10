// Plays every scene for real, on several devices and engines, and reports errors.
import { webkit, chromium, devices } from 'playwright';
const CONFIGS = [
  ['webkit', 'iPhone 14', 'ip14'], ['webkit', 'iPhone SE', 'ipse'], ['webkit', 'iPad (gen 7)', 'ipad'], ['webkit', 'iPad (gen 7) landscape', 'ipadl'],
  ['chromium', 'Pixel 7', 'pix'], ['chromium', 'Galaxy S9+', 'gal']
];
const only = process.argv[2];
const OUT = process.env.OUT || '/tmp';
const PORT = process.env.PORT || 5199;
for (const [eng, dev, tag] of CONFIGS) {
  if (only && !tag.startsWith(only)) continue;
  const browser = await (eng === 'webkit' ? webkit : chromium).launch();
  const ctx = await browser.newContext({ ...devices[dev] });
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message + ' ' + (e.stack || '').split('\n').slice(0, 3).join(' | ')));
  page.on('console', (m) => { if (m.type() === 'error') errors.push('console: ' + m.text()); });
  await page.goto(`http://localhost:${PORT}/`);
  // The test taps for real, which unlocks sound: keep it off the speakers of whoever runs it
  await page.evaluate('window.__audio.master && (window.__audio.master.gain.value = 0)');
  await page.waitForTimeout(500);
  await page.screenshot({ path: `${OUT}/wonder-${tag}-splash.png` });
  const vp = page.viewportSize();
  await page.touchscreen.tap(vp.width / 2, vp.height / 2);
  await page.waitForTimeout(2600);
  await page.screenshot({ path: `${OUT}/wonder-${tag}-hub.png` });
  await page.evaluate(`Object.assign(window.__save.data,{friends:['moko','bunny','kitty','frog','panda','unicorn','dragon','bear','chick'],quest:18,stars:2})`);
  // Random-finger monkey test across every scene: a four-year-old is a great fuzzer
  const scenes = ['dumplings', 'eggs', 'squishy', 'hidden', 'jump', 'dress', 'pet', 'cake', 'popit', 'slime', 'paint', 'garden', 'quest', 'sing', 'cafe', 'salon', 'atelier', 'album', 'hub'];
  for (const name of scenes) {
    await page.evaluate(`window.__go('${name}')`);
    await page.waitForTimeout(1300);
    await page.screenshot({ path: `${OUT}/wonder-${tag}-${name}.png` });
    await page.evaluate(`(async()=>{
      const c=document.getElementById('game');
      const ev=(t,x,y,id)=>c.dispatchEvent(new PointerEvent(t,{pointerId:id,clientX:x,clientY:y,bubbles:true,cancelable:true,isPrimary:id===1,pointerType:'touch',buttons:1}));
      const W=innerWidth,H=innerHeight;
      for(let k=0;k<60;k++){
        // never press the home corner so that the scene stays under test
        let x=Math.random()*W, y=Math.random()*H; if(x<90&&y<100) y+=120;
        ev('pointerdown',x,y,1+k%2);
        const n=Math.random()<0.5?0:6;
        for(let j=0;j<n;j++){ x+=(Math.random()-.5)*60; y+=(Math.random()-.5)*60; ev('pointermove',x,y,1+k%2); await new Promise(r=>setTimeout(r,8)); }
        ev('pointerup',x,y,1+k%2);
        await new Promise(r=>setTimeout(r,12));
      }
    })()`);
    await page.waitForTimeout(300);
    const fps = await page.evaluate('window.__wonder.fps');
    const sc = await page.evaluate('window.__wonder.scene.name');
    const calls = await page.evaluate('window.__gl.renderer && window.__wonder.scene.stage ? window.__gl.renderer.info.render.calls : 0');
    console.log(tag, name.padEnd(9), 'in', sc.padEnd(9), 'fps', fps.toFixed(0), 'draws', calls);
  }
  console.log(tag, errors.length ? 'ERRORS\n' + [...new Set(errors)].join('\n') : 'no errors');
  await browser.close();
}
