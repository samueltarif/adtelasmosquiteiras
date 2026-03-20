import re

filepath = 'nuxt-app/app/composables/useBairroLanding.js'

with open(filepath, 'r', encoding='utf-8') as f:
    content = f.read()

# Lista de substituições
replacements = [
    ("'santana-zona-norte':", "'santana':"),
    ("'mooca-zona-leste':", "'mooca':"),
    ("'capao-redondo-zona-sul':", "'capao-redondo':"),
    ("'saude-zona-sul':", "'saude':"),
    ("'vila-prudente-zona-leste':", "'vila-prudente':"),
    ("'campo-belo-zona-sul':", "'campo-belo':"),
    ("'campo-grande-zona-sul':", "'campo-grande':"),
    ("'cidade-dutra-zona-sul':", "'cidade-dutra':"),
    ("'vila-guilherme-norte':", "'vila-guilherme':"),
]

for old, new in replacements:
    content = content.replace(old, new)

with open(filepath, 'w', encoding='utf-8') as f:
    f.write(content)

print("OK - Sufixos de zona removidos")
