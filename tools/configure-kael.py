"""Register normalized PNG grids without changing existing character geometry."""
import json
import struct
from pathlib import Path

root = Path(__file__).resolve().parent.parent
path = root / 'assets/characters/protagonist/config.json'
cfg = json.loads(path.read_text(encoding='utf-8'))
for key, filename, count, fps, loop in [
    ('jump', 'jump', 4, 10, False),
    ('fall', 'fall', 8, 10, True),
    ('dodge', 'dash', 7, 14, False),
    ('damage', 'damage', 5, 10, False),
    ('death', 'death', 8, 8, False),
]:
    sheet = f'assets/characters/protagonist/kael/spritesheets/{filename}.png'
    width, height = struct.unpack('>II', (root / sheet).read_bytes()[16:24])
    assert width % count == 0, (filename, width, count)
    cfg['animations'][key] = dict(sheet=sheet, frameWidth=width//count,
        frameHeight=height, columns=count, count=count, fps=fps,
        loop=loop, freezeLast=True)
    # Complete the visual sequence within the existing combat timers.
    if key in ('dodge', 'damage'):
        cfg['animations'][key]['stateDuration'] = .18 if key == 'dodge' else .22
path.write_text(json.dumps(cfg, ensure_ascii=False, indent=2)+'\n', encoding='utf-8')
