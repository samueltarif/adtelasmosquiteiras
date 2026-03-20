#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Script para verificar e corrigir informações geográficas dos bairros de São Paulo
usando a API do Nominatim (OpenStreetMap)
"""

import re
import json
import time
import requests
from typing import Dict, List, Optional

# Configuração da API Nominatim
NOMINATIM_URL = "https://nominatim.openstreetmap.org/search"
USER_AGENT = "ADTelasMosquiteiras/1.0"

def get_bairro_info(bairro_nome: str) -> Optional[Dict]:
    """
    Busca informações do bairro na API do Nominatim
    """
    params = {
        'q': f'{bairro_nome}, São Paulo, Brasil',
        'format': 'json',
        'addressdetails': 1,
        'limit': 1
    }
    
    headers = {
        'User-Agent': USER_AGENT
    }
    
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
    """
    Determina a zona de São Paulo baseado nas coordenadas
    Aproximação baseada em divisões conhecidas
    """
    # Centro aproximado de SP: -23.5505, -46.6333
    
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
    
    # Centro
    return "Centro"

def extract_bairros_from_file(filepath: str) -> List[Dict]:
    """
    Extrai lista de bairros do arquivo useBairroLanding.js
    """
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Regex para encontrar bairros
    pattern = r"'([\w-]+)':\s*\{\s*nome:\s*'([^']+)',\s*cidade:\s*'([^']+)',\s*descricao:\s*'([^']+)'"
    matches = re.finditer(pattern, content)
    
    bairros = []
    for match in matches:
        slug = match.group(1)
        nome = match.group(2)
        cidade = match.group(3)
        descricao = match.group(4)
        
        bairros.append({
            'slug': slug,
            'nome': nome,
            'cidade': cidade,
            'descricao': descricao
        })
    
    return bairros

def verify_bairros(filepath: str, output_file: str = 'bairros_verification.json'):
    """
    Verifica todos os bairros e gera relatório
    """
    print("Extraindo bairros do arquivo...")
    bairros = extract_bairros_from_file(filepath)
    print(f"Total de bairros encontrados: {len(bairros)}")
    
    results = []
    errors = []
    
    for i, bairro in enumerate(bairros, 1):
        print(f"\n[{i}/{len(bairros)}] Verificando: {bairro['nome']}")
        
        # Busca informações na API
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
            elif 'centro' in descricao:
                zona_atual = 'Centro'
            
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
            results.append({
                'slug': bairro['slug'],
                'nome': bairro['nome'],
                'zona_atual': None,
                'zona_real': None,
                'correto': None,
                'error': 'Não encontrado'
            })
        
        # Respeita rate limit da API (1 req/segundo)
        time.sleep(1.1)
    
    # Salva resultados
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump({
            'total': len(results),
            'corretos': len([r for r in results if r.get('correto') == True]),
            'incorretos': len(errors),
            'nao_encontrados': len([r for r in results if r.get('correto') is None]),
            'results': results,
            'errors': errors
        }, f, ensure_ascii=False, indent=2)
    
    print(f"\n{'='*60}")
    print(f"RESUMO DA VERIFICAÇÃO")
    print(f"{'='*60}")
    print(f"Total de bairros: {len(results)}")
    print(f"Corretos: {len([r for r in results if r.get('correto') == True])}")
    print(f"Incorretos: {len(errors)}")
    print(f"Não encontrados: {len([r for r in results if r.get('correto') is None])}")
    print(f"\nRelatório salvo em: {output_file}")
    
    if errors:
        print(f"\n{'='*60}")
        print(f"BAIRROS COM ZONA INCORRETA:")
        print(f"{'='*60}")
        for error in errors:
            print(f"  • {error['nome']}: {error['zona_atual']} → {error['zona_real']}")

if __name__ == '__main__':
    filepath = 'app/composables/useBairroLanding.js'
    verify_bairros(filepath)
