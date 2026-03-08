# Mapeamento de Imagens - Resumo

## ✅ Imagens Atualizadas

### Redes de Proteção - Categoria: Residencial

| Serviço | Imagem Principal | Imagem Especificações |
|---------|------------------|----------------------|
| Redes para Janelas | `/images/Redes_para_Janelas.png` | `/images/Redes_para_Janelas_especificações.png` |
| Redes para Portas | `/images/Redes_para_Portas.png` | - |

### Redes de Proteção - Categoria: Pets & Crianças

| Serviço | Imagem Principal | Imagem Especificações |
|---------|------------------|----------------------|
| Redes para Crianças | `/images/Redes_para_Crianças.png` | `/images/Redes_para_Crianças_especificações.png` |
| Redes para Gatos | `/images/gato.png` | `/images/Redes_para_Gatos_especificaçoes.png` |
| Redes para Cachorros | `/images/Redes_para_Cachorros.png` | `/images/Redes_para_Cachorros_especificações.png` |
| Redes para Animais | `/images/Redes_para_Animais.png` | `/images/Redes_para_Animais_especificações.png` |
| Redes para Idosos | `/images/Redes_para_Idosos.png` | `/images/Redes_para_Idosos_especificações.png` |

### Telas Mosquiteiras - Todas as Categorias

| Categoria | Imagem |
|-----------|--------|
| Todas as telas mosquiteiras | `/images/TELA_MOSQUITEIRA.png` |

### Outras Imagens Disponíveis

- `/images/familia.png` - Usado em vários serviços de redes residenciais
- `/images/pets_pro.png` - Disponível para pets
- `/images/bebe.png` - Disponível para crianças
- `/images/menino_janela.png` - Disponível para proteção infantil
- `/images/protecaoinfantil.jpeg` - Disponível para proteção infantil
- `/images/tela_proteção_servico.png` - Usado em serviços comerciais
- `/images/mosquitoo.png` - Usado para pernilongos

## Como Funciona

### Na Página do Serviço

A página `[servico].vue` usa duas imagens:

1. **Hero Section**: Usa `servico.imagem` (imagem principal)
2. **Especificações Técnicas**: Usa `servico.imagemEspecificacoes || servico.imagem`
   - Se existir imagem de especificações, mostra ela
   - Se não existir, mostra a imagem principal

### Exemplo de Código

```javascript
// No composable useServicos.js
criancas: {
  slug: 'criancas',
  titulo: 'Redes para Crianças',
  imagem: '/images/Redes_para_Crianças.png',
  imagemEspecificacoes: '/images/Redes_para_Crianças_especificações.png',
  // ...
}
```

```vue
<!-- Na página [servico].vue - Seção Especificações -->
<img
  :src="servico.imagemEspecificacoes || servico.imagem"
  :alt="`${servico.titulo} - especificações técnicas`"
/>
```

## Nota sobre Typo

A imagem `Redes_para_Gatos_especificaçoes.png` tem um typo no nome (falta o "i" em especificações). O sistema está usando o nome correto do arquivo.

## Próximos Passos

Se você adicionar mais imagens com o padrão `[Nome]_especificações.png`, basta:

1. Adicionar a propriedade `imagemEspecificacoes` no serviço correspondente
2. A página automaticamente usará essa imagem na seção de especificações técnicas
