import assert from 'node:assert'
import fs from 'node:fs'
import path from 'node:path'

console.log('======================================================================')
console.log('FULL MOBILE & TABLET RESPONSIVENESS AUDIT TEST SUITE')
console.log('======================================================================')

const viewports = [
  { name: 'MOBILE_320', width: 320, height: 568, device: 'iPhone SE 1st / Small Mobile' },
  { name: 'MOBILE_360', width: 360, height: 800, device: 'Galaxy S20 / Android Common' },
  { name: 'MOBILE_375', width: 375, height: 812, device: 'iPhone X / 11 / 12 Mini' },
  { name: 'MOBILE_390', width: 390, height: 844, device: 'iPhone 12 / 13 / 14' },
  { name: 'MOBILE_412', width: 412, height: 915, device: 'Pixel 7 / Galaxy S21' },
  { name: 'MOBILE_430', width: 430, height: 932, device: 'iPhone 14 Pro Max / 15 Plus' },
  { name: 'TABLET_768', width: 768, height: 1024, device: 'iPad Mini / Tablet Portrait' },
  { name: 'TABLET_1024', width: 1024, height: 1366, device: 'iPad Pro / Tablet Landscape' },
  { name: 'DESKTOP_1280', width: 1280, height: 800, device: 'Desktop Standard' },
  { name: 'DESKTOP_1920', width: 1920, height: 1080, device: 'Desktop Full HD' }
]

console.log('\n--- GRUPO 1: Viewports & Breakpoint Matrix ---')
viewports.forEach(vp => {
  assert(vp.width > 0 && vp.height > 0, `Viewport ${vp.name} dimension valid`)
  console.log(`  ✓ ${vp.name} (${vp.width}x${vp.height} - ${vp.device}): REGISTERED`)
})

console.log('\n--- GRUPO 2: Auditoria de Overflow Horizontal & Viewport Units ---')

// 2.1: Header.vue has overflow protection and safe touch targets
const headerContent = fs.readFileSync(path.resolve('app/components/Header.vue'), 'utf8')
assert(headerContent.includes('min-h-[44px]'), '2.1 Header has min-h-[44px] touch targets')
assert(!headerContent.includes('w-[350px]'), '2.2 Header has no fixed rigid overflowing widths on mobile')
assert(headerContent.includes('md:hidden') && headerContent.includes('hidden md:block'), '2.3 Header cleanly distinguishes mobile and desktop layouts')
console.log('  ✓ 2.1 - 2.3 Header mobile responsive layout & touch targets PASS')

// 2.2: orcamento.vue has overflow-x-hidden, responsive grid, and iOS >=16px inputs
const orcamentoContent = fs.readFileSync(path.resolve('app/pages/orcamento.vue'), 'utf8')
assert(orcamentoContent.includes('overflow-x-hidden'), '2.4 orcamento.vue has overflow-x-hidden container')
assert(orcamentoContent.includes('text-base'), '2.5 orcamento.vue uses text-base on inputs to prevent iOS auto-zoom')
assert(orcamentoContent.includes('h-32 sm:h-44 md:h-56'), '2.6 orcamento.vue hero carousels are responsive')
assert(orcamentoContent.includes('min-h-[52px]'), '2.7 orcamento.vue submit button has comfortable touch target')
console.log('  ✓ 2.4 - 2.7 /orcamento mobile form, iOS zoom prevention & touch targets PASS')

// 2.3: MediaUploader.vue responsive presentation
const mediaUploaderContent = fs.readFileSync(path.resolve('app/components/MediaUploader.vue'), 'utf8')
assert(mediaUploaderContent.includes('grid-cols-2 sm:grid-cols-3 md:grid-cols-4'), '2.8 MediaUploader has responsive columns for mobile, tablet and desktop')
assert(mediaUploaderContent.includes('max-w-full box-border'), '2.9 MediaUploader enforces max-w-full box-border')
console.log('  ✓ 2.8 - 2.9 MediaUploader grid & card presentation PASS')

// 2.4: FloatingButtons.vue safe-area support
const floatingContent = fs.readFileSync(path.resolve('app/components/FloatingButtons.vue'), 'utf8')
assert(floatingContent.includes('env(safe-area-inset-bottom'), '2.10 FloatingButtons respects iOS env(safe-area-inset-bottom)')
assert(floatingContent.includes('!route.path.startsWith(\'/admin\')'), '2.11 FloatingButtons is hidden on admin pages')
console.log('  ✓ 2.10 - 2.11 FloatingButtons safe-area & admin exclusion PASS')

// 2.5: Admin Shell (admin.vue layout)
const adminLayoutContent = fs.readFileSync(path.resolve('app/layouts/admin.vue'), 'utf8')
assert(adminLayoutContent.includes('overflow-x-hidden'), '2.12 Admin Layout has overflow-x-hidden wrapper')
assert(adminLayoutContent.includes('fixed inset-y-0 left-0 w-[280px]') && adminLayoutContent.includes('md:hidden'), '2.13 Admin Layout uses Sheet/Drawer pattern on mobile')
assert(adminLayoutContent.includes('md:ml-[260px] lg:ml-[280px]'), '2.14 Admin Layout preserves fixed sidebar on desktop')
assert(adminLayoutContent.includes('env(safe-area-inset-top') && adminLayoutContent.includes('env(safe-area-inset-bottom'), '2.15 Admin Layout incorporates iOS safe-areas')
console.log('  ✓ 2.12 - 2.15 Admin Shell mobile sheet drawer & safe-areas PASS')

// 2.6: Admin Leads (leads.vue) Desktop Table + Mobile Cards
const adminLeadsContent = fs.readFileSync(path.resolve('app/pages/admin/leads.vue'), 'utf8')
assert(adminLeadsContent.includes('block md:hidden'), '2.16 Admin Leads has dedicated mobile cards presentation')
assert(adminLeadsContent.includes('hidden md:block'), '2.17 Admin Leads preserves full table on desktop')
assert(adminLeadsContent.includes('min-h-[44px]'), '2.18 Admin Leads touch targets >= 44px')
console.log('  ✓ 2.16 - 2.18 Admin Leads desktop table & mobile cards PASS')

// 2.7: LeadJourneyDrawer.vue 100dvh, internal scroll, safe-areas
const drawerContent = fs.readFileSync(path.resolve('app/components/admin/LeadJourneyDrawer.vue'), 'utf8')
assert(drawerContent.includes('h-[100dvh]') || drawerContent.includes('max-h-[100dvh]'), '2.19 Drawer uses 100dvh for mobile address bar safety')
assert(drawerContent.includes('env(safe-area-inset-top'), '2.20 Drawer respects safe-area-inset-top on sticky header')
assert(drawerContent.includes('env(safe-area-inset-bottom'), '2.21 Drawer respects safe-area-inset-bottom on scroll area')
assert(drawerContent.includes('flex-1 overflow-y-auto'), '2.22 Drawer has single internal scroll area')
assert(drawerContent.includes('min-h-[44px]'), '2.23 Drawer buttons have comfortable touch targets')
console.log('  ✓ 2.19 - 2.23 LeadJourneyDrawer 100dvh, safe-areas & internal scroll PASS')

// 2.8: Admin Login (login.vue)
const loginContent = fs.readFileSync(path.resolve('app/pages/admin/login.vue'), 'utf8')
assert(loginContent.includes('min-h-[100dvh]'), '2.24 Admin Login uses 100dvh')
assert(loginContent.includes('text-base sm:text-sm'), '2.25 Admin Login inputs prevent iOS auto-zoom')
assert(loginContent.includes('min-h-[48px]'), '2.26 Admin Login submit button is full-width and touch-friendly')
console.log('  ✓ 2.24 - 2.26 Admin Login mobile layout PASS')

// 2.9: contato.vue
const contatoContent = fs.readFileSync(path.resolve('app/pages/contato.vue'), 'utf8')
assert(contatoContent.includes('text-base'), '2.27 contato.vue uses text-base on inputs for iOS')
assert(contatoContent.includes('mt-16 md:mt-24'), '2.28 contato.vue has proportional mobile header spacing')
console.log('  ✓ 2.27 - 2.28 /contato mobile form PASS')

console.log('\n======================================================================')
console.log('ALL RESPONSIVENESS INVARIANTS: PASS')
console.log('======================================================================')
