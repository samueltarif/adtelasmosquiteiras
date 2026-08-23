export const REDIRECT_MAP: Record<string, string> = {
  // TECHNICAL LEGACY REDIRECT (1)
  '/home': '/',

  // SEO MIGRATION REDIRECTS (45)
  '/bairros': '/areas-atendidas',
  '/servicos/rede-protecao': '/servicos/redes',
  '/servicos/tela-mosquiteira': '/servicos/telas',
  '/servicos/redes/residencial': '/servicos/redes',
  '/servicos/redes/pets': '/servicos/redes/gatos-e-pets',
  '/servicos/redes/comercial': '/servicos/redes',
  '/servicos/telas/residencial': '/servicos/telas',
  '/servicos/telas/especiais': '/servicos/telas',
  '/servicos/telas/pet': '/servicos/telas/pet-screen',
  '/servicos/telas/comercial': '/servicos/telas',
  '/servicos/redes/residencial/janelas': '/servicos/redes/janelas',
  '/servicos/redes/residencial/sacadas': '/servicos/redes/sacadas-e-varandas',
  '/servicos/redes/residencial/varandas': '/servicos/redes/sacadas-e-varandas',
  '/servicos/redes/residencial/apartamentos': '/servicos/redes',
  '/servicos/redes/residencial/portas': '/servicos/redes',
  '/servicos/redes/residencial/escadas': '/servicos/redes/escadas-e-mezaninos',
  '/servicos/redes/residencial/basculantes': '/servicos/redes/janelas',
  '/servicos/redes/pets/criancas': '/servicos/redes/criancas',
  '/servicos/redes/pets/gatos': '/servicos/redes/gatos-e-pets',
  '/servicos/redes/pets/cachorros': '/servicos/redes/gatos-e-pets',
  '/servicos/redes/pets/animais': '/servicos/redes/gatos-e-pets',
  '/servicos/redes/pets/idosos': '/servicos/redes',
  '/servicos/redes/comercial/piscinas': '/servicos/redes',
  '/servicos/redes/comercial/telhados': '/servicos/redes',
  '/servicos/redes/comercial/portoes': '/servicos/redes',
  '/servicos/redes/comercial/muros': '/servicos/redes',
  '/servicos/redes/comercial/coberturas': '/servicos/redes',
  '/servicos/telas/residencial/janelas': '/servicos/telas/janelas',
  '/servicos/telas/residencial/portas': '/servicos/telas/portas',
  '/servicos/telas/residencial/varandas': '/servicos/telas/sacadas-e-varandas',
  '/servicos/telas/residencial/sacadas': '/servicos/telas/sacadas-e-varandas',
  '/servicos/telas/residencial/apartamentos': '/servicos/telas',
  '/servicos/telas/residencial/banheiro': '/servicos/telas/janelas',
  '/servicos/telas/especiais/correr': '/servicos/telas/janelas',
  '/servicos/telas/especiais/pivotante': '/servicos/telas',
  '/servicos/telas/especiais/removivel': '/servicos/telas/removivel',
  '/servicos/telas/especiais/basculante': '/servicos/telas/janelas',
  '/servicos/telas/especiais/aluminio': '/servicos/telas',
  '/servicos/telas/especiais/acoinox': '/servicos/telas',
  '/servicos/telas/pet/pets': '/servicos/telas/pet-screen',
  '/servicos/telas/pet/pernilongos': '/servicos/telas',
  '/servicos/telas/comercial/fachadas': '/servicos/telas',
  '/servicos/telas/comercial/coberturas': '/servicos/telas',
  '/servicos/telas/comercial/restaurantes': '/servicos/telas/restaurantes',
  '/servicos/telas/comercial/industrias': '/servicos/telas'
}

export const getNitroRedirectRules = () => {
  const rules: Record<string, { redirect: { to: string; statusCode: number } }> = {}
  for (const [source, target] of Object.entries(REDIRECT_MAP)) {
    rules[source] = { redirect: { to: target, statusCode: 301 } }
  }
  return rules
}
