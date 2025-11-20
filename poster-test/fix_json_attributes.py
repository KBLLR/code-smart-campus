#!/usr/bin/env python3
import sys
import json
import re
from bs4 import BeautifulSoup

# --- Configuration ---
# Define which tags and attributes might contain JSON
TARGET_ATTRIBUTES = {
    'timeline-event-card': ['visuals', 'key-elements'],
    'sticky-note': ['items'],
    'floor-plan': ['rooms'],
    'tech-diagram': ['nodes', 'connections']
    # Add more tag: [attribute_list] pairs if needed
}

# Regex to remove JavaScript style block comments (/* ... */)
# Handles multi-line comments with re.DOTALL
BLOCK_COMMENT_REGEX = re.compile(r'/\*.*?\*/', re.DOTALL)

# Regex to remove JavaScript style line comments (// ...)
# Requires processing line by line if attribute value contains newlines,
# or a more complex regex. Let's focus on block comments first as
# they were the primary issue identified.
# LINE_COMMENT_REGEX = re.compile(r'//.*')

def clean_json_string(raw_string):
    """Removes common invalid patterns like JS comments from a string."""
    if not raw_string:
        return raw_string
    # Remove block comments
    cleaned = BLOCK_COMMENT_REGEX.sub('', raw_string)
    # Add other cleaning steps here if needed (e.g., line comments)
    # cleaned = '\n'.join([LINE_COMMENT_REGEX.sub('', line) for line in cleaned.splitlines()])
    return cleaned.strip() # Remove leading/trailing whitespace

def fix_html_file(filepath):
    """Parses HTML, finds target attributes, cleans & validates JSON, updates file."""
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            html_content = f.read()
    except FileNotFoundError:
        print(f"Error: File not found at '{filepath}'")
        sys.exit(1)
    except Exception as e:
        print(f"Error reading file '{filepath}': {e}")
        sys.exit(1)

    soup = BeautifulSoup(html_content, 'html.parser')
    modified = False

    print(f"Processing '{filepath}'...")

    for tag_name, attributes in TARGET_ATTRIBUTES.items():
        elements = soup.find_all(tag_name)
        print(f"  Found {len(elements)} <{tag_name}> elements.")
        for element in elements:
            for attr_name in attributes:
                if element.has_attr(attr_name):
                    original_value = element[attr_name]
                    cleaned_value = clean_json_string(original_value)

                    if not cleaned_value:
                        # Skip empty attributes
                        continue

                    try:
                        # Attempt to parse the cleaned JSON
                        parsed_json = json.loads(cleaned_value)
                        # Re-serialize to ensure validity and consistent formatting
                        # Use ensure_ascii=False if you have non-ASCII chars,
                        # but be mindful of HTML encoding then.
                        valid_json_string = json.dumps(parsed_json, separators=(',', ':')) # Compact

                        # Only update if the re-serialized string is different
                        # from the *original* (after basic cleaning) to avoid
                        # unnecessary changes just due to formatting differences.
                        # We compare against cleaned_value to handle cases where
                        # only comments were the issue.
                        if valid_json_string != cleaned_value:
                             print(f"    Updating attribute '{attr_name}' in <{tag_name}>...")
                             # print(f"      Original: {original_value[:50]}...") # Debug
                             # print(f"      Cleaned:  {cleaned_value[:50]}...") # Debug
                             # print(f"      New JSON: {valid_json_string[:50]}...") # Debug
                             element[attr_name] = valid_json_string
                             modified = True

                    except json.JSONDecodeError as e:
                        # Check if the original value might have had HTML entity issues
                        # This part is heuristic - might not catch all cases
                        if '&apos;' in original_value or '&quot;' in original_value:
                             print(f"    WARNING: JSONDecodeError for '{attr_name}' in <{tag_name}>. "
                                   f"Original value contained HTML entities ('&apos;' or '&quot;'). "
                                   f"Parsing requires these to be decoded *before* JSON parsing, "
                                   f"which BeautifulSoup usually handles. Error: {e}")
                        elif cleaned_value != original_value:
                            print(f"    WARNING: JSONDecodeError for '{attr_name}' in <{tag_name}> after cleaning comments. "
                                  f"Check syntax. Error: {e}. Value: {cleaned_value[:100]}...")
                        else:
                            print(f"    WARNING: Invalid JSON found for '{attr_name}' in <{tag_name}>. "
                                  f"Could not fix automatically. Error: {e}. Value: {original_value[:100]}...")
                    except Exception as e:
                         print(f"    ERROR: Unexpected error processing '{attr_name}' in <{tag_name}>: {e}")


    if modified:
        try:
            # Use str(soup) which often preserves formatting better than prettify()
            # for attribute values containing JSON.
            # Ensure output uses double quotes for attributes for better compatibility
            # with JSON containing single quotes.
            output_html = str(soup)

            # Optional: A regex fallback to try and force double quotes on our target attributes
            # This is a bit hacky but might help ensure the output is more consistent
            # for attr_value in re.findall(r"(visuals|items|key-elements|rooms|nodes|connections)='(\[.*?\])'", output_html, re.DOTALL):
            #     attr_name = attr_value[0]
            #     json_str_single_quoted = attr_value[1]
            #     # Only replace if it hasn't already been double-quoted
            #     if f'{attr_name}="{json_str_single_quoted}"' not in output_html:
            #          output_html = output_html.replace(f"{attr_name}='{json_str_single_quoted}'", f'{attr_name}="{json_str_single_quoted}"')


            with open(filepath, 'w', encoding='utf-8') as f:
                f.write(output_html)
            print(f"Successfully updated JSON in '{filepath}'.")
        except Exception as e:
            print(f"Error writing updated file '{filepath}': {e}")
            sys.exit(1)
    else:
        print(f"No JSON attributes needed fixing in '{filepath}'.")


if __name__ == "__main__":
    if len(sys.argv) != 2:
        print("Usage: python fix_json_attributes.py <path_to_html_file>")
        sys.exit(1)

    html_filepath = sys.argv[1]
    fix_html_file(html_filepath)