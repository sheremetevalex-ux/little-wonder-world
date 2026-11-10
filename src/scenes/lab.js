// Developer view: every 3D creature in a row. Not reachable from the hub.
import { app } from '../core/engine.js';
import { Stage, THREE, M, G, mesh, V } from '../core/stage.js';
import { Critter, SPECIES } from '../art/critter3d.js';

export const lab = {
  tint: '#BFE3FF',
  enter(args) {
    const st = this.stage = new Stage({ bg: ['#A8DAFF', '#FFE9F3'], shadowArea: 14 });
    const ids = (args && args.ids) || Object.keys(SPECIES);
    this.crit = [];
    const cols = Math.ceil(Math.sqrt(ids.length * 1.6));
    ids.forEach((id, i) => {
      const c = new Critter(id, { size: 0.8 });
      c.root.position.set((i % cols - (cols - 1) / 2) * 2.1, 0, Math.floor(i / cols) * 2.2 - 4);
      st.add(c.root);
      this.crit.push(c);
    });
    const ground = mesh(G.box(0.3), M.matte('#BFF0C8'), { s: [cols * 2.4, 1, 14], p: [0, -0.5, 0], receive: true });
    st.add(ground);
    const rows = Math.ceil(ids.length / cols);
    st.frame(V(0, 0.8, rows * 1.1 - 4 - 1), cols * 2.2, rows * 1.7 + 1.2, [0, 0.45, 1]);
    st.shadowArea(16, V(0, 0, 0));
  },
  update(dt) { for (const c of this.crit) c.update(dt); },
  draw() {},
  down(p) {
    const h = this.stage.pick(p.x, p.y, this.crit.map((c) => c.root));
    if (!h) return;
    let o = h.object;
    while (o && !o.userData.critter) o = o.parent;
    const c = this.crit.find((k) => h.object === k.body || k.root.getObjectById(h.object.id));
    if (c) { c.poke(); c.hop(); c.say('giggle'); c.setMood('happy', 1); }
  }
};
