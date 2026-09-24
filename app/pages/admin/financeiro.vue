<script setup>
import { formatFinanceMoney } from '~~/server/shared/financeCore.mjs'
import FinanceEntryDialog from '~/components/admin/finance/FinanceEntryDialog.vue'
import FinanceEmailSettings from '~/components/admin/finance/FinanceEmailSettings.vue'
import FinanceHistoryDialog from '~/components/admin/finance/FinanceHistoryDialog.vue'
definePageMeta({ layout: 'admin' })
useHead({ title: 'Contas a pagar e receber | AD Telas' })
const entries = ref([]), summary = ref(null), total = ref(0), today = ref(''), loading = ref(true), error = ref(''), success = ref('')
const filters = reactive({ kind: '', status: 'open', search: '', from: '', to: '', page: 1 })
const modal = ref(null), selected = ref(null), historyEntry = ref(null)
let latestRequest = 0
async function load(reset = false) {
  if (reset) filters.page = 1
  const request = ++latestRequest
  loading.value = true; error.value = ''
  try {
    const result = await $fetch('/api/admin/finance/entries', { query: { ...filters } })
    if (request !== latestRequest) return
    if (!result.entries.length && result.total > 0 && filters.page > 1) {
      filters.page = Math.max(1, Math.ceil(result.total / 25))
      return await load()
    }
    entries.value = result.entries; summary.value = result.summary; total.value = result.total; today.value = result.today
  } catch (e) { if (request === latestRequest) error.value = e?.data?.message || 'Não foi possível carregar as contas.' }
  finally { if (request === latestRequest) loading.value = false }
}
onMounted(() => load())
function open(action, entry = null) { selected.value = entry; modal.value = action; success.value = '' }
async function saved() { modal.value = null; success.value = 'Conta atualizada com sucesso.'; await load() }
function changeKind(kind) { filters.kind = kind; load(true) }
function paginate(delta) { filters.page += delta; load() }
const statusLabel = entry => entry.status === 'settled' ? entry.kind === 'payable' ? 'Paga' : 'Recebida' : entry.status === 'cancelled' ? 'Cancelada' : entry.due_date < today.value ? 'Vencida' : entry.due_date === today.value ? 'Vence hoje' : 'Em aberto'
const date = value => value ? value.split('-').reverse().join('/') : '—'
const cards = [{ key: 'payable_open', label: 'A pagar em aberto' }, { key: 'receivable_open', label: 'A receber em aberto' }, { key: 'payable_overdue', label: 'Pagamentos vencidos' }, { key: 'receivable_overdue', label: 'Recebimentos vencidos' }]
</script>

<template>
  <div class="finance-page max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
    <header class="flex flex-wrap justify-between items-center gap-4"><div><h1 class="text-2xl font-bold">Financeiro</h1><p class="text-slate-400 mt-1">Contas a pagar, contas a receber e avisos de vencimento.</p></div><button class="primary" @click="open('create')">+ Nova conta</button></header>
    <div v-if="summary" class="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3"><div v-for="card in cards" :key="card.key" class="rounded-2xl border border-slate-700 bg-slate-900 p-4"><p class="text-sm text-slate-400">{{ card.label }}</p><p class="mt-2 text-2xl font-bold" :class="card.key.includes('overdue') ? 'text-amber-300' : 'text-white'">{{ formatFinanceMoney(summary[card.key]) }}</p></div></div>
    <p v-if="summary" class="text-xs text-slate-400">Totais gerais de todas as contas em aberto, independentemente dos filtros abaixo.</p>
    <nav class="flex flex-wrap gap-2" aria-label="Tipos de conta"><button v-for="tab in [{ value: '', label: 'Todas' }, { value: 'payable', label: 'Contas a pagar' }, { value: 'receivable', label: 'Contas a receber' }]" :key="tab.value" :aria-pressed="filters.kind === tab.value" :class="filters.kind === tab.value ? 'primary' : 'secondary'" @click="changeKind(tab.value)">{{ tab.label }}</button></nav>
    <form class="grid gap-3 sm:grid-cols-2 lg:grid-cols-5" @submit.prevent="load(true)">
      <label>Buscar<input v-model="filters.search" maxlength="180" placeholder="Descrição ou pessoa" /></label>
      <label>Situação<select v-model="filters.status"><option value="">Todas</option><option value="open">Em aberto</option><option value="overdue">Vencidas</option><option value="settled">Pagas / recebidas</option><option value="cancelled">Canceladas</option></select></label>
      <label>Vencimento inicial<input v-model="filters.from" type="date" /></label><label>Vencimento final<input v-model="filters.to" type="date" /></label>
      <button class="secondary self-end" :disabled="loading">Aplicar filtros</button>
    </form>
    <p v-if="success" role="status" class="text-emerald-300">{{ success }}</p><div v-if="error" role="alert" class="rounded-xl bg-red-500/10 p-4 text-red-300">{{ error }} <button class="underline ml-2" @click="load()">Tentar novamente</button></div>
    <p v-if="loading" role="status" class="text-slate-400">Carregando contas…</p>
    <div v-else-if="!error && !entries.length" class="rounded-2xl border border-dashed border-slate-700 p-10 text-center"><h2 class="font-semibold">Nenhuma conta encontrada</h2><p class="mt-2 text-slate-400">Cadastre uma conta ou ajuste os filtros.</p></div>
    <section v-else-if="!error" class="space-y-3" aria-label="Lista de contas">
      <article v-for="entry in entries" :key="entry.id" class="rounded-2xl border border-slate-700 bg-slate-900 p-4 grid md:grid-cols-[1fr_auto] gap-4">
        <div class="min-w-0"><div class="flex gap-2 flex-wrap items-center"><span class="text-xs rounded-full px-2 py-1" :class="entry.kind === 'payable' ? 'bg-orange-500/10 text-orange-300' : 'bg-emerald-500/10 text-emerald-300'">{{ entry.kind === 'payable' ? 'A pagar' : 'A receber' }}</span><span class="text-xs rounded-full bg-slate-800 px-2 py-1" :class="entry.status === 'open' && entry.due_date <= today ? 'text-amber-300' : 'text-slate-300'">{{ statusLabel(entry) }}</span></div>
          <h2 class="font-semibold mt-2 break-words">{{ entry.description }}</h2><p class="text-sm text-slate-400 break-words">{{ entry.counterpart }}{{ entry.category ? ` · ${entry.category}` : '' }}</p>
          <p class="mt-3"><strong class="text-xl">{{ formatFinanceMoney(entry.amount_cents) }}</strong><span class="inline-block ml-3 text-sm text-slate-300">Vencimento: {{ date(entry.due_date) }}</span></p><p v-if="entry.settled_date" class="text-sm text-emerald-300 mt-1">{{ entry.kind === 'payable' ? 'Paga' : 'Recebida' }} em {{ date(entry.settled_date) }}</p><p v-if="entry.notes" class="text-sm text-slate-400 mt-2 whitespace-pre-wrap break-words">{{ entry.notes }}</p>
        </div>
        <div class="flex flex-wrap md:max-w-[260px] md:justify-end content-start gap-2">
          <template v-if="entry.status === 'open'"><button class="primary" @click="open('settle', entry)">{{ entry.kind === 'payable' ? 'Registrar pagamento' : 'Registrar recebimento' }}</button><button class="secondary" @click="open('edit', entry)">Editar</button><button class="secondary" @click="open('cancel', entry)">Cancelar conta</button></template>
          <button v-else class="secondary" @click="open('reopen', entry)">Reabrir</button><button class="secondary" @click="historyEntry = entry">Histórico</button>
        </div>
      </article>
      <div class="flex flex-wrap items-center justify-between gap-3 text-sm"><span>{{ total }} conta(s) · Página {{ filters.page }} de {{ Math.max(1, Math.ceil(total / 25)) }}</span><div class="flex gap-2"><button class="secondary" :disabled="filters.page <= 1 || loading" @click="paginate(-1)">Anterior</button><button class="secondary" :disabled="filters.page * 25 >= total || loading" @click="paginate(1)">Próxima</button></div></div>
    </section>
    <FinanceEmailSettings />
    <FinanceEntryDialog v-if="modal" :entry="selected" :action="modal" :kind="filters.kind || 'payable'" @close="modal = null" @saved="saved" />
    <FinanceHistoryDialog v-if="historyEntry" :entry="historyEntry" @close="historyEntry = null" />
  </div>
</template>
<style scoped>
.primary, .secondary { min-height: 44px; padding: 10px 14px; border-radius: 10px; font-size: 14px; }
.primary { background: #4f46e5; color: white; font-weight: 600; }
.secondary { background: #0f172a; color: #cbd5e1; border: 1px solid #475569; }
button:disabled { opacity: .45; cursor: not-allowed; }
label { font-size: 13px; color: #cbd5e1; min-width: 0; }
input, select { display: block; box-sizing: border-box; width: 100%; min-width: 0; margin-top: 5px; min-height: 44px; padding: 10px; border: 1px solid #475569; border-radius: 8px; background: #020617; color: white; font-size: 16px; color-scheme: dark; }
</style>
