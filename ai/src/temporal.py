from dataclasses import dataclass, field
from typing import Dict, List, Optional, Tuple
from collections import Counter
import math


def iou_xyxy(a, b):
    ax1, ay1, ax2, ay2 = a
    bx1, by1, bx2, by2 = b
    ix1, iy1 = max(ax1,bx1), max(ay1,by1)
    ix2, iy2 = min(ax2,bx2), min(ay2,by2)
    iw, ih = max(0.0, ix2-ix1), max(0.0, iy2-iy1)
    inter = iw*ih
    if inter <= 0: return 0.0
    aa=max(1.0,(ax2-ax1)*(ay2-ay1))
    bb=max(1.0,(bx2-bx1)*(by2-by1))
    return inter/(aa+bb-inter)


def center_distance(a,b):
    ac=((a[0]+a[2])/2,(a[1]+a[3])/2)
    bc=((b[0]+b[2])/2,(b[1]+b[3])/2)
    return math.hypot(ac[0]-bc[0], ac[1]-bc[1])

@dataclass
class PlateTrack:
    track_id: int
    bbox: Tuple[int,int,int,int]
    age: int = 0
    missed: int = 0
    observations: List[Tuple[str,float]] = field(default_factory=list)

    def add(self, text: str, score: float):
        self.observations.append((text, score))
        if len(self.observations) > 30:
            self.observations = self.observations[-30:]

    def best_text(self) -> str:
        vals=[x for x in self.observations if x[0]]
        if not vals: return ""
        # Exact string voting first; confidence is a tie-breaker.
        counts=Counter(t for t,_ in vals)
        best_count=max(counts.values())
        candidates=[t for t,c in counts.items() if c==best_count]
        candidates.sort(key=lambda t: max(s for x,s in vals if x==t), reverse=True)
        return candidates[0]

class TemporalPlateConsensus:
    def __init__(self, max_missed=8, match_iou=0.15, max_center_ratio=0.75):
        self.max_missed=max_missed
        self.match_iou=match_iou
        self.max_center_ratio=max_center_ratio
        self.tracks: Dict[int,PlateTrack]={}
        self.next_id=1

    def update(self, detections: List[Dict]) -> List[PlateTrack]:
        used=set()
        # greedy match; enough for a small number of plates per frame
        for det in detections:
            bbox=tuple(det['bbox'])
            best_id=None; best_cost=1e9
            for tid,trk in self.tracks.items():
                if tid in used: continue
                ov=iou_xyxy(bbox,trk.bbox)
                center=center_distance(bbox,trk.bbox)
                diag=max(20.0, math.hypot(bbox[2]-bbox[0], bbox[3]-bbox[1]))
                if ov>=self.match_iou or center<=self.max_center_ratio*diag:
                    cost=(1.0-ov)+0.01*(center/diag)
                    if cost<best_cost:
                        best_cost=cost; best_id=tid
            if best_id is None:
                best_id=self.next_id; self.next_id+=1
                self.tracks[best_id]=PlateTrack(best_id,bbox)
            trk=self.tracks[best_id]
            trk.bbox=bbox; trk.age+=1; trk.missed=0; used.add(best_id)
            trk.add(det.get('text',''), float(det.get('score',0.0)))
            det['track_id']=best_id
            det['consensus_text']=trk.best_text()
        for tid,trk in list(self.tracks.items()):
            if tid not in used:
                trk.missed+=1
                if trk.missed>self.max_missed:
                    del self.tracks[tid]
        return list(self.tracks.values())
