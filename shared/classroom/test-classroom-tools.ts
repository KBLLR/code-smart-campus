/**
 * Test Classroom Tools
 *
 * Simple test script to validate classroom tools work correctly
 * with example JSON files.
 *
 * Run: node --loader ts-node/esm shared/classroom/test-classroom-tools.ts
 * Or: tsx shared/classroom/test-classroom-tools.ts
 */

import {
  get_classroom,
  get_classroom_snapshot,
  append_classroom_event,
  preloadClassrooms,
} from './classroom-tools';

async function runTests() {
  console.log('='.repeat(60));
  console.log('Classroom Tools Test Suite');
  console.log('='.repeat(60));
  console.log('');

  // Test 1: Load eng-101 classroom
  console.log('Test 1: Load eng-101 classroom');
  console.log('-'.repeat(60));
  const eng101Result = await get_classroom({ classroom_id: 'eng-101' });

  if (eng101Result.success && eng101Result.data) {
    console.log('✅ Success!');
    console.log(`   Name: ${eng101Result.data.name}`);
    console.log(`   Teacher: ${eng101Result.data.personas.teacher?.name}`);
    console.log(`   Students: ${eng101Result.data.personas.students.length}`);
    console.log(`   Temperature: ${eng101Result.data.sensors.temperatureC}°C`);
    console.log(`   CO2: ${eng101Result.data.sensors.co2ppm}ppm`);
    console.log(`   Occupancy: ${eng101Result.data.sensors.occupancyCount}`);
  } else {
    console.log('❌ Failed:', eng101Result.error);
  }
  console.log('');

  // Test 2: Load lab-a classroom
  console.log('Test 2: Load lab-a classroom');
  console.log('-'.repeat(60));
  const labAResult = await get_classroom({ classroom_id: 'lab-a' });

  if (labAResult.success && labAResult.data) {
    console.log('✅ Success!');
    console.log(`   Name: ${labAResult.data.name}`);
    console.log(`   Teacher: ${labAResult.data.personas.teacher?.name}`);
    console.log(`   Assistants: ${labAResult.data.personas.assistants.length}`);
    console.log(`   SafetyAgent: ${labAResult.data.personas.assistants[0]?.name}`);
    console.log(`   GitHub: ${labAResult.data.integrations.githubRepo}`);
    console.log(`   Theme: ${labAResult.data.ui.theme}`);
  } else {
    console.log('❌ Failed:', labAResult.error);
  }
  console.log('');

  // Test 3: Get snapshot for eng-101
  console.log('Test 3: Get snapshot for eng-101');
  console.log('-'.repeat(60));
  const eng101Snapshot = await get_classroom_snapshot({ classroom_id: 'eng-101' });

  if (eng101Snapshot.success && eng101Snapshot.data) {
    console.log('✅ Success!');
    console.log(`   Classroom: ${eng101Snapshot.data.name}`);
    console.log(`   Scene: ${eng101Snapshot.data.stage.sceneKey}`);
    console.log(`   Layout: ${eng101Snapshot.data.stage.layoutPreset}`);
    console.log(`   Comfort Score: ${eng101Snapshot.data.sensors.comfortScore}/100`);
    console.log(`   Teacher: ${eng101Snapshot.data.personas.teacher}`);
    console.log(`   Students: ${eng101Snapshot.data.personas.studentCount}`);
    console.log(`   Current Activity: ${eng101Snapshot.data.currentActivity || 'unknown'}`);
  } else {
    console.log('❌ Failed:', eng101Snapshot.error);
  }
  console.log('');

  // Test 4: Get snapshot for lab-a
  console.log('Test 4: Get snapshot for lab-a');
  console.log('-'.repeat(60));
  const labASnapshot = await get_classroom_snapshot({ classroom_id: 'lab-a' });

  if (labASnapshot.success && labASnapshot.data) {
    console.log('✅ Success!');
    console.log(`   Classroom: ${labASnapshot.data.name}`);
    console.log(`   Scene: ${labASnapshot.data.stage.sceneKey}`);
    console.log(`   Layout: ${labASnapshot.data.stage.layoutPreset}`);
    console.log(`   Comfort Score: ${labASnapshot.data.sensors.comfortScore}/100`);
    console.log(`   Teacher: ${labASnapshot.data.personas.teacher}`);
    console.log(`   Assistants: ${labASnapshot.data.personas.assistantCount}`);
    console.log(`   Current Activity: ${labASnapshot.data.currentActivity || 'unknown'}`);
  } else {
    console.log('❌ Failed:', labASnapshot.error);
  }
  console.log('');

  // Test 5: Append event to eng-101
  console.log('Test 5: Append event to eng-101');
  console.log('-'.repeat(60));
  const eventResult = await append_classroom_event({
    classroom_id: 'eng-101',
    event: {
      type: 'discussion',
      summary: 'Group discussion about symbolism in Gatsby',
      payload: {
        topic: 'The Great Gatsby - Green Light Symbolism',
        duration_minutes: 20,
        participants: 18,
      },
      actor: {
        id: 'prof-sarah-chen',
        name: 'Prof. Sarah Chen',
        role: 'teacher',
      },
    },
  });

  if (eventResult.success && eventResult.data) {
    console.log('✅ Success!');
    console.log(`   Event ID: ${eventResult.data.eventId}`);
  } else {
    console.log('❌ Failed:', eventResult.error);
  }
  console.log('');

  // Test 6: Append sensor alert to lab-a
  console.log('Test 6: Append sensor alert to lab-a');
  console.log('-'.repeat(60));
  const alertResult = await append_classroom_event({
    classroom_id: 'lab-a',
    event: {
      type: 'sensor-alert',
      summary: 'CO₂ levels approaching threshold, suggesting break',
      payload: {
        sensor: 'co2',
        value: 980,
        threshold: 1000,
        action: 'suggest-break',
      },
      actor: {
        id: 'safety-agent',
        name: 'SafetyAgent',
        role: 'facility',
      },
    },
  });

  if (alertResult.success && alertResult.data) {
    console.log('✅ Success!');
    console.log(`   Event ID: ${alertResult.data.eventId}`);
  } else {
    console.log('❌ Failed:', alertResult.error);
  }
  console.log('');

  // Test 7: Try to load non-existent classroom
  console.log('Test 7: Load non-existent classroom (should fail gracefully)');
  console.log('-'.repeat(60));
  const invalidResult = await get_classroom({ classroom_id: 'does-not-exist' });

  if (!invalidResult.success) {
    console.log('✅ Correctly failed!');
    console.log(`   Error: ${invalidResult.error}`);
  } else {
    console.log('❌ Should have failed but succeeded');
  }
  console.log('');

  // Test 8: Preload all classrooms
  console.log('Test 8: Preload all classrooms');
  console.log('-'.repeat(60));
  await preloadClassrooms();
  console.log('✅ Preload complete');
  console.log('');

  // Summary
  console.log('='.repeat(60));
  console.log('Test Suite Complete');
  console.log('='.repeat(60));
}

// Run tests
runTests().catch((error) => {
  console.error('Test suite failed:', error);
  process.exit(1);
});
