# MoneyMap 💰

O **MoneyMap** é uma aplicação de gestão financeira pessoal avançada, projetada para monitorizar património líquido, investimentos, despesas e automação financeira.

## 🏗️ Arquitetura do Projeto

O projeto segue uma arquitetura cliente-servidor moderna:

*   **Frontend (`MoneyMap_Frontend`)**: SPA construída com Next.js 14+ (App Router).
*   **Backend (`MoneyMap_Backend`)**: API REST em FastAPI (Python) com PostgreSQL.
*   **Infraestrutura**: Docker e Docker Compose.

## 🚀 Tecnologias Utilizadas

### Frontend
*   **Framework**: Next.js (React) com TypeScript.
*   **Estado & Cache**: TanStack Query (React Query) v5.
*   **Estilos**: Tailwind CSS para design responsivo e mobile-first.
*   **Visualização de Dados**: Recharts (Gráficos de Linha, Área, Pizza).
*   **Ícones**: Heroicons / SVG.

### Infraestrutura (Backend)
*   **Base de Dados**: PostgreSQL 15.
*   **API**: FastAPI (Python).

## ⚙️ Configuração e Instalação

### Pré-requisitos
*   Node.js (v18+)
*   Docker e Docker Compose

### 1. Iniciar o Frontend

1.  Navegue até à pasta do frontend:
    ```bash
    cd MoneyMap_Frontend
    ```
2.  Instale as dependências:
    ```bash
    npm install
    ```
3.  Inicie o servidor de desenvolvimento:
    ```bash
    npm run dev
    ```
4.  Aceda a `http://localhost:3000`.

## 📊 Funcionalidades Principais

### 1. Dashboard (`/`)
*   **Resumo Financeiro**: Património Total, Liquidez e Total Investido.
*   **Evolução Patrimonial**: Gráfico de longo prazo com eixo duplo (Património vs Fluxo de Caixa) e filtros inteligentes (6M, YTD, 1A, Tudo).
*   **Gestão de Ativos**: Tabela consolidada de investimentos com **edição manual de preços** em tempo real.
*   **Smart Shopping**: Widget de análise de compras (Preço/Unidade) com bloqueio Freemium.

### 2. Transações (`/transactions`)
*   **Extrato Completo**: Tabela paginada com ordenação e filtros avançados.
*   **Filtros Granulares**: Filtragem por Categoria, Subcategoria, Tipo e **Tags**.
*   **Visualização**: Chips coloridos para Tags e suporte a Subcategorias.
*   **Nova Transação**: Formulário inteligente que deteta investimentos e suporta recorrência.

### 3. Ferramentas Financeiras (`/calculator`) 🛠️
*   **Calculadora de Juros Compostos**: Simulação de crescimento de investimento com aportes mensais.
*   **Calculadora de Fundo de Emergência**: Análise de gastos essenciais para definir metas de poupança (3 a 12 meses).
*   *Nota: Funcionalidades protegidas pelo sistema Freemium.*

### 4. Centro de Controlo (`/settings`)
*   **Gestão de Contas**: Criar e apagar contas bancárias/investimento.
*   **Categorias**: Gestão hierárquica de categorias e subcategorias.
*   **Tags 🏷️**: Criação e gestão de etiquetas coloridas para organização transversal.
*   **Regras de Automação 🤖**: Criar regras para categorizar transações automaticamente.
*   **Dados 💾**:
    *   **Importação**: Upload de ficheiros CSV/Excel com deteção de conta.
    *   **Exportação**: Download de todo o histórico em CSV.

### 5. Área de Admin (`/admin`)
*   *Acesso restrito a utilizadores com role 'admin'.*
*   **Métricas**: Total de utilizadores e transações.
*   **Gestão de Utilizadores**: Listagem e alteração de permissões (Básico/Premium/Admin).

### 6. UX & Design
*   **Layout Híbrido**: Sidebar fixa para Desktop e Bottom Navigation para Mobile.
*   **Multi-Moeda**: Suporte dinâmico para EUR, USD, GBP e BRL (configurável no perfil).
*   **Modo Escuro**: Suporte nativo a Dark Mode.
*   **Notificações**: Sistema de Toasts centralizado para feedback de ações (Sucesso/Erro/Aviso).
*   **Freemium**: Bloqueio visual elegante (Blur + Modal Global) para funcionalidades Premium, incentivando o upgrade sem esconder a funcionalidade.

## 🔌 Integração com API

O frontend comunica com a API em `http://127.0.0.1:8000`.

**Endpoints Principais:**
*   `/portfolio`: Resumo e posições.
*   `/transactions`: CRUD de transações (paginado).
*   `/calculators/*`: Ferramentas de cálculo financeiro.
*   `/analytics/*`: Dados para gráficos e análises.
*   `/admin/*`: Endpoints de administração.

**Autenticação**: JWT (Bearer Token) armazenado no `localStorage`.