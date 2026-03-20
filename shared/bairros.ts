export interface Bairro {
  nome: string
}

export interface Cidade {
  id: number
  nome: string
  bairros: string[]
}

export const CIDADES_BAIRROS: Cidade[] = [
  {
    id: 3550308,
    nome: 'São Paulo',
    bairros: [
      // A
      'Água Branca', 'Água Funda', 'Água Rasa', 'Aclimação', 'Alto da Boa Vista',
      'Alto da Lapa', 'Alto da Mooca', 'Alto de Pinheiros', 'Alto do Ipiranga', 'Americanópolis',
      'Anhanguera', 'Aricanduva', 'Artur Alvim', 'Artur Nogueira', 'Augusto de Lima',
      // B
      'Bairro do Limão', 'Bairro do Morumbi', 'Bairro do Sacomã', 'Bairro Ibirapuera', 'Balneário São Francisco',
      'Barra Funda', 'Bela Aliança', 'Bela Vista', 'Belém', 'Bom Retiro',
      'Bosque da Saúde', 'Brás', 'Brasilândia', 'Brooklin', 'Brooklin Novo',
      'Butantã',
      // C
      'Cachoeirinha', 'Cambuci', 'Campo Belo', 'Campo Grande', 'Campo Limpo',
      'Cangaíba', 'Capão Redondo', 'Carrão', 'Casa Verde', 'Casa Verde Alta',
      'Casa Verde Média', 'Chácara Inglesa', 'Chácara Itaim', 'Chácara Klabin', 'Chácara Santo Antônio',
      'Chácara Tatuapé', 'Cidade Ademar', 'Cidade Dutra', 'Cidade Jardim', 'Cidade Líder',
      'Cidade Tiradentes', 'Cidade Vargas', 'Consolação', 'Cursino',
      // D
      'Diadema', 'Distrito Industrial',
      // E
      'Ermelino Matarazzo',
      // F
      'Freguesia do Ó',
      // G
      'Grajaú', 'Granja Julieta', 'Granja Viana', 'Guaianases',
      // H
      'Heliópolis', 'Higienópolis', 'Horto Florestal',
      // I
      'Iguatemi', 'Indianópolis', 'Ipiranga', 'Itaim Bibi', 'Itaim Paulista',
      'Itaquera', 'Itirapina',
      // J
      'Jabaquara', 'Jaçanã', 'Jaguara', 'Jaguaré', 'Jaraguá',
      'Jardim Ângela', 'Jardim Anália Franco', 'Jardim Bonfiglioli', 'Jardim Brasil', 'Jardim Camargo Novo',
      'Jardim das Acácias', 'Jardim das Bandeiras', 'Jardim das Vertentes', 'Jardim do Colégio', 'Jardim do Estádio',
      'Jardim Dom Bosco', 'Jardim Elba', 'Jardim Elite', 'Jardim Europa', 'Jardim Guedala',
      'Jardim Helena', 'Jardim Hercília', 'Jardim Iguatemi', 'Jardim Ipanema', 'Jardim Jaqueline',
      'Jardim Lapena', 'Jardim Las Vegas', 'Jardim Líbano', 'Jardim Loni', 'Jardim Marajoara',
      'Jardim Monte Kemel', 'Jardim Namba', 'Jardim Nakamura', 'Jardim Noronha', 'Jardim Novo Mundo',
      'Jardim Paulista', 'Jardim Paulistano', 'Jardim Peri', 'Jardim Peri Alto', 'Jardim Piratininga',
      'Jardim Planalto', 'Jardim Robru', 'Jardim Romano', 'Jardim Santa Fé', 'Jardim Santa Helena',
      'Jardim São Luís', 'Jardim São Paulo', 'Jardim Saúde', 'Jardim Tietê', 'Jardim Tranquilidade',
      'Jardim Umarizal', 'Jardim Vera Cruz', 'Jardim Vila Formosa', 'Jardim Virgínia', 'Jardim Vista Alegre',
      'José Bonifácio',
      // L
      'Lajeado', 'Lapa', 'Liberdade', 'Limão', 'Lins de Vasconcelos',
      // M
      'Mandaqui', 'Marsilac', 'Mirandópolis', 'Moema', 'Mooca',
      'Morumbi',
      // N
      'Nova Piraju',
      // O
      'Osasco',
      // P
      'Pacaembu', 'Parelheiros', 'Pari', 'Parque Anhembi', 'Parque Boturussu',
      'Parque Bristol', 'Parque Císper', 'Parque da Mooca', 'Parque do Carmo', 'Parque do Gato',
      'Parque Edu Chaves', 'Parque Jabaquara', 'Parque Novo Mundo', 'Parque Peruche', 'Parque São Lucas',
      'Parque São Rafael', 'Parque Savoy City', 'Parque Taipas', 'Parque Tietê', 'Parque Vitória',
      'Pedreira', 'Penha', 'Perdizes', 'Perus', 'Pinheiros',
      'Pirituba', 'Planalto Paulista', 'Ponte Rasa',
      // R
      'Raposo Tavares', 'República', 'Rio Pequeno', 'Rio Pequeno (Butantã)',
      // S
      'Sacomã', 'Santa Cecília', 'Santa Efigênia', 'Santa Teresinha', 'Santana',
      'Santo Amaro', 'Santo André', 'São Domingos', 'São Lucas', 'São Mateus',
      'São Miguel', 'São Miguel Paulista', 'São Rafael', 'Sapopemba', 'Saúde',
      'Sé', 'Socorro', 'Sumaré', 'Sumarezinho',
      // T
      'Tatuapé', 'Tremembé', 'Tucuruvi',
      // V
      'Vila Alpina', 'Vila Andrade', 'Vila Anglo Brasileira', 'Vila Antonieta', 'Vila Aricanduva',
      'Vila Assunção', 'Vila Boa Vista', 'Vila Brasilândia', 'Vila Buarque', 'Vila Carrão',
      'Vila Clementino', 'Vila Constança', 'Vila Cordeiro', 'Vila Curuçá', 'Vila da Saúde',
      'Vila das Belezas', 'Vila das Mercês', 'Vila Deodoro', 'Vila Diva', 'Vila Dom Pedro I',
      'Vila Dom Pedro II', 'Vila Ema', 'Vila Esperança', 'Vila Fachini', 'Vila Formosa',
      'Vila Galvão', 'Vila Gomes Cardim', 'Vila Guilherme', 'Vila Gustavo', 'Vila Hamburguesa',
      'Vila Independência', 'Vila Ipojuca', 'Vila Isolina Mazzei', 'Vila Itaberaba', 'Vila Itapegica',
      'Vila Jacuí', 'Vila Jaguara', 'Vila Jaguaré', 'Vila Jaraguá', 'Vila Leopoldina',
      'Vila Madalena', 'Vila Maria', 'Vila Maria Alta', 'Vila Maria Baixa', 'Vila Mariana',
      'Vila Matilde', 'Vila Medeiros', 'Vila Missionária', 'Vila Moraes', 'Vila Moreira',
      'Vila Nivi', 'Vila Nova Cachoeirinha', 'Vila Nova Conceição', 'Vila Nova Manchester', 'Vila Nova Savoia',
      'Vila Olímpia', 'Vila Paulicéia', 'Vila Paulista', 'Vila Pirituba', 'Vila Pompéia',
      'Vila Prudente', 'Vila Re', 'Vila Romana', 'Vila Santa Catarina', 'Vila Santa Clara',
      'Vila Santa Eulália', 'Vila Santo Estéfano', 'Vila Santos', 'Vila São Francisco', 'Vila São João',
      'Vila São José', 'Vila São Pedro', 'Vila Sônia', 'Vila Suzana', 'Vila Talarico',
      'Vila Tramontano', 'Vila Uberabinha', 'Vila União', 'Vila Vera', 'Vila Yara',
      'Vila Zelina', 'Vila Zilda',
      // Z
      'Zona Industrial',
    ],
  },
  {
    id: 3518800,
    nome: 'Guarulhos',
    bairros: [
      'Aeroporto', 'Água Azul', 'Água Chata', 'Aracília', 'Bananal',
      'Bela Vista', 'Bom Clima', 'Bonsucesso', 'Cabuçu', 'Cabuçu de Cima',
      'Capelinha', 'CECAP', 'Centro', 'Cocaia', 'Cumbica',
      'Fátima', 'Fortaleza', 'Gopoúva', 'Invernada', 'Itapegica',
      'Jardim Vila Galvão', 'Lavras', 'Macedo', 'Maia', 'Mato das Cobras',
      'Monte Carmelo', 'Morro Grande', 'Morros', 'Paraventi', 'Picanço',
      'Pimentas', 'Ponte Grande', 'Porto da Igreja', 'Presidente Dutra', 'Sadokim',
      'São João', 'São Roque', 'Taboão', 'Tanque Grande', 'Torres Tibagy',
      'Tranquilidade', 'Várzea do Palácio', 'Vila Any', 'Vila Augusta', 'Vila Barros',
      'Vila Galvão', 'Vila Rio',
    ],
  },
  {
    id: 3534401,
    nome: 'Osasco',
    bairros: [
      'Adalgisa', 'Aliança', 'Ayrosa', 'Bandeiras', 'Baronesa',
      'Bela Vista', 'Bonança', 'Bonfim', 'Bussocaba', 'Castelo Branco',
      'Centro', 'Cidade das Flores', 'Cidade de Deus', 'Cipava', 'City Bussocaba',
      'Conceição', 'Conjunto Metalúrgicos', 'Continental', 'Helena Maria', 'IAPI',
      'Industrial Altino', 'Industrial Anhanguera', 'Industrial Autonomistas', 'Industrial Centro', 'Industrial Mazzei',
      'Industrial Remédios', 'Jaguaribe', 'Jardim D\'Abril', 'Jardim das Flores', 'Jardim Elvira',
      'Km 18', 'Munhoz Júnior', 'Mutinga', 'Novo Osasco', 'Padroeira',
      'Paiva Ramos', 'Pestana', 'Piratininga', 'Platina', 'Portal D\'Oeste',
      'Presidente Altino', 'Quitaúna', 'Raposo Tavares', 'Remédios', 'Rochdale',
      'Santa Fé', 'Santa Maria', 'Santo Antônio', 'São Pedro', 'Setor Militar',
      'Três Montanhas', 'Umuarama', 'Veloso', 'Vila Campesina', 'Vila Menck',
      'Vila Militar', 'Vila Osasco', 'Vila Yara', 'Vila Yolanda', 'Jardim Roberto',
    ],
  },
  {
    id: 3548708,
    nome: 'São Bernardo do Campo',
    bairros: [
      'Alves Dias', 'Anchieta', 'Assunção', 'Baeta Neves', 'Batistini',
      'Bela Vista', 'Boa Vista', 'Botujuru', 'Centro', 'Cooperativa',
      'Demarchi', 'Dos Casa', 'Ferrazópolis', 'Independência', 'Jardim Chácara Inglesa',
      'Jardim do Mar', 'Jardim Ipê', 'Jardim Olavo Bilac', 'Jordanópolis', 'Jurubatuba',
      'Montanhão', 'Nova Petrópolis', 'Paulicéia', 'Planalto', 'Riacho Grande',
      'Rudge Ramos', 'Santa Terezinha', 'Santo André', 'São José', 'Taboão',
      'Tibiriçá', 'Vila Euclides', 'Vila Marlene', 'Vila São Pedro',
    ],
  },
  {
    id: 3505708,
    nome: 'Barueri',
    bairros: [
      'Aldeia', 'Alphaville', 'Alphaville Industrial', 'Bethaville', 'Centro',
      'Engenho Novo', 'Jardim Belval', 'Jardim Silveira', 'Jardim Tupanci', 'Parque dos Camargos',
      'Parque Viana', 'Portal do Morumbi', 'Residencial Nove de Julho', 'Tamboré', 'Vila Porto',
      'Vila São João', 'Jardim Maria Helena', 'Jardim Nazaré', 'Jardim Esperança', 'Jardim Graziela',
    ],
  },
  {
    id: 3525904,
    nome: 'Jundiaí',
    bairros: [
      'Anhangabaú', 'Bairro Colônia', 'Bairro Ivoturucaia', 'Bairro Traviú', 'Caxambu',
      'Centro', 'Chácara Urbana', 'Colônia', 'Eloy Chaves', 'Engordadouro',
      'Fazenda Grande', 'Horto Florestal', 'Ivoturucaia', 'Jardim Aeroporto', 'Jardim Botânico',
      'Jardim Caxambu', 'Jardim Colônia', 'Jardim das Nações', 'Jardim do Lago', 'Jardim Ermida',
      'Jardim Europa', 'Jardim Flórida', 'Jardim Guanabara', 'Jardim Hana', 'Jardim Itália',
      'Jardim Lacerda', 'Jardim Madalena', 'Jardim Novo Horizonte', 'Jardim Pacaembu', 'Jardim Paulista',
      'Jardim Progresso', 'Jardim Santa Gertrudes', 'Jardim São Camilo', 'Jardim São João', 'Jardim Tamoio',
      'Jardim Tarumã', 'Jardim Tulipas', 'Jardim Vista Alegre', 'Medeiros', 'Morada das Vinhas',
      'Nova Jundiaí', 'Novo Horizonte', 'Parque Centenário', 'Parque Residencial Jundiaí', 'Ponte São João',
      'Rio Acima', 'Rosário', 'Safira', 'Traviú', 'Vila Aparecida',
      'Vila Arens', 'Vila Hortolândia', 'Vila Inglesa', 'Vila Joana', 'Vila Lacerda',
      'Vila Maringá', 'Vila Municipal', 'Vila Nova Jundiaí', 'Vila Rami', 'Vila Rio Branco',
    ],
  },
  {
    id: 3530607,
    nome: 'Mogi das Cruzes',
    bairros: [
      'Alto Ipiranga', 'Braz Cubas', 'Brás Cubas', 'Caputera', 'Centro',
      'César de Sousa', 'Chácara Guanabara', 'Chácara Jafet', 'Conjunto Residencial Araretama', 'Conjunto Residencial Novo Horizonte',
      'Estância Paraíso', 'Jardim Aeroporto', 'Jardim América', 'Jardim Armênia', 'Jardim Camila',
      'Jardim Casablanca', 'Jardim Caxangá', 'Jardim Conceição', 'Jardim Esperança', 'Jardim Europa',
      'Jardim Ipiranga', 'Jardim Itapeti', 'Jardim Jafet', 'Jardim Layr', 'Jardim Marica',
      'Jardim Mogi', 'Jardim Novo Horizonte', 'Jardim Paulista', 'Jardim Rodeio', 'Jardim São Paulo',
      'Jardim Universo', 'Jundiapeba', 'Mogi Moderno', 'Parque Cidadão', 'Parque Olímpico',
      'Parque Santana', 'Quatinga', 'Sabaúna', 'Taiaçupeba', 'Vila Brasileira',
      'Vila Cintra', 'Vila Dutra', 'Vila Lavínia', 'Vila Moraes', 'Vila Natal',
      'Vila Nova União', 'Vila Oliveira', 'Vila Suíça', 'Vila Uni', 'Vila Urquiza',
    ],
  },
  {
    id: 3552809,
    nome: 'Taboão da Serra',
    bairros: [
      'Bairro dos Álamos', 'Centro', 'Chácara Bela Vista', 'Chácara Monte Alegre', 'Chácara Nazaré',
      'Chácara Ondas Verdes', 'Chácara Pouso Alegre', 'Chácara Santa Fé', 'Chácara Santa Lúcia', 'Chácara Santo Antônio',
      'Chácara São Luís', 'Jardim Apurá', 'Jardim Bela Vista', 'Jardim Bonfiglioli', 'Jardim Caiapiá',
      'Jardim Cibele', 'Jardim das Vertentes', 'Jardim Esmeralda', 'Jardim Guayana', 'Jardim Ipanema',
      'Jardim Ipes', 'Jardim Marajoara', 'Jardim Monte Alegre', 'Jardim Monte Kemel', 'Jardim Noronha',
      'Jardim Novo Horizonte', 'Jardim Panorama', 'Jardim Piratininga', 'Jardim Presidente', 'Jardim Santa Fé',
      'Jardim São Judas Tadeu', 'Jardim Três Marias', 'Parque Pinheiros', 'Parque São Lucas', 'Parque Yolanda',
      'Residencial Parque Cumbica', 'Vila Figueira', 'Vila Formosa', 'Vila Gonçalves', 'Vila Ipê',
      'Vila Mira', 'Vila Nova Aparecida', 'Vila Nova Esperança', 'Vila Olinda', 'Vila Paulista',
      'Vila São Silvestre', 'Vila Sônia',
    ],
  },
  {
    id: 3552502,
    nome: 'Suzano',
    bairros: [
      'Boa Vista São Francisco', 'Caxangá', 'Centro', 'Chácara Faustino', 'Cidade Miguel Badra',
      'Cidade Boa Vista', 'Conjunto Habitacional Suzano', 'Estância Miriambi', 'Jardim Alterópolis', 'Jardim Amanda',
      'Jardim Belém', 'Jardim Brasil', 'Jardim Casa Branca', 'Jardim Colorado', 'Jardim Dona Benta',
      'Jardim Europa', 'Jardim Imperador', 'Jardim Índia', 'Jardim Itapeti', 'Jardim Leblon',
      'Jardim Margareth', 'Jardim Maria Estela', 'Jardim Miriam', 'Jardim Monte Cristo', 'Jardim Natal',
      'Jardim Novo Horizonte', 'Jardim Oriente', 'Jardim Paulista', 'Jardim Quaresmeira', 'Jardim Santa Inês',
      'Jardim São José', 'Jardim São Paulo', 'Jardim Simus', 'Jardim Suzanópolis', 'Jardim Vera Cruz',
      'Jardim Vista Alegre', 'Miguel Badra', 'Parque Suzano', 'Recreio São Jorge', 'Vila Amorim',
      'Vila Brasileira', 'Vila Figueira', 'Vila Maluf', 'Vila Urupês',
    ],
  },
  {
    id: 3522505,
    nome: 'Itapevi',
    bairros: [
      'Amador Bueno', 'Bairro do Engenho', 'Centro', 'Chácara Alvorada', 'Chácara Recanto Verde',
      'Cohab', 'Conjunto Habitacional Padre Anchieta', 'Jardim Briquet', 'Jardim Buru', 'Jardim Casablanca',
      'Jardim Conceição', 'Jardim das Flores', 'Jardim Dona Sinhá', 'Jardim Esperança', 'Jardim Europa',
      'Jardim Itapevi', 'Jardim Julieta', 'Jardim Maravilha', 'Jardim Marilu', 'Jardim Novo Horizonte',
      'Jardim Paraíso', 'Jardim Paulista', 'Jardim Presidente', 'Jardim Santa Fé', 'Jardim Santa Rita',
      'Jardim São Judas Tadeu', 'Jardim São Paulo', 'Jardim Vitória', 'Nova Itapevi', 'Parque Suburbano',
      'Recanto Verde', 'Vila Amélia', 'Vila Bela', 'Vila Boa Vista', 'Vila Calu',
      'Vila Cardoso', 'Vila Engenho', 'Vila Esperança', 'Vila Flórida', 'Vila Itapevi',
    ],
  },
  {
    id: 3515103,
    nome: 'Embu-Guaçu',
    bairros: [
      'Bairro dos Pires', 'Barro Branco', 'Cipó Guaçu', 'Centro', 'Chácara Alvorada',
      'Chácara Recanto Verde', 'Conjunto Habitacional Embu-Guaçu', 'Estância Bela Vista', 'Estância Guatambu', 'Estância Paraíso',
      'Jardim Bela Vista', 'Jardim Cláudia', 'Jardim das Flores', 'Jardim Embu-Guaçu', 'Jardim Esperança',
      'Jardim Guaçu', 'Jardim Ipanema', 'Jardim Maravilha', 'Jardim Novo Horizonte', 'Jardim Paraíso',
      'Jardim Santa Fé', 'Jardim Santa Rita', 'Jardim São Paulo', 'Jardim Vitória', 'Parque Guaçu',
      'Recanto Verde', 'Vila Amélia', 'Vila Boa Vista', 'Vila Esperança', 'Vila Guaçu',
    ],
  },
  {
    id: 3552205,
    nome: 'Sorocaba',
    bairros: [
      'Além Linha', 'Aparecidinha', 'Árvore Grande', 'Barcelona', 'Brigadeiro Tobias',
      'Cajuru do Sul', 'Campolim', 'Centro', 'Cerrado', 'Éden',
      'Hortência', 'Iporanga', 'Jardim Abaeté', 'Jardim América', 'Jardim Americano',
      'Jardim Boa Esperança', 'Jardim Brasilândia', 'Jardim Emília', 'Jardim Europa', 'Jardim Guadalajara',
      'Jardim Maria do Carmo', 'Jardim Panorama', 'Jardim Santa Cecília', 'Jardim Santa Rosália', 'Jardim São Paulo',
      'Jardim Simus', 'Jardim Vera Cruz', 'Mineirão', 'Parque Campolim', 'Parque das Laranjeiras',
      'Parque Esmeralda', 'Parque Manchester', 'Parque São Bento', 'Parque Vitória Régia', 'Trujillo',
      'Vila Angélica', 'Vila Barão', 'Vila Carvalho', 'Vila Fiori', 'Vila Hortência',
      'Vila Independência', 'Vila Santana', 'Vitória Régia', 'Wanel Ville', 'Zona Industrial',
    ],
  },
  {
    id: 3509205,
    nome: 'Cajamar',
    bairros: [
      'Bairro dos Fernandes', 'Centro', 'Distrito Industrial', 'Jardim Alvorada', 'Jardim Bela Vista',
      'Jardim Cajamar', 'Jardim Esperança', 'Jardim Lavínia', 'Jardim Marcelino', 'Jardim Novo Horizonte',
      'Jordanésia', 'Parque Jaraguá', 'Parque Lago', 'Polvilho', 'Ponunduva',
      'Portal dos Ipes', 'Portais', 'Vila Dirce', 'Vila Nova', 'Vila Rosina',
    ],
  },
  {
    id: 3528502,
    nome: 'Mairiporã',
    bairros: [
      'Bairro do Rosário', 'Centro', 'Jardim Alvorada', 'Jardim Bela Vista', 'Jardim Estância',
      'Jardim Flórida', 'Jardim Mairiporã', 'Jardim Morada do Sol', 'Jardim Novo Horizonte', 'Jardim Roseira',
      'Jardim Santa Clara', 'Parque Independência', 'Parque Petrópolis', 'Terra Preta', 'Vila Nova',
    ],
  },
  {
    id: 3547304,
    nome: 'Santana de Parnaíba',
    bairros: [
      'Alphaville', 'Caguaçu', 'Centro', 'Chácara Boa Vista', 'Chácara dos Lagos',
      'Cidade São Pedro', 'Fazendinha', 'Jardim Isaura', 'Jardim Paraíso', 'Jardim São Luís',
      'Parque Santana', 'Refúgio dos Pinheiros', 'Sítio do Morro', 'Tamboré', 'Vila Poupança',
    ],
  },
  {
    id: 3513009,
    nome: 'Cotia',
    bairros: [
      'Atalaia', 'Caucaia do Alto', 'Centro', 'Chácara Roselândia', 'Granja Carolina',
      'Granja Viana', 'Jardim Atalaia', 'Jardim Bela Vista', 'Jardim Coimbra', 'Jardim da Glória',
      'Jardim Lambreta', 'Jardim Nomura', 'Jardim Passárgada', 'Jardim Petrópolis', 'Jardim Pioneiro',
      'Jardim Rosemary', 'Jardim Santo Antônio', 'Jardim São Vicente', 'Jardim Torino', 'Moinho Velho',
      'Parque Bahia', 'Parque Miguel Mirizola', 'Parque Rincão', 'Parque São George', 'Portão',
      'Tijuco Preto', 'Vila Albertina', 'Vila Dirce', 'Vila Monte Serrat', 'Vila Santo Antônio',
    ],
  },
  {
    id: 3522208,
    nome: 'Itapecerica da Serra',
    bairros: [
      'Bairro dos Palmares', 'Centro', 'Chácara Baronesa', 'Chácara Vista Alegre', 'Embu Mirim',
      'Jardim Ângela', 'Jardim Jacira', 'Jardim Marajoara', 'Jardim Paraíso', 'Jardim Potuverá',
      'Jardim Santa Amélia', 'Jardim São Pedro', 'Mombaça', 'Parque Paraíso', 'Potuverá',
      'Recanto Suave', 'Valo Velho', 'Vila Geni', 'Vila Mariana', 'Vila São João',
    ],
  },
  {
    id: 3515004,
    nome: 'Embu das Artes',
    bairros: [
      'Centro', 'Chácara Flórida', 'Chácara São Marcos', 'Jardim Independência', 'Jardim Pinheirinho',
      'Jardim Santa Tereza', 'Jardim São Luís', 'Jardim São Marcos', 'Jardim Silvia', 'Jardim Tomé',
      'Jardim Vazani', 'Parque Luiza', 'Parque Pirajussara', 'Santa Emília', 'Santo Eduardo',
      'São Luís', 'São Marcos', 'Vista Alegre', 'Votorantim', 'Zanzalá',
    ],
  },
  {
    id: 3550605,
    nome: 'São Roque',
    bairros: [
      'Bairro da Estação', 'Bairro do Taboão', 'Centro', 'Chácaras Reunidas', 'Jardim Progresso',
      'Jardim Santa Catarina', 'Jardim São João', 'Mailasqui', 'Parque Primavera', 'Parque São Roque',
      'Taboão', 'Vila Boa Vista', 'Vila Caputera', 'Vila Esperança', 'Vila Matilde',
    ],
  },
]
