<h1 align="center">Synapse — Cinema & Recompensas</h1>

O **Synapse** é um sistema completo e moderno de fidelidade e ingressos para redes de cinema. Ele permite que os usuários façam login com suas contas do Google, explorem filmes em cartaz e próximas estreias sincronizados diretamente com a API do **The Movie Database (TMDB)**, comprem ingressos simulados com descontos exclusivos e realizem o check-in presencial nas sessões do cinema por meio de **QR Codes**.

Cada check-in recompensa o usuário com pontos que podem ser acumulados e posteriormente trocados por recompensas físicas ou virtuais do cinema (como pipocas, bebidas ou ingressos gratuitos). O projeto é dividido em um **Backend Rails 8.1 API-only** resiliente e um **Frontend React Native (Expo)** cross-platform de alta performance com interface bonita, com suporte a temas claro/escuro.

<h2 align="center">Sumário</h2>

* [Backend (Arquitetura & Funcionamento)](#backend-arquitetura--funcionamento)
  * [Modelos (Active Record)](#modelos-active-record)
  * [Controladores (Controllers & API Endpoints)](#controladores-controllers--api-endpoints)
  * [Serviços (Business Logic & Integrations)](#serviços-business-logic--integrations)
  * [Trabalhos em Segundo Plano (Background Jobs)](#trabalhos-em-segundo-plano-background-jobs)
  * [Segurança & Autenticação JWT](#segurança--autenticação-jwt)
  * [Configuração & Inicialização (Compilação)](#configuração--inicialização-compilação)
  * [Tecnologias & Dependências (Backend)](#tecnologias--dependências-backend)
  * [Qualidade & Testes (RSpec)](#qualidade--testes-rspec)
* [Frontend (Arquitetura da Interface)](#frontend-arquitetura-da-interface)
  * [Roteamento & Estrutura de Telas](#roteamento--estrutura-de-telas)
  * [Gerenciamento de Estado (Zustand Stores)](#gerenciamento-de-estado-zustand-stores)
  * [Estilização & Temas Dinâmicos](#estilização--temas-dinâmicos)
  * [Componentes da Interface](#componentes-da-interface)
  * [Execução & Compilação (Frontend)](#execução--compilação-frontend)
  * [Tecnologias & Dependências (Frontend)](#tecnologias--dependências-frontend)
  * [Qualidade & Testes (Jest)](#qualidade--testes-jest)
* [Comandos Úteis](#comandos-úteis)

---

<h2 align="center" id="backend-arquitetura--funcionamento">Backend (Arquitetura & Funcionamento)</h2>

O backend foi desenvolvido utilizando o framework **Ruby on Rails 8.1** configurado no modo **API-only** com banco de dados **SQLite3** (ideal para o MVP, altamente performático e de configuração zero). A estrutura segue o clássico padrão MVC, enriquecida com camadas especializadas de *Services*, *Jobs* e *Serializers* para manter o código limpo, testável e de fácil manutenção.

---

### 📂 Modelos (Active Record)

Os modelos representam as entidades do banco de dados, mapeando relacionamentos lógicos, regras de negócio primárias e validações:

#### 1. [User (user.rb)](file:///home/b3rnard0p/ProjetosWSL/Synapse/Backend/app/models/user.rb)
A entidade central do sistema. Mapeia os dados sincronizados do provedor Google OAuth.
- **Associações:** Possui muitos `tickets`, `checkins`, `user_favorites`, `favorite_movies` (através de favorites), `notifications` e `genre_preferences`.
- **Validações:** Valida presença e formato de email (único e case-insensitive) e nome. Garante que `points_balance` seja sempre positivo ou zero.
- **Métodos:**
  - `add_points!(amount, reason)`: Incrementa o saldo do usuário de forma segura e gera logs de auditoria.
  - `redeem_points!(amount)`: Deduz pontos para o resgate de recompensas, lançando exceções se o saldo for insuficiente.

#### 2. [Movie (movie.rb)](file:///home/b3rnard0p/ProjetosWSL/Synapse/Backend/app/models/movie.rb)
Representa as informações de filmes importadas diretamente do TMDB.
- **Associações:** Possui muitos `tickets`, `user_favorites` e `notifications`.
- **Escopos:**
  - `upcoming`: Filtra filmes futuros ordenados pela data de estreia.
  - `now_playing`: Filtra filmes em exibição ordenados pela avaliação do público (`vote_average`).
- **Validações:** Unicidade e presença do `tmdb_id` e presença de título.
- **Métodos:**
  - `releasing_soon?`: Retorna verdadeiro se o filme estreia nos próximos 1 a 14 dias (usado para disparar notificações preventivas de interesse).

#### 3. [Ticket (ticket.rb)](file:///home/b3rnard0p/ProjetosWSL/Synapse/Backend/app/models/ticket.rb)
Representa um ingresso adquirido pelo usuário.
- **Associações:** Pertence a um `user` e a um `movie`, e possui um `checkin` associado.
- **Estados (Status):** Confirmação de compra controlada pelos estados `pending`, `confirmed`, `used` e `expired`.
- **Callbacks:**
  - `before_create :generate_qr_code`: Aciona a criação do QR Code encriptado antes de persistir no banco.
  - `after_create :schedule_session_reminder`: Agenda o `SessionReminderJob` para o dia da sessão em segundo plano.
- **Métodos:**
  - `can_checkin?`: Avalia se o ingresso está confirmado, se a data do filme coincide com o dia atual e se o check-in ainda não foi realizado.
  - `discounted_price`: Calcula o valor final com base no desconto padrão de **20%** (`DISCOUNT_PERCENT = 20`) concedido no MVP.

#### 4. [Checkin (checkin.rb)](file:///home/b3rnard0p/ProjetosWSL/Synapse/Backend/app/models/checkin.rb)
Representa o evento físico de entrada no cinema através do escaneamento do QR Code.
- **Validações:** Impede duplicidade de check-in para o mesmo ingresso e valida se o ticket está qualificado para check-in.
- **Callbacks:**
  - `after_create :award_points`: Modifica de forma atômica o ticket para o estado `used`, atualiza o saldo do usuário concedendo **50 pontos** (`POINTS_EARNED = 50`) e emite logs da transação.

#### 5. [GenrePreference (genre_preference.rb)](file:///home/b3rnard0p/ProjetosWSL/Synapse/Backend/app/models/genre_preference.rb)
Salva as categorias e gêneros de filmes favoritos selecionados pelo usuário para fins de personalização de alertas.

#### 6. [Notification (notification.rb)](file:///home/b3rnard0p/ProjetosWSL/Synapse/Backend/app/models/notification.rb)
Gerencia alertas persistentes disparados ao usuário. Mapeia tipos como `upcoming_release`, `purchase_confirmation`, `session_reminder` e `reward_earned`.

---

### 📂 Controladores (Controllers & API Endpoints)

A camada de controle define os endpoints expostos, valida os parâmetros recebidos e orquestra as respostas JSON formatadas:

#### 1. [ApplicationController](file:///home/b3rnard0p/ProjetosWSL/Synapse/Backend/app/controllers/application_controller.rb)
Controlador base que implementa a segurança do ecossistema.
- **Filtro Global:** Executa `before_action :authenticate_user!` em todas as requisições (exceto rotas públicas explicitadas).
- **Extração de Token:** Lê a assinatura do cabeçalho `Authorization: Bearer <token>`, decodifica e localiza o usuário ativo.
- **Formatadores de Erro:** Centraliza respostas de erro padrão como `render_unauthorized` (401), `render_not_found` (404) e `render_unprocessable` (422).

#### 2. [AuthController](file:///home/b3rnard0p/ProjetosWSL/Synapse/Backend/app/controllers/api/v1/auth_controller.rb)
Gerencia o fluxo de sessão sem estado (stateless).
- **`POST /api/v1/auth/google`**: Recebe o ID Token enviado pelo frontend, valida com a API de segurança do Google e cria ou atualiza a conta do usuário retornando o JWT de sessão.
- **`GET /api/v1/auth/me`**: Retorna os detalhes do perfil do usuário autenticado no formato JSON serializado pelo *Blueprinter*.

#### 3. [MoviesController](file:///home/b3rnard0p/ProjetosWSL/Synapse/Backend/app/controllers/api/v1/movies_controller.rb)
Catalogação e listagem de filmes públicas (isentas de autenticação).
- **Cache Inteligente:** Utiliza `Rails.cache.fetch` com expiração de **15 minutos** para listagens de lançamentos e detalhes dos filmes, e de **1 dia** para a lista de gêneros oficiais. Reduz a latência de rede e previne o esgotamento dos limites da API do TMDB.
- **`GET /api/v1/movies/upcoming`**: Retorna próximas estreias paginadas.
- **`GET /api/v1/movies/now_playing`**: Retorna filmes em cartaz.
- **`GET /api/v1/movies/search?q=`**: Efetua buscas dinâmicas diretas sem cachear termos variáveis.
- **`GET /api/v1/movies/:id`**: Retorna ficha técnica completa anexando a flag `is_favorited` se o usuário logado tiver favoritado o filme.

#### 4. [TicketsController](file:///home/b3rnard0p/ProjetosWSL/Synapse/Backend/app/controllers/api/v1/tickets_controller.rb)
Módulo de vendas e check-in.
- **`POST /api/v1/tickets`**: Simula a compra de ingressos. Se o filme ainda não existir no banco de dados local, faz a importação imediata via TMDB API e salva a entidade antes de emitir o ingresso e gerar a notificação de confirmação.
- **`POST /api/v1/tickets/:id/checkin`**: Valida o QR Code, dispara a recompensa em pontos ao usuário e atualiza a carteira.

#### 5. [FavoritesController](file:///home/b3rnard0p/ProjetosWSL/Synapse/Backend/app/controllers/api/v1/favorites_controller.rb)
Gerencia a lista de favoritos do usuário logado sob `/api/v1/users/:user_id/favorites`, garantindo isolamento absoluto de dados entre contas.

#### 6. [UsersController](file:///home/b3rnard0p/ProjetosWSL/Synapse/Backend/app/controllers/api/v1/users_controller.rb)
Responsável por atualizar perfis e gerenciar a atualização atômica de preferências de gêneros, executada de forma transacional (`ActiveRecord::Base.transaction`) para evitar inconsistências.

#### 7. [PointsController](file:///home/b3rnard0p/ProjetosWSL/Synapse/Backend/app/controllers/api/v1/points_controller.rb)
Fornece o saldo atual, histórico detalhado de pontos ganhos por check-in e a listagem dinâmica de recompensas disponíveis no cinema.

---

### 📂 Serviços (Business Logic & Integrations)

A camada de serviços isola regras de negócios externas e integrações com terceiros das regras básicas de MVC:

* **[GoogleAuthService (google_auth_service.rb)](file:///home/b3rnard0p/ProjetosWSL/Synapse/Backend/app/services/google_auth_service.rb):** Realiza chamadas HTTP com `httparty` para o endpoint seguro do Google OAuth2 (`tokeninfo`) para checar a validade do Token ID, garantindo que o cabeçalho de audiência (`aud`) coincida com os IDs de clientes registrados do backend (Web) ou aplicativos móveis (iOS/Android).
* **[JwtService (jwt_service.rb)](file:///home/b3rnard0p/ProjetosWSL/Synapse/Backend/app/services/jwt_service.rb):** Controla a expiração (configurada para **30 dias**) e a criptografia dos tokens de sessão baseados no padrão **HMAC-SHA256 (HS256)**, utilizando a chave `secret_key_base` padrão do Rails.
* **[TmdbService (tmdb_service.rb)](file:///home/b3rnard0p/ProjetosWSL/Synapse/Backend/app/services/tmdb_service.rb):** Implementa um wrapper completo de API externa com o TMDB. Consome coleções, dados detalhados da equipe técnica/elenco, trailers do YouTube e monta caminhos absolutos das imagens em diferentes resoluções.
* **[QrCodeService (qr_code_service.rb)](file:///home/b3rnard0p/ProjetosWSL/Synapse/Backend/app/services/qr_code_service.rb):** Cria o payload JSON representativo do ingresso (ID, cinema, filme, data e desconto) e gera uma imagem SVG encriptada em string **Base64**, garantindo portabilidade extrema e leveza no transporte dos dados para o aplicativo do usuário.

---

### 📂 Trabalhos em Segundo Plano (Background Jobs)

A execução assíncrona utiliza o **Solid Queue** (novo padrão oficial do Rails 8 executado diretamente no banco de dados sem dependência externa do Redis), aumentando a resiliência operacional:

* **[NotificationDispatchJob (notification_dispatch_job.rb)](file:///home/b3rnard0p/ProjetosWSL/Synapse/Backend/app/jobs/notification_dispatch_job.rb):** Cria alertas no banco de dados e calcula títulos e corpos dinâmicos usando lambdas para compras de ingressos, novos filmes ou pontos acumulados.
* **[SessionReminderJob (session_reminder_job.rb)](file:///home/b3rnard0p/ProjetosWSL/Synapse/Backend/app/jobs/session_reminder_job.rb):** Disparado de forma agendada no início do dia de uma sessão cadastrada para lembrar o usuário de seu ingresso ativo.
* **[TmdbSyncJob (tmdb_sync_job.rb)](file:///home/b3rnard0p/ProjetosWSL/Synapse/Backend/app/jobs/tmdb_sync_job.rb):** Executa a sincronização programada periódica entre o TMDB e o banco local. Identifica novos filmes catalogados e notifica automaticamente todos os usuários cujos gêneros favoritos coincidam com a categoria do novo filme em cartaz.

---

### 🛡️ Segurança & Autenticação JWT

A segurança do backend assenta em premissas modernas de arquitetura RESTful sem estado:
1. **Autenticação com Provedor Confiável:** A validação do token é delegada às APIs de identidade do Google, prevenindo ataques de dicionário ou vazamentos locais de credenciais.
2. **Tokens Estritos de Sessão:** A validação baseia-se exclusivamente em JWTs criptografados no servidor. As credenciais expiram a cada 30 dias para evitar brechas em caso de tokens sequestrados localmente.
3. **Isolamento Multitenant Lógico:** Todas as buscas por ingressos, favoritos e pontos são feitas imperativamente a partir de escopos vinculados ao `current_user` autenticado (prevenindo ataques IDOR - Insecure Direct Object Reference).

---

### ⚙️ Configuração & Inicialização (Compilação)

Por ser uma aplicação Ruby on Rails interpretada, não há compilação binária estática. A inicialização e preparação do ambiente dependem da instalação das gems, configuração de credenciais e preparação das tabelas:

```bash
cd Backend

# 1. Instalar dependências (Gems)
bundle install

# 2. Configurar chaves privadas e integradoras do TMDB e Google
# (Abre um editor seguro usando criptografia simétrica com a master.key)
rails credentials:edit
```

Formato do arquivo de credenciais editado:
```yaml
tmdb:
  api_key: "sua_tmdb_api_key"

google:
  client_id: "seu_google_client_id_web"
  client_secret: "seu_google_client_secret"

jwt:
  secret_key: "chave_longa_e_segura_para_assinatura_do_jwt"
```

Em seguida, execute a migração e população de dados de desenvolvimento:
```bash
# 3. Criar e migrar o banco de dados (SQLite3)
rails db:migrate

# 4. Inserir sementes de dados (Seed) para testes rápidos
rails db:seed

# 5. Iniciar o servidor Puma na porta 3000
rails server -p 3000
```

---

### 📦 Tecnologias & Dependências (Backend)

O backend apoia-se em bibliotecas modernas e estáveis do ecossistema Ruby:

| Biblioteca / Gem | Finalidade Técnica |
| :--- | :--- |
| **`rails` (~> 8.1.3)** | Framework base para desenvolvimento de APIs sem estado. |
| **`sqlite3` (>= 2.1)** | Banco de dados leve e integrado, ideal para MVPs e escala inicial. |
| **`solid_queue`** | Mecanismo de processamento assíncrono oficial e nativo no banco do Rails 8. |
| **`solid_cache`** | Sistema de cache distribuído em banco de dados para evitar requisições repetidas ao TMDB. |
| **`jwt`** | Assinatura e decodificação segura de tokens de sessão sem estado. |
| **`bcrypt` (~> 3.1.7)** | Mecanismo seguro de encriptação unidirecional para segurança adicional de chaves. |
| **`httparty`** | Cliente HTTP rápido para integração externa rápida com a API do TMDB. |
| **`rqrcode`** | Gerador e estruturador de imagens vetoriais (SVG) representativas de QR Codes. |
| **`blueprinter`** | Serializador JSON de alta performance, declarativo e rápido. |
| **`rack-cors`** | Configuração de políticas de compartilhamento de recursos entre origens no Rails. |

---

### 🧪 Qualidade & Testes (RSpec)

A suíte de testes de backend utiliza o ecossistema **RSpec** juntamente com mockups do **FactoryBot** para assegurar a confiabilidade matemática das transações de pontos, segurança dos ingressos e assertividade dos endpoints:

- **Model Specs (`spec/models/`):** Validam regras de integridade do usuário, comportamento atômico de ganho e resgate de pontos, lógica temporal dos ingressos e se os cálculos de expiração de check-in estão conformes.
- **Request Specs (`spec/requests/api/v1/`):** Simulam chamadas HTTP externas e validam permissões de login, interceptação de cabeçalhos expirados e consistência nas compras de ingressos.
- **Service Specs (`spec/services/`):** Testam o comportamento de encriptação dos tokens e geração de payloads de QR Codes.

Para executar os testes:
```bash
bundle exec rspec
```

---

<h2 align="center" id="frontend-arquitetura-da-interface">Frontend (Arquitetura da Interface)</h2>

O frontend é um aplicativo móvel cross-platform moderno e performático, desenvolvido em **React Native** com **Expo** em fluxo gerenciado (Managed Workflow) e tipado nativamente com **TypeScript**. A arquitetura foi estruturada para entregar uma experiência fluida.

---

### 🗺️ Roteamento & Estrutura de Telas

O roteamento utiliza o **Expo Router**, uma solução baseada em arquivos físicos que abstrai a complexidade do React Navigation tradicional:

```
src/app/
├── (auth)/                  → Grupo de telas de autenticação e boas-vindas
│   ├── _layout.tsx          → Layout e proteção de sessão do grupo
│   ├── login.tsx            → Entrada de conta acionada pelo Google OAuth
│   ├── preferences.tsx      → Configuração visual de gêneros favoritos
│   └── welcome.tsx          → Onboarding dinâmico com controle de slides
├── (tabs)/                  → Grupo principal com guias inferiores (Bottom Tabs)
│   ├── _layout.tsx          → Layout e ícones dinâmicos da navegação inferior
│   ├── index.tsx            → Home: saudações, estreias em carrossel e filmes em cartaz
│   ├── explore.tsx          → Exploração inteligente: busca, filtros e filmes favoritos
│   ├── wallet.tsx           → Carteira: exibição de ingressos, leitor virtual e check-in
│   └── profile.tsx          → Painel do usuário: progresso de pontuação e recompensas
├── movie/
│   └── [id].tsx             → Detalhes técnicos, trailer, elenco e compra simulada
└── _layout.tsx              → Ponto de entrada global: inicia Zustand, Tema e rotas
```

---

### 💾 Gerenciamento de Estado (Zustand Stores)

O gerenciamento de estado é simplificado e descentralizado usando **Zustand**, eliminando o boilerplate desnecessário do Redux e garantindo atualizações rápidas na UI:

1. **[Auth Store (auth.store.ts)](file:///home/b3rnard0p/ProjetosWSL/Synapse/Frontend/src/stores/auth.store.ts):** Monitora o status de login (`isAuthenticated`), mantém os metadados do usuário logado e lida com o login via Google OAuth salvando tokens na persistência segura.
2. **[Movies Store (movies.store.ts)](file:///home/b3rnard0p/ProjetosWSL/Synapse/Frontend/src/stores/movies.store.ts):** Controla o catálogo de filmes em cartaz e futuros lançamentos. Trata a paginação e o feedback visual de carregamento (`isLoading`).
3. **[Tickets Store (tickets.store.ts)](file:///home/b3rnard0p/ProjetosWSL/Synapse/Frontend/src/stores/tickets.store.ts):** Responsável por armazenar os ingressos ativos na carteira, simular compras chamando o backend, sincronizar os check-ins virtuais e atualizar o saldo de recompensas instantaneamente.
4. **[Theme Store (theme.store.ts)](file:///home/b3rnard0p/ProjetosWSL/Synapse/Frontend/src/stores/theme.store.ts):** Controla o modo de exibição ativo (claro ou escuro) e atualiza a paleta de cores de todas as telas em tempo real.

---

### 🎨 Estilização & Temas Dinâmicos

A identidade visual do Synapse foi projetada com foco em estética premium, utilizando uma paleta de cores moderna inspirada nas melhores plataformas de streaming (como Netflix e Prime Video):

- **Paleta de Cores (Colors):**
  - **Tom de Destaque:** Vermelho Carmim vibrante (`#be123c`, Rose 700) que remete à experiência clássica de cinema.
  - **Modo Escuro:** Base de cinza zinco ultramoderna (`#18181b` e `#27272a`), com textos em contraste total e bordas translúcidas, criando uma atmosfera imersiva.
  - **Modo Claro:** Base de cinza claro limpa (`#FAFAFA` e `#FFFFFF`), com tipografia zincada escura de excelente legibilidade e taxas de contraste adequadas.
- **Grades e Sombras:** Utilização de gradientes suaves (`LinearGradient` do Expo) para sobrepor textos a imagens de pôsteres e sombras flutuantes para botões de destaque.
- **Tipografia:** Estilos tipográficos modernos que garantem hierarquia textual consistente e legível em telas de qualquer tamanho.

---

### 🧩 Componentes da Interface

Para garantir o reuso de código e acelerar o desenvolvimento, a interface conta com componentes customizados de altíssimo padrão visual:

* **`AnimatedIcon`:** Micro-animações suaves para ícones das guias utilizando `react-native-reanimated`, criando respostas táteis e visuais ao toque do usuário.
* **`ThemedText` / `ThemedView`:** Componentes wrapper que escutam o estado global da `Theme Store` e aplicam cores e contrastes apropriados automaticamente, simplificando a implementação de Dark Mode em todo o app.
* **`TicketCard`:** Renderização premium de ingresso que imita o visual de um ticket físico de cinema, contendo picote lateral simulado com bordas recortadas, linha tracejada estilizada, pôster miniaturizado do filme e indicação de QR Code disponível.

---

### ⚙️ Execução & Compilação (Frontend)

O desenvolvimento móvel apoia-se no **Metro Bundler** fornecido pelo Expo. Para iniciar a aplicação em simuladores ou dispositivos físicos:

```bash
cd Frontend

# 1. Instalar as dependências NPM do projeto
npm install

# 2. Duplicar o exemplo de variáveis de ambiente
cp .env.example .env
```

Edite o arquivo `.env` para inserir os Client IDs gerados no console de desenvolvedores do Google Cloud:
```
EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID=seu_web_client_id.apps.googleusercontent.com
EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID=seu_ios_client_id.apps.googleusercontent.com
EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID=seu_android_client_id.apps.googleusercontent.com
```

Inicie o Metro Bundler para rodar o app:
```bash
# 3. Iniciar o servidor Expo de desenvolvimento
npm start
```

Pressione **`a`** no terminal para emular no Android, **`i`** para rodar no iOS (simulador no macOS) ou **`w`** para visualizar a versão web no navegador.

---

### 📦 Tecnologias & Dependências (Frontend)

O ecossistema móvel conta com dependências robustas que garantem estabilidade cross-platform:

| Biblioteca | Propósito e Uso Técnico |
| :--- | :--- |
| **`react-native` (0.83.6)** | Core do desenvolvimento de componentes móveis nativos. |
| **`expo` (~55.0.25)** | Conjunto de ferramentas essenciais para acesso a APIs nativas do celular. |
| **`expo-router`** | Roteador nativo de alta performance baseado em pastas e arquivos. |
| **`zustand`** | Gerenciamento de estado rápido, sem boilerplate e de baixíssimo consumo de memória. |
| **`axios`** | Cliente HTTP com interceptores globais automatizados para anexar JWT. |
| **`react-native-reanimated`** | Mecanismo de alta performance para micro-animações a 60fps na thread de UI. |
| **`react-native-qrcode-svg`** | Renderizador vetorial local de alta velocidade para os QR Codes de ingressos. |
| **`expo-secure-store`** | Persistência criptografada no chaveiro do sistema móvel (Keychain/KeyStore). |
| **`expo-image`** | Exibição de pôsteres com carregamento progressivo (blur hash) e cache em disco. |
| **`expo-linear-gradient`** | Criação de fundos em degradê de apelo visual sofisticado. |
| **`lucide-react-native`** | Biblioteca de ícones vetoriais em linhas finas e de estilo minimalista. |

---

### 🧪 Qualidade & Testes (Jest)

A validação da interface apoia-se na ferramenta de testes **Jest** integrada à biblioteca **React Native Testing Library**:

- **Testes de Renderização:** Asseguram que os componentes chave (como botões, cards e modais) se comportem como o esperado diante de diferentes estados temáticos.
- **Testes de Estado (Stores):** Simulam fluxos de login, adição de filmes e validações de check-in dentro das Zustand stores para garantir que os dados permaneçam íntegros sem depender de emulação de tela física.

Para rodar os testes móveis:
```bash
npm test
```

---

<h2 align="center" id="comandos-úteis">Comandos Úteis</h2>

Abaixo estão listados os comandos mais utilizados no fluxo cotidiano de desenvolvimento do Synapse:

### ⚙️ Backend (Rails API)

* **Iniciar o servidor de desenvolvimento:**
  ```bash
  cd Backend && rails server -p 3000
  ```
* **Executar a suíte de testes de integração e modelos (RSpec):**
  ```bash
  cd Backend && bundle exec rspec
  ```
* **Efetuar migração de banco e popular com dados de exemplo:**
  ```bash
  cd Backend && rails db:migrate && rails db:seed
  ```
* **Processar e iniciar a fila de background jobs (Solid Queue):**
  ```bash
  cd Backend && bin/jobs
  ```
* **Limpar tabelas temporárias e arquivos de cache local:**
  ```bash
  cd Backend && rails db:drop db:create db:migrate db:seed
  ```

### 📱 Frontend (React Native & Expo)

* **Iniciar o Metro Bundler com cache limpo:**
  ```bash
  cd Frontend && npm start -- --clear
  ```
* **Executar o app diretamente no emulador do Android conectado:**
  ```bash
  cd Frontend && npm run android
  ```
* **Executar o app diretamente no simulador iOS ativo:**
  ```bash
  cd Frontend && npm run ios
  ```
* **Executar a suíte completa de testes Jest:**
  ```bash
  cd Frontend && npm test
  ```
* **Rodar testes Jest gerando relatórios de cobertura de código:**
  ```bash
  cd Frontend && npm run test:coverage
  ```

---
<p align="center">Este código é de propriedade exclusiva de <b>@b3rnard0p</b></p>
