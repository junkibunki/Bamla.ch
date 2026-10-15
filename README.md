# Bamla.ch

3rd-Person-Open-World-Spiel in Bamlach und Rheinweiler (Markgräflerland) – im Browser, mit Three.js und Vite.
Karte aus OpenStreetMap, Gelände, Dächer, Reben und Beläge aus den Open-Data-Geodaten des LGL Baden-Württemberg,
Gebäude Haus für Haus nach Street View und Fotos.

**Jetzt spielen: [bamla.ch](https://bamla.ch)** – dort ist das Spiel gehostet und läuft im Multiplayer mit allen,
die gerade online sind.

## Starten

```bash
npm install
npm run dev
```

Dann http://localhost:5173 öffnen.

## Veröffentlichen

Das Spiel läuft im Browser: Rendering, Physik, Verkehr und NPCs rechnet jeder Client selbst.
Nur für den Multiplayer gibt es einen kleinen Server (siehe unten), ohne ihn läuft das Spiel allein weiter.
Für den Rest reicht ein statischer Webhost (Nginx, GitHub Pages, Netlify, …):

```bash
npm run build
```

Den Ordner `dist/` hochladen (enthält auch die Kartendaten aus `public/`, ca. 9 MB pro Erstaufruf; gzip/brotli
am Server verkleinert die JSON-Dateien deutlich). Der Karten-Editor speichert nur über den Dev-Server.

## Multiplayer

Beim Start gibt sich jeder Spieler einen Namen. Die Spieler sehen sich gegenseitig als Figur bzw. im Fahrzeug
mit Namensschild, als farbigen Punkt auf der Minimap und in der Liste oben rechts. Der Server
(`server/multiplayer.mjs`, WebSocket unter `/mp`) reicht nur Name und Position weiter (10× pro Sekunde);
Verkehr und NPCs bleiben pro Client. Im Dev-Server (`npm run dev`) läuft er automatisch mit.

Betrieb: Die GitHub Action lädt den Server nach `~deploy/bamla-mp/` und startet den systemd-User-Dienst
`bamla-mp` neu (Port 8787, nur localhost). Einmalig auf dem Server einrichten (Node ≥ 18 nötig):

```bash
sudo loginctl enable-linger deploy            # User-Dienste laufen ohne Login
# als deploy, nach dem ersten Deploy:
mkdir -p ~/.config/systemd/user && cp ~/bamla-mp/bamla-mp.service ~/.config/systemd/user/
systemctl --user daemon-reload && systemctl --user enable --now bamla-mp
```

Im Caddyfile im Block der Seite `reverse_proxy /mp 127.0.0.1:8787` ergänzen (WebSockets leitet Caddy von selbst weiter).

Belohnungen aus dem Dorfpass (`src/belohnungen.js`): Der Zustand trägt neben Titel (`ti`) auch Kleidung (`o`:
`helm`, `schuerze`, `golfmuetze`, `motorradjacke`, `schaerpe`) und im Fahrzeug die Lackfarbe (`lk`, 0xRRGGBB);
Ehrenbürger haben ein goldenes Namensschild. Weitere Nachrichten:

| Richtung | Nachricht | Bedeutung |
|---|---|---|
| Client → Server | `{ t: 'stand', n, voll }` | Zahl der erledigten Aufgaben, voller Dorfpass (nach dem Verbinden und jedem Abschluss) |
| Client → Server | `{ t: 'lieferung' }` | eine Lieferung fürs Dorfziel (höchstens eine alle 10 s pro Name) |
| Client → Server | `{ t: 'hupe', k }` | Hupe `hupe` / `storch` / `glocke` / `martinshorn` (höchstens alle 0,7 s) |
| Server → Client | `{ t: 'dorf', top, ehren, lief, ziel }` | Bestenliste (10 Plätze), Ehrenbürger (Tafel am alten Rathaus), Lieferungen aller Spieler, Ziel 50 |
| Server → Client | `{ t: 'feuerwerk', n, von }` | alle 50 Lieferungen: Feuerwerk über dem Rhein bei allen |
| Server → Client | `{ t: 'hupe', id, k }` | ein Mitspieler hupt (leiser mit der Entfernung) |

Bestenliste und Lieferzähler schreibt der eigenständige Server nach `~deploy/bamla-dorf.json` (anderer Pfad über
`DORF_STATE`); im Dev-Server leben sie nur im Speicher und sind nach einem Neustart weg.

Jede Anmeldung schreibt der Server als Zeile `Zeitpunkt (UTC) <Tab> Name` nach `~deploy/bamla-joins.log`
(anderer Pfad über die Umgebungsvariable `JOIN_LOG`); im Spiel wird das nicht angezeigt. Ansehen: `cat ~/bamla-joins.log`.
Auch ein Neuladen der Seite oder ein Wiederverbinden nach Verbindungsabbruch erzeugt eine Zeile.

## Rohdaten

Die Quelldaten (DGM1, LoD2, DOP20, zusammen mehrere hundert MB) liegen nicht im Repo (`data/` ist ignoriert).
Die daraus erzeugten Dateien in `public/` sind eingecheckt, zum Spielen werden die Rohdaten also nicht gebraucht.
Nur zum Neuerzeugen müssen sie wie unten beschrieben heruntergeladen werden.

## Karten-Editor (Taste B)

Von oben durch die Karte fahren (WASD / linke Maustaste ziehen, Q/E bzw. rechte Maustaste: drehen, Mausrad: Zoom),
Gebäude anklicken und die Art ändern: `1` Wohnhaus, `2` Garage, `3` Scheune, `4` Gartenhütte, `Entf` entfernen,
`0` wie generiert. `N` setzt eine neue Gartenhütte (Klick auf freien Boden), `M` verschiebt, `R` dreht sie; Größe,
Dachform und Farben im Bedienfeld. `Strg+Z` macht rückgängig. Entfernte Gebäude sind rot umrandet.
Jede Änderung wird sofort gebaut und vom Dev-Server nach `public/edits.json` geschrieben
(`scripts/edits-plugin.mjs`); die Datei gehört zu den Kartendaten und wird beim Laden angewendet (`src/edits.js`).
Häuser mit eigenem Modell (Spezialmodule wie Schule, Kirche, Feuerwehr) lassen sich hier nicht ändern.

Kartendaten neu laden (Overpass API): `npm run fetch-map` → schreibt `public/bamlach.json`.
Campingplatz (Stellplätze, Pools, Spiel-/Sportflächen): `npm run fetch-camping` → schreibt `public/camping.json`.

Gelände: Digitales Geländemodell DGM1 (1-m-Raster, ±15 cm, Laserscan 2019) vom
[Open GeoData Portal des LGL Baden-Württemberg](https://opengeodata.lgl-bw.de).
Die vier 2×2-km-Kacheln gehören nach `data/dgm/` (`dgm1_32_389_5284`, `…389_5286`, `…391_5284`, `…391_5286`,
Download: `https://opengeodata.lgl-bw.de/data/dgm/dgm1_32_<Ost>_<Nord>_2_bw.zip`).
`npm run build-terrain` erzeugt daraus `public/terrain.bin` (2-m-Höhenraster, 1 cm Auflösung).

Reben: aus den Luftbildern DOP20 (20 cm, Befliegung 2025, ebenfalls LGL) erkannt. Die Rebzeilen
(Abstand 1,6–2,8 m) werden per 2D-FFT in 12,8-m-Fenstern gefunden; Grün-Kontrast und Helligkeit
trennen sie von Mähschwaden und Bearbeitungsspuren. Die OSM-Rebflächen dienen zur Kalibrierung.
Neu erzeugen (≈ 800 MB Download, `dop20rgb_32_<Ost>_<Nord>_2_bw.zip` aus `https://opengeodata.lgl-bw.de/data/dop20/`,
Kacheln wie beim DGM, entpackt in einen Ordner):

```bash
node scripts/detect-vineyards.mjs <Ordner mit den .tif/.tfw>
```

Ergebnis: `public/vineyards.json` (6,4-m-Zellen mit Zeilenrichtung und -abstand).

Dächer: Form aus dem 3D-Gebäudemodell LoD2 des LGL (CityGML aus ALKIS-Grundriss + Laserscan; Kacheln nach
`data/lod2/`, Download `https://opengeodata.lgl-bw.de/data/lod2/LoD2_32_<Ost>_<Nord>_2_bw.zip`), Farbe und
PV-Anlagen aus den DOP20-Luftbildern 2025: Dachfarbe = Median der besonnten Dachflächen, PV = zusammenhängende,
rechteckige Bereiche, die deutlich blauer als der Dachziegel sind. LoD2-Gebäude werden den OSM-Umrissen über die
Flächenüberdeckung zugeordnet (Wände + Dach aus LoD2); in OSM fehlende Gebäude kommen hinzu.

```bash
node --max-old-space-size=8192 scripts/build-roofs.mjs <Ordner mit entpackten LoD2-.gml> <Ordner mit den DOP-.tif/.tfw>
```

Ergebnis: `public/roofs.json`. Einzelne Häuser können in `src/belchenstrasse.js` ihr eigenes Modell behalten (`lod: false`).

Straßenbeläge: OSM hat im Ort fast keine `surface`-Angaben. Geprüft an DOP20 und Street-View-/360°-Aufnahmen:
Hauptstraßen sind Asphalt, Storchengasse, Am Buck, Schafgässle, der Friedhofsweg und die Kindergarten-Zufahrt
gepflastert (`src/surfaces.js`), „Im Grund“ ist ein Schotterweg. Höfe, Einfahrten, Gehwege und Plätze erkennt
`scripts/detect-paving.mjs` in den DOP20-Kacheln: versiegelte Flächen ohne Gebäude/Vegetation, getrennt in Asphalt
(neutralgrau, Sättigung ≤ 9,5), Kies (hell, warm) und Betonpflaster (verwittert leicht bräunlich). Die Maske wird
nicht flächig gezeichnet, sondern nur abgefragt (`src/paving.js`): Pflastergassen und gepflasterte OSM-Einfahrten
werden saubere Bänder mit Fischgrätmuster. `src/streetside.js` legt zu jeder LoD2-Garage (ALKIS-Funktion 31001_2463)
eine gerade Einfahrt vom Tor zur Straße an (Belag und Steinfarbe aus der Maske) und setzt Buschgruppen in den
Grünstreifen am Straßenrand.

```bash
node scripts/detect-paving.mjs <Ordner mit den DOP-.tif/.tfw>
```

Ergebnis: `public/paving.png` (0,4 m/px, RGB = Farbe, A = Belag) + `public/paving.json`.

## Steuerung

| Taste | Aktion |
|---|---|
| Klick | Maus fangen (Kamera drehen) |
| WASD / Pfeile | laufen / fahren |
| Shift | rennen |
| Leertaste | springen / Handbremse |
| E | ein-/aussteigen (auch Verkehrsfahrzeuge übernehmen); Zug in Rheinweiler: an offener Tür ein-/aussteigen; im Bus: Haltewunsch, bei offenen Türen aussteigen; Schaukeln (Grillplatz, Kindergarten, Campingplatz): auf-/absteigen (Leertaste: Schwung holen) |
| R / Q | Gabel heben / senken (Gabelstapler) |
| X | hupen (im Fahrzeug; Klang im Dorfpass wählbar, Mitspieler hören mit) |
| J | Dorfpass: Stempel, Titel, Kleidung, Hupe, Lack, Postkarten, Bestenliste |
| Mausrad | Kamera-Zoom |
| H | Hilfe ein/aus |

## Aufbau

- `scripts/fetch-osm.mjs` – lädt Gebäude, Straßen, Flächen und wandelt Lat/Lon in lokale Meter um
- `src/terrain.js` – Höhenkarte und Geländemesh
- `src/vineyards.js` – Rebflächen auf dem Boden und Rebzeilen in 3D
- `src/world.js` – Bodentextur, Straßen, Bäume, Kollision, Wegenetze
- `src/bridges.js` – Brücken: Eisenbahnbrücken (OSM `bridge=yes` an Gleisen) und alles, was eine Unterführung (OSM `tunnel=yes` an Straßen, z. B. „Im Grund“ unter K 6347/Radweg und A5, Rotbergerstraße unter der A5, Fußweg und Feldweg unter der Bahn) überquert: gerades Deck mit Geländer und Widerlagern, Gelände unter der Brücke abgesenkt. Die LoD2-„Gebäude“ mit ALKIS-Funktion 53001 (Brücke) werden nicht als Haus gebaut
- `scripts/build-terrain.mjs`, `scripts/utm.mjs` – DGM1 (UTM32) → lokale Höhenkarte
- `scripts/detect-vineyards.mjs` – Rebflächen-Erkennung aus Luftbildern
- `scripts/build-roofs.mjs` – Dachformen (LoD2), Dachfarben und PV-Anlagen (DOP20) → `public/roofs.json`
- `scripts/detect-paving.mjs`, `src/paving.js`, `src/surfaces.js` – Straßenbeläge und Pflaster (DOP20 + Street View)
- `src/streetside.js` – Garageneinfahrten und Büsche am Straßenrand
- `src/buildings.js` – Häuser im Markgräfler Stil (Satteldach, Klappläden), Scheunen, Garagen, Kirche
- `src/strassen.js` – alle übrigen Straßen (Bamlach, Rheinweiler) Haus für Haus nach Street View (Google 2022, Nutzer-Panoramen 2024): Wandfarbe, Fensterart, Läden, Sockel, Fassadendetails; Straßen ohne Aufnahmen behalten die Zufallsgestaltung
- `src/belchenstrasse.js` – Belchenstraße Haus für Haus nach Street View (April 2022): Wandfarben, Fensterart (Klappläden in Hausfarbe, Rollläden, Altbaufenster), Sockel und Fassadendetails (Balkone, Garagen- und Scheunentore, Treppenhausturm, Eingangsvorbau, Ladenfront, Backstein-/Holzverkleidung, Efeu), verankert an den LoD2-Wänden; Hecken/Mauern am Straßenrand, Nr. 6 im Detail, Brunnen
- `src/camping.js` – Campingplatz „Lug ins Land“: Rezeption mit Balkonen, Freibad mit Teleskop-Überdachung, Kinderbecken, Badegäste, Wohnwagen/Wohnmobile/Zelte/Mobilheime/Schlaffässer auf den OSM-Stellplätzen, Spielplatz, Sportflächen
- `src/kirche.js` – Kirche St. Peter und Paul (Westturm mit Satteldach und Turmuhr in Echtzeit), Friedhof mit Westtor, Treppe von der Kirchstraße und Ostausgang nach Luftbild und Photo Spheres, Kolping-Krippe mit lebensgroßen Figuren hinter dem Chor, Pfarrer als NPC
- `src/feuerwehr.js` – Feuerwehrhaus und Tennis-Clubhaus am Nordende der Alten Weinstraße (Einmündung K6347) nach Street View
- `src/museum.js` – Oberrheinisches Bäder- und Heimatmuseum (Alte Weinstraße 25, Staffelgiebelhaus um 1600) nach Foto (Wikimedia Commons) und 360°-Aufnahme, Dachhöhen aus LoD2; Bushaltestelle „Bamlach“ (Glas-Wartehalle, Haltestellenschild, Leitbake) schräg gegenüber
- `src/schloss.js` – Schloss Rheinweiler (Schloßstraße 1, Barockschloss um 1715, seit 1928 Pflegeheim) nach Fotos (Wikimedia Commons, LABW) und Luftbild: LoD2-Bau mit gelbem Putz, türkisen Läden, Gauben, Turmportal und Kupferlaterne; Hofmauer mit Schmiedeeisentor, Schlossgarten, Streichelzoo (Zwergziegen, Hühner), Bewohnerin mit Rollator als NPC
- `src/schule.js`, `src/schule-site.js` – Sonnenrainschule (Grundschule Rheinweiler, Schulstraße) nach Fotos der Gemeinde, Projektfotos des Planungsbüros und Luftbild (DOP20), Maße aus LoD2: Altbau weiß mit roter Attika, zum Pausenhof rotes EG, blaues OG mit auskragendem Eingangskubus und Schullogo, Pausenkiosk; Sporthalle mit Pultdach, Kragbalken, hohen Fensterbändern, Gabionensockel und PV; Erweiterung als Holzbau auf Betonstützen mit Carport, Sichtbetonscheibe mit Rundfenster und Stahltreppe. Pausenhof (Rosskastanie, Tisch-Bank-Garnituren, Himmel und Hölle, Schachfeld) und Sporthof (Kleinspielfeld mit Ballfangzaun, Tischtennis, Sitzstufen, Kletterparcours), Gelände dort eingeebnet. Kinder spielen Fangen, Seilspringen, Hüpfspiel, Fußball (Ball lässt sich anschießen) und Tischtennis, hangeln, balancieren, klettern; zwei Lehrkräfte führen Pausenaufsicht und erzählen von der Schule
- `src/kienzler.js`, `src/kienzler-site.js` – Kienzler Metalltechnik (Römerstraße) nach Fotos und Street View (April 2022): weiße Paneelhalle mit PV-Pultdach (LoD2), offene Ladezone „Tor 1“ mit Firmenschild, Stahlstützen, Kragträger, Absaugsäule mit Schwenkarm, Zypressen, Geländer-Ausstellung; Werkstatt mit grüner Glasfront und PV-Reihen, Büro und Garage in Trapezblech (eigene Modelle, da das LoD2-Modell ein Dach über dem halben Hof enthält); Asphalthof mit Palettenstapeln. Ein Gabelstapler fährt Paletten zwischen Ladezone, Werkstatt und Hof; per E übernehmbar, R/Q hebt/senkt die Gabel, Paletten werden aufgenommen, wenn die Zinken darunter stehen
- `src/ortseingang.js` – Ortseingänge nach Street View und OSM (traffic_sign=city_limit): Ortstafeln mit Ortsende-Rückseite (Bamlach ×4, Rheinweiler ×2, Bad Bellingen „Staatlich anerkanntes Heilbad“), Zone 30 / Zone-30-Ende, Tempo 50, Feldweg-Durchfahrtsverbot; Findlinge, Werbestelen und Betriebshäuschen an der Rheinstraße, Wegkreuze (Kirchstraße mit Kastanie, Pflanzkasten und Bank; Blansinger Straße mit Blumenbeet und Zypresse; Sandsteinkreuz Rheinstraße)
- `src/stationenweg.js` – Stationenweg (Kreuzweg von 1858) zum Kalvarienberg nach OSM, Wanderportalen und Photosphären: 14 Sandstein-Bildstöcke mit Glasmosaik, Inschrift, Satteldach und Stiftersockel, Birken und Baum wie vor Ort, Schwarzwaldverein-Wegweiser, großes Steinkreuz; Spaziergänger halten an jeder Station, vorbeikommende Passanten bleiben stehen und erzählen davon (die Kartengrenze reicht dafür bis 47,7050° N)
- `src/grillplatz.js` – Grillplatz Bamlach nach Fotos und Luftbild (DOP20), Lage aus OSM: Grillhütte aus Fichtenbrettern mit Pultdach (ersetzt den OSM-Umriss, begehbar), Feuerstelle aus Kalksteinquadern mit Schwenkgrill und Sitzsteinen im Kiesrund, Tischtennisplatte aus Beton, Nestschaukel auf Hackschnitzeln, Sandkasten mit Sitzbagger, Beachvolleyballfeld mit Netz, Bolzplatz mit Toren, Ballfangzäunen und Basketballkorb, Apfelbäume der Streuobstwiese. NPCs spielen Beachvolleyball 2 gegen 2 (Annahme, Zuspiel, Angriff, Aufschlag, Punkte) und bolzen 3 gegen 3 mit Torhütern (der Spieler kann den Ball anschießen); auf der Nestschaukel kann man schaukeln (E, Leertaste: Schwung holen)
- `src/reitzentrum.js`, `src/reitzentrum-site.js`, `src/pferd.js` – Reitkunstzentrum an der Straße Bamlach – Rheinweiler nach LoD2 (Reithalle mit Boxenanbau) und Luftbild DOP20 (Street View gibt es dort nicht): Reithalle mit Solardach, Reitbahn 20 × 40 m mit Bande, Dressurbuchstaben und Spiegeln, Pferdeköpfe in den Boxenfenstern; Hof mit Stall, Offenställen, Heuraufen, Longierzirkel und überdachter Führanlage (zwei Pferde laufen mit), Paddock mit grasenden Pferden. Drei gesattelte Pferde am Anbindebalken: E nehmen, Schritt, Trab und Galopp nach Tempo (bis 50 km/h); betrunken reiten kostet kein Ansehen
- `src/tennis.js` – vier Sandplätze mit Zaun und Netzen, NPCs spielen Ballwechsel
- `src/golf.js`, `src/golf-ground.js`, `src/golf-holes.js`, `scripts/build-golf.mjs` – Drei Thermen Golfresort (Mariahügel und Quellenhof): Fairways, Grüns, Bunker, Teiche und Bäume aus dem Luftbild (DOP20, `npm run build-golf` → `public/golf.bin`/`golf.json`), Bahnen nach Luftbild nachgezeichnet, Golfer-Flights zu Fuß mit Trolley oder im Golfcart (Cart per E übernehmbar), Driving Range mit Abschlaghütten, Clubhaus mit Terrasse, Pro-Shop, Wallfahrtskapelle auf dem Mariahügel (eigenes Modell, `src/kapelle-mariahuegel.js`), Golfball-Skulptur
- `src/autobahn.js` – A5 am Westrand nach Luftbild (DOP20): je Richtung zwei Fahrstreifen + Standstreifen, Markierung (Leitlinie 6/12 m), Mittelstreifen mit Betonschutzwand und Schutzplanke, Leitpfosten, Schutzplanken an den Unterführungen (Im Grund, Rotbergerstraße; Überbauten aus `src/bridges.js`); Gehölz mit Laubbäumen und Gebüsch auf den Böschungen zwischen A5 und Kandstraße; Verkehr mit PKW (108–140 km/h) und LKW (80–88 km/h), Abstandhalten, Überholen links, Rechtsfahrgebot; LKW per E übernehmbar
- `src/train.js` – RB 27 im bwegt-Design auf der Rheintalbahn: je Gleis ein Umlauf (Gleis 1 Richtung Basel Bad Bf, Gleis 2 Richtung Freiburg (Brsg) Hbf), bremst am Haltepunkt Rheinweiler, öffnet die Schiebetüren auf der Bahnsteigseite, Zielanzeige an den Steuerwagen. Mitfahren: an einer offenen Tür E; am Streckenende geht es mit Schwarzblende auf dem Gegengleis zurück nach Rheinweiler, dort bei offenen Türen E: aussteigen
- `src/bahnhof.js`, `src/bahnhof-site.js` – Haltepunkt Rheinweiler nach OSM (Bahnsteige, Treppen mit Stufenzahl, Lärmschutzwände, Ausstattung), Luftbild DOP20, Fotos (Wikimedia Commons 2014/2017, Google-Nutzerfotos) und Street View: Außenbahnsteige (55 cm) mit Betonkante, Sicherheitslinie und Pflaster, Lärmschutzwände mit grünem Farbverlauf, weißen Pfosten und Graffiti, gläserne Wartehallen, Stationsschilder, Gleisschilder, Lampen, Bahnsteiguhren mit echter Uhrzeit, Zugzielanzeiger mit Abfahrt, Nordtreppe (Beton, Podest) von der Burgunderstraße mit bwegt-Automat, Südtreppe (Sandstein) zur Blansinger Straße, Rampenweg zum P+R, Fahrradunterstand und Fahrradboxen, GSM-R-Mast, Stellwerk ESTW-A; Fahrgäste warten, steigen ein und aus (das Empfangsgebäude von 1960 ist abgerissen). Bushaltestelle „Rheinweiler Ort“ an der Burgunderstraße
- `src/fahrleitung.js` – Oberleitung entlang der ganzen Strecke: Gittermasten auf Betonfundamenten mit Querjoch, Tragseil, Fahrdraht im Zickzack, Hänger; am Bahnsteig vor der Lärmschutzwand
- `src/bus.js` – Linienbus Bad Bellingen – Bamlach – Rheinweiler (Alte Weinstraße, Bamlacher Straße, Burgunderstraße; Route per kürzestem Weg im Straßennetz): hält in beiden Richtungen an „Bamlach“ und „Rheinweiler Ort“ (Türen öffnen, wartender Fahrgast steigt ein), wartet auf Hindernisse in seiner Spur. Mitfahren: E bei offenen Türen, im Bus E = Haltewunsch; an der Haltestelle wird die Wartezeit angezeigt; an der Endhaltestelle muss man aussteigen
- `src/swing.js` – Schaukeln, auf die sich der Spieler setzen kann (Pendel mit Schwungholen): Nestschaukel am Grillplatz, die beiden Kindergarten-Schaukeln (das Kind darauf steigt ab und wartet), Campingplatz-Schaukel
- `src/vehicles.js` – Auto, Traktor (+ Anhänger), Fahrrad, Motorrad, Quad, Pferd: Fahrphysik und Verkehrs-KI
- `src/pedestrians.js`, `src/person.js` – Fußgänger und Figuren (mit Kleidung aus dem Dorfpass)
- `src/belohnungen.js`, `src/ansehen.js`, `src/postkarten.js`, `src/feuerwerk.js`, `src/hupe.js` – Belohnungen für alle Aufgaben: Kleidung, Hupen, Lack, Ehrentafel, Bestenliste und Dorfziel; Grüßen, Beschimpfen, Dorffest; Postkarten; Feuerwerk und Klänge
- `src/player.js`, `src/input.js`, `src/minimap.js`, `src/main.js`

Kartendaten © OpenStreetMap-Mitwirkende (ODbL). Gelände (DGM1), Rebflächen, befestigte Flächen und Golfplatz (abgeleitet aus DOP20): © LGL Baden-Württemberg, www.lgl-bw.de, [dl-de/by-2-0](https://www.govdata.de/dl-de/by-2-0).
