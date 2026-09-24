<script setup>
import { formatFinanceMoney } from '~~/server/shared/financeCore.mjs'
const props = defineProps({ entry: { type: Object, required: true } })
const emit = defineEmits(['close'])
const dialog = ref(null), history = ref([]), loading = ref(true), error = ref('')
onMounted(async () => {
  dialog.value.showModal()
  try { history.value = (await $fetch(`/api/admin/finance/entries/${props.entry.id}/history`)).history }
  catch (e) { error.value = e?.data?.message || 'Não foi possível carregar o histórico.' }
  finally { loading.value = false }
})
const date = value => value ? value.split('-').reverse().join('/') : '—'
</script>
<template>
  <dialog ref="dialog" class="history-dialog" aria-labelledby="finance-history-title" @cancel.prevent="emit('close')">
    <div class="flex justify-between gap-3 mb-4"><h2 id="finance-history-title" class="text-xl font-bold">Histórico da conta</h2><button aria-label="Fechar histórico" class="p-3" @click="emit('close')">✕</button></div>
    <p class="mb-4 text-slate-300">{{ entry.description }} · Últimas 100 alterações</p>
    <p v-if="loading">Carregando…</p><p v-if="error" role="alert" class="text-red-300">{{ error }}</p>
    <ol class="space-y-3"><li v-for="item in history" :key="item.id" class="rounded-lg border border-slate-700 p-3 text-sm">
      <strong>{{ { created: 'Conta criada', updated: 'Conta editada', settled: 'Quitação registrada', open: 'Conta reaberta', cancelled: 'Conta cancelada' }[item.action] }}</strong>
      <p class="text-slate-400">{{ new Date(item.created_at).toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' }) }}</p>
      <p>{{ item.after_data.description }} · {{ item.after_data.counterpart }}</p>
      <p>Valor: <span v-if="item.before_data && item.before_data.amount_cents !== item.after_data.amount_cents">{{ formatFinanceMoney(item.before_data.amount_cents) }} → </span>{{ formatFinanceMoney(item.after_data.amount_cents) }}</p>
      <p>Vencimento: <span v-if="item.before_data && item.before_data.due_date !== item.after_data.due_date">{{ date(item.before_data.due_date) }} → </span>{{ date(item.after_data.due_date) }}</p>
      <p v-if="item.after_data.settled_date">Quitação: {{ date(item.after_data.settled_date) }} · {{ item.after_data.payment_method }}</p>
    </li></ol>
  </dialog>
</template>
<style scoped>
.history-dialog { width: min(95vw, 640px); max-height: 85dvh; overflow: auto; border: 1px solid #475569; border-radius: 18px; padding: 24px; background: #0f172a; color: #f1f5f9; }
.history-dialog::backdrop { background: #020617cc; }
</style>
