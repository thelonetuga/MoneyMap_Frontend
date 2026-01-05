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

### 2. Transações (`/transactions`)
*   **Extrato Completo**: Tabela paginada com ordenação e filtros.
*   **Nova Transação**: Formulário inteligente que deteta investimentos (compra/venda de ativos) e valida datas.

### 3. Centro de Controlo (`/settings`)
*   **Gestão de Contas**: Criar e apagar contas bancárias/investimento.
*   **Categorias**: Gestão hierárquica de categorias e subcategorias.
*   **Regras de Automação 🤖**: Criar regras para categorizar transações automaticamente com base na descrição.
*   **Dados 💾**:
    *   **Importação**: Upload de ficheiros CSV/Excel com deteção de conta.
    *   **Exportação**: Download de todo o histórico em CSV.
    *   **Template**: Gerador de templates de importação com exemplos reais.

### 4. Área de Admin (`/admin`)
*   *Acesso restrito a utilizadores com role 'admin'.*
*   **Métricas**: Total de utilizadores e transações.
*   **Gestão de Utilizadores**: Listagem e alteração de permissões (Básico/Premium/Admin).

### 5. Mobile Experience 📱
*   **Bottom Navigation**: Barra de navegação inferior para fácil acesso em telemóveis.
*   **Layout Responsivo**: Gráficos e tabelas adaptáveis a ecrãs pequenos.

## 🔌 Integração com API

O frontend comunica com a API em `http://127.0.0.1:8000`.

**Endpoints Principais:**
*   `/portfolio`: Resumo e posições.
*   `/transactions`: CRUD de transações (paginado).
*   `/analytics/evolution`: Dados para gráficos.
*   `/rules`: Regras de automação.
*   `/admin/*`: Endpoints de administração.

**Autenticação**: JWT (Bearer Token) armazenado no `localStorage`.