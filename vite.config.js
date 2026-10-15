import edits from './scripts/edits-plugin.mjs'; // Karten-Editor: speichert public/edits.json
import { attachMultiplayer } from './server/multiplayer.mjs';

// Multiplayer-Server auch im Dev-Server (und in `vite preview`) unter /mp
const multiplayer = () => ({
  name: 'bamla-multiplayer',
  configureServer(server) { if (server.httpServer) attachMultiplayer(server.httpServer); },
  configurePreviewServer(server) { attachMultiplayer(server.httpServer); },
});

export default { build: { target: 'esnext' }, plugins: [edits(), multiplayer()] };
