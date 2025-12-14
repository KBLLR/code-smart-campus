#!/bin/bash
# Fix z-index values to not block Space.js (which uses z-index 1000+)

echo "Fixing z-index values in HUD components..."

# CampusHeader: 1000 → 100
sed -i '' 's/zIndex: 1000,/zIndex: 100,  \/\/ REDUCED: Dont block Space.js/g' src/ui/hud/CampusHeader.js

# CampusMetrics: 1000 → 100
sed -i '' 's/zIndex: 1000,/zIndex: 100,  \/\/ REDUCED: Dont block Space.js/g' src/ui/hud/CampusMetrics.js

# HeaderBar: 1100 → 110
sed -i '' 's/zIndex: 1100,/zIndex: 110,  \/\/ REDUCED: Dont block Space.js/g' src/ui/hud/HeaderBar.js

# RoomHoverPanel: 2000 → 200
sed -i '' 's/zIndex: 2000,/zIndex: 200,  \/\/ REDUCED: Dont block Space.js/g' src/ui/hud/RoomHoverPanel.js

# CalendarTimeline: 1500 → 150
sed -i '' 's/zIndex: 1500,/zIndex: 150,  \/\/ REDUCED: Dont block Space.js/g' src/ui/CalendarTimeline.js

echo "✓ Z-index values fixed"
echo "Space.js Point3D canvas will now be at z-index ~1000"
echo "RoomDetailView remains at z-index 5000 (top layer)"
