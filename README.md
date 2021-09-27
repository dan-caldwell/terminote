# Terminote

Make notes in your terminal extremely quickly. No need to name the files.

## Install the CLI

```npm install . -g```

## Use the CLI

```note```

This will open nano with your note for the day.

## Go to a previous note

You can go to a previous note by typing in a negative number of days. Yesterday's note would be -1 days ago.

```note -1```

## Preview a note

If you want to simply preview a note, you can use the `-p` flag. If you want to preview a previous day's note, use a negative number. To preview a note from 2 days ago, you would use -2.

```note -p -2``` or ```note -2 -p```

## Open the notes folder

```note --open```

## Configure note path

You can configure the path the notes should go with the `--path` flag.

```note --path /Users/yourname/Documents/Notes```