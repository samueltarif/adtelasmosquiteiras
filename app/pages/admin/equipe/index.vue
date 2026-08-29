<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import StaffHeader from '~/components/admin/staff/StaffHeader.vue'
import StaffListTable from '~/components/admin/staff/StaffListTable.vue'
import StaffListCards from '~/components/admin/staff/StaffListCards.vue'
import StaffFormModal from '~/components/admin/staff/StaffFormModal.vue'
import StaffDeactivateDialog from '~/components/admin/staff/StaffDeactivateDialog.vue'
import { useCrmStaff, type CrmStaffMember } from '~/composables/useCrmStaff'

definePageMeta({
  layout: 'admin'
})

const selectedFuncao = ref('')
const selectedStatus = ref('')

const isFormModalOpen = ref(false)
const isDeactivateDialogOpen = ref(false)
const selectedMember = ref<CrmStaffMember | null>(null)

const {
  staffList,
  isLoading,
  errorMessage,
  fetchStaff
} = useCrmStaff()

onMounted(() => {
  loadStaffData()
})

watch([selectedFuncao, selectedStatus], () => {
  loadStaffData()
})

async function loadStaffData() {
  await fetchStaff({
    funcao: selectedFuncao.value || undefined,
    isActive: selectedStatus.value !== '' ? selectedStatus.value : undefined
  })
}

function handleOpenCreate() {
  selectedMember.value = null
  isFormModalOpen.value = true
}

function handleOpenEdit(member: CrmStaffMember) {
  selectedMember.value = member
  isFormModalOpen.value = true
}

function handleOpenToggleStatus(member: CrmStaffMember) {
  selectedMember.value = member
  isDeactivateDialogOpen.value = true
}

function handleMemberSaved() {
  loadStaffData()
}

function handleStatusChanged() {
  loadStaffData()
}
</script>

<template>
  <div class="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
    <!-- Header e Métricas da Equipe -->
    <StaffHeader
      :staff-list="staffList"
      :selected-funcao="selectedFuncao"
      :selected-status="selectedStatus"
      @update:selected-funcao="selectedFuncao = $event"
      @update:selected-status="selectedStatus = $event"
      @open-create-modal="handleOpenCreate"
    />

    <!-- Feedback de Erro Geral -->
    <div v-if="errorMessage" class="rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-xs text-red-400">
      {{ errorMessage }}
    </div>

    <!-- Tabela Desktop / Cards Mobile -->
    <div>
      <div class="hidden md:block">
        <StaffListTable
          :staff-list="staffList"
          :is-loading="isLoading"
          @edit="handleOpenEdit"
          @toggle-status="handleOpenToggleStatus"
        />
      </div>

      <div class="block md:hidden">
        <StaffListCards
          :staff-list="staffList"
          :is-loading="isLoading"
          @edit="handleOpenEdit"
          @toggle-status="handleOpenToggleStatus"
        />
      </div>
    </div>

    <!-- Modais de Cadastro, Edição e Desativação -->
    <StaffFormModal
      :is-open="isFormModalOpen"
      :member="selectedMember"
      @close="isFormModalOpen = false"
      @saved="handleMemberSaved"
    />

    <StaffDeactivateDialog
      :is-open="isDeactivateDialogOpen"
      :member="selectedMember"
      @close="isDeactivateDialogOpen = false"
      @status-changed="handleStatusChanged"
    />
  </div>
</template>
