// Sport zum Selberspielen: Golf im Golfresort (golfspiel.js) und Tennis auf dem freien Platz des Tennisclubs
// (tennisspiel.js). main.js fragt hint/use (Taste E) und busy (Figur steht still) ab.
import { Golfspiel } from './golfspiel.js';
import { Tennisspiel } from './tennisspiel.js';

export class Sport {
  constructor(scene, world, { golf, tennis, cam, quests }) {
    const hud = document.createElement('div');
    hud.id = 'sport-hud';
    hud.hidden = true;
    document.body.append(hud);
    this.games = [new Golfspiel(scene, world, golf, { cam, quests, hud }), new Tennisspiel(scene, world, tennis, { cam, quests, hud })];
    [this.golf, this.tennis] = this.games;
  }

  get busy() { return this.games.some((g) => g.busy); }
  hint(player) { for (const g of this.games) { const h = g.hint(player); if (h) return h; } return ''; }
  use(player) { return this.games.some((g) => g.use(player)); }
  update(dt, input, player) { for (const g of this.games) g.update(dt, input, player); }
}
