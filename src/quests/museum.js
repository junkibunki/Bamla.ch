// Aufgabe 9: Das Bäder- und Heimatmuseum betreten (museum.js: Eingangsbereich hinter der Haustür im Südgiebel)
export default {
  id: 'museum', nr: 9, title: 'Kulturbanaus:in',
  // Schaukasten am Platz vor dem Südgiebel, mit der Glasseite zur Alten Weinstraße
  board: { id: 'museum', name: 'Schaukasten am Museum', x: -138.6, z: -91.4, heading: Math.PI / 2, style: 'brett' },
  text: 'Das Oberrheinische Bäder- und Heimatmuseum zeigt den Bottich, in den 1956 das erste Bellinger Thermalwasser floss. Geh die Treppe hinauf und schau dich im Eingangsbereich um!',
  goal: 'Das Museum betreten (Treppe am Südgiebel)',
  reward: { ansehen: 10, title: 'Kulturfreund:in' },
  setup({ museum, player }, q) {
    q.target(...museum.door, 'Museum');
    return () => {
      if (museum.inside(player.pos.x, player.pos.z)) {
        q.toast('Solli un willkumme im Bäder- un Heimatmuseum!');
        q.complete();
      }
    };
  },
};
