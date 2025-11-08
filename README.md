# Rest Quest – Gemini Matching Prototype

This repo contains a hardcoded catalog of therapeutic travel destinations plus a lightweight Gemini-powered matcher. Use it during the hackathon to turn short emotional briefs into swipeable trip suggestions.

## Setup

1. **Python deps**
   ```bash
   python -m venv .venv
   source .venv/bin/activate
   pip install -r requirements.txt
   ```
2. **Environment**
   ```bash
   export GEMINI_API_KEY="AIzaSyDS12RJLs_i8pk9cI82lHj-jCvXt0FGlhI"
   ```
   (Store in a secure secrets manager outside of local testing.)

## Running the recommender

1. Tweak `examples/sample_profile.json` or craft a new file following the schema embedded inside `data/mock_travel_data.json` (`geminiMatching.inputSchema`).
2. Execute:
   ```bash
   python src/gemini_recommender.py --profile examples/sample_profile.json
   ```
3. The script will:
   - Pre-score destinations locally using `matchingProfile` tags.
   - Send the condensed candidate pool plus scoring policy to Gemini (`models/gemini-1.5-flash` by default).
   - Print JSON `{ "recommendations": [...] }` returned by Gemini (or `rawText` if parsing fails).

### Dry run

Need to inspect the generated prompt before calling the API?
```bash
python src/gemini_recommender.py --profile examples/sample_profile.json --dry-run
```
This prints the exact payload so you can validate context size or debug weighting.

## Files of interest

- `data/mock_travel_data.json` – destination catalog + Gemini schema.
- `src/gemini_recommender.py` – CLI + API client.
- `examples/sample_profile.json` – starter profile matching the schema.
