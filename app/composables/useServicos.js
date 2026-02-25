// ============================================
// COMPOSABLE: useServicos
// Sistema completo: 35+ serviços (17 Redes + 18 Telas)
// Estrutura: 2 Famílias → 4 Categorias cada → Serviços específicos
// ============================================

export const useServicos = () => {
  // ============================================
  // CONFIGURAÇÕES GLOBAIS
  // ============================================
  const WHATSAPP_NUMBER = '5511983586611'
  const COMPANY_NAME = 'AD Telas e Redes'
  const GOOGLE_REVIEWS_URL = 'https://www.google.com/search?sca_esv=59de4d94fc229621&sxsrf=ADLYWIIjEuoUVhAIFwXy5vUQP17RrHg2ig:1729605268236&kgmid=/g/11rnbd2wmb&q=AD+TELAS+MOSQUITEIRAS&shndl=30&source=sh/x/loc/uni/m1/1&kgs=5e4e7713d87c37c6&zx=1768571227913&no_sw_cr=1#lrd=0x94ce595a4d5fb92b:0xe81c9935ae058bde,1,,,,'
  
  // ============================================
  // ESTRUTURA: 2 FAMÍLIAS → 4 CATEGORIAS → 35+ SERVIÇOS
  // ============================================
  const familias = {
    // ==========================================
    // FAMÍLIA 1: REDES DE PROTEÇÃO (17 serviços)
    // ==========================================
    redes: {
      nome: 'Redes de Proteção',
      slug: 'redes',
      icon: '🛡️',
      descricao: 'Proteção certificada contra quedas para crianças, pets e adultos',
      cor: '#22345F',
      imagem: '/images/familia.png',
      
      categorias: {
        // Categoria 1: Residencial (7 serviços)
        residencial: {
          slug: 'residencial',
          titulo: 'Residencial',
          emoji: '🏠',
          descricao: 'Janelas, portas, sacadas e varandas',
          
          servicos: {
            janelas: {
              slug: 'janelas',
              titulo: 'Redes para Janelas',
              descricaoCurta: 'Proteção invisível para todas as janelas',
              destaque: 'Mais vendido',
              imagem: '/images/Redes_para_Janelas.png',
              imagemEspecificacoes: '/images/Redes_para_Janelas_especificações.png',
              keywords: ['janela', 'apartamento', 'casa', 'proteção janela']
            },
            portas: {
              slug: 'portas',
              titulo: 'Redes para Portas',
              descricaoCurta: 'Segurança sem bloquear a ventilação',
              destaque: 'Ventilação total',
              imagem: '/images/Redes_para_Portas.png',
              imagemEspecificacoes: '/images/Redes_para_Portas_especificações.jpeg',
              keywords: ['porta', 'porta balcão', 'entrada']
            },
            sacadas: {
              slug: 'sacadas',
              titulo: 'Redes para Sacadas',
              descricaoCurta: 'Aproveite sua sacada com segurança',
              destaque: 'Resiste 500kg',
              imagem: '/images/Redes_para_Sacadas.jpg',
              imagemEspecificacoes: '/images/Redes_para_Sacadas_especificações.jpg',
              keywords: ['sacada', 'varanda', 'terraço']
            },
            varandas: {
              slug: 'varandas',
              titulo: 'Redes para Varandas',
              descricaoCurta: 'Proteção total para varandas',
              destaque: 'Instalação 48h',
              imagem: '/images/familia.png',
              keywords: ['varanda', 'sacada', 'área externa']
            },
            apartamentos: {
              slug: 'apartamentos',
              titulo: 'Redes para Apartamentos',
              descricaoCurta: 'Solução completa para seu apartamento',
              destaque: 'Pacote completo',
              imagem: '/images/familia.png',
              keywords: ['apartamento', 'condomínio', 'prédio']
            },
            escadas: {
              slug: 'escadas',
              titulo: 'Redes para Escadas',
              descricaoCurta: 'Segurança em escadas e mezaninos',
              destaque: 'Sob medida',
              imagem: '/images/familia.png',
              keywords: ['escada', 'mezanino', 'degrau']
            },
            basculantes: {
              slug: 'basculantes',
              titulo: 'Redes para Basculantes',
              descricaoCurta: 'Proteção para janelas basculantes',
              destaque: 'Fácil abertura',
              imagem: '/images/familia.png',
              keywords: ['basculante', 'janela basculante']
            }
          }
        },
        
        // Categoria 2: Pets & Crianças (5 serviços)
        pets: {
          slug: 'pets',
          titulo: 'Pets & Crianças',
          emoji: '🐶',
          descricao: 'Segurança para quem você ama',
          
          servicos: {
            criancas: {
              slug: 'criancas',
              titulo: 'Redes para Crianças',
              descricaoCurta: 'Máxima segurança para os pequenos',
              destaque: 'Certificado INMETRO',
              imagem: '/images/Redes_para_Crianças.png',
              imagemEspecificacoes: '/images/Redes_para_Crianças_especificações.png',
              keywords: ['criança', 'bebê', 'infantil']
            },
            gatos: {
              slug: 'gatos',
              titulo: 'Redes para Gatos',
              descricaoCurta: 'Impeça fugas e quedas de gatos',
              destaque: 'Malha reforçada',
              imagem: '/images/gato.png',
              imagemEspecificacoes: '/images/Redes_para_Gatos_especificaçoes.png',
              keywords: ['gato', 'felino', 'pet']
            },
            cachorros: {
              slug: 'cachorros',
              titulo: 'Redes para Cachorros',
              descricaoCurta: 'Proteção para cães de todos os portes',
              destaque: 'Extra resistente',
              imagem: '/images/Redes_para_Cachorros.png',
              imagemEspecificacoes: '/images/Redes_para_Cachorros_especificações.png',
              keywords: ['cachorro', 'cão', 'pet']
            },
            animais: {
              slug: 'animais',
              titulo: 'Redes para Animais',
              descricaoCurta: 'Proteção para todos os tipos de pets',
              destaque: 'Versátil',
              imagem: '/images/Redes_para_Animais.png',
              imagemEspecificacoes: '/images/Redes_para_Animais_especificações.png',
              keywords: ['animal', 'pet', 'bicho']
            },
            idosos: {
              slug: 'idosos',
              titulo: 'Redes para Idosos',
              descricaoCurta: 'Segurança para a terceira idade',
              destaque: 'Cuidado especial',
              imagem: '/images/Redes_para_Idosos.png',
              imagemEspecificacoes: '/images/Redes_para_Idosos_especificações.png',
              keywords: ['idoso', 'terceira idade', 'segurança']
            }
          }
        },

        
        // Categoria 3: Comercial (5 serviços)
        comercial: {
          slug: 'comercial',
          titulo: 'Comercial',
          emoji: '🏢',
          descricao: 'Portões, muros e áreas externas',
          
          servicos: {
            portoes: {
              slug: 'portoes',
              titulo: 'Redes para Portões',
              descricaoCurta: 'Proteção para portões e entradas',
              destaque: 'Alta durabilidade',
              imagem: '/images/tela_proteção_servico.png',
              keywords: ['portão', 'entrada', 'garagem']
            },
            muros: {
              slug: 'muros',
              titulo: 'Redes para Muros',
              descricaoCurta: 'Segurança adicional em muros',
              destaque: 'Anti-invasão',
              imagem: '/images/tela_proteção_servico.png',
              keywords: ['muro', 'cerca', 'perímetro']
            },
            telhados: {
              slug: 'telhados',
              titulo: 'Redes para Telhados',
              descricaoCurta: 'Proteção contra pombos e pássaros',
              destaque: 'Anti-pombos',
              imagem: '/images/tela_proteção_servico.png',
              keywords: ['telhado', 'pombo', 'pássaro']
            },
            piscinas: {
              slug: 'piscinas',
              titulo: 'Redes para Piscinas',
              descricaoCurta: 'Segurança em áreas de piscina',
              destaque: 'Resistente à água',
              imagem: '/images/tela_proteção_servico.png',
              keywords: ['piscina', 'área de lazer']
            },
            coberturas: {
              slug: 'coberturas',
              titulo: 'Redes para Coberturas',
              descricaoCurta: 'Proteção para áreas cobertas',
              destaque: 'Sob medida',
              imagem: '/images/tela_proteção_servico.png',
              keywords: ['cobertura', 'toldo']
            }
          }
        }
      }
    },

    
    // ==========================================
    // FAMÍLIA 2: TELAS MOSQUITEIRAS (18 serviços)
    // ==========================================
    telas: {
      nome: 'Telas Mosquiteiras',
      slug: 'telas',
      icon: '🦟',
      descricao: 'Proteção contra mosquitos transmissores de dengue, zika e chikungunya',
      cor: '#F49A1A',
      imagem: '/images/TELA_MOSQUITEIRA.png',
      
      categorias: {
        // Categoria 1: Residencial (6 serviços)
        residencial: {
          slug: 'residencial',
          titulo: 'Residencial',
          emoji: '🏠',
          descricao: 'Janelas, portas e varandas',
          
          servicos: {
            janelas: {
              slug: 'janelas',
              titulo: 'Telas para Janelas',
              descricaoCurta: 'Visão 100% clara, proteção total',
              destaque: '85% transparência',
              imagem: '/images/TELA_MOSQUITEIRA.png',
              keywords: ['tela janela', 'mosquiteira', 'dengue']
            },
            portas: {
              slug: 'portas',
              titulo: 'Telas para Portas',
              descricaoCurta: 'Ventilação sem mosquitos',
              destaque: 'Fácil abertura',
              imagem: '/images/TELA_MOSQUITEIRA.png',
              keywords: ['tela porta', 'mosquiteira porta']
            },
            varandas: {
              slug: 'varandas',
              titulo: 'Telas para Varandas',
              descricaoCurta: 'Aproveite a varanda sem insetos',
              destaque: 'Área completa',
              imagem: '/images/TELA_MOSQUITEIRA.png',
              keywords: ['tela varanda', 'mosquiteira varanda']
            },
            sacadas: {
              slug: 'sacadas',
              titulo: 'Telas para Sacadas',
              descricaoCurta: 'Proteção total contra mosquitos',
              destaque: 'Instalação rápida',
              imagem: '/images/TELA_MOSQUITEIRA.png',
              keywords: ['tela sacada', 'mosquiteira sacada']
            },
            apartamentos: {
              slug: 'apartamentos',
              titulo: 'Telas para Apartamentos',
              descricaoCurta: 'Solução completa anti-mosquito',
              destaque: 'Pacote completo',
              imagem: '/images/TELA_MOSQUITEIRA.png',
              keywords: ['tela apartamento', 'mosquiteira']
            },
            banheiro: {
              slug: 'banheiro',
              titulo: 'Telas para Banheiro',
              descricaoCurta: 'Proteção em áreas úmidas',
              destaque: 'Anti-mofo',
              imagem: '/images/TELA_MOSQUITEIRA.png',
              keywords: ['tela banheiro', 'mosquiteira banheiro']
            }
          }
        },
        
        // Categoria 2: Modelos Especiais (6 serviços)
        especiais: {
          slug: 'especiais',
          titulo: 'Modelos Especiais',
          emoji: '🔧',
          descricao: 'Sistemas diferenciados de abertura',
          
          servicos: {
            correr: {
              slug: 'correr',
              titulo: 'Telas de Correr',
              descricaoCurta: 'Sistema deslizante prático',
              destaque: 'Fácil uso',
              imagem: '/images/TELA_MOSQUITEIRA.png',
              keywords: ['tela correr', 'deslizante']
            },
            pivotante: {
              slug: 'pivotante',
              titulo: 'Telas Pivotantes',
              descricaoCurta: 'Abertura giratória',
              destaque: 'Moderna',
              imagem: '/images/TELA_MOSQUITEIRA.png',
              keywords: ['tela pivotante', 'giratória']
            },
            removivel: {
              slug: 'removivel',
              titulo: 'Telas Removíveis',
              descricaoCurta: 'Fácil de remover e limpar',
              destaque: 'Prática',
              imagem: '/images/TELA_MOSQUITEIRA.png',
              keywords: ['tela removível', 'destacável']
            },
            basculante: {
              slug: 'basculante',
              titulo: 'Telas para Basculantes',
              descricaoCurta: 'Específica para janelas basculantes',
              destaque: 'Sob medida',
              imagem: '/images/TELA_MOSQUITEIRA.png',
              keywords: ['tela basculante', 'janela basculante']
            },
            aluminio: {
              slug: 'aluminio',
              titulo: 'Telas com Alumínio',
              descricaoCurta: 'Estrutura em alumínio reforçado',
              destaque: 'Durável',
              imagem: '/images/TELA_MOSQUITEIRA.png',
              keywords: ['tela alumínio', 'estrutura alumínio']
            },
            acoinox: {
              slug: 'acoinox',
              titulo: 'Telas com Aço Inox',
              descricaoCurta: 'Máxima resistência e durabilidade',
              destaque: 'Premium',
              imagem: '/images/TELA_MOSQUITEIRA.png',
              keywords: ['tela aço inox', 'inox']
            }
          }
        },

        
        // Categoria 3: Pet Screen (2 serviços)
        pet: {
          slug: 'pet',
          titulo: 'Pet Screen',
          emoji: '🐾',
          descricao: 'Telas reforçadas para pets',
          
          servicos: {
            pets: {
              slug: 'pets',
              titulo: 'Telas Pet Screen',
              descricaoCurta: 'Resistente a arranhões de pets',
              destaque: 'Anti-arranhão',
              imagem: '/images/pets_pro.png',
              keywords: ['tela pet', 'pet screen', 'gato', 'cachorro']
            },
            pernilongos: {
              slug: 'pernilongos',
              titulo: 'Telas Anti-Pernilongos',
              descricaoCurta: 'Malha extra fina contra pernilongos',
              destaque: 'Malha micro',
              imagem: '/images/mosquitoo.png',
              keywords: ['pernilongo', 'mosquito', 'inseto']
            }
          }
        },
        
        // Categoria 4: Comercial/Fachadas (4 serviços)
        comercial: {
          slug: 'comercial',
          titulo: 'Fachadas Grandes',
          emoji: '🏢',
          descricao: 'Soluções para grandes áreas',
          
          servicos: {
            fachadas: {
              slug: 'fachadas',
              titulo: 'Telas para Fachadas',
              descricaoCurta: 'Proteção para grandes fachadas',
              destaque: 'Grande porte',
              imagem: '/images/tela_proteção_servico.png',
              keywords: ['fachada', 'prédio', 'comercial']
            },
            coberturas: {
              slug: 'coberturas',
              titulo: 'Telas para Coberturas',
              descricaoCurta: 'Proteção em áreas cobertas',
              destaque: 'Sob medida',
              imagem: '/images/tela_proteção_servico.png',
              keywords: ['cobertura', 'toldo', 'área coberta']
            },
            restaurantes: {
              slug: 'restaurantes',
              titulo: 'Telas para Restaurantes',
              descricaoCurta: 'Ambiente livre de insetos',
              destaque: 'Comercial',
              imagem: '/images/tela_proteção_servico.png',
              keywords: ['restaurante', 'bar', 'comercial']
            },
            industrias: {
              slug: 'industrias',
              titulo: 'Telas para Indústrias',
              descricaoCurta: 'Proteção industrial',
              destaque: 'Alta resistência',
              imagem: '/images/tela_proteção_servico.png',
              keywords: ['indústria', 'fábrica', 'galpão']
            }
          }
        }
      }
    }
  }

  
  // ============================================
  // TEMPLATE BASE PARA PÁGINAS ESPECÍFICAS
  // ============================================
  const servicoTemplateBase = {
    beneficios: [
      { icone: 'shield', titulo: 'Resiste Chuva e Sol', descricao: 'Material UV resistente' },
      { icone: 'clock', titulo: 'Instalação em 48h', descricao: 'Agendamento rápido' },
      { icone: 'check', titulo: 'Fácil de Limpar', descricao: 'Manutenção simples' },
      { icone: 'award', titulo: 'Encaixe Perfeito', descricao: 'Medição precisa' }
    ],
    especificacoes: [
      { label: 'Material', valor: 'Polietileno alta resistência' },
      { label: 'Resistência', valor: 'Até 500kg' },
      { label: 'Garantia', valor: '2 anos' },
      { label: 'Instalação', valor: '48h após medição' }
    ],
    comparacao: {
      nos: ['Garantia 2 anos', 'Instalação 48h', 'Material premium', 'Certificado INMETRO'],
      concorrentes: ['Garantia 6 meses', 'Instalação 7-15 dias', 'Material padrão', 'Sem certificação']
    },
    faq: [
      { pergunta: 'Quanto tempo demora a instalação?', resposta: 'Após medição, instalamos em até 48h.' },
      { pergunta: 'Tem garantia?', resposta: 'Sim! 2 anos de garantia contra defeitos.' },
      { pergunta: 'Fazem orçamento grátis?', resposta: 'Sim! Orçamento 100% gratuito sem compromisso.' }
    ]
  }
  
  // ============================================
  // MÉTODOS HELPER
  // ============================================
  
  const getAllFamilias = () => Object.values(familias)
  
  const getFamiliaBySlug = (slug) => familias[slug] || null
  
  const getCategoriaBySlug = (familiaSlug, categoriaSlug) => {
    const familia = familias[familiaSlug]
    return familia?.categorias[categoriaSlug] || null
  }
  
  const getServicoBySlug = (familiaSlug, categoriaSlug, servicoSlug) => {
    const categoria = getCategoriaBySlug(familiaSlug, categoriaSlug)
    if (!categoria) return null
    
    const servico = categoria.servicos[servicoSlug]
    if (!servico) return null
    
    const familia = familias[familiaSlug]
    return {
      ...servico,
      ...servicoTemplateBase,
      familia: familiaSlug,
      familiaNome: familia.nome,
      familiaIcon: familia.icon,
      categoria: categoriaSlug,
      categoriaTitulo: categoria.titulo,
      categoriaEmoji: categoria.emoji,
      metaTitle: `${servico.titulo} em São Paulo | ${familia.nome} | AD Telas`,
      metaDescription: `${servico.titulo}: ${servico.descricaoCurta}. Instalação 48h. Garantia 2 anos. Orçamento grátis!`
    }
  }
  
  const getTotalServicos = () => {
    let total = 0
    Object.values(familias).forEach(familia => {
      Object.values(familia.categorias).forEach(categoria => {
        total += Object.keys(categoria.servicos).length
      })
    })
    return total
  }
  
  const getWhatsAppUrl = (familiaSlug, categoriaSlug, servicoSlug) => {
    const servico = getServicoBySlug(familiaSlug, categoriaSlug, servicoSlug)
    if (!servico) return `https://wa.me/${WHATSAPP_NUMBER}`
    
    const msg = `Olá! Gostaria de um orçamento para:\n\n📋 ${servico.titulo}\n📂 ${servico.familiaNome} > ${servico.categoriaTitulo}\n\nPode me ajudar?`
    return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(msg)}`
  }
  
  return {
    familias,
    getAllFamilias,
    getFamiliaBySlug,
    getCategoriaBySlug,
    getServicoBySlug,
    getTotalServicos,
    getWhatsAppUrl,
    WHATSAPP_NUMBER,
    COMPANY_NAME,
    GOOGLE_REVIEWS_URL
  }
}
