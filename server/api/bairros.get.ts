import { defineEventHandler } from 'h3'
import { CIDADES_BAIRROS } from '../../app/data/bairros'

export default defineEventHandler(() => {
  return CIDADES_BAIRROS.map((cidade) => ({
    id: cidade.id,
    nome: cidade.nome,
    bairros: [...cidade.bairros]
      .sort((a, b) => a.localeCompare(b, 'pt-BR'))
      .map((nome, i) => ({ id: i, nome })),
  }))
})
