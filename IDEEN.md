# Ideen & Todos

## Rahmenbedingungen

- Das Rathaus ist nur noch ein Gebäude, kein geöffnetes Amt. Keine Aufgaben dort.
- Es gibt keine Polizei im Spiel.

## Aufgaben (Quests)

Spieler bekommen Aufgaben, die beim Erfüllen der Bedingung als erledigt gelten.

Umgesetzt in `src/quests.js`: Aufgaben hängen an Aushängen in der Welt (gelbes „!“ darüber und auf der Minimap), E liest, Zahl/Klick nimmt an; J öffnet den Dorfpass mit Stempeln, Ansehen und Titelwahl (Titel erscheint im Multiplayer am Namensschild). Jede Aufgabe ist eine Datei in `src/quests/`.

| # | Aufgabe | Beschreibung | Erledigt wenn … | Status |
|---|---------|--------------|-----------------|--------|
| 1 | Don't drink and drive | Fahre nach einem Bier oder Wein zu viel nach Hause. | man betrunken Auto fährt | offen |
| 2 | Nutze die Öffis | Fahr mit dem Bus. | man in den Bus steigt | erledigt |
| 3 | Man hilft sich aus | Bringe mit dem Gabelstapler Material in die Gärtnerei. | Material per Gabelstapler in der Gärtnerei abgeliefert | offen |
| 4 | Essen auf Rädern | Beim Metzger Fleisch kaufen und ins Altersheim bringen. | Fleisch vom Metzger im Altersheim abgegeben | offen |
| 5 | Andacht | In die Kirche oder die Kapelle gehen, um zu beten. | man in Kirche oder Kapelle betet | erledigt |
| 6 | Platzpflege | Mit dem Minibagger auf dem Golfplatz ein Loch buddeln. | Loch mit Minibagger auf dem Golfplatz gegraben | offen |
| 7 | Easy Rider | Einmal Motorrad fahren. | man auf ein Motorrad steigt und fährt | offen |
| 8 | Ehrenamt | Mit dem Feuerwehrauto die Feuertonne an der Baracke löschen. | Feuertonne per Feuerwehrauto gelöscht | offen |
| 9 | Kulturbanause | Das Bäder- und Heimatmuseum besuchen. | man das Museum betritt | offen |
| 10 | Schlossherr | Zum Schloss gehen und auf den Rhein schauen. | man den Aussichtspunkt am Schloss erreicht | offen |
| 11 | Kindskopf | Auf der Schaukel schaukeln. | man schaukelt | offen |
| 12 | Elterntaxi | Ein Kind vom Kindergarten abholen und zur Schule oder nach Hause fahren. | Kind am Ziel abgesetzt | offen |
| 13 | Zu spät! | Vor dem Gong in der Schule sein. | Schule innerhalb des Zeitlimits erreicht | offen |
| 14 | Lehrling bei Kienzler | Mit dem Stapler Metallteile von der Halle zur Garage bringen. | Teile in der Garage abgeliefert | offen |
| 15 | Weinlese | Trauben im Rebberg sammeln und zum Storchen bringen. | Trauben im Storchen abgegeben | offen |
| 16 | Gärtnerei-Lieferung | Pflanzen aus der Gärtnerei auf den Friedhof oder ins Altersheim bringen. | Pflanzen am Ziel abgegeben | offen |
| 17 | Hole-in-One | Ein Loch auf dem Golfplatz spielen. | Ball eingelocht | offen |
| 18 | Matchball | Auf dem Tennisplatz einen Ball übers Netz schlagen. | Ball landet im gegnerischen Feld | offen |
| 19 | Grillmeister | Wurst beim Metzger kaufen und am Grillplatz grillen. | Wurst am Grillplatz gegrillt | offen |
| 20 | Camper | Am Camping-Kiosk Eis oder Schorle holen und am Rhein genießen. | Kiosk-Ware am Rheinufer verzehrt | offen |
| 21 | Raser | Auf der Autobahn ein bestimmtes Tempo erreichen. | Zieltempo auf der Autobahn erreicht | offen |
| 22 | Bahnfahrer | Mit dem Zug fahren. | man in den Zug steigt | offen |
| 23 | Ortskundig | Alle Ortsteile besuchen: Bamlach, Rheinweiler, Am Buck, Im Grund, Schafgässle. | alle Ortsteile betreten | offen |
| 24 | Pünktlich | Den Bus an der Haltestelle am Museum erwischen. | an der Museums-Haltestelle in den Bus gestiegen | offen |
| 25 | Kater | Nach dem Bier ausnüchtern, z. B. im Camping-Zelt schlafen. | betrunken geschlafen und nüchtern aufgewacht | offen |
| 26 | Stammgast | Im Storchen und in der Baracke je ein Bier trinken. | an beiden Orten ein Bier getrunken | offen |
| 27 | Nachbarschaftshilfe | Einen anderen Spieler im Auto mitnehmen (Multiplayer). | zwei Spieler im selben Fahrzeug gefahren | offen |

## Belohnungen

**Startempfehlung:** Stempelheft + Titel + eine Freischaltung pro Aufgabe.

### Freischaltungen
- Fahrzeuge: Nach „Easy Rider“ steht ein eigenes, schnelleres, spezielles Motorrad vor der Tür; nach „Man hilft sich aus“ darf man den Gabelstapler frei nutzen.
- Orte: Nach „Andacht“ öffnet der Kirchturm mit Aussicht, nach „Weinlese“ der Weinkeller.
- Schnellreise: Bushaltestellen und Bahnhöfe werden zu Teleportpunkten, sobald „Nutze die Öffis“ erledigt ist.

### Kosmetisch
- Kleidung für die Spielfigur: Feuerwehrhelm, Metzgerschürze, Golfmütze, Motorradjacke (wählbar, sobald freigeschaltet).
- Fahrzeugfarben oder Hupen, z. B. das Storchen-Klappern als Hupe.
- Titel neben dem Namen im Multiplayer: „Ehrenbürger“, „Stammgast“, „Grillmeister“.

### Dorf-Ansehen
- Ansehen-Punkte pro Aufgabe; ab bestimmten Stufen grüßen Fußgänger, der Bürgermeister überreicht einen Schlüssel oder es gibt ein Dorffest.
- Negatives Ansehen: Wer betrunken fährt, wird von Fußgängern beschimpft.

### Sammelbares
- Stempelheft / Dorfpass: ein Stempel pro Aufgabe, voller Pass bringt eine Belohnung.
- Postkarten mit einem Motiv pro Ort (z. B. echte Fotos aus Bamlach).

### Spielerisch
- Gutscheine: Freibier im Storchen, Freiessen beim Metzger.
- Dauerhafte Spuren in der Welt: Golfloch bleibt, Gärtnerei blüht mehr, Senioren im Altersheim winken.

### Multiplayer
- Bestenliste mit den meisten erledigten Aufgaben.
- Gemeinsame Dorfziele, z. B. 50 Lieferungen → Feuerwerk über dem Rhein.

## Ideen

-

## Todos

-
