<script setup lang="ts">
import { reviews, googleReviews, googleReviewsUrl } from '~/data/telas/reviews'
</script>
<template>
  <section id="depoimentos" class="td-section td-wrap"><div class="td-section-heading"><div><p class="td-eyebrow">O que nossos clientes dizem</p><h2>Quem já confiou, recomenda</h2></div><div class="td-rating"><a :href="googleReviewsUrl" target="_blank" rel="noopener noreferrer"><span aria-hidden="true">★★★★★</span> {{ googleReviews.rating }} de 5 · {{ googleReviews.count }} avaliações no Google ↗</a><small>Conferidas em {{ googleReviews.checkedAt }}. Avaliações da empresa.</small></div></div><div class="td-review-grid"><article v-for="review in reviews" :key="review.name"><span class="td-stars" aria-label="5 estrelas">★★★★★</span><blockquote>“{{ review.text }}”</blockquote><strong>{{ review.name }}</strong><a :href="googleReviewsUrl" target="_blank" rel="noopener noreferrer">Ver no Google ↗</a></article></div></section>
</template>
