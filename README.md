# APMod

Fügt verschiedene zusätzliche Funktionen in die APM Website ein:

WO Listen [Filter](https://github.com/dev-101010/APMOD/blob/main/README.md#filter), Textfeld [Ausfüllhilfe](https://github.com/dev-101010/APMOD/blob/main/README.md#ausf%C3%BCllhilfe), Checkbox [Auswahlhilfe](https://github.com/dev-101010/APMOD/blob/main/README.md#auswahlhilfe)
<br /><br /><br />
## Installation als Chrome extension:

Klicke hier auf den grünen "Code" Button und dann auf "Download ZIP". (Oder: [Direct Download Link](https://github.com/dev-101010/APMOD/archive/refs/heads/main.zip))

Entpacke es auf deinem Computer. (z.B. in eigene Dateien)

Öffne Chrome und gehe zu Erweiterungen. (Menu -> Einstellungen -> Erweiterungen)

Aktiviere den "Entwicklermodus" und klicke danach auf "Enpackte Erweiterung laden".

Gehe zu deinen entpackten Datein und wähle den Ordner "APMOD" aus.

Öffne oder lade APM jetzt neu.

<br /><br /><br />

## Installation als Firefox extension:

```diff
- Ich rate von der Nutzung in Firefox als direkte Extension ab.
- Benutze lieber einen anderen Browser oder Tampermonkey.
```

```diff
! Chrome benutzt schon Manifest V3, welche ich auch nutze. Firefox leider noch nicht in allen aktuellen Browser Versionen.

! Zum Beispiel geht es nicht in den ESR Versionen, dort muss man noch die Manifest V2 nutzen.

! Eine passende Datei habe ich beigelegt: manifest_V2.json welche man auf manifest.json umbenennen muss um diese zu nutzen.
```
Klicke hier auf den grünen "Code" Button und dann auf "Download ZIP". (Oder: [Direct Download Link](https://github.com/dev-101010/APMOD/archive/refs/heads/main.zip))

Entpacke es auf deinem Computer. (z.B. in eigene Dateien)

Firefox läd Addons in ungepackter/unsignierter Form leider nur temporär. Heißt du musst es bei jeden Brower start wieder laden.

Kopiere einfach folgendes in die Adressleiste: "about:debugging#/runtime/this-firefox" und gehe auf "Temporäres Add-on laden...".

Gehe zu deinen entpackten Datein und wähle im Ordner "APMOD" die Datei "manifest.json" aus.

Öffne oder lade APM jetzt neu.

<br /><br /><br />

## Alternative Installation (Tampermonkey):

Installiere in deinem Browser die [Tampermonkey](https://www.tampermonkey.net/index.php) extension.

Lade die Datei "script.user.js" in Tampermonkey. (Oder: [Direct Download Link](https://github.com/dev-101010/APMOD/raw/main/script.user.js))

<br /><br /><br />

## Filter:

Filter benutzen ist denkbar einfach, nur anwählen und es wird direkt geladen.

Die Reihenfolge ist dabei aber zu beachten.

Als erstes gilt das APM Dropdown (grün 1), 

danach kommt das zusätliche Filter Dropdown dran (grün 2), 

und als letztes werden dann noch die im Header eingetragenen Werte gefiltert (grün 3). 

![dataspy.png](https://github.com/dev-101010/APMOD/blob/main/images/dataspy.png)

----

Eigene Filter erstellen ist hingegen etwas komplizierter.

Wenn ich das hier alles beschreiben müsste wäre ich eine Woche dran, deswegen nur ein Schaubild.

Sicherlich finden sich einige die damit ohne Probleme zurecht kommen und Filter erstellen können.

Es gibt eine Export und Import Funktion, damit könnt ihr Filter leicht untereinander tauschen.

![dataspy_edit_menu.png](https://github.com/dev-101010/APMOD/blob/main/images/dataspy_edit_menu.png)

----

Zu Filtern können Reihen hinzugefügt werden, gelöscht werden, die Reihenfolge geändert werden.

Alle werte können frei angepasst werden, aber am Ende muss ein logischer Ablauf dabei raus kommen.

Wichtig ist auch, dass die Klammern alle geschlossen sind.

![dataspy_edit_filter.png](https://github.com/dev-101010/APMOD/blob/main/images/dataspy_edit_filter.png)

Für diejenigen die sich schon mal mit programmieren beschäftigt haben. In diesem Filter steht einfach:

( equipment.contains("AR.ZONE.2") || equipmentdesc.contains("pakivaa02") ) && shift.contains("DS42")

Und alle Einträge auf die das zutrifft werden angezeigt.

----

Hier geht es um die Sortierung, man kann nach jeder Spalte sotieren, von A -> Z oder von Z -> A.

Viel gibt es hier eigentlich nicht zu tun. die Sortierung nach Startdatum ist vermutlich die sinnvollste. 

![dataspy_edit_sort.png](https://github.com/dev-101010/APMOD/blob/main/images/dataspy_edit_sort.png)

----

Hier kann man auswählen welche Spalten einem wann überhaupt angezeigt werden sollen.

Kennt sicher jeder, dass die standart Filter völlig überladen sind.

![dataspy_edit_fields.png](https://github.com/dev-101010/APMOD/blob/main/images/dataspy_edit_fields.png)

<br /><br /><br />

## Ausfüllhilfe:

Die Ausfüllhilfe ist ein Werkzeug das am ehesten mit "Copy Paste" verglichen werden kann.

Nur dass hier nicht nur ein Ablageplatz für alles existiert der immer wieder überschrieben wird, sondern für jedes APM Feld eine eigene Ablage existiert.

Erstmal zur einfachen Steuerung:

Mit Strg + Linksklick in ein APM Textfeld wird der für dieses Feld abgelegte werd in das Textfeld eingefügt.

Mit Shift + Linksklick in ein APM Textfeld wird der Wert in diesem Textfeld in dessen Ablage gelegt.

Mit Strg + Alt + Linksklick in ein APM Textfeld wird ein abgelegter Wert gelöscht.

So simpel ist es? Nicht ganz.

Man kann nicht nur einen Wert pro Feld ablegen.

Wenn mehrere Werte abgelegt werden, dann erscheinen Auswahlräder...

----

Das schwarze Rad zeigt dir deine abgelegten Werte an die du in dieses Feld einfügen kannst.

![wheel_get.png](https://github.com/dev-101010/APMOD/blob/main/images/wheel_get.png)

----

Im roten Rad kannst du abgelegte Werte löschen, wenn du sie nicht mehr brauchst.

![wheel_del.png](https://github.com/dev-101010/APMOD/blob/main/images/wheel_del.png)

----

Im orangen Rad kannst du den aktuellen Wert des Feldes in die Ablage legen.

Entweder auf einen neuen Platz "TO NEW", oder einen vorhandenen Wert überschreiben.

![wheel_over.png](https://github.com/dev-101010/APMOD/blob/main/images/wheel_over.png)

----

Wie viele Einträge du ablegst bleibt dir überlassen, aber irgendwann kann es eng werden, deswegen hat jedes Rad 10 Tiefen.

Mit Scrollrad oder Pfeiltasten kannst du durch diese durchsschalten.

![wheel_over_next.png](https://github.com/dev-101010/APMOD/blob/main/images/wheel_over_next.png)

----

Um die Ganzen Einträge zu verwalten gibt es nochmal ein Menu:

![filler_button.png](https://github.com/dev-101010/APMOD/blob/main/images/filler_button.png)

----

Hier siehst du alle gespeicherten Werte den feldern zugeordnet und in welcher Tiefe des Rads sie sich befinden.

Ausserden kann man hier für jeden Wert auch einen Alias anlegen, der im Rad dann anstatt des Wertes angezeigt wird.

![filler_menu.png](https://github.com/dev-101010/APMOD/blob/main/images/filler_menu.png)

<br /><br /><br />

## Auswahlhilfe:

Die Auswahlhilfe ist wieder recht einfach. Man klickt auf eine der Schaltflächen und alle dazugehörigen Checkboxen (die geladen sind) werden angewählt.

Standartmäßig ist ein überschreiben ausgeschaltet, damit ihr euch beim Arbeiten z.B. die "Nein" schon mal setzen könnt und später dann nicht versehentlich überschreibt.

Es gibt allerdings eine Override Checkbox, wenn diese ausgewählt ist wird alles gesetzt egal was vorher ausgewählt war.

![selector.png](https://github.com/dev-101010/APMOD/blob/main/images/selector.png)
