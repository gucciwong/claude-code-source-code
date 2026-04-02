from pydantic import BaseModel
from typing import List, Optional, Dict, Any
from enum import Enum


class IMPlatform(str, Enum):
    TELEGRAM = "telegram"
    SLACK = "slack"
    DISCORD = "discord"
    FEISHU = "feishu"
    DINGTALK = "dingtalk"
    WECHAT_WORK = "wechat_work"
    WHATSAPP = "whatsapp"
    LINE = "line"


class PlatformConfig(BaseModel):
    platform: str
    bot_token: Optional[str] = None
    webhook_url: Optional[str] = None
    allowed_user_ids: List[str] = []
    enabled: bool = True


class MessageLogEntry(BaseModel):
    timestamp: float
    platform: str
    sender_id: str
    command: str
    response: str
    authorized: bool
