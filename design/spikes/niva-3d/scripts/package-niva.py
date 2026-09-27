"""Export the saved niva-final.blend; see ../README.md for CLI usage."""
from pathlib import Path
import runpy

ROOT = Path(__file__).resolve().parents[1]

if __name__ == '__main__':
    runpy.run_path(str(ROOT.parent / 'cabin-package.py'))['main'](ROOT, 'niva')
