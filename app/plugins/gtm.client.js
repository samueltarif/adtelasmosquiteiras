// Google Tag Manager Plugin
export default defineNuxtPlugin(() => {
  if (process.client) {
    // Inicializar dataLayer
    window.dataLayer = window.dataLayer || [];

    // Adicionar script GTM ao head
    const script = document.createElement('script');
    script.innerHTML = `(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
'/metrics/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
})(window,document,'script','dataLayer','GTM-KZTR2DHT');`;

    document.head.appendChild(script);

    console.log('✅ Google Tag Manager carregado - GTM-KZTR2DHT');
  }
})
