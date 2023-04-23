# APMod

Fügt verschiedene zusätzliche Funktionen in die APM Website ein:

WO Listen [Filter](https://github.com/dev-101010/APMOD/blob/main/README.md#filter), Textfeld [Ausfüllhilfe](https://github.com/dev-101010/APMOD/blob/main/README.md#ausf%C3%BCllhilfe), Checkbox [Auswahlhilfe](https://github.com/dev-101010/APMOD/blob/main/README.md#auswahlhilfe)

## Installation als Chrome extension:

Klicke hier auf den grünen "Code" Button und dann auf "Download ZIP".

Entpacke es auf deinem Computer. (z.B. in eigene Dateien)

Öffne Chrome und gehe zu Erweiterungen. (Menu -> Einstellungen -> Erweiterungen)

Aktiviere den "Entwicklermodus" und klicke danach auf "Enpackte Erweiterung laden".

Gehe zu deinen entpackten Datein und wähle den Ordner "APMOD" aus.

Öffne oder lade APM jetzt neu.

## Alternative Installation (Tampermonkey):

Installiere in deinem Browser die Tampermonkey extension.

Klicke hier: https://github.com/dev-101010/APMOD/raw/main/script.user.js

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

Für diejenigen die etwas vom Programmieren verstehen. In diesem Filter steht einfach:

( equipment.contains("AR.ZONE.2") || equipmentdesc.contains("pakivaa02") ) && shilft.contains("DS42")

----

Hier geht es um die Sortierung, man kann nach jeder Spalte sotieren, von A -> Z oder von Z -> A.
Viel gibt es hier eigentlich nicht zu tun. die Sortierung nach Startdatum ist vermutlich die sinnvollste. 

![dataspy_edit_sort.png](https://github.com/dev-101010/APMOD/blob/main/images/dataspy_edit_sort.png)

----

Hier kann man auswählen welche Spalten einem wann überhaupt angezeigt werden sollen.
Kennt sicher jeder, dass die standart Filter völlig überladen sind.

![dataspy_edit_fields.png](https://github.com/dev-101010/APMOD/blob/main/images/dataspy_edit_fields.png)

## Ausfüllhilfe:

![filler_button.png](https://github.com/dev-101010/APMOD/blob/main/images/filler_button.png)

![filler_menu.png](https://github.com/dev-101010/APMOD/blob/main/images/filler_menu.png)

![wheel_get.png](https://github.com/dev-101010/APMOD/blob/main/images/wheel_get.png)
![wheel_del.png](https://github.com/dev-101010/APMOD/blob/main/images/wheel_del.png)

![wheel_over.png](https://github.com/dev-101010/APMOD/blob/main/images/wheel_over.png)
![wheel_over_next.png](https://github.com/dev-101010/APMOD/blob/main/images/wheel_over_next.png)

## Auswahlhilfe:

![selector.png](https://github.com/dev-101010/APMOD/blob/main/images/selector.png)
