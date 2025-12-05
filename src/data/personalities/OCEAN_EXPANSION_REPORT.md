# OCEAN Personality Expansion Report

## Executive Summary
This report details the research and reasoning behind the expansion of the `ocean-personalities.json` system. The goal is to create a more psychometrically grounded and linguistically distinct set of agent personalities for the Smart Campus simulation. By mapping the Big Five (OCEAN) personality traits to specific Large Language Model (LLM) parameters and rhetorical strategies, we can generate agents that not only have distinct "vibes" but also fundamentally different cognitive and communicative styles.

## Research Findings

### 1. The Big Five (OCEAN) Framework & Psycholinguistics
The Five-Factor Model (FFM) is the gold standard in personality psychology. Our research identified specific linguistic markers for each trait:

*   **Openness (O)**: Correlates with lexical diversity, complex sentence structures, and words related to ideas, aesthetics, and philosophy.
    *   *LLM Implication*: Higher `temperature` (0.8-1.0) to encourage novel token selection; prompts emphasizing metaphor and abstraction.
*   **Conscientiousness (C)**: Marked by precise, organized, and achievement-oriented language. Fewer negations and swear words; more references to work and time.
    *   *LLM Implication*: Lower `temperature` (0.2-0.4) for deterministic, reliable output; strict adherence to `maxTokens` to reflect efficiency.
*   **Extraversion (E)**: Associated with verbosity, positive emotion words, social process words, and second-person pronouns ("you").
    *   *LLM Implication*: Higher `maxTokens` (verbosity); prompts encouraging conversational and engaging rhetoric.
*   **Agreeableness (A)**: Linked to communal language, first-person plural pronouns ("we"), and positive emotional valence.
    *   *LLM Implication*: Rhetoric focused on consensus, validation, and politeness markers.
*   **Neuroticism (N)**: Correlates with negative emotion words, first-person singular pronouns ("I"), and lower lexical diversity (repetitive worry).
    *   *LLM Implication*: Rhetoric that focuses on risk, anxiety, and worst-case scenarios; potentially lower `temperature` to reflect rigid thinking patterns.

### 2. Belbin Team Roles as Archetypes
To create functional agent personas relevant to a classroom/campus setting, we mapped Belbin Team Roles to the OCEAN framework. This provides "functional personalities" that serve specific group dynamics:

*   **Plant (High O, High I)**: Creative problem solver. Mapped to *The Innovator*.
*   **Monitor Evaluator (High C, Low E)**: Critical thinker. Mapped to *The Critic/Analyst*.
*   **Coordinator (High E, High A)**: Team chair. Mapped to *The Ambassador*.
*   **Shaper (High E, Low A)**: Task driver. Mapped to *The Commander*.
*   **Completer Finisher (High C, High N)**: Perfectionist. Mapped to *The Sentinel*.

## Value Proposition for Classroom Simulation
Expanding the personality set offers several pedagogical and functional benefits:

1.  **Diverse Interaction Models**: Students interact with agents that challenge them in different ways—some supportively (*The Guide*), others critically (*The Skeptic*).
2.  **Realistic Group Dynamics**: By simulating a "team" of agents with complementary and conflicting traits (e.g., a *Shaper* agent clashing with a *Monitor Evaluator* agent), we model real-world collaboration challenges.
3.  **Explainable AI Behavior**: The mapping allows us to explain *why* an agent is behaving a certain way ("The agent is high in Conscientiousness, so it is rejecting your vague proposal").
4.  **Dynamic Adaptation**: We can dynamically adjust the "temperature" of a room based on the task. A brainstorming session might swap in a High-Openness agent, while an exam prep session swaps in a High-Conscientiousness agent.

## Expansion Strategy
The `ocean-personalities.json` file will be expanded to include:
1.  **Refined Scales**: Granular mappings of FFM scores to `temperature`, `maxTokens`, and `frequencyPenalty`.
2.  **New Archetypes**: Adding roles like *The Mediator*, *The Visionary*, and *The Pragmatist* based on the Belbin/OCEAN cross-mapping.
3.  **Rhetorical Patterns**: Explicit instruction sets for each personality (e.g., "Use steel-manning techniques" for High Openness/Agreeableness).

## References
*   *Personality, Gender, and Age in the Language of Social Media: The Open-Vocabulary Approach* (PLOS ONE)
*   *The Big Five Personality Traits and Team Performance* (Belbin)
*   *Controlling LLM Personality via Prompt Engineering* (Various arXiv preprints)
