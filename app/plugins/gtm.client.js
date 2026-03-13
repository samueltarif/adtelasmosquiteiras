// Google Tag Manager Plugin com Cloudflare Worker Proxy
export default defineNuxtPlugin(() => {
  if (import.meta.client) {
    // Inicializar dataLayer
    window.dataLayer = window.dataLayer || [];
    
    // Configurar transport_url ANTES de carregar o GTM
    function gtag() {
      window.dataLayer.push(arguments);
    }
    window.gtag = gtag;

    // Adicionar script GTM ao head com caminho /metrics/
    const script = document.createElement('script');
    script.innerHTML = `(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
'/metrics/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
})(window,document,'script','dataLayer','GTM-KZTR2DHT');`;

    document.head.appendChild(script);

    // Configurar transport_url para forçar todas as requisições através do Worker
    gtag('config', 'GTM-KZTR2DHT', {
      'transport_url': 'https://www.adtelasmosquiteiras.com.br/metrics',
      'first_party_collection': true
    });

    console.log('✅ GTM carregado via /metrics/ (Cloudflare Worker)');
    console.log('✅ Transport URL configurada: https://www.adtelasmosquiteiras.com.br/metrics');
  }
})
