<script setup lang="ts">
import { ref, watch, computed, toRef } from 'vue'
import type { CrmStaffMember } from '~/composables/useCrmStaff'
import { useModalA11y } from '~/composables/useModalA11y'

const props = defineProps<{
  isOpen: boolean
  member: CrmStaffMember | null
}>()

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'statusChanged', member: CrmStaffMember): void
}>()

useModalA11y(toRef(props, 'isOpen'), () => emit('close'))

const isDeactivating = computed(() => Boolean(props.member?.is_active))
const isSubmitting = ref(false)
const errorMessage = ref<string | null>(null)

watch(() => props.isOpen, (open) => {
  if (open) {
    errorMessage.value = null
  }
})

async function handleConfirm() {
  if (!props.member) return

  isSubmitting.value = true
  errorMessage.value = null

  try {
    const nextActive = !props.member.is_active
    const res = await $fetch<any>(`/api/admin/crm/staff/${props.member.id}`, {
      method: 'PATCH',
      body: { is_active: nextActive }
    })

    if (res?.success && res.staff) {
      emit('statusChanged', res.staff)
      emit('close')
    }
  } catch (err: any) {
    if (err?.statusCode === 409 && (err?.data?.statusMessage?.includes('ERR_STAFF_HAS_ACTIVE_APPOINTMENTS') || err?.data?.error?.code === 'ERR_STAFF_HAS_ACTIVE_APPOINTMENTS')) {
      errorMessage.value = 'Não é possível desativar este membro da equipe pois ele possui agendamentos ativos na Agenda. Reatribua ou conclua os compromissos antes de desativar.'
    } else {
      errorMessage.value = err?.data?.statusMessage || err?.data?.message || err?.message || 'Falha ao alterar status do membro.'
    }
  } finally {
    isSubmitting.value = false
  }
}
</script>

<template>
  <div v-if="isOpen" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
    <div
      class="w-full max-w-md rounded-2xl border border-white/10 bg-slate-900 shadow-2xl p-6 space-y-5"
      role="alertdialog"
      aria-modal="true"
      aria-labelledby="staff-deactivate-title"
    >
      <div class="flex items-center gap-3 border-b border-white/10 pb-4">
        <div
          class="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
          :class="isDeactivating ? 'bg-amber-500/20 text-amber-400' : 'bg-emerald-500/20 text-emerald-400'"
        >
          <Icon :name="isDeactivating ? 'lucide:user-x' : 'lucide:user-check'" class="w-5 h-5" />
        </div>
        <div>
          <h3 id="staff-deactivate-title" class="text-base font-bold text-white">
            {{ isDeactivating ? 'Desativar Membro da Equipe' : 'Ativar Membro da Equipe' }}
          </h3>
          <p class="text-xs text-slate-400">{{ member?.nome }} ({{ member?.funcao }})</p>
        </div>
      </div>

      <div v-if="errorMessage" class="rounded-xl border border-red-500/20 bg-red-500/10 p-3 text-xs text-red-400">
        {{ errorMessage }}
      </div>

      <div class="space-y-4">
        <p class="text-xs text-slate-300 leading-relaxed">
          <span v-if="isDeactivating">
            Ao desativar este membro, ele não poderá ser atribuído a novos agendamentos na Agenda. O histórico de compromissos anteriores será preservado.
          </span>
          <span v-else>
            Ao ativar este membro, ele voltará a ficar disponível para atribuição de compromissos e visitas na Agenda.
          </span>
        </p>

        <div class="flex items-center justify-end gap-3 pt-4 border-t border-white/10">
          <button
            type="button"
            @click="emit('close')"
            class="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-semibold transition-all min-h-[44px] cursor-pointer"
          >
            Cancelar
          </button>

          <button
            type="button"
            @click="handleConfirm"
            :disabled="isSubmitting"
            class="px-5 py-2.5 rounded-xl text-white text-xs font-semibold shadow-lg transition-all flex items-center gap-2 min-h-[44px] cursor-pointer"
            :class="isDeactivating ? 'bg-amber-600 hover:bg-amber-500' : 'bg-emerald-600 hover:bg-emerald-500'"
          >
            <Icon v-if="isSubmitting" name="lucide:loader-2" class="w-4 h-4 animate-spin" />
            <span>{{ isSubmitting ? 'Atualizando...' : (isDeactivating ? 'Confirmar Desativação' : 'Confirmar Ativação') }}</span>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
