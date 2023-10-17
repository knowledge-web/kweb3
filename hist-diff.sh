cd ~/kweb2/Brain

# Get today's date in YYYY-MM-DD format
today=$(date +"%Y-%m-%d")

echo "# Recent Changes"

# Loop through the last 14 days
for i in {0..13}; do
  # Calculate the date for i days ago
  formatted_date=$(date -d "$today - $i days" +"%Y-%m-%d")

  # Get the list of files changed on that day
  file_list=$(git log --name-only --pretty="format:" --after="${formatted_date} 00:00" --before="${formatted_date} 23:59")

  # If changes were made on that day, print the day and list of files
  if [ ! -z "$file_list" ]; then
    echo "## ${formatted_date}"
  
    # Process each UUID line by line
    echo "$file_list" | sort -u | grep Notes.md | cut -d'/' -f2 | while read -r uuid; do
      # Fetch the name from the SQLite database
      name=$(echo "SELECT Name FROM thoughts WHERE Id='${uuid}';" | sqlite3 ~/kweb-data/brain.db)
    
      # Print the Markdown link
      if [ ! -z "$name" ]; then
        echo " - [${name}](#id=${uuid})"
      fi
    done
  
    echo "-----------------------------------------"
  fi
done

