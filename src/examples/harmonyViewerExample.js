/**
 * HarmonyResponseViewer Integration Example
 * Shows how to use the Harmony viewer in your app
 */

import { getHarmonyViewer } from '@/ui/HarmonyResponseViewer.js';

// Example Harmony format response
const exampleHarmonyResponse = `<|analysis|>
Environmental Layer: Temperature 22.5°C, Occupancy 15/30 across all monitored rooms, CO2 levels normal at 650ppm. Air quality optimal with all sensors reporting green status.

Academic Layer: CS 301 Machine Learning session active in Room A.5 (14 participants). Workshop "Data Visualization" scheduled for Room B.7 at 2pm. No conflicts detected in calendar system.

Social Layer: High collaboration energy in makerspace areas. Study groups forming naturally in Library (6 students), Peace Room (3 students). Morning productivity peak observed.
<|end|>

<|commentary|>
Cross-room pattern: Temperature variance of 3°C between north-facing (A-wing: 21°C) and south-facing rooms (B-wing: 24°C) suggests HVAC imbalance. Recommend zone adjustment.

Anomaly: Room A.11 showing zero occupancy despite calendar showing booked session - possible sensor malfunction or booking cancellation without system update.

Campus-wide trend: 60% capacity utilization matches typical Tuesday morning baseline. Energy usage 12% below weekly average due to cooler outdoor temps.
<|end|>

<|final|>
25 minds collaborate across 8 laboratories at 22°C. Morning sun illuminates CS 301 Machine Learning—innovation hums through connected spaces.
<|end|>`;

// Initialize viewer (automatically done, singleton pattern)
const viewer = getHarmonyViewer();

/**
 * Example 1: Show Harmony response in viewer
 */
export function showHarmonyExample() {
  viewer.show(exampleHarmonyResponse);
}

/**
 * Example 2: Integrate with Campus AI agent
 */
export async function askCampusAI(question) {
  try {
    // Call MLX API via orchestrator
    const response = await fetch('http://localhost:3001/api/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'gpt-oss-20b',
        messages: [
          {
            role: 'system',
            content: `You are Cerberus, the Smart Campus AI. Respond in Harmony format:

<|analysis|>
Environmental Layer: [sensor data analysis]
Academic Layer: [calendar and learning activities]
Social Layer: [collaboration and human patterns]
<|end|>

<|commentary|>
[Cross-room patterns, anomalies, trends]
<|end|>

<|final|>
[2-sentence poetic campus overview]
<|end|>`
          },
          {
            role: 'user',
            content: question
          }
        ],
        max_tokens: 500
      })
    });

    const result = await response.json();
    const harmonyResponse = result.choices[0].message.content;

    // Show in viewer
    viewer.show(harmonyResponse);

    return harmonyResponse;
  } catch (error) {
    console.error('Error asking Campus AI:', error);
    viewer.show(`<|final|>
Error connecting to Campus AI. Please check the MLX server is running on port 8000.
<|end|>`);
  }
}

/**
 * Example 3: Room-specific AI query
 */
export async function askRoomAgent(roomId, question) {
  try {
    const response = await fetch('http://localhost:3001/api/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'phi-3',
        messages: [
          {
            role: 'system',
            content: `You are the AI agent for Room ${roomId}. Respond in Harmony format with analysis, commentary, and final answer.`
          },
          {
            role: 'user',
            content: question
          }
        ]
      })
    });

    const result = await response.json();
    viewer.show(result.choices[0].message.content);
  } catch (error) {
    console.error('Error asking Room AI:', error);
  }
}

/**
 * Example 4: Add to UI button
 */
export function addAskAIButton() {
  const button = document.createElement('button');
  button.textContent = 'ASK CAMPUS AI';
  button.className = 'ask-ai-button';
  button.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    padding: 12px 24px;
    background: rgba(6, 6, 6, 0.85);
    backdrop-filter: blur(20px);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 8px;
    color: #fff;
    font-family: var(--ui-font-family);
    font-size: var(--ui-font-size);
    letter-spacing: 1px;
    cursor: pointer;
    z-index: 1000;
    transition: all 0.2s ease;
  `;

  button.addEventListener('mouseenter', () => {
    button.style.background = 'rgba(255, 255, 255, 0.05)';
  });

  button.addEventListener('mouseleave', () => {
    button.style.background = 'rgba(6, 6, 6, 0.85)';
  });

  button.addEventListener('click', () => {
    const question = prompt('Ask the Campus AI a question:');
    if (question) {
      askCampusAI(question);
    }
  });

  document.body.appendChild(button);
}

/**
 * Example 5: Keyboard shortcut
 */
export function enableKeyboardShortcut() {
  document.addEventListener('keydown', (e) => {
    // Ctrl/Cmd + H to show harmony viewer with example
    if ((e.ctrlKey || e.metaKey) && e.key === 'h') {
      e.preventDefault();
      showHarmonyExample();
    }

    // Ctrl/Cmd + K to ask AI (like Spotlight)
    if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
      e.preventDefault();
      const question = prompt('Ask the Campus AI:');
      if (question) {
        askCampusAI(question);
      }
    }
  });
}

// Console helpers for debugging
if (typeof window !== 'undefined') {
  window.harmonyViewer = viewer;
  window.showHarmonyExample = showHarmonyExample;
  window.askCampusAI = askCampusAI;
  window.askRoomAgent = askRoomAgent;

  console.log('[Harmony Viewer] Available console commands:');
  console.log('  window.showHarmonyExample()        - Show example response');
  console.log('  window.askCampusAI(question)       - Ask Campus AI');
  console.log('  window.askRoomAgent(roomId, q)     - Ask Room AI');
  console.log('  window.harmonyViewer.show(response) - Show custom response');
  console.log('  Ctrl/Cmd + H                        - Show example');
  console.log('  Ctrl/Cmd + K                        - Ask AI');
}
