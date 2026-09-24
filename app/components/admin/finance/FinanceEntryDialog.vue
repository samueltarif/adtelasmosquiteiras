<script setup>
import { moneyToCents, financeToday, FINANCE_METHODS } from '~~/server/shared/financeCore.mjs'
const props = defineProps({ entry: { type: Object, default: null }, action: { type: String, default: 'create' }, kind: { type: String, default: 'payable' } })
const emit = defineEmits(['close', 'saved'])
const dialog = ref(null), busy = ref(false), error = ref('')
const submissionId = crypto.randomUUID()
const form = reactive({ kind: props.entry?.kind || props.kind, description: props.entry?.description || '', counterpart: props.entry?.counterpart || '', category: props.entry?.category || '', value: props.entry ? (props.entry.amount_cents / 100).toFixed(2).replace('.', ',') : '', due_date: props.entry?.due_date || financeToday(), notes: props.entry?.notes || '', settled_date: financeToday(), payment_method: 'pix' })
const editing = computed(() => ['create', 'edit'].includes(props.action))
const title = computed(() => ({ create: 'Nova conta', edit: 'Editar conta', settle: props.entry?.kind === 'payable' ? 'Registrar pagamento' : 'Registrar recebimento', cancel: 'Cancelar conta', reopen: 'Reabrir conta' })[props.action])
onMounted(() => dialog.value.showModal())
function close() { if (!busy.value) emit('close') }
async function save() {
  if (busy.value) return
  busy.value = true; error.value = ''
  try {
    const payload = editing.value ? { kind: form.kind, description: form.description, counterpart: form.counterpart, category: form.category, amount_cents: moneyToCents(form.value), due_date: form.due_date, notes: form.notes } : { settled_date: form.settled_date, payment_method: form.payment_method }
    if (props.action === 'create') await $fetch('/api/admin/finance/entries', { method: 'POST', body: { ...payload, id: submissionId } })
    else await $fetch(`/api/admin/finance/entries/${props.entry.id}`, { method: 'PATCH', body: { ...payload, action: props.action, version: props.entry.version } })
    emit('saved')
  } catch (e) { error.value = e?.data?.message || e?.message || 'Não foi possível salvar a conta.' }
  finally { busy.value = false }
}
</script>

<template>
  <dialog ref="dialog" class="finance-dialog" aria-labelledby="finance-dialog-title" @cancel.prevent="close">
    <form @submit.prevent="save">
      <div class="flex items-center justify-between gap-3 mb-5"><h2 id="finance-dialog-title" class="text-xl font-bold">{{ title }}</h2><button type="button" :disabled="busy" aria-label="Fechar" class="p-3" @click="close">✕</button></div>
      <fieldset :disabled="busy" class="grid gap-4 sm:grid-cols-2">
        <template v-if="editing">
          <label class="sm:col-span-2">Tipo<select v-model="form.kind"><option value="payable">Conta a pagar</option><option value="receivable">Conta a receber</option></select></label>
          <label class="sm:col-span-2">Descrição<input v-model="form.description" required minlength="2" maxlength="180" placeholder="Ex.: compra de materiais ou instalação" /></label>
          <label class="sm:col-span-2">{{ form.kind === 'payable' ? 'Fornecedor / favorecido' : 'Cliente / pagador' }}<input v-model="form.counterpart" required minlength="2" maxlength="180" /></label>
          <label>Valor total (R$)<input v-model="form.value" required inputmode="decimal" placeholder="0,00" /></label>
          <label>Vencimento<input v-model="form.due_date" required type="date" min="2000-01-01" max="2100-12-31" /></label>
          <label class="sm:col-span-2">Categoria (opcional)<input v-model="form.category" maxlength="80" placeholder="Ex.: materiais, serviços, aluguel" /></label>
          <label class="sm:col-span-2">Observações (opcional)<textarea v-model="form.notes" maxlength="2000" rows="3" /></label>
        </template>
        <template v-else-if="action === 'settle'">
          <p class="sm:col-span-2 text-slate-300">Confirme a quitação integral de <strong>{{ entry.description }}</strong>. Este registro atualiza o controle; não movimenta sua conta bancária.</p>
          <label>Data efetiva<input v-model="form.settled_date" required type="date" min="2000-01-01" :max="financeToday()" /></label>
          <label>Forma<select v-model="form.payment_method"><option v-for="method in FINANCE_METHODS" :key="method" :value="method">{{ { pix: 'Pix', boleto: 'Boleto', transferencia: 'Transferência', dinheiro: 'Dinheiro', cartao: 'Cartão', outro: 'Outro' }[method] }}</option></select></label>
        </template>
        <p v-else class="sm:col-span-2 text-slate-300">{{ action === 'cancel' ? 'Esta conta sairá dos valores em aberto e dos avisos. O histórico será preservado.' : 'Esta conta voltará aos valores em aberto. A alteração ficará registrada no histórico.' }}<br><strong>{{ entry.description }}</strong></p>
      </fieldset>
      <p v-if="error" role="alert" class="mt-4 text-red-300">{{ error }}</p>
      <div class="mt-6 flex gap-3 justify-end"><button type="button" :disabled="busy" class="rounded-xl border border-slate-600 px-4 py-3" @click="close">Voltar</button><button type="submit" :disabled="busy" class="rounded-xl bg-indigo-600 px-5 py-3 font-semibold disabled:opacity-50">{{ busy ? 'Salvando…' : 'Confirmar' }}</button></div>
    </form>
  </dialog>
</template>

<style scoped>
.finance-dialog { width: min(95vw, 600px); max-height: 90dvh; overflow: auto; border: 1px solid #475569; border-radius: 18px; padding: 24px; background: #0f172a; color: #f1f5f9; }
.finance-dialog::backdrop { background: #020617cc; }
label { display: block; font-size: 14px; color: #cbd5e1; }
input, select, textarea { display: block; box-sizing: border-box; width: 100%; min-width: 0; margin-top: 6px; padding: 12px; min-height: 46px; border-radius: 8px; border: 1px solid #475569; background: #020617; color: white; font-size: 16px; color-scheme: dark; }
</style>
