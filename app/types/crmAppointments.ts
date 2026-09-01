/**
 * Tipos Canônicos para Agenda, Agendamentos e Equipe Operacional (CRM Fase 5.0)
 * Arquivo: app/types/crmAppointments.ts
 *
 * CALENDAR_SUMMARY_DETAIL_TYPE_SEPARATION=STRICT
 * LOC <= 200
 */

export type AppointmentType =
  | 'visita_tecnica'
  | 'medicao'
  | 'instalacao'
  | 'manutencao'
  | 'garantia'

export type AppointmentStatus =
  | 'agendado'
  | 'confirmado'
  | 'em_deslocamento'
  | 'realizado'
  | 'reagendado'
  | 'cancelado'

export type CrmStaffRole =
  | 'instalador'
  | 'vistoriador'
  | 'atendente'
  | 'gestor'

export interface CrmStaff {
  id: string
  nome: string
  telefone: string | null
  email: string | null
  funcao: CrmStaffRole
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface CrmAppointmentBase {
  id: string
  work_order_id: string
  client_id: string
  address_id: string | null
  staff_id: string | null
  tipo_agendamento: AppointmentType
  data_hora_inicio: string
  data_hora_fim: string
  status_agendamento: AppointmentStatus
  created_at: string
  updated_at: string
}

export interface AppointmentClientSummary {
  id: string
  nome: string
  telefone_principal?: string | null
  email?: string | null
  tipo_cliente?: string | null
}

export interface AppointmentAddressSummary {
  id: string
  rotulo?: string | null
  bairro?: string | null
  cidade?: string | null
  logradouro?: string | null
  numero?: string | null
  complemento?: string | null
  uf?: string | null
}

export interface AppointmentWorkOrderSummary {
  id: string
  numero_os: string
  status_os: string
  valor_final?: number | null
  is_archived?: boolean
}

/**
 * CrmAppointmentSummary — Projeção mínima para calendário e listagens (APPOINTMENT_CALENDAR_SELECT)
 * PII_MINIMIZED=YES, CONTACT_PII_EXCLUDED=YES, SENSITIVE_OPERATIONAL_TEXT_EXCLUDED=YES
 * Contém client.nome por necessidade operacional, mas omite telefones, emails, observações e motivos.
 */
export interface CrmAppointmentSummary extends CrmAppointmentBase {
  client?: { id: string; nome: string; tipo_cliente?: string | null } | null
  work_order?: { id: string; numero_os: string; status_os: string } | null
  address?: { id: string; rotulo?: string | null; bairro?: string | null; cidade?: string | null } | null
  staff?: { id: string; nome: string; funcao: CrmStaffRole } | null
}

export type AppointmentCalendarItem = CrmAppointmentSummary

/**
 * CrmAppointmentDetail — Projeção completa de detalhes (APPOINTMENT_DETAIL_SELECT)
 * Apenas acessível mediante autorização e chamada explícita por ID.
 */
export interface CrmAppointmentDetail extends CrmAppointmentBase {
  observacoes: string | null
  rescheduled_from_id: string | null
  motivo_reagendamento_cancelamento: string | null
  created_by: string | null
  client?: AppointmentClientSummary | null
  work_order?: AppointmentWorkOrderSummary | null
  address?: AppointmentAddressSummary | null
  staff?: Pick<CrmStaff, 'id' | 'nome' | 'funcao' | 'telefone'> | null
  rescheduled_from?: Pick<CrmAppointmentBase, 'id' | 'data_hora_inicio' | 'data_hora_fim' | 'status_agendamento'> | null
  next_appointment?: Pick<CrmAppointmentBase, 'id' | 'data_hora_inicio' | 'data_hora_fim' | 'status_agendamento'> | null
}

export type Appointment = CrmAppointmentDetail
export type AppointmentWithRelations = CrmAppointmentDetail

export interface AppointmentCalendarFilters {
  start: string
  end: string
  staffId?: string
  status?: AppointmentStatus | string
  tipo?: AppointmentType | string
}

export interface AppointmentSearchInput {
  q?: string
  limit?: number
  offset?: number
  status?: AppointmentStatus
  tipo?: AppointmentType
  staffId?: string
  clientId?: string
}

export interface CreateAppointmentInput {
  work_order_id: string
  address_id?: string | null
  staff_id?: string | null
  tipo_agendamento: AppointmentType
  data_hora_inicio: string
  data_hora_fim: string
  observacoes?: string | null
}

export interface UpdateAppointmentInput {
  staff_id?: string | null
  address_id?: string | null
  observacoes?: string | null
  expected_appointment_updated_at: string
  update_staff?: boolean
  update_address?: boolean
  update_observacoes?: boolean
}

export interface RescheduleAppointmentInput {
  new_data_hora_inicio: string
  new_data_hora_fim: string
  motivo: string
  expected_appointment_updated_at: string
}

export interface CancelAppointmentInput {
  motivo: string
  expected_appointment_updated_at: string
}

export interface UpdateAppointmentStatusInput {
  status: AppointmentStatus
  expected_appointment_updated_at: string
}

export interface CreateStaffInput {
  nome: string
  telefone?: string | null
  email?: string | null
  funcao?: CrmStaffRole
}

export interface UpdateStaffInput {
  nome?: string
  telefone?: string | null
  email?: string | null
  funcao?: CrmStaffRole
  is_active?: boolean
}
