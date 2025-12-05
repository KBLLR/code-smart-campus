const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../data/entityLocations.json');

try {
    const data = fs.readFileSync(filePath, 'utf8');
    const locations = JSON.parse(data);

    const cleaned = locations.map((loc) => {
        const cleanedLoc = { ...loc };
        delete cleanedLoc.potentialSensors;
        return cleanedLoc;
    });

    fs.writeFileSync(filePath, JSON.stringify(cleaned, null, 2));
    console.log(`Cleaned ${cleaned.length} locations.`);
} catch (err) {
    console.error('Error cleaning file:', err);
    process.exit(1);
}
