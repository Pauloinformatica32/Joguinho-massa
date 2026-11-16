"""Regenerate the portable JS module without changing any educational content."""
from pathlib import Path
root=Path(__file__).resolve().parents[1]
source=root/'Nova_Aurora_Terminais_Redes/data/network_questions.json'
target=root/'js/network-question-bank.js'
target.write_text('// Generated from Nova_Aurora_Terminais_Redes/data/network_questions.json. Keep content identical.\nexport default '+source.read_text(encoding='utf-8-sig').strip()+';\n',encoding='utf-8',newline='\n')
