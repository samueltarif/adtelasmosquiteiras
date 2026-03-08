# Guia da Página de Contato

## 📄 Visão Geral

Página dedicada de contato acessível via `/contato` com múltiplas formas de comunicação e formulário integrado ao WhatsApp.

## 🔗 URL

```
https://seusite.com.br/contato
```

## 📋 Estrutura da Página

### 1. Hero Section
- Título: "Entre em Contato"
- Subtítulo: "Estamos prontos para atender você..."
- Background: Gradiente azul (from-#1D7BA6 to-#0F4F7D)
- Padding top: Compensa altura do header (mt-28)

### 2. Layout Principal (Grid 2 Colunas)

#### Coluna Esquerda - Informações de Contato

**Cards de Contato (4 cards):**

1. **WhatsApp** (Verde #25D366)
   - Ícone: WhatsApp
   - Telefone: (11) 98358-6611
   - Link direto: `https://wa.me/5511983586611`
   - Hover: Borda verde + scale

2. **Telefone** (Azul)
   - Ícone: Phone
   - Telefone: (11) 98358-6611
   - Link: `tel:+5511983586611`
   - Hover: Borda azul + scale

3. **Email** (Laranja)
   - Ícone: Mail
   - Email: contato@adtelas.com.br
   - Link: `mailto:contato@adtelas.com.br`
   - Hover: Borda laranja + scale

4. **Localização** (Roxo)
   - Ícone: Map Pin
   - Endereço: São Paulo - SP
   - Sem link (apenas informativo)

**Horário de Atendimento:**
- Background: blue-50
- Segunda a Sexta: 8h às 18h
- Sábado: 8h às 13h
- Domingo: Fechado

#### Coluna Direita - Formulário

**Campos do Formulário:**

1. **Nome Completo** (obrigatório)
   - Type: text
   - Placeholder: "Seu nome"
   - Required: true

2. **Telefone/WhatsApp** (obrigatório)
   - Type: tel
   - Placeholder: "(11) 99999-9999"
   - Required: true

3. **Email** (opcional)
   - Type: email
   - Placeholder: "seu@email.com"

4. **Cidade** (opcional)
   - Type: text
   - Placeholder: "Ex: São Paulo"

5. **Mensagem** (opcional)
   - Type: textarea
   - Rows: 4
   - Placeholder: "Conte-nos sobre seu projeto..."

**Botão de Envio:**
- Cor: #25D366 (verde WhatsApp)
- Texto: "Enviar via WhatsApp"
- Estados: normal, loading, success
- Ação: Abre WhatsApp com mensagem formatada

**Trust Indicators:**
- ✓ 100% Seguro
- ⚡ Resposta Rápida

### 3. CTA Final
- Componente: `<CtaSection />`
- Reutiliza CTA padrão do site

## 📱 Mensagem WhatsApp Gerada

```
Olá! Vim pelo formulário de contato do site.

Nome: [NOME]
Telefone: [TELEFONE]
Email: [EMAIL] (se preenchido)
Cidade: [CIDADE] (se preenchido)

Mensagem:
[MENSAGEM] (se preenchida)
```

## 🎨 Design e Responsividade

### Desktop (>= 768px)
- Grid 2 colunas (50/50)
- Formulário sticky (top-32)
- Cards com hover effects
- Espaçamento: gap-8 lg:gap-12

### Mobile (< 768px)
- 1 coluna (stack vertical)
- Informações de contato primeiro
- Formulário depois
- Cards full-width

## 🔗 Integração com Header

O item "Contato" no menu agora:
- **Tipo:** Link direto (não scroll)
- **Ação:** Navega para `/contato`
- **Comportamento:** Fecha menu mobile após clique

### Código do Menu Atualizado:

```javascript
const menuItems = [
  { label: 'Início', id: 'hero', type: 'scroll' },
  { label: 'Serviços', id: 'problems', type: 'scroll' },
  { label: 'Vantagens', id: 'value', type: 'scroll' },
  { label: 'Cases', id: 'cases', type: 'scroll' },
  { label: 'Avaliações', id: 'reviews', type: 'scroll' },
  { label: 'Soluções', id: 'solutions', type: 'scroll' },
  { label: 'FAQ', id: 'faq', type: 'scroll' },
  { label: 'Contato', id: '/contato', type: 'link' } // ← Link direto
]
```

## 🎯 Pontos de Conversão

A página possui **5 pontos de conversão:**

1. Card WhatsApp (link direto)
2. Card Telefone (tel: link)
3. Card Email (mailto: link)
4. Formulário → WhatsApp
5. CTA Section (final da página)

## 📊 SEO

### Meta Tags Configuradas:

```javascript
useHead({
  title: 'Contato - AD Telas e Redes | Orçamento Grátis',
  meta: [
    { 
      name: 'description', 
      content: 'Entre em contato com a AD Telas e Redes. WhatsApp, telefone, formulário. Atendimento rápido em São Paulo. Orçamento grátis!' 
    },
    { 
      name: 'keywords', 
      content: 'contato ad telas, orçamento telas, whatsapp telas, telefone ad telas' 
    },
    { 
      property: 'og:title', 
      content: 'Contato - AD Telas e Redes' 
    },
    { 
      property: 'og:description', 
      content: 'Fale conosco via WhatsApp, telefone ou formulário. Resposta rápida garantida!' 
    }
  ]
})
```

## 🔧 Customização

### Alterar Dados de Contato:

No arquivo `app/pages/contato.vue`, edite as constantes:

```javascript
const WHATSAPP_NUMBER = '5511983586611'
const PHONE_DISPLAY = '(11) 98358-6611'
const EMAIL = 'vendas.adtelaseredes@gmail.com'
const ADDRESS = 'São Paulo - SP'
```

### Alterar Horário de Atendimento:

Edite a seção "Horário de Atendimento" no template.

### Adicionar Mais Formas de Contato:

Duplique um dos cards existentes e ajuste:
- Ícone (Lucide)
- Cor do background
- Link/ação
- Texto

## 🚀 Melhorias Futuras

### Curto Prazo:
- [ ] Integração com Google Maps (mapa interativo)
- [ ] Validação de telefone com máscara
- [ ] Captcha para evitar spam
- [ ] Confirmação por email

### Médio Prazo:
- [ ] Chat ao vivo
- [ ] Agendamento de visita técnica
- [ ] Upload de fotos do local
- [ ] Calculadora de orçamento

### Longo Prazo:
- [ ] Integração com CRM
- [ ] Sistema de tickets
- [ ] FAQ interativo
- [ ] Chatbot com IA

## 📝 Notas Importantes

1. **Email Atualizado:** O email de contato é `vendas.adtelaseredes@gmail.com`.

2. **Formulário → WhatsApp:** O formulário não envia email, ele abre o WhatsApp com a mensagem formatada. Isso garante que o lead seja capturado imediatamente.

3. **Sticky Formulário:** No desktop, o formulário fica sticky (top-32) para acompanhar o scroll, facilitando o preenchimento.

4. **Trust Indicators:** Os indicadores de confiança aumentam a taxa de conversão ao transmitir segurança.

5. **Múltiplos Canais:** Oferecer várias formas de contato aumenta as chances de conversão, pois cada pessoa tem sua preferência.

## ✅ Checklist de Implementação

- [x] Página criada em `/contato`
- [x] Hero section com gradiente
- [x] 4 cards de contato clicáveis
- [x] Formulário funcional
- [x] Integração com WhatsApp
- [x] Horário de atendimento
- [x] CTA final
- [x] SEO meta tags
- [x] Responsividade mobile
- [x] Link no header
- [x] Trust indicators
- [x] Estados do formulário (loading, success)

---

**Arquivo:** `app/pages/contato.vue`  
**Rota:** `/contato`  
**Última atualização:** 03/03/2026
