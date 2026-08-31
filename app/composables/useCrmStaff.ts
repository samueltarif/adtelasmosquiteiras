/**
 * Composable de Gestão da Equipe Operacional CRM (Staff)
 * Arquivo: app/composables/useCrmStaff.ts
 *
 * Consome: GET/POST /api/admin/crm/staff e PATCH /api/admin/crm/staff/:id
 * APPLICATION_LOGIC_MAX_LINES <= 200
 */

import { ref } from 'vue'

export interface CrmStaffMember {
  id: string
  nome: string
  telefone?: string | null
  email?: string | null
  funcao: string
  is_active: boolean
  created_at?: string
  updated_at?: string
}

export function useCrmStaff() {
  const staffList = ref<CrmStaffMember[]>([])
  const isLoading = ref(false)
  const errorMessage = ref<string | null>(null)

  async function fetchStaff(filters: { isActive?: boolean | string, funcao?: string } = {}) {
    isLoading.value = true
    errorMessage.value = null
    try {
      const queryParams = new URLSearchParams()
      if (filters.isActive !== undefined && filters.isActive !== '') {
        queryParams.set('isActive', String(filters.isActive))
      }
      if (filters.funcao && filters.funcao.trim() !== '') {
        queryParams.set('funcao', filters.funcao.trim())
      }

      const qStr = queryParams.toString()
      const url = `/api/admin/crm/staff${qStr ? `?${qStr}` : ''}`
      const res = await $fetch<{ success: boolean, staff: CrmStaffMember[] }>(url)

      if (res?.success && Array.isArray(res.staff)) {
        staffList.value = res.staff
      } else {
        staffList.value = []
      }
      return staffList.value
    } catch (err: any) {
      console.error('[useCrmStaff] Falha ao carregar equipe')
      errorMessage.value = err?.data?.statusMessage || err?.data?.message || err?.message || 'Falha ao carregar lista de membros da equipe.'
      return []
    } finally {
      isLoading.value = false
    }
  }

  async function createStaff(payload: {
    nome: string
    telefone?: string | null
    email?: string | null
    funcao: string
  }) {
    isLoading.value = true
    errorMessage.value = null
    try {
      const res = await $fetch<{ success: boolean, staff: CrmStaffMember }>('/api/admin/crm/staff', {
        method: 'POST',
        body: payload
      })
      if (res?.success && res.staff) {
        staffList.value.push(res.staff)
        staffList.value.sort((a, b) => a.nome.localeCompare(b.nome))
        return { success: true, staff: res.staff }
      }
      return { success: false, error: 'Resposta inesperada do servidor.' }
    } catch (err: any) {
      console.error('[useCrmStaff] Falha ao cadastrar membro')
      const msg = err?.data?.statusMessage || err?.data?.message || err?.message || 'Falha ao cadastrar membro da equipe.'
      errorMessage.value = msg
      return { success: false, error: msg }
    } finally {
      isLoading.value = false
    }
  }

  async function updateStaff(id: string, payload: {
    nome?: string
    telefone?: string | null
    email?: string | null
    funcao?: string
    is_active?: boolean
  }) {
    isLoading.value = true
    errorMessage.value = null
    try {
      const res = await $fetch<{ success: boolean, staff: CrmStaffMember }>(`/api/admin/crm/staff/${id}`, {
        method: 'PATCH',
        body: payload
      })
      if (res?.success && res.staff) {
        const idx = staffList.value.findIndex(s => s.id === id)
        if (idx !== -1) {
          staffList.value[idx] = res.staff
        }
        return { success: true, staff: res.staff }
      }
      return { success: false, error: 'Resposta inesperada do servidor.' }
    } catch (err: any) {
      console.error('[useCrmStaff] Falha ao atualizar membro')
      const msg = err?.data?.statusMessage || err?.data?.message || err?.message || 'Falha ao atualizar dados do membro.'
      errorMessage.value = msg
      return { success: false, error: msg }
    } finally {
      isLoading.value = false
    }
  }

  async function deactivateStaff(id: string) {
    return await updateStaff(id, { is_active: false })
  }

  async function activateStaff(id: string) {
    return await updateStaff(id, { is_active: true })
  }

  return {
    staffList,
    isLoading,
    errorMessage,
    fetchStaff,
    createStaff,
    updateStaff,
    deactivateStaff,
    activateStaff
  }
}
