
// Verification Checklist for GLB Fix
// Run this in the browser console to verify the state

// 1. Check if GLB Model Loaded
const model = window.campusApp?.roomManager?.campusModel;
if (!model?.rooms) console.error("❌ Model or Rooms not loaded");
else console.log(`✅ Model loaded with ${window.campusApp.roomManager.rooms.size} rooms mapped`);

// 2. Check for Buttons
const buttons = window.campusApp?.roomManager?.buttons;
if (!buttons || buttons.size === 0) console.warn("⚠️ No buttons found (check layers/names)");
else console.log(`✅ Found ${buttons.size} buttons:`, Array.from(buttons.keys()));

// 3. Test Room Data Integrity
const a14 = window.campusApp?.roomManager?.rooms.get("a14");
if (a14 && a14.data) console.log("✅ Room a14 loaded with Unified Data:", a14.data);
else console.error("❌ Room a14 missing or has no data");

// 4. Test Button Interaction Logic (simulate click)
// const btn = buttons.get("bttn - learning - units");
// if(btn) {
//    console.log("Simulating click on Learning Units button...");
//    window.campusApp.roomManager.highlightByUsage("learning units");
// }
