# APMod (1.1.1)

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

## Installation als Firefox extension (temp):

```diff
- Es ist von der Nutzung als direkte geladene Extension in Firefox abzuraten.
- Es ist einfach unnötig Kompliziert für euch.
- Benutze lieber einen anderen Browser oder Tampermonkey.
```

```diff
! Chrome benutzt schon Manifest V3, Firefox leider noch nicht in allen aktuellen Browser Versionen.
! Zum Beispiel geht es nicht in den ESR Versionen, dort muss man noch die Manifest V2 nutzen.
! Eine passende Datei habe ich beigelegt: manifest_V2.json welche man auf manifest.json umbenennen muss um diese zu nutzen.

! Firefox läd Addons in ungepackter/unsignierter Form leider nur temporär. (brower neu öffen heißt neu laden...)
```
Klicke hier auf den grünen "Code" Button und dann auf "Download ZIP". (Oder: [Direct Download Link](https://github.com/dev-101010/APMOD/archive/refs/heads/main.zip))

Entpacke es auf deinem Computer. (z.B. in eigene Dateien)

Kopiere folgendes in die Adressleiste: "about:debugging#/runtime/this-firefox" und gehe auf "Temporäres Add-on laden...".

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
Hier gibt es einige Filter zum importieren:

https://github.com/dev-101010/APMOD-Filter

----

Eigene Filter erstellen ist hingegen etwas komplizierter.

Das alles zu beschreiben würde sehr lange dauern, deswegen nur ein Schaubild.

Sicherlich finden sich der eine oder angere der damit ohne Probleme zurecht kommen und Filter erstellen kann.

Es gibt eine Export und Import Funktion, damit könnt ihr Filter leicht untereinander tauschen.

![dataspy_edit_menu.png](https://github.com/dev-101010/APMOD/blob/main/images/dataspy_edit_menu.png)

----

Zu Filtern können Reihen hinzugefügt werden, gelöscht werden, die Reihenfolge geändert werden.

Alle Werte können frei angepasst werden, aber am Ende muss ein logischer Ablauf dabei raus kommen.

Wichtig ist auch, dass die Klammern alle geschlossen sind.

![dataspy_edit_filter.png](https://github.com/dev-101010/APMOD/blob/main/images/dataspy_edit_filter.png)

```diff
Für diejenigen die sich schon mal mit programmieren beschäftigt haben. In diesem Filter steht einfach:
( equipment.contains("AR.ZONE.2") || equipmentdesc.contains("pakivaa02") ) && shift.contains("DS42")
Und alle Einträge auf die diese Prüfung zutrifft werden dann angezeigt.
```

<br />

"Field Name" hat leider mehrere doppelte Eigenschaften, z.B:

Status -> workorderstatus -> Der Workorderstatus datenbankseitig, unabhänig der Sprache. -> Value: "R", "IP", "C", "CANC"

Status -> workorderstatus_display -> Der Workorderstatus ausgeschreiben in der ausgewählten Sprache. -> Value: "Open", "In Progress", "Completed", "Canceled"

<br />

Type -> workordertype -> Der Workordertyp datenbankseitig, unabhänig der Sprache. -> Value: "PM", "SC", "FPM", "PR", "BRKD", "CM"

Type -> workordertype_display -> Der Workordertyp ausgeschreiben in der ausgewählten Sprache. -> Value: "Prev. Maint.", "Systemcheck", "Followup", "Project", "Breakdown", "Corrective"

<br />

Leider ist APMOD hier etwas umständlicher zu handhaben als APM selber, aber anders wäre es viel komplizierter und viel mehr Aufwand, der sich nicht lohnen würde.

<br />

Andere Eigenschaften wie z.B. Equipment sind etwas einfacher, sie haben immer die selbe Value, in allen Sprachen.


<br />

Eine zusätzliche Möglichkeit der Value die eingeführt wurde sind Variablen fürs Datum:

"#DATE" -> Kann im Filter verwendet werden und gibt immer das aktuelle Datum.

"#DATE D +3" -> Gibt das Datum von Heute plus 3 Tage.

"#DATE W" -> Gibt das Datum vom Ende der aktuellen Woche. (Sonntag)

"#DATE W +2" -> Gibt das Datum vom Ende der übernächsten Woche. (Sonntag)

Gleiches für den Login:

"#LOGIN"

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

So simpel ist es? Nein, es wird natürlich noch komplex.

Man kann nicht nur einen Wert pro Feld ablegen.

Wenn mehrere Werte abgelegt werden, dann erscheinen Auswahlräder und jedes Auswahlrad hat 10 mögliche Tiefen.

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

Hier siehst du alle gespeicherten Werte den Feldern zugeordnet und in welcher Tiefe des Rads sie sich befinden.

Ausserden kann man hier für jeden Wert auch einen Alias anlegen, der im Rad dann anstatt des Wertes angezeigt wird.

![filler_menu.png](https://github.com/dev-101010/APMOD/blob/main/images/filler_menu.png)

<br /><br /><br />

## Auswahlhilfe:

Die Auswahlhilfe ist wieder recht einfach. Man klickt auf eine der Schaltflächen und alle dazugehörigen Checkboxen (die geladen sind) werden angewählt.

Standartmäßig ist ein überschreiben ausgeschaltet, damit ihr euch beim Arbeiten z.B. die "Nein" schon mal setzen könnt und später dann nicht versehentlich überschreibt.

Es gibt allerdings eine Override Checkbox, wenn diese ausgewählt ist wird alles gesetzt egal was vorher ausgewählt war.

![selector.png](https://github.com/dev-101010/APMOD/blob/main/images/selector.png)
