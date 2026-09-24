import { buildFinanceReminder } from './financeCore.mjs'

// Nunca repete automaticamente um envio SMTP de resultado incerto.
export async function runFinanceReminderBatch({ claim, send, finish, runId }) {
  const { entries, today } = await claim(runId)
  if (!entries.length) return { sent: 0 }
  try {
    await send(entries[0].recipient, buildFinanceReminder(entries, today))
  } catch {
    await finish(runId, 'uncertain', 'Não foi possível confirmar o envio. Confira a caixa de entrada antes de tentar reenviar.')
    throw new Error('Não foi possível confirmar o envio dos avisos. Consulte o histórico.')
  }
  // Se esta gravação falhar, o registro permanece reservado: impede uma duplicação após SMTP aceito.
  await finish(runId, 'sent', null)
  return { sent: entries.length }
}
