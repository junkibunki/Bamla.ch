// Sprüche uff Alemannisch an besonderen Orten: Wer zu Fuß (oder langsam) vorbeikommt, bekommt von einer Ortsfigur
// oder von Fußgänger:innen in der Nähe einen Spruch in der Sprechblase (Ansehen.say). Jeder Ort hat eine stehende
// Figur, damit dort immer jemand ist; die Sprüche kommen gemischt, ohne Wiederholung, bis alle durch sind.
// Wer betrunken reitet, hört überall von Fußgänger:innen und Ortsfiguren, dass es an der Fasnacht kommt.
import { buildPerson, animateWalk } from './person.js';
import { rng } from './world.js';
import { buildBather } from './camping.js';

const SAY_SECS = 5.5, COOL = 14, TALK = 14, WALKER = 10, FASNACHT_SIEHT = 18;
const FASNACHT = 'Des chunnt sicher an dr Fasnacht – Bamlacher Neuschti Noochrichte!';
// Ganz selten erinnert sich ein:e Fußgänger:in an die Geld-Cheats bei den Sims (Cheats im Chat, chat.js) – in zwei Blasen
const SIMS = [
  'Bi de Sims hesch domols eifach ebbis igtippt, un scho isch ‘s Gäld do gsi. Schad, dass ‘s im Läbe nit so goht. Oder?',
  'Aber pass uf: Wer z’gierig wird, dem nimmt ‘s Läbe alles wieder ewäg.',
], SIMS_ALLE = 300; // im Schnitt alle 300 s ein Versuch, klappt nur mit Fußgänger:in in der Nähe

// at = Standort der Ortsfigur, face = Blickrichtung (Punkt), r = Umkreis, in dem Sprüche fallen
const ORTE = [
  { id: 'kurpark', at: [0, 0], face: [0, 0], r: 40, sprueche: [
    'Jedes Mol, wenn öbber Neis chunnt, fange die wieder mit em Badnerlied a. Ich hör\'s hüt scho s\'elft Mol.',
    'Bim Radetzky-Marsch muesch mitklatsche. Wer nit klatscht, derf nochher d\'Tuba heimtrage.',
    '‚Alte Kameraden‘? So sait dr Dirigent au zu sine Bläser:inne.',
    'Nit so lut klatsche, sunscht chunnt dr Schlagzüüger us em Takt. No meh, mein ich.',
    'Mi Dokter het mir e Kur verschriebe. Vo Blosmusik isch do nüt drin gstande.',
    'Ich chumm nit wäge dr Musik. Ich chumm wäge dr Bank im Schatte.',
    'Eimol im Johr isch Lichterfescht im Kurpark. Des isch soo schön – endlich isch emol ebbis los!',
  ] },
  { id: 'rhein', at: [-816, -158], face: [-830, -167], r: 30, sprueche: [   // oben neben dem Bamlacher Bootssteg
    'Do äne isch Frankrich. Luegt grad gliich us, numme s\'Baguette isch besser.',
    'Ich ha emol e Stei bis ins Elsass gschmisse. Sitdem luege d\'Franzose so komisch rüber.',
  ] },
  { id: 'aufzug', at: [348.9, -1703.2], face: [352.78, -1700.1], r: 22, sprueche: [
    'Ich nimm allewiil d\'Stäge. Denooch dörf i obe zwei Stückli Chueche esse.',
    'De Ufzug fahrt ufe und abe. Wie mi Bluetdruck bim Kurkonzert.',
    'Dr Ufzug an dr Rheintreppe isch stecke blibe – mit em halbe Musikverein drin. Sie hän eifach witergspielt.',
  ] },
  { id: 'bahnhof-bb', at: [473.6, -1620.8], face: [478, -1621.5], r: 30, sprueche: [
    'Dr Zug chunnt pünktlich, so stoht\'s im Fahrplan. De Fahrplan isch halt vo 1998.',
    'Bi dr Bahn heißt pünktlich: am richtige Dag.',
  ] },
  { id: 'brunnen', at: [382.6, -1608.4], face: [388.2, -1608.3], r: 18, sprueche: [   // Café | Restaurant zum Brunnen, Rheinstraße 42
    'Früehner het\'s do e K&U gä. Die hän so feini Weckli gha!',
  ] },
  { id: 'therme', at: [37.3, -1233.2], face: [32.0, -1233.8], r: 20, bather: true, sprueche: [   // im Becken A der Balinea Thermen
    'Ich bin sit drei Stund im Thermalwasser. Ich bin jetzt offiziell e Dörrpflümli.',
  ] },
  { id: 'minigolf', at: [213.6, -1467.4], face: [216.8, -1468.5], r: 25, sprueche: [
    'Bahn siebe isch nit schwer. Bahn siebe isch e Charaktertest.',
    'Ich ha do emol e Hole-in-One gspielt. Zeug:inne git\'s leider keini.',
  ] },
  { id: 'rebberg', at: [-108, -262], face: [-117, -268], r: 30, sprueche: [
    'Gutedel isch kei Wii. Gutedel isch e Grundnahrigsmittel.',
    'E Viertele am Dag halt dr Dokter fern. Zwei Viertele di ganz Verwandtschaft.',
  ] },
  { id: 'dorf', at: [-68.5, -26.5], face: [-74, -50], r: 25, sprueche: [
    'Z\'Bamla kennt jede jede. Und weiß, was jede letscht Ziischtig gmacht het.',
    'S\'Lebe isch kei Ponyhof. Usser im Reitzentrum an dr Stroß noch Rheiwiler, do scho.',
    'Am Samschtig spielt dr FC Bad Bellingen. Wer nit kicke cha, goht zum Bolzplatz in Bamlach und tuet so, als ob.',
    'Ich ha emol für dr FC Bad Bellingen gspielt. Drei Minute, ei Ballkontakt. Dr Ball het gwunne.',
    'Im Schloss Rheiwiler het früehner dr Adel gwohnt. Hüt wohne do so alti Lüt, die hän des no erläbt.',
  ] },
];

const shuffle = (a) => { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };

export class Sprueche {
  constructor(ctx, ansehen) {
    this.ctx = ctx;
    this.ansehen = ansehen;
    const { scene, world, musikpavillon } = ctx;
    const r = rng(1848);
    // Kurpark: stehende Zuhörer:in hinter den Stuhlreihen, Blick zur Bühne
    const kp = ORTE[0], c = musikpavillon.center;
    kp.at = [120.3, -1398.9]; kp.face = c;
    this.orte = ORTE.map((o) => {
      const mesh = o.bather ? buildBather(r) : buildPerson(r);
      animateWalk(mesh, 0, 0);
      const [x, z] = o.at;
      mesh.position.set(x, o.bather ? world.heightAt(x, z) : world.groundAt(x, z, world.heightAt(x, z) + 3), z); // Badegast steht auf dem Beckenboden
      mesh.rotation.y = Math.atan2(o.face[0] - x, o.face[1] - z);
      scene.add(mesh);
      if (!o.bather) world.addObstacle([[x - 0.3, z - 0.3], [x + 0.3, z - 0.3], [x + 0.3, z + 0.3], [x - 0.3, z + 0.3]], 1.8);
      return { ...o, x, z, mesh, base: mesh.rotation.y, figur: { mesh }, queue: [], talk: 0 };
    });
    this.cool = 0;
  }

  next(o) {
    if (!o.queue.length) o.queue = shuffle(o.sprueche.slice());
    return o.queue.pop();
  }

  update(dt) {
    const { player } = this.ctx, px = player.pos.x, pz = player.pos.z;
    for (const o of this.orte) {
      // Ortsfigur schaut beim Reden zur Spielfigur, danach wieder in ihre Richtung
      o.talk -= dt;
      const want = o.talk > 0 ? Math.atan2(px - o.x, pz - o.z) : o.base;
      let d = want - o.mesh.rotation.y;
      d = Math.atan2(Math.sin(d), Math.cos(d));
      o.mesh.rotation.y += d * Math.min(1, dt * 4);
    }
    if (this.sims && (this.sims.left -= dt) <= 0) { this.speak(this.sims.who, SIMS[1]); this.sims = null; }
    if ((this.cool -= dt) > 0 || this.ansehen.bm) return; // Bürgermeister redet gerade (ansehen.js)
    const v = player.car;
    // Betrunken reiten ist erlaubt (ansehen.js), aber wer es sieht, weiß schon, was an der Fasnacht kommt
    if (v?.kind === 'horse' && this.ctx.drunk.level > 0) {
      const who = this.speaker(null, FASNACHT_SIEHT, FASNACHT_SIEHT);
      if (who) this.speak(who, FASNACHT);
      return;
    }
    if (v && Math.abs(v.speed) > 5) return;
    if (this.ctx.quests.state.ansehen < 0) return; // mit schlechtem Ruf wird nur gemurrt (ansehen.js)
    if (Math.random() < dt / SIMS_ALLE) {
      const who = this.speaker(null, WALKER, 0); // nur Fußgänger:innen, keine Ortsfigur
      if (who) {
        who.pause = Math.max(who.pause, 2 * SAY_SECS);
        this.speak(who, SIMS[0]);
        this.sims = { who, left: SAY_SECS };
        return;
      }
    }
    const o = this.orte.find((o) => Math.hypot(px - o.x, pz - o.z) < o.r);
    if (!o) return;
    const who = this.speaker(o, WALKER, TALK);
    if (who) this.speak(who, this.next(o));
  }

  // Wer spricht: Fußgänger:in in der Nähe (am Ort o, wenn angegeben), sonst eine Ortsfigur, wenn man nah genug dran ist
  speaker(o, walker, talk) {
    const { player } = this.ctx, px = player.pos.x, pz = player.pos.z;
    let who = null, best = walker;
    for (const p of this.ansehen.walkers()) {
      const dp = Math.hypot(p.x - px, p.z - pz);
      if (dp < best && (!o || Math.hypot(p.x - o.x, p.z - o.z) < o.r)) { best = dp; who = p; }
    }
    if (who) {
      who.pause = Math.max(who.pause, SAY_SECS);
      this.ansehen.cool.set(who, this.ansehen.t + 45); // nicht gleich danach noch grüßen
      who.facing = Math.atan2(px - who.x, pz - who.z);
      return who;
    }
    best = talk;
    for (const f of o ? [o] : this.orte) {
      const d = Math.hypot(px - f.x, pz - f.z);
      if (d < best) { best = d; who = f; }
    }
    if (!who) return null;
    who.talk = SAY_SECS;
    return who.figur;
  }

  speak(who, text) {
    this.cool = COOL;
    this.ansehen.say(who, text, false, SAY_SECS);
  }
}
