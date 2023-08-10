#!/bin/bash
TODAY=$(date '+%Y-%m-%d')
NOTES_DIR='/Users/dan/Documents/Notes/days'
FILE_NAME="$NOTES_DIR/$TODAY.txt"
touch $FILE_NAME
open -a TextEdit $FILE_NAME