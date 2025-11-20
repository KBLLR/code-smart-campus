#!/bin/bash

HTML_FILE="design-system-poster.html" # Default file to fix
PYTHON_SCRIPT="fix_json_attributes.py"
PYTHON_CMD="python3" # Or just "python" if python3 is default

# Check if Python script exists
if [ ! -f "$PYTHON_SCRIPT" ]; then
    echo "Error: Python script '$PYTHON_SCRIPT' not found in the current directory."
    exit 1
fi

# Check if target HTML file exists
if [ ! -f "$HTML_FILE" ]; then
    echo "Error: HTML file '$HTML_FILE' not found in the current directory."
    echo "You may need to edit the HTML_FILE variable in this script."
    exit 1
fi

# Check for BeautifulSoup dependency
echo "Checking for Python dependency 'BeautifulSoup4'..."
if ! $PYTHON_CMD -c "import bs4" > /dev/null 2>&1; then
    echo "Error: Python library 'BeautifulSoup4' not found."
    echo "Please install it using: pip install beautifulsoup4"
    exit 1
else
    echo "Dependency found."
fi


echo "Running JSON attribute fixer..."
"$PYTHON_CMD" "$PYTHON_SCRIPT" "$HTML_FILE"

exit_code=$?

if [ $exit_code -eq 0 ]; then
    echo "Script finished."
else
    echo "Script finished with errors (exit code: $exit_code)."
fi

exit $exit_code