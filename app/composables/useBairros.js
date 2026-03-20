import { ref, computed } from 'vue'
import { CIDADES_BAIRROS } from '#shared/bairros'

export const CIDADES = CIDADES_BAIRROS.map(({ id, nome }) => ({ id, nome }))

export function useBairros() {
  const cidadesComBairros = ref([])
  const loading = ref(false)
  const error = ref(null)
  const search = ref('')
  const cidadeSelecionada = ref(null)

  async function fetchBairros() {
    loading.value = true
    error.value = null
    try {
      const results = await $fetch('/api/bairros')
      cidadesComBairros.value = results
    } catch (e) {
      error.value = 'Não foi possível carregar os bairros. Tente novamente.'
    } finally {
      loading.value = false
    }
  }

  const cidadesFiltradas = computed(() => {
    const q = search.value.toLowerCase().trim()
    const base = cidadeSelecionada.value
      ? cidadesComBairros.value.filter((c) => c.id === cidadeSelecionada.value)
      : cidadesComBairros.value

    if (!q) return base

    return base
      .map((cidade) => ({
        ...cidade,
        bairros: cidade.bairros.filter((b) => b.nome.toLowerCase().includes(q)),
      }))
      .filter((c) => c.bairros.length > 0 || c.nome.toLowerCase().includes(q))
  })

  const totalBairros = computed(() =>
    cidadesComBairros.value.reduce((acc, c) => acc + c.bairros.length, 0)
  )

  return {
    cidadesComBairros,
    cidadesFiltradas,
    loading,
    error,
    search,
    cidadeSelecionada,
    totalBairros,
    fetchBairros,
    CIDADES,
  }
}
