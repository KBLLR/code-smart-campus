/**
 * Harmony Format Parser
 * Parses OpenAI Harmony format responses from GPT-OSS models
 *
 * Harmony format structure:
 * <|analysis|>Internal reasoning<|end|>
 * <|commentary|>Thoughts and considerations<|end|>
 * <|final|>User-facing answer<|end|>
 */

/**
 * Extract a specific channel from Harmony format response
 * @param {string} harmonyResponse - Full Harmony format response
 * @param {string} channelName - Channel to extract (analysis, commentary, final)
 * @returns {string} - Extracted channel content
 */
export function extractChannel(harmonyResponse, channelName) {
  if (!harmonyResponse || typeof harmonyResponse !== 'string') {
    return '';
  }

  // Pattern: <|channelName|>content... (<|end|> OR next tag OR end of string)
  // We use a more robust regex that looks for the start tag, captures content, 
  // and stops at <|end|> OR the start of a new tag OR end of string.
  const pattern = new RegExp(`<\\|${channelName}\\|>([\\s\\S]*?)(?:<\\|end\\|>|<\\||$)`, 'i');
  const match = harmonyResponse.match(pattern);

  if (match && match[1]) {
    return match[1].trim();
  }

  // Fallback: if requesting 'final' and no tags found, check if maybe the whole thing is the answer?
  // But for 'analysis', if not found, we return empty.
  return '';
}

/**
 * Parse full Harmony response into structured object
 * @param {string} harmonyResponse - Full Harmony format response
 * @returns {object} - { analysis, commentary, final, raw }
 */
export function parseHarmonyResponse(harmonyResponse) {
  return {
    analysis: extractChannel(harmonyResponse, 'analysis'),
    commentary: extractChannel(harmonyResponse, 'commentary'),
    final: extractChannel(harmonyResponse, 'final'),
    raw: harmonyResponse
  };
}

/**
 * Extract Cerberus's three-headed observations from analysis channel
 * Cerberus uses the analysis channel for its three observation layers
 *
 * @param {string} analysisChannel - Analysis channel content
 * @returns {object} - { head_1, head_2, head_3 }
 */
export function extractCerberusHeads(analysisChannel) {
  if (!analysisChannel) {
    return {
      head_1: null,
      head_2: null,
      head_3: null
    };
  }

  // Look for patterns like "Environmental Layer:", "Academic Layer:", "Social Layer:"
  const patterns = {
    head_1: /Environmental (?:Layer|Guardian):?\s*([^\n]+(?:\n(?!(?:Academic|Social))[^\n]+)*)/i,
    head_2: /Academic (?:Layer|Observer):?\s*([^\n]+(?:\n(?!Social)[^\n]+)*)/i,
    head_3: /Social (?:Layer|Synthesizer):?\s*([^\n]+(?:\n[^\n]+)*)/i
  };

  const heads = {};

  for (const [head, pattern] of Object.entries(patterns)) {
    const match = analysisChannel.match(pattern);
    if (match && match[1]) {
      heads[head] = match[1].trim();
    } else {
      heads[head] = null;
    }
  }

  return heads;
}

/**
 * Format Harmony system prompt for Cerberus
 * @param {string} baseInstructions - Base agent instructions
 * @returns {string} - Harmony-formatted system prompt
 */
export function formatCerberusHarmonyPrompt(baseInstructions) {
  const currentDate = new Date().toISOString().split('T')[0];

  return `Knowledge cutoff: 2024-06
Current date: ${currentDate}
Reasoning: high

You MUST structure your response using these THREE channels:

1. <|analysis|>
   Include your three-headed observations:

   Environmental Layer: Temperature, occupancy, CO2, air quality, energy across all rooms

   Academic Layer: Classes, research, events, learning activities happening now

   Social Layer: Collaboration patterns, energy, flow, human connections

   <|end|>

2. <|commentary|>
   Cross-room patterns, insights, anomalies, and campus-wide trends you observe
   <|end|>

3. <|final|>
   Your poetic 2-sentence campus overview that synthesizes everything above.
   Use precise numbers and present tense. See the campus as a living organism.
   <|end|>

${baseInstructions}`;
}

/**
 * Check if a response is in Harmony format
 * @param {string} response - Response to check
 * @returns {boolean}
 */
export function isHarmonyFormat(response) {
  if (!response || typeof response !== 'string') {
    return false;
  }

  // Check for presence of ANY Harmony channel marker start
  return /<\|(analysis|commentary|final)\|>/i.test(response);
}

/**
 * Get display text from Harmony response
 * Extracts the final channel if available, otherwise returns raw response
 * @param {string} harmonyResponse - Harmony format response
 * @returns {string} - Text to display to user
 */
export function getDisplayText(harmonyResponse) {
  if (isHarmonyFormat(harmonyResponse)) {
    const parsed = parseHarmonyResponse(harmonyResponse);
    // If we found a final channel, return it.
    if (parsed.final) return parsed.final;

    // If we found NO final channel but DID find analysis, 
    // it means the model might have cut off or failed to produce final.
    // In this case, we don't want to show raw reasoning. 
    // We return a fallback "..." or simply the raw text if truly ambiguous.
    // But better to verify if it has analysis and NO final, implies incomplete gen.
    if (parsed.analysis && !parsed.final) {
      return "(Agent is thinking...)"; // or handle as error?
    }
  }

  // Fallback: If no tags are detected at all, return the raw response 
  // (Assuming model forgot to use tags and just answered)
  return harmonyResponse;
}
