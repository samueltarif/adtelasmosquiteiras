import { requireActiveAdmin } from '../../../../../utils/adminAuth'
import {
  ALLOWED_CLIENT_TIPOS,
  ALLOWED_OS_CATEGORIAS,
  normalizePhone,
  normalizeEmail,
  normalizeCpfCnpj,
  findDuplicateClients,
  getSupabaseHeaders
} from '../../../../../utils/crm'

export default defineEventHandler(async (event) => {
  const admin = await requireActiveAdmin(event)
  const config = useRuntimeConfig()
  const id = getRouterParam(event, 'id')
  const body = await readBody(event).catch(() => ({}))

  if (!id) {
    throw createError({ statusCode: 400, message: 'ID do lead é obrigatório.' })
  }

  if (!config.supabaseUrl || !config.supabaseServiceRoleKey) {
    throw createError({ statusCode: 500, message: 'Serviço de banco de dados indisponível.' })
  }

  // 1. Validações básicas do cliente
  const nome = typeof body.nome === 'string' ? body.nome.trim() : ''
  if (!nome || nome.length < 2) {
    throw createError({ statusCode: 400, message: 'O nome do cliente deve ter pelo menos 2 caracteres.' })
  }

  const telefoneRaw = typeof body.telefone_principal === 'string' ? body.telefone_principal : ''
  const telefonePrincipal = normalizePhone(telefoneRaw)
  if (!telefonePrincipal || telefonePrincipal.length < 10) {
    throw createError({ statusCode: 400, message: 'Informe um telefone válido com DDD (mínimo 10 dígitos).' })
  }

  const tipoCliente = ALLOWED_CLIENT_TIPOS.includes(body.tipo_cliente) ? body.tipo_cliente : 'pessoa_fisica'
  const email = body.email ? normalizeEmail(body.email) : null
  const cpfCnpj = body.cpf_cnpj ? normalizeCpfCnpj(body.cpf_cnpj) : null

  // 2. Server-side duplicate warning gate ANTES de chamar a RPC
  const confirmPossibleDuplicate = body.confirmPossibleDuplicate === true || body.confirmPossibleDuplicate === 'true'
  if (!confirmPossibleDuplicate) {
    const duplicates = await findDuplicateClients(
      { url: config.supabaseUrl, serviceRoleKey: config.supabaseServiceRoleKey },
      { telefone: telefonePrincipal, email, cpfCnpj }
    )

    if (duplicates.length > 0) {
      throw createError({
        statusCode: 409,
        statusMessage: 'POSSIBLE_DUPLICATE',
        data: {
          code: 'POSSIBLE_DUPLICATE',
          message: 'Pode ser que este cliente já esteja cadastrado no sistema.',
          duplicates
        }
      })
    }
  }

  // 3. Endereço opcional (somente com confirmação explícita do admin)
  let enderecoData: Record<string, any> | null = null
  if (body.criar_endereco === true && body.endereco_data && typeof body.endereco_data === 'object') {
    enderecoData = {
      rotulo: body.endereco_data.rotulo ? String(body.endereco_data.rotulo).trim() : 'Principal',
      tipo_imovel: body.endereco_data.tipo_imovel ? String(body.endereco_data.tipo_imovel).trim() : 'outro',
      cep: body.endereco_data.cep ? String(body.endereco_data.cep).trim() : null,
      logradouro: body.endereco_data.logradouro ? String(body.endereco_data.logradouro).trim() : null,
      numero: body.endereco_data.numero ? String(body.endereco_data.numero).trim() : null,
      complemento: body.endereco_data.complemento ? String(body.endereco_data.complemento).trim() : null,
      bairro: body.endereco_data.bairro ? String(body.endereco_data.bairro).trim() : null,
      cidade: body.endereco_data.cidade ? String(body.endereco_data.cidade).trim() : 'São Paulo',
      uf: body.endereco_data.uf ? String(body.endereco_data.uf).trim().toUpperCase() : 'SP'
    }
  }

  // 4. Criação da primeira Ordem de Serviço (opcional)
  const criarOs = Boolean(body.criar_os)
  let osData: Record<string, any> | null = null
  if (criarOs) {
    const categoriaOperacional = ALLOWED_OS_CATEGORIAS.includes(body.os_data?.categoria_operacional)
      ? body.os_data.categoria_operacional
      : 'outro'
    const descricao = body.os_data?.descricao ? String(body.os_data.descricao).trim() : 'Serviço Inicial'
    const valorOrcamento = body.os_data?.valor_orcamento != null ? parseFloat(body.os_data.valor_orcamento) : 0.00
    const dataPrevista = body.os_data?.data_prevista ? String(body.os_data.data_prevista).trim() : null

    osData = {
      categoria_operacional: categoriaOperacional,
      descricao,
      valor_orcamento: isNaN(valorOrcamento) ? 0.00 : valorOrcamento,
      data_prevista: dataPrevista || null
    }
  }

  // 5. Chamada à RPC convert_lead_to_client_atomic
  const headers = getSupabaseHeaders(config.supabaseServiceRoleKey)
  const rpcPayload = {
    p_lead_id: id,
    p_actor_id: admin.userId,
    p_tipo_cliente: tipoCliente,
    p_nome: nome,
    p_telefone_principal: telefonePrincipal,
    p_email: email,
    p_cpf_cnpj: cpfCnpj,
    p_endereco_data: enderecoData,
    p_criar_os: criarOs,
    p_os_data: osData
  }

  try {
    const rpcResult = await $fetch<any>(`${config.supabaseUrl}/rest/v1/rpc/convert_lead_to_client_atomic`, {
      method: 'POST',
      headers,
      body: rpcPayload
    })

    return {
      success: true,
      result: rpcResult
    }
  } catch (rpcErr: any) {
    console.error('[leads/convert] Erro na RPC de conversão:', rpcErr)
    const errMessage = rpcErr?.data?.message || rpcErr?.message || ''

    if (errMessage.includes('ERR_LEAD_ALREADY_CONVERTED')) {
      throw createError({ statusCode: 409, message: 'Este Lead já foi convertido em cliente.' })
    }
    if (errMessage.includes('ERR_LEAD_NOT_FOUND')) {
      throw createError({ statusCode: 404, message: 'Lead não encontrado no banco de dados.' })
    }
    if (errMessage.includes('ERR_UNAUTHORIZED_ADMIN_ACTOR')) {
      throw createError({ statusCode: 403, message: 'Sessão administrativa não autorizada.' })
    }
    if (errMessage.includes('ERR_INVALID_CLIENT_NAME')) {
      throw createError({ statusCode: 400, message: 'Nome do cliente inválido.' })
    }
    if (errMessage.includes('ERR_INVALID_PHONE_NUMBER')) {
      throw createError({ statusCode: 400, message: 'Telefone do cliente inválido.' })
    }
    if (errMessage.includes('ERR_OS_DATA_REQUIRED')) {
      throw createError({ statusCode: 400, message: 'Dados da Ordem de Serviço são obrigatórios quando a opção de criar OS está ativa.' })
    }

    throw createError({ statusCode: 500, message: 'Erro interno ao converter Lead em Cliente.' })
  }
})
