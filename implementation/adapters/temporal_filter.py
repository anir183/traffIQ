from typing import Dict, List

import os
import sys

from pipeline.config import Config


class TemporalPlateFilter:
    """Wraps ai/src/temporal.TemporalPlateConsensus for plate-level voting across frames."""

    def __init__(self, cfg: Config):
        cfg.ensure_ai_on_path()
        self.cfg = cfg
        self.temp = None

        prev = os.getcwd()
        try:
            if str(cfg.ref_repo_dir) not in sys.path:
                sys.path.insert(0, cfg.ref_repo_dir_str)
            os.chdir(cfg.ref_repo_dir_str)
            from src.temporal import TemporalPlateConsensus

            self.temp = TemporalPlateConsensus(
                max_missed=cfg.temporal_max_missed,
                match_iou=cfg.temporal_match_iou,
                max_center_ratio=cfg.temporal_max_center_ratio,
            )
        finally:
            os.chdir(prev)

    def update(self, plate_dets: List[Dict]) -> List[Dict]:
        """plate_dets: [{bbox:(x1,y1,x2,y2), text, score, source}] -> mutated with track_id + consensus_text."""
        if not plate_dets:
            self.temp.update([])
            return []
        return self.temp.update(plate_dets)