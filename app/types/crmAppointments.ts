/**
 * Tipos Canônicos para Agenda, Agendamentos e Equipe Operacional (CRM Fase 5.0)
 * Arquivo: app/types/crmAppointments.ts
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

export interface Appointment {
  id: string
  work_order_id: string
  client_id: string
  address_id: string | null
  staff_id: string | null
  tipo_agendamento: AppointmentType
  data_hora_inicio: string
  data_hora_fim: string
  status_agendamento: AppointmentStatus
  observacoes: string | null
  rescheduled_from_id: string | null
  motivo_reagendamento_cancelamento: string | null
  created_by: string | null
  created_at: string
  updated_at: string
}

export interface AppointmentClientSummary {
  id: string
  nome: string
  telefone_principal: string
  email: string | null
  tipo_cliente: string
}

export interface AppointmentAddressSummary {
  id: string
  rotulo: string
  logradouro: string | null
  numero: string | null
  complemento: string | null
  bairro: string | null
  cidade: string | null
  uf: string | null
}

export interface AppointmentWorkOrderSummary {
  id: string
  numero_os: string
  status_os: string
  valor_final: number
}

export interface AppointmentWithRelations extends Appointment {
  client?: AppointmentClientSummary | null
  work_order?: AppointmentWorkOrderSummary | null
  address?: AppointmentAddressSummary | null
  staff?: Pick<CrmStaff, 'id' | 'nome' | 'funcao' | 'telefone'> | null
  rescheduled_from?: Pick<Appointment, 'id' | 'data_hora_inicio' | 'data_hora_fim' | 'status_agendamento'> | null
  next_appointment?: Pick<Appointment, 'id' | 'data_hora_inicio' | 'data_hora_fim' | 'status_agendamento'> | null
}

export interface AppointmentCalendarFilters {
  start: string
  end: string
  staffId?: string
  status?: AppointmentStatus
  tipo?: AppointmentType
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
