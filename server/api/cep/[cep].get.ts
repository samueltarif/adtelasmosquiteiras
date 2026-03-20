import { defineEventHandler, getRouterParam, createError } from 'h3'

// IBGE codes for the 19 cities we serve
const CIDADES_ATENDIDAS: Record<string, string> = {
  '3550308': 'São Paulo',
  '3518800': 'Guarulhos',
  '3534401': 'Osasco',
  '3548708': 'São Bernardo do Campo',
  '3505708': 'Barueri',
  '3525904': 'Jundiaí',
  '3530607': 'Mogi das Cruzes',
  '3552809': 'Taboão da Serra',
  '3552502': 'Suzano',
  '3522505': 'Itapevi',
  '3515103': 'Embu-Guaçu',
  '3552205': 'Sorocaba',
  '3509205': 'Cajamar',
  '3528502': 'Mairiporã',
  '3547304': 'Santana de Parnaíba',
  '3513009': 'Cotia',
  '3522208': 'Itapecerica da Serra',
  '3515004': 'Embu das Artes',
  '3550605': 'São Roque',
}

interface ViaCepResponse {
  cep: string
  logradouro: string
  complemento: string
  bairro: string
  localidade: string
  uf: string
  ibge: string
  erro?: boolean
}

export default defineEventHandler(async (event) => {
  const raw = getRouterParam(event, 'cep') ?? ''
  const cep = raw.replace(/\D/g, '')

  if (cep.length !== 8) {
    throw createError({ statusCode: 400, message: 'CEP inválido. Informe 8 dígitos.' })
  }

  const data = await $fetch<ViaCepResponse>(
    `https://viacep.com.br/ws/${cep}/json/`,
    { headers: { 'User-Agent': 'ADTelasRedes/1.0' } }
  ).catch(() => {
    throw createError({ statusCode: 502, message: 'Serviço de CEP indisponível. Tente novamente.' })
  })

  if (data.erro) {
    throw createError({ statusCode: 404, message: 'CEP não encontrado.' })
  }

  const cidadeAtendida = CIDADES_ATENDIDAS[data.ibge] ?? null

  return {
    cep: data.cep,
    logradouro: data.logradouro,
    bairro: data.bairro,
    cidade: data.localidade,
    uf: data.uf,
    ibge: data.ibge,
    atendido: cidadeAtendida !== null,
    cidadeAtendida,
  }
})
