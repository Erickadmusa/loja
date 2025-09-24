"""Leon skill action for commerce-strategy (Python runtime)."""
from __future__ import annotations

import json
from pathlib import Path
from typing import Any, Dict

BASE_DIR = Path(__file__).parent
RESPONSES = {
    "pt": json.loads((BASE_DIR / "pt.json").read_text(encoding="utf-8")),
    "en": json.loads((BASE_DIR / "en.json").read_text(encoding="utf-8")),
}

PLAYBOOK = {
    "awareness": [
        "executar campanhas de topo com vídeos curtos e captura de leads",
        "usar anúncios sociais com segmentação por interesses e lookalikes",
    ],
    "consideration": [
        "criar sequências de e-mail com prova social e estudos de caso",
        "rodar webinars ao vivo com demonstrações do produto",
    ],
    "conversion": [
        "implementar checkout simplificado e provas sociais próximas ao CTA",
        "oferecer garantia estendida e gatilhos de urgência personalizados",
    ],
    "retention": [
        "lançar programa de fidelidade com recompensas progressivas",
        "automatizar fluxos de pós-venda com pesquisas NPS e ofertas exclusivas",
    ],
}

AUDIENCE_TIPS = {
    "b2b": "reforçar ROI mensurável, apresentar cases relevantes e disponibilizar trial assistido",
    "b2c": "usar gatilhos emocionais, prova social visual e ofertas por tempo limitado",
    "premium": "valorizar exclusividade, design superior e suporte concierge",
    "mass": "destacar preço competitivo, entrega rápida e confiança na marca",
}


def _format(lang: str, key: str, params: Dict[str, Any]) -> str:
    template = RESPONSES[lang][key]["success"][0]
    for name, value in params.items():
        template = template.replace(f"{{{name}}}", str(value))
    return template


def _choose_strategy(objective: str, audience: str) -> str:
    objective_key = objective.lower().strip().replace(" ", "-") if objective else "conversion"
    audience_key = audience.lower().strip() if audience else "mass"

    base_moves = PLAYBOOK.get(objective_key, PLAYBOOK["conversion"])
    move = base_moves[0]
    tip = AUDIENCE_TIPS.get(audience_key, AUDIENCE_TIPS["mass"])
    return f"{move}; além disso, {tip}."


def action(data: Dict[str, Any]) -> Dict[str, Any]:
    """Leon entrypoint."""
    lang = data.get("lang", "pt")
    if lang not in RESPONSES:
        lang = "pt"

    intent = (data.get("intent") or {}).get("name")
    slots = data.get("slots") or {}

    if intent != "suggest_strategy":
        return {"type": "text", "value": f"Intent {intent} not handled by commerce-strategy."}

    objective = slots.get("objective") or "conversão"
    audience = slots.get("audience") or "mass"

    strategy = _choose_strategy(objective, audience)
    payload = {
        "type": "text",
        "value": _format(lang, "suggest_strategy", {
            "objective": objective,
            "audience": audience,
            "strategy": strategy,
        }),
        "extra": {
            "objective": objective,
            "audience": audience,
            "strategy": strategy,
        },
    }

    bus = (data.get("tools") or {}).get("bus")
    if bus is not None:
        try:
            bus.publish_sync("financeiro.strategy.generated", payload["extra"])
        except AttributeError:
            pass

    return payload
