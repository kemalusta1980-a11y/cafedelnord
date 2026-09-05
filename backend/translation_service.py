import os
import json
import uuid
import logging

logger = logging.getLogger(__name__)

LANG_NAMES = {"en": "English", "de": "German", "ru": "Russian", "ar": "Arabic"}


async def translate_fields(fields: dict) -> dict:
    """Translate TR texts to en/de/ru/ar. Returns {key_lang: text}."""
    if not fields:
        return {}
    from emergentintegrations.llm.chat import LlmChat, UserMessage

    chat = LlmChat(
        api_key=os.environ["EMERGENT_LLM_KEY"],
        session_id=f"translate-{uuid.uuid4()}",
        system_message=(
            "You are a professional translator for a Turkish cafe-restaurant website (Cafe Del Nord). "
            "Translate marketing texts from Turkish into English, German, Russian and Arabic. "
            "Keep the tone warm and appetizing, preserve casing style (ALL CAPS stays ALL CAPS), "
            "keep food names natural for each language. Respond with JSON only, no markdown."
        ),
    ).with_model("openai", "gpt-5.4")

    prompt = (
        "Translate each Turkish value into en, de, ru, ar. "
        "Return ONLY valid JSON shaped as {\"key\": {\"en\": \"...\", \"de\": \"...\", \"ru\": \"...\", \"ar\": \"...\"}}.\n\n"
        + json.dumps(fields, ensure_ascii=False)
    )
    resp = await chat.send_message(UserMessage(text=prompt))
    text = str(resp).strip()
    if text.startswith("```"):
        text = text.split("```")[1]
        if text.startswith("json"):
            text = text[4:]
    data = json.loads(text.strip())

    out = {}
    for key, langs in data.items():
        if key not in fields or not isinstance(langs, dict):
            continue
        for code in LANG_NAMES:
            val = (langs.get(code) or "").strip()
            if val:
                out[f"{key}_{code}"] = val
    return out
