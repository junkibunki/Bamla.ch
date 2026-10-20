# Ideen & Todos

## Rahmenbedingungen

- Das Rathaus ist nur noch ein Gebäude, kein geöffnetes Amt. Keine Aufgaben dort.
- Es gibt keine Polizei im Spiel.

## Aufgaben (Quests)

Spieler bekommen Aufgaben, die beim Erfüllen der Bedingung als erledigt gelten.

Umgesetzt in `src/quests.js`: Aufgaben hängen an Aushängen in der Welt (gelbes „!“ darüber und auf der Minimap), E liest, Zahl/Klick nimmt an; J öffnet den Dorfpass mit Stempeln, Ansehen und Titelwahl (Titel erscheint im Multiplayer am Namensschild). Jede Aufgabe ist eine Datei in `src/quests/`.

| # | Aufgabe | Beschreibung | Erledigt wenn … | Status |
|---|---------|--------------|-----------------|--------|
| 1 | Don't drink and drive | Fahre nach einem Bier oder Wein zu viel nach Hause. | man betrunken Auto fährt | erledigt |
| 2 | Nutze die Öffis | Fahr mit dem Bus. | man in den Bus steigt | erledigt |
| 3 | Man hilft sich aus | Bringe mit dem Gabelstapler Material in die Gärtnerei. | Material per Gabelstapler in der Gärtnerei abgeliefert | erledigt |
| 4 | Essen auf Rädern | Beim Metzger Fleisch kaufen und ins Altersheim bringen. | Fleisch vom Metzger im Altersheim abgegeben | erledigt |
| 5 | Andacht | In die Kirche oder die Kapelle gehen, um zu beten. | man in Kirche oder Kapelle betet | erledigt |
| 6 | Platzpflege | Mit dem Minibagger auf dem Golfplatz ein Loch buddeln. | Loch mit Minibagger auf dem Golfplatz gegraben | erledigt |
| 7 | Easy Rider | Einmal Motorrad fahren. | man auf ein Motorrad steigt und fährt | erledigt |
| 8 | Ehrenamt | Mit dem Feuerwehrauto die Feuertonne an der Baracke löschen. | Feuertonne per Feuerwehrauto gelöscht | erledigt |
| 9 | Kulturbanause | Das Bäder- und Heimatmuseum besuchen. | man das Museum betritt | erledigt |
| 10 | Schlossherr | Zum Schloss gehen und auf den Rhein schauen. | man den Aussichtspunkt am Schloss erreicht | erledigt |
| 11 | Kindskopf | Auf der Schaukel schaukeln. | man schaukelt | erledigt |
| 12 | Elterntaxi | Ein Kind vom Kindergarten abholen und zur Schule oder nach Hause fahren. | Kind am Ziel abgesetzt | erledigt |
| 13 | Zu spät! | Vor dem Gong in der Schule sein. | Schule innerhalb des Zeitlimits erreicht | erledigt |
| 14 | Lehrling bei Kienzler | Mit dem Stapler Metallteile von der Halle zur Garage bringen. | Teile in der Garage abgeliefert | erledigt |
| 15 | Weinlese | Trauben im Rebberg sammeln und zum Storchen bringen. | Trauben im Storchen abgegeben | erledigt |
| 16 | Gärtnerei-Lieferung | Pflanzen aus der Gärtnerei auf den Friedhof oder ins Altersheim bringen. | Pflanzen am Ziel abgegeben | erledigt |
| 17 | Hole-in-One | Ein Loch auf dem Golfplatz spielen. | Ball eingelocht | erledigt |
| 18 | Matchball | Auf dem Tennisplatz einen Ball übers Netz schlagen. | Ball landet im gegnerischen Feld | erledigt |
| 19 | Grillmeister | Wurst beim Metzger kaufen und am Grillplatz grillen. | Wurst am Grillplatz gegrillt | erledigt |
| 20 | Camper | Am Camping-Kiosk Eis oder Schorle holen und am Rhein genießen. | Kiosk-Ware am Rheinufer verzehrt | erledigt |
| 21 | Raser | Auf der Autobahn ein bestimmtes Tempo erreichen. | Zieltempo auf der Autobahn erreicht | erledigt |
| 22 | Bahnfahrer | Mit dem Zug fahren. | man in den Zug steigt | erledigt |
| 23 | Ortskundig | Alle Ortsteile besuchen: Bamlach, Rheinweiler, Bad Bellingen. | alle Ortsteile betreten | erledigt |
| 24 | Pünktlich | Den Bus an der Haltestelle am Museum erwischen. | an der Museums-Haltestelle in den Bus gestiegen | erledigt |
| 25 | Kater | Nach dem Bier ausnüchtern, z. B. im Camping-Zelt schlafen. | betrunken geschlafen und nüchtern aufgewacht | erledigt |
| 26 | Stammgast | Im Storchen und in der Baracke je ein Bier trinken. | an beiden Orten ein Bier getrunken | erledigt |
| 27 | Nachbarschaftshilfe | Einen anderen Spieler im Auto mitnehmen (Multiplayer). | zwei Spieler im selben Fahrzeug gefahren | erledigt |
| 28 | Mutprobe | Einmal ganz durch den dunklen Fußgängertunnel unter der Bahn gehen, wo „de Tunnelgeischt“ haust (Hall, Zug über einem, Fledermaus). | zu Fuß am anderen Portal wieder heraus, ohne umzukehren | erledigt |
| 29 | Wocheneinkauf | Im Rewe in Bad Bellingen eine Einkaufstüte holen und den Senior:innen im Marienheim bringen. | Tüte im Hof des Marienheims abgegeben | erledigt |
| 30 | Einkaufswagen-Chip | Einen herumstehenden Einkaufswagen auf dem Rewe-Parkplatz zurück in die Box schieben. | Wagen in der Einkaufswagenbox | erledigt |
| 31 | Brezel-Frühstück | Butterbrezel bei der Bäckerei Armbruster kaufen und auf der Café-Terrasse essen. | Brezel auf der Terrasse gegessen | erledigt |
| 32 | Kühlkette | Mit dem roten Stapler eine Palette Leergut an der Rewe-Anlieferung vor das Rolltor bringen. | Palette vor dem Rolltor „Leergut“ abgesetzt | erledigt |
| 33 | Kurgast | Mit dem Bus bis zur Endhaltestelle „Thermalbad“ fahren und ins Becken steigen. | nach der Busfahrt in einem Becken der Balinea Thermen | erledigt |
| 34 | Sonnenschutz | Sonnencreme beim Rossmann kaufen und auf einer Liege im Badegarten eincremen. | auf einer Liege eingecremt | erledigt |
| 35 | Strömungskanal | Einmal ganz um die Insel in Becken B treiben. | volle Runde im Strömungskanal | erledigt |
| 36 | Saunagang | Erst ins Saunahaus, dann ins kalte Becken im Saunagarten. | beides nacheinander | erledigt |
| 37 | Wohnmobil-Urlaub | Ein Wohnmobil vom Stellplatz an der Therme zum Campingplatz fahren. | Wohnmobil auf dem Campingplatz | erledigt |
| 38 | Abenteuer-Golf | Alle 18 Bahnen im Kurpark spielen (unter Par: Bonus). | Runde komplett | erledigt |
| 39 | Entenfütterung | Brezel bei Armbruster kaufen und am Kurparkweiher die Enten füttern. | am Ufer verfüttert, Enten kommen angeschwommen | erledigt |
| 40 | Großer Spielplatz | Auf dem neuen Spielplatz „Wilde Wasser“ rutschen und schaukeln. | beides erledigt | erledigt |
| 41 | Kurlinie | Die ganze Buslinie von Rheinweiler Ort bis zum Thermalbad durchfahren, ohne auszusteigen. | an der Endhaltestelle angekommen | erledigt |
| 42 | Bad-Bellingen-Kenner:in | Kurpark, Thermen, Rewe, Wendeschleife, Rheinstraße und Rathaus besuchen. | alle sechs Orte besucht | erledigt |
| 43 | Kurkonzert | Beim Kurkonzert im Kurpark das Badnerlied ganz anhören und danach mitklatschen (Belohnung: Musikverein-Uniform). | ganz zugehört und im Applaus geklatscht (E) | erledigt |
| 44 | Hoch hinaus | Mit dem Aufzug an der Rheintreppe vom Kurpark hinauffahren und über den Steg zum Rathaus gehen. | oben am Rathaus angekommen | erledigt |

## Belohnungen

**Startempfehlung:** Stempelheft + Titel + eine Freischaltung pro Aufgabe.

### Freischaltungen
- Fahrzeuge: Nach „Easy Rider“ steht ein eigenes, schnelleres, spezielles Motorrad vor der Tür; nach „Man hilft sich aus“ darf man den Gabelstapler frei nutzen.
- Orte: Nach „Andacht“ öffnet der Kirchturm mit Aussicht, nach „Weinlese“ der Weinkeller.
- Schnellreise: Bushaltestellen und Bahnhöfe (Rheinweiler, Bad Bellingen) werden zu Teleportpunkten, sobald „Nutze die Öffis“ erledigt ist.

### Kosmetisch
- Kleidung für die Spielfigur: Feuerwehrhelm, Metzgerschürze, Golfmütze, Motorradjacke, Bademantel, Rewe-Kappe, Sonnenbrille, Saunahandtuch, Schiebermütze, Musikverein-Uniform (wählbar, sobald freigeschaltet).
- Fahrzeugfarben oder Hupen, z. B. das Storchen-Klappern als Hupe; dazu Rückwärts-Piepser, Aufguss-Zischen und Enten-Quaken, Lack Rewe-Rot und RVL-Blau.
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
