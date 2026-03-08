# Lead Form - 2-Step Funnel Guide

## Overview
Optimized lead capture form with 2-step mini funnel designed for maximum mobile conversion.

## Implementation Details

### Step 1: Quick Capture (Required)
- **Fields**: Nome + Cidade only (2 fields)
- **CTA**: "Continuar no WhatsApp" button
- **User can send directly from Step 1** without filling Step 2
- Optional link to Step 2 for users who want to provide more details

### Step 2: Optional Details
- **Fields**: Bairro/Região + Tipo de Serviço (both optional)
- **Clear messaging**: Blue info box stating "Opcional - Ajuda a enviar um orçamento mais preciso"
- **Navigation**: Back button to return to Step 1
- **CTA**: "Enviar no WhatsApp" button

## Visual Features

### Step Indicator
- Visual progress indicator (1 ━━━ 2)
- Green checkmark when Step 1 is completed
- Current step highlighted in green (#25D366)

### Mobile UX Enhancements
- **Swipe-down to close**: Touch gesture to dismiss modal
- **Drag handle**: Gray bar at top for visual affordance
- **Scrollable content**: Max height 90vh with overflow-y-auto
- **Larger close button**: 10x10 for better touch target
- **Prevents body scroll**: When modal is open

## WhatsApp Message Format

### From Step 1 (minimal):
```
Olá! Meu nome é [Nome], moro em [Cidade]. Gostaria de um orçamento para telas mosqueteiras.
```

### From Step 2 (with details):
```
Olá! Meu nome é [Nome], moro em [Cidade], bairro [Bairro]. Gostaria de um orçamento para: [Tipo de Serviço].
```

## Components

### LeadForm.vue
- Main form component with 2-step logic
- Validation only for Step 1 fields
- WhatsApp message generation
- Visual step indicator
- Responsive design (desktop/modal variants)

### StickyFormModal.vue
- Mobile-optimized modal wrapper
- Swipe-down gesture handling
- Scroll management
- Sticky floating button trigger
- Backdrop overlay

## Key Features

1. **Reduced Friction**: Only 2 required fields in Step 1
2. **Optional Enhancement**: Step 2 for better lead quality
3. **Clear Communication**: Users know what's required vs optional
4. **Mobile-First**: Touch gestures, proper sizing, scrollable
5. **Instant Conversion**: Can send from Step 1 immediately

## Usage

```vue
<!-- In any page -->
<StickyFormModal />

<!-- Or standalone form -->
<LeadForm variant="desktop" />
<LeadForm variant="modal" />
```

## Testing Checklist

- [ ] Step 1 validation works (Nome + Cidade required)
- [ ] Can send from Step 1 without filling Step 2
- [ ] Step 2 link works and shows optional fields
- [ ] Back button returns to Step 1
- [ ] Swipe-down closes modal on mobile
- [ ] Modal is scrollable when content overflows
- [ ] WhatsApp message formats correctly
- [ ] Form resets after successful submission
- [ ] Touch targets are at least 44px
- [ ] Works on iOS and Android devices

## Conversion Optimization

- **Minimal friction**: 2 fields vs 4-5 traditional forms
- **Progressive disclosure**: Optional details in Step 2
- **Clear value**: "Orçamento mais preciso" messaging
- **Trust indicators**: Security badges, no spam promise
- **Fast response**: "Resposta em até 2 horas" promise
- **Mobile gestures**: Native-feeling swipe interactions

## Git Commit
```
feat: 2-step lead form optimization - Step 1 only Nome+Cidade, swipe-down modal - 2026-02-24 23:15
Hash: c91c25c
```

## Next Steps

1. Test on real mobile devices (iOS/Android)
2. Monitor conversion rates Step 1 vs Step 2
3. A/B test different Step 2 messaging
4. Consider adding social proof near form
5. Track which fields users fill in Step 2
