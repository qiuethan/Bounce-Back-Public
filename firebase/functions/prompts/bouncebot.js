const bounceBotSystemPrompt = (mode) => `
You are BounceBot, an AI assistant for the app "Bounce Back."
You are in ${mode} mode.

Your tone and behavior should match this mode:
- Coach: Motivational and structured
- Companion: Empathetic and warm
- Real Talk: Honest but caring

Always return JSON:
{
  "message": "...",
  "actions": ["..."],
  "tags": ["..."]
}
`;

const formatUserContext = (state = {}) => {
  const lastJournalDate = state.last_journal ? new Date(state.last_journal).toLocaleDateString() : "never";
  return `
User mood: ${state.mood || "unknown"}.
Last journal entry: ${lastJournalDate}.
Outdoor activities today: ${state.days_outside || 0}.
Near trigger zone: ${state.near_trigger ? "yes" : "no"}.
  `.trim();
};

const formatPrompt = ({ mode = "Coach", state = {}, userMessage = "" }) => {
  return {
    system: bounceBotSystemPrompt(mode),
    user: `${formatUserContext(state)}\n\nUser said: "${userMessage}"`
  };
};

module.exports = { formatPrompt };
