# APMod (1.3.5)
[![English](https://img.shields.io/badge/lang-English-blue)](README.EN.md)
[![Deutsch](https://img.shields.io/badge/lang-Deutsch-green)](README.md)

Adds various extra features to the APM website:

WO lists [Filter](#filter), text field [Fill helper](#fill-helper), checkbox [Selection helper](#Selection-helper), table [Copy helper](#copy-helper)
<br /><br /><br />
## Recommended installation (Tampermonkey):

Install the [Tampermonkey](https://www.tampermonkey.net/index.php) extension in your browser.

Load the file "script.user.js" into Tampermonkey. (Or: [Direct Download Link](https://github.com/dev-101010/APMOD/raw/main/script.user.js))

```diff
! Unfortunately, the developer mode in browser extensions must now be enabled for the mod to work.
```

<br /><br /><br />

## Installation as Chrome extension:

Click the green "Code" button here and then "Download ZIP". (Or: [Direct Download Link](https://github.com/dev-101010/APMOD/archive/refs/heads/main.zip))

Unzip it on your computer. (e.g., into your Documents)

Open Chrome and go to Extensions. (Menu -> Settings -> Extensions)

Enable "Developer mode" and then click "Load unpacked".

Go to your unzipped files and select the "APMOD" folder.

Open or reload APM now.

```diff
! Unfortunately, the developer mode in browser extensions must now be enabled for the mod to work.
```

<br /><br /><br />

## Installation as Firefox extension (temp):

```diff
- It is not recommended to use this as a directly loaded extension in Firefox.
- It's simply unnecessarily complicated for you.
- Use a different browser or Tampermonkey instead.
```

```diff
! Firefox unfortunately only loads add-ons in unpacked/unsigned form temporarily. (reopening the browser means reloading...)
```
Click the green "Code" button here and then "Download ZIP". (Or: [Direct Download Link](https://github.com/dev-101010/APMOD/archive/refs/heads/main.zip))

Unzip it on your computer. (e.g., into your Documents)

Copy the following into the address bar: "about:debugging#/runtime/this-firefox" and click "Load Temporary Add-on...".

Go to your unzipped files and in the "APMOD" folder select the file "manifest.json".

Open or reload APM now.

<br /><br /><br />

## Filter:

Using filters is very easy, just select them and they will be loaded immediately.

However, the order must be observed.

First comes the APM dropdown (green 1), 

then the additional filter dropdown (green 2), 

and lastly the values entered in the header are filtered (green 3). 

![dataspy.en.png](https://github.com/dev-101010/APMOD/blob/main/images/dataspy.en.png)

----
Here you can find some preconfigured filters to import:

https://github.com/dev-101010/APMOD-Filter

----

Creating your own filters is a bit more complicated.

Describing everything would take a very long time, so here's just a diagram.

Surely there are one or two people who can handle this without any problems and create filters.

There is an export and import function, which allows you to easily exchange filters with each other.

![dataspy_edit_menu.en.png](https://github.com/dev-101010/APMOD/blob/main/images/dataspy_edit_menu.en.png)

----

Rows can be added to filters, deleted, and their order changed.

All values can be freely adjusted, but in the end there must be a logical sequence.

It is also important that all brackets are closed.

![dataspy_edit_filter.en.png](https://github.com/dev-101010/APMOD/blob/main/images/dataspy_edit_filter.en.png)

```diff
For those who have dealt with programming before. In this filter it simply says:
( equipment.contains("AR.ZONE.2") || equipmentdesc.contains("pakivaa02") ) && shift.contains("DS42")
And all entries that meet this condition will then be displayed.
```

<br />

"Field Name" unfortunately has several duplicate properties, e.g.:

Status -> workorderstatus -> The work order status on the database side, independent of the language. -> Value: "R", "IP", "C", "CANC"

Status -> workorderstatus_display -> The work order status written out in the selected language. -> Value: "Open", "In Progress", "Completed", "Canceled"

<br />

Type -> workordertype -> The work order type on the database side, independent of the language. -> Value: "PM", "SC", "FPM", "PR", "BRKD", "CM"

Type -> workordertype_display -> The work order type written out in the selected language. -> Value: "Prev. Maint.", "Systemcheck", "Followup", "Project", "Breakdown", "Corrective"

<br />

Unfortunately, APMOD is somewhat more cumbersome to handle here than APM itself, but otherwise it would be much more complicated and much more effort that wouldn't be worth it.

<br />

Other properties, such as Equipment, are a bit simpler; they always have the same value in all languages.


<br />

An additional type of value that was introduced is variables for the date:

"#DATE" -> Can be used in the filter and always returns the current date.

"#DATE H +1" -> Returns today's date/time plus 1 hour.

"#DATE D +3" -> Returns today's date plus 3 days.

"#DATE W" -> Returns the date of the end of the current week. (Sunday)

"#DATE W +2" -> Returns the date of the end of the week after next. (Sunday)

"#DATE SAT" -> Returns the date of this/next Saturday. [MON,TUE,WED,THU,FRI,SAT,SUN]

"#DATE SAT +2" -> Returns the date of the Saturday in 2 weeks. [MON,TUE,WED,THU,FRI,SAT,SUN]

The same applies to the login of the current user:

"#LOGIN"

----

This is about sorting; you can sort by any column, from A -> Z or from Z -> A.

There is not much to do here. Sorting by start date is probably the most sensible. 

![dataspy_edit_sort.en.png](https://github.com/dev-101010/APMOD/blob/main/images/dataspy_edit_sort.en.png)

----

Here you can select which columns should be displayed to you and when.

Surely everyone knows that the standard filters are completely overloaded.

![dataspy_edit_fields.en.png](https://github.com/dev-101010/APMOD/blob/main/images/dataspy_edit_fields.en.png)

<br /><br /><br />

## Fill helper:

The fill helper is a tool that is most comparable to "Copy Paste".

Except that here there is not only one storage location for everything that is overwritten again and again, but a separate storage for each APM field.

First, the simple controls:

With Ctrl + Left Click in an APM text field, the value stored for this field is inserted into the text field.

With Shift + Left Click in an APM text field, the value in this text field is placed into its storage.

With Ctrl + Alt + Left Click in an APM text field, a stored value is deleted.

Is it that simple? No, of course it gets more complex.

You can store not just one value per field.

If multiple values are stored, selection wheels appear and each selection wheel has 10 possible depths.

----

The black wheel shows you your stored values that you can insert into this field.

![wheel_get.en.png](https://github.com/dev-101010/APMOD/blob/main/images/wheel_get.en.png)

----

In the red wheel you can delete stored values when you no longer need them.

![wheel_del.en.png](https://github.com/dev-101010/APMOD/blob/main/images/wheel_del.en.png)

----

In the orange wheel you can place the current value of the field into storage.

Either to a new slot "TO NEW", or overwrite an existing value.

![wheel_over.en.png](https://github.com/dev-101010/APMOD/blob/main/images/wheel_over.en.png)

----

How many entries you store is up to you, but eventually it can get cramped, which is why each wheel has 10 depths.

With the scroll wheel or arrow keys you can cycle through them.

![wheel_over_next.en.png](https://github.com/dev-101010/APMOD/blob/main/images/wheel_over_next.en.png)

----

To manage all the entries there is another menu:

![filler_button.en.png](https://github.com/dev-101010/APMOD/blob/main/images/filler_button.en.png)

----

Here you can see all saved values assigned to the fields and the depth of the wheel they are in.

You can also create an alias for each value here, which will then be displayed in the wheel instead of the value.

![filler_menu.en.png](https://github.com/dev-101010/APMOD/blob/main/images/filler_menu.en.png)

<br /><br /><br />

## Selection helper:

The selection helper is again quite simple. Click one of the buttons and all associated checkboxes (that are loaded) will be selected.

By default, overwriting is disabled so that, for example, you can already set the "No" while working and later not overwrite it accidentally.

However, there is an Override checkbox; if this is selected, everything is set regardless of what was previously selected.

![selector.en.png](https://github.com/dev-101010/APMOD/blob/main/images/selector.en.png)

<br /><br /><br />

## Copy helper:

The copy helper lets you copy text and images from table cells to the clipboard simply by ALT + left-clicking on them.

![copy.en.png](https://github.com/dev-101010/APMOD/blob/main/images/copy.en.png)

In addition, copied text is stored in an internal list, which you can call up by ALT + left-clicking in an input field and insert the values again.
