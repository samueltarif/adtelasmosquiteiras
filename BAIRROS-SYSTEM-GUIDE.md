# Sistema de Bairros — Guia Completo

## Visão Geral

O sistema de bairros foi redesenhado para oferecer cobertura completa em 19 cidades da Grande São Paulo e região, com busca por CEP integrada e dados estáticos otimizados.

## Arquitetura

### 1. Dados Estáticos (`app/data/bairros.ts`)

Contém a lista completa de bairros para as 19 cidades atendidas:

- **São Paulo**: 279 bairros (cobertura completa de todas as zonas)
- **Guarulhos**: 47 bairros
- **Osasco**: 60 bairros
- **São Bernardo do Campo**: 34 bairros
- **Barueri**: 20 bairros
- **Jundiaí**: 60 bairros
- **Mogi das Cruzes**: 50 bairros
- **Taboão da Serra**: 47 bairros
- **Suzano**: 44 bairros
- **Itapevi**: 40 bairros
- **Embu-Guaçu**: 30 bairros
- **Sorocaba**: 45 bairros
- **Cajamar**: 20 bairros
- **Mairiporã**: 15 bairros
- **Santana de Parnaíba**: 15 bairros
- **Cotia**: 30 bairros
- **Itapecerica da Serra**: 20 bairros
- **Embu das Artes**: 20 bairros
- **São Roque**: 15 bairros

**Total**: 891+ bairros catalogados

### 2. API Server-Side

#### `/api/bairros` (GET)
Retorna todos os bairros organizados por cidade. Lê do arquivo estático `bairros.ts`.

**Response:**
```json
[
  {
    "id": 3550308,
    "nome": "São Paulo",
    "bairros": [
      { "id": 0, "nome": "Água Branca" },
      { "id": 1, "nome": "Água Funda" }
    ]
  }
]
```

#### `/api/cep/[cep]` (GET)
Consulta CEP via ViaCEP (server-side proxy) e valida se pertence às cidades atendidas.

**Request:** `GET /api/cep/05010000`

**Response:**
```json
{
  "cep": "05010-000",
  "logradouro": "Avenida Sumaré",
  "bairro": "Perdizes",
  "cidade": "São Paulo",
  "uf": "SP",
  "ibge": "3550308",
  "atendido": true,
  "cidadeAtendida": "São Paulo"
}
```

**Validação:**
- CEP deve ter 8 dígitos
- Consulta ViaCEP com User-Agent customizado
- Verifica se o código IBGE retornado está na lista de cidades atendidas
- Retorna `atendido: true/false`

### 3. Composable (`useBairros.js`)

Gerencia o estado e lógica de filtros da página de bairros.

**Exports:**
- `CIDADES` — lista das 11 cidades (id + nome)
- `fetchBairros()` — carrega dados via `/api/bairros`
- `cidadesFiltradas` — computed com filtros aplicados
- `search` — ref para busca por texto
- `cidadeSelecionada` — ref para filtro por cidade
- `totalBairros` — computed com contagem total

### 4. Componente `CepSearch.vue`

Widget de busca por CEP com:
- Auto-formatação (`00000-000`)
- Validação de 8 dígitos
- Loading state
- Dois estados de resultado:
  - ✅ **Atendido**: mostra endereço + CTA WhatsApp pré-preenchido
  - ⚠️ **Fora da área**: mostra mensagem + CTA para consultar disponibilidade

### 5. Página `/bairros` (`app/pages/bairros/index.vue`)

**Estrutura:**
1. Hero com stats (11 cidades, 711+ bairros)
2. Widget de busca por CEP
3. Barra de filtros sticky (busca por nome, filtro por cidade, expand/collapse)
4. Lista de cidades em accordion
5. CTA final para bairros não encontrados

**Comportamento dos bairros:**
- Cada bairro é um link direto para WhatsApp
- Mensagem pré-preenchida: `"Olá! Gostaria de um orçamento para [Bairro] - [Cidade]. Vim pelo site."`
- Não há mais páginas individuais por bairro (`/bairros/[slug]`)

## Fluxo de Conversão

1. **Usuário acessa `/bairros`**
2. **Opção A — Busca por CEP:**
   - Digita CEP → valida → mostra se atende
   - Se atendido → clica no botão WhatsApp com CEP + bairro
3. **Opção B — Navega pela lista:**
   - Filtra por cidade ou busca por nome
   - Expande cidade → clica no bairro
   - Redireciona para WhatsApp com mensagem pré-preenchida

## Mudanças no Footer

O footer agora tem um único botão "Ver todos os bairros atendidos" que leva para `/bairros`, em vez de listar 9 bairros individuais com links quebrados.

## SEO

- **279 bairros de São Paulo** cobrem todas as zonas (Oeste, Sul, Norte, Leste, Centro)
- **891+ bairros** no total garantem cobertura completa da Grande SP e região metropolitana
- **19 cidades** incluindo Sorocaba, Cotia, Cajamar, Mairiporã, Santana de Parnaíba, Itapecerica da Serra, Embu das Artes e São Roque
- Busca por CEP permite validação instantânea de atendimento
- Todos os bairros linkam para WhatsApp (conversão direta)

## Manutenção

Para adicionar novos bairros ou cidades:

1. Edite `app/data/bairros.ts`
2. Adicione o código IBGE em `server/api/cep/[cep].get.ts` (constante `CIDADES_ATENDIDAS`)
3. Atualize `useBairros.js` se necessário

## Tecnologias

- **ViaCEP API** — consulta de CEP (gratuita, sem rate limit documentado)
- **IBGE codes** — validação de municípios
- **Nitro server routes** — proxy server-side (evita CSP issues)
- **Static data** — performance otimizada, zero latência

## Notas Importantes

- ✅ CEP search funciona para qualquer CEP do Brasil (valida se está nas 11 cidades)
- ✅ Dados estáticos = zero dependência de APIs externas para listar bairros
- ✅ ViaCEP é usado apenas para busca por CEP (opcional)
- ✅ Todos os links de bairro vão direto para WhatsApp (conversão)
- ✅ Páginas individuais `/bairros/[slug]` foram descontinuadas
