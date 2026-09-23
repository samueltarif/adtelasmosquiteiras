# Reformulação de /servicos/telas

Referências: imagens mobile e desktop enviadas pelo usuário em 22/09/2026. A primeira orienta o mobile claro; a segunda, o desktop com abertura escura.

Imagem de abertura: ilustração gerada com a ferramenta nativa imagegen, sem representar uma instalação documentada da empresa. Arquivos JPEG responsivos em public/images/telas-instalacao-{640,1440}.jpg (43 KB / 166 KB). Fotos dos modelos já pertenciam ao projeto.

Prompt usado: Create a photorealistic commercial website hero photograph, wide landscape 1536x1024 composition. Inside a contemporary São Paulo apartment, professional male installer seen from behind in a plain navy polo, carefully fitting a fine insect mosquito mesh screen into a large aluminum window. Worker and window on right two thirds, left third softly lit neutral interior wall with ample blank space suitable for dark gradient overlay and live HTML heading. Beautiful natural daylight, distant Brazilian city apartment buildings and foliage outside, fine realistic mesh visible, authentic hands, tasteful editorial architectural photography. No text, no lettering, no logos, no watermarks. This is an illustrative website visual, not evidence of a real installation. Make the visual close to the clean service-business reference aesthetic: crisp aluminum, dark navy clothing, subtle green trees and warm daylight.

Depoimentos: Valter Jose, Giovana Naomi e Edna Oliveira, transcritos do perfil público https://share.google/FZ810y9akHJ1iFS9q em 22/09/2026. Perfil AD TELAS MOSQUITEIRAS, kgmid /g/11rnbd2wmb, nota 5,0 e 49 avaliações na conferência. A página informa a data e direciona para o perfil Google. Seleção estática, sem sincronização automática. Substitui os trechos do acervo local usados inicialmente.

Validação local: scripts/test-telas-redesign.mjs. As APIs são simuladas para não enviar leads ou analytics reais. A landing de anúncios, o componente de formulário e os plugins de tracking não são alterados.

Resultados: build concluído; 360, 390, 412, 430 e 1440 px aprovados; teste de navegação existente aprovado. Typecheck geral retorna erros em módulos existentes. Lint não configurado no package.json. O teste PPC antigo espera gtag conversion direto, enquanto formConversion.js implementa somente lead_form_success via GTM; essa expectativa não foi alterada nesta tarefa.
