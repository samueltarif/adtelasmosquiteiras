#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Script para verificar apenas os bairros recentemente adicionados
"""

import re
import json
import time
import requests
from typing import Dict, List, Optional

# Configuração da API Nominatim
NOMINATIM_URL = "https://nominatim.openstreetmap.org/search"
USER_AGENT = "ADTelasMosquiteiras/1.0"

# Lista dos 27 bairros recentemente adicionados
RECENT_BAIRROS = [
    'jardim-da-saude', 'vila-guarani', 'parque-bristol', 'jardim-aeroporto',
    'cidade-vargas', 'parque-colonial', 'jardim-tres-marias', 'jardim-umuarama',
    'jardim-guarau', 'jardim-herculano', 'jardim-selma', 'jardim-republica',
    'jardim-prudencia', 'jardim-niteroi', 'jardim-mirna', 'jardim-maracana',
    'jardim-lourdes', 'jardim-lidia', 'jardim-itapura', 'jardim-iporanga',
    'jardim-ingai', 'jardim-guedala', 'jardim-fonte-do-morumbi', 'jardim-everest',
    'jardim-esmeralda', 'jardim-eliane', 'jardim-dom-jose'
]

def get_bairro_info(bairro_nome: str) -> Optional[Dict]:
    """Busca informações do bairro na API do Nominatim"""
    params = {
        'q': f'{bairro_nome}, São Paulo, Brasil',
        'format': 'json',
        'addressdetails': 1,
        'limit': 1
    }
    
    headers = {'User-Agent': USER_AGENT}
    
    try:
        response = requests.get(NOMINATIM_URL, params=params, headers=headers)
        response.raise_for_status()
        data = response.json()
        
        if data and len(data) > 0:
            return data[0]
        return None
    except Exception as e:
        print(f"Erro ao buscar {bairro_nome}: {e}")
        return None

def determine_zona(lat: float, lon: float) -> str:
    """Determina a zona de São Paulo baseado nas coordenadas"""
    # Zona Oeste: oeste do centro
    if lon < -46.70:
        return "Zona Oeste"
    
    # Zona Leste: leste do centro
    if lon > -46.55:
        return "Zona Leste"
    
    # Zona Sul: sul do centro
    if lat < -23.60:
        return "Zona Sul"
    
    # Zona Norte: norte do centro
    if lat > -23.50:
        return "Zona Norte"
    
    return "Centro"

def extract_bairro_data(content: str, slug: str) -> Optional[Dict]:
    """Extrai dados de um bairro específico"""
    pattern = f"'{slug}':\\s*{{\\s*nome:\\s*'([^']+)',\\s*cidade:\\s*'([^']+)',\\s*descricao:\\s*'([^']+)'"
    match = re.search(pattern, content)
    
    if match:
        return {
            'slug': slug,
            'nome': match.group(1),
            'cidade': match.group(2),
            'descricao': match.group(3)
        }
    return None

def verify_recent_bairros():
    """Verifica apenas os bairros recentemente adicionados"""
    filepath = 'app/composables/useBairroLanding.js'
    
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    print(f"Verificando {len(RECENT_BAIRROS)} bairros recentemente adicionados...")
    
    results = []
    errors = []
    
    for i, slug in enumerate(RECENT_BAIRROS, 1):
        bairro = extract_bairro_data(content, slug)
        
        if not bairro:
            print(f"[{i}/{len(RECENT_BAIRROS)}] ❌ {slug} não encontrado no arquivo")
            continue
        
        print(f"\n[{i}/{len(RECENT_BAIRROS)}] Verificando: {bairro['nome']}")
        
        info = get_bairro_info(bairro['nome'])
        
        if info:
            lat = float(info['lat'])
            lon = float(info['lon'])
            zona_real = determine_zona(lat, lon)
            
            # Extrai zona da descrição atual
            descricao = bairro['descricao'].lower()
            zona_atual = None
            if 'zona oeste' in descricao:
                zona_atual = 'Zona Oeste'
            elif 'zona leste' in descricao:
                zona_atual = 'Zona Leste'
            elif 'zona sul' in descricao:
                zona_atual = 'Zona Sul'
            elif 'zona norte' in descricao:
                zona_atual = 'Zona Norte'
            
            result = {
                'slug': bairro['slug'],
                'nome': bairro['nome'],
                'zona_atual': zona_atual,
                'zona_real': zona_real,
                'lat': lat,
                'lon': lon,
                'correto': zona_atual == zona_real if zona_atual else False,
                'display_name': info.get('display_name', ''),
                'descricao_atual': bairro['descricao']
            }
            
            results.append(result)
            
            if not result['correto']:
                print(f"  ⚠️  INCORRETO: {zona_atual} → {zona_real}")
                errors.append(result)
            else:
                print(f"  ✓ Correto: {zona_real}")
        else:
            print(f"  ❌ Não encontrado na API")
        
        time.sleep(1.1)
    
    # Salva resultados
    output_file = 'recent_bairros_verification.json'
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump({
            'total': len(results),
            'corretos': len([r for r in results if r.get('correto') == True]),
            'incorretos': len(errors),
            'results': results,
            'errors': errors
        }, f, ensure_ascii=False, indent=2)
    
    print(f"\n{'='*60}")
    print(f"RESUMO DA VERIFICAÇÃO")
    print(f"{'='*60}")
    print(f"Total verificados: {len(results)}")
    print(f"Corretos: {len([r for r in results if r.get('correto') == True])}")
    print(f"Incorretos: {len(errors)}")
    print(f"\nRelatório salvo em: {output_file}")
    
    if errors:
        print(f"\n{'='*60}")
        print(f"BAIRROS COM ZONA INCORRETA:")
        print(f"{'='*60}")
        for error in errors:
            print(f"  • {error['nome']}: {error['zona_atual']} → {error['zona_real']}")

if __name__ == '__main__':
    verify_recent_bairros()
