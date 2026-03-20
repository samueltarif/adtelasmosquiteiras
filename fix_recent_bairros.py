#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Script para corrigir automaticamente os bairros recentemente adicionados
"""

import json
import re

def load_verification_report(report_file: str = 'recent_bairros_verification.json'):
    """Carrega o relatório de verificação"""
    with open(report_file, 'r', encoding='utf-8') as f:
        return json.load(f)

def fix_bairro_zona(content: str, slug: str, zona_antiga: str, zona_nova: str) -> str:
    """
    Corrige a zona de um bairro específico no conteúdo
    """
    # Mapeamento de zonas para lowercase
    zona_antiga_lower = zona_antiga.lower()
    zona_nova_lower = zona_nova.lower()
    
    # Encontra o bloco do bairro
    pattern = f"'{slug}':\\s*{{[^}}]+}}"
    
    def replacer(match):
        bairro_block = match.group(0)
        # Substitui a zona na descrição
        bairro_block = bairro_block.replace(zona_antiga_lower, zona_nova_lower)
        return bairro_block
    
    content = re.sub(pattern, replacer, content, flags=re.DOTALL)
    return content

def apply_fixes():
    """Aplica as correções no arquivo useBairroLanding.js"""
    filepath = 'app/composables/useBairroLanding.js'
    report_file = 'recent_bairros_verification.json'
    
    # Carrega relatório
    report = load_verification_report(report_file)
    errors = report.get('errors', [])
    
    if not errors:
        print("Nenhuma correção necessária!")
        return
    
    print(f"Aplicando {len(errors)} correções...")
    
    # Lê o arquivo
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Aplica cada correção
    for error in errors:
        slug = error['slug']
        zona_atual = error['zona_atual']
        zona_nova = error['zona_real']
        
        print(f"Corrigindo: {error['nome']}")
        print(f"  {zona_atual} → {zona_nova}")
        
        content = fix_bairro_zona(content, slug, zona_atual, zona_nova)
    
    # Salva o arquivo corrigido
    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)
    
    print(f"\n{'='*60}")
    print(f"✓ Correções aplicadas com sucesso!")
    print(f"Arquivo atualizado: {filepath}")
    print(f"{'='*60}")
    print(f"\nTotal de bairros corrigidos: {len(errors)}")

if __name__ == '__main__':
    apply_fixes()
