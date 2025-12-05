import json
import re
import os

def normalize_id(room_id):
    if not isinstance(room_id, str):
        return room_id
    # Remove dots and convert to lowercase
    return room_id.replace(".", "").lower()

def process_file(file_path):
    print(f"Processing {file_path}...")
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            data = json.load(f)
        
        modified = False
        
        # Handle sensors-mapping.json structure
        if "rooms" in data and isinstance(data["rooms"], list):
            for room in data["rooms"]:
                if "id" in room:
                    original_id = room["id"]
                    new_id = normalize_id(original_id)
                    if new_id != original_id:
                        room["id"] = new_id
                        print(f"  Renamed: {original_id} -> {new_id}")
                        modified = True
        
        # Handle rooms_personalities.json structure (list of objects)
        elif isinstance(data, list):
            for room in data:
                if "id" in room:
                    original_id = room["id"]
                    new_id = normalize_id(original_id)
                    if new_id != original_id:
                        room["id"] = new_id
                        print(f"  Renamed: {original_id} -> {new_id}")
                        modified = True
                        
        if modified:
            with open(file_path, 'w', encoding='utf-8') as f:
                json.dump(data, f, indent=2, ensure_ascii=False)
            print(f"Saved changes to {file_path}")
        else:
            print(f"No changes needed for {file_path}")
            
    except Exception as e:
        print(f"Error processing {file_path}: {e}")

if __name__ == "__main__":
    files_to_process = [
        "src/data/sensors/sensors-mapping.json",
        "src/data/personalities/rooms_personalities.json"
    ]
    
    # Adjust paths to be relative to CWD if needed, or absolute
    # Assuming script is run from project root
    for file_path in files_to_process:
        if os.path.exists(file_path):
            process_file(file_path)
        else:
            print(f"File not found: {file_path}")
