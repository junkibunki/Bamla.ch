// Alle übrigen Straßen Bamlachs Haus für Haus nach Street View (Google-Aufnahmen 2022/2023).
// Format wie OVERRIDES in belchenstrasse.js: c = Gebäudeschwerpunkt (lokale Meter, ±3 m),
// wall/roof, look, shutters, plinth, eave/pitch (nur ohne LoD2), front: Fassadendetails, face.
import { buildFronts } from './belchenstrasse.js';

const WOOD = 0x6e4e34, WOOD_GREY = 0x7d6e5c, DARK = 0x2c3440, METAL = 0xe8e8e4;

export const STREET_OVERRIDES = [
  // ===== Schloßstraße (Rheinweiler) =====
  { c: [-1318.7, 630.7], wall: 0xf4f4f1, roof: 0x8a4430, look: 'shutter', shutters: 0x6d8fb8, plinth: 0xa9a7a0 }, // Nr. 17: taubenblaue Läden
  { c: [-1326.3, 647], wall: 0xcbbfa6, roof: 0x7a4a3a, look: 'stone',                                             // Nr. 18: Bruchstein, Holztür
    front: [{ t: 'door', x: 0.5, w: 1.0, h: 2.0, color: 0x5a4632, boards: true }] },
  // ===== Street-View-Agenten (scratchpad/results) =====
  // ===== Alte Weinstraße =====
  // Google-Auto-Aufnahmen Apr 2022 nur am Südende (Nr. 1–7) und am Nordende (Nr. 24/35); Mitte nur Nutzer-Photospheres (Dez 2024, Abendlicht, unscharf)
  { c: [-328.4, 178.5], wall: 0x6e665c, roof: 0x5e5450, look: 'plain',                                               // Holzschuppen, verwittertes graues Holz
    front: [{ t: 'panel', x: 0, w: 8, y0: 0, y1: 'eave', color: 0x6e665c, boards: true, ground: true }] },
  { c: [-314.4, 162.6], wall: 0xf4f2ec, roof: 0x8a4a35, look: 'roller' },                                              // Nr. 1: weißes Giebelhaus
  { c: [-273.7, 165.2], wall: 0xf1ede2, roof: 0x6e3a2e, look: 'roller', plinth: 0xb8b4aa },                           // Nr. 3: cremeweiß, PV-Dach
  { c: [-270.7, 156.1], wall: 0xf2f0ea, roof: 0x6e3a2e, look: 'modern', eave: 5.8, pitch: 30,                         // Nr. 3 Anbau: OG holzverkleidet, Garage + Haustür
    front: [{ t: 'panel', x: 0, w: 6, y0: 2.8, y1: 'eave', color: 0xa86a3a, boards: true },
            { t: 'garage', x: 1.2, w: 2.5, h: 2.3, color: 0x9a6a3c, style: 'wood' },
            { t: 'door', x: -1.8, w: 1.1, h: 2.1, color: 0xf0f0ea, glass: true }] },
  { c: [-266.8, 147.2], wall: 0xf2f0ea, roof: 0x6e3a2e, look: 'plain',                                                // Nr. 3 Garage mit Dachterrasse
    front: [{ t: 'garage', x: 0, w: 2.6, h: 2.3, color: 0x9a6a3c, style: 'wood' }] },
  { c: [-238.7, 185.6], wall: 0xd9c7a5, roof: 0x6a6866, look: 'modern',                                               // Kindergarten: sandfarben + weißer Kubus, Glasfronten
    front: [{ t: 'glazing', x: -3, w: 3, y0: 0, y1: 3.2, frame: 0x4e4a48 }, { t: 'glazing', x: 3, w: 3, y0: 0, y1: 3.2, frame: 0x4e4a48 }] },
  { c: [-263.5, 138.7], wall: 0xf4f2ec, roof: 0x9a4a35, look: 'shutter', shutters: 0x4a86b8 },                        // Nr. 5: weiß, hellblaue Läden, Gaube
  { c: [-258.1, 127.9], wall: 0xf3efe2, roof: 0x6e3a2e, look: 'roller',                                               // Nr. 5a: cremeweiß, durchgehender Balkon, 2 Garagentore
    front: [{ t: 'balcony', x: 0, w: 10, y: 2.7, d: 1.4, rail: 'perforated', color: 0xd8d6c0 },
            { t: 'garage', x: 3.5, w: 2.5, h: 2.2, color: 0x9a9a98, style: 'sectional' },
            { t: 'garage', x: 0.5, w: 2.5, h: 2.2, color: 0xf0f0ec, style: 'sectional' }] },
  { c: [-246.4, 120.2], wall: 0xf2f0ea, roof: 0x5e4a40, look: 'modern', face: 'E',                                   // weißer Giebelbau mit dunkelbraunem Garagentor
    front: [{ t: 'garage', x: 0, w: 2.8, h: 2.3, color: 0x4a3a30, style: 'sectional' }] },
  { c: [-247.7, 103.5], wall: 0xe6dcc0, roof: 0x7a3b2a, look: 'small', face: 'E',                                    // Ökonomieteil Nr. 7: beige Putz, Sandsteinbogen, Rolltor
    front: [{ t: 'garage', x: 0.6, w: 2.6, h: 2.3, color: 0xe8e8e4, style: 'sectional' },
            { t: 'door', x: 3.9, w: 1.0, h: 2.0, color: 0x5a3a2a }] },
  // doppelt, siehe Im Kirschgarten: { c: [-240.9, 94], wall: 0xeee6cc, roof: 0x7a3b2a, look: 'shutter', shutters: 0x5a3a28, plinth: 0xb8b0a0, eave: 5.8, pitch: 45 }, // Nr. 7: cremegelb, braune Läden
  { c: [-218.5, 61.6], wall: 0xf0d58a, roof: 0x7a3b2a, look: 'roller' },                                             // gelbes Giebelhaus
  { c: [-212.9, 45.8], wall: 0xf0d58a, roof: 0x7a3b2a, look: 'roller', face: 'E',                                    // gelber Garagenflügel, 3 weiße Tore
    front: [{ t: 'garage', x: -3.2, w: 2.5, h: 2.2, color: 0xf2f2ee, style: 'sectional' },
            { t: 'garage', x: 0, w: 2.5, h: 2.2, color: 0xf2f2ee, style: 'sectional' },
            { t: 'garage', x: 3.2, w: 2.5, h: 2.2, color: 0xf2f2ee, style: 'sectional' }] },
  { c: [-190.3, 68.9], wall: 0xf3eedf, roof: 0x7a3b2a, look: 'shutter', shutters: 0x9a6a45, plinth: 0xb59878 },     // cremeweiß, hellbraune Holzläden, Sandsteingewände
  { c: [-164.5, 16.9], wall: 0xf0a868, roof: 0x5e4a40, look: 'modern', plinth: 0x4a4e55, face: 'W',                  // orange, OG gelborange Holzschalung, 2 weiße Garagentore
    front: [{ t: 'panel', x: 0, w: 9, y0: 5.2, y1: 'eave', color: 0xf0b45a, boards: true },
            { t: 'garage', x: -2.5, w: 2.4, h: 2.2, color: 0xf4f4f0, style: 'wood' },
            { t: 'garage', x: 1.8, w: 2.4, h: 2.2, color: 0xf4f4f0, style: 'sectional' }] },
  { c: [-172, 24], wall: 0xe8c0b4, roof: 0x5e4a40, look: 'plain', face: 'W',                                         // rosa Anbau mit braunem Garagentor
    front: [{ t: 'garage', x: 0, w: 2.3, h: 2.1, color: 0x6a4a3a, style: 'sectional' }] },
  { c: [-174.8, 29.1], wall: 0xe8c0b4, roof: 0x7a3b2a, look: 'shutter', shutters: 0x4a3020, plinth: 0x6a5a55 },     // rosa Altbau, dunkelbraune Läden
  { c: [-159.9, 30.2], wall: 0xf2f0ea, roof: 0x6a6866, look: 'roller',                                               // weiß, eingerüstet (Dez 2024), weißer Balkon
    front: [{ t: 'balcony', x: 0, w: 4, y: 2.7, d: 1.2, rail: 'metal', color: 0xf0f0ec }] },
  { c: [-160.6, -17.7], wall: 0xf2f2ef, roof: 0x5e3a2e, look: 'roller', plinth: 0x3d5a8c },                          // weiß, blauer Sockel, Glasvordach
  { c: [-171.5, -23.8], wall: 0xf3eee4, roof: 0x8a4430, look: 'shutter', shutters: 0x8a3a2a },                       // weiß, rotbraune Läden, Terrasse
  { c: [-134.3, -23.5], wall: 0xf0eee6, roof: 0x6a5a50, look: 'modern', face: 'W',                                  // eingeschossig, Holzgiebel
    front: [{ t: 'panel', x: 0, w: 8, y0: 2.4, y1: 'eave', color: 0xc08a5a, boards: true }] },
  { c: [-151.8, -36.9], wall: 0xead3b0, roof: 0x5e3a2e, look: 'modern', face: 'E',                                  // apricot-beige, weißer Balkon, Wandbild an der Nordseite
    front: [{ t: 'balcony', x: 1.5, w: 2.4, y: 2.7, d: 1.2, rail: 'metal', color: 0xf0f0f0 }] },
  { c: [-146, -80.8], wall: 0xf0ebe0, roof: 0x5e3a2e, look: 'roller', skylights: 2, skylightSide: 1 },              // großes cremeweißes Haus, Pultanbau
  { c: [-146.6, -103.8], wall: 0xf0eee8, roof: 0x5e3a2e, look: 'small' },                                            // weißer Treppengiebel (aus der Ferne)
  { c: [-122.8, -114.6], wall: 0xf2f0ea, roof: 0x8a4430, look: 'shutter', shutters: 0x4f6a6a },                     // weiß, graugrüne Läden (aus der Ferne)
  { c: [-114.8, -114.7], wall: 0xece4d0, roof: 0x7a4a3a, look: 'roller' },                                           // cremefarben, PV (aus der Ferne)
  { c: [-113.8, -153.6], wall: 0xf2f0ea, roof: 0x6a4e44, look: 'roller', plinth: 0x5a524c, face: 'W',              // weiß, ehem. Lebensmittelladen an der Nordecke, Holzbalkon in Loggia
    front: [{ t: 'panel', x: -6.5, w: 3.7, y0: 0, y1: 2.85, ground: true, color: 0x8c4a40 },                          // rotbrauner Ladenrahmen
            { t: 'panel', x: -6.0, w: 2.1, y0: 0, y1: 0.5, ground: true, color: 0xe8e4dc, z: 0.06 },                 // helle Brüstung
            { t: 'door', x: -7.62, w: 0.85, h: 2.05, color: 0xf0eee8, frame: 0xe2ded6 },
            { t: 'garage', x: -6.0, w: 2.0, y0: 0.5, h: 1.6, color: 0xf2f2ee, frame: 0xe2ded6, style: 'roller' },   // Schaufenster, Rollladen zu
            { t: 'panel', x: -7.62, w: 0.5, y0: 2.2, y1: 2.68, ground: true, color: 0xf2f0ea, z: 0.06 },            // kleines Schild
            { t: 'sign', x: -5.95, w: 2.3, y: 2.17, h: 0.58, text: 'Lebensmittel', ink: 0xf6f2ea,
              style: 'italic bold', font: '"Brush Script MT", "Segoe Script", cursive' },
            { t: 'panel', x: -3.6, w: 2.0, y0: 2.7, y1: 'eave', ground: true, color: 0xb4683f },                   // rotbraune Loggiawand
            { t: 'door', x: -3.3, w: 1.0, y0: 2.8, h: 2.0, color: 0xe8e6e0, frame: 0xe8e6e0, glass: true },        // Balkontür
            { t: 'balcony', x: -3.6, w: 2.0, y: -1.25, d: 0.9, rail: 'wood', color: 0x8a4a2a }] },
  { c: [-108.3, -162.7], wall: 0xf2f0ea, roof: 0x5e3a2e, look: 'plain',                                              // Garage
    front: [{ t: 'garage', x: 0, w: 2.4, h: 2.1, color: 0xf0f0ec, style: 'sectional' }] },
  { c: [-155.3, -175.6], wall: 0xeee2bc, roof: 0x6a5a50, look: 'modern', plinth: 0xc8b080, face: 'N',              // umgebaute Scheune: cremegelb, braunes Holztor mit Oberlicht, Garage
    front: [{ t: 'door', x: -2.9, w: 3.2, h: 3.2, color: 0x6a4a32, boards: true },
            { t: 'garage', x: 3.8, w: 2.3, h: 2.2, color: 0x7a5038, style: 'wood' }] },
  { c: [-159.3, -152.4], wall: 0xf2f0ea, roof: 0x6a5a50, look: 'modern' },                                           // weißer Nebenbau, große Fenster (nur teilweise sichtbar)
  { c: [-157.9, -200.4], wall: 0xf1ede0, roof: 0x4e4440, look: 'shutter', shutters: 0x2f4a3a, plinth: 0xc8c0b0 },   // Nr. 35: cremeweiß, dunkelgrüne Läden, Sandsteingewände, Erker
  { c: [-151.2, -207.2], wall: 0xf2f0ea, roof: 0x7a4a3a, look: 'plain', face: 'S',                                  // weißer Anbau mit braunem Garagentor
    front: [{ t: 'garage', x: 0, w: 2.4, h: 2.2, color: 0x6a3e2a, style: 'wood' }] },
  { c: [-145.7, -204], wall: 0xf2f0ea, roof: 0x7a4a3a, look: 'plain', face: 'S',                                    // Garage, braunes Tor
    front: [{ t: 'garage', x: 0, w: 2.4, h: 2.2, color: 0x7a4a30, style: 'wood' }] },
  { c: [-140.3, -201.7], wall: 0xf4f4f2, roof: 0x6a6866, look: 'plain', face: 'S',                                  // Tiefgarage unter Neubau
    front: [{ t: 'garage', x: 0, w: 2.6, h: 2.2, color: 0x9a9a98, style: 'sectional' }] },
  { c: [-163.1, -204.4], wall: 0xf2f0ea, roof: 0x6a5a50, look: 'plain' },                                            // kleiner Anbau (nur Ecke sichtbar)
  { c: [-180.9, -183.4], wall: 0xeec4c0, roof: 0x7a4a3a, look: 'roller', plinth: 0x6a7078, face: 'N',              // rosa Bungalow, weißes Garagentor
    front: [{ t: 'garage', x: -5, w: 2.4, h: 2.2, color: 0xf2f2ee, style: 'sectional' },
            { t: 'door', x: -3.2, w: 1.0, h: 2.1, color: 0xf2f2ee, glass: true }] },
  // nicht sichtbar: c:[-331.3,174.2], c:[-255.2,103.1], c:[-156.8,23.5], c:[-151.6,28], c:[-157.6,15.7], c:[-152,26], c:[-128.5,-38.6], c:[-182.3,-33.4],
  //   c:[-112.6,-101.5], c:[-160.1,-106.2], c:[-162.5,-119.8], c:[-155.8,-128], c:[-143.3,-138.2], c:[-142.3,-147.4], c:[-147.4,-166.6], c:[-104.1,-132.8], c:[-101.5,-141.1],
  //   c:[-53.1,-637.5] (Kleinstbau weit nördlich)
  // Hinweis: Abschnitt z≈-90…-180 (Gasse) ohne Street-View-Abdeckung
  // ===== Am Buck =====
  // Keine Google-Auto-Aufnahmen; nur Nutzer-Photospheres (Dez 2024, Abendlicht)
  { c: [-32.9, -174.7], wall: 0xf4f2ee, roof: 0x5e4a40, look: 'shutter', shutters: 0x8a2a2a, plinth: 0x8a9cb0 },   // Nr. 4: weiß, weinrote Läden, blaugrauer Sockel
  { c: [-7, -175.8], wall: 0xe8d8b8, roof: 0x8a8a88, look: 'plain',                                                 // beiger Flachbau/Garage, graues Holztor
    front: [{ t: 'door', x: 0, w: 1.8, h: 2.1, color: 0x8a7a68, boards: true }] },
  { c: [15, -167.9], wall: 0xf0e6c8, roof: 0x9a5a40, look: 'small' },                                              // cremebeiger Nebenbau mit Flachdach-Anbau
  { c: [-1.6, -144.9], wall: 0x5a4430, roof: 0x5a5450, look: 'plain' },                                             // dunkler Holzschuppen/Carport
  { c: [-8.9, -149.4], wall: 0xf4f2ee, roof: 0x4e4a48, look: 'roller', face: 'N',                                  // weiß, anthrazit Dach mit Dachfenstern, graues Garagentor, braune Haustür
    front: [{ t: 'garage', x: -1.0, w: 2.5, h: 2.1, color: 0xc8ccd0, style: 'sectional' },
            { t: 'door', x: 1.5, w: 1.0, h: 2.1, color: 0x5a3a28, glass: true }] },
  // nicht sichtbar: –
  // ===== Am Golfplatz =====
  // Quelle: Google Street View Apr 2022. Stichstraße zur Apartmentanlage (Abschnitt 1) hat KEINE Abdeckung;
  // die 7 großen Apartmenthäuser (h14–16) sind von der Belchenstraße wegen Böschung/Bäumen nicht sichtbar.
  { c: [492.7, -43.4], wall: 0x2f6650, roof: 0x3a3e3c, look: 'plain' },                                        // Driving-Range-Abschlaghütte, dunkelgrüne Holzpaneele, Flachdach
  { c: [479.8, -49.2], wall: 0x2f6650, roof: 0x3a3e3c, look: 'plain' },                                        // Driving-Range-Abschlaghütte, dunkelgrün
  { c: [138.5, -113.8], wall: 0xf2f0ea, roof: 0x4e4a48, look: 'modern',                                        // EG weiß, OG/Giebel dunkelbraune Holzverschalung, anthrazit Dach
    front: [{ t: 'panel', x: 0, w: 9, y0: 2.8, y1: 'eave', color: 0x4a3a30, boards: true }] },
  { c: [149.8, -117.4], wall: 0xf2f0ea, roof: 0x6a6866, look: 'plain' },                                       // weißer Flachdach-Anbau/Garage
  { c: [135.1, -125.2], wall: 0xe8e8e4, roof: 0x4e4a48, look: 'plain' },                                       // Carport/Garage, dunkles Flachdach (von weitem)
  // c:[155.9,-148.8] schon in Kapellenweg.js erfasst (weißer Flachbau)
  // nicht sichtbar (keine Abdeckung): c:[349.6,-197.9], c:[374.6,-178.6], c:[335.2,-106.5], c:[348.4,-129.7], c:[362,-151.8], c:[321.9,-153.1],
  //   c:[299.9,-118.4], c:[315.7,-94.2], c:[307.2,-99.1]
  // nicht sichtbar: c:[467,-56], c:[460.1,-63.2], c:[508.4,23]
  // ===== Am Sonnenrain =====
  // Street View (Apr 2022) nur EIN Panorama am Westende (vor Nr. 35, @47.7079619,7.5346454); der restliche Straßenzug
  // (Abschnitt 1 ab ca. x=-1200 ostwärts und Abschnitt 0) hat keine Abdeckung ("No Street View imagery").
  { c: [-1210.1, 945.4], wall: 0xf5f4f0, roof: 0x8a4430, look: 'roller', face: 'W',                                 // Nr. 35: weiß, roter Ziegel, rot verputzter Erker am Westgiebel mit Glasbalkon darauf
    front: [{ t: 'panel', x: 0, w: 3.6, y0: 0, y1: 2.6, color: 0xb0463f }, { t: 'balcony', x: 0, w: 4.0, y: 2.7, d: 1.0, rail: 'glass' }] },
  { c: [-1201.1, 939.3], wall: 0xf3f2ee, roof: 0x8a4430, look: 'roller' },                                          // Reihenhaus östl. Nr. 35: weiß, roter Ziegel, Gaube mit dunkelbrauner Holzverkleidung
  { c: [-1218.2, 920.1], wall: 0xf2f2ee, roof: 0x4e4a48, look: 'roller', plinth: 0xb9b7b0,                          // weiß, anthrazit Dach, OG/Giebel mit hell graublauer Holzschalung
    front: [{ t: 'panel', x: 0, w: 10, y0: 2.8, y1: 'eave', color: 0xa3b4c4, boards: true, face: 'S' }, { t: 'panel', x: 0, w: 10, y0: 2.8, y1: 'eave', color: 0xa3b4c4, boards: true, face: 'W' }] },
  { c: [-1221, 942.4], wall: 0x6e5640, roof: 0x6a6866, look: 'plain' },                                            // Holz-Carport (dunkelbraune Balken) vor Nr. 35
  { c: [-1219.4, 947.3], wall: 0x6e5640, roof: 0x6a6866, look: 'plain' },                                          // Carport/Schuppen dahinter, dunkles Holz
  // --- Ostende: nur Nutzer-Panorama (Okt 2024, @47.7087101,7.53909), Ausrichtung ca. ±10° unsicher ---
  { c: [-924.2, 857.1], wall: 0xf2f0ea, roof: 0x6e3e30, look: 'roller', face: 'E',                                 // weiß mit rotbraunen Klinker-Lisenen, rote Fensterrahmen, rote Metallpergola am Eingang (Ostseite), PV
    front: [{ t: 'porch', x: 1.3, w: 3.5, d: 1.5, h: 2.5, color: 0x9a2a2a }, { t: 'panel', x: -4.7, w: 0.8, y0: 0, y1: 'eave', color: 0x7a3a2a, bricks: true },
      { t: 'panel', x: -1.1, w: 1.0, y0: 0, y1: 'eave', color: 0x7a3a2a, bricks: true }, { t: 'panel', x: 4.4, w: 0.8, y0: 0, y1: 'eave', color: 0x7a3a2a, bricks: true }] },
  { c: [-939.6, 884.9], wall: 0xcfd3d8, roof: 0x4e4a48, look: 'modern' },                                          // moderner Bau: kühles Hellgrau, dunkelgrau abgesetzter Rücksprung, dunkle Fenster
  { c: [-957.8, 889.8], wall: 0xe4e6e8, roof: 0x4e4a48, look: 'modern' },                                          // Doppelhaushälfte: sehr hellgrau, dunkle Fenster (entfernt)
  // nicht sichtbar (keine Street-View-Abdeckung im mittleren Straßenteil und in Abschnitt 0): c:[-982.2,890.2], c:[-1127.5,938], c:[-1155.7,917.2],
  // c:[-1146.3,920], c:[-1110.4,879.1], c:[-1173.2,934.8], c:[-1144.9,896.7], c:[-1103.1,936.9], c:[-1015.1,907.9], c:[-999.2,901.5],
  // c:[-1033.1,911], c:[-1133.5,918.7], c:[-962,859.6], c:[-1087.4,935.8], c:[-1004.6,889.3], c:[-1062.9,913.7], c:[-1050,914.7],
  // c:[-1013.2,869.9], c:[-1101,889.2], c:[-1188.7,940.5], c:[-1073.3,912.4], c:[-1165.6,900.7], c:[-1121.6,915], c:[-1008.2,865.7],
  // c:[-1067.6,891.9], c:[-978.7,863.7], c:[-1073.4,887.6], c:[-1045.8,890.2], c:[-1093.3,886.1], c:[-972.3,869.5], c:[-1120.5,892.8],
  // c:[-1040.9,883.9], c:[-1126.7,888.7], c:[-1176.1,911.2], c:[-1020.4,869.8], c:[-1000.3,868.4], c:[-1183.1,906.5], c:[-1057.8,885],
  // c:[-1108.1,885.7], c:[-1157.4,926.5], c:[-941.8,857.2], c:[-1200.6,912.4], c:[-1102.6,911.8], c:[-1094.1,911.7], c:[-964.8,890.9],
  // c:[-1005.3,855.7], c:[-968.4,862.2], c:[-1165.5,934], c:[-1117.1,892.5], c:[-1064.2,891.4], c:[-1085,913.3], c:[-1096.6,928.2],
  // c:[-1136.6,927], c:[-953.7,888.2], c:[-970.2,890.3], c:[-946.9,886], c:[-947.1,889.9], c:[-1208.2,919.5]
  // ===== Bamlacher Straße =====
  // Quelle: Google Street View Apr 2022. Östlicher Abschnitt (S0.80–S0.120, bei c:[-810.8,603.2]) ohne Abdeckung.
  { c: [-922.7, 545.1], wall: 0xf4f4f2, roof: 0x7a4a3a, look: 'shutter', shutters: 0x6f8296 },                 // Nr. 18: weiß, graublaue Klappläden, graue Eckquader, Gaube
  { c: [-1066.5, 671.4], wall: 0x8a5a3a, roof: 0x4e4a48, look: 'plain', eave: 2.5, pitch: 10 },                // brauner Holzschuppen
  { c: [-1072.4, 675.1], wall: 0xe8e8e4, roof: 0x6a6866, look: 'plain',                                        // lange hellgraue Garagen-/Lagerhalle
    front: [{ t: 'garage', x: -2, w: 2.6, h: 2.4, color: 0xc8c8c4, style: 'sectional' }, { t: 'garage', x: 1.5, w: 2.6, h: 2.4, color: 0xc8c8c4, style: 'sectional' }] },
  { c: [-1085.7, 685.3], wall: 0xdcdcda, roof: 0x4e4a48, look: 'roller' },                                     // hellgrau, dunkles Dach (von weitem)
  { c: [-1108.8, 699.6], wall: 0xbccbd8, roof: 0x6a4a3a, look: 'shutter', shutters: 0x2f5fb0,                  // Nr. 8: hellblau-grau, kräftig blaue Läden, Holzbalkon am Anbau
    front: [{ t: 'balcony', x: -5, w: 7, y: 2.7, d: 1.5, rail: 'wood', color: 0xa07a50 }] },
  { c: [-1161, 648.1], wall: 0xeec890, roof: 0x8a4430, look: 'shutter', shutters: 0x6a4a34 },                  // Nr. 5: ocker/apricot, braune Läden, PV auf rotem Dach
  { c: [-1205.2, 659.4], wall: 0xf2f0ea, roof: 0x5e3a2e, look: 'small',                                        // Nr. 1: weiß, Nebengebäude mit braunem Holztor
    front: [{ t: 'garage', x: -1, w: 2.5, h: 2.3, color: 0x8a6040, style: 'wood' }] },
  { c: [-1190, 666.7], wall: 0xf2f0ea, roof: 0x4e3a30, look: 'small' },                                        // großer weißer Altbau, rotbraune Fenstergewände
  { c: [-1180.9, 673.6], wall: 0xe6dac0, roof: 0x4e3a30, look: 'plain',                                        // angebaute Scheune creme, Rundbogentor
    front: [{ t: 'door', x: 0, w: 2.4, h: 2.8, color: 0x6a4a34, boards: true }] },
  { c: [-1171.1, 674.4], wall: 0x7a6a5a, roof: 0x4e3a30, look: 'plain' },                                      // offener Holzschuppen/Unterstand
  { c: [-1180.5, 632.5], wall: 0xf4f2ec, roof: 0x6a4a3a, look: 'shutter', shutters: 0x6a4632, skylights: 2,     // weiß, braune Läden, dunkler Holzvorbau mit Veranda
    front: [{ t: 'porch', x: -3, w: 5, d: 2.5, h: 2.8, color: 0x5a3a24, face: 'S' }] },
  // nicht sichtbar: c:[-1053,671.3], c:[-1091.3,696.3], c:[-1088.4,676.2], c:[-1153.8,624.4], c:[-1166.9,627.7], c:[-1151.3,630.5],
  //   c:[-1137.9,682.6], c:[-1201.3,682.2], c:[-918.2,551.3]
  // keine Abdeckung: c:[-810.8,603.2], c:[-799.4,606.7]
  // ===== Belchenstraße (Nachtrag: nur Gebäude ohne OV) =====
  // Google-Auto Apr 2022 nur im Ost-West-Abschnitt; der Nord-Süd-Stich (Abschnitt 0) hat keine Abdeckung
  { c: [12, -207.2], wall: 0x6a4a32, roof: 0x7a4a3a, look: 'plain', face: 'S',                                     // Holzanbau neben Fachwerkgiebel, orangebraunes Brettertor
    front: [{ t: 'door', x: 0, w: 2.6, h: 2.4, color: 0xb06a3a, boards: true }] },
  { c: [-5.1, -209.5], wall: 0x7a5a3a, roof: 0x9a4a35, look: 'plain' },                                             // Holzschuppen mit Ziegeldach
  { c: [30.2, -220.9], wall: 0xf2f0ea, roof: 0x6e4a3a, look: 'roller',                                             // weißes Wohnhaus mit Balkonen (von hinten/aus der Ferne)
    front: [{ t: 'balcony', x: 0, w: 4, y: 2.7, d: 1.3, rail: 'metal', color: 0xe8e8e4 }] },
  { c: [-89.5, -213.1], wall: 0xf0eee8, roof: 0x6a5a50, look: 'plain',                                             // Doppelgarage, dunkelgraue Tore
    front: [{ t: 'garage', x: -1.4, w: 2.3, h: 2.1, color: 0x4e4e50, style: 'sectional' }, { t: 'garage', x: 1.4, w: 2.3, h: 2.1, color: 0x4e4e50, style: 'sectional' }] },
  // nicht sichtbar: c:[12.1,-271.8], c:[33,-251.9], c:[67,-133.9], c:[14.7,-233.1], c:[25.2,-232.6], c:[79.8,-132.1], c:[0.7,-238.9],
  //   c:[-87.1,-176.8], c:[-98.7,-174.2], c:[-81,-163.3], c:[-47.3,-183.5], c:[-45.9,-186.4], c:[5.5,-221.3], c:[12.7,-212.2],
  //   c:[-3.3,-257.1], c:[-62.5,-216.2], c:[26.7,-253.5], c:[52,-260.4]
  // ===== Bergstraße ===== (Rheinweiler; Bergstraße selbst ohne Street-View-Abdeckung, nur von der Einmündung Blauenstraße aus gesehen, Apr 2022)
  { c: [-1405.4, 885.7], wall: 0xefe6cc, roof: 0x5e3a2e, look: 'roller', plinth: 0xb0aea8 },                            // hell-cremegelb, hoher grauer Sockel
  { c: [-1403, 894.9], wall: 0xeeeae0, roof: 0x6a6866, look: 'plain',                                                  // Garage weiß, helles Tor
    front: [{ t: 'garage', x: 0, w: 2.5, h: 2.1, color: 0xe8e8e4, style: 'sectional' }] },
  // keine Abdeckung / nicht sichtbar: c:[-1367.9,928.4], c:[-1398,973.5], c:[-1382.4,925.8], c:[-1411.5,910], c:[-1419.6,973.4], c:[-1375.8,920.6],
  //   c:[-1418.6,933.1], c:[-1410.4,904.6], c:[-1413.2,914.9], c:[-1425.2,957.2], c:[-1395.1,955.3], c:[-1403.5,970.7], c:[-1413.6,969], c:[-1421.2,944.6],
  //   c:[-1414.3,964], c:[-1422.4,972.4], c:[-1416.7,964], c:[-1416,940.3], c:[-1397,936.7]
  // ===== Birkenhof =====
  // KEINE Street-View-Abdeckung (alle Standpunkte ohne Panorama).
  // nicht sichtbar: c:[1264.8,-217], c:[1271.1,-183.5], c:[1277.8,-223.6], c:[1248.5,-228.4]
  // ===== Blansinger Straße (Rheinweiler) =====
  // Google-Auto Apr 2022 bis zur Baustelle (≈ Nr. 10/13); Südteil + Bogen nach Osten nur Nutzer-Photospheres ("N.", Jul–Sep 2024, Neubaugebiet).
  { c: [-1427.2, 736.8], wall: 0xe8e8e2, roof: 0x6a6866, look: 'plain', face: 336,                           // Garagenzeile am Bahnhof: weiß, graue Schwingtore
    front: [{ t: 'garage', x: -6, w: 2.4, h: 2.1, color: 0x9a9c9a, style: 'sectional' }, { t: 'garage', x: -2, w: 2.4, h: 2.1, color: 0x9a9c9a, style: 'sectional' },
            { t: 'garage', x: 2, w: 2.4, h: 2.1, color: 0x9a9c9a, style: 'sectional' }, { t: 'garage', x: 6, w: 2.4, h: 2.1, color: 0x9a9c9a, style: 'sectional' }] },
  { c: [-1418.2, 734.8], wall: 0xe6e2da, roof: 0xb08a6a, look: 'plain' },                                     // Carport/Unterstand mit Wellblechdach (Automaten)
  { c: [-1426.9, 740.5], wall: 0xeeeeea, roof: 0x6a6866, look: 'plain' },                                     // weißer Schuppen hinter der Mauer
  { c: [-1405.1, 781.2], wall: 0xf3f3ef, roof: 0x8a4430, look: 'small', plinth: 0xb5b2aa, face: 'W',          // Nr. 3: weißes Bauernhaus mit Außentreppe, Scheune mit dunkler Bretterverschalung in der Mitte
    front: [{ t: 'panel', x: -0.5, w: 6.5, y0: 2.6, y1: 'eave', color: 0x3e2c20, boards: true },
            { t: 'door', x: -2, w: 2.2, h: 3.2, color: 0x5a4030, boards: true }, { t: 'door', x: 1.6, w: 1.7, h: 2.4, color: 0x5a4030, boards: true },
            { t: 'garage', x: 9, w: 2.4, h: 2.2, color: 0x6a4a34, style: 'wood' }] },
  { c: [-1411.2, 797.1], wall: 0xf2f2ee, roof: 0x8a4430, look: 'small' },                                     // Nr. 5: weißer Anbau, weiße Fenster
  { c: [-1421.1, 801.7], wall: 0xeeeeea, roof: 0x8a8a84, look: 'plain' },                                     // Garage mit Dachterrasse (Holzzaun)
  { c: [-1434.3, 810.3], wall: 0xf4f4f0, roof: 0x5e4a40, look: 'shutter', shutters: 0x8c8277, eave: 5.8, pitch: 42 }, // weißes Giebelhaus, graubraune Klappläden
  { c: [-1439.2, 815.2], wall: 0xf2f2ee, roof: 0x5e3a2e, look: 'roller', face: 'E',                           // Garagenteil von Nr. 2: weißes Holztor
    front: [{ t: 'garage', x: -1.2, w: 2.6, h: 2.3, color: 0xf2f2ee, style: 'wood' }] },
  { c: [-1441.9, 820.7], wall: 0xf2f2ee, roof: 0x5e3a2e, look: 'roller', face: 'E',                           // Nr. 2: weiß, dunkelbraunes Dach mit Gaube, rote Haustür
    front: [{ t: 'door', x: -0.5, w: 1.0, h: 2.1, color: 0x9a2a2a }] },
  { c: [-1424.7, 820.3], wall: 0xe6e4de, roof: 0x6a6866, look: 'plain', face: 'W',                            // Trafoturm, graue Stahltür
    front: [{ t: 'door', x: 0, w: 1.2, h: 2.2, color: 0x8a8c88 }] },
  { c: [-1426, 838.7], wall: 0xe2e0da, roof: 0x8a8a84, look: 'plain', face: 321,                             // Garagen im Hang (offene Stellplätze), Flachdach
    front: [{ t: 'garage', x: -3, w: 3, h: 2.3, color: 0x3a3a3a, style: 'sectional' }, { t: 'garage', x: 1.5, w: 3, h: 2.3, color: 0x3a3a3a, style: 'sectional' }] },
  { c: [-1431.8, 870.9], wall: 0x6f8fc0, roof: 0x4e4a48, look: 'roller', face: 'W',                           // Nr. 9: taubenblau holzverschalt, Balkon mit gelochtem Blechgeländer
    front: [{ t: 'panel', x: 0, w: 12, y0: 0, y1: 'eave', color: 0x6f8fc0, boards: true },
            { t: 'balcony', x: -1, w: 4, y: 2.7, d: 1.3, rail: 'perforated', color: 0xe8e8e4 }] },
  { c: [-1437.2, 885.9], wall: 0x6f8fc0, roof: 0x8a4430, look: 'plain', face: 'W',                           // blaue Holz-Garage mit Carport und Wagenrad
    front: [{ t: 'panel', x: 0, w: 6, y0: 0, y1: 'eave', color: 0x6f8fc0, boards: true }] },
  { c: [-1454.3, 863.9], wall: 0xf0f0ec, roof: 0x8a4430, look: 'plain', face: 'E',                           // Doppelgarage: weiße Sektionaltore, Giebel braun verschalt
    front: [{ t: 'garage', x: -1.4, w: 2.5, h: 2.2, color: 0xf2f2ee, style: 'sectional' }, { t: 'garage', x: 1.6, w: 2.5, h: 2.2, color: 0xf2f2ee, style: 'sectional' }] },
  { c: [-1466.2, 887.7], wall: 0xf4f4f0, roof: 0x4e4a48, look: 'roller', plinth: 0x5a5e66 },                   // weiß, dunkles Dach mit Dachfenstern, schiefergrauer Sockel
  { c: [-1433.8, 896.2], wall: 0xf2f2ee, roof: 0x6a6866, look: 'plain', face: 'W',                           // Garage von Nr. 11: braunes Sektionaltor
    front: [{ t: 'garage', x: 0, w: 2.5, h: 2.2, color: 0x7a4a2c, style: 'sectional' }] },
  { c: [-1438.5, 901.1], wall: 0xf2f2ee, roof: 0x5e3a2e, look: 'modern' },                                    // Nr. 11: weiß, braune Holzfenster, weiße Rollläden
  { c: [-1442.5, 910.6], wall: 0xf2f2ee, roof: 0x6a6866, look: 'plain', face: 'W',                           // Doppelgarage (anthrazit) mit Dachterrasse
    front: [{ t: 'garage', x: -1.4, w: 2.4, h: 2.2, color: 0x4a4c50, style: 'sectional' }, { t: 'garage', x: 1.2, w: 2.4, h: 2.2, color: 0x4a4c50, style: 'sectional' }] },
  { c: [-1449.7, 921.4], wall: 0xf3f3f0, roof: 0x8a4430, look: 'roller', plinth: 0xc8c6c0, face: 'W',         // Nr. 13: weißes Mehrfamilienhaus, gestapelte Balkone mit Metallgeländer
    front: [{ t: 'balcony', x: 0, w: 4, y: 2.7, d: 1.4, rail: 'metal', color: 0xb8bcbe }, { t: 'balcony', x: 0, w: 4, y: 5.4, d: 1.4, rail: 'metal', color: 0xb8bcbe },
            { t: 'garage', x: 1.5, w: 2.2, h: 2.2, color: 0xc8c8c4, style: 'sectional' }] },
  { c: [-1499.5, 920], wall: 0xf2f2ee, roof: 0x4e4a48, look: 'shutter', shutters: 0x3a2e28, face: 'E',        // langes weißes Haus, fast schwarze Läden, Nordende dunkel verschalt
    front: [{ t: 'panel', x: 4, w: 3, y0: 0, y1: 'eave', color: 0x4a3426, boards: true }] },
  { c: [-1497.3, 936.1], wall: 0xeceae4, roof: 0x8a4430, look: 'plain' },                                     // Garage, weiß mit rotbraunem Dach
  { c: [-1452.5, 983.6], wall: 0xf0e2b0, roof: 0x4e4a48, look: 'roller' },                                    // großes Mehrfamilienhaus: hellgelb, Gauben, Balkone (über Stützmauer)
  { c: [-1500.5, 991.3], wall: 0xf2f2ee, roof: 0x6a6866, look: 'modern', eave: 6.3, pitch: 0 },               // Neubau-Reihenhaus 2024: weißer Kubus, Flachdach
  { c: [-1496.1, 975.5], wall: 0xd6cfc2, roof: 0x6a6866, look: 'modern', eave: 6.3, pitch: 0 },               // Neubau 2024 im Rohbau (Beton/Grau)
  { c: [-1494.5, 970.2], wall: 0xd6cfc2, roof: 0x6a6866, look: 'modern', eave: 6.3, pitch: 0 },               // Neubau 2024 im Rohbau (aus Distanz)
  { c: [-1439.2, 1003.2], wall: 0xf0f0ec, roof: 0x8a8a84, look: 'plain', face: 'S',                          // weiße Doppelgarage, Flachdach (vom Weinbergweg aus)
    front: [{ t: 'garage', x: -1.4, w: 2.4, h: 2.1, color: 0xf2f2ee, style: 'sectional' }, { t: 'garage', x: 1.4, w: 2.4, h: 2.1, color: 0xf2f2ee, style: 'sectional' }] },
  { c: [-1434.8, 996.1], wall: 0xeeeeea, roof: 0x8a8a84, look: 'plain' },                                     // weißer Flachdach-Nebenbau
  // nicht sichtbar: c:[-1426.5,893.1], c:[-1450.3,817.4], c:[-1418.7,1009.9], c:[-1413.8,998.9], c:[-1421,1002.4] (hinter Baum),
  //   c:[-1426.2,983.5], c:[-1488.7,948.7], c:[-1490.2,954.4] (Neubau-Reihe, nur verdeckt), c:[-1463.1,828.6], c:[-1460.9,832.1],
  //   c:[-1445.2,913.2] (Treppenhaus-Fragment), c:[-1419.7,756.4] (h 1 m, kein Gebäude erkennbar)
  // ===== Blauenstraße =====
  // Google Street View Apr 2022 von Nr. 1 (Westende) bis Nr. 23 (Einmündung Friedhofstraße, x≈-1060). Östlich davon keine
  // Google-Abdeckung, nur ein Nutzer-Panorama (Okt 2024) am Ostende. Nr. 22 (und Nachbarn südl. gegenüber 22/23) sind verpixelt.
  { c: [-1062, 845.1], wall: 0xf0dc84, roof: 0x5e3a2e, look: 'roller',                                            // Nr. 23: kräftig gelb, 2-geschossiger weißer Wintergarten an der Westseite
    front: [{ t: 'glazing', x: 3.5, w: 3.5, y0: 0, y1: 5.4, frame: 0xf4f4f4 }] },
  { c: [-1024.8, 836], wall: 0xf4f3ef, roof: 0x7a3b2a, look: 'roller',                                            // Ecke Friedhofstraße: weiß, braunroter Ziegel, durchgehender Holzbalkon am Westgiebel
    front: [{ t: 'balcony', face: 'W', x: 0, w: 8, y: 2.7, d: 1.2, rail: 'wood', color: 0x8a5a3e }] },
  { c: [-1066.6, 812.2], wall: 0xf6f6f3, roof: 0x4a3c36, look: 'modern', plinth: 0xa9a9a4,                        // Neubau gegenüber Nr. 23: reinweiß, dunkle Fenster, anthrazit Eingangsportal
    front: [{ t: 'porch', x: -2.5, w: 1.6, d: 0.5, h: 2.6, color: 0x3c3c3c }] },
  { c: [-1089.5, 815], wall: 0xf2f2ef, roof: 0x4e4a48, look: 'modern',                                           // 70er-Haus: weiß, OG/Giebel dunkelgraue Holzschalung, Pultdächer mit PV
    front: [{ t: 'panel', x: 0, w: 8, y0: 2.6, y1: 'eave', color: 0x50545a, boards: true }] },
  { c: [-1097.9, 811], wall: 0xf2f2ef, roof: 0x4a4a4c, look: 'modern', eave: 3.0, pitch: 5 },                     // flacher Bungalow-Teil davon, dunkle Traufblende
  { c: [-1114.1, 824.9], wall: 0xcfcdc6, roof: 0x8a8a86, look: 'plain',                                          // Doppelgarage Sichtbeton, 2 dunkelgraue Sektionaltore
    front: [{ t: 'garage', x: -1.4, w: 2.4, h: 2.1, color: 0x4b4c4e, style: 'sectional' }, { t: 'garage', x: 1.4, w: 2.4, h: 2.1, color: 0x4b4c4e, style: 'sectional' }] },
  { c: [-1121.7, 810.1], wall: 0xf3f2ee, roof: 0x8a4a35, look: 'roller' },                                         // hinter Doppelgarage: weiß, rotbrauner Ziegel mit Gaube
  { c: [-1137, 821.7], wall: 0xf2f2ee, roof: 0x4e443e, look: 'roller' },                                           // Anbau: weiß, dunkelbraunes Dach mit Dachfenstern
  { c: [-1145.6, 818.5], wall: 0xe9e3d3, roof: 0x8c7d72, look: 'modern' },                                         // gegenüber Nr. 17: beige, ausgeblichenes graubraunes Dach, braune Holzblende unter Traufe
  { c: [-1130.8, 851.5], wall: 0xf3f3f1, roof: 0x4e4a48, look: 'modern' },                                         // Doppelhaus (teils verpixelt): weiß, kubisch, Balkone mit Metallgeländer
  { c: [-1137.4, 852.6], wall: 0xf3f3f1, roof: 0x4e4a48, look: 'modern' },                                         // Doppelhaus-Hälfte, wie oben
  { c: [-1154.4, 863.2], wall: 0xe8ead5, roof: 0x6b5a4e, look: 'roller',                                          // Nr. 17: OG blass gelbgrün, EG schiefergrau, Balkon OG West
    front: [{ t: 'panel', x: 0, w: 15, y0: 0, y1: 2.7, color: 0x5b646e }, { t: 'balcony', x: 4.5, w: 4, y: 2.7, d: 1.2, rail: 'metal', color: 0x3c3e40 }] },
  { c: [-1163.6, 851.7], wall: 0x8c8e8f, roof: 0x5a4030, look: 'plain',                                          // Garage vor Nr. 17: grau verputzt, braune Holzblende, Holztor, Carport westl.
    front: [{ t: 'garage', x: -0.8, w: 2.5, h: 2.2, color: 0x7d6e60, style: 'wood' }] },
  { c: [-1179.9, 829.4], wall: 0xf2f0ea, roof: 0x8a4a35, look: 'roller',                                          // weiß, rotbrauner Ziegel mit 2 Gauben, Ostgiebel-OG weinrot gestrichen
    front: [{ t: 'panel', face: 'E', x: 0, w: 10, y0: 2.7, y1: 'eave', color: 0x8e3540 }] },
  { c: [-1189.7, 833.5], wall: 0xeeeeea, roof: 0x7d7873, look: 'plain',                                          // Doppelgarage weiß, 2 braune Holztore, Dachterrasse mit Bruchstein-Brüstung
    front: [{ t: 'garage', x: -1.6, w: 2.6, h: 2.2, color: 0x6b4a32, style: 'wood' }, { t: 'garage', x: 1.9, w: 2.2, h: 2.2, color: 0x6b4a32, style: 'wood' },
      { t: 'panel', x: 0, w: 7, y0: 2.4, y1: 3.2, color: 0x8a8580, bricks: true }] },
  { c: [-1200.2, 838.4], wall: 0xe3e2dc, roof: 0x9a9a96, look: 'plain',                                          // Doppelgarage Beton/weiß, braune Holztore
    front: [{ t: 'garage', x: -1.4, w: 2.4, h: 2.1, color: 0x7a4a30, style: 'wood' }, { t: 'garage', x: 1.4, w: 2.4, h: 2.1, color: 0x7a4a30, style: 'wood' }] },
  { c: [-1212.7, 835.7], wall: 0xeee6cf, roof: 0x8a4a35, look: 'roller',                                          // Nr. 14: cremefarbener Bungalow, Rundbogen-Loggia am Westende
    front: [{ t: 'porch', x: -3.5, w: 3, d: 1.5, h: 2.6, color: 0xeee6cf }] },
  { c: [-1199.3, 856.8], wall: 0xf0f0ee, roof: 0xe8e8e6, look: 'plain' },                                          // weißer Metall-Carport (Flachdach) Nr. 16
  { c: [-1182.8, 871.4], wall: 0xf3f3f0, roof: 0x5a4438, look: 'roller' },                                         // hinter Carport: weiß, dunkelbraunes Dach (nur teilweise sichtbar)
  { c: [-1203.2, 877.6], wall: 0xf3f2ee, roof: 0x7a4a3a, look: 'roller' },                                         // weiß, braunes Dach (entfernt)
  { c: [-1227.2, 877.4], wall: 0xf3f1ea, roof: 0x8a4a35, look: 'roller' },                                         // hinter Hecke: weiß, rotbrauner Ziegel, dunkler Balkon
  { c: [-1245.7, 842.9], wall: 0xeeeeea, roof: 0xa04a30, look: 'modern', skylights: 3, skylightSide: 1,             // Nr. 12: gebrochen weiß, orangeroter Ziegel, braune Holzfenster, offene Garage im EG
    front: [{ t: 'garage', x: 3, w: 3.0, h: 2.4, color: 0x8a5a35, style: 'wood' }] },
  { c: [-1250.5, 865.5], wall: 0x6a4a3a, roof: 0x5a4a40, look: 'plain',                                          // Holzschuppen/Sichtschutz, dunkelbraune Bretter
    front: [{ t: 'panel', x: 0, w: 5, y0: 0, y1: 'eave', color: 0x6a4a3a, boards: true }] },
  { c: [-1285.1, 852.1], wall: 0xf5f5f2, roof: 0x6a4a3a, look: 'roller', plinth: 0xa8a8a6,                        // Nr. 8: weiß, braunes Dach, Holzverschalung am Ortgang, Glasbalkon am Westgiebel
    front: [{ t: 'balcony', face: 'W', x: 0, w: 4, y: 2.7, d: 1.5, rail: 'glass' }] },
  { c: [-1295.2, 885], wall: 0x4a3c30, roof: 0x4e4a48, look: 'plain', eave: 2.5, pitch: 5 },                       // dunkle Holzpergola/Carport vor Nr. 7
  { c: [-1302.1, 889.6], wall: 0xf0efea, roof: 0x5a4436, look: 'modern',                                         // Nr. 7 (Hanghaus): Giebel weiß, Westteil grau-lila (EG dunkler), Ostteil dunkle Holzschalung, Holzbalkon
    front: [{ t: 'panel', x: 3.5, w: 5, y0: 0, y1: 2.7, color: 0x6e6c7a }, { t: 'panel', x: 3.5, w: 5, y0: 2.7, y1: 5.4, color: 0xa09eaa },
      { t: 'panel', x: -2.5, w: 6, y0: 0, y1: 5.4, color: 0x4a4644, boards: true }, { t: 'balcony', x: -1, w: 4, y: 2.7, d: 1.0, rail: 'wood', color: 0x7a5a3e }] },
  { c: [-1315, 854.7], wall: 0xf3f0e6, roof: 0x5e4a40, look: 'roller',                                           // Nr. 6: cremeweiß, Haustür mit Vordach, Giebel nach Osten
    front: [{ t: 'door', x: 0, w: 1.1, h: 2.1, color: 0x6a4530 }] },
  { c: [-1336.2, 895.9], wall: 0xf3f3ef, roof: 0x5a4438, look: 'roller',                                          // Nr. 5: weiß, runder verglaster Erker im OG (West), dunkler Holzbalkon
    front: [{ t: 'glazing', x: 5, w: 3, y0: 2.7, y1: 5.2, frame: 0xf4f4f4 }, { t: 'balcony', x: 0.5, w: 5, y: 2.7, d: 1.2, rail: 'wood', color: 0x4e3a2e }] },
  { c: [-1338.7, 855.8], wall: 0xf0e8d2, roof: 0x6a5040, look: 'roller',                                          // cremefarben, orangerote Markise am Balkon
    front: [{ t: 'awning', face: 'W', x: 0, w: 3, y: 5.0, d: 1.5, color: 0xc8583a }] },
  { c: [-1354.5, 895.9], wall: 0xd5d6d2, roof: 0xbfc0bc, look: 'plain' },                                          // hellgrauer Wellblech-Schuppen
  { c: [-1358.2, 844.9], wall: 0xf2f2ee, roof: 0x9a9a96, look: 'plain',                                          // Garage Nr. 4: weiß, Flachdach, Tore rosa-violett und weinrot
    front: [{ t: 'garage', x: -1.4, w: 2.4, h: 2.1, color: 0xa86a9a, style: 'sectional' }, { t: 'garage', x: 1.4, w: 2.4, h: 2.1, color: 0x8a3050, style: 'sectional' }] },
  { c: [-1365.2, 852.8], wall: 0xf4f4f0, roof: 0x6a4a3a, look: 'roller', skylights: 2, skylightSide: 1 },          // Nr. 4: weiß, braunes Dach mit großer PV-Anlage, Fensterband im Westgiebel
  { c: [-1365.2, 885.4], wall: 0xf5f4ee, roof: 0x5a3e30, look: 'roller', plinth: 0x6e625c,                        // Nr. 3: hohes weißes Haus, Holzschalung im Giebeldreieck, Loggia mit Holzstützen
    front: [{ t: 'balcony', x: -3, w: 3, y: 2.7, d: 1.5, rail: 'wood', color: 0x6a4a35, posts: true }] },
  { c: [-1395.7, 847.1], wall: 0xf2f2ee, roof: 0x5a4438, look: 'roller' },                                         // Nr. 2: weiß, dunkelbraunes Dach, Anbau mit Balkon (Metallgeländer)
  { c: [-1424.7, 867.1], wall: 0x5a6068, roof: 0x4e4a48, look: 'plain' },                                          // Holzunterstand/Carport dunkelgrau, Brennholzlager
  { c: [-951, 822.6], wall: 0xf2f2f0, roof: 0x3e3e40, look: 'modern' },                                           // Ostende (nur Nutzer-Panorama 2024): moderner weißer Bau, flaches Pultdach mit großem Überstand, dunkle Fensterbänder
  // nicht sichtbar (keine Abdeckung östl. x≈-1060, verpixelt oder verdeckt): c:[-956.8,791.1], c:[-982.8,800.2], c:[-992.1,802.8],
  // c:[-976.1,830.3], c:[-1017.1,834.6], c:[-1018.1,841.1], c:[-1005.1,800.9], c:[-1003.3,833.4], c:[-997.4,802], c:[-986.9,828.4],
  // c:[-1025.4,806.6], c:[-1071.7,857.1], c:[-1086.6,846.8] (verpixelt), c:[-1095.2,843.2], c:[-1108.5,855.4] (verpixelt), c:[-1111.1,840.2],
  // c:[-1116.8,860.2], c:[-1169.6,869.6], c:[-1197.7,861.8], c:[-1222.4,867.2], c:[-1251,871.2], c:[-1274.4,875.9], c:[-1292.3,894.6],
  // c:[-1320.5,886.5], c:[-1323.4,859.1], c:[-1325.2,893.8], c:[-1355.9,839.2], c:[-1372.5,887.2], c:[-1420.5,876.8]
  // ===== Brückleweg (Bamlach) – keine Google-Auto-Abdeckung, nur Nutzer-Photospheres „N.“ (Sep/Dez 2024) =====
  { c: [-242.3, -89], wall: 0xeeeeea, roof: 0x5e5a56, look: 'roller',                                           // weiß/hellgrau, weiße Fenster, Vordach über Haustür
    front: [{ t: 'porch', x: 2, w: 2.2, d: 1.2, h: 2.6, color: 0x8a8c90 }] },
  { c: [-226, -79.5], wall: 0xa8a49c, roof: 0x7a4a36, look: 'plain' },                                          // grau verputzter Schuppen
  { c: [-217, -77], wall: 0xf2ecd8, roof: 0x7a4a36, look: 'shutter', shutters: 0x7a4a34 },                      // creme, braune Läden, Gaube
  // Kindergarten mit Gemeindehalle (Brückleweg 2): eigenes Modell in kindergarten.js
  { c: [-203.2, -70.3], wall: 0x9a6a40, roof: 0x7a4a36, look: 'plain',                                         // Holz-Doppelgarage mit großem Zimmermanns-Carportdach
    front: [{ t: 'garage', x: -1.4, w: 2.4, h: 2.2, color: 0x5a3a24, style: 'wood' }, { t: 'garage', x: 1.4, w: 2.4, h: 2.2, color: 0x5a3a24, style: 'wood' }] },
  { c: [-194.6, -66.7], wall: 0xeeeeea, roof: 0x6a6866, look: 'plain',                                         // weiße Flachdachgarage, anthrazit Tor, Holzterrasse oben
    front: [{ t: 'garage', x: 0, w: 2.5, h: 2.2, color: 0x4a4c50, style: 'sectional' }] },
  { c: [-184.1, -62.6], wall: 0xeee4cc, roof: 0x8a4a36, look: 'roller',                                         // eingeschossig, creme, Terrasse mit schwarzem Schmiedeeisengeländer
    front: [{ t: 'balcony', x: 0, w: 9, y: 1.2, d: 2, rail: 'metal', color: 0x2a2a2a }] },
  { c: [-170.8, -58.1], wall: 0xf0eadc, roof: 0x7a4a36, look: 'roller' },                                       // hell creme, braunes Dach, Kamin
  { c: [-167, -98.3], wall: 0xf2f0ea, roof: 0x6a3a2e, look: 'roller' },                                         // weiß, braunes Dach (von weitem)
  { c: [-187.9, -85.2], wall: 0xf0f0ec, roof: 0x6a6866, look: 'plain' },                                        // weißer Flachbau mit PV-Modulen auf dem Dach
  { c: [-176.2, -93.5], wall: 0xf0f0ec, roof: 0x6a6866, look: 'plain' },                                        // weiße Garage
  // nicht sichtbar: c:[-155,-75.1], c:[-231.3,-54.5], c:[-193.5,-44.6], c:[-177.7,-38.4], c:[-159.9,-48.2] (Bäume/Hinterlieger)
  // ===== Burgunderstraße =====
  // Quelle: Google Street View Apr 2022 (Abschnitt bei Schloßstraße zusätzlich Nutzer-Panorama Aug 2024)
  { c: [-1145.8, 586.9], wall: 0xf2f2ee, roof: 0x4e4a48, look: 'roller' },                                     // weiß, anthrazit Dach (Ortseingang)
  { c: [-1157.5, 608.7], wall: 0xf2f2ee, roof: 0x5a5654, look: 'modern',                                       // weiß, grauer Metallbalkon
    front: [{ t: 'balcony', x: 0, w: 5, y: 2.7, d: 1.3, rail: 'metal', color: 0x8a8a88 }] },
  { c: [-1158.5, 599.2], wall: 0x7a5a3c, roof: 0x7a5a3c, look: 'plain', eave: 2.4, pitch: 5 },                 // Holzpergola/Carport
  { c: [-1193.5, 575.2], wall: 0xf4f4f0, roof: 0x5a5654, look: 'roller' },                                     // weiß, dunkelgraues Dach
  { c: [-1187, 567.5], wall: 0xeeeeea, roof: 0x5a5654, look: 'plain',                                          // Nebengebäude: rotes Holztor, hellgrau verschalter Giebel
    front: [{ t: 'garage', x: 0, w: 2.6, h: 2.3, color: 0x8a2430, style: 'wood' }, { t: 'panel', x: 0, w: 6, y0: 2.6, y1: 'eave', color: 0xd0ccc4, boards: true }] },
  { c: [-1214.7, 595.9], wall: 0xf4f4f0, roof: 0x5e3a2e, look: 'shutter', shutters: 0x3a3e3c,                  // Nr. 19: weiß, dunkelgraue Läden, Scheunenteil mit grauer Bretterschalung + 2 Tore
    front: [{ t: 'panel', x: 5, w: 5, y0: 2.6, y1: 'eave', color: 0xc8c4bc, boards: true },
            { t: 'garage', x: 3.8, w: 2.4, h: 2.4, color: 0xd8d8d4, style: 'sectional' }, { t: 'garage', x: 6.3, w: 2.4, h: 2.4, color: 0xd8d8d4, style: 'sectional' }] },
  { c: [-1240.6, 653.8], wall: 0xdcd8cc, roof: 0x5e3a2e, look: 'shutter', shutters: 0xa0683a },                // Nr. 30: hellgrauer Rauputz, hellbraune Holzläden, Gaube
  { c: [-1249.1, 659], wall: 0xe8e2d0, roof: 0x6a6866, look: 'plain',                                          // 3er-Garagenzeile, ockerfarbene Tore, Holzblende oben
    front: [{ t: 'garage', x: -3, w: 2.4, h: 2.1, color: 0xc8a070, style: 'sectional' }, { t: 'garage', x: 0, w: 2.4, h: 2.1, color: 0xc8a070, style: 'sectional' },
            { t: 'garage', x: 3, w: 2.4, h: 2.1, color: 0xc8a070, style: 'sectional' }, { t: 'panel', x: 0, w: 9, y0: 2.3, y1: 'eave', color: 0xb8b0a4, boards: true }] },
  { c: [-1258.5, 667.9], wall: 0xe6dcc4, roof: 0x6a5a50, look: 'roller' },                                     // Doppelhaus creme/hellgrau, Gauben, braune Vordächer
  { c: [-1284.6, 644.2], wall: 0xf4f2ec, roof: 0x9a4a30, look: 'shutter', shutters: 0x6a4028 },                // langes weißes Haus, rotbraunes Dach mit Gauben, braune Läden
  { c: [-1285.8, 690.8], wall: 0xf0ede4, roof: 0x7a4a3a, look: 'small', skylights: 3, skylightSide: -1 },       // Nr. 26: langer weißer Altbau, graue Fenstergewände, 3 Dachfenster
  { c: [-1320.7, 705], wall: 0xe6c2ae, roof: 0x7a4a3a, look: 'roller' },                                       // lachsfarben, Giebel zur Straße (von weitem)
  // c:[-1317.6,665.2] bereits in Schloßstraße.js (Holz-Carport, aus der Nähe gesehen)
  { c: [-1330.8, 668.3], wall: 0xf2f0ea, roof: 0x5a5654, look: 'roller' },                                     // weiß (von weitem)
  { c: [-1340.2, 684.7], wall: 0xf2f0ea, roof: 0x6a4a3a, look: 'roller' },                                     // weiß mit Balkon (von weitem)
  { c: [-1365.7, 695.1], wall: 0xe8e6e0, roof: 0x5a5654, look: 'modern',                                       // im Umbau (Gerüst 2024): großes graues Sektionaltor, anthrazit Band
    front: [{ t: 'garage', x: 2, w: 5, h: 2.6, color: 0xc8ccd0, style: 'sectional' }, { t: 'panel', x: 0, w: 12, y0: 2.8, y1: 3.6, color: 0x3e4450 }] },
  { c: [-1354.4, 714.6], wall: 0xf4f4f0, roof: 0x7a4a3a, look: 'shutter', shutters: 0x5a3a24 },                // weiß, braune Läden
  { c: [-1339.6, 723.1], wall: 0x8a5a3a, roof: 0x6a4a3a, look: 'plain' },                                      // braunes Holz-Nebengebäude
  { c: [-1388.1, 730.7], wall: 0xd6d4ce, roof: 0x7a4a3a, look: 'small' },                                      // grauer Rauputz-Altbau, Rundbogenfenster im Giebel
  { c: [-1374.3, 722.9], wall: 0xf4f2ec, roof: 0x9a4a30, look: 'roller' },                                     // weiß, rotes Dach, Balkon
  { c: [-1385.4, 726.3], wall: 0x8a6a4a, roof: 0x6a4a3a, look: 'plain' },                                      // hölzerner Anbau/Unterstand
  { c: [-1459.9, 742.4], wall: 0xdcdcd8, roof: 0x6a6866, look: 'plain',                                        // hellgraue Halle mit weißem Rolltor
    front: [{ t: 'garage', x: 0, w: 3, h: 3, color: 0xe8e8e4, style: 'sectional' }] },
  { c: [-1485, 748.1], wall: 0xefe3a8, roof: 0x5e3a2e, look: 'roller', plinth: 0xc8705a,                       // Nr. 16 (K6347): hellgelb, Eiscafé mit Schaufenster + Markise
    front: [{ t: 'glazing', x: -0.5, w: 8, y0: 0, y1: 2.6, frame: 0x8a8a84 }, { t: 'awning', x: 0, w: 8, y: 2.7, d: 1.5, color: 0xe8e4dc }] },
  { c: [-1472.3, 748.6], wall: 0xefe3a8, roof: 0x5e3a2e, look: 'plain', eave: 5.5, pitch: 40, plinth: 0xc8705a, // Nebengebäude: Rundbogen-Holztore, OG braune Holzverschalung
    front: [{ t: 'door', x: -3, w: 2.5, h: 2.6, color: 0x8a5a34, boards: true }, { t: 'door', x: 0.5, w: 2.5, h: 2.6, color: 0x8a5a34, boards: true },
            { t: 'panel', x: 0, w: 10, y0: 2.8, y1: 'eave', color: 0x7a4a2a, boards: true }] },
  { c: [-1486.1, 723.6], wall: 0xc8c8c4, roof: 0x8a8a84, look: 'plain' },                                      // hellgraue Blechhalle
  { c: [-1531.2, 731.2], wall: 0xf2f0e8, roof: 0x8a4430, look: 'roller' },                                     // weiß, rotes Dach (von weitem)
  { c: [-1534.3, 771.9], wall: 0xeedfa8, roof: 0x6a4a3a, look: 'roller',                                       // Nr. 14: hellgelb, blauer Balkon, orange Holzverkleidung OG, türkises Garagentor
    front: [{ t: 'garage', x: -1, w: 2.5, h: 2.2, color: 0x3aa0b8, style: 'sectional' }, { t: 'balcony', x: -1, w: 7, y: 2.7, d: 1.2, rail: 'metal', color: 0x3a6ab8 },
            { t: 'panel', x: -1, w: 7, y0: 2.7, y1: 5.2, color: 0xb0602e, boards: true }] },
  { c: [-1554.3, 740.7], wall: 0xeeeae0, roof: 0x8a4430, look: 'roller' },                                     // cremeweiß, Gauben
  { c: [-1538.7, 736.8], wall: 0x6a3a2a, roof: 0x5e3a2e, look: 'plain' },                                      // dunkelbrauner Holzcarport
  { c: [-1584.4, 754.6], wall: 0xf6f6f4, roof: 0x4e4a48, look: 'modern',                                       // Nr. 5: Neubau weiß, anthrazit Fenster, PV-Dach
    front: [{ t: 'door', x: 3, w: 1.2, h: 2.2, color: 0x3e4448 }] },
  { c: [-1575.9, 750.8], wall: 0xf6f6f4, roof: 0x4e4a48, look: 'modern', eave: 6, pitch: 30, solar: true },     // Nr. 5 (zweite Hälfte, ohne LoD2)
  { c: [-1583.3, 766.9], wall: 0xb8bcc0, roof: 0x4e4a48, look: 'plain' },                                      // Metallcarport mit Lochblech
  { c: [-1575.6, 795.7], wall: 0xf4f2ee, roof: 0x7a3b2a, look: 'shutter', shutters: 0x4a3a30, skylights: 2 },  // weiß, dunkelbraune Läden, Gauben
  { c: [-1560.8, 799.5], wall: 0xe8e0cc, roof: 0x7a4a3a, look: 'plain',                                        // Garage/Nebengebäude, braunes Holztor
    front: [{ t: 'garage', x: 0, w: 2.6, h: 2.2, color: 0x7a4a2a, style: 'wood' }] },
  // nicht sichtbar: c:[-1138.5,602.2], c:[-1141.7,581.6], c:[-1142.4,591.6], c:[-1156.6,621.4], c:[-1190.9,557.7], c:[-1223.9,587.3],
  //   c:[-1252.7,697.2], c:[-1262.2,691.3], c:[-1258.6,701.4], c:[-1302.7,704.9], c:[-1293.2,708.5], c:[-1297.9,698.7], c:[-1372.4,681.3],
  //   c:[-1381.5,702.8], c:[-1388.7,690.7], c:[-1378,686.2], c:[-1380.8,696.7], c:[-1348,726.5], c:[-1364.5,723.3], c:[-1393.2,726],
  //   c:[-1443.9,699.5], c:[-1501.1,757.2], c:[-1502.5,752.6], c:[-1488.9,756.3], c:[-1479.5,756.9], c:[-1483.3,767.8], c:[-1533.8,728],
  //   c:[-1553.6,732.5], c:[-1560.4,728.1], c:[-1563.5,743.4], c:[-1581,746.8], c:[-1553.2,778.9], c:[-1543.4,780.8], c:[-1593.2,811.3],
  //   c:[-1585.3,820.5], c:[-1580,816.1]
  // ===== Dürrenmatten (Rheinweiler) =====
  // Google-Auto Apr 2022, vollständige Abdeckung.
  { c: [-1258.7, 784.3], wall: 0xefe9d8, roof: 0x5e3a2e, look: 'modern', face: 'W',                         // Nr. 8: weiß/cremefarben, dunkelbrauner Holzbalkon
    front: [{ t: 'balcony', x: -1.5, w: 3.5, y: 2.7, d: 1.3, rail: 'wood', color: 0x5a3a28 }] },
  { c: [-1282, 786.7], wall: 0xf2f0ea, roof: 0x5e3a2e, look: 'modern' },                                      // weißes Haus, dunkelbraunes Dach, Natursteinmauer davor
  { c: [-1254.4, 817.5], wall: 0xf4f4f2, roof: 0x6a6866, look: 'modern', face: 'W',                         // Nr. 4: weiß, graues Dach, Terrasse + Giebelbalkon mit Lochblechgeländer
    front: [{ t: 'balcony', x: 0, w: 9, y: 2.6, d: 1.5, rail: 'perforated', color: 0xc8ccce },
            { t: 'balcony', x: -0.6, w: 4, y: 5.2, d: 1.0, rail: 'perforated', color: 0xc8ccce }] },
  { c: [-1259, 825.1], wall: 0xeeeeea, roof: 0x8a8a84, look: 'plain' },                                       // Flachdach-Carport (weiß)
  { c: [-1290.5, 820], wall: 0xf0dcc4, roof: 0x8a5040, look: 'roller', plinth: 0xdcc4b0 },                    // apricot-cremefarbenes Giebelhaus, rotbraunes Dach
  { c: [-1286.4, 830.2], wall: 0xf0dcc4, roof: 0x8a5040, look: 'roller', face: 'E',                           // Anbau dazu mit Holz-Vorbau/Terrasse
    front: [{ t: 'balcony', x: 2, w: 3, y: 1.0, d: 1.5, rail: 'wood', color: 0xc89a5a, posts: true }] },
  { c: [-1288.2, 803.8], wall: 0xf4f4f2, roof: 0x9a4a32, look: 'roller', plinth: 0x9a9a96 },                  // weiß, rotes Ziegeldach, weiße Rollläden, grauer Sockel
  { c: [-1286.6, 798.3], wall: 0xf4f4f2, roof: 0x9a4a32, look: 'roller', plinth: 0x9a9a96 },                  // dto. (in Street View verpixelt)
  { c: [-1275.4, 888.3], wall: 0xeceac8, roof: 0x55524f, look: 'modern', plinth: 0xd9c3c6, face: 'E',         // Nr. 10: oben blass gelbgrün, EG altrosa, Holzbalkon, Markise
    front: [{ t: 'balcony', x: -4, w: 2.5, y: 2.7, d: 1.2, rail: 'wood', color: 0x6a4430 }] },
  { c: [-1246.3, 890.5], wall: 0xf2f2ee, roof: 0x5e4a40, look: 'roller' },                                    // weiß, dunkles Dach mit Dachfenstern (hinter Hecke, nur Giebel sichtbar)
  { c: [-1281.9, 944.1], wall: 0x5e4e40, roof: 0x4e4a48, look: 'plain', face: 'E',                           // Feldscheune aus verwittertem Holz
    front: [{ t: 'panel', x: 0, w: 20, y0: 0, y1: 'eave', color: 0x5e4e40, boards: true }] },
  // nicht sichtbar: c:[-1291.9,827.2] (11 m², verdeckt)
  // ===== Friedhofstraße (Rheinweiler) – Street View Apr 2022 =====
  { c: [-1138.4, 726.1], wall: 0xf0dc84, roof: 0x8a4a36, look: 'shutter', shutters: 0x2f4a3a,                    // Nr. 6, Elektro-Betrieb: Westteil weiß mit dunkelgrünen Läden + Schaufenster, Ostteil gelb
    front: [{ t: 'panel', x: -5, w: 9, y0: 0, y1: 'eave', color: 0xf3f2ee, ground: true, face: 'W' },
            { t: 'glazing', x: 3, w: 4, y0: 0.3, y1: 2.4, frame: 0xd8d8d4, face: 'W' }] },
  { c: [-1122.6, 724.6], wall: 0xeceae4, roof: 0x8a4a36, look: 'small',                                          // weiß verputzt, Giebelspitze Ziegel/Holz, graues Garagentor
    front: [{ t: 'garage', x: -2, w: 2.4, h: 2.3, color: 0xb8b8b4, style: 'sectional' }] },
  { c: [-1129.4, 728.5], wall: 0xeceae4, roof: 0x6a6866, look: 'plain', eave: 3, pitch: 5 },                     // kleiner weißer Flachdachanbau mit Tür
  { c: [-1118.8, 732.6], wall: 0xd6cbb8, roof: 0x5e5a56, look: 'modern', plinth: 0x8a8680,                      // modern: taupe Putz, grauer Sockel, offene Garagen im EG, PV
    front: [{ t: 'garage', x: -2.5, w: 2.8, h: 2.4, color: 0x4a4a48 }, { t: 'garage', x: 1.5, w: 3.5, h: 2.4, color: 0x4a4a48 }] },
  { c: [-1096.1, 718.1], wall: 0xf2f2ee, roof: 0x9a4a36, look: 'roller' },                                        // weiß, rotbraunes Dach
  { c: [-1100.9, 720.6], wall: 0xf2f2ee, roof: 0x9a4a36, look: 'roller',                                          // weißer Garagenbau mit Wohnung, weißes Tor, Holz-Carport daneben
    front: [{ t: 'garage', x: 0, w: 2.5, h: 2.2, color: 0xf0f0ec, style: 'sectional' }] },
  { c: [-1077.7, 746.4], wall: 0xf0f0ec, roof: 0x6a6866, look: 'plain' },                                        // weißer Trafoturm
  { c: [-1069.3, 766], wall: 0xf4f4f2, roof: 0x4a4a4a, look: 'modern', plinth: 0x5e6268,                         // Nr. 8: Neubau weiß, anthrazit Sockelgeschoss, Glasbalkon
    front: [{ t: 'balcony', x: 1, w: 8, y: 2.7, d: 1.5, rail: 'glass' },
            { t: 'garage', x: 2, w: 2.5, h: 2.2, color: 0xf0f0ec, style: 'sectional' }] },
  { c: [-1099.6, 779.3], wall: 0xf2f0ea, roof: 0x9a4a36, look: 'roller', eave: 8.5, pitch: 40,                   // weißes Mehrfamilienhaus mit Balkonen (von weitem)
    front: [{ t: 'balcony', x: 0, w: 6, y: 2.7, d: 1.2, rail: 'metal', color: 0xf0f0ec }] },
  { c: [-1089, 771.9], wall: 0xf2f0ea, roof: 0x9a4a36, look: 'roller' },                                          // weißes Haus mit Holzbalkon (von weitem)
  { c: [-1102.9, 770], wall: 0xf0f0ec, roof: 0x6a6866, look: 'plain',                                             // weiße Doppelgarage
    front: [{ t: 'garage', x: -1.4, w: 2.4, h: 2.1, color: 0xf0f0ec, style: 'sectional' }, { t: 'garage', x: 1.4, w: 2.4, h: 2.1, color: 0xf0f0ec, style: 'sectional' }] },
  { c: [-1127.6, 752.3], wall: 0xf0eee8, roof: 0x8a4a36, look: 'roller' },                                        // weiß, rotbraunes Dach (von weitem)
  { c: [-1049, 763.6], wall: 0xe8e2d6, roof: 0x8a4a36, look: 'plain', eave: 3.2, pitch: 40,                      // Friedhofshalle mit Glockentürmchen, Sandsteinpfeiler, rotbraune Holzgiebel
    front: [{ t: 'panel', x: 0, w: 6, y0: 3.2, y1: 'eave', color: 0x6a2e26, boards: true }] },
  { c: [-1051.1, 768.1], wall: 0xe8e2d6, roof: 0x8a4a36, look: 'plain' },                                         // Anbau Friedhofshalle
  { c: [-1032.6, 806.9], wall: 0xd6cf82, roof: 0x6a3a2e, look: 'modern', plinth: 0xa8403a,                       // Nr. 25: gelbgrüner Giebel, weiße Traufseite, rotes Sockelgeschoss, Holzvorbau
    front: [{ t: 'porch', x: -2, w: 3, d: 2, h: 2.6, color: 0x6a4a36 }] },
  { c: [-1060.8, 808.2], wall: 0xf4f4f2, roof: 0x6a6866, look: 'plain',                                           // weißer Flachdach-Garagenanbau (Nachbarhaus verpixelt)
    front: [{ t: 'garage', x: 0, w: 2.5, h: 2.2, color: 0xc8c8c4, style: 'sectional' }] },
  { c: [-1051.8, 842.1], wall: 0xf0f0ec, roof: 0x4e4a48, look: 'roller',                                          // weiß, anthrazit Balkon mit Markise (teilw. verpixelt)
    front: [{ t: 'balcony', x: 0, w: 5, y: 2.7, d: 1.2, rail: 'metal', color: 0x4a4e54 }] },
  // nicht sichtbar: c:[-1129.7,764.8], c:[-1139.4,741.7], c:[-1058.8,851.3], c:[-1049.3,854.3], c:[-1058.1,861.9], c:[-1059.1,855.5],
  //   c:[-1066.2,858.6], c:[-1090.4,782.9], c:[-1143.3,732.5] (Hinterhof/verdeckt; Abschnitt 1 hat kein eigenes Panorama)
  // ===== Gutedelweg =====
  // Neubaugebiet. Keine Google-Street-View-Abdeckung; nur 2 Nutzer-Panoramen "N." (Aufnahme Jul 2024) am Südende.
  // Zum Aufnahmezeitpunkt Baustelle: kubische Flachdach-Reihenhäuser, weiß verputzt, anthrazit Fenster, teils noch eingerüstet.
  { c: [-1551.9, 981], wall: 0xf2f2f0, roof: 0x6a6866, look: 'modern' },                                           // Reihenhaus weiß, anthrazit Fenster (2024 eingerüstet)
  { c: [-1549.6, 968.1], wall: 0xf2f2f0, roof: 0x6a6866, look: 'modern' },                                         // Reihenhaus weiß, anthrazit Fenster
  { c: [-1570.4, 960.6], wall: 0xf2f2f0, roof: 0x6a6866, look: 'modern' },                                         // Reihenhaus weiß, anthrazit Fenster mit dunklen Laibungen
  { c: [-1549.1, 932.5], wall: 0xf0f0ee, roof: 0x6a6866, look: 'modern' },                                         // Reihe am Nordende: weiß, dunkle Fenster (entfernt, ~55 m)
  { c: [-1543, 935.3], wall: 0xf0f0ee, roof: 0x6a6866, look: 'modern' },                                           // dito
  { c: [-1529.7, 941.6], wall: 0xf0f0ee, roof: 0x6a6866, look: 'modern' },                                         // dito
  { c: [-1523.7, 944.4], wall: 0xf0f0ee, roof: 0x6a6866, look: 'modern' },                                         // dito
  { c: [-1516.2, 972.1], wall: 0xc4c2bc, roof: 0x6a6866, look: 'modern', eave: 6.2, pitch: 3 },                     // Rohbau/Grundputz hellgrau, Flachdach, dunkle Fenster (Endfarbe 2024 noch offen)
  { c: [-1514.4, 966.5], wall: 0xc4c2bc, roof: 0x6a6866, look: 'modern', eave: 6.2, pitch: 3 },                     // dito, Nachbarbau
  // nicht sichtbar (verdeckt/zu weit): c:[-1507.6,945.5], c:[-1548.1,962.6], c:[-1568.7,955.1]
  // ===== Huxmattenweg =====
  // Keine Street-View-Abdeckung im Huxmattenweg selbst (Panoramen springen auf die Bamlacher Str. jenseits der Bahn-Lärmschutzwand).
  // Nur das Südwestende ist vom Panorama "Bamlacher Str. 5" (Apr 2022) aus sichtbar.
  { c: [-1147.6, 644.3], wall: 0xf2f0ea, roof: 0xb0503a, look: 'plain', face: 'E',                                 // Scheune: weiß, leuchtend rotes Ziegeldach, braunes Brettertor, Holzlaube
    front: [{ t: 'door', x: 1.5, w: 3.0, h: 3.0, color: 0x6a4a32, boards: true },
            { t: 'panel', x: -4, w: 3, y0: 0, y1: 'eave', color: 0x7a5a3a, boards: true, ground: true }] },
  { c: [-1138.3, 652.7], wall: 0xf0f0ee, roof: 0x8a8a88, look: 'plain' },                                         // weißer Flachdach-Carport an der Scheune
  { c: [-1114.5, 633.7], wall: 0xf4f2ee, roof: 0x4e4a48, look: 'shutter', shutters: 0xc0302a },                    // weißes Giebelhaus, knallrote Läden, PV
  // nicht sichtbar (keine Abdeckung): c:[-936.8,443.1], c:[-986.9,510], c:[-1140.4,640.2], c:[-1129.5,621.4], c:[-1113.7,589.6], c:[-1073.3,579.2],
  //   c:[-947.9,461.8], c:[-1133.1,597], c:[-980.1,503.8], c:[-1035.6,556.8], c:[-1020.3,557.3], c:[-1074.8,613.9], c:[-1101.9,600.7],
  //   c:[-1069.1,604.3], c:[-1124.9,583.3], c:[-1086.5,596.6], c:[-1101.9,609.7], c:[-1099.3,572.8], c:[-1081,567.1], c:[-994.4,518.9],
  //   c:[-952.5,477.4], c:[-1099.7,618.3], c:[-957.8,482.5], c:[-1009.9,533.7], c:[-1090.4,577.5], c:[-1030.3,535.8], c:[-1040.7,558.6],
  //   c:[-948.9,470.8], c:[-1007.1,522.4], c:[-1129.2,641.5], c:[-1105.6,579.2], c:[-1052.5,562.7]
  // ===== Im Altstück =====
  // Abdeckung: nur Nutzer-Photospheres ("N.", Sep–Nov 2024), kein Google-Auto. Die Dez-2024-Sequenz entlang der Schleife ist
  // falsch verortet/ausgerichtet (Bilder zeigen offensichtlich andere Straßen, rote Dächer statt der dunklen Dächer im Luftbild)
  // → nur Häuser erfasst, die von korrekt verorteten Panos (Einmündung Vogesenstraße, Fußweg Im Rebgärtle) sicher zuzuordnen sind.
  // Hausnummern aus Google-Maps-Luftbild.
  { c: [74.3, -305.6], wall: 0xf1e5b5, roof: 0x7a3b2a, look: 'roller', face: 'E',                       // Doppelhaus an der Einmündung: blassgelb, Gauben grau verkleidet
    front: [{ t: 'garage', x: -6, w: 2.6, h: 2.2, color: 0x5a3a28, style: 'wood' }] },
  { c: [89.1, -331.9], wall: 0xf0e6c4, roof: 0x4e4a48, look: 'roller' },                                 // Nr. 3: cremeweiß, dunkles Dach mit PV (aus 40 m)
  { c: [117.2, -318.3], wall: 0xf4f4f0, roof: 0x4e4a48, look: 'roller' },                                // Nr. 2: weiß, anthrazit Dach mit PV
  { c: [106.1, -388.4], wall: 0x3c7bd0, roof: 0x8a4430, look: 'roller', plinth: 0x2f5fa8, face: 'W',     // Nr. 7: kräftig blau, weiße Rollläden, rotes Dach mit PV
    front: [{ t: 'balcony', x: 0, w: 9, y: 2.7, d: 1.6, rail: 'metal', color: 0xf0f0ea }] },
  { c: [121.8, -403.5], wall: 0xf4f4f0, roof: 0x55524f, look: 'roller', face: 'W',                       // Nr. 9: weiß, graues Dach, Balkon am Giebel
    front: [{ t: 'balcony', x: 0, w: 4, y: 2.7, d: 1.4, rail: 'metal', color: 0x4a4a4a }] },
  { c: [165.9, -429.8], wall: 0xf0e2b0, roof: 0x4e4a48, look: 'roller' },                                  // Nr. 13 (mittlere Sicherheit): blassgelb, Giebel zur Straße, dunkles Dach
  { c: [170.1, -421.5], wall: 0xf0f0ea, roof: 0x4e4a48, look: 'plain' },                                    // Carport von Nr. 13, weiße Pfosten
  // nicht sichtbar / nicht sicher zuzuordnen: c:[103.2,-369.2] (Nr. 5), c:[203.9,-383.7] (Nr. 19), c:[103,-303.4], c:[144.6,-282.3],
  //   c:[139.6,-264.4], c:[96.7,-349.7], c:[91.6,-339.8], c:[159.6,-370.1] (Nr. 12), c:[152.6,-356.3] (Nr. 14), c:[123,-339.1] (Nr. 4),
  //   c:[146.7,-388.9] (Nr. 8), c:[134.6,-437.8], c:[124.9,-432.5] (Nr. 26), c:[199.9,-419.1], c:[185.9,-421] (Nr. 15),
  //   c:[130.4,-368.9] (Nr. 6), c:[147.7,-279], c:[128.7,-360.9], c:[141.7,-273],
  //   c:[213.5,-398.2] (Nr. 17), c:[171,-387.1] (Nr. 10), c:[171.8,-315] (Fewo Wisser), c:[131.6,-312.8] (Nr. 20),
  //   c:[147.8,-333.5] (Nr. 16), c:[146.1,-419] (Nr. 11), c:[193.3,-361], c:[184.8,-340.2], c:[165.2,-327.6], c:[172.5,-323.8] (Nr. 25),
  //   c:[87.3,-324.5], c:[85.3,-321.3], c:[140.1,-258.1], c:[215.3,-392.5], c:[201.6,-377.4], c:[188.5,-403.4], c:[109.9,-312.4],
  //   c:[169.7,-378.9], c:[154.8,-276.2], c:[164,-361], c:[161.5,-357.1], c:[125.9,-309.8], c:[129.7,-410], c:[189.6,-345], c:[133.9,-411.7]
  // ===== Im Grund =====
  // Keine Google-Auto-Aufnahmen; nur Nutzer-Photospheres (Aug 2024, bewölkt)
  { c: [-282.6, -526], wall: 0x5e4434, roof: 0x4e4a48, look: 'plain',                                              // lange braune Holzbaracke, flaches Pultdach
    front: [{ t: 'panel', x: 0, w: 14, y0: 0, y1: 'eave', color: 0x5e4434, boards: true, ground: true }] },
  { c: [-298.3, -510.2], wall: 0x5a8a6a, roof: 0x4e4a48, look: 'plain' },                                          // grün gestrichene Holzhütte (aus der Ferne)
  { c: [-259.3, -563.8], wall: 0x9a9890, roof: 0x6a5a50, look: 'plain' },                                          // Betonflachbau
  // nicht sichtbar: c:[-363.8,-489.9] (hinter Hecke), c:[-533.4,-336.1], c:[-563.9,-355.8] (h1.0, Becken/Plattformen), c:[-493.9,-290.2], c:[-598.7,-346]
  // ===== Im Kirschgarten (Bamlach) – Google-Auto nur an der Einmündung Alte Weinstraße (Apr 2022), sonst Nutzer-Photospheres „N.“ (Sep/Dez 2024) =====
  { c: [-240.9, 94], wall: 0xf2ede0, roof: 0x7a4a36, look: 'shutter', shutters: 0xa8aaa6, plinth: 0xcfc4ae, eave: 6, pitch: 45,   // weiß, Läden 2024 hellgrau (2022 noch braun), Rundbogen-Holztor, Terrasse mit Holzzaun
    front: [{ t: 'door', x: -3, w: 1.6, h: 2.2, color: 0x5a3a26, boards: true }] },
  { c: [-262.8, 88.5], wall: 0xf2f2ee, roof: 0x4e4a48, look: 'roller',                                                          // „Kallmann“: weiß, Gauben, graues Garagentor, kleiner Holzbalkon
    front: [{ t: 'garage', x: -2, w: 2.5, h: 2.2, color: 0x7a7c80, style: 'sectional' }] },
  { c: [-282.1, 74.8], wall: 0xefede6, roof: 0x5a3e32, look: 'roller' },                                                        // weiß, weiße Rollläden
  { c: [-236.9, 70.6], wall: 0xf0efea, roof: 0x4e4a48, look: 'roller' },                                                        // weißes Haus, dunkles Dach
  { c: [-250.7, 67.1], wall: 0xd8d8d4, roof: 0x6a6866, look: 'plain' },                                                         // Holzlege/Carport, grauer Putz
  { c: [-251.1, 55.7], wall: 0xece2c8, roof: 0x4e4a48, look: 'roller' },                                                        // hell beige, Gauben, PV
  { c: [-264.1, 50.4], wall: 0xeeeae0, roof: 0x7a4a36, look: 'roller' },                                                        // weiß-creme
  { c: [-241, 65.2], wall: 0xf2f2f0, roof: 0x4e4a48, look: 'modern', plinth: 0x6e7278,                                          // modern saniert: weiß, EG/Sockel anthrazit-graublau, graue Fensterrahmen
    front: [{ t: 'panel', x: 0, w: 10, y0: 0, y1: 2.6, color: 0x6e7278, ground: true }] },
  { c: [-274.6, 36.1], wall: 0xf2eee2, roof: 0x5e3a2e, look: 'roller', plinth: 0xe8c8a8,                                        // weiß, gelber Holzbalkon mit Markise, lachsfarbener Sockel
    front: [{ t: 'balcony', x: 0, w: 4, y: 2.7, d: 1.5, rail: 'wood', color: 0xd4b440 },
            { t: 'awning', x: 0, w: 4, y: 5.0, d: 1.2, color: 0x8a8a84 }] },
  { c: [-273.2, 50.6], wall: 0xf2f0ea, roof: 0x7a4a36, look: 'plain',                                                           // weißes Nebengebäude, braunes Holz-Garagentor
    front: [{ t: 'garage', x: 2, w: 2.5, h: 2.2, color: 0x7a4a30, style: 'wood' },
            { t: 'door', x: -1.5, w: 1.0, h: 2.0, color: 0x7a4a30 }] },
  { c: [-383.9, -4.9], wall: 0xf0eee6, roof: 0x4e4a48, look: 'small' },                                                         // großes weißes Gebäude (Hof), dunkles Dach mit PV
  { c: [-351.7, 24.6], wall: 0xf0f0ec, roof: 0x6a6866, look: 'plain' },                                                         // weiße Flachdachgarage
  // nicht sichtbar: c:[-300.4,81.7], c:[-295.5,95.4], c:[-285.3,82.9], c:[-290.2,68], c:[-252.9,88.8], c:[-228,65.1],
  //   c:[-264.2,34.2], c:[-280.3,21.9], c:[-244.8,51.1], c:[-356.4,-0.5], c:[-340.7,13.8], c:[-344.2,20.8],
  //   c:[-239.8,50.5], c:[-260.2,77.6], c:[-242.3,47.6] (Gärten/Hinterhof; Photosphere-Ausrichtung teils unsicher)
  // ===== Im Rebgärtle =====
  // Google-Auto Apr 2022 (Nr. 2–15 und Stichstraße Nr. 14); Südende und Nordteil nur Nutzer-Photospheres (Nov/Dez 2024)
  { c: [-18.4, -226.8], wall: 0xf2f0ea, roof: 0x8a4430, look: 'modern', eave: 5.0, pitch: 40,                       // weiß, große Holz-Glasfront im OG
    front: [{ t: 'glazing', x: 0, w: 3.5, y0: 2.8, y1: 4.8, frame: 0x6a4a30 }] },
  { c: [-9.1, -228.4], wall: 0xf0eee6, roof: 0x6e3a2e, look: 'roller' },                                            // weiß, Balkon, PV
  { c: [-60.4, -241.7], wall: 0xf0eeea, roof: 0x4e4a48, look: 'shutter', shutters: 0xc8a880, plinth: 0xd4a48c,     // weiß, hellholzfarbene Läden, lachsfarbener Sockel; angebaute dunkle Holzscheune
    front: [{ t: 'panel', x: -4, w: 5, y0: 0, y1: 'eave', color: 0x4a3a2e, boards: true, ground: true }] },
  { c: [-73.3, -273.3], wall: 0xf4f2ee, roof: 0x7a4a3a, look: 'roller',                                            // weißes Mehrfamilienhaus, Holzbalkone am Giebel
    front: [{ t: 'balcony', x: 0, w: 5, y: 2.7, d: 1.3, rail: 'wood', color: 0x8a5a3a }] },
  { c: [-83.2, -233.5], wall: 0x6a5040, roof: 0x8a4a35, look: 'plain' },                                            // dunkler Holzschuppen
  { c: [-88.8, -226.9], wall: 0xf0ece2, roof: 0x7a4a3a, look: 'shutter', shutters: 0xb08060 },                       // Nr. 5: weiß, hellbraune Läden, Terrasse über Garage
  { c: [-97, -221.9], wall: 0xe8e6e0, roof: 0x6a6866, look: 'plain' },                                              // Garage unter Terrasse, Glasbausteine
  { c: [-91.3, -249.7], wall: 0x5a4636, roof: 0x9a4a35, look: 'plain' },                                            // dunkler Holzschuppen/Carport
  { c: [-107.6, -244.9], wall: 0xd9cba8, roof: 0x9a4a30, look: 'small',                                             // Holzbetrieb: beiger Putz, großes Ziegeldach, Holzstapel, Sprossentüren
    front: [{ t: 'glazing', x: 0, w: 2.2, y0: 0, y1: 2.6, frame: 0xf0f0ea }, { t: 'panel', x: 0, w: 14, y0: 3.0, y1: 'eave', color: 0x7a5a3a, boards: true }] },
  { c: [-124, -228.1], wall: 0xeee4cc, roof: 0x9a4a30, look: 'small',                                               // Nr. 3: beiger Altbau, Sandsteingewände, braunes Holztor rechts
    front: [{ t: 'door', x: 5, w: 3, h: 3, color: 0x5a3e2a, boards: true }] },
  { c: [-103, -169.6], wall: 0x5a86c8, roof: 0xb0503a, look: 'small' },                                            // kräftig blau verputzt, rotes Ziegeldach, weiße Fenster
  { c: [-48, -270.7], wall: 0x8a6a48, roof: 0x9a4a35, look: 'plain' },                                              // Gartenhaus aus Holz
  { c: [-55.6, -290.8], wall: 0xf4f2ee, roof: 0x9a4a35, look: 'roller',                                             // Nr. 7: weiß, weißer Balkon
    front: [{ t: 'balcony', x: 0, w: 5, y: 2.7, d: 1.5, rail: 'metal', color: 0xf2f2ee }] },
  { c: [-43.5, -286.3], wall: 0xf4f2ee, roof: 0x9a4a35, look: 'plain', face: 'E',                                   // weißer Nebenbau, Holztor
    front: [{ t: 'garage', x: 0, w: 2.5, h: 2.3, color: 0x9a6a40, style: 'wood' }] },
  { c: [-40.1, -280.7], wall: 0xe8e2d4, roof: 0x9a4a35, look: 'plain' },                                            // offener Carport, Ziegeldach
  { c: [-26.6, -246.6], wall: 0xf2f0ea, roof: 0x5e4a40, look: 'modern' },                                           // weiß, braune Holzblende, große Fenster
  { c: [-22.4, -253.9], wall: 0xf2f0ea, roof: 0x5e4a40, look: 'plain', face: 'W',                                   // Doppelgarage, Holzterrasse darüber
    front: [{ t: 'garage', x: -1.3, w: 2.2, h: 2.1, color: 0x6a4030, style: 'sectional' }, { t: 'garage', x: 1.3, w: 2.2, h: 2.1, color: 0x6a4030, style: 'sectional' }] },
  { c: [-18.9, -264.4], wall: 0xf2f0ea, roof: 0x8a5a40, look: 'plain', face: 'W',                                   // Scheune: weiß/dunkles Holz, Wagenräder
    front: [{ t: 'panel', x: 0, w: 10, y0: 0, y1: 'eave', color: 0x4e3a2c, boards: true, ground: true }] },
  { c: [-14.1, -283.1], wall: 0xf4f2ee, roof: 0x9a4a35, look: 'shutter', shutters: 0x6e7074 },                      // Nr. 8: weißer Altbau, graue Läden, Holzfenster
  { c: [-45.8, -316.3], wall: 0xf2f0e8, roof: 0x5e4a40, look: 'roller',                                             // weiß, brauner Balkon (aus der Ferne)
    front: [{ t: 'balcony', x: 0, w: 4, y: 2.7, d: 1.2, rail: 'wood', color: 0x7a4a30 }] },
  { c: [-24.3, -295.5], wall: 0xf0eee6, roof: 0x9a5a40, look: 'plain', face: 120,                                   // Nr. 10: Scheune, links weißer Putz mit Holztür, rechts dunkle Bretter
    front: [{ t: 'panel', x: 1.5, w: 7, y0: 0, y1: 'eave', color: 0x4a3426, boards: true, ground: true },
            { t: 'door', x: -4, w: 2.4, h: 2.5, color: 0x5a3e2a, boards: true }] },
  { c: [-16, -309.7], wall: 0xb8b0a0, roof: 0x8a5a40, look: 'plain', face: 120,                                     // alte Garage: Betonsteine, rotbraune Holzverschalung, Tor
    front: [{ t: 'panel', x: 2.5, w: 4, y0: 0, y1: 'eave', color: 0x7a3a28, boards: true, ground: true },
            { t: 'garage', x: 2.5, w: 2.4, h: 2.2, color: 0x6a2e22, style: 'wood' }] },
  { c: [8.2, -304.3], wall: 0xf4f2ee, roof: 0x6a6866, look: 'roller', eave: 3.0, pitch: 5 },                         // Sockelbau am Mehrfamilienhaus
  { c: [0.3, -298], wall: 0xd8d6d0, roof: 0x6a6866, look: 'plain',                                                 // Garage, braunes Tor
    front: [{ t: 'garage', x: 0, w: 2.4, h: 2.1, color: 0x6a5040, style: 'sectional' }] },
  { c: [1.4, -344.6], wall: 0xf0e6b0, roof: 0x4e4a48, look: 'roller' },                                            // Nr. 15: hellgelb, PV, Carport
  { c: [7.6, -349.6], wall: 0xf0f0ee, roof: 0x8a8a88, look: 'plain' },                                              // Carport, weiße Stützen
  { c: [-8.4, -371], wall: 0xf2f0ea, roof: 0x5e4a40, look: 'roller' },                                              // weiß (aus der Ferne)
  { c: [1.3, -369.2], wall: 0xf2f0ea, roof: 0x6a6866, look: 'plain',                                                // Flachdachgarage
    front: [{ t: 'garage', x: 0, w: 2.5, h: 2.2, color: 0x4e4e50, style: 'sectional' }] },
  { c: [37, -344.5], wall: 0xbcc6d0, roof: 0x9a4a30, look: 'roller',                                                // blaugrau verputzt, Holzbalkon
    front: [{ t: 'balcony', x: 0, w: 4, y: 2.7, d: 1.3, rail: 'wood', color: 0x6a4a30 }] },
  { c: [48.9, -346], wall: 0xf2f0ea, roof: 0x9a4a30, look: 'plain' },                                               // weißer Anbau
  { c: [59, -366.4], wall: 0xf3eedf, roof: 0xb05a3a, look: 'roller',                                                // Nr. 14: cremeweiß, orangerotes Dach, Arkaden-Loggia im EG
    front: [{ t: 'porch', x: 0, w: 8, d: 2.5, h: 2.8, color: 0xf3eedf }] },
  { c: [49.8, -370.3], wall: 0xf0eeea, roof: 0xb05a3a, look: 'plain' },                                              // Gartenmauer mit Ziegelabdeckung
  { c: [68.7, -383.3], wall: 0xf0e6b8, roof: 0x4e4a48, look: 'roller',                                             // hellgelb, weißer Balkon
    front: [{ t: 'balcony', x: 0, w: 5, y: 2.7, d: 1.5, rail: 'metal', color: 0xf2f2ee }] },
  { c: [71.4, -348.8], wall: 0xf2f0ea, roof: 0x4e4a48, look: 'roller' },                    // weiß, dunkles Dach (aus der Ferne)
  { c: [77.9, -359], wall: 0xf2f0ea, roof: 0x6a6866, look: 'plain',                          // Flachdachgarage
    front: [{ t: 'garage', x: 0, w: 2.5, h: 2.2, color: 0xf2f2ee, style: 'sectional' }] },
  { c: [85.1, -401.9], wall: 0xf4f2ee, roof: 0xa04030, look: 'roller' },                                           // weiß, rotes Dach, PV
  { c: [97.4, -421.3], wall: 0xdcdcda, roof: 0x4e4a48, look: 'modern', plinth: 0x6a6c70 },                          // modern, grau/weiß
  { c: [103.2, -443.7], wall: 0xf2f0ea, roof: 0x4e4a48, look: 'roller' },                                           // weiß, anthrazit Dach
  { c: [117.1, -469.3], wall: 0xf4f4f2, roof: 0x4e4a48, look: 'modern',                                             // weißer Neubau, Walmdach, Glasbalkon
    front: [{ t: 'balcony', x: 0, w: 6, y: 2.7, d: 1.8, rail: 'glass' }] },
  // nicht sichtbar: c:[-56.8,-228], c:[-95.1,-241.9], c:[-13.4,-268.3], c:[-8.6,-278.7], c:[-4,-280.3], c:[-1.1,-293.7], c:[3.9,-295.3], c:[-3.9,-296.1],
  //   c:[-32.2,-307.9], c:[-29.5,-321.4], c:[-36.5,-320.4], c:[-23.9,-318.8], c:[-28.2,-322.3], c:[-32.8,-326], c:[-11.9,-334], c:[-7.1,-336.3],
  //   c:[-15.7,-346.9], c:[-23.2,-351.3], c:[32.3,-388], c:[80.3,-376.5], c:[87.9,-392.8], c:[106.2,-421.9], c:[101.6,-452.6]
  // ===== Im Steingässle ===== (Rheinweiler; Gasse selbst ohne Street View, Häuser von der Friedhofstraße aus gesehen, Apr 2022)
  { c: [-1073.9, 730.3], wall: 0xf2c58e, roof: 0xa04a30, look: 'modern',                                              // apricot/orange verputzt, Terrasse mit Glasgeländer über Garage
    front: [{ t: 'balcony', face: 'W', x: 0, w: 8, y: 2.7, d: 2, rail: 'glass', color: 0xf0f0ec },
            { t: 'garage', face: 'W', x: -3, w: 2.5, h: 2.1, color: 0xf0f0ec, style: 'sectional' }] },
  { c: [-1051.7, 717.9], wall: 0xf3f2ee, roof: 0x4e4a48, look: 'modern' },                                            // weiß, dunkles Dach mit PV (aus ~30 m)
  { c: [-1061.7, 697.8], wall: 0xf2f0ea, roof: 0xa04a30, look: 'modern' },                                            // weiß, rotes Ziegeldach (aus ~50 m)
  { c: [-1035.4, 705.6], wall: 0xeceae4, roof: 0x5a5654, look: 'modern' },                                            // weißgrau, dunkles Dach mit PV (aus ~50 m)
  // nicht sichtbar: c:[-1031.8,683.9], c:[-1026.1,700], c:[-1078.7,707.5], c:[-1054.7,700.4], c:[-1017.7,696.1], c:[-1048.7,690.1],
  //   c:[-1041.2,684.8], c:[-1016.2,715.1], c:[-1072,709.9]
  // ===== Kapellenweg =====
  // Quelle: Nutzer-360°-Panoramen (Radfahrer "N."), Aufnahme Sep 2024 (Karte zeigt Dez 2024). Keine Google-Car-Abdeckung.
  // Hausnummern auf den Nutzerpanoramen kaum lesbar -> Beschreibung statt Nummer, wo unbekannt.
  { c: [37.3, 23], wall: 0xeeeeea, roof: 0x5e3a2e, look: 'modern',                                             // Vereins-/Gemeindehaus am Anfang: weiß, dunkler Holzgiebel über Eingang
    front: [{ t: 'porch', x: 1, w: 5, d: 2, h: 2.8, color: 0x5a3e2c }] },
  { c: [49, -4.1], wall: 0xf4f3ee, roof: 0x4e4a48, look: 'roller', skylights: 2 },                              // weiß, anthrazit Dach, 2 Dachfenster
  { c: [53.3, -15.1], wall: 0xf4f3ee, roof: 0x4e4a48, look: 'plain',                                            // Garage zu 49,-4.1: anthrazit Sektionaltor
    front: [{ t: 'garage', x: 0, w: 2.6, h: 2.3, color: 0x4a4a48, style: 'sectional' }] },
  { c: [54.3, -32.4], wall: 0xeccfc0, roof: 0x8a4430, look: 'roller',                                           // lachsrosa Mehrfamilienhaus mit Balkonen + Doppelgarage anthrazit, PV auf Carport
    front: [{ t: 'garage', x: -6, w: 2.6, h: 2.3, color: 0x4a4a48, style: 'sectional' }, { t: 'garage', x: -3, w: 2.6, h: 2.3, color: 0x4a4a48, style: 'sectional' },
            { t: 'balcony', x: 4, w: 6, y: 2.7, d: 1.3, rail: 'metal', color: 0xe0dcd4 }, { t: 'balcony', x: 4, w: 6, y: 5.4, d: 1.3, rail: 'metal', color: 0xe0dcd4 }] },
  { c: [69, 39], wall: 0xf4f4f1, roof: 0x4e4a48, look: 'roller',                                               // OG/Giebel mit kräftig blauer Holzverschalung, EG weiß
    front: [{ t: 'panel', x: 0, w: 10, y0: 2.8, y1: 'eave', color: 0x2f6aa8, boards: true }] },
  { c: [76.8, 34.8], wall: 0xf4f4f1, roof: 0x4e4a48, look: 'plain',                                             // Garagenanbau: weißes Tor, blau verschalter Giebel
    front: [{ t: 'garage', x: 0, w: 2.5, h: 2.2, color: 0xf0f0ea, style: 'sectional' }, { t: 'panel', x: 0, w: 5, y0: 2.4, y1: 'eave', color: 0x2f6aa8, boards: true }] },
  { c: [74.4, 14.1], wall: 0xf4f2ec, roof: 0x5e3a2e, look: 'roller',                                            // weiß, zwei braune Holzbalkone
    front: [{ t: 'balcony', x: 0, w: 8, y: 2.7, d: 1.3, rail: 'wood', color: 0x6a4630 }, { t: 'balcony', x: 0, w: 8, y: 5.4, d: 1.3, rail: 'wood', color: 0x6a4630 }] },
  { c: [83.2, -9.4], wall: 0xf1e2a8, roof: 0x8a4430, look: 'roller',                                            // gelb, 2 Balkonebenen, 2 weiße Garagentore, Wintergarten über Garagen
    front: [{ t: 'balcony', x: -2, w: 9, y: 2.7, d: 1.5, rail: 'metal', color: 0xd8d8d0 }, { t: 'balcony', x: -2, w: 9, y: 5.4, d: 1.5, rail: 'metal', color: 0xd8d8d0 },
            { t: 'garage', x: 4.5, w: 2.5, h: 2.2, color: 0xf2f0e8, style: 'sectional' }, { t: 'garage', x: 7.5, w: 2.5, h: 2.2, color: 0xf2f0e8, style: 'sectional' },
            { t: 'glazing', x: 6, w: 5, y0: 2.8, y1: 5.2, frame: 0xf4f4f0 }] },
  { c: [91.2, -39], wall: 0xeedfa8, roof: 0x8a4430, look: 'roller',                                             // hellgelb, Glasbalkone über 2 Etagen, breites weißes Garagentor
    front: [{ t: 'garage', x: 2, w: 5, h: 2.3, color: 0xf4f4f0, style: 'sectional' },
            { t: 'balcony', x: 0, w: 10, y: 2.7, d: 1.5, rail: 'glass' }, { t: 'balcony', x: 0, w: 10, y: 5.4, d: 1.5, rail: 'glass' }] },
  { c: [96.4, -61.7], wall: 0xeee6d2, roof: 0x6a6866, look: 'plain',                                            // Doppelgarage, beigebraune Tore
    front: [{ t: 'garage', x: -1.4, w: 2.4, h: 2.1, color: 0x9a7a5c, style: 'sectional' }, { t: 'garage', x: 1.4, w: 2.4, h: 2.1, color: 0x9a7a5c, style: 'sectional' }] },
  { c: [106.5, -78], wall: 0xf2e6cf, roof: 0x6b3a2a, look: 'roller',                                            // cremefarben, Rundbogenfenster, langer Holzbalkon mit Balustern, braunes Garagentor
    front: [{ t: 'balcony', x: 0, w: 11, y: 2.7, d: 1.4, rail: 'wood', color: 0x8a5a3a }, { t: 'garage', x: -5, w: 2.4, h: 2.1, color: 0x8a5a3a, style: 'wood' }] },
  { c: [88.8, -113.3], wall: 0xf0e2b4, roof: 0x6a6866, look: 'roller' },                                        // schlichter cremegelber Kubus, weiße Fenster
  { c: [94.9, -126.4], wall: 0xf4f4f0, roof: 0x6a6866, look: 'plain',                                           // Flachdachgarage weiß + Carport
    front: [{ t: 'garage', x: -2, w: 2.5, h: 2.2, color: 0xf4f4f0, style: 'sectional' }] },
  { c: [122.8, -97], wall: 0xf3f1ea, roof: 0x8a4430, look: 'roller',                                            // weiß, Holzbalkon mit Blumenkästen (nur von weitem)
    front: [{ t: 'balcony', x: 0, w: 6, y: 2.7, d: 1.2, rail: 'wood', color: 0x6a4630 }] },
  { c: [155.9, -148.8], wall: 0xf4f4f2, roof: 0x6a6866, look: 'roller' },                                       // weißer Flachbau, hinter Bäumen
  { c: [124.5, -179.3], wall: 0xf3f0e6, roof: 0x7a3b2a, look: 'modern', skylights: 1,                           // weiß, braune Holzhaustür
    front: [{ t: 'door', x: 0, w: 1.1, h: 2.1, color: 0x6a4630 }] },
  { c: [141.3, -196.9], wall: 0xf4f4f1, roof: 0x4e4a48, look: 'modern' },                                       // weiß, anthrazit Dach, große dunkle Fenster, Terrasse mit weißem Geländer
  { c: [139.1, -186.5], wall: 0xf4f4f1, roof: 0x4e4a48, look: 'plain' },                                        // Carport/Garage weiß
  { c: [151, -218.2], wall: 0xf4f4f0, roof: 0x4e4a48, look: 'roller' },                                         // weißer Bungalow, Dach voll PV
  { c: [147.4, -207.7], wall: 0x8a5a3a, roof: 0x6a4a3a, look: 'plain' },                                        // braunes Gartenhaus
  { c: [186.5, -207], wall: 0xf3f0ea, roof: 0x5e3a2e, look: 'roller',                                           // OG weiß, EG lachsfarben, Balkon
    front: [{ t: 'panel', x: 0, w: 12, y0: 0, y1: 2.8, color: 0xe6c4b2 }, { t: 'balcony', x: 2, w: 5, y: 2.7, d: 1.2, rail: 'metal', color: 0xe0e0dc }] },
  { c: [197, -205.1], wall: 0xf4f4f0, roof: 0x6a6866, look: 'plain',                                           // Doppelgarage weiß, braune Holztore
    front: [{ t: 'garage', x: -1.5, w: 2.5, h: 2.1, color: 0x7a5034, style: 'wood' }, { t: 'garage', x: 1.5, w: 2.5, h: 2.1, color: 0x7a5034, style: 'wood' }] },
  { c: [200.7, -243.6], wall: 0xf6f4ee, roof: 0x8a4430, look: 'modern',                                         // weiß, ziegelrot, 2 braune Garagentore (N), Holzbalkon (SW)
    front: [{ t: 'garage', x: -1.5, w: 2.4, h: 2.1, color: 0x7a5034, style: 'wood', face: 336 }, { t: 'garage', x: 1.5, w: 2.4, h: 2.1, color: 0x7a5034, style: 'wood', face: 336 },
            { t: 'balcony', x: 0, w: 7, y: 2.7, d: 1.3, rail: 'wood', color: 0x6a4630, face: 210 }] },
  { c: [212.1, -226.2], wall: 0xe8e6e0, roof: 0x4e4a48, look: 'roller', plinth: 0x5a5a58 },                     // hellgrau-weiß, anthrazit abgesetzte Fensterbänder EG, PV
  { c: [222, -230.9], wall: 0xe8e6e0, roof: 0x6a6866, look: 'plain',                                            // Garage, weißes Tor
    front: [{ t: 'garage', x: 0, w: 2.5, h: 2.2, color: 0xf4f4f0, style: 'sectional' }] },
  { c: [230.6, -241.6], wall: 0xf0ebe0, roof: 0x6a6866, look: 'modern' },                                       // cremeweiß, dunkle Fenster (von weitem)
  { c: [245.6, -262.2], wall: 0xf2f0ea, roof: 0x6a6866, look: 'modern', face: 164,                              // Flachdach, OG graubeige Holzverschalung, großes dunkles Fenster
    front: [{ t: 'panel', x: 0, w: 10, y0: 2.8, y1: 'eave', color: 0xbfb4a2, boards: true }] },
  { c: [238.3, -248.4], wall: 0x7a4a34, roof: 0x5e3a2e, look: 'plain' },                                        // braune Holzgarage
  { c: [248.1, -212.7], wall: 0xf2ead8, roof: 0x5e3a2e, look: 'shutter', shutters: 0x6a3326,                    // creme, rotbraune Klappläden, Holzbalkon
    front: [{ t: 'balcony', x: 5, w: 4, y: 2.7, d: 1.2, rail: 'wood', color: 0x6a4630 }] },
  { c: [261.1, -235.1], wall: 0xf3e8c8, roof: 0x8a4430, look: 'modern', skylights: 2,                           // hellcreme, breiter dunkelbrauner Holzbalkon mit Stützen, Blumen
    front: [{ t: 'balcony', x: 0, w: 10, y: 2.7, d: 2.0, rail: 'wood', color: 0x5a3a24, posts: true }] },
  { c: [277.2, -254.4], wall: 0xf4f2ec, roof: 0x5e3a2e, look: 'modern',                                         // weiß, hellbrauner Holzbalkon
    front: [{ t: 'balcony', x: 0, w: 6, y: 2.7, d: 1.2, rail: 'wood', color: 0xa0643a }] },
  { c: [290.6, -274.7], wall: 0xf6f6f3, roof: 0x4e4a48, look: 'roller', skylights: 2,                           // weiß, anthrazit Dach, weißer Giebelbalkon
    front: [{ t: 'balcony', x: 0, w: 3, y: 5.4, d: 1, rail: 'metal', color: 0xf0f0ea }] },
  { c: [287.3, -260.1], wall: 0x8a4a34, roof: 0x5e3a2e, look: 'plain' },                                        // rotbraune Garage/Schuppen
  { c: [266.3, -282.3], wall: 0xf0ece4, roof: 0x6a6866, look: 'plain',                                          // Garage, dunkelbraunes Tor
    front: [{ t: 'garage', x: 0, w: 2.5, h: 2.2, color: 0x5a3a2a, style: 'sectional' }] },
  { c: [304.1, -292], wall: 0xeccb9c, roof: 0x6b3a2a, look: 'modern',                                           // apricot, orange Holzgiebel, Wintergarten mit Markise
    front: [{ t: 'glazing', x: 2, w: 6, y0: 2.8, y1: 5.4, frame: 0x6a4630 }, { t: 'awning', x: 2, w: 6, y: 5.4, d: 1.5, color: 0xd8d0c0 }] },
  { c: [304.9, -277.3], wall: 0xf0f0ee, roof: 0x6a6866, look: 'plain',                                          // weiße Garage
    front: [{ t: 'garage', x: 0, w: 2.5, h: 2.2, color: 0xe8e8e4, style: 'sectional' }] },
  { c: [317.4, -319.3], wall: 0xf4f4f1, roof: 0x4e4a48, look: 'modern' },                                       // weißes Haus mit Glasbalkon (Hintergrund)
  { c: [310.1, -303.8], wall: 0xf4f4f1, roof: 0x4e4a48, look: 'plain' },                                        // weiß (Hintergrund)
  { c: [264.8, -302.2], wall: 0xf4f4f2, roof: 0x6a6866, look: 'modern' },                                       // Nr. 26: weißer Flachdachbungalow, anthrazit Fensterrahmen
  { c: [246.6, -306], wall: 0xebeae6, roof: 0x6a6866, look: 'modern' },                                         // Nr. 24: weißer Kubus, Flachdach mit PV
  { c: [279.4, -327.4], wall: 0xf6f6f3, roof: 0x6a6866, look: 'modern', face: 176,                              // weißer Kubus, Glasbalkone, weißes Garagentor
    front: [{ t: 'garage', x: 1, w: 2.6, h: 2.3, color: 0xf4f4f0, style: 'sectional' },
            { t: 'balcony', x: -4, w: 5, y: 2.7, d: 1.5, rail: 'glass' }, { t: 'balcony', x: -4, w: 4, y: 5.4, d: 1.5, rail: 'glass' }] },
  { c: [302.3, -333.6], wall: 0xf4f4f2, roof: 0x6a6866, look: 'modern' },                                       // weißer Flachdachbau (Hintergrund)
  { c: [249.4, -341.9], wall: 0xe4e2dd, roof: 0x6a6866, look: 'modern', face: 144,                              // hellgrauer Flachdachbau, große anthrazit Fenster, Glasbalkon
    front: [{ t: 'balcony', x: -3, w: 5, y: 2.7, d: 1.5, rail: 'glass' }] },
  { c: [220.1, -328.4], wall: 0xf6f4ee, roof: 0x5e3a2e, look: 'roller', skylights: 1 },                         // weiß, dunkelbraunes Dach, PV, Holztreppe
  { c: [227.2, -334.7], wall: 0xf6f4ee, roof: 0x5e3a2e, look: 'plain',                                          // Garage zu 220.1
    front: [{ t: 'garage', x: 0, w: 2.5, h: 2.2, color: 0x6a5a4c, style: 'sectional' }] },
  { c: [207, -312.4], wall: 0xeee2cc, roof: 0x7a3b2a, look: 'modern' },                                         // beige, braune Fensterrahmen
  { c: [195.6, -291.9], wall: 0xf4f4f2, roof: 0x4e4a48, look: 'roller', face: 86,                               // weiß, anthrazit Dach mit PV, anthrazit Garagentor, Carport
    front: [{ t: 'garage', x: 2, w: 2.6, h: 2.3, color: 0x3e3e3e, style: 'sectional' }] },
  { c: [226.1, -282.8], wall: 0xe8d6c8, roof: 0x6a6866, look: 'roller', face: 336,                              // EG altrosa/beige, graue Attika, weißer Balkon
    front: [{ t: 'balcony', x: -1, w: 8, y: 2.7, d: 1.5, rail: 'metal', color: 0xf0f0ea }] },
  { c: [224.7, -292.7], wall: 0xf4f4f0, roof: 0x6a6866, look: 'plain' },                                        // Carport weiß
  { c: [216, -266.1], wall: 0xf0ebdf, roof: 0x5e3a2e, look: 'modern',                                           // weiß, OG/Giebel orangebraune Holzverschalung + Holzbalkon
    front: [{ t: 'panel', x: 0, w: 10, y0: 2.8, y1: 'eave', color: 0xb06a3a, boards: true }, { t: 'balcony', x: 0, w: 8, y: 2.7, d: 1.3, rail: 'wood', color: 0xb06a3a }] },
  { c: [181.5, -274], wall: 0xe9e9ea, roof: 0x4e4a48, look: 'modern', skylights: 3, face: 86,                   // hellgrau-weiß, anthrazit Dach, weiße Glastür, rotbrauner Anbau
    front: [{ t: 'door', x: 1, w: 1.6, h: 2.2, color: 0xf4f4f4, glass: true }] },
  { c: [170.3, -253.4], wall: 0xf4f4f2, roof: 0x4e4a48, look: 'modern' },                                       // weiß, PV-Dach, Flachdachteil mit dunkler Attika
  // nicht sichtbar: c:[84.2,-21.9], c:[90.2,-2.7], c:[74.4,0], c:[83.3,-103.1], c:[78.2,-105.1], c:[71.7,-101], c:[110.2,-87.3], c:[127.4,-74.7],
  //   c:[138.5,-113.8], c:[135.1,-125.2], c:[117,-165.4], c:[136.5,-187.8], c:[164.7,-178.9], c:[178.1,-258.2], c:[200.8,-232.8],
  //   c:[266.7,-217.6], c:[258.4,-214.8], c:[266.5,-241.8], c:[279.7,-261.7], c:[304.3,-318.8], c:[260.3,-337.4], c:[240.5,-313.9], c:[228.9,-290.4]
  // ===== Kellermatten =====
  // Keine Google-Street-View-Abdeckung (Auto). Erfasst nach 7 Nutzer-Panoramen "N." (Aufnahme Sep 2024, alle ~35 m entlang der
  // Straße). Ausrichtung dieser Panoramen ±10° unsicher → Zuordnung per Abstand/Form geprüft.
  { c: [-208, -148.1], wall: 0xf1ead8, roof: 0x5e4a40, look: 'roller',                                             // Mehrfamilienhaus: cremeweiß, Glasbaustein-Treppenhaus, Balkone mit graugrünen Brüstungen (Südende)
    front: [{ t: 'glazing', x: -1.5, w: 2.2, y0: 1.5, y1: 6.5, frame: 0xd8d8d0 }, { t: 'balcony', x: 5, w: 4, y: 1.3, d: 1.3, rail: 'metal', color: 0x7a9188 },
      { t: 'balcony', x: 5, w: 4, y: 4.0, d: 1.3, rail: 'metal', color: 0x7a9188 }] },
  { c: [-230.3, -181.1], wall: 0xede7dc, roof: 0x4e3e36, look: 'roller',                                           // hell beige-grau, dunkelbraunes Dach mit PV, dunkler Holzbalkon am Westgiebel
    front: [{ t: 'balcony', face: 'W', x: 2, w: 4, y: 2.7, d: 1.2, rail: 'wood', color: 0x5a4030 }] },
  { c: [-243.9, -160.3], wall: 0xd2ac78, roof: 0x4e3a30, look: 'modern', face: 'E',                                // EG gelber Klinker, OG/Giebel braune Holzverschalung, dunkelbraunes Dach
    front: [{ t: 'panel', x: 0, w: 11, y0: 2.6, y1: 'eave', color: 0x8a5a38, boards: true }] },
  { c: [-254.1, -133.1], wall: 0xd9d7d2, roof: 0x3e3e40, look: 'modern',                                          // Neubau: EG hellgrau verputzt, OG Lärchen-Holzschalung, anthrazit Dach
    front: [{ t: 'panel', x: 0, w: 14, y0: 2.8, y1: 'eave', color: 0xb07a50, boards: true }] },
  { c: [-260.1, -126.6], wall: 0xe6bfae, roof: 0x3e3e40, look: 'modern', eave: 6.0, pitch: 35 },                    // lachsrosa verputzter Giebelteil am Neubau
  { c: [-260.8, -121.7], wall: 0xe2ddd2, roof: 0xb8b8b4, look: 'plain',                                          // Garage beige, Flachdach mit Dachterrasse (Glasgeländer), hellgraues Sektionaltor + Tür
    front: [{ t: 'garage', x: -0.5, w: 2.6, h: 2.1, color: 0xbdbdb8, style: 'sectional' }, { t: 'door', x: 1.6, w: 0.9, h: 2.0, color: 0xc8c8c4 }] },
  { c: [-262.6, -116.9], wall: 0xe6dcc6, roof: 0xb8b8b4, look: 'plain',                                          // Doppelgarage beige mit Dachterrasse, zwei braungraue Tore
    front: [{ t: 'garage', x: -1.4, w: 2.4, h: 2.1, color: 0x7a6a58, style: 'sectional' }, { t: 'garage', x: 1.4, w: 2.4, h: 2.1, color: 0x7a6a58, style: 'sectional' }] },
  { c: [-269.6, -109.8], wall: 0xf4f1ea, roof: 0x5a4436, look: 'roller' },                                         // hinter den Garagen: weiß, dunkelbraunes Dach mit Gauben
  { c: [-279.9, -89.3], wall: 0xf3f1ea, roof: 0x5a4436, look: 'roller',                                           // weiß, dunkelbraunes Dach, Holzbalkon im Giebel
    front: [{ t: 'balcony', x: 0.5, w: 2.5, y: 5.0, d: 1.0, rail: 'wood', color: 0x6a4a30 }] },
  { c: [-272.8, -94.1], wall: 0xf2f1ee, roof: 0x4a4a4c, look: 'plain',                                           // angebaute Garage weiß, Flachdach, dunkelgraues Sektionaltor
    front: [{ t: 'garage', x: 0, w: 2.6, h: 2.2, color: 0x4a4c50, style: 'sectional' }] },
  { c: [-250.8, -63], wall: 0xf3efe6, roof: 0x6a5040, look: 'roller' },                                            // cremeweiß, braunes Dach mit Gaube
  { c: [-296.9, -66.9], wall: 0xedb87a, roof: 0x7a3b2a, look: 'roller',                                           // apricot/orange verputzt, rotbraunes Dach mit PV, Holzpergola/Terrasse am Nordteil
    front: [{ t: 'porch', x: 4, w: 6, d: 2.5, h: 2.6, color: 0x6a4a30 }] },
  { c: [-267.5, -46.6], wall: 0xeef0f2, roof: 0x9a4a35, look: 'modern' },                                          // fast weiß, roter Ziegel, braune Holzfenster mit französischen Fenstern
  { c: [-309.9, -36.7], wall: 0xf2f0ea, roof: 0x4a3a32, look: 'roller',                                           // weiß, dunkelbraunes Dach, dunkler Holzbalkon
    front: [{ t: 'balcony', x: 0, w: 5, y: 2.7, d: 1.2, rail: 'wood', color: 0x5a4030 }] },
  { c: [-322, -15.5], wall: 0xf0d98a, roof: 0x3e3e40, look: 'roller',                                             // gelb, anthrazit Dach mit PV und Gauben, weiße Haustür
    front: [{ t: 'door', x: 0.5, w: 1.2, h: 2.2, color: 0xf2f2f0, glass: true }] },
  { c: [-314.9, -22], wall: 0xd5d7d8, roof: 0x9a9a96, look: 'plain',                                             // Doppelgarage hellgrau, hell graublaue Sektionaltore
    front: [{ t: 'garage', x: -1.4, w: 2.4, h: 2.1, color: 0xbcc4cf, style: 'sectional' }, { t: 'garage', x: 1.4, w: 2.4, h: 2.1, color: 0xbcc4cf, style: 'sectional' }] },
  { c: [-316.9, -29.6], wall: 0xd5d7d8, roof: 0x9a9a96, look: 'plain',                                           // anschließende Garage, gleiche Ausführung
    front: [{ t: 'garage', x: 0, w: 2.4, h: 2.1, color: 0xbcc4cf, style: 'sectional' }] },
  { c: [-330.6, 4.4], wall: 0xf3f1ec, roof: 0x8a3a2a, look: 'roller' },                                            // weiß, roter Ziegel (entfernt)
  { c: [-324.5, -2.4], wall: 0xeeeeea, roof: 0x9a9a96, look: 'plain' },                                            // weißer Flachdach-Anbau
  { c: [-334, 20.1], wall: 0xf5f5f2, roof: 0x8a3a2a, look: 'modern' },                                             // weiß, rotbraunes Ziegeldach, braune Holzfenster, Holz-Carport angebaut
  { c: [-304.3, 26.2], wall: 0xf4ecd2, roof: 0x5a4436, look: 'roller', plinth: 0x9a948a },                         // 3-geschossig hellgelb, beige Rollläden, Dachgauben-Band dunkelbraun verschalt
  { c: [-301.5, 18], wall: 0xf4ecd2, roof: 0x5a4436, look: 'roller', eave: 5.2, pitch: 25, face: 'W',              // Seitenflügel hellgelb mit Holzbalkon
    front: [{ t: 'balcony', x: 0, w: 4, y: 2.7, d: 1.2, rail: 'wood', color: 0x8a5a3a }] },
  { c: [-297.8, 13.4], wall: 0xf4ecd2, roof: 0x5a4436, look: 'plain', face: 'W',                                   // Garage im Seitenflügel, orangefarbenes Sektionaltor
    front: [{ t: 'garage', x: 0, w: 2.5, h: 2.1, color: 0xe0904a, style: 'sectional' }] },
  // nicht sichtbar (Hecken/verdeckt): c:[-285.3,-2] (Scheune, nur braunes Ziegeldach sichtbar), c:[-289.8,11.4],
  // c:[-293.2,21.2], c:[-253.3,-49], c:[-257.6,-75], c:[-271.9,-117.4], c:[-199.8,-161.5], c:[-198.4,-153.9], c:[-232.9,-166.3],
  // c:[-261.4,-158.3], c:[-287.7,-105.7], c:[-296.5,-75.9], c:[-300.6,-72.4], c:[-336.3,-30.5], c:[-341,-9.4], c:[-328.2,15.6]
  // ===== Kirchstraße ===== (Nordteil: Nutzer-Photospheres „N.“ Sep 2024; Südteil ab Probsteiweg: Google Street View Apr 2022)
  { c: [-109.6, -70], wall: 0xece0c4, roof: 0x8a4430, look: 'shutter', shutters: 0x2f6b3a },                           // cremegelb, grüne Läden, Giebel zur Straße
  { c: [-98.7, -64.6], wall: 0xf2dccb, roof: 0x8a4430, look: 'small', plinth: 0xd9b5a0,                                 // hell-pfirsich, Holzbalkon mit Geranien, Holztor orange
    front: [{ t: 'balcony', x: -4, w: 9, y: 2.7, d: 1.2, rail: 'wood', color: 0xc97a2e },
            { t: 'garage', x: 1, w: 2.5, h: 2.3, color: 0xd88a30, style: 'wood' }] },
  { c: [-121, -40.9], wall: 0xf4f3ef, roof: 0x7a3b2a, look: 'roller' },                                                // weißes Wohnhaus, Rollläden
  { c: [-97.8, -35.6], wall: 0xf0dfc8, roof: 0x7a3b2a, look: 'shutter', shutters: 0x5a3a24, plinth: 0xb9b8b4,            // pfirsich-creme, braune Läden, Rundbogentor
    front: [{ t: 'door', face: 'N', x: 0, w: 1.6, h: 2.6, color: 0x5e4632, boards: true }] },
  { c: [-97.7, -20], wall: 0x3e2e24, roof: 0x7a3b2a, look: 'plain',                                                    // große Scheune: dunkle Holzbretter, Nordteil weiß verputzt
    front: [{ t: 'panel', face: 'E', x: 5, w: 9, y0: 0, y1: 'eave', color: 0xefede6, ground: true },
            { t: 'door', face: 'E', x: -3, w: 4, h: 3.5, color: 0x3a2a20, boards: true }] },
  { c: [-100.4, 15], wall: 0xefede6, roof: 0x5e3a2e, look: 'shutter', shutters: 0x8a6a58, plinth: 0xbdb8ac },            // weiß, graubraune Läden, zwei Giebel
  { c: [-37, 12.1], wall: 0xebdfc8, roof: 0x8a4430, look: 'shutter', shutters: 0x5a6a4a },                             // großes Altbauhaus beige (nur aus Distanz)
  { c: [-83.7, 66.7], wall: 0xeae9e4, roof: 0x6a4a3a, look: 'roller',                                                  // weiß, oberstes Geschoss dunkelgrau verkleidet
    front: [{ t: 'panel', x: 0, w: 14, y0: 5.4, y1: 'eave', color: 0x4a4a4c }] },
  { c: [-40.4, 89.3], wall: 0xf0eee8, roof: 0x8a4430, look: 'plain',                                                   // Scheune: Westseite braune Bretter mit Holztoren, Nordgiebel weiß
    front: [{ t: 'panel', face: 'W', x: 0, w: 14, y0: 0, y1: 'eave', color: 0x6e4a32, boards: true, ground: true },
            { t: 'door', face: 'W', x: -2, w: 3.2, h: 3.2, color: 0x7a5236, boards: true }] },
  { c: [-32.7, 106.9], wall: 0xf5f3ec, roof: 0x9a4a30, look: 'shutter', shutters: 0x5e3a26 },                           // Nr. 14 (Probsteiweg 3): weiß, braune Läden, Café
  { c: [-35.3, 148.2], wall: 0xf4f4f0, roof: 0x5e4a40, look: 'plain' },                                                // Trafoturm weiß, Walmdach
  { c: [-51, 127.2], wall: 0xe4e2dc, roof: 0x4e4a48, look: 'plain' },                                                  // Garage/Carport, Flachdach
  { c: [-63.4, 123.9], wall: 0xf0e6cc, roof: 0x7a3b2a, look: 'roller',                                                 // cremegelb, Holzbalkon am Ostgiebel
    front: [{ t: 'balcony', face: 'E', x: 0, w: 3.5, y: 2.7, d: 1.2, rail: 'wood', color: 0x6a4a32 }] },
  { c: [-69.4, 119.5], wall: 0xf0e6cc, roof: 0x7a3b2a, look: 'small' },                                                // Anbau, gleiche Farbe
  { c: [-53.6, 145.7], wall: 0xe8d6b0, roof: 0x7a3b2a, look: 'modern' },                                               // beige, dunkles Holz im Giebel, Gaube
  // nicht sichtbar: c:[-106.5,2.1], c:[-137.9,0.3], c:[-112.2,20.1], c:[-118.2,-22.2], c:[-27,85.5], c:[334.4,302.5] (Wald, Photosphere Okt 2024)
  // ===== Lindenhof =====
  // KEINE Street-View-Abdeckung (Hofzufahrt ohne Panorama; vom Römerstraße-Panorama Apr 2022 aus hinter Hecken verdeckt).
  // nicht sichtbar: c:[1241.9,13.4], c:[1193.8,-8], c:[1183.7,2.7], c:[1188.8,16.3], c:[1254.4,-5.8], c:[1239.8,-4.5]
  // ===== Neuweg (Rheinweiler) =====
  // Google-Auto nur an der Einmündung Bamlacher Straße (Apr 2022); Neuweg selbst ohne Auto-Abdeckung.
  // Ostast + Südende nur Nutzer-Photospheres ("N.", Okt 2024).
  { c: [-1008.3, 631.8], wall: 0xf4f4f2, roof: 0x4e4a48, look: 'modern' },                                    // modernes weißes Haus, schwarze Fensterrahmen
  { c: [-1001.2, 646.1], wall: 0x8a6040, roof: 0x8a4430, look: 'plain' },                                     // Holz-Carport mit Ziegeldach
  { c: [-990.7, 642.5], wall: 0xf2f2ee, roof: 0x8a4430, look: 'roller', face: 'W',                            // weiß, rotbraunes Dach, Holzbalkon
    front: [{ t: 'balcony', x: 0, w: 4, y: 2.7, d: 1.3, rail: 'wood', color: 0x7a5030 }] },
  { c: [-1035.8, 655.1], wall: 0xf4f4f2, roof: 0x4e4a48, look: 'roller', plinth: 0xa8a8a2, face: 'N',         // großes weißes Mehrfamilienhaus, verglastes Treppenhaus in der Mitte, Gaube
    front: [{ t: 'glazing', x: 0, w: 2, y0: 0.8, y1: 6.5, frame: 0x6a6e72 }] },
  { c: [-1022.7, 654.2], wall: 0xf2f2ee, roof: 0x5e4a40, look: 'plain', face: 'N',                            // Doppelgarage, dunkle Sektionaltore
    front: [{ t: 'garage', x: -1.5, w: 2.4, h: 2.1, color: 0x3a3f46, style: 'sectional' }, { t: 'garage', x: 1.5, w: 2.4, h: 2.1, color: 0x3a3f46, style: 'sectional' }] },
  { c: [-910.7, 687], wall: 0xf3f3ef, roof: 0x5e3a2e, look: 'roller' },                                       // Ostast: weißes Haus, dunkelbraunes Dach, großer Holz-Carport davor
  { c: [-945.5, 658.7], wall: 0xeedfa8, roof: 0x8a4430, look: 'roller' },                                     // hellgelbes Haus, rotes Dach mit PV
  { c: [-903.4, 839.9], wall: 0xf2f2ee, roof: 0x4e4a48, look: 'roller' },                                     // Südende: weiß, dunkles Dach mit Gaube
  { c: [-908.2, 847.2], wall: 0xf2f2ee, roof: 0x4e4a48, look: 'roller' },                                     // Anbau dazu
  { c: [-916.5, 828], wall: 0xe8e8e4, roof: 0x8a8a84, look: 'plain' },                                        // Flachdach-Carport mit weißer Blende
  { c: [-932.5, 824.4], wall: 0x9fa89c, roof: 0x4a4a4a, look: 'plain' },                                      // graugrüne Garage mit Glasbausteinfenster
  // nicht sichtbar (keine Abdeckung im Neuweg): c:[-929.7,752.9], c:[-996.1,692], c:[-959.4,777.2], c:[-966.3,657.2], c:[-1005.1,670.9],
  //   c:[-971.5,723.2], c:[-927.1,777.2] (hinter Hecke), c:[-994,681.5], c:[-944.9,679.4], c:[-939.4,718.8], c:[-946.9,687.6],
  //   c:[-1014.6,684.3], c:[-940.2,758.1], c:[-1015.1,669.2], c:[-896.3,688.3], c:[-962,753.5], c:[-965.3,733.6], c:[-965,730.6],
  //   c:[-977.6,707.5], c:[-961.9,770], c:[-948.9,650], c:[-982.8,664], c:[-1003.3,638.2]
  // ===== Ob der Schmiede =====
  // Keine Aufnahmen in der Straße selbst (Neubaugebiet); nur aus der Ferne vom Panorama "Römerstraße 2" (Apr 2022, ~55–65 m) sichtbar.
  // Vier gleichartige weiße Flachdach-Mehrfamilienhäuser, grau abgesetztes Sockel-/Garagengeschoss, umlaufende Balkone mit Glas-/Metallgeländer.
  { c: [-235.2, 274.3], wall: 0xf4f4f2, roof: 0x6a6866, look: 'modern', plinth: 0x9a9a98, face: 'W',              // Nr. 2: weißer Kubus, Glasbalkone in 1. und 2. Ebene
    front: [{ t: 'balcony', x: 1, w: 9, y: 2.7, d: 1.8, rail: 'glass' }, { t: 'balcony', x: 1, w: 9, y: 5.4, d: 1.8, rail: 'glass' }] },
  { c: [-221.6, 247.5], wall: 0xf4f4f2, roof: 0x6a6866, look: 'modern', plinth: 0x9a9a98, face: 'W',              // gleiches Haus, Balkone mit grauem Metallgeländer
    front: [{ t: 'balcony', x: 0, w: 12, y: 2.7, d: 1.8, rail: 'metal', color: 0x8a8c90 }, { t: 'balcony', x: 0, w: 12, y: 5.4, d: 1.8, rail: 'metal', color: 0x8a8c90 }] },
  // nicht sichtbar: c:[-205.1,222.3], c:[-186,195.7] (vermutlich baugleich mit den beiden obigen)
  // ===== Probsteiweg =====
  // Quelle: Google Street View Apr 2022. Abschnitt 1 (Stichweg nach Süden) ohne Abdeckung; Haus bei c:[-115.1,92.7] in Street View verpixelt.
  { c: [-141.6, 77.2], skip: 12 },   // Probstei (Nr. 1/1) mit Nordflügel und Scheune: eigenes Modell in probstei.js
  { c: [-109.1, 87.2], skip: 10 },   // Nr. 3: Scheune mit Rundbogentor, eigenes Modell in probstei.js
  { c: [-117.1, 64.1], skip: 10 },   // Scheune Nordost am Hof der Probstei, eigenes Modell in probstei.js
  { c: [-115.2, 92.7], skip: 3 },    // OSM-„Garage“ = Wellblech-Vordach an der Scheune Nr. 3, gebaut in probstei.js
  { c: [-142.9, 147.6], wall: 0xb2b0a8, roof: 0x8e8b84, look: 'band', lodRoof: true },                         // Marienheim (Nr. 2, 1975): Sichtbeton, Fensterbänder; Details in probsteiweg.js
  { c: [-106.9, 153.9], wall: 0x8fbc5f, roof: 0x7c7d7a, look: 'plain', lodRoof: true,                          // Weingut Marienheim: grün gestrichene Halle, graues Wellplattendach
    front: [{ t: 'garage', face: 'N', x: 0, w: 3.4, h: 3.0, color: 0x9a9c9e, style: 'sectional' }] },          // graues Rolltor im Nordgiebel
  { c: [-91.8, 85.9], wall: 0xf4f2ec, roof: 0x8a4430, look: 'roller',                                          // weiß, Gauben, PV, brauner Holzbalkon im Giebel
    front: [{ t: 'balcony', x: 0, w: 4, y: 5.4, d: 1.2, rail: 'wood', color: 0x6a4630 }] },
  // nicht sichtbar: c:[-115.1,92.7] (verpixelt), c:[-100.9,80.7], c:[-88.1,98.3], c:[-79.9,133], c:[-193,78.5], c:[-183.7,66.8], c:[-120.8,228.7]
  // ===== Quellenhof =====
  // KEINE Street-View-Abdeckung im Hof; vom Panorama Römerstraße 2 (Apr 2022) nur ein Gebäude in ~40 m hinter Bäumen erkennbar,
  // Zuordnung unsicher (evtl. c:[1137.5,-88.1], nicht in dieser Liste) -> nichts eingetragen.
  // nicht sichtbar: c:[1163.5,-122.5], c:[1187,-153], c:[1141.7,-96.6], c:[1146.3,-97.4]
  // ===== Rathausstraße ===== (nur Nutzer-Photospheres „N.“, Aufnahme Sep 2024; keine offizielle Street-View-Abdeckung)
  // Rathaus c:[-57.2,-21]: eigenes Modell in rathaus.js
  // { c: [-57.2, -21], wall: 0xf0e8da, roof: 0x5a4a44, look: 'roller',
  //   front: [{ t: 'balcony', face: 'W', x: -13, w: 7, y: 2.7, d: 1.2, rail: 'wood', color: 0x6b4a36 }] },              // Holzbalkon an der Westseite (Nordende)
  { c: [-51.7, -30.7], wall: 0xe6d8c0, roof: 0x8a8680, look: 'plain',                                                  // Doppelgarage beige, Dachterrasse
    front: [{ t: 'garage', x: -1.5, w: 2.4, h: 2.1, color: 0x7a5a3c, style: 'sectional' }, { t: 'garage', x: 1.5, w: 2.4, h: 2.1, color: 0x7a5a3c, style: 'sectional' }] },
  { c: [-36.4, -32.5], wall: 0xefefeb, roof: 0x8a8680, look: 'plain',                                                  // weiße Doppelgarage am Hang
    front: [{ t: 'garage', x: -1.6, w: 2.5, h: 2.1, color: 0xe6e6e2, style: 'sectional' }, { t: 'garage', x: 1.6, w: 2.5, h: 2.1, color: 0xe6e6e2, style: 'sectional' }] },
  { c: [-10.5, -27.8], wall: 0xeee6d2, roof: 0x4e4a48, look: 'modern' },                                               // cremefarbenes Haus, dunkle Fenster, Carport
  { c: [-10.8, -37], wall: 0xdedad2, roof: 0x6a6866, look: 'plain',                                                    // Garage mit weißem Sektionaltor
    front: [{ t: 'garage', x: 0, w: 2.5, h: 2.1, color: 0xf0f0ec, style: 'sectional' }] },
  { c: [18.2, -37.1], wall: 0xddd0b5, roof: 0x8a8680, look: 'plain',                                                   // Flachdachgaragen sandfarben, hellbraune Tore
    front: [{ t: 'garage', x: -1.6, w: 2.4, h: 2.1, color: 0x8c7358, style: 'sectional' }, { t: 'garage', x: 1.6, w: 2.4, h: 2.1, color: 0x8c7358, style: 'sectional' }] },
  { c: [-50, -49.2], wall: 0x6e5038, roof: 0x8a4430, look: 'plain',                                                    // Holzscheune, unten weiß verputzt
    front: [{ t: 'panel', x: 0, w: 7, y0: 0, y1: 2.2, color: 0xeeebe3, ground: true }] },
  { c: [-35.7, -48.6], wall: 0x5e4330, roof: 0x6a6866, look: 'plain' },                                                // Holzschuppen (Bretter), Holzlager davor
  { c: [-34.5, -52.6], wall: 0x5e4330, roof: 0x6a6866, look: 'plain' },                                                // Holzschuppen dahinter
  { c: [-35.2, -61.3], wall: 0xf2f0ea, roof: 0x8a4430, look: 'plain' },                                                // weißer Nebenbau mit PV
  // doppelt, siehe Salzbrunnenstraße: { c: [-4.1, -62], wall: 0xebd5c6, roof: 0x8a4430, look: 'shutter', shutters: 0x5a3a24, plinth: 0xdcb9a8 },             // lachsfarbenes Wohnhaus, braune Läden (ALKIS 2723)
  { c: [3.1, -51.3], wall: 0xeeeae2, roof: 0x5e3a2e, look: 'small' },                                                  // kleiner weißer Anbau, steiles Dach
  { c: [16.4, -64.7], wall: 0xece6d6, roof: 0x8a4430, look: 'modern', eave: 5.8, pitch: 45,                            // Nr. 7: Wohnteil mit Balkon, 2 Holztore
    front: [{ t: 'door', x: -1.3, w: 2.0, h: 2.0, color: 0x6a4a34, boards: true }, { t: 'door', x: 2.1, w: 2.0, h: 2.0, color: 0x6a4a34, boards: true },
            { t: 'balcony', x: 1.8, w: 3.3, y: 2.7, d: 1.2, rail: 'metal', color: 0x3a3a3a }] },
  { c: [27.1, -63.6], wall: 0xf0ebdf, roof: 0x8a4430, look: 'shutter', shutters: 0x6a3a2e },                            // cremeweiß, rotbraune Läden, Gauben
  { c: [50, -72.5], wall: 0xa87150, roof: 0x4e4a48, look: 'shutter', shutters: 0x4f7a3a },                             // Neubau Lärchenholzschalung, grüne Läden
  { c: [49.2, -63.1], wall: 0x8a6a4c, roof: 0x3e3c3a, look: 'plain' },                                                 // Carport Holz, dunkles Dach
  { c: [53.5, -62.4], wall: 0x4a4644, roof: 0x3e3c3a, look: 'plain' },                                                 // dunkler Schuppen neben Carport
  // nicht sichtbar: c:[2.8,-54.4], c:[33.6,-65.6], c:[44.8,-93.3], c:[-6.2,-8.7]
  // ===== Rheinblick (Rheinweiler, Neubaugebiet) – keine Google-Auto-Abdeckung, nur Nutzer-Photospheres „N.“ (Aug/Okt 2024) =====
  { c: [-875.5, 734.2], wall: 0xf2f2f0, roof: 0x4e4a48, look: 'roller', plinth: 0x9a9a98 },                         // weiß, grauer Sockel, Außentreppe, PV auf Dach
  { c: [-875.7, 711.8], wall: 0xe0e0de, roof: 0x4e4a48, look: 'roller',                                           // hellgrau/weiß mit grauen Fensterbändern, weiße Garage
    front: [{ t: 'garage', x: 4, w: 2.5, h: 2.2, color: 0xf0f0ec, style: 'sectional' }] },
  { c: [-873.7, 761.2], wall: 0xf2f2f0, roof: 0x4e4a48, look: 'modern' },                                         // weiß, kubisch
  { c: [-879.1, 783.4], wall: 0xf2f2f0, roof: 0x4e4a48, look: 'roller',                                           // Doppelhaushälfte weiß, Glasbalkon, graues Garagentor
    front: [{ t: 'balcony', x: 0, w: 5, y: 2.7, d: 1.5, rail: 'glass', posts: true },
            { t: 'garage', x: 0, w: 2.5, h: 2.2, color: 0x9a9c9e, style: 'sectional' }] },
  { c: [-880.8, 790], wall: 0xf2f2f0, roof: 0x4e4a48, look: 'roller',                                             // Doppelhaushälfte weiß, Glasbalkon, graues Garagentor
    front: [{ t: 'balcony', x: 0, w: 5, y: 2.7, d: 1.5, rail: 'glass', posts: true },
            { t: 'garage', x: 0, w: 2.5, h: 2.2, color: 0x9a9c9e, style: 'sectional' }] },
  { c: [-886.6, 794.7], wall: 0xf2f2f0, roof: 0x6a6866, look: 'plain',                                            // weiße Garage
    front: [{ t: 'garage', x: 0, w: 2.5, h: 2.2, color: 0xf0f0ec, style: 'sectional' }] },
  { c: [-888.3, 809.1], wall: 0xe4dccf, roof: 0x5e5a56, look: 'modern',                                           // kubisch, taupe-beige, dunkle Fenster, Stahlbalkone, Gabionen-Sockel
    front: [{ t: 'balcony', x: 0, w: 6, y: 2.7, d: 1.5, rail: 'metal', color: 0xb8b8b4 },
            { t: 'garage', x: 2, w: 2.5, h: 2.2, color: 0x4a4c50, style: 'sectional' }] },
  { c: [-911.6, 798.2], wall: 0xf2f2f0, roof: 0x4e4a48, look: 'modern', plinth: 0x7a7c80 },                       // weiß, anthrazit Fenster/Haustür, Rollladenkästen
  { c: [-912.4, 788.1], wall: 0x8a6a4a, roof: 0x5e5a56, look: 'plain' },                                          // Holz-Gartenhaus
  { c: [-907, 825.1], wall: 0xf0f0ec, roof: 0x4e4a48, look: 'roller',                                             // weiß, anthrazit Dach, kleiner Balkon
    front: [{ t: 'balcony', x: 0, w: 3, y: 2.7, d: 1.0, rail: 'metal', color: 0x8a8c90 }] },
  // Baustelle (Aug/Okt 2024 nur Bodenplatte/Rohbau): c:[-899.8,749] apartments, c:[-906.6,773.7] apartments,
  //   c:[-897.4,738.9], c:[-901.9,759.1], c:[-903.3,763.9], c:[-908.9,783.5] garage – OSM-Umrisse ohne fertiges Gebäude
  // nicht sichtbar: c:[-919.5,726.7], c:[-879,708], c:[-880.9,776.5], c:[-913.8,737.8]
  // ===== Rheinstraße =====
  // Google Street View Apr 2022.
  { c: [139.9, -1088.2], wall: 0xf4f4f0, roof: 0x6a5a50, look: 'roller' },                                          // weiß, graubraunes Dach mit 2 Gauben, Holzbalkon am Ostgiebel, Wegkreuz davor
  { c: [145.8, -1100.5], wall: 0xa8a6a0, roof: 0x8a8a86, look: 'plain',                                            // Nebengebäude/Garage in Sichtbeton am Hang, Dachterrasse mit terrakotta-braunem Holzgeländer
    front: [{ t: 'balcony', x: 0, w: 7, y: 2.3, d: 0.3, rail: 'wood', color: 0xc0703f }] },
  { c: [85.3, -1035.7], wall: 0xd8d8d4, roof: 0x6a6866, look: 'plain' },                                            // Fertigteil-Versorgungshäuschen hellgrau mit Lüftungsgittern (Ortsausgang)
  // nicht sichtbar (hinter Hecken): c:[166.2,-1126.9], c:[158.3,-1106.4]
  // ===== Rotbergerstraße ===== (Rheinweiler; nur Nutzer-Photospheres „N.“, Aufnahme Jul/Aug 2024; Hauptstraße nur Stützmauern/Wald)
  { c: [-1446.2, 642], wall: 0xeee4c8, roof: 0x6a3a2e, look: 'modern', eave: 9, pitch: 35,                            // 3-gesch. Mehrfamilienhaus cremebeige, Glasbalkone, Wintergarten
    front: [{ t: 'balcony', face: 'S', x: 3, w: 7, y: 2.7, d: 1.6, rail: 'glass', posts: true }] },
  { c: [-1471.1, 656.5], wall: 0xf0f0ec, roof: 0x9a4a30, look: 'small' },                                              // weißes Haus, ziegelrotes Dach
  { c: [-1466.1, 651.7], wall: 0xd8d4c8, roof: 0x6a6866, look: 'plain',                                                // Garage grau, dunkles Tor
    front: [{ t: 'garage', x: 0, w: 2.5, h: 2.1, color: 0x4a4a48, style: 'sectional' }] },
  { c: [-1448.3, 676], wall: 0xe8e8e6, roof: 0x5a5856, look: 'small', plinth: 0xc8c6c0 },                              // Kapelle: hellgrauweiß, Spitzbogenfenster mit Sandsteingewände, Wegkreuz
  { c: [-1468, 692.8], wall: 0xc8cacc, roof: 0x8a8c8e, look: 'plain' },                                                // Gewerbehalle hellgraues Blech
  { c: [-1498.8, 674], wall: 0xf0dcc0, roof: 0x7a3b2a, look: 'shutter', shutters: 0x2f4f3a, plinth: 0x5a2a28 },          // apricot-creme, dunkelgrüne Läden, rotbraune Fensterumrahmung und Sockel
  { c: [-1512.4, 676.5], wall: 0xe9ddcc, roof: 0x5e3a2e, look: 'plain', plinth: 0xc88a80,                              // hohe Scheune beige, rötlicher Sockel, dunkles Holztor, Efeu
    front: [{ t: 'door', x: 1, w: 2.6, h: 3.2, color: 0x3e3028, boards: true }, { t: 'ivy', x: 3.2, w: 1.8, h: 5 }] },
  { c: [-1538.8, 688.2], wall: 0xe2dacb, roof: 0x4e4a48, look: 'modern',                                               // hellbeigegrau, verglaster Wintergarten im OG
    front: [{ t: 'glazing', x: 0, w: 6, y0: 3.0, y1: 4.6, frame: 0xf0f0ec }] },
  { c: [-1546.6, 681.9], wall: 0xddd6c8, roof: 0x8a8680, look: 'modern', eave: 3.5, pitch: 5 },                         // Flachdachanbau
  { c: [-1527.2, 708.4], wall: 0xe8e0d0, roof: 0x5e3a2e, look: 'small',                                                // großes Haus hinter efeuberankter Mauer (nur Dach sichtbar)
    front: [{ t: 'ivy', x: 0, w: 10, h: 3 }] },
  // nicht sichtbar: c:[-1533.8,692.5], c:[-1546,705.2], c:[-1559.6,719.6], c:[-1507,669.7], c:[-1540.1,697.8], c:[-1507.3,710.9], c:[-1442.2,687.8],
  //   c:[-1466.6,635.3], c:[-1323,547.8], c:[-1312.3,464.3] (Hauptstraße: Stützmauern/Wald)
  // ===== Römerstraße (Bamlach, Gewerbe/Feldweg) – Street View Apr 2022 =====
  // Nr. 2/4 (Kienzler Metalltechnik: Werkstatt, Büro, Garage, Halle mit Ladezone): eigenes Modell in kienzler.js
  { c: [-297.6, 216], wall: 0xf2f0ea, roof: 0x9a4a32, look: 'roller',                                        // weißes Wohnhaus, rotbraunes Dach, Holzbalkon
    front: [{ t: 'balcony', x: 0, w: 6, y: 2.7, d: 1.3, rail: 'wood', color: 0x7a4a2e }] },
  { c: [-303.8, 292.1], wall: 0xf2ecd2, roof: 0x8a4a36, look: 'roller' },                                     // Nr. 1: hellcreme, braunes Ziegeldach, graue Tür
  { c: [-302.1, 284.3], wall: 0xe8e4d8, roof: 0x6a6866, look: 'plain',                                        // Garage, dunkelgraues Tor
    front: [{ t: 'garage', x: 0, w: 2.5, h: 2.2, color: 0x5a5c60, style: 'sectional' }] },
  { c: [-339.2, 322.8], wall: 0xeee2c8, roof: 0x4e4a48, look: 'roller' },                                     // beige, anthrazit Ziegel
  { c: [-333.2, 306.7], wall: 0xeee2c8, roof: 0x4e4a48, look: 'plain',                                        // beiger Garagenbau, anthrazit Dach
    front: [{ t: 'garage', x: 0, w: 2.6, h: 2.2, color: 0xe8e4dc, style: 'sectional' }] },
  { c: [-421.6, 497.3], wall: 0x5a4030, roof: 0x6a6866, look: 'plain', eave: 2.8, pitch: 10 },               // Holz-Stallungen, Wellblechdach
  { c: [-420.1, 484.1], wall: 0x5a4030, roof: 0x7a7470, look: 'plain', eave: 2.8, pitch: 10 },               // Holz-/Wellblech-Unterstände
  // nicht sichtbar: c:[-342.1,293.4], c:[-351.2,304.8] (nur Dach), c:[-281.9,322.1], c:[-240,361.1], c:[-238.6,354.8],
  //   c:[-216.4,354.3], c:[-212.4,349.5] (Campingplatz-Bereich, nicht von der Straße)
  // ===== Salzbrunnenstraße (Bamlach) – keine Google-Auto-Abdeckung, nur Nutzer-Photospheres „N.“ (Sep/Dez 2024, Abendlicht) =====
  { c: [-27.2, -65.7], wall: 0xeee2cc, roof: 0x7a4a36, look: 'shutter', shutters: 0x6a3226,                          // Eckhaus: creme, rotbraune Läden, Sandsteingewände, Holz-Garagentor
    front: [{ t: 'garage', x: 5, w: 2.5, h: 2.3, color: 0x4a3426, style: 'wood' },
            { t: 'balcony', x: 0, w: 4, y: 2.7, d: 1.2, rail: 'metal', color: 0xeeeeea, face: 'E' }] },
  { c: [-4.1, -62], wall: 0xf2ebdc, roof: 0x8a4a36, look: 'modern', plinth: 0xd8c8b8,                               // Reihe: weißer Teil (Nr. 2) und cremefarbener Teil mit braunen Läden zur Rathausstraße; dunkelbraune Holzfenster, 2 braune Garagentore, Giebel mit Läden
    front: [{ t: 'garage', x: 6, w: 2.8, h: 2.3, color: 0x5a3e2a, style: 'wood' },
            { t: 'garage', x: -3, w: 1.8, h: 2.1, color: 0x5a3e2a, style: 'wood' },
            { t: 'balcony', x: -4.5, w: 3, y: 2.7, d: 1.0, rail: 'wood', color: 0x3e2c22 },
            { t: 'panel', x: -9, w: 3.5, y0: 0, y1: 'eave', color: 0x3e3028, boards: true, ground: true }] },
  { c: [-18, -86.3], wall: 0xf0eee6, roof: 0x7a4a36, look: 'shutter', shutters: 0x5e7a4a,                           // Bauernhaus: weißer Wohnteil mit grünen Läden + schwarzbraune Holzscheune
    front: [{ t: 'panel', x: 7, w: 9, y0: 0, y1: 'eave', color: 0x2e2620, boards: true, ground: true },
            { t: 'door', x: 7, w: 3.0, h: 3.2, color: 0x2e2620, boards: true },
            { t: 'garage', x: 0.5, w: 2.4, h: 2.2, color: 0x5a3a24, style: 'wood' },
            { t: 'door', x: -2.5, w: 1.0, h: 2.1, color: 0x8a5a3a }] },
  { c: [-5.6, -110.8], wall: 0xf1efe8, roof: 0x7a4a36, look: 'shutter', shutters: 0x4a5866, plinth: 0xb89c80 },    // weißer Rauputz, schiefergraue Läden, Gaube, Eingangsvordach, PV
  { c: [8.4, -100], wall: 0xf3f2ee, roof: 0x6a3a2e, look: 'shutter', shutters: 0x6a3a2a, plinth: 0xd9a890,         // weiß, braune Läden, lachsrosa Sockel, Rundbogen-Kellertür, Efeu an Ecke
    front: [{ t: 'door', x: -2, w: 1.2, h: 2.0, color: 0x5a3424, boards: true },
            { t: 'ivy', x: -4.5, w: 1.2, h: 6 }] },
  { c: [6.6, -82.1], wall: 0xf1efe8, roof: 0x8a4a36, look: 'modern' },                                               // Bungalow, flaches Dach, Holzblende, große Fenster
  { c: [20.7, -116.9], wall: 0xf2f0ea, roof: 0x7a4a36, look: 'shutter', shutters: 0x6a2e2a, plinth: 0xb9a49a,       // weiß, dunkelrote Läden, Holzbalkon Südseite, Rundbogen-Kellertür
    front: [{ t: 'balcony', x: 0, w: 4.5, y: 2.5, d: 1.5, rail: 'wood', color: 0x6a4026, posts: true, face: 'S' }] },
  { c: [19.2, -95.3], wall: 0xf0eee8, roof: 0x5e3a2e, look: 'roller', plinth: 0xb88a70, eave: 5.5, pitch: 40 },     // weiß, dunkles Dach mit Gauben, Holzpergola, lachsbrauner Sockel
  { c: [32.2, -98], wall: 0xf0efea, roof: 0x6a6866, look: 'plain',                                                   // Doppelgarage weiß, weiße Sektionaltore
    front: [{ t: 'garage', x: -1.4, w: 2.5, h: 2.2, color: 0xf0f0ec, style: 'sectional' },
            { t: 'garage', x: 1.4, w: 2.5, h: 2.2, color: 0xf0f0ec, style: 'sectional' }] },
  { c: [1, -132.5], wall: 0xeeeeea, roof: 0x5e3a2e, look: 'plain',                                                   // Doppelgarage mit Giebel/Fenster, graublaue Sektionaltore
    front: [{ t: 'garage', x: -1.5, w: 2.6, h: 2.3, color: 0x7d8c9c, style: 'sectional' },
            { t: 'garage', x: 1.5, w: 2.6, h: 2.3, color: 0x7d8c9c, style: 'sectional' }] },
  { c: [11.5, -146.8], wall: 0xf0ebdc, roof: 0x5e3a2e, look: 'roller',                                               // weiß-creme, dunkles Dach, Holzbalkon am Giebel
    front: [{ t: 'balcony', x: 0, w: 4, y: 2.7, d: 1.2, rail: 'wood', color: 0xa86a3a }] },
  { c: [54.5, -203.5], wall: 0xe6e6e2, roof: 0x8a4a36, look: 'modern' },                                             // hellgrauer Rauputz, dunkelblaue Holzfenster, Glasgiebel, PV
  { c: [59.3, -210.3], wall: 0xa64a3c, roof: 0x6a3a2e, look: 'plain',                                                // rot gestrichenes Garagengebäude, 2 weiße Tore
    front: [{ t: 'garage', x: -1.5, w: 2.5, h: 2.2, color: 0xf0f0ec, style: 'sectional' },
            { t: 'garage', x: 1.5, w: 2.5, h: 2.2, color: 0xf0f0ec, style: 'sectional' }] },
  { c: [57.4, -216], wall: 0x7a5a3e, roof: 0x6a4a3a, look: 'plain',                                                  // Holzgarage (Bretter), graues Sektionaltor
    front: [{ t: 'garage', x: 0, w: 2.6, h: 2.2, color: 0x5a6068, style: 'sectional' }] },
  { c: [64.5, -230.1], wall: 0xeee6d2, roof: 0x5e3a2e, look: 'roller',                                               // „Haus Panorama“: hell beige, Gauben, Glasbalkon 1. OG
    front: [{ t: 'balcony', x: 0, w: 9, y: 2.7, d: 1.3, rail: 'glass' }] },
  { c: [67.1, -242.2], wall: 0xf0eee6, roof: 0x6a6866, look: 'modern', eave: 3.2, pitch: 3 },                       // weißer Flachdach-Anbau, braune Tür
  { c: [81.3, -249.5], wall: 0xb08a5a, roof: 0x5e5a56, look: 'plain' },                                              // offener Holz-Carport
  { c: [90.4, -193], wall: 0xf2f0ea, roof: 0x6a3a2e, look: 'roller' },                                               // weiß, dunkelrotbraunes Dach (nur von weitem)
  { c: [77.6, -197.7], wall: 0xe8dcc8, roof: 0x6a6866, look: 'plain' },                                              // Flachdachgarage, beiger Putz
  // nicht sichtbar: c:[100.7,-212.7], c:[60.9,-239.4], c:[69.3,-245.6], c:[70.1,-253.5], c:[95.7,-227.9], c:[98.9,-233.6],
  //   c:[36,-95.7], c:[53.7,-122.8], c:[32.7,-111.1], c:[27.9,-111.7], c:[41.4,-105.5], c:[36.1,-108.4], c:[32.5,-88.4],
  //   c:[-13.2,-111.3], c:[8.4,-66], c:[67,-133.9] (Hecken/Bäume, Hinterhof)
  // ===== Schafgässle ===== (nur Nutzer-Photospheres „N.“, Aufnahme Sep 2024; keine offizielle Street-View-Abdeckung)
  { c: [-100.1, 40.9], wall: 0xf2f2ee, roof: 0x5e3a2e, look: 'small' },                                               // weißes Giebelhaus mit Kamin
  { c: [-98.3, 60.7], wall: 0xf0f0ec, roof: 0x6a6866, look: 'plain',                                                   // Flachdach-Nebengebäude weiß, verwittertes Holztor
    front: [{ t: 'door', x: 0, w: 2.6, h: 2.3, color: 0x6e5a44, boards: true }] },
  { c: [-117.1, 64.1], wall: 0xb0ab9f, roof: 0x8a4430, look: 'plain' },                                                // lange alte Scheune grau verputzt, offene Holzlege, altes Ziegeldach
  { c: [-121.1, 37.8], wall: 0xe8e8e6, roof: 0x6a6866, look: 'plain',                                                  // Garage weiß, Metall-Rolltor
    front: [{ t: 'garage', x: 0, w: 5, h: 2.6, color: 0x9a9c9e, style: 'sectional' }] },
  { c: [-128.7, 44.2], wall: 0xe8e8e6, roof: 0x6a6866, look: 'plain',                                                  // Garage weiß, Metall-Rolltor
    front: [{ t: 'garage', x: 0, w: 4, h: 2.6, color: 0x9a9c9e, style: 'sectional' }] },
  { c: [-139.7, 47.4], wall: 0xf0efea, roof: 0x7a3b2a, look: 'plain' },                                                // weiße Giebelwand ohne Fenster
  { c: [-144.7, 45.4], wall: 0xf0efea, roof: 0x7a3b2a, look: 'plain' },                                                // weißer Anbau
  { c: [-146.1, 34.5], wall: 0xf2f0ea, roof: 0x7a3b2a, look: 'shutter', shutters: 0x4a3426 },                           // weiß, ockerfarbene Fenstergewände, dunkelbraune Läden
  { c: [-157.2, 47.6], wall: 0xf2f0ea, roof: 0x7a3b2a, look: 'shutter', shutters: 0x4a3426, plinth: 0xe0b878 },          // weißer Rauputz, ockergelbe Gewände, dunkelbraune Läden
  { c: [-181.3, 55.6], wall: 0xf2e6c0, roof: 0x5e3a2e, look: 'roller', plinth: 0xe2c4b4,                               // cremegelb, rosa Garagengeschoss mit 3 braunen Toren
    front: [{ t: 'garage', x: -3.3, w: 2.5, h: 2.2, color: 0x6a5644, style: 'sectional' }, { t: 'garage', x: 0, w: 2.5, h: 2.2, color: 0x6a5644, style: 'sectional' },
            { t: 'garage', x: 3.3, w: 2.5, h: 2.2, color: 0x6a5644, style: 'sectional' }] },
  // nicht sichtbar: c:[-92.4,38], c:[-110.3,32.3], c:[-102,33.7], c:[-124.4,36.7], c:[-134.8,27.3], c:[-154.9,36], c:[-178.2,67.6]
  // ===== Schloßstraße (Gruppe E) – Street View Apr 2022 (Google-Auto), Fußweg-Abschnitt nur Nutzer-Photospheres Aug 2024 =====
  { c: [-1407.5, 624.6], wall: 0xf1e9d3, roof: 0x8a4a36, look: 'small', plinth: 0xb8ad98 },                         // Schloss Rheinweiler (Heim): cremegelb, Rundturm, weiße Sprossenfenster
  { c: [-1342.8, 606], wall: 0xf1ece2, roof: 0x6e4434, look: 'shutter', shutters: 0x5a3a2a, plinth: 0xc08a6a,          // weiß, braune Läden, lachs/terrakotta Sockelgeschoss
    front: [{ t: 'balcony', x: 0, w: 7.5, y: 2.7, d: 1.2, rail: 'wood', color: 0x4e3426, face: 150 },
            { t: 'garage', x: 0.8, w: 2.4, h: 2.2, color: 0x4a3424, style: 'wood', face: 'W' }] },
  { c: [-1337.6, 642.3], wall: 0xb5a891, roof: 0x8a4a36, look: 'stone',                                               // Nr. 16: Bruchstein-Scheune mit Rundbogen-Holztor, gelber Wohnteil
    front: [{ t: 'door', x: 0, w: 2.6, h: 3.0, color: 0x4a3a2c, boards: true }] },
  { c: [-1351.3, 646], wall: 0xa39e94, roof: 0x8a4a36, look: 'small',                                                 // Stampfbeton-Ökonomiegebäude, OG graue Holzschalung, Garagentor weiß
    front: [{ t: 'panel', x: 0, w: 12, y0: 3.2, y1: 'eave', color: 0x7f776c, boards: true }] },
  { c: [-1364.1, 652.8], wall: 0xc4a46c, roof: 0x7a4a36, look: 'shutter', shutters: 0xb06a2c, plinth: 0x9a8f80 },     // Nr. 12: ockerfarbener Rauputz, Natursteingewände/-ecken, naturholz Läden
  { c: [-1374.9, 659], wall: 0x5f5e64, roof: 0x5e4a40, look: 'shutter', shutters: 0x8a82b8 },                         // anthrazitgrau, Stufengiebel, lila/violette Läden
  { c: [-1387, 674.2], wall: 0xf2f0ea, roof: 0x6a4434, look: 'shutter', shutters: 0x3f6b45 },                         // Nr. 8: weiß, grüne Läden, Walmdach dunkelbraun
  { c: [-1393.9, 666.2], wall: 0xeeece4, roof: 0x8a4a36, look: 'plain',                                                // weißer Flachbau-Anbau (Terrasse oben)
    front: [{ t: 'door', x: 0, w: 1.0, h: 2.0, color: 0xd8d6cf }] },
  { c: [-1403.4, 672.4], wall: 0xe3d7bd, roof: 0x7a4a36, look: 'roller', plinth: 0x7a6656,                            // Nr. 6: beige, weiße Fenster, brauner Sockel, Holz-Glas-Giebelvorbau
    front: [{ t: 'balcony', x: -2, w: 4, y: 2.7, d: 1.2, rail: 'wood', color: 0x7a5232 }] },
  { c: [-1397.9, 704.1], wall: 0xe8d2be, roof: 0x7a4a36, look: 'modern', plinth: 0xb59f86 },                          // hell lachsbeiger Rauputz, braune Holzfenster, PV auf Dach
  { c: [-1434.2, 681.6], wall: 0xcac4b5, roof: 0x6a6866, look: 'plain', plinth: 0x7f8790, eave: 4.5, pitch: 8 },      // Schloss-Wirtschaftsanbau: beigegraue Paneele, blaugraues Trapezblech unten
  { c: [-1358.9, 612.4], wall: 0xe6e2d6, roof: 0x8a4a36, look: 'small', skylights: 2, skylightSide: 1 },              // langer heller Nebenbau, 2 Dachfenster Südseite
  { c: [-1358.3, 594.3], wall: 0x5a5048, roof: 0x5e4a40, look: 'plain' },                                             // dunkle Garage
  { c: [-1322.7, 597.9], wall: 0xf2f2ee, roof: 0x9a4a32, look: 'modern', plinth: 0x9a9890 },                          // weiß, anthrazit Fenster, Gaube, PV
  { c: [-1334.8, 589.6], wall: 0xeee6d2, roof: 0x5a5654, look: 'modern' },                                            // hell beige, dunkles Dach (nur teilweise sichtbar)
  { c: [-1333.2, 595.6], wall: 0xf0efea, roof: 0x6a6866, look: 'plain',                                               // Garage, anthrazit Sektionaltor
    front: [{ t: 'garage', x: 0, w: 2.5, h: 2.2, color: 0x6a6c6e, style: 'sectional' }] },
  { c: [-1326.1, 616.3], wall: 0x5a4030, roof: 0x7a4a36, look: 'plain',                                               // Holzschuppen dunkelbraune Bretter
    front: [{ t: 'panel', x: 0, w: 4, y0: 0, y1: 'eave', color: 0x5a4030, boards: true, ground: true }] },
  { c: [-1312.6, 613], wall: 0xd8cdb8, roof: 0x7a4a36, look: 'small',                                                 // hinter Hecke, Wand mit Efeu
    front: [{ t: 'ivy', x: -3, w: 3, h: 5 }] },
  { c: [-1302.1, 615.7], wall: 0xc9bfac, roof: 0x8a4a36, look: 'plain' },                                             // Scheune hinter Bäumen, Natursteinsockel
  { c: [-1294.6, 624.8], wall: 0xe8e0cc, roof: 0x6a6866, look: 'plain' },                                             // Flachdachgarage hell
  { c: [-1335, 658.2], wall: 0xf2f0ea, roof: 0x9a4a35, look: 'small',                                                 // kleiner weißer Nebenbau, rotes Ziegeldach, Dachfenster, Glastür
    front: [{ t: 'door', x: 0, w: 1.4, h: 2.2, color: 0xe8e8e2, glass: true }] },
  { c: [-1317.6, 665.2], wall: 0xa87a50, roof: 0x8a6a50, look: 'plain' },                                             // offener Holz-Carport/Pergola (Nr. 18)
  // nicht sichtbar: c:[-1364,628.6] + c:[-1369.6,632.6] (in Street View verpixelt/blurred),
  //   c:[-1299.6,600.1], c:[-1308.4,588.1], c:[-1328.9,576.6], c:[-1316.7,592.7], c:[-1347.6,598.8], c:[-1367.1,620.9],
  //   c:[-1392.2,680.4], c:[-1351.5,667.6], c:[-1289.7,622.7], c:[-1287.8,620.2], c:[-1432.7,700.1] (hinter Gebäuden/Hecken)
  // ===== Schulstraße ===== (Rheinweiler; Google Street View Apr 2022)
  // Nr. 10 Kindergarten: eigenes Modell in kiga-rheinweiler.js
  // Sonnenrainschule (Halle, Altbau, Erweiterung, Betonturm): eigenes Modell in schule.js
  { c: [-1244.8, 761.2], wall: 0xe8e8e4, roof: 0x8a8a86, look: 'plain' },                                              // weiße Blechgarage
  { c: [-1264, 757.9], wall: 0xf1f0ec, roof: 0x5e3a2e, look: 'small', plinth: 0xc9bfae,                               // Nr. 8: weiß, Fenster mit Sandsteingewände, braunes Garagentor
    front: [{ t: 'garage', x: 5, w: 3.6, h: 2.3, color: 0x5a3a2a, style: 'sectional' }] },
  { c: [-1279, 756.4], wall: 0xf4f3ef, roof: 0x7a3b2a, look: 'shutter', shutters: 0x8a3a2a },                           // weiß, rotbraune Läden, steiles Satteldach
  { c: [-1306.5, 752.5], wall: 0x7a6248, roof: 0x5a6a4a, look: 'plain', eave: 2.4, pitch: 15 },                         // offener Holzunterstand (Brennholz, Wagenrad)
  { c: [-1305, 771.8], wall: 0xebebe8, roof: 0x6a4a3a, look: 'shutter', shutters: 0x4a3a30, plinth: 0xb8b5ad },          // Nr. 6: weißer Rauputz, dunkelbraune Läden, Sandsteingewände
  { c: [-1295.2, 775.1], wall: 0xebebe8, roof: 0x6a4a3a, look: 'shutter', shutters: 0x4a3a30, plinth: 0xb8b5ad },        // Osthälfte Nr. 6, Holzvordach über Tür
  { c: [-1328.1, 769.4], wall: 0xddd2bd, roof: 0x6a4a3a, look: 'small' },                                              // niedriger Anbau beige
  { c: [-1337.9, 769.5], wall: 0xd9d2c2, roof: 0x6a4a3a, look: 'shutter', shutters: 0x2f5a3e, plinth: 0xb8b4ac },        // Nr. 4: graubeiger Rauputz, grüne Läden, Gauben
  { c: [-1377.8, 769.3], wall: 0xeef0f0, roof: 0x4e4a48, look: 'shutter', shutters: 0x3d5378, plinth: 0x3d5378 },        // Nr. 2: weiß, dunkelblaue Läden und Sockel
  { c: [-1390.4, 767.8], wall: 0xf0eee8, roof: 0x7a3b2a, look: 'small' },                                              // weißes Haus mit Kamin (ALKIS Garage)
  // nicht sichtbar: c:[-1261.4,746.8], c:[-1315.5,786.6], c:[-1326.1,788.8], c:[-1320.6,798.5], c:[-1310.5,796.2], c:[-1195.3,719.8], c:[-1396.9,767.8]
  // ===== St.Alban (Bamlach) – keine Google-Auto-Abdeckung, nur Nutzer-Photospheres „N.“ (Sep/Dez 2024, Abendlicht) =====
  { c: [-222, 22.3], wall: 0xe8e8e4, roof: 0x3e3a3a, look: 'modern', skylights: 4, skylightSide: -1,                       // 3-geschossig, hellgrau-weiß, Wandmalerei (Fisch) im EG, braune Rollläden
    front: [{ t: 'balcony', x: 0, w: 8, y: 2.7, d: 1.2, rail: 'metal', color: 0x4a4a4a }] },
  { c: [-230.8, 14.4], wall: 0xf0efea, roof: 0x6a6866, look: 'plain' },                                                   // weiße Garage/Anbau
  { c: [-212.6, -1.3], wall: 0x9a5a32, roof: 0x9a4a32, look: 'plain', plinth: 0xe8e4dc,                                   // Holzschuppen, senkrechte orangebraune Bretter, roter Ziegel
    front: [{ t: 'panel', x: 0, w: 6, y0: 0.6, y1: 'eave', color: 0x9a5a32, boards: true }] },
  { c: [-226.2, -7], wall: 0xeeeae2, roof: 0x6a3a2e, look: 'modern' },                                                    // weiß, Holzfenster
  { c: [-197.0, -11.2], skip: 12 }, // Hofgut mit Wohnhaus, Scheune und Kastanienhof: eigenes Modell in stalban.js (Umriss nach LoD2, fixStAlban)
  { c: [-213.0, -2.0], skip: 4 },   // Holzschopf an der Straße: eigenes Modell in stalban.js
  { c: [-208.6, -11.15], skip: 4 },  // Pultdach-Anbau an der Westseite der Scheune: eigenes Modell in stalban.js
  { c: [-184.1, -15.8], wall: 0xf2f0ea, roof: 0x9a4a32, look: 'shutter', shutters: 0x6a2e2a },                            // weiß, dunkelrote Läden, PV (hinter Baum, Zuordnung unsicher)
  { c: [-205.3, 11.7], wall: 0xeceae4, roof: 0x6a6866, look: 'plain' },                                                   // weiße Garage
  { c: [-250.3, 1.4], wall: 0xf0e2b8, roof: 0x7a4a36, look: 'roller', plinth: 0xc8964a },                                 // blassgelb, ockerfarbene Fensterfaschen/Sockel
  { c: [-259.8, -1.7], wall: 0xf0e2b8, roof: 0x7a4a36, look: 'roller', plinth: 0xc8964a,                                  // blassgelber Anbau mit braunem Garagentor + Glas-Wintergarten
    front: [{ t: 'garage', x: -1, w: 2.4, h: 2.2, color: 0x5a3e2e, style: 'wood' },
            { t: 'glazing', x: 3, w: 4, y0: 0, y1: 2.6, frame: 0xf0f0ec }] },
  { c: [-280.2, -15.9], wall: 0x4a3a2e, roof: 0x9a4a32, look: 'plain', eave: 4, pitch: 40 },                              // dunkle Holzscheune, rotes Ziegeldach
  { c: [-272.2, -19.5], wall: 0xe8e4dc, roof: 0x9a4a32, look: 'plain' },                                                  // kleiner Schuppen, rotes Dach
  { c: [-248.3, -22.8], wall: 0xf3efe6, roof: 0x8a4a36, look: 'modern',                                                   // weiß-creme, Holzbalkone mit Markisen (Westseite)
    front: [{ t: 'balcony', x: 0, w: 6, y: 2.7, d: 1.3, rail: 'wood', color: 0x6a4a36, face: 'W' },
            { t: 'balcony', x: 0, w: 6, y: 5.4, d: 1.3, rail: 'wood', color: 0x6a4a36, face: 'W' }] },
  { c: [-232.9, -12.6], wall: 0xecd4cc, roof: 0xb05a3a, look: 'modern' },                                                 // hell rosa, orange Ziegel, Gauben, Holzfenster (2024 eingerüstet)
  { c: [-248.5, -38.9], wall: 0x5a4636, roof: 0x9a4a32, look: 'plain' },                                                  // offene Holzscheune, rotes Dach
  // nicht sichtbar: c:[-197.9,21.4], c:[-269.7,19.2], c:[-208.4,-11], c:[-231.5,-33.2], c:[-221.1,-24.7],
  //   c:[-221.3,-36.7], c:[-214.5,21.5], c:[-254.1,13.9], c:[-250.7,19.2], c:[-209.9,-29.5], c:[-216.1,-21.4], c:[-229.7,34.6]
  // ===== Storchengasse ===== (nur Nutzer-Photospheres „N.“, Aufnahme Sep 2024; keine offizielle Street-View-Abdeckung)
  // Gasthof Storchen c:[-73.5,-57]: eigenes Modell in storchen.js
  { c: [-51, -62.6], wall: 0xf0f0ee, roof: 0x8a4430, look: 'shutter', shutters: 0x4a3a40, plinth: 0xb8963a },             // weißer Rauputz, aubergine Läden, hoher ockergelber Sockel, Balkone Südseite
  { c: [-43.4, -63.6], wall: 0xf2f0ea, roof: 0x8a4430, look: 'shutter', shutters: 0x5a3a24,                             // weißes Wohnhaus mit angebauter Scheune (dunkles Holztor)
    front: [{ t: 'door', x: 3, w: 3.2, h: 3.2, color: 0x3e2e24, boards: true }] },
  { c: [-41.8, -71.8], wall: 0xf2f2ee, roof: 0x8a4430, look: 'small', eave: 6, pitch: 50 },                            // hoher weißer Giebel hinter Scheune
  { c: [-70.1, -76.9], wall: 0xf2f0e8, roof: 0x8a4430, look: 'small', plinth: 0xa8a070,                                // Scheunenhaus: weiß, Mitte dunkle Bretter mit Storch-Figur
    front: [{ t: 'panel', face: 'E', x: 1, w: 5, y0: 0, y1: 'eave', color: 0x4a3426, boards: true, ground: true }] },
  { c: [-66.9, -89.2], wall: 0xefeee8, roof: 0x8a8a7a, look: 'plain',                                                  // Flachdachgarage weiß, braunes Holztor, Dachterrasse
    front: [{ t: 'garage', face: 'E', x: 0, w: 2.6, h: 2.2, color: 0x5e4630, style: 'wood' }] },
  { c: [-67.5, -85], wall: 0xefeee8, roof: 0x8a8a7a, look: 'plain' },                                                  // Anbau an Garage
  { c: [-48.6, -86], wall: 0x9a6236, roof: 0x6a6866, look: 'plain' },                                                  // Holzschuppen orangebraune Bretter
  { c: [-70.9, -96.5], wall: 0xe6d2c0, roof: 0x6a5a50, look: 'roller' },                                               // hell-lachsbeige, graue Gaube
  { c: [-59.4, -111.4], wall: 0xe6d2c8, roof: 0x8a4430, look: 'roller',                                                // Nr. 1: rosébeige, Vordach rot, weißes Garagentor
    front: [{ t: 'garage', x: -3, w: 2.6, h: 2.2, color: 0xeeeeea, style: 'sectional' }] },
  { c: [-42.2, -103.4], wall: 0xf0efea, roof: 0x8a4430, look: 'shutter', shutters: 0x5a3a3a, plinth: 0xd8c8c0 },         // weißer Rauputz, braune Läden, Rundbogentür
  { c: [-33.9, -94.4], wall: 0xd4a08c, roof: 0xa85a3a, look: 'stone',                                                  // rötlicher Sandstein, Holzbalkon, Giebel mit Holz
    front: [{ t: 'balcony', face: 'W', x: 0, w: 4, y: 2.7, d: 1.2, rail: 'wood', color: 0x6a4a32 }] },
  { c: [-31.1, -116.2], wall: 0x8a7458, roof: 0x6a6866, look: 'plain' },                                               // großer Holzschuppen (senkrechte Bretter)
  { c: [-31.5, -123.4], wall: 0x4e3a2a, roof: 0x8a4430, look: 'plain' },                                               // alte dunkle Holzscheune
  { c: [-52.3, -123.7], wall: 0xe8dcc4, roof: 0x7a3b2a, look: 'small' },                                               // Nr. 3: hellbeige, weiße Fenster
  { c: [-41.8, -138.1], wall: 0x9c8a68, roof: 0x7a3b2a, look: 'stone' },                                               // Bruchstein-Scheune mit Rundbogen
  { c: [-17.7, -153.1], wall: 0xf4f4f0, roof: 0x5e3a2e, look: 'roller' },                                              // weiß, braune Rollläden, Giebelbalkon
  { c: [-52.9, -153.5], wall: 0xf0eeea, roof: 0x5e3a2e, look: 'small' },                                               // weißes Haus (Gegenlicht)
  // nicht sichtbar: c:[-19.2,-115.8], c:[-82.6,-86.8], c:[-78.8,-75.7], c:[-52.1,-134.7]
  // ===== Vogesenstraße =====
  // Google Street View (Apr 2022) nur an der Einmündung Im Rebgärtle (Westende). Straße selbst nur über Nutzer-Panoramen "N."
  // (Aufnahme Sep 2024, Ausrichtung ±10° unsicher). Teils Gegenlicht (Abendsonne) → Farben im Osten unsicherer.
  { c: [20.7, -311.2], wall: 0xf4f4f0, roof: 0x4a4040, look: 'roller',                                             // Eck-Mehrfamilienhaus: weiß, dunkles Dach, Balkone mit dunkelbraunem Geländer + Blumenkästen
    front: [{ t: 'balcony', x: -2, w: 8, y: 5.4, d: 1.4, rail: 'wood', color: 0x4a3a30 }, { t: 'balcony', x: 3, w: 6, y: 2.7, d: 1.4, rail: 'wood', color: 0x4a3a30 }] },
  { c: [54.2, -327], wall: 0xf2eada, roof: 0x8a4a35, look: 'roller',                                              // cremeweiß, rotbrauner Ziegel, orange-brauner Holzbalkon im OG
    front: [{ t: 'balcony', x: 1, w: 4, y: 2.7, d: 1.2, rail: 'wood', color: 0xb06a3a }] },
  { c: [43.9, -289.5], wall: 0xefefec, roof: 0x4e4a48, look: 'roller' },                                           // weiß, dunkles Dach mit PV (nur hinter Hecke sichtbar)
  { c: [100.9, -288.5], wall: 0xbccad6, roof: 0x8a4a35, look: 'roller',                                           // pastell-hellblau, rotbraunes Ziegeldach mit PV, weißer Balkon (Metallgeländer) am Südgiebel
    front: [{ t: 'balcony', x: -2.5, w: 3.5, y: 2.7, d: 1.2, rail: 'metal', color: 0xe0e0e0 }] },
  { c: [98.4, -278.2], wall: 0xf2f2f0, roof: 0xdde2e6, look: 'plain' },                                            // weißer Carport mit lichtdurchlässigem Flachdach
  { c: [123.8, -275.5], wall: 0xf4f4f0, roof: 0x6a3e2e, look: 'roller',                                            // weiß, braunes Dach mit PV, Balkon am Westgiebel
    front: [{ t: 'balcony', face: 'W', x: 0, w: 3.5, y: 2.7, d: 1.2, rail: 'metal', color: 0xd8d8d8 }] },
  { c: [124.4, -233.9], wall: 0xe8e8e4, roof: 0x6e625a, look: 'roller' },                                          // Bungalow hellgrau-weiß, graubraunes Betonziegeldach (Gegenlicht)
  { c: [137, -242.6], wall: 0x5a4232, roof: 0x5e5a56, look: 'plain' },                                             // dunkelbrauner Holz-Carport
  // nicht sichtbar: c:[64.8,-325], c:[38.1,-295.4], c:[41.2,-333.5], c:[128.2,-264.4], c:[61.1,-321.5], c:[80.6,-261.8], c:[52.8,-269.9]
  // ===== Weingartenstraße (Rheinweiler) =====
  // Keine Google-Auto-Abdeckung in der Weingartenstraße selbst. Ostende von der Blansinger Straße aus (Apr 2022),
  // Südteil (Neubaugebiet) nur Nutzer-Photospheres ("N.", Jul–Sep 2024, Häuser noch im Bau / eingerüstet).
  { c: [-1463.1, 810.9], wall: 0xf2f0ea, roof: 0x7a4a3a, look: 'shutter', shutters: 0x8a9098 },             // langes weißes Haus, braunes Ziegeldach, graue Läden
  { c: [-1459.2, 809.9], wall: 0xf2f0ea, roof: 0x7a4a3a, look: 'shutter', shutters: 0x8a9098, eave: 6, pitch: 40 }, // (gleiches Haus, OSM-Umriss)
  { c: [-1455.7, 818.6], wall: 0xf2f2ee, roof: 0x4e4a48, look: 'roller', eave: 5.8, pitch: 40 },             // weiß, dunkles Dach mit holzverschalter Gaube, Holzbalkon
  { c: [-1502.1, 997.3], wall: 0xf2f2ee, roof: 0x6a6866, look: 'modern', eave: 6.3, pitch: 0 },               // Neubau 2024: weißer Kubus, Flachdach
  { c: [-1520, 986.3], wall: 0xb8b6b0, roof: 0x6a6866, look: 'modern', eave: 9, pitch: 0 },                   // Neubau-Mehrfamilienhaus 2024 im Rohbau (Betongrau, 3 Geschosse)
  { c: [-1521.6, 992], wall: 0xb8b6b0, roof: 0x6a6866, look: 'modern', eave: 9, pitch: 0 },                   // dto.
  { c: [-1553.4, 986.6], wall: 0xf2f2ee, roof: 0x6a6866, look: 'modern' },                                    // Neubau-Reihenhaus 2024, weiß verputzt (eingerüstet)
  { c: [-1574.2, 974.5], wall: 0xf4f4f2, roof: 0x6a6866, look: 'modern' },                                    // Neubau 2024: weißer Kubus, anthrazit Fenster
  { c: [-1575.8, 980], wall: 0xf4f4f2, roof: 0x6a6866, look: 'modern' },                                      // dto. (Doppelhaushälfte)
  { c: [-1589.4, 933.8], wall: 0xf0f0ec, roof: 0x4e4a48, look: 'plain' },                                     // weißer Nebenbau mit dunklem Satteldach (aus 46 m)
  // nicht sichtbar (keine Abdeckung): c:[-1476,830], c:[-1582.4,902.9], c:[-1488,822.5], c:[-1567.1,844], c:[-1571.7,876.3],
  //   c:[-1549.3,897.7], c:[-1592.8,921.5], c:[-1524.6,889.8], c:[-1522.2,811.3], c:[-1465.9,819.2], c:[-1477.6,814.6],
  //   c:[-1574.3,884.1], c:[-1467.3,813.5], c:[-1545.6,826], c:[-1525,876.9], c:[-1493.1,830.9], c:[-1519.8,850.5],
  //   c:[-1505.3,793.1], c:[-1460.6,776], c:[-1566.6,925.1], c:[-1560.7,927.7], c:[-1504,1015.4], c:[-1549.9,917.6], c:[-1481.3,821.7]
  // ===== Werbenweg =====
  // KEINE Google-Car-Abdeckung; nur ein Nutzer-Panorama ("N.", Jul/Sep 2024) an der Einmündung (S0.0). Ab S0.40 kein Panorama.
  { c: [-1361.9, 1038.8], wall: 0xa8a8a0, roof: 0x6a6866, look: 'plain',                                        // Betriebsgebäude am Funkmast: grauer Beton, fast ganz mit Efeu bewachsen
    front: [{ t: 'ivy', x: 0, w: 4, h: 4 }] },
  // nicht sichtbar / keine Abdeckung: c:[-1326.4,988.7], c:[-1317.7,1008.6], c:[-1366.6,1005] (nur winzig in 40 m), c:[-1339.4,1000.2], c:[-1318.7,937.9], c:[-1317.3,926.1]
  // ===== von-Andlaw-Straße =====
  // Keine Street-View-Abdeckung in der Straße selbst; nur Blick von der Rheinstraße (Google-Auto) über Hecken.
  { c: [175.4, -1114.7], wall: 0xf4f4f0, roof: 0x6a4a3a, look: 'roller' },                                    // weißes Haus, braunes Dach mit Gauben, Glasbalkon am Giebel
  { c: [158.3, -1106.4], wall: 0xc8844a, roof: 0xc8844a, look: 'plain' },                                     // Holz-Pergola/Carport (hell, lasiert)
  // nicht sichtbar: c:[180.8,-1082.8], c:[210.2,-1089.9], c:[225.1,-1116.7], c:[233.4,-1112.8], c:[201.1,-1124.1], c:[224.9,-1106.5],
  //   c:[199.6,-1070.8], c:[162.8,-1090.1] (hinter Hecke), c:[198.7,-1121.4], c:[170,-1106.4]
  // Hinweis: von der Rheinstraße (Pano bei c≈[156,-1137], Blick 75°) ist in ~40 m ein großes weißes Haus mit langem Holzbalkon,
  //   Gaube und PV zu sehen, für das es in den Daten nur Kleinst-Umrisse (c:[201.1,-1124.1], c:[198.7,-1121.4]) gibt.
  // ===== Ende Street-View-Agenten =====
];

// Fassaden zeigen zur nächsten benannten Straße
export function buildStrassen(scene, world) {
  const streets = world.data.roads.filter((r) => r.name && r.type !== 'footway' && r.type !== 'path' && r.type !== 'track').map((r) => r.pts);
  buildFronts(scene, world, STREET_OVERRIDES, streets);
}
