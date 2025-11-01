# Extract relevant device status info using regex for different key indicators
device_states = re.findall(r'entity_id\s*:\s*"([^"]+)"\s*,\s*state\s*:\s*"([^"]+)"', js_content)

# Filter to only device-related categories
device_related_prefixes = ['sensor', 'binary_sensor', 'light', 'device_tracker']
filtered_devices = [(eid, state) for eid, state in device_states if eid.split(".")[0] in device_related_prefixes]

# Count state occurrences per device type
status_summary = {}
for eid, state in filtered_devices:
    device_type = eid.split(".")[0]
    if device_type not in status_summary:
        status_summary[device_type] = Counter()
    status_summary[device_type][state] += 1

# Plotting status for each device type
figs = []
for device_type, counts in status_summary.items():
    labels, values = zip(*counts.items())
    plt.figure(figsize=(7, 4))
    plt.bar(labels, values)
    plt.title(f"{device_type.capitalize()} Device State Distribution")
    plt.xlabel("State")
    plt.ylabel("Count")
    plt.grid(axis='y')
    plt.tight_layout()
    plt.show()

# Try broader pattern that handles potential formatting inconsistencies
entity_ids = re.findall(r'entity_id\s*:\s*"([^"]+)"', js_content)

# Check if any were found and then proceed
if entity_ids:
    entity_types = [eid.split(".")[0] for eid in entity_ids]
    entity_type_counts = Counter(entity_types)

    # Prepare data for plotting
    labels, counts = zip(*entity_type_counts.items())

    # Plot the distribution of entity types
    plt.figure(figsize=(10, 6))
    plt.bar(labels, counts)
    plt.title("Entity Type Distribution in Home Assistant Environment")
    plt.xlabel("Entity Type")
    plt.ylabel("Count")
    plt.xticks(rotation=45)
    plt.tight_layout()
    plt.grid(axis='y')
    plt.show()
else:
    entity_ids = "No entity_ids were found with current patterns."  # feedback for debugging

entity_ids[:10]  # preview some results if found

# Extract battery-related sensors and values using regex
battery_data = re.findall(
    r'entity_id\s*:\s*"([^"]+battery[^"]*)".*?state\s*:\s*"([^"]+)"',
    js_content,
    re.DOTALL
)

# Normalize and convert battery values to numeric if possible
battery_levels = []
for eid, state in battery_data:
    try:
        # Extract numeric percentage (e.g. "60%" or just "60")
        battery_pct = int(re.search(r'\d+', state).group())
        battery_levels.append((eid, battery_pct))
    except:
        continue  # Skip entries that can't be converted

# Sort by battery percentage
battery_levels_sorted = sorted(battery_levels, key=lambda x: x[1])

# Plot battery levels
device_names, battery_values = zip(*battery_levels_sorted)
plt.figure(figsize=(12, 6))
plt.barh(device_names, battery_values)
plt.xlabel("Battery Level (%)")
plt.title("Device Battery Levels")
plt.tight_layout()
plt.grid(axis='x')
plt.show()

# Extract room occupancy status from sensors with name "unoccupied_rooms" or similar
room_occupancy_data = re.findall(
    r'entity_id\s*:\s*"sensor\.unoccupied_rooms"[^}]*?state\s*:\s*"([^"]*)"',
    js_content
)

# Extract person states too for individual presence analysis
person_states = re.findall(
    r'entity_id\s*:\s*"person\.([^"]+)"[^}]*?state\s*:\s*"([^"]+)"',
    js_content
)

# Prepare data for display
unoccupied_status = room_occupancy_data[0] if room_occupancy_data else "No data"

# Count known vs unknown person states
person_state_counts = Counter([state for _, state in person_states])

# Display
person_state_df = pd.DataFrame(person_state_counts.items(), columns=["State", "Count"])
import ace_tools as tools; tools.display_dataframe_to_user(name="Person State Summary", dataframe=person_state_df)

# Extract activity sensor entries related to steps, pace, distance, floors ascended/descended
activity_data = re.findall(
    r'entity_id\s*:\s*"sensor\.([^"]+)"[^}]*?state\s*:\s*"([^"]+)"[^}]*?friendly_name\s*:\s*"([^"]+)"',
    js_content
)

# Filter only relevant activity sensors
activity_keywords = ["steps", "distance", "pace", "floors_ascended", "floors_descended"]
filtered_activity = [
    (eid, state, name) for eid, state, name in activity_data
    if any(keyword in eid.lower() for keyword in activity_keywords)
]

# Clean and parse numeric values
activity_metrics = []
for eid, state, name in filtered_activity:
    try:
        value = int(re.search(r'\d+', state).group())
        activity_metrics.append((name, value))
    except:
        continue

# Sort for display
activity_metrics_sorted = sorted(activity_metrics, key=lambda x: x[1], reverse=True)

# Plot
names, values = zip(*activity_metrics_sorted)
plt.figure(figsize=(10, 5))
plt.barh(names, values)
plt.xlabel("Activity Value")
plt.title("Sensor Activity Metrics")
plt.tight_layout()
plt.grid(axis='x')
plt.show()

# Extract connectivity-related sensor data (SSID, BSSID, Connection Type, State)
connectivity_data = re.findall(
    r'entity_id\s*:\s*"sensor\.([^"]*(?:ssid|bssid|connection_type))"[^}]*?state\s*:\s*"([^"]+)"[^}]*?friendly_name\s*:\s*"([^"]+)"',
    js_content
)

# Group data by sensor name and connection state
connectivity_summary = {}
for sensor, state, name in connectivity_data:
    base_name = name.split()[0]  # e.g., device name prefix
    if base_name not in connectivity_summary:
        connectivity_summary[base_name] = {}
    connectivity_summary[base_name][sensor] = state

# Convert to DataFrame
df_conn = pd.DataFrame.from_dict(connectivity_summary, orient="index").fillna("Not Reported")
df_conn.index.name = "Device"
import ace_tools as tools; tools.display_dataframe_to_user(name="Device Connectivity Status", dataframe=df_conn)

# Extract audio/visual sensor states
av_data = re.findall(
    r'entity_id\s*:\s*"binary_sensor\.([^"]*(?:camera|audio_input|audio_output|focus))"[^}]*?state\s*:\s*"([^"]+)"[^}]*?friendly_name\s*:\s*"([^"]+)"',
    js_content
)

# Structure data for display
av_summary = []
for sensor, state, name in av_data:
    device = name.split()[0]
    av_summary.append((device, sensor, state, name))

# Convert to DataFrame
df_av = pd.DataFrame(av_summary, columns=["Device", "Sensor", "State", "Friendly Name"])
import ace_tools as tools; tools.display_dataframe_to_user(name="Audio/Visual Sensor Status", dataframe=df_av)

# Extract GPS coordinate data from entities
gps_data = re.findall(
    r'entity_id\s*:\s*"([^"]+)"[^}]*?latitude\s*:\s*([-]?\d+\.\d+)[^}]*?longitude\s*:\s*([-]?\d+\.\d+)',
    js_content
)

# Convert to DataFrame
df_gps = pd.DataFrame(gps_data, columns=["Entity ID", "Latitude", "Longitude"])
df_gps["Latitude"] = df_gps["Latitude"].astype(float)
df_gps["Longitude"] = df_gps["Longitude"].astype(float)

# Plot GPS coordinates on a scatter plot
plt.figure(figsize=(8, 6))
plt.scatter(df_gps["Longitude"], df_gps["Latitude"], marker='o')
for i, row in df_gps.iterrows():
    plt.text(row["Longitude"], row["Latitude"], row["Entity ID"].split(".")[-1], fontsize=8)

plt.title("Geolocation of Entities")
plt.xlabel("Longitude")
plt.ylabel("Latitude")
plt.grid(True)
plt.tight_layout()
plt.show()

# Extract entity_id and state for alert-related terms
alert_data = re.findall(
    r'entity_id\s*:\s*"([^"]+)"[^}]*?state\s*:\s*"([^"]+)"[^}]*?friendly_name\s*:\s*"([^"]+)"',
    js_content
)

# Filter entries for alert-related states (focus, idle, alert, unavailable, etc.)
alert_keywords = ["focus", "idle", "alert", "attention", "unavailable", "unknown"]
alert_states = [(" ".join([eid.split(".")[0], name]), state) for eid, state, name in alert_data if any(kw in name.lower() or kw in state.lower() for kw in alert_keywords)]

# Organize into DataFrame
df_alerts = pd.DataFrame(alert_states, columns=["Entity", "State"])
alert_state_counts = df_alerts["State"].value_counts()

# Plot
plt.figure(figsize=(8, 4))
alert_state_counts.plot(kind="bar")
plt.title("Alert and Focus State Distribution")
plt.xlabel("State")
plt.ylabel("Count")
plt.xticks(rotation=45)
plt.tight_layout()
plt.grid(axis='y')
plt.show()

# Extract all state values for all entities
all_states_data = re.findall(
    r'entity_id\s*:\s*"([^"]+)"[^}]*?state\s*:\s*"([^"]+)"',
    js_content
)

# Count state frequencies
state_counts = Counter(state for _, state in all_states_data)

# Plot
states, counts = zip(*state_counts.items())
plt.figure(figsize=(10, 5))
plt.bar(states, counts)
plt.title("Entity State Distribution Across All Entities")
plt.xlabel("State")
plt.ylabel("Count")
plt.xticks(rotation=45)
plt.tight_layout()
plt.grid(axis='y')
plt.show()

# Adjust regex to extract from nested 'attributes' object
# Target 'entity_id', 'state', and 'attributes' including 'friendly_name'

attribute_data = re.findall(
    r'entity_id\s*:\s*"([^"]+)"[^}]*?state\s*:\s*"([^"]+)"[^}]*?attributes\s*:\s*{[^}]*?friendly_name\s*:\s*"([^"]+)"',
    js_content,
    re.DOTALL
)

# Count entities with complete records (all three fields)
completeness_stats = {
    "Total Entities": len(attribute_data),
    "Complete Records": len(attribute_data),
    "Missing State": 0,  # All matched entries have state
    "Missing Friendly Name": 0  # All matched entries have friendly_name
}

# Derive total entity count from all entity_id mentions
total_entities = len(re.findall(r'entity_id\s*:\s*"([^"]+)"', js_content))
completeness_stats["Total Entities"] = total_entities
completeness_stats["Missing State"] = total_entities - len(attribute_data)
completeness_stats["Missing Friendly Name"] = total_entities - len(attribute_data)

# Display updated stats
df_corrected_completeness = pd.DataFrame(list(completeness_stats.items()), columns=["Metric", "Count"])
import ace_tools as tools; tools.display_dataframe_to_user(name="Corrected Data Completeness Audit", dataframe=df_corrected_completeness)

# Extract all friendly_names and match them to entity types
entity_metadata = re.findall(
    r'entity_id\s*:\s*"([^"]+)"[^}]*?attributes\s*:\s*{[^}]*?friendly_name\s*:\s*"([^"]+)"',
    js_content,
    re.DOTALL
)

# Analyze for naming inconsistencies
naming_audit = []
for entity_id, name in entity_metadata:
    entity_type = entity_id.split(".")[0]
    clean_name = name.strip().lower()

    issues = []
    if "_" in name or "-" in name:
        issues.append("Contains special characters")
    if len(name.split()) < 2:
        issues.append("Too short")
    if not any(char.isalpha() for char in name):
        issues.append("No letters")
    if entity_type not in clean_name:
        issues.append("Type not in name")

    naming_audit.append((entity_id, name, ", ".join(issues) if issues else "OK"))

# Create and display DataFrame
df_naming = pd.DataFrame(naming_audit, columns=["Entity ID", "Friendly Name", "Naming Issues"])
import ace_tools as tools; tools.display_dataframe_to_user(name="Sensor Naming Audit", dataframe=df_naming)

from collections import defaultdict
import yaml

# Group entities by type
grouped_entities = defaultdict(list)
for entity_id, _ in entity_metadata:
    entity_type = entity_id.split(".")[0]
    grouped_entities[entity_type].append(entity_id)

# Format as YAML-style dictionary under 'grouped_entities'
grouped_yaml_data = {"grouped_entities": dict(grouped_entities)}

# Write to a YAML file
grouped_yaml_path = "/mnt/data/grouped_entities_by_category.yaml"
with open(grouped_yaml_path, "w") as file:
    yaml.dump(grouped_yaml_data, file, default_flow_style=False)

grouped_yaml_path

from xml.dom.minidom import Document

# Simulate SVG generation since actual SVG content isn't editable from JPEG
# We'll generate a new SVG using matched rooms and sensor data
doc = Document()

# Create the root SVG element
svg = doc.createElement('svg')
svg.setAttribute('xmlns', 'http://www.w3.org/2000/svg')
svg.setAttribute('width', '2025')
svg.setAttribute('height', '1627')
svg.setAttribute('viewBox', '0 0 2025 1627')
doc.appendChild(svg)

# Annotate each mapped room with sensor labels
for room, svg_id in sensor_to_svg_mapping.items():
    sensors = sensor_data[room]
    group = doc.createElement('g')
    group.setAttribute('id', f"{svg_id}_annotated")

    # Add a text label for the room
    text = doc.createElement('text')
    text.setAttribute('x', '10')
    text.setAttribute('y', str(100 + len(svg.childNodes) * 60))
    text.setAttribute('fill', 'black')
    text.setAttribute('font-size', '14')
    text.appendChild(doc.createTextNode(f"{room}: " + ", ".join(sensors.keys())))
    group.appendChild(text)

    svg.appendChild(group)

# Save the generated SVG
annotated_svg_path = "/mnt/data/annotated_floorplan.svg"
with open(annotated_svg_path, "w") as file:
    doc.writexml(file, indent="  ", addindent="  ", newl="\n")

annotated_svg_path
