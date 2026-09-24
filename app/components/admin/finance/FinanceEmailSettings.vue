<script setup>
const data = ref(null), error = ref(''), message = ref(''), busy = ref(false), loading = ref(true)
const form = reactive({ recipient: '', enabled: true, days_before: 3, version: 1 })
async function load() {
  try {
    data.value = await $fetch('/api/admin/finance/settings')
    Object.assign(form, data.value.settings)
  } catch (e) { error.value = e?.data?.message || 'Não foi possível carregar os avisos.' }
  finally { loading.value = false }
}
onMounted(load)
async function save() {
  busy.value = true; error.value = ''; message.value = ''
  try { const result = await $fetch('/api/admin/finance/settings', { method: 'PATCH', body: form }); Object.assign(form, result.settings); message.value = 'Configurações salvas.' }
  catch (e) { error.value = e?.data?.message || 'Não foi possível salvar.' }
  finally { busy.value = false }
}
async function sendNow() {
  busy.value = true; error.value = ''; message.value = ''
  try {
    const result = await $fetch('/api/admin/finance/reminders', { method: 'POST' })
    message.value = result.disabled ? 'Os avisos estão desativados.' : result.sent ? `Avisos de ${result.sent} conta(s) enviados para o e-mail configurado.` : 'Nenhum novo aviso pendente para enviar.'
    await load()
  } catch (e) { error.value = e?.data?.message || 'Não foi possível enviar.'; await load() }
  finally { busy.value = false }
}
const formatDate = value => value ? new Date(value).toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' }) : 'Ainda não executada'
</script>

<template>
  <details class="rounded-2xl border border-slate-700 bg-slate-900 p-5">
    <summary class="cursor-pointer font-semibold">Avisos de vencimento por e-mail</summary>
    <p v-if="loading" class="mt-4 text-slate-400">Carregando configurações…</p>
    <template v-if="data">
      <p v-if="!data.smtpConfigured || !data.cronConfigured" role="status" class="mt-4 rounded-xl bg-amber-500/10 p-3 text-amber-200">A ativação automática ainda depende da configuração do servidor: {{ !data.smtpConfigured ? 'envio por Gmail' : '' }}{{ !data.smtpConfigured && !data.cronConfigured ? ' e ' : '' }}{{ !data.cronConfigured ? 'rotina de agendamento' : '' }}.</p>
      <form class="mt-4 grid gap-4 md:grid-cols-3" @submit.prevent="save">
        <label class="md:col-span-2 text-sm">E-mail que recebe os avisos<input v-model="form.recipient" type="email" required maxlength="254" :disabled="busy" class="mt-1 w-full rounded-lg border border-slate-600 bg-slate-950 p-3" /></label>
        <label class="text-sm">Antecedência (dias)<input v-model.number="form.days_before" type="number" min="1" max="30" required :disabled="busy" class="mt-1 w-full rounded-lg border border-slate-600 bg-slate-950 p-3" /></label>
        <label class="flex gap-2 items-center"><input v-model="form.enabled" type="checkbox" :disabled="busy" /> Ativar avisos</label>
        <div class="md:col-span-2 flex flex-wrap gap-3 md:justify-end"><button type="submit" :disabled="busy" class="rounded-lg bg-indigo-600 px-4 py-3 disabled:opacity-50">Salvar avisos</button><button type="button" :disabled="busy || !data.smtpConfigured" class="rounded-lg border border-slate-600 px-4 py-3 disabled:opacity-50" @click="sendNow">Verificar vencimentos agora</button></div>
      </form>
      <p class="mt-4 text-sm text-slate-400">Um aviso dentro da antecedência escolhida e outro no vencimento. Se a rotina perder o dia, o aviso pendente poderá ser enviado depois, indicando conta vencida. Somente contas em aberto. Salve as alterações antes de verificar agora.</p>
      <p class="mt-2 text-sm text-slate-400">Última verificação: {{ formatDate(data.settings.last_run_at) }}. A rotina diária precisa estar ativa na hospedagem.</p>
      <div v-if="data.reminders.length" class="mt-5 space-y-2">
        <h3 class="font-semibold">Últimos avisos</h3>
        <div v-for="item in data.reminders" :key="item.id" class="rounded-lg border border-slate-700 p-3 text-sm">
          <p>{{ item.finance_entries?.description }} — <span :class="item.status === 'sent' ? 'text-emerald-300' : 'text-amber-300'">{{ { sent: 'Enviado', processing: 'Aguardando confirmação', uncertain: 'Envio não confirmado' }[item.status] }}</span></p>
          <p class="text-slate-400">{{ formatDate(item.created_at) }} · {{ item.recipient }}</p>
          <p v-if="item.error" class="mt-1 text-amber-200">{{ item.error }}</p>
        </div>
      </div>
    </template>
    <p v-if="message" role="status" class="mt-4 text-emerald-300">{{ message }}</p>
    <p v-if="error" role="alert" class="mt-4 text-red-300">{{ error }}</p>
  </details>
</template>
