# PRD Completo - AD Telas e Redes
## Documento de Especificação da Experiência do Usuário

**Data:** 25/02/2026  
**Versão:** 1.0  
**Empresa:** AD Telas e Redes  
**Contato:** (11) 98358-6611 | vendas.adtelaseredes@gmail.com  
**CNPJ:** 40.297.694/0001-95

---

## 📋 Índice

1. [Visão Geral do Sistema](#visão-geral)
2. [Arquitetura de Navegação](#arquitetura)
3. [Página Inicial (Home)](#home)
4. [Sistema de Serviços (35 Serviços)](#servicos)
5. [Componentes Globais](#componentes)
6. [Jornada do Usuário](#jornada)
7. [Design System](#design)
8. [SEO e Performance](#seo)

---

## 1. Visão Geral do Sistema {#visao-geral}

### 1.1 Propósito
Site institucional e comercial para AD Telas e Redes, empresa especializada em:
- **Redes de Proteção** (17 serviços)
- **Telas Mosquiteiras** (18 serviços)

### 1.2 Objetivo Principal
Gerar leads qualificados através de:
- WhatsApp (principal)
- Formulário de contato
- Ligação telefônica

### 1.3 Tecnologias
- **Framework:** Nuxt 4.2.2 (Vue 3.5.26)
- **Styling:** Tailwind CSS
- **Icons:** Nuxt Icon (Lucide)
- **Build:** Vite 7.3.1
- **Server:** Nitro 2.13.0



---

## 2. Arquitetura de Navegação {#arquitetura}

### 2.1 Estrutura de URLs

```
/ (Home)
│
├── /servicos (Hub de Serviços)
│   ├── /servicos/redes (Família: Redes de Proteção)
│   ├── /servicos/telas (Família: Telas Mosquiteiras)
│   │
│   ├── /servicos/redes/residencial (Categoria)
│   ├── /servicos/redes/pets (Categoria)
│   ├── /servicos/redes/comercial (Categoria)
│   │
│   ├── /servicos/telas/residencial (Categoria)
│   ├── /servicos/telas/especiais (Categoria)
│   ├── /servicos/telas/pet (Categoria)
│   ├── /servicos/telas/comercial (Categoria)
│   │
│   └── /servicos/{familia}/{categoria}/{servico} (Página Individual)
│       Exemplos:
│       - /servicos/redes/residencial/janelas
│       - /servicos/redes/pets/gatos
│       - /servicos/telas/residencial/portas
│       - /servicos/telas/especiais/correr
```

### 2.2 Hierarquia de Informação

```
Nível 1: Home (/)
    ↓
Nível 2: Hub de Serviços (/servicos)
    ↓
Nível 3: Família (/servicos/redes ou /servicos/telas)
    ↓
Nível 4: Categoria (/servicos/{familia}/{categoria})
    ↓
Nível 5: Serviço Individual (/servicos/{familia}/{categoria}/{servico})
```



---

## 3. Página Inicial (Home) {#home}

### 3.1 Header (Fixo no Topo)

**Desktop:**
- Logo AD Telas (150px width, clicável para home)
- Menu de navegação horizontal com 8 itens:
  1. Início
  2. Serviços
  3. Vantagens
  4. Cases
  5. Avaliações
  6. Soluções
  7. FAQ
  8. Contato
- Altura: 112px (h-28)
- Background: Branco com transparência ao rolar (bg-white/70 backdrop-blur-md)
- Scroll suave para seções

**Mobile:**
- Logo AD Telas (altura 48px)
- Botão WhatsApp com animação de pulso
- Menu hamburger
- Altura: 64px (h-16)
- Menu dropdown ao clicar no hamburger

### 3.2 Seções da Home (em ordem)

#### 3.2.1 Hero Section
**Conteúdo:**
- Título principal chamativo
- Subtítulo com proposta de valor
- CTA primário (WhatsApp)
- CTA secundário (Formulário)
- Imagem hero de alta qualidade

**Elementos visuais:**
- Background gradient ou imagem
- Badges de confiança (anos de experiência, clientes atendidos)

#### 3.2.2 Services Cards (Clicáveis)
**Conteúdo:**
- 2 cards principais:
  1. **Redes de Proteção** 🛡️
     - Cor: Azul escuro (#22345F)
     - Descrição: "Proteção certificada contra quedas"
     - Link: /servicos/redes
  
  2. **Telas Mosquiteiras** 🦟
     - Cor: Laranja (#F49A1A)
     - Descrição: "Proteção contra mosquitos transmissores de dengue"
     - Link: /servicos/telas

**Interação:**
- Hover: Elevação e mudança de cor
- Click: Navega para página da família



#### 3.2.3 Problems Section
**Conteúdo:**
- Título: "Problemas que Resolvemos"
- Lista de problemas comuns:
  - Quedas de crianças e pets
  - Mosquitos transmissores de doenças
  - Invasão de pombos
  - Falta de segurança em janelas/sacadas
- Cada problema com ícone e descrição
- CTA para orçamento

#### 3.2.4 Value Proposition
**Conteúdo:**
- Título: "Por Que Escolher a AD Telas?"
- 4-6 diferenciais principais:
  - ✅ Instalação em 48h
  - ✅ Garantia de 2 anos
  - ✅ Material certificado INMETRO
  - ✅ Equipe especializada
  - ✅ Orçamento grátis
  - ✅ Atendimento em toda São Paulo

**Layout:**
- Grid responsivo (2 colunas desktop, 1 coluna mobile)
- Ícones Lucide
- Cores da marca

#### 3.2.5 Case Studies
**Conteúdo:**
- Título: "Projetos Realizados"
- 3-4 cases com:
  - Foto antes/depois
  - Descrição do projeto
  - Localização (bairro)
  - Tipo de serviço
- Carrossel ou grid

#### 3.2.6 Reviews Carousel
**Conteúdo:**
- Título: "O Que Nossos Clientes Dizem"
- Avaliações reais do Google
- Cada review contém:
  - Nome do cliente
  - Foto (se disponível)
  - Estrelas (5/5)
  - Texto da avaliação
  - Data
- Link para Google Reviews
- Carrossel automático

**Imagens disponíveis:**
- avaliação1.png
- avaliação2.png
- avaliação3.png
- avaliação4.png
- avaliação5.png



#### 3.2.7 Segmented Solutions
**Conteúdo:**
- Título: "Soluções Para Cada Necessidade"
- Segmentação por público:
  1. **Famílias com Crianças**
     - Redes para janelas, sacadas, varandas
     - Imagem: bebe.png
  
  2. **Donos de Pets**
     - Redes para gatos e cachorros
     - Telas Pet Screen
     - Imagem: gato.png, pets_pro.png
  
  3. **Condomínios**
     - Soluções completas para apartamentos
     - Instalação em múltiplas unidades
  
  4. **Comércio e Indústria**
     - Telas para restaurantes
     - Proteção industrial
     - Fachadas grandes

**Layout:**
- Cards clicáveis
- Ícones representativos
- Link para categoria específica

#### 3.2.8 FAQ Section
**Conteúdo:**
- Título: "Perguntas Frequentes"
- 8-12 perguntas comuns:
  1. Quanto tempo demora a instalação?
  2. Tem garantia?
  3. Fazem orçamento grátis?
  4. Qual o material das redes?
  5. As telas bloqueiam a visão?
  6. Como é feita a medição?
  7. Atendem em qual região?
  8. Qual a forma de pagamento?

**Interação:**
- Accordion (abre/fecha)
- Ícone chevron-down
- Animação suave

#### 3.2.9 CTA Section
**Conteúdo:**
- Título: "Pronto Para Proteger Sua Família?"
- Subtítulo motivacional
- 3 opções de contato:
  1. **WhatsApp** (principal)
     - Botão verde (#25D366)
     - Texto: "Falar no WhatsApp"
     - Link: wa.me/5511983586611
  
  2. **Telefone**
     - Botão azul
     - Texto: "(11) 98358-6611"
     - Link: tel:+5511983586611
  
  3. **Formulário**
     - Botão laranja
     - Abre modal com formulário

**Design:**
- Background destacado
- Botões grandes e visíveis
- Urgência sutil (sem ser agressivo)



### 3.3 Quick Help Chat (Flutuante)
**Posição:** Canto inferior direito
**Conteúdo:**
- Ícone de chat
- Ao clicar, abre opções:
  - WhatsApp
  - Telefone
  - Formulário
- Animação de entrada
- Sempre visível (exceto em modais)

### 3.4 Footer
**Conteúdo:**
- Nome da empresa: "AD Telas e Redes © 2026"
- Endereço: São Paulo - SP
- CNPJ: 40.297.694/0001-95
- Contatos:
  - Telefone: (11) 98358-6611
  - Email: vendas.adtelaseredes@gmail.com
- Redes sociais (SocialButtons component)
- Links legais:
  - Termos de Uso
  - Política de Privacidade
- Copyright

**Design:**
- Background: Azul escuro (#22345F)
- Texto: Branco
- Layout centralizado



---

## 4. Sistema de Serviços (35 Serviços) {#servicos}

### 4.1 Estrutura Hierárquica

```
2 FAMÍLIAS
├── Redes de Proteção (17 serviços)
│   ├── Residencial (7 serviços)
│   ├── Pets & Crianças (5 serviços)
│   └── Comercial (5 serviços)
│
└── Telas Mosquiteiras (18 serviços)
    ├── Residencial (6 serviços)
    ├── Modelos Especiais (6 serviços)
    ├── Pet Screen (2 serviços)
    └── Fachadas Grandes (4 serviços)
```

### 4.2 Família: Redes de Proteção (17 serviços)

#### 4.2.1 Categoria: Residencial (7 serviços)

**1. Redes para Janelas**
- Slug: `/servicos/redes/residencial/janelas`
- Descrição: "Proteção invisível para todas as janelas"
- Destaque: "Mais vendido"
- Imagem: `Redes_para_Janelas.png`
- Imagem Especificações: `Redes_para_Janelas_especificações.png`
- Keywords: janela, apartamento, casa, proteção janela
- **Especificações Técnicas:**
  - Material: Polietileno alta resistência
  - Resistência: Até 500kg
  - Garantia: 2 anos
  - Instalação: 48h após medição

**2. Redes para Portas**
- Slug: `/servicos/redes/residencial/portas`
- Descrição: "Segurança sem bloquear a ventilação"
- Destaque: "Ventilação total"
- Imagem: `Redes_para_Portas.png`
- Imagem Especificações: `Redes_para_Portas_especificações.jpeg`
- Keywords: porta, porta balcão, entrada
- **Especificações Técnicas:**
  - Material: Polietileno alta resistência
  - Resistência: Até 500kg
  - Garantia: 2 anos
  - Instalação: 48h após medição

**3. Redes para Sacadas**
- Slug: `/servicos/redes/residencial/sacadas`
- Descrição: "Aproveite sua sacada com segurança"
- Destaque: "Resiste 500kg"
- Imagem: `Redes_para_Sacadas.jpg`
- Imagem Especificações: `Redes_para_Sacadas_especificações.jpg`
- Keywords: sacada, varanda, terraço
- **Especificações Técnicas:**
  - Material: Polietileno alta resistência
  - Resistência: Até 500kg
  - Garantia: 2 anos
  - Instalação: 48h após medição

**4. Redes para Varandas**
- Slug: `/servicos/redes/residencial/varandas`
- Descrição: "Proteção total para varandas"
- Destaque: "Instalação 48h"
- Imagem: `bebe.png`
- Imagem Especificações: `Redes_para_Varandas_especificações.jpg`
- Keywords: varanda, sacada, área externa
- **Especificações Técnicas:**
  - Material: Polietileno alta resistência
  - Resistência: Até 500kg
  - Garantia: 2 anos
  - Instalação: 48h após medição

**5. Redes para Apartamentos**
- Slug: `/servicos/redes/residencial/apartamentos`
- Descrição: "Solução completa para seu apartamento"
- Destaque: "Pacote completo"
- Imagem: `Redes_para_Apartamentos.png`
- Imagem Especificações: `Redes_para_Apartamentos_especificações.jpg`
- Keywords: apartamento, condomínio, prédio
- **Especificações Técnicas:**
  - Material: Polietileno alta resistência
  - Resistência: Até 500kg
  - Garantia: 2 anos
  - Instalação: 48h após medição

**6. Redes para Escadas**
- Slug: `/servicos/redes/residencial/escadas`
- Descrição: "Segurança em escadas e mezaninos"
- Destaque: "Sob medida"
- Imagem: `Redes_para_Escadas.jpg`
- Imagem Especificações: `Redes_para_Escadas_especificações.png`
- Keywords: escada, mezanino, degrau
- **Especificações Técnicas:**
  - Material: Polietileno alta resistência
  - Resistência: Até 500kg
  - Garantia: 2 anos
  - Instalação: 48h após medição

**7. Redes para Basculantes**
- Slug: `/servicos/redes/residencial/basculantes`
- Descrição: "Proteção para janelas basculantes"
- Destaque: "Fácil abertura"
- Imagem: `Redes_para_Basculantes.png`
- Imagem Especificações: `Redes_para_Basculantes_especificações.jpg`
- Keywords: basculante, janela basculante
- **Especificações Técnicas:**
  - Material: Polietileno alta resistência
  - Resistência: Até 500kg
  - Garantia: 2 anos
  - Instalação: 48h após medição



#### 4.2.2 Categoria: Pets & Crianças (5 serviços)

**8. Redes para Crianças**
- Slug: `/servicos/redes/pets/criancas`
- Descrição: "Máxima segurança para os pequenos"
- Destaque: "Certificado INMETRO"
- Imagem: `Redes_para_Crianças.png`
- Imagem Especificações: `Redes_para_Crianças_especificações.png`
- Keywords: criança, bebê, infantil
- **Especificações Técnicas:**
  - Material: Polietileno alta resistência
  - Resistência: Até 500kg
  - Garantia: 2 anos
  - Instalação: 48h após medição
  - Certificação: INMETRO

**9. Redes para Gatos**
- Slug: `/servicos/redes/pets/gatos`
- Descrição: "Impeça fugas e quedas de gatos"
- Destaque: "Malha reforçada"
- Imagem: `gato.png`
- Imagem Especificações: `Redes_para_Gatos_especificaçoes.png`
- Keywords: gato, felino, pet
- **Especificações Técnicas:**
  - Material: Polietileno alta resistência
  - Resistência: Até 500kg
  - Garantia: 2 anos
  - Instalação: 48h após medição
  - Malha: Reforçada para pets

**10. Redes para Cachorros**
- Slug: `/servicos/redes/pets/cachorros`
- Descrição: "Proteção para cães de todos os portes"
- Destaque: "Extra resistente"
- Imagem: `Redes_para_Cachorros.png`
- Imagem Especificações: `Redes_para_Cachorros_especificações.png`
- Keywords: cachorro, cão, pet
- **Especificações Técnicas:**
  - Material: Polietileno alta resistência
  - Resistência: Até 500kg
  - Garantia: 2 anos
  - Instalação: 48h após medição
  - Malha: Extra resistente

**11. Redes para Animais**
- Slug: `/servicos/redes/pets/animais`
- Descrição: "Proteção para todos os tipos de pets"
- Destaque: "Versátil"
- Imagem: `Redes_para_Animais.png`
- Imagem Especificações: `Redes_para_Animais_especificações.png`
- Keywords: animal, pet, bicho
- **Especificações Técnicas:**
  - Material: Polietileno alta resistência
  - Resistência: Até 500kg
  - Garantia: 2 anos
  - Instalação: 48h após medição

**12. Redes para Idosos**
- Slug: `/servicos/redes/pets/idosos`
- Descrição: "Segurança para a terceira idade"
- Destaque: "Cuidado especial"
- Imagem: `Redes_para_Idosos.png`
- Imagem Especificações: `Redes_para_Idosos_especificações.png`
- Keywords: idoso, terceira idade, segurança
- **Especificações Técnicas:**
  - Material: Polietileno alta resistência
  - Resistência: Até 500kg
  - Garantia: 2 anos
  - Instalação: 48h após medição

#### 4.2.3 Categoria: Comercial (5 serviços)

**13. Redes para Portões**
- Slug: `/servicos/redes/comercial/portoes`
- Descrição: "Proteção para portões e entradas"
- Destaque: "Alta durabilidade"
- Imagem: `Redes_para_Portões.jpg`
- Imagem Especificações: `Redes_para_Portões_especificações.jpg`
- Keywords: portão, entrada, garagem
- **Especificações Técnicas:**
  - Material: Polietileno alta resistência
  - Resistência: Até 500kg
  - Garantia: 2 anos
  - Instalação: 48h após medição

**14. Redes para Muros**
- Slug: `/servicos/redes/comercial/muros`
- Descrição: "Segurança adicional em muros"
- Destaque: "Anti-invasão"
- Imagem: `Redes_para_Muros.jpg`
- Imagem Especificações: `Redes_para_Muros_especificações.png`
- Keywords: muro, cerca, perímetro
- **Especificações Técnicas:**
  - Material: Polietileno alta resistência
  - Resistência: Até 500kg
  - Garantia: 2 anos
  - Instalação: 48h após medição

**15. Redes para Telhados**
- Slug: `/servicos/redes/comercial/telhados`
- Descrição: "Proteção contra pombos e pássaros"
- Destaque: "Anti-pombos"
- Imagem: `Redes_para_Telhados.jpg`
- Imagem Especificações: `Redes_para_Telhados_especificações.jpg`
- Keywords: telhado, pombo, pássaro
- **Especificações Técnicas:**
  - Material: Polietileno alta resistência
  - Resistência: Até 500kg
  - Garantia: 2 anos
  - Instalação: 48h após medição

**16. Redes para Piscinas**
- Slug: `/servicos/redes/comercial/piscinas`
- Descrição: "Segurança em áreas de piscina"
- Destaque: "Resistente à água"
- Imagem: `Redes_para_Piscinas.jpg`
- Imagem Especificações: `Redes_para_Piscinas_especificações.jpg`
- Keywords: piscina, área de lazer
- **Especificações Técnicas:**
  - Material: Polietileno alta resistência
  - Resistência: Até 500kg
  - Garantia: 2 anos
  - Instalação: 48h após medição
  - Tratamento: Resistente à água e cloro

**17. Redes para Coberturas**
- Slug: `/servicos/redes/comercial/coberturas`
- Descrição: "Proteção para áreas cobertas"
- Destaque: "Sob medida"
- Imagem: `Redes_para_Coberturas.jpg`
- Imagem Especificações: `Redes_para_Coberturas_especificações.jpg`
- Keywords: cobertura, toldo
- **Especificações Técnicas:**
  - Material: Polietileno alta resistência
  - Resistência: Até 500kg
  - Garantia: 2 anos
  - Instalação: 48h após medição



### 4.3 Família: Telas Mosquiteiras (18 serviços)

#### 4.3.1 Categoria: Residencial (6 serviços)

**18. Telas para Janelas**
- Slug: `/servicos/telas/residencial/janelas`
- Descrição: "Visão 100% clara, proteção total"
- Destaque: "85% transparência"
- Imagem: `TELA_MOSQUITEIRA.png`
- Keywords: tela janela, mosquiteira, dengue
- **Especificações Técnicas:**
  - Material: Fibra de vidro ou poliéster
  - Transparência: 85%
  - Garantia: 2 anos
  - Instalação: 48h após medição
  - Proteção: Mosquitos, dengue, zika, chikungunya

**19. Telas para Portas**
- Slug: `/servicos/telas/residencial/portas`
- Descrição: "Ventilação sem mosquitos"
- Destaque: "Fácil abertura"
- Imagem: `Telas_para_Portas.jpeg`
- Imagem Especificações: `Telas_para_Portas_especificações.jpeg`
- Keywords: tela porta, mosquiteira porta
- **Especificações Técnicas:**
  - Material: Fibra de vidro ou poliéster
  - Transparência: 85%
  - Garantia: 2 anos
  - Instalação: 48h após medição
  - Sistema: Abertura facilitada

**20. Telas para Varandas**
- Slug: `/servicos/telas/residencial/varandas`
- Descrição: "Aproveite a varanda sem insetos"
- Destaque: "Área completa"
- Imagem: `Telas_para_Varandas.jpg`
- Imagem Especificações: `Telas_para_Varandas_especificações.jpg`
- Keywords: tela varanda, mosquiteira varanda
- **Especificações Técnicas:**
  - Material: Fibra de vidro ou poliéster
  - Transparência: 85%
  - Garantia: 2 anos
  - Instalação: 48h após medição

**21. Telas para Sacadas**
- Slug: `/servicos/telas/residencial/sacadas`
- Descrição: "Proteção total contra mosquitos"
- Destaque: "Instalação rápida"
- Imagem: `telas_para_Sacadas.jpg`
- Imagem Especificações: `telas_para_Sacadas_especificações.jpg`
- Keywords: tela sacada, mosquiteira sacada
- **Especificações Técnicas:**
  - Material: Fibra de vidro ou poliéster
  - Transparência: 85%
  - Garantia: 2 anos
  - Instalação: 48h após medição

**22. Telas para Apartamentos**
- Slug: `/servicos/telas/residencial/apartamentos`
- Descrição: "Solução completa anti-mosquito"
- Destaque: "Pacote completo"
- Imagem: `Telas_para_Apartamento.jpg`
- Imagem Especificações: `Telas_para_Apartamento_especificações.jpg`
- Keywords: tela apartamento, mosquiteira
- **Especificações Técnicas:**
  - Material: Fibra de vidro ou poliéster
  - Transparência: 85%
  - Garantia: 2 anos
  - Instalação: 48h após medição

**23. Telas para Banheiro**
- Slug: `/servicos/telas/residencial/banheiro`
- Descrição: "Proteção em áreas úmidas"
- Destaque: "Anti-mofo"
- Imagem: `Telas_para_Banheiro.jpg`
- Imagem Especificações: `Telas_para_Banheiro_especificações.jpg`
- Keywords: tela banheiro, mosquiteira banheiro
- **Especificações Técnicas:**
  - Material: Fibra de vidro ou poliéster
  - Transparência: 85%
  - Garantia: 2 anos
  - Instalação: 48h após medição
  - Tratamento: Anti-mofo e anti-umidade



#### 4.3.2 Categoria: Modelos Especiais (6 serviços)

**24. Telas de Correr**
- Slug: `/servicos/telas/especiais/correr`
- Descrição: "Sistema deslizante prático"
- Destaque: "Fácil uso"
- Imagem: `Telas_de_Correr.jpg`
- Imagem Especificações: `Telas_de_Correr_especificações.jpg`
- Keywords: tela correr, deslizante
- **Especificações Técnicas:**
  - Material: Fibra de vidro com perfil de alumínio
  - Sistema: Deslizante com trilhos
  - Garantia: 2 anos
  - Instalação: 48h após medição

**25. Telas Pivotantes**
- Slug: `/servicos/telas/especiais/pivotante`
- Descrição: "Abertura giratória"
- Destaque: "Moderna"
- Imagem: `Telas Pivotantes.webp`
- Keywords: tela pivotante, giratória
- **Especificações Técnicas:**
  - Material: Fibra de vidro com perfil de alumínio
  - Sistema: Abertura giratória 180°
  - Garantia: 2 anos
  - Instalação: 48h após medição

**26. Telas Removíveis**
- Slug: `/servicos/telas/especiais/removivel`
- Descrição: "Fácil de remover e limpar"
- Destaque: "Prática"
- Imagem: `Telas Removíveis.webp`
- Imagem Especificações: `Telas Removíveis especificações.jpg`
- Keywords: tela removível, destacável
- **Especificações Técnicas:**
  - Material: Fibra de vidro com perfil de alumínio
  - Sistema: Encaixe removível
  - Garantia: 2 anos
  - Instalação: 48h após medição
  - Manutenção: Fácil limpeza

**27. Telas para Basculantes**
- Slug: `/servicos/telas/especiais/basculante`
- Descrição: "Específica para janelas basculantes"
- Destaque: "Sob medida"
- Imagem: `Telas para Basculante.jpg`
- Imagem Especificações: `Telas para Basculante especificações.webp`
- Keywords: tela basculante, janela basculante
- **Especificações Técnicas:**
  - Material: Fibra de vidro com perfil de alumínio
  - Sistema: Adaptado para basculante
  - Garantia: 2 anos
  - Instalação: 48h após medição

**28. Telas com Alumínio**
- Slug: `/servicos/telas/especiais/aluminio`
- Descrição: "Estrutura em alumínio reforçado"
- Destaque: "Durável"
- Imagem: `Telas com Alumínio.jpg`
- Imagem Especificações: `Telas com Alumínio especificações.jpg`
- Keywords: tela alumínio, estrutura alumínio
- **Especificações Técnicas:**
  - Material: Fibra de vidro com perfil de alumínio reforçado
  - Estrutura: Alumínio anodizado
  - Garantia: 2 anos
  - Instalação: 48h após medição
  - Durabilidade: Alta resistência

**29. Telas com Aço Inox**
- Slug: `/servicos/telas/especiais/acoinox`
- Descrição: "Máxima resistência e durabilidade"
- Destaque: "Premium"
- Imagem: `Telas com Aço Inox.jpg`
- Imagem Especificações: `Telas com Aço Inox especificações.png`
- Keywords: tela aço inox, inox
- **Especificações Técnicas:**
  - Material: Malha de aço inoxidável
  - Estrutura: Perfil de aço inox
  - Garantia: 2 anos
  - Instalação: 48h após medição
  - Durabilidade: Máxima (premium)

#### 4.3.3 Categoria: Pet Screen (2 serviços)

**30. Telas Pet Screen**
- Slug: `/servicos/telas/pet/pets`
- Descrição: "Resistente a arranhões de pets"
- Destaque: "Anti-arranhão"
- Imagem: `Telas Pet Screen.webp`
- Imagem Especificações: `Telas Pet Screen especificações.jpg`
- Keywords: tela pet, pet screen, gato, cachorro
- **Especificações Técnicas:**
  - Material: Poliéster reforçado (Pet Screen)
  - Resistência: Anti-arranhão
  - Garantia: 2 anos
  - Instalação: 48h após medição
  - Proteção: Resistente a garras de pets

**31. Telas Anti-Pernilongos**
- Slug: `/servicos/telas/pet/pernilongos`
- Descrição: "Malha extra fina contra pernilongos"
- Destaque: "Malha micro"
- Imagem: `Telas Anti-Pernilongos.jpg`
- Imagem Especificações: `Telas Anti-Pernilongos especificações.webp`
- Keywords: pernilongo, mosquito, inseto
- **Especificações Técnicas:**
  - Material: Fibra de vidro malha micro
  - Malha: Extra fina (micro mesh)
  - Garantia: 2 anos
  - Instalação: 48h após medição
  - Proteção: Pernilongos e insetos pequenos



#### 4.3.4 Categoria: Fachadas Grandes (4 serviços)

**32. Telas para Fachadas**
- Slug: `/servicos/telas/comercial/fachadas`
- Descrição: "Proteção para grandes fachadas"
- Destaque: "Grande porte"
- Imagem: `Telas para Fachadas.webp`
- Imagem Especificações: `Telas para Fachadas especificações.png`
- Keywords: fachada, prédio, comercial
- **Especificações Técnicas:**
  - Material: Fibra de vidro reforçada
  - Aplicação: Grandes áreas
  - Garantia: 2 anos
  - Instalação: Sob medida
  - Uso: Comercial e industrial

**33. Telas para Coberturas**
- Slug: `/servicos/telas/comercial/coberturas`
- Descrição: "Proteção em áreas cobertas"
- Destaque: "Sob medida"
- Imagem: `Telas para Coberturas.jpg`
- Imagem Especificações: `Telas para Coberturas especificações.jpg`
- Keywords: cobertura, toldo, área coberta
- **Especificações Técnicas:**
  - Material: Fibra de vidro ou poliéster
  - Aplicação: Áreas cobertas
  - Garantia: 2 anos
  - Instalação: 48h após medição

**34. Telas para Restaurantes**
- Slug: `/servicos/telas/comercial/restaurantes`
- Descrição: "Ambiente livre de insetos"
- Destaque: "Comercial"
- Imagem: `Telas para Restaurantes.jpg`
- Imagem Especificações: `Telas para Restaurantes especificações.jpeg`
- Keywords: restaurante, bar, comercial
- **Especificações Técnicas:**
  - Material: Fibra de vidro
  - Aplicação: Estabelecimentos comerciais
  - Garantia: 2 anos
  - Instalação: 48h após medição
  - Certificação: Vigilância sanitária

**35. Telas para Indústrias**
- Slug: `/servicos/telas/comercial/industrias`
- Descrição: "Proteção industrial"
- Destaque: "Alta resistência"
- Imagem: `Telas para Indústrias.webp`
- Imagem Especificações: `Telas para Indústrias especificações.webp`
- Keywords: indústria, fábrica, galpão
- **Especificações Técnicas:**
  - Material: Fibra de vidro reforçada
  - Aplicação: Industrial
  - Garantia: 2 anos
  - Instalação: Sob medida
  - Resistência: Alta durabilidade



### 4.4 Páginas de Serviço - Estrutura Detalhada

#### 4.4.1 Página de Família (/servicos/redes ou /servicos/telas)

**Hero Section:**
- Título da família (ex: "Redes de Proteção")
- Ícone da família (🛡️ ou 🦟)
- Descrição completa
- Imagem hero da família
- CTA: "Ver Todos os Serviços"

**Categorias Grid:**
- Cards das categorias
- Cada card mostra:
  - Emoji da categoria
  - Nome da categoria
  - Descrição
  - Número de serviços
  - Link para categoria

**Benefícios:**
- 4 benefícios principais com ícones
- Específicos para a família

**CTA Section:**
- Botões de contato
- Urgência sutil

#### 4.4.2 Página de Categoria (/servicos/{familia}/{categoria})

**Breadcrumb:**
```
Home > Serviços > [Família] > [Categoria]
```

**Hero Section:**
- Título da categoria
- Emoji
- Descrição
- Badge com número de serviços

**Grid de Serviços:**
- Cards dos serviços da categoria
- Cada card contém:
  - Imagem do serviço
  - Título
  - Descrição curta
  - Badge de destaque
  - Botão "Ver Detalhes"
  - Ícone chevron-right

**Layout:**
- Grid responsivo
- 3 colunas desktop
- 2 colunas tablet
- 1 coluna mobile

**CTA Section:**
- Botões de contato contextualizados



#### 4.4.3 Página Individual de Serviço (/servicos/{familia}/{categoria}/{servico})

**Breadcrumb:**
```
Home > Serviços > [Família] > [Categoria] > [Serviço]
```

**Hero Section:**
- Título do serviço (H1)
- Descrição curta
- Badge de destaque
- Imagem principal do serviço (grande, alta qualidade)
- CTA primário: "Solicitar Orçamento Grátis"
- CTA secundário: "Falar no WhatsApp"

**Seção: Por Que Escolher Este Serviço**
- 4 benefícios específicos
- Cada benefício com:
  - Ícone Lucide (check-circle)
  - Título
  - Descrição
- Layout: Grid 2x2 (desktop) ou lista (mobile)

**Seção: Especificações Técnicas**
- Imagem de especificações (se disponível)
- Tabela de especificações:
  - Material
  - Resistência
  - Garantia
  - Instalação
  - Certificações
- Design: Card com borda

**Seção: Comparação (Nós vs Concorrentes)**
- Tabela comparativa
- 2 colunas:
  1. **AD Telas** (com ícones check-circle verdes)
     - Garantia 2 anos
     - Instalação 48h
     - Material premium
     - Certificado INMETRO
  
  2. **Concorrentes** (com ícones x-circle vermelhos)
     - Garantia 6 meses
     - Instalação 7-15 dias
     - Material padrão
     - Sem certificação

**Seção: Como Funciona**
- 4 passos do processo:
  1. **Contato** - Cliente entra em contato
  2. **Medição** - Visita técnica gratuita
  3. **Instalação** - Equipe especializada em 48h
  4. **Garantia** - 2 anos de cobertura
- Timeline visual
- Ícones para cada etapa

**Seção: FAQ Específico**
- 3-5 perguntas específicas do serviço
- Accordion interativo
- Ícone chevron-down

**Seção: Avaliações de Clientes**
- Mini carrossel com 3 avaliações
- Estrelas 5/5
- Link para Google Reviews

**CTA Final (Sticky em Mobile)**
- Sempre visível ao rolar
- Botão WhatsApp grande
- Botão Telefone
- Contador de urgência (opcional)

**Navegação Entre Serviços:**
- Botões "Anterior" e "Próximo"
- Navegam entre serviços da mesma categoria
- Ícones arrow-left e arrow-right

**Serviços Relacionados:**
- 3 cards de serviços relacionados
- Da mesma categoria ou família
- Link direto



---

## 5. Componentes Globais {#componentes}

### 5.1 WhatsApp Floating Button
**Posição:** Canto inferior direito (fixo)
**Comportamento:**
- Sempre visível
- Animação de pulso
- Ao clicar: Abre WhatsApp com mensagem pré-formatada
- Mensagem inclui:
  - Saudação
  - Serviço específico (se em página de serviço)
  - Categoria e família
  - Pedido de orçamento

**Design:**
- Cor: Verde WhatsApp (#25D366)
- Ícone: Logo WhatsApp (SVG inline)
- Tamanho: 60x60px
- Sombra: Elevada
- Z-index: Alto (sempre no topo)

### 5.2 Sticky Bottom Bar (Mobile)
**Visibilidade:** Apenas em mobile
**Posição:** Fixo no bottom
**Conteúdo:**
- 2 botões lado a lado:
  1. WhatsApp (verde)
  2. Telefone (azul)
- Largura: 100%
- Altura: 60px

**Comportamento:**
- Aparece ao rolar 300px
- Desaparece em modais
- Animação de entrada suave

### 5.3 Lead Form Modal
**Trigger:**
- Botão "Solicitar Orçamento"
- Botão "Preencher Formulário"

**Campos:**
1. Nome completo (obrigatório)
2. Telefone/WhatsApp (obrigatório)
3. Email (opcional)
4. Tipo de serviço (select)
5. Mensagem (textarea, opcional)

**Validação:**
- Campos obrigatórios marcados
- Validação de telefone
- Validação de email (se preenchido)

**Após Envio:**
- Mensagem de sucesso
- Redirecionamento para WhatsApp (opcional)
- Email de confirmação

**Design:**
- Modal centralizado
- Overlay escuro (backdrop)
- Botão fechar (X)
- Responsivo



### 5.4 Quick Help Chat
**Posição:** Canto inferior direito (acima do WhatsApp floating)
**Estado Inicial:** Minimizado (ícone de chat)

**Ao Clicar:**
- Expande para mostrar opções
- 3 botões:
  1. WhatsApp
  2. Telefone
  3. Formulário
- Cada botão com ícone e texto

**Design:**
- Cor primária: Azul (#22345F)
- Animação de abertura
- Sombra suave
- Responsivo

### 5.5 Breadcrumb
**Visibilidade:** Todas as páginas de serviço
**Posição:** Topo da página (abaixo do header)

**Formato:**
```
Home > Serviços > Redes de Proteção > Residencial > Janelas
```

**Comportamento:**
- Cada item é clicável
- Último item não é link (página atual)
- Separador: chevron-right
- Cor: Cinza para links, preto para atual

**Responsivo:**
- Desktop: Texto completo
- Mobile: Pode truncar itens do meio

### 5.6 Service Grid Cards
**Uso:** Páginas de categoria
**Layout:** Grid responsivo

**Cada Card Contém:**
- Imagem do serviço (aspect ratio 16:9)
- Badge de destaque (canto superior direito)
- Título do serviço
- Descrição curta (2 linhas)
- Botão "Ver Detalhes"
- Ícone chevron-right

**Interação:**
- Hover: Elevação e escala
- Click: Navega para página do serviço

**Design:**
- Border radius: 12px
- Sombra: Suave
- Padding: 20px
- Background: Branco



---

## 6. Jornada do Usuário {#jornada}

### 6.1 Fluxo Principal: Busca por Redes para Janelas

**Passo 1: Entrada no Site**
- Usuário acessa: `adtelaseredes.com.br`
- Vê Hero Section com proposta de valor
- Identifica necessidade: "Preciso de rede para janela"

**Passo 2: Navegação para Serviços**
- Opção A: Clica em "Redes de Proteção" nos Services Cards
- Opção B: Clica em "Serviços" no menu
- Opção C: Rola até seção de soluções

**Passo 3: Seleção da Família**
- Acessa `/servicos/redes`
- Vê todas as categorias de redes
- Identifica categoria "Residencial"

**Passo 4: Seleção da Categoria**
- Clica em "Residencial"
- Acessa `/servicos/redes/residencial`
- Vê grid com 7 serviços

**Passo 5: Seleção do Serviço**
- Identifica "Redes para Janelas"
- Vê badge "Mais vendido"
- Clica em "Ver Detalhes"

**Passo 6: Página do Serviço**
- Acessa `/servicos/redes/residencial/janelas`
- Lê especificações
- Vê imagens
- Compara com concorrentes
- Lê FAQ

**Passo 7: Conversão**
- Opção A: Clica em "Falar no WhatsApp"
  - Abre WhatsApp com mensagem pré-formatada
  - Mensagem inclui serviço específico
  
- Opção B: Clica em "Solicitar Orçamento"
  - Abre modal de formulário
  - Preenche dados
  - Envia formulário
  
- Opção C: Clica no botão flutuante de WhatsApp
  - Sempre disponível
  - Acesso rápido

### 6.2 Fluxo Alternativo: Busca por Telas para Restaurante

**Passo 1-2:** Igual ao fluxo principal

**Passo 3: Seleção da Família**
- Clica em "Telas Mosquiteiras"
- Acessa `/servicos/telas`

**Passo 4: Seleção da Categoria**
- Identifica categoria "Fachadas Grandes"
- Clica na categoria
- Acessa `/servicos/telas/comercial`

**Passo 5: Seleção do Serviço**
- Vê "Telas para Restaurantes"
- Clica em "Ver Detalhes"
- Acessa `/servicos/telas/comercial/restaurantes`

**Passo 6-7:** Igual ao fluxo principal



### 6.3 Pontos de Conversão

**Página Inicial:**
1. Hero Section CTA
2. Services Cards (navegação)
3. CTA Section (final da página)
4. WhatsApp Floating Button
5. Quick Help Chat

**Páginas de Família:**
1. Hero CTA
2. Cards de categoria (navegação)
3. CTA Section
4. WhatsApp Floating Button

**Páginas de Categoria:**
1. Cards de serviço (navegação)
2. CTA Section
3. WhatsApp Floating Button

**Páginas de Serviço Individual:**
1. Hero CTA (2 botões)
2. CTA após especificações
3. CTA após comparação
4. CTA final (sticky em mobile)
5. WhatsApp Floating Button
6. Quick Help Chat

**Total de Pontos de Conversão por Página:**
- Home: 5 pontos
- Família: 4 pontos
- Categoria: 3 pontos
- Serviço: 6 pontos



---

## 7. Design System {#design}

### 7.1 Paleta de Cores

**Cores Primárias:**
- **Azul Escuro:** `#22345F` (Redes de Proteção, Header, Footer)
- **Laranja:** `#F49A1A` (Telas Mosquiteiras, CTAs secundários)
- **Verde WhatsApp:** `#25D366` (Botões WhatsApp, sucesso)

**Cores Secundárias:**
- **Cinza Escuro:** `#333333` (Texto principal)
- **Cinza Médio:** `#666666` (Texto secundário)
- **Cinza Claro:** `#F5F5F5` (Backgrounds)
- **Branco:** `#FFFFFF` (Backgrounds, cards)

**Cores de Estado:**
- **Sucesso:** `#25D366` (Verde)
- **Erro:** `#DC2626` (Vermelho)
- **Aviso:** `#F59E0B` (Amarelo)
- **Info:** `#3B82F6` (Azul)

### 7.2 Tipografia

**Fonte Principal:** System Font Stack
```css
font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 
             'Helvetica Neue', Arial, sans-serif;
```

**Hierarquia:**
- **H1:** 48px (mobile: 32px) - Bold - Títulos principais
- **H2:** 36px (mobile: 28px) - Bold - Títulos de seção
- **H3:** 28px (mobile: 24px) - Semibold - Subtítulos
- **H4:** 24px (mobile: 20px) - Semibold - Cards
- **Body:** 16px - Regular - Texto padrão
- **Small:** 14px - Regular - Texto secundário
- **Tiny:** 12px - Regular - Labels, badges

### 7.3 Espaçamento

**Sistema de 8px:**
- **xs:** 4px
- **sm:** 8px
- **md:** 16px
- **lg:** 24px
- **xl:** 32px
- **2xl:** 48px
- **3xl:** 64px

**Containers:**
- **Max Width:** 1200px (max-w-7xl)
- **Padding Horizontal:** 16px (mobile), 24px (tablet), 32px (desktop)

### 7.4 Componentes

**Botões:**

1. **Primário (WhatsApp)**
   - Background: `#25D366`
   - Hover: `#20B858`
   - Texto: Branco
   - Padding: 12px 24px
   - Border Radius: 8px
   - Font Weight: Bold

2. **Secundário (Telefone)**
   - Background: `#22345F`
   - Hover: `#1a2847`
   - Texto: Branco
   - Padding: 12px 24px
   - Border Radius: 8px
   - Font Weight: Bold

3. **Terciário (Formulário)**
   - Background: `#F49A1A`
   - Hover: `#d88615`
   - Texto: Branco
   - Padding: 12px 24px
   - Border Radius: 8px
   - Font Weight: Bold

**Cards:**
- Background: Branco
- Border: 1px solid #E5E7EB
- Border Radius: 12px
- Padding: 20px
- Sombra: 0 1px 3px rgba(0,0,0,0.1)
- Hover: Elevação (0 4px 6px rgba(0,0,0,0.1))

**Badges:**
- Padding: 4px 12px
- Border Radius: 16px
- Font Size: 12px
- Font Weight: Semibold
- Cores variadas por contexto



### 7.5 Ícones

**Biblioteca:** Lucide Icons (via Nuxt Icon)

**Ícones Utilizados:**
- `lucide:check-circle` - Benefícios, confirmações
- `lucide:arrow-right` - Navegação, CTAs
- `lucide:chevron-right` - Breadcrumb, navegação
- `lucide:chevron-down` - Dropdowns, FAQ
- `lucide:star` - Avaliações
- `lucide:clock` - Tempo, urgência
- `lucide:arrow-left` - Voltar
- `lucide:x-circle` - Fechar, comparações negativas
- `lucide:layers` - Badge de contagem

**Ícone Especial:**
- WhatsApp: SVG inline (logo oficial)

### 7.6 Animações

**Transições:**
- Duração padrão: 200ms
- Easing: ease-in-out
- Propriedades: transform, opacity, background-color

**Hover Effects:**
- Cards: `transform: translateY(-4px)`
- Botões: `transform: scale(1.02)`
- Links: `color transition`

**Scroll Animations:**
- Fade in: Elementos aparecem ao entrar no viewport
- Slide up: Elementos sobem suavemente
- Stagger: Elementos aparecem em sequência

**Loading States:**
- Skeleton screens
- Spinner para ações
- Progress bar para formulários

### 7.7 Responsividade

**Breakpoints:**
- **Mobile:** < 768px
- **Tablet:** 768px - 1024px
- **Desktop:** > 1024px

**Comportamentos:**

**Mobile:**
- Menu hamburger
- Stack vertical
- Imagens full width
- Botões full width
- Sticky bottom bar
- Font sizes reduzidos

**Tablet:**
- Grid 2 colunas
- Menu completo
- Imagens adaptadas

**Desktop:**
- Grid 3-4 colunas
- Menu horizontal completo
- Imagens otimizadas
- Hover states completos



---

## 8. SEO e Performance {#seo}

### 8.1 Meta Tags

**Página Inicial:**
```html
<title>AD Telas e Redes | Redes de Proteção e Telas Mosquiteiras em SP</title>
<meta name="description" content="Instalação de redes de proteção e telas mosquiteiras em São Paulo. Garantia 2 anos, instalação em 48h. Orçamento grátis!">
```

**Páginas de Serviço:**
```html
<title>[Nome do Serviço] em São Paulo | [Família] | AD Telas</title>
<meta name="description" content="[Título]: [Descrição Curta]. Instalação 48h. Garantia 2 anos. Orçamento grátis!">
```

**Exemplo:**
```html
<title>Redes para Janelas em São Paulo | Redes de Proteção | AD Telas</title>
<meta name="description" content="Redes para Janelas: Proteção invisível para todas as janelas. Instalação 48h. Garantia 2 anos. Orçamento grátis!">
```

### 8.2 Structured Data (Schema.org)

**LocalBusiness:**
```json
{
  "@context": "https://schema.org",
  "@type": "LocalBusiness",
  "name": "AD Telas e Redes",
  "image": "https://adtelaseredes.com.br/images/logo ad.png",
  "telephone": "+55-11-98358-6611",
  "email": "vendas.adtelaseredes@gmail.com",
  "address": {
    "@type": "PostalAddress",
    "addressLocality": "São Paulo",
    "addressRegion": "SP",
    "addressCountry": "BR"
  },
  "aggregateRating": {
    "@type": "AggregateRating",
    "ratingValue": "5",
    "reviewCount": "150"
  }
}
```

**Service:**
```json
{
  "@context": "https://schema.org",
  "@type": "Service",
  "serviceType": "[Nome do Serviço]",
  "provider": {
    "@type": "LocalBusiness",
    "name": "AD Telas e Redes"
  },
  "areaServed": "São Paulo, SP",
  "offers": {
    "@type": "Offer",
    "availability": "https://schema.org/InStock"
  }
}
```

### 8.3 Performance

**Build Size:**
- Total: 2.61 MB
- Gzip: 663 kB
- Target: < 3 MB

**Core Web Vitals:**
- **LCP (Largest Contentful Paint):** < 2.5s
- **FID (First Input Delay):** < 100ms
- **CLS (Cumulative Layout Shift):** < 0.1

**Otimizações:**
- Lazy loading de imagens
- Code splitting
- Tree shaking
- Minificação
- Compressão gzip
- CDN para assets estáticos

### 8.4 Imagens

**Formatos Suportados:**
- PNG
- JPG/JPEG
- WEBP

**Otimização:**
- Compressão automática
- Responsive images
- Alt tags descritivos
- Lazy loading

**Nomenclatura:**
- Padrão: `[Tipo]_para_[Nome].[ext]`
- Especificações: `[Tipo]_para_[Nome]_especificações.[ext]`

**Exemplos:**
- `Redes_para_Janelas.png`
- `Telas_para_Portas.jpeg`
- `Telas Pet Screen.webp`



### 8.5 URLs Amigáveis

**Estrutura:**
```
/servicos/{familia}/{categoria}/{servico}
```

**Características:**
- Lowercase
- Hífens para separação
- Sem caracteres especiais
- Descritivas
- Hierárquicas

**Exemplos:**
```
✅ /servicos/redes/residencial/janelas
✅ /servicos/telas/especiais/correr
✅ /servicos/redes/pets/gatos

❌ /servico.php?id=123
❌ /s/r/j
❌ /Servicos/Redes/Janelas
```

### 8.6 Sitemap

**Estrutura:**
```xml
<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>https://adtelaseredes.com.br/</loc>
    <priority>1.0</priority>
    <changefreq>weekly</changefreq>
  </url>
  <url>
    <loc>https://adtelaseredes.com.br/servicos</loc>
    <priority>0.9</priority>
    <changefreq>weekly</changefreq>
  </url>
  <!-- 35 URLs de serviços -->
  <url>
    <loc>https://adtelaseredes.com.br/servicos/redes/residencial/janelas</loc>
    <priority>0.8</priority>
    <changefreq>monthly</changefreq>
  </url>
  <!-- ... -->
</urlset>
```

**Total de URLs:**
- Home: 1
- Hub de Serviços: 1
- Famílias: 2
- Categorias: 7
- Serviços: 35
- **Total: 46 URLs**

### 8.7 Robots.txt

```
User-agent: *
Allow: /
Disallow: /admin/
Disallow: /.nuxt/
Disallow: /node_modules/

Sitemap: https://adtelaseredes.com.br/sitemap.xml
```



---

## 9. Funcionalidades Especiais

### 9.1 WhatsApp Integration

**Mensagem Pré-formatada:**
```
Olá! Gostaria de um orçamento para:

📋 [Nome do Serviço]
📂 [Família] > [Categoria]

Pode me ajudar?
```

**Exemplo:**
```
Olá! Gostaria de um orçamento para:

📋 Redes para Janelas
📂 Redes de Proteção > Residencial

Pode me ajudar?
```

**URL Format:**
```
https://wa.me/5511983586611?text=[mensagem_codificada]
```

### 9.2 Google Reviews Integration

**Link Direto:**
```
https://www.google.com/search?sca_esv=59de4d94fc229621&sxsrf=ADLYWIIjEuoUVhAIFwXy5vUQP17RrHg2ig:1729605268236&kgmid=/g/11rnbd2wmb&q=AD+TELAS+MOSQUITEIRAS&shndl=30&source=sh/x/loc/uni/m1/1&kgs=5e4e7713d87c37c6&zx=1768571227913&no_sw_cr=1#lrd=0x94ce595a4d5fb92b:0xe81c9935ae058bde,1,,,,
```

**Uso:**
- Link em Reviews Carousel
- CTA "Ver Todas as Avaliações"
- Footer

### 9.3 Formulário de Contato

**Campos:**
1. **Nome Completo** (text, required)
   - Placeholder: "Seu nome completo"
   - Validação: Mínimo 3 caracteres

2. **Telefone/WhatsApp** (tel, required)
   - Placeholder: "(11) 98765-4321"
   - Máscara: (XX) XXXXX-XXXX
   - Validação: Formato brasileiro

3. **Email** (email, optional)
   - Placeholder: "seu@email.com"
   - Validação: Formato de email

4. **Tipo de Serviço** (select, required)
   - Opções: Todas as 35 serviços
   - Agrupados por família e categoria
   - Pré-selecionado se vier de página de serviço

5. **Mensagem** (textarea, optional)
   - Placeholder: "Conte-nos mais sobre sua necessidade..."
   - Máximo: 500 caracteres

**Botão Submit:**
- Texto: "Enviar Solicitação"
- Loading state
- Disabled durante envio

**Após Envio:**
- Modal de sucesso
- Mensagem: "Recebemos sua solicitação! Entraremos em contato em breve."
- Opção: "Falar Agora no WhatsApp"
- Auto-close em 5 segundos



---

## 10. Estatísticas do Sistema

### 10.1 Conteúdo

**Páginas:**
- Total de páginas: 46
- Página inicial: 1
- Páginas de serviço: 45

**Serviços:**
- Total: 35 serviços
- Redes de Proteção: 17
- Telas Mosquiteiras: 18

**Imagens:**
- Total de imagens de serviços: 35
- Imagens de especificações: 33
- Imagens gerais: 15
- **Total: 83 imagens**

**Formatos:**
- PNG: 45%
- JPG/JPEG: 40%
- WEBP: 15%

### 10.2 Cobertura de Imagens

**Redes de Proteção:**
- Residencial: 7/7 (100%) ✅
- Pets & Crianças: 5/5 (100%) ✅
- Comercial: 5/5 (100%) ✅
- **Total: 17/17 (100%) ✅**

**Telas Mosquiteiras:**
- Residencial: 5/6 (83%)
- Modelos Especiais: 6/6 (100%) ✅
- Pet Screen: 2/2 (100%) ✅
- Fachadas Grandes: 4/4 (100%) ✅
- **Total: 17/18 (94%)**

**Geral:**
- Serviços com imagens: 34/35 (97%)
- Serviços com especificações: 33/35 (94%)

### 10.3 Navegação

**Níveis de Profundidade:**
- Nível 1 (Home): 1 página
- Nível 2 (Hub): 1 página
- Nível 3 (Famílias): 2 páginas
- Nível 4 (Categorias): 7 páginas
- Nível 5 (Serviços): 35 páginas

**Cliques Máximos da Home:**
- Para qualquer serviço: 3 cliques
- Para categoria: 2 cliques
- Para família: 1 clique

### 10.4 Componentes

**Componentes Reutilizáveis:**
- Header: 1
- Footer: 1
- WhatsApp Floating: 1
- Quick Help Chat: 1
- Sticky Bottom Bar: 1
- Lead Form Modal: 1
- Breadcrumb: 1
- Service Grid Cards: 1
- CTA Buttons: 3 variações
- **Total: 12 componentes**

**Páginas Vue:**
- index.vue: 1
- servicos/index.vue: 1
- servicos/[familia]/index.vue: 1
- servicos/[familia]/[categoria]/index.vue: 1
- servicos/[familia]/[categoria]/[servico].vue: 1
- **Total: 5 páginas dinâmicas**



---

## 11. Métricas de Sucesso

### 11.1 KPIs Principais

**Conversão:**
- Taxa de conversão geral: > 3%
- Leads por WhatsApp: > 60%
- Leads por formulário: > 30%
- Leads por telefone: > 10%

**Engajamento:**
- Tempo médio na página: > 2 minutos
- Taxa de rejeição: < 50%
- Páginas por sessão: > 3
- Taxa de clique em CTAs: > 15%

**Performance:**
- Tempo de carregamento: < 3 segundos
- Core Web Vitals: Todos "Good"
- Uptime: > 99.5%

**SEO:**
- Posição média no Google: Top 10
- Tráfego orgânico: Crescimento de 20% ao mês
- Palavras-chave ranqueadas: > 100

### 11.2 Metas de Negócio

**Curto Prazo (3 meses):**
- 500 leads qualificados
- 150 orçamentos enviados
- 50 instalações realizadas
- ROI: 300%

**Médio Prazo (6 meses):**
- 1.200 leads qualificados
- 400 orçamentos enviados
- 150 instalações realizadas
- ROI: 500%

**Longo Prazo (12 meses):**
- 3.000 leads qualificados
- 1.000 orçamentos enviados
- 400 instalações realizadas
- ROI: 800%



---

## 12. Roadmap e Melhorias Futuras

### 12.1 Fase 2 (Próximos 3 meses)

**Funcionalidades:**
- [ ] Sistema de agendamento online
- [ ] Calculadora de orçamento automática
- [ ] Chat ao vivo (Tawk.to ou similar)
- [ ] Blog com artigos sobre segurança
- [ ] Galeria de projetos realizados
- [ ] Depoimentos em vídeo

**Otimizações:**
- [ ] PWA (Progressive Web App)
- [ ] Modo offline básico
- [ ] Push notifications
- [ ] Compartilhamento social
- [ ] Integração com Google Analytics 4
- [ ] Pixel do Facebook

### 12.2 Fase 3 (6-12 meses)

**Funcionalidades Avançadas:**
- [ ] Área do cliente
- [ ] Acompanhamento de pedido
- [ ] Sistema de avaliações interno
- [ ] Programa de indicação
- [ ] Cupons de desconto
- [ ] Pagamento online

**Integrações:**
- [ ] CRM (RD Station, HubSpot)
- [ ] ERP interno
- [ ] Sistema de gestão de equipes
- [ ] Rastreamento de instalações
- [ ] Assinatura digital de contratos

### 12.3 Melhorias Contínuas

**UX/UI:**
- Testes A/B de CTAs
- Otimização de formulários
- Melhorias de acessibilidade
- Dark mode (opcional)

**Performance:**
- Otimização de imagens
- Lazy loading avançado
- Service Workers
- Cache strategies

**SEO:**
- Conteúdo otimizado
- Link building
- Local SEO
- Rich snippets

**Conversão:**
- Urgência e escassez
- Provas sociais
- Garantias destacadas
- Facilidades de pagamento



---

## 13. Anexos

### 13.1 Lista Completa de URLs

**Nível 1 - Home:**
```
/
```

**Nível 2 - Hub:**
```
/servicos
```

**Nível 3 - Famílias:**
```
/servicos/redes
/servicos/telas
```

**Nível 4 - Categorias:**
```
/servicos/redes/residencial
/servicos/redes/pets
/servicos/redes/comercial
/servicos/telas/residencial
/servicos/telas/especiais
/servicos/telas/pet
/servicos/telas/comercial
```

**Nível 5 - Serviços (35 URLs):**

**Redes de Proteção - Residencial:**
```
/servicos/redes/residencial/janelas
/servicos/redes/residencial/portas
/servicos/redes/residencial/sacadas
/servicos/redes/residencial/varandas
/servicos/redes/residencial/apartamentos
/servicos/redes/residencial/escadas
/servicos/redes/residencial/basculantes
```

**Redes de Proteção - Pets & Crianças:**
```
/servicos/redes/pets/criancas
/servicos/redes/pets/gatos
/servicos/redes/pets/cachorros
/servicos/redes/pets/animais
/servicos/redes/pets/idosos
```

**Redes de Proteção - Comercial:**
```
/servicos/redes/comercial/portoes
/servicos/redes/comercial/muros
/servicos/redes/comercial/telhados
/servicos/redes/comercial/piscinas
/servicos/redes/comercial/coberturas
```

**Telas Mosquiteiras - Residencial:**
```
/servicos/telas/residencial/janelas
/servicos/telas/residencial/portas
/servicos/telas/residencial/varandas
/servicos/telas/residencial/sacadas
/servicos/telas/residencial/apartamentos
/servicos/telas/residencial/banheiro
```

**Telas Mosquiteiras - Modelos Especiais:**
```
/servicos/telas/especiais/correr
/servicos/telas/especiais/pivotante
/servicos/telas/especiais/removivel
/servicos/telas/especiais/basculante
/servicos/telas/especiais/aluminio
/servicos/telas/especiais/acoinox
```

**Telas Mosquiteiras - Pet Screen:**
```
/servicos/telas/pet/pets
/servicos/telas/pet/pernilongos
```

**Telas Mosquiteiras - Fachadas Grandes:**
```
/servicos/telas/comercial/fachadas
/servicos/telas/comercial/coberturas
/servicos/telas/comercial/restaurantes
/servicos/telas/comercial/industrias
```

### 13.2 Contatos e Informações

**Empresa:**
- Nome: AD Telas e Redes
- CNPJ: 40.297.694/0001-95
- Localização: São Paulo - SP

**Contatos:**
- WhatsApp: (11) 98358-6611
- Telefone: (11) 98358-6611
- Email: vendas.adtelaseredes@gmail.com

**Redes Sociais:**
- Google Reviews: [Link completo no código]
- Instagram: [A definir]
- Facebook: [A definir]

**Horário de Atendimento:**
- Segunda a Sexta: 8h às 18h
- Sábado: 8h às 13h
- Domingo: Fechado

---

## 📝 Notas Finais

Este PRD documenta completamente a experiência do usuário no site AD Telas e Redes, incluindo:

✅ Todas as 46 páginas do sistema
✅ 35 serviços detalhados com imagens
✅ Estrutura de navegação completa
✅ Componentes e funcionalidades
✅ Design system e paleta de cores
✅ Jornada do usuário e pontos de conversão
✅ SEO e performance
✅ Métricas e KPIs

**Versão:** 1.0  
**Data:** 25/02/2026  
**Status:** ✅ Completo e Atualizado

