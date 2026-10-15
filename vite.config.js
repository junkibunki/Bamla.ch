import edits from './scripts/edits-plugin.mjs'; // Karten-Editor: speichert public/edits.json

export default { build: { target: 'esnext' }, plugins: [edits()] };
