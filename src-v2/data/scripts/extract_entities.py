#!/usr/bin/env python3
import re
import json
import sys

def extract_entities(path):
    entities = []
    collecting = False
    in_attrs = False
    brace_depth = 0
    entry = {}

    with open(path, 'r', encoding='utf-8') as f:
        for raw in f:
            line = raw.strip()

            # Start a new entry when we see entity_id
            if not collecting and line.startswith('entity_id'):
                m = re.match(r'entity_id\s*:\s*"([^"]+)"', line)
                if m:
                    collecting = True
                    entry = {
                        'entity_id': m.group(1),
                        'id': None,
                        'friendly_name': None
                    }
                continue

            if collecting:
                # Enter attributes block
                if not in_attrs and line.startswith('attributes'):
                    in_attrs = True
                    # one '{' follows 'attributes'
                    brace_depth = 1
                    continue

                if in_attrs:
                    # Track nested braces
                    brace_depth += line.count('{') - line.count('}')
                    # Try to capture `id: "..."` if not yet set
                    if entry['id'] is None:
                        m_id = re.match(r'id\s*:\s*"([^"]+)"', line)
                        if m_id:
                            entry['id'] = m_id.group(1)
                    # Capture friendly_name
                    if entry['friendly_name'] is None:
                        m_fn = re.match(r'friendly_name\s*:\s*"([^"]+)"', line)
                        if m_fn:
                            entry['friendly_name'] = m_fn.group(1)
                    # Exit attributes block
                    if brace_depth == 0:
                        in_attrs = False
                    continue

                # End of this object
                if line in ('},', '}'):
                    entities.append(entry)
                    collecting = False
                    entry = {}

    return entities

def main():
    path = sys.argv[1] if len(sys.argv) > 1 else 'mockup-Room_entity_data.json'
    result = extract_entities(path)
    print(json.dumps(result, indent=2, ensure_ascii=False))

if __name__ == '__main__':
    main()
