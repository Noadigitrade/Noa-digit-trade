from pathlib import Path

src = Path("/mnt/data/app.js")
dst = Path("/mnt/data/app.js")
text = src.read_text(encoding="utf-8")

# Vérifications rapides avant de remettre le fichier à disposition.
required = [
    "const BUY_RATE = 600;",
    "const SELL_RATE = 570;",
    "payment_method",
    ".from('orders')",
    "async function sendOrder()",
    "async function showAccountModal(user)",
]

missing = [item for item in required if item not in text]
if missing:
    raise ValueError(f"Éléments manquants dans app.js : {missing}")

# Réécriture propre du fichier UTF-8.
dst.write_text(text, encoding="utf-8")

print(f"app.js vérifié et recréé : {dst}")
print(f"Taille : {dst.stat().st_size:,} octets")
print(f"Lignes : {len(text.splitlines()):,}")
