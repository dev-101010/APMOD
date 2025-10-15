# APMod (1.3.5)
Adds various additional functions to the APM website: WO list [Filters](https://github.com/dev-101010/APMOD/blob/main/README.md#filter), text-field [Filling Helper](https://github.com/dev-101010/APMOD/blob/main/README.md#ausf%C3%BCllhilfe), checkbox [Selection Helper](https://github.com/dev-101010/APMOD/blob/main/README.md#auswahlhilfe), table [Copy Helper](https://github.com/dev-101010/APMOD/blob/main/README.md#kopierhilfe)

## Recommended installation (Tampermonkey):
Install the [Tampermonkey](https://www.tampermonkey.net/index.php) extension in your browser. Load the file `script.user.js` into Tampermonkey. (Or: [Direct Download Link](https://github.com/dev-101010/APMOD/raw/main/script.user.js))
```diff
! Unfortunately, the Developer Mode in the browser extensions now has to be turned on for the mod to keep working.
```

## Installation as a Chrome extension:
Click the green **Code** button here and then **Download ZIP**. (Or: [Direct Download Link](https://github.com/dev-101010/APMOD/archive/refs/heads/main.zip))
Unpack it on your computer (e.g., in “My Documents”). Open Chrome and go to Extensions (Menu → Settings → Extensions).
Enable **Developer mode** and then click **Load unpacked**. Go to your unpacked files and select the **APMOD** folder.

Open or reload APM now.
```diff
! Unfortunately, the Developer Mode in the browser extensions now has to be turned on for the mod to keep working.
```

## Installation as a Firefox extension (temp):
```diff
- It is not recommended to use it as a directly loaded extension in Firefox.
- It is simply unnecessarily complicated for you.
- Use another browser or Tampermonkey instead.
```
```diff
! Unfortunately, Firefox only loads add-ons in unpacked/unsigned form temporarily. (Re-opening the browser means loading it again…)
```
Click the green **Code** button here and then **Download ZIP**.
(Or: [Direct Download Link](https://github.com/dev-101010/APMOD/archive/refs/heads/main.zip))

Unpack it on your computer (e.g., in “My Documents”). Paste the following into the address bar: `about:debugging#/runtime/this-firefox` and click **Load Temporary Add-on…`.
Go to your unpacked files and in the **APMOD** folder select the file `manifest.json`.
Open or reload APM now.

## Filters:
Using filters is straightforward—just select one and it loads immediately. The order does matter, though. First the APM dropdown applies (green 1), then the additional filter dropdown (green 2), and lastly the values entered in the header are filtered (green 3).

![dataspy.png](https://github.com/dev-101010/APMOD/blob/main/images/dataspy.png)

----
There are some prebuilt filters to import here: https://github.com/dev-101010/APMOD-Filter
----

Creating your own filters is a bit more complicated. Describing everything would take a very long time, so here’s just a schematic. Surely some will handle this without issues and create filters.

There is an export and import function so you can easily share filters with each other.

![dataspy_edit_menu.png](https://github.com/dev-101010/APMOD/blob/main/images/dataspy_edit_menu.png)

----
For filters you can add rows, delete rows, and change the order of rows. All values can be freely adjusted, but in the end there must be a logically valid result. It’s also important that all parentheses are closed.
----

![dataspy_edit_filter.png](https://github.com/dev-101010/APMOD/blob/main/images/dataspy_edit_filter.png)

```diff
For those who have already dealt with programming before. This filter simply says:
( equipment.contains("AR.ZONE.2") || equipmentdesc.contains("pakivaa02") ) && shift.contains("DS42")
And all entries for which this check applies are then displayed.
```

“Field Name” unfortunately has several duplicate properties, e.g.:

Status → `workorderstatus` → The work order status in the database, independent of language. → Value: `"R"`, `"IP"`, `"C"`, `"CANC"`

Status → `workorderstatus_display` → The work order status written out in the selected language. → Value: `"Open"`, `"In Progress"`, `"Completed"`, `"Canceled"`

Type → `workordertype` → The work order type in the database, independent of language. → Value: `"PM"`, `"SC"`, `"FPM"`, `"PR"`, `"BRKD"`, `"CM"`

Type → `workordertype_display` → The work order type written out in the selected language. → Value: `"Prev. Maint."`, `"Systemcheck"`, `"Followup"`, `"Project"`, `"Breakdown"`, `"Corrective"`

Unfortunately, APMOD is a bit more cumbersome here than APM itself, but otherwise it would be much more complicated and far more effort, which wouldn’t be worth it.

Other properties, such as **Equipment**, are a bit simpler—they always have the same value in all languages.

An additional type of value that was introduced is **variables for dates**:

`#DATE` → Can be used in the filter and always returns the current date.

`#DATE H +1` → Returns today’s date/time plus 1 hour.

`#DATE D +3` → Returns today’s date plus 3 days.

`#DATE W` → Returns the date of the end of the current week (Sunday).

`#DATE W +2` → Returns the date of the end of the week after next (Sunday).

`#DATE SAT` → Returns the date of this/next Saturday.
[MON,TUE,WED,THU,FRI,SAT,SUN]

`#DATE SAT +2` → Returns the date of the Saturday in 2 weeks.
[MON,TUE,WED,THU,FRI,SAT,SUN]

The same for the login of the current user: `#LOGIN`

----
Here it’s about sorting. You can sort by any column, from A → Z or from Z → A. There isn’t much to do here, really. Sorting by **Start Date** is probably the most useful.
----

![dataspy_edit_sort.png](https://github.com/dev-101010/APMOD/blob/main/images/dataspy_edit_sort.png)

----
Here you can choose which columns should be shown to you and when. Surely everyone knows that the standard filters are completely overloaded.
----

![dataspy_edit_fields.png](https://github.com/dev-101010/APMOD/blob/main/images/dataspy_edit_fields.png)

## Filling Helper:
The Filling Helper is a tool that can best be compared to “copy & paste.” Only here there isn’t just one storage slot for everything that gets overwritten again and again; instead, there is a separate storage for each APM field.

First, the simple controls:

With **Ctrl + Left-Click** in an APM text field, the value stored for this field is inserted into the text field.

With **Shift + Left-Click** in an APM text field, the value in this text field is placed into its storage.

With **Ctrl + Alt + Left-Click** in an APM text field, a stored value is deleted.

So that’s simple? Not quite, it gets more complex of course. You can store more than one value per field. If several values are stored, selection wheels appear, and each selection wheel has 10 possible depths.

----
The **black** wheel shows you the values you have stored which you can insert into this field.
----

![wheel_get.png](https://github.com/dev-101010/APMOD/blob/main/images/wheel_get.png)

----
In the **red** wheel you can delete stored values when you no longer need them.
----

![wheel_del.png](https://github.com/dev-101010/APMOD/blob/main/images/wheel_del.png)

----
In the **orange** wheel you can place the current value of the field into storage. Either to a new slot “TO NEW”, or overwrite an existing value.
----

![wheel_over.png](https://github.com/dev-101010/APMOD/blob/main/images/wheel_over.png)

----
How many entries you store is up to you, but at some point it can get tight, which is why each wheel has 10 depths. With the mouse **scroll wheel** or **arrow keys** you can cycle through these.
----

![wheel_over_next.png](https://github.com/dev-101010/APMOD/blob/main/images/wheel_over_next.png)

----
To manage all the entries there is a separate menu:
----

![filler_button.png](https://github.com/dev-101010/APMOD/blob/main/images/filler_button.png)

----
Here you can see all saved values assigned to the fields and at which depth of the wheel they are located. You can also define an **alias** for each value, which will then be displayed in the wheel instead of the raw value.
----

![filler_menu.png](https://github.com/dev-101010/APMOD/blob/main/images/filler_menu.png)

## Selection Helper:
The Selection Helper is again quite simple. Click one of the buttons and all associated checkboxes (that are loaded) are selected.
By default, **overwriting is disabled**, so that, for example, you can pre-set “No” while working and later don’t accidentally overwrite it.
However, there is an **Override** checkbox; when this is selected, everything is set regardless of what was previously selected.

![selector.png](https://github.com/dev-101010/APMOD/blob/main/images/selector.png)

## Copy Helper:
The Copy Helper lets you copy text and images from **table cells** to the clipboard simply by **ALT + Left-Clicking** on them.

![copy.png](https://github.com/dev-101010/APMOD/blob/main/images/copy.png)

In addition, copied text is stored in an internal list, which you can open with **ALT + Left-Click** in an input field and then paste the values again.
