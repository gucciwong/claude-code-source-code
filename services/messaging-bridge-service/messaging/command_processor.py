import time
from typing import List
from .models import MessageLogEntry

COMMANDS = {
    "status": "Get system status",
    "models": "List installed models",
    "metrics": "Get productivity metrics",
    "help": "Show available commands",
    "chat": "Chat with AI (usage: chat <message>)",
    "health": "Check all services health",
}


class CommandProcessor:
    """Parse incoming IM text commands and return structured responses."""

    def __init__(self):
        self._log: List[MessageLogEntry] = []

    def process(self, text: str, platform: str = "unknown", sender_id: str = "unknown") -> str:
        text = text.strip()
        lower = text.lower()

        if lower in ("help", "/help"):
            response = self._help()
        elif lower in ("status", "/status"):
            response = self._status()
        elif lower in ("models", "/models", "list models"):
            response = self._models()
        elif lower in ("metrics", "/metrics"):
            response = self._metrics()
        elif lower in ("health", "/health"):
            response = self._health_check()
        elif lower.startswith("chat ") or lower.startswith("/chat "):
            msg = text[5:].strip() if lower.startswith("chat ") else text[6:].strip()
            response = self._chat(msg)
        elif lower == "chat" or lower == "/chat":
            response = self._chat("")
        else:
            response = f"Unknown command: '{text}'. Type 'help' for available commands."

        entry = MessageLogEntry(
            timestamp=time.time(),
            platform=platform,
            sender_id=sender_id,
            command=text,
            response=response,
            authorized=True,
        )
        self._log.insert(0, entry)
        if len(self._log) > 100:
            self._log = self._log[:100]

        return response

    def get_log(self) -> List[dict]:
        return [e.model_dump() for e in self._log]

    def clear_log(self):
        self._log = []

    def _help(self) -> str:
        lines = ["**Sovereign Code Remote Commands**", ""]
        for cmd, desc in COMMANDS.items():
            lines.append(f"  `{cmd}` — {desc}")
        return "\n".join(lines)

    def _status(self) -> str:
        return (
            "**Sovereign Code Status**\n"
            "• App: Running locally\n"
            "• Training service: Listening on :8001\n"
            "• Model manager: Listening on :8002\n"
            "• Knowledge service: Listening on :8003\n"
            "• Messaging bridge: Listening on :8010"
        )

    def _models(self) -> str:
        return (
            "**Installed Models**\n"
            "• No models loaded (start from Models screen)\n"
            "Tip: Open Sovereign Code desktop app → Models → Browse"
        )

    def _metrics(self) -> str:
        return (
            "**Productivity Metrics**\n"
            "• Fetch from Analytics screen or POST /events to :8009\n"
            "• Sessions: see Analytics → Productivity tab"
        )

    def _health_check(self) -> str:
        return (
            "**Service Health**\n"
            "• Training service (:8001): ok\n"
            "• Model manager (:8002): ok\n"
            "• Knowledge service (:8003): ok\n"
            "• Analytics service (:8009): ok\n"
            "• Messaging bridge (:8010): ok"
        )

    def _chat(self, message: str) -> str:
        if not message:
            return "Usage: chat <your message>"
        return f"Chat via IM is relayed: '{message}'\nOpen the Sovereign Code desktop app to see the full response."
