// Plays every scene for real, on several devices and engines, and reports errors.
import { webkit, chromium, devices } from 'playwright';
const CONFIGS = [
  ['webkit', 'iPhone 14', 'ip14'], ['webkit', 'iPhone SE', 'ipse'], ['webkit', 'iPad (gen 7)', 'ipad'], ['webkit', 'iPad (gen 7) landscape', 'ipadl'],
  ['chromium', 'Pixel 7', 'pix'], ['chromium', 'Galaxy S9+', 'gal']
];
const only = process.argv[2];
for (const [eng, dev, tag] of CONFIGS) {
  if (only && !tag.startsWith(only)) continue;
  const browser = await (eng === 'webkit' ? webkit : chromium).launch();
  const ctx = await browser.newContext({ ...devices[dev] });
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message + ' ' + (e.stack || '').split('\n').slice(0, 3).join(' | ')));
  page.on('console', (m) => { if (m.type() === 'error') errors.push('console: ' + m.text()); });
  await page.goto('http://localhost:5199/');
  await page.waitForTimeout(500);
  await page.screenshot({ path: `/tmp/wonder-${tag}-splash.png` });
  const vp = page.viewportSize();
  await page.touchscreen.tap(vp.width / 2, vp.height / 2);
  await page.waitForTimeout(1400);
  await page.screenshot({ path: `/tmp/wonder-${tag}-hub.png` });
  await page.evaluate(`Object.assign(window.__save.data,{friends:['moko','bunny','kitty','frog','panda','unicorn','dragon','bear','chick'],quest:18,stars:2})`);
  // Random-finger monkey test across every scene: a four-year-old is a great fuzzer
  const scenes = ['dress', 'pet', 'cake', 'popit', 'slime', 'paint', 'garden', 'quest', 'album', 'hub'];
  for (const name of scenes) {
    await page.evaluate(`window.__go('${name}')`);
    await page.waitForTimeout(850);
    await page.screenshot({ path: `/tmp/wonder-${tag}-${name}.png` });
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
    console.log(tag, name.padEnd(7), 'in', sc.padEnd(7), 'fps', fps.toFixed(0));
  }
  console.log(tag, errors.length ? 'ERRORS\n' + [...new Set(errors)].join('\n') : 'no errors');
  await browser.close();
}
