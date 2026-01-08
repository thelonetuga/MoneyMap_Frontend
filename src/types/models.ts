// --- 1. SCHEMAS AUXILIARES (Lookups) ---
export interface Token {
  access_token: string;
  token_type: string;
}

export interface AccountTypeBase {
  name: string;
}

export interface AccountTypeResponse extends AccountTypeBase {
  id: number;
}

export interface TransactionTypeBase {
  name: string;
  is_investment: boolean;
}

export interface TransactionTypeResponse extends TransactionTypeBase {
  id: number;
}

// --- 2. PERFIL E UTILIZADOR ---

export interface UserProfileBase {
  first_name?: string | null;
  last_name?: string | null;
  preferred_currency: string;
}

export interface UserProfileCreate extends UserProfileBase {}

export interface UserProfileResponse extends UserProfileBase {
  id: number;
  user_id: number;
}

export interface UserBase {
  email: string;
}

export interface UserCreate extends UserBase {
  password: string;
  profile?: UserProfileCreate | null;
}

export interface UserUpdate {
  first_name?: string | null;
  last_name?: string | null;
  preferred_currency?: string | null;
  password?: string | null;
}

export interface UserResponse extends UserBase {
  id: number;
  created_at: string; // datetime
  role: string;
  is_active: boolean;
  profile?: UserProfileResponse | null;
}

// --- 3. CATEGORIAS ---

export interface SubCategoryBase {
  name: string;
}

export interface SubCategoryCreate extends SubCategoryBase {
  category_id: number;
}

export interface SubCategoryResponse extends SubCategoryBase {
  id: number;
  category_id: number;
}

export interface CategoryBase {
  name: string;
}

export interface CategoryCreate extends CategoryBase {}

export interface CategoryResponse extends CategoryBase {
  id: number;
  user_id?: number | null;
  subcategories: SubCategoryResponse[];
}

// --- 4. ATIVOS (ASSETS) ---

export interface AssetBase {
  symbol: string;
  name: string;
  asset_type: string;
}

export interface AssetCreate extends AssetBase {}

export interface AssetResponse extends AssetBase {
  id: number;
}

// --- 5. CONTAS ---

export interface AccountBase {
  name: string;
  current_balance: number;
}

export interface AccountCreate extends AccountBase {
  account_type_id: number;
}

export interface AccountResponse extends AccountBase {
  id: number;
  user_id: number;
  account_type?: AccountTypeResponse | null;
}

// --- 6. HOLDINGS (Carteira) ---

export interface HoldingBase {
  quantity: number;
  avg_buy_price: number;
}

export interface HoldingResponse extends HoldingBase {
  id: number;
  account_id: number;
  asset: AssetResponse;
}

// --- 7. TRANSAÇÕES ---

export interface TransactionBase {
  date: string; // date YYYY-MM-DD
  description: string;
  amount: number;
  
  // Campos de Investimento e Smart Shopping
  quantity?: number | null;
  price_per_unit?: number | null;
  symbol?: string | null;
  measurement_unit?: string | null; // NOVO: kg, l, un
}

export interface TransactionCreate extends TransactionBase {
  account_id: number;
  transaction_type_id: number;
  
  category_id?: number | null;
  sub_category_id?: number | null;
  asset_id?: number | null;
}

export interface TransactionResponse extends TransactionBase {
  id: number;
  account_id: number;
  
  transaction_type_id: number;
  category_id?: number | null;
  sub_category_id?: number | null;
  asset_id?: number | null;

  // Objetos Aninhados
  transaction_type: TransactionTypeResponse;
  category?: CategoryResponse | null;
  sub_category?: SubCategoryResponse | null;
  asset?: AssetResponse | null;
  account: AccountResponse;
}

// --- 8. RELATÓRIOS ---

export interface PortfolioPosition {
  symbol: string;
  quantity: number;
  avg_buy_price: number;
  current_price: number;
  total_value: number;
  profit_loss: number;
}

export interface PortfolioResponse {
  user_id: number;
  total_net_worth: number;
  total_cash: number;
  total_invested: number;
  positions: PortfolioPosition[];
}

export interface HistoryPoint {
  date: string;
  value: number;
}

export interface SpendingItem {
  name: string;
  value: number;
  [key: string]: any; // Assinatura de índice para Recharts
}

export interface EvolutionPoint {
  period: string;       // ex: "2023", "2023-Q1", "Jan 2024"
  net_worth: number;    // Património acumulado no final do período
  liquid_cash: number;  // NOVO: Apenas contas bancárias
  expenses: number;     // Total gasto nesse período
  income: number;       // Total ganho nesse período
  savings_rate: number; // % de poupança (0 a 100)
}

// --- 9. PAGINAÇÃO ---

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  size: number;
  pages: number;
}

export interface TransactionQueryParams {
  page?: number;
  size?: number;
  sort_by?: 'date_desc' | 'date_asc' | 'amount_desc' | 'amount_asc';
  // Novos Filtros
  category_id?: number;
  account_id?: number;
  transaction_type_id?: number;
  start_date?: string;
  end_date?: string;
}

// --- 10. SMART SHOPPING ---
export interface SmartShoppingAnalysis {
  avg_price_per_unit: number;
  savings: number;
  history_count: number;
}

export interface SmartShoppingItem {
  item_name: string;
  total_savings: number;
  purchase_count: number;
}

export interface SmartShoppingSummary {
  total_savings: number;
  items: SmartShoppingItem[];
  // Paginação
  total: number;
  page: number;
  size: number;
  pages: number;
}
