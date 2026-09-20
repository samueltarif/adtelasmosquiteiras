/**
 * Admin analytics data fetching composable with loading/error/empty states
 * Arquivo: app/composables/useAdminAnalytics.ts
 */

import type { GoogleAdsOverviewResponse } from '../types/adminGoogleAds'

export function useAdminAnalytics() {
  const { queryString } = useAdminDateFilter()

  const overview = ref<any>(null)
  const acquisition = ref<any>(null)
  const pages = ref<any>(null)
  const services = ref<any>(null)
  const funnel = ref<any>(null)
  const recentActivity = ref<any>(null)
  const googleAds = ref<GoogleAdsOverviewResponse | null>(null)

  const isLoadingOverview = ref(false)
  const isLoadingAcquisition = ref(false)
  const isLoadingPages = ref(false)
  const isLoadingServices = ref(false)
  const isLoadingFunnel = ref(false)
  const isLoadingActivity = ref(false)
  const isLoadingGoogleAds = ref(false)

  const errorOverview = ref<string | null>(null)
  const errorAcquisition = ref<string | null>(null)
  const errorPages = ref<string | null>(null)
  const errorServices = ref<string | null>(null)
  const errorFunnel = ref<string | null>(null)
  const errorActivity = ref<string | null>(null)
  const errorGoogleAds = ref<string | null>(null)

  async function fetchOverview() {
    isLoadingOverview.value = true
    errorOverview.value = null
    try {
      const data = await $fetch<any>(`/api/admin/analytics/overview?${queryString.value}`)
      if (data?.success) {
        overview.value = data
      } else {
        errorOverview.value = data?.error || 'Erro desconhecido'
      }
    } catch (e: any) {
      errorOverview.value = e?.message || 'Erro de conexão'
    } finally {
      isLoadingOverview.value = false
    }
  }

  async function fetchAcquisition() {
    isLoadingAcquisition.value = true
    errorAcquisition.value = null
    try {
      const data = await $fetch<any>(`/api/admin/analytics/acquisition?${queryString.value}`)
      if (data?.success) {
        acquisition.value = data
      } else {
        errorAcquisition.value = data?.error || 'Erro desconhecido'
      }
    } catch (e: any) {
      errorAcquisition.value = e?.message || 'Erro de conexão'
    } finally {
      isLoadingAcquisition.value = false
    }
  }

  async function fetchPages() {
    isLoadingPages.value = true
    errorPages.value = null
    try {
      const data = await $fetch<any>(`/api/admin/analytics/pages?${queryString.value}`)
      if (data?.success) {
        pages.value = data
      } else {
        errorPages.value = data?.error || 'Erro desconhecido'
      }
    } catch (e: any) {
      errorPages.value = e?.message || 'Erro de conexão'
    } finally {
      isLoadingPages.value = false
    }
  }

  async function fetchServices() {
    isLoadingServices.value = true
    errorServices.value = null
    try {
      const data = await $fetch<any>(`/api/admin/analytics/services?${queryString.value}`)
      if (data?.success) {
        services.value = data
      } else {
        errorServices.value = data?.error || 'Erro desconhecido'
      }
    } catch (e: any) {
      errorServices.value = e?.message || 'Erro de conexão'
    } finally {
      isLoadingServices.value = false
    }
  }

  async function fetchFunnel() {
    isLoadingFunnel.value = true
    errorFunnel.value = null
    try {
      const data = await $fetch<any>(`/api/admin/analytics/funnel?${queryString.value}`)
      if (data?.success) {
        funnel.value = data
      } else {
        errorFunnel.value = data?.error || 'Erro desconhecido'
      }
    } catch (e: any) {
      errorFunnel.value = e?.message || 'Erro de conexão'
    } finally {
      isLoadingFunnel.value = false
    }
  }

  async function fetchRecentActivity() {
    isLoadingActivity.value = true
    errorActivity.value = null
    try {
      const data = await $fetch<any>('/api/admin/recent-activity')
      if (data?.success) {
        recentActivity.value = data
      } else {
        errorActivity.value = 'Erro ao carregar atividade'
      }
    } catch (e: any) {
      errorActivity.value = e?.message || 'Erro de conexão'
    } finally {
      isLoadingActivity.value = false
    }
  }

  async function fetchGoogleAds() {
    isLoadingGoogleAds.value = true
    errorGoogleAds.value = null
    try {
      const data = await $fetch<GoogleAdsOverviewResponse>(`/api/admin/analytics/google-ads/overview?${queryString.value}`)
      if (data?.success) {
        googleAds.value = data
      } else {
        errorGoogleAds.value = (data as any)?.error || 'Erro ao carregar dados do Google Ads'
      }
    } catch (e: any) {
      errorGoogleAds.value = e?.message || 'Erro de conexão'
    } finally {
      isLoadingGoogleAds.value = false
    }
  }

  async function fetchAll() {
    await Promise.all([
      fetchOverview(),
      fetchAcquisition(),
      fetchPages(),
      fetchServices(),
      fetchFunnel(),
      fetchRecentActivity(),
      fetchGoogleAds()
    ])
  }

  // Re-fetch on date change
  watch(queryString, () => {
    fetchAll()
  })

  return {
    overview,
    acquisition,
    pages,
    services,
    funnel,
    recentActivity,
    googleAds,
    isLoadingOverview,
    isLoadingAcquisition,
    isLoadingPages,
    isLoadingServices,
    isLoadingFunnel,
    isLoadingActivity,
    isLoadingGoogleAds,
    errorOverview,
    errorAcquisition,
    errorPages,
    errorServices,
    errorFunnel,
    errorActivity,
    errorGoogleAds,
    fetchOverview,
    fetchAcquisition,
    fetchPages,
    fetchServices,
    fetchFunnel,
    fetchRecentActivity,
    fetchGoogleAds,
    fetchAll
  }
}
