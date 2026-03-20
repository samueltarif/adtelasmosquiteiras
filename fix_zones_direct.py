#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Script para corrigir diretamente as zonas dos bairros
"""

import re

# Mapeamento de correções baseado no relatório
CORRECTIONS = {
    'jardim-tres-marias': ('zona sul', 'zona oeste'),
    'jardim-umuarama': ('zona sul', 'zona oeste'),
    'jardim-guarau': ('zona sul', 'zona oeste'),
    'jardim-herculano': ('zona sul', 'zona oeste'),
    'jardim-selma': ('zona sul', 'zona leste'),
    'jardim-republica': ('zona sul', 'zona leste'),
    'jardim-maracana': ('zona sul', 'zona oeste'),
    'jardim-lourdes': ('zona sul', 'zona oeste'),
    'jardim-lidia': ('zona sul', 'zona oeste'),
    'jardim-itapura': ('zona sul', 'zona oeste'),
    'jardim-iporanga': ('zona sul', 'zona oeste'),
    'jardim-ingai': ('zona sul', 'zona oeste'),
    'jardim-guedala': ('zona sul', 'zona oeste'),
    'jardim-everest': ('zona sul', 'zona oeste'),
    'jardim-esmeralda': ('zona sul', 'zona oeste'),
    'jardim-eliane': ('zona sul', 'zona leste'),
    'jardim-dom-jose': ('zona sul', 'zona oeste'),
}

def fix_zones():
    """Corrige as zonas diretamente no arquivo"""
    filepath = 'app/composables/useBairroLanding.js'
    
    print(f"Lendo arquivo: {filepath}")
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    original_content = content
    corrections_applied = 0
    
    for slug, (old_zone, new_zone) in CORRECTIONS.items():
        # Procura o bloco do bairro
        pattern = f"'{slug}':\\s*{{[^}}]+}}"
        matches = list(re.finditer(pattern, content, re.DOTALL))
        
        if matches:
            for match in matches:
                block = match.group(0)
                # Substitui a zona antiga pela nova (case insensitive)
                new_block = re.sub(
                    old_zone,
                    new_zone,
                    block,
                    flags=re.IGNORECASE
                )
                
                if block != new_block:
                    content = content.replace(block, new_block)
                    corrections_applied += 1
                    print(f"✓ Corrigido: {slug} ({old_zone} → {new_zone})")
                else:
                    print(f"⚠ Não encontrado: {slug} com '{old_zone}'")
        else:
            print(f"❌ Bairro não encontrado: {slug}")
    
    if corrections_applied > 0:
        print(f"\n{'='*60}")
        print(f"Salvando {corrections_applied} correções...")
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f"✓ Arquivo atualizado com sucesso!")
        print(f"{'='*60}")
    else:
        print("\n❌ Nenhuma correção foi aplicada!")

if __name__ == '__main__':
    fix_zones()
