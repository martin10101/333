"""Domain models shared across services."""

from dataclasses import dataclass
from datetime import date
from typing import Dict, Optional


@dataclass
class PlayerProfile:
    player_id: str
    name: str
    height_m: Optional[float] = None
    hand: Optional[str] = None
    birthdate: Optional[date] = None
    surface_win_rates: Optional[Dict[str, float]] = None
