import bpy
import re

def rename_objects():
    """
    Renames objects in the 'rooms' collection (or selected objects if 'rooms' not found)
    to match the project's naming convention.
    """
    
    # Specific mappings for known discrepancies
    # Key: Current Blender Name (or part of it), Value: Target ID
    specific_mappings = {
        "lab_makerspace": "makerspace",
        "terrace_hydrogen": "hydrogen",
        "terrace_oxygen": "Oxygen",
        "lifts": "Lifts",
        "restrooms_exits_01": "Restrooms_exits_01",
        "restrooms_exits_02": "Restrooms_exits_02",
        "kitchen": "kitchen", # Ensure case matches
        "library": "library", # Ensure case matches
    }

    # Regex pattern for standard rooms (e.g., a1 -> a.1, b23 -> b.23)
    # Matches a single letter 'a' or 'b' followed by digits
    room_pattern = re.compile(r"^([ab])(\d+)$", re.IGNORECASE)

    # Target objects: 'rooms' collection or selection
    objects_to_process = []
    collection_name = "rooms"
    
    if collection_name in bpy.data.collections:
        print(f"Found collection '{collection_name}'. Processing objects inside it.")
        objects_to_process = bpy.data.collections[collection_name].objects
    else:
        print(f"Collection '{collection_name}' not found. Falling back to selected objects.")
        objects_to_process = bpy.context.selected_objects

    if not objects_to_process:
        print("No objects found to process.")
        return

    print(f"Processing {len(objects_to_process)} objects...")

    count = 0
    for obj in objects_to_process:
        old_name = obj.name
        new_name = old_name

        # 1. Check specific mappings first
        if old_name in specific_mappings:
            new_name = specific_mappings[old_name]
        
        # 2. Check regex pattern (a1 -> a.1)
        else:
            match = room_pattern.match(old_name)
            if match:
                prefix = match.group(1).lower() # Force lowercase a/b
                number = match.group(2)
                new_name = f"{prefix}.{number}"

        # Apply rename if changed
        if new_name != old_name:
            obj.name = new_name
            print(f"Renamed: '{old_name}' -> '{new_name}'")
            count += 1
        else:
            # Optional: Print skipped to debug
            # print(f"Skipped: '{old_name}'")
            pass

    # Force update of the dependency graph to ensure UI refreshes
    bpy.context.view_layer.update()
    
    print("-" * 30)
    print(f"Rename Complete. Renamed {count} objects.")
    print("-" * 30)

# Execute the function
rename_objects()
