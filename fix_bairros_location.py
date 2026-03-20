#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Script para corrigir automaticamente as informações geográficas dos bairros
baseado no relatório de verificação
"""

import json
import re

def load_verification_report(report_file: str = 'bairros_verification.json'):
    """
    Carrega o relatório de verificação
    """
    with open(report_file, 'r', encoding='utf-8') as f:
        return json.load(f)

def fix_bairro_description(descricao: str, zona_antiga: str, zona_nova: str) -> str:
    """
    Corrige a descrição do bairro substituindo a zona
    """
    # Mapeamento de zonas
    zonas_map = {
        'Zona Oeste': 'Zona Oeste',
        'Zona Leste': 'Zona Leste',
        'Zona Sul': 'Zona Sul',
        'Zona Norte': 'Zona Norte',
        'Centro': 'região central'
    }
    
    # Substitui a zona na descrição
    if zona_antiga:
        zona_antiga_lower = zona_antiga.lower()
        zona_nova_lower = zona_nova.lower()
        descricao = descricao.replace(zona_antiga_lower, zona_nova_lower)
    
    return descricao

def apply_fixes(filepath: str, report_file: str = 'bairros_verification.json'):
    """
    Aplica as correções no arquivo useBairroLanding.js
    """
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
        descricao_atual = error['descricao_atual']
        
        print(f"\nCorrigindo: {error['nome']}")
        print(f"  {zona_atual} → {zona_nova}")
        
        # Cria nova descrição
        descricao_nova = fix_bairro_description(descricao_atual, zona_atual, zona_nova)
        
        # Escapa caracteres especiais para regex
        descricao_atual_escaped = re.escape(descricao_atual)
        
        # Substitui no conteúdo
        pattern = f"'{slug}':\\s*{{\\s*nome:\\s*'[^']+',\\s*cidade:\\s*'[^']+',\\s*descricao:\\s*'{descricao_atual_escaped}'"
        
        def replacer(match):
            original = match.group(0)
            return original.replace(descricao_atual, descricao_nova)
        
        content = re.sub(pattern, replacer, content)
    
    # Salva o arquivo corrigido
    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)
    
    print(f"\n{'='*60}")
    print(f"Correções aplicadas com sucesso!")
    print(f"Arquivo atualizado: {filepath}")
    print(f"{'='*60}")

if __name__ == '__main__':
    filepath = 'app/composables/useBairroLanding.js'
    apply_fixes(filepath)
