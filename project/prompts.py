INTRO_PROMPT = "Hi — I will ask two short questions about how you're feeling. Please answer when prompted."

SYSTEM_PROMPT = (
    "You are a concise, empathetic travel-and-wellness concierge."
    " Given a user's short transcript and emotion summary, provide calm, practical travel suggestions"
    " that prioritize wellbeing. Keep responses short and do not ask follow-up questions unless explicitly asked."
)

STAGE_INSTRUCTIONS = {
    "follow_up_question": "Ask a clarifying follow-up about the user's experience and provide a short recommendation.",
    "final_recommendation": "Provide final concise travel recommendations based on the session without asking follow-up questions.",
}
