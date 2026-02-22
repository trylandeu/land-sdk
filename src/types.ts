export type LandChain = 'solana' | 'evm' | string;
export type LandProtocol = 'kamino' | 'aave-v3' | string;

export type SortOrder = 'asc' | 'desc';

export type ObligationsSortField =
  | 'total_collateral_value_usd'
  | 'total_borrow_value_usd'
  | 'as_of';

export type PositionsSortField =
  | 'current_value_usd'
  | 'current_amount'
  | 'as_of';

export type MarketsSortField =
  | 'symbol'
  | 'price_usd'
  | 'current_supply_rate'
  | 'current_borrow_rate_variable'
  | 'available_amount'
  | 'borrowed_amount'
  | 'as_of';

export type TokensSortField = 'symbol' | 'as_of';

export type PricesSortField = 'price_usd' | 'as_of';

export type HistoryEventsSortField = 'occurred_at';

export type HistoryPricesSortField = 'price_usd' | 'as_of';

export type HistoryRatesSortField = 'as_of';

export type HistoryWindowSortField = 'as_of';

export type JsonPrimitive = string | number | boolean | null;
export type JsonValue = JsonPrimitive | JsonObject | JsonValue[];
export interface JsonObject {
  [key: string]: JsonValue;
}

export interface LandBackendApiErrorBody {
  code?: string;
  message?: string;
  [key: string]: unknown;
}

export interface PagedResponse<TItem> {
  items: TItem[];
  limit: number;
  offset: number;
  total: number;
}

export interface AssetRef {
  token_id: string;
  symbol: string;
  decimals: number;
  logo_uri: string | null;
}

export interface WalletRef {
  chain: LandChain;
  address: string;
  external_user_id: string | null;
  metadata: Record<string, unknown>;
}

export type WalletTrackingStatus = 'seeded' | 'tracked' | 'not_tracked_yet';

export interface CoverageResponse {
  coverage_mode: 'full' | 'forward_only' | string;
  coverage_start_slot: number | null;
  coverage_start_block: number | null;
  wallet_tracking_status: WalletTrackingStatus;
  first_tracked_at: string | null;
}

export interface WalletSummaryMetrics {
  total_collateral_value_usd: number;
  total_borrow_value_usd: number;
  effective_ltv: number | null;
  number_of_obligations: number;
  protocols: string[];
}

export interface WalletSummaryResponse {
  wallet: WalletRef;
  summary: WalletSummaryMetrics;
  coverage: CoverageResponse;
  outcome: string | null;
}

export interface ObligationView {
  id: string;
  protocol: LandProtocol;
  protocol_obligation_ref: string;
  pool_ref: string;
  status: string;
  protocol_health_factor: number | null;
  backend_health_score: number | null;
  total_collateral_value_usd: number;
  total_borrow_value_usd: number;
  net_value_usd: number;
  effective_ltv: number | null;
  max_borrowable_value_usd: number;
  liquidation_threshold_ltv: number | null;
  liquidation_buffer: number | null;
  ltv_model_version: string;
  last_protocol_sync_at: string;
  as_of: string;
}

export interface PositionView {
  id: string;
  obligation_id: string;
  market_id: string;
  type: 'supply' | 'borrow' | string;
  rate_mode: string;
  asset: AssetRef;
  principal_amount: string;
  current_amount: string;
  current_value_usd: number | null;
  ltv_contribution: number | null;
  liquidation_buffer: number | null;
  supply_apy: number | null;
  borrow_apy_variable: number | null;
  as_of: string;
}

export interface WalletObligationsResponse {
  wallet: WalletRef;
  obligations: ObligationView[];
  limit: number;
  offset: number;
  total: number;
  coverage: CoverageResponse;
  outcome: string | null;
}

export interface WalletPositionsResponse {
  wallet: WalletRef;
  positions: PositionView[];
  limit: number;
  offset: number;
  total: number;
  coverage: CoverageResponse;
  outcome: string | null;
}

export interface WalletLendingSummaryResponse {
  obligation: ObligationView;
  deposits: PositionView[];
  borrows: PositionView[];
  total_collateral_value_usd: number;
  total_borrow_value_usd: number;
  net_value_usd: number;
  effective_ltv: number | null;
  health_factor: number | null;
  max_borrowable_value_usd: number;
  coverage: CoverageResponse;
  outcome: string | null;
}

export interface ObligationIdentity {
  id: string;
  chain: LandChain;
  protocol: LandProtocol;
  protocol_obligation_ref: string;
  pool_ref: string;
  wallet_address: string;
}

export interface ObligationRiskView {
  protocol_health_factor: number | null;
  backend_health_score: number | null;
  total_collateral_value_usd: number;
  total_borrow_value_usd: number;
  effective_ltv: number | null;
  max_borrowable_value_usd: number;
  liquidation_threshold_ltv: number | null;
  liquidation_buffer: number | null;
  ltv_model_version: string;
  as_of: string;
}

export interface ObligationRiskResponse {
  obligation: ObligationIdentity;
  risk: ObligationRiskView;
  coverage: CoverageResponse;
  outcome: string | null;
}

export interface HealthResponse {
  status: string;
  timestamp: string;
  detail: string | null;
}

export interface IdentityResponse {
  tenant_id: string;
  caller_id: string;
}

export interface MarketView {
  id: string;
  chain: LandChain;
  protocol: LandProtocol;
  protocol_market_ref: string;
  pool_ref: string;
  underlying_token: AssetRef;
  collateral_factor: number | null;
  liquidation_threshold: number | null;
  liquidation_bonus: number | null;
  borrow_cap: string | null;
  supply_cap: string | null;
  is_isolated: boolean;
  rate_mode_support: string[];
  oracle_source: string | null;
  current_supply_rate: number | null;
  current_borrow_rate_variable: number | null;
  utilization: number | null;
  price_usd: number | null;
  available_amount: string;
  borrowed_amount: string;
  available_amount_display: number | null;
  borrowed_amount_display: number | null;
  as_of: string;
  lending_market_name: string | null;
  emergency_mode: boolean | null;
  borrow_disabled: boolean | null;
}

export interface TokenView {
  id: string;
  chain: LandChain;
  address_or_mint: string;
  symbol: string;
  name: string;
  decimals: number;
  logo_uri: string | null;
  price_feed_id: string;
  is_stablecoin: boolean;
  risk_flags: string[];
  as_of: string;
}

export interface PriceView {
  price_feed_id: string;
  asset_token_id: string;
  price_usd: number;
  source: string;
  as_of: string;
  staleness_seconds: number;
}

export interface HistoryEventView {
  event_id: string;
  event_type: string;
  chain: LandChain;
  protocol: LandProtocol;
  subscription_id: string | null;
  occurred_at: string;
  action: string | null;
  signature: string | null;
  slot: number | null;
  payload: JsonValue;
}

export interface PriceTickView {
  price_feed_id: string;
  asset_token_id: string;
  chain: LandChain;
  protocol: LandProtocol;
  price_usd: number;
  as_of: string;
}

export interface HistoryRateView {
  market_id: string;
  chain: LandChain;
  protocol: LandProtocol;
  supply_apy: number;
  borrow_apy_variable: number;
  utilization: number;
  as_of: string;
}

export interface ObligationHistoryPoint {
  obligation_id: string;
  backend_health_score: number;
  effective_ltv: number;
  total_collateral_value_usd: number;
  total_borrow_value_usd: number;
  as_of: string;
}

export interface PositionHistoryPoint {
  position_id: string;
  obligation_id: string;
  market_id: string;
  position_type: string;
  asset: AssetRef | null;
  principal_amount: string;
  current_amount: string;
  current_value_usd: number;
  as_of: string;
}

export interface WebhookSubscriptionView {
  id: string;
  event_type: string;
  filters: JsonValue;
  callback_url: string;
  auth_config: JsonValue;
  max_retry_window: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface WebhookSubscriptionResponse {
  subscription: WebhookSubscriptionView;
}

export interface WebhookEventView {
  event_id: string;
  event_type: string;
  chain: LandChain;
  protocol: LandProtocol;
  occurred_at: string;
  subscription_id: string;
  payload: JsonValue;
  as_of: string;
}

export interface WebhookDeliveryAttemptView {
  delivery_id: string;
  attempt_number: number;
  status_code: number | null;
  success: boolean;
  sent_at: string;
  completed_at: string | null;
  response_body: string | null;
}

export interface WebhookEventResponse {
  event: WebhookEventView;
  deliveries: WebhookDeliveryAttemptView[];
}

export interface WalletPathParams {
  chain: LandChain;
  address: string;
}

export interface WalletObligationsQuery {
  pool_ref?: string;
  sort?: ObligationsSortField;
  order?: SortOrder;
  limit?: number;
  offset?: number;
}

export interface WalletPositionsQuery {
  pool_ref?: string;
  asset?: string;
  type?: 'supply' | 'borrow';
  sort?: PositionsSortField;
  order?: SortOrder;
  limit?: number;
  offset?: number;
}

export interface WalletLendingSummaryQuery {
  pool_ref: string;
}

export interface MarketsQuery {
  chain?: LandChain;
  protocol?: LandProtocol;
  asset?: string;
  pool_ref?: string;
  sort?: MarketsSortField;
  order?: SortOrder;
  limit?: number;
  offset?: number;
}

export interface TokensQuery {
  chain?: LandChain;
  symbol?: string;
  address_or_mint?: string;
  sort?: TokensSortField;
  order?: SortOrder;
  limit?: number;
  offset?: number;
}

export interface PricesQuery {
  chain?: LandChain;
  asset_token_id?: string;
  price_feed_id?: string;
  sort?: PricesSortField;
  order?: SortOrder;
  limit?: number;
  offset?: number;
}

export interface HistoryEventsQuery {
  chain?: LandChain;
  protocol?: LandProtocol;
  event_type?: string;
  action?: string;
  wallet_address?: string;
  market_address?: string;
  asset?: string;
  asset_token_id?: string;
  since?: string;
  until?: string;
  sort?: HistoryEventsSortField;
  order?: SortOrder;
  limit?: number;
  offset?: number;
}

export interface HistoryPricesQuery {
  chain?: LandChain;
  protocol?: LandProtocol;
  asset_token_id?: string;
  price_feed_id?: string;
  since?: string;
  until?: string;
  sort?: HistoryPricesSortField;
  order?: SortOrder;
  limit?: number;
  offset?: number;
}

export type HistoryRatesFrequency = 'minute' | 'hour' | 'day';

export interface HistoryRatesQuery {
  chain?: LandChain;
  protocol?: LandProtocol;
  market_id?: string;
  market_address?: string;
  asset?: string;
  asset_token_id?: string;
  frequency?: HistoryRatesFrequency;
  since?: string;
  until?: string;
  sort?: HistoryRatesSortField;
  order?: SortOrder;
  limit?: number;
  offset?: number;
}

export interface HistoryWindowQuery {
  since?: string;
  until?: string;
  sort?: HistoryWindowSortField;
  order?: SortOrder;
  limit?: number;
  offset?: number;
}

export interface WebhookSubscriptionsQuery {
  active?: boolean;
  limit?: number;
  offset?: number;
}

export interface CreateWebhookSubscriptionRequest {
  event_type: string;
  filters?: JsonValue;
  callback_url: string;
  auth_config?: JsonValue;
  max_retry_window?: number;
  is_active?: boolean;
}

export interface UpdateWebhookSubscriptionRequest {
  event_type?: string;
  filters?: JsonValue;
  callback_url?: string;
  auth_config?: JsonValue;
  max_retry_window?: number;
  is_active?: boolean;
}
