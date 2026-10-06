import { defineEventHandler, getRouterParam, createError } from 'h3'

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

  const atendido = data.uf === 'SP'
  const cidadeAtendida = atendido ? data.localidade : null

  return {
    cep: data.cep,
    logradouro: data.logradouro,
    bairro: data.bairro,
    cidade: data.localidade,
    uf: data.uf,
    ibge: data.ibge,
    atendido,
    cidadeAtendida,
  }
})
