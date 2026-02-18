import type {
  CreateWebhookSubscriptionRequest,
  HealthResponse,
  HistoryEventsQuery,
  HistoryEventView,
  HistoryPricesQuery,
  HistoryWindowQuery,
  HistoryRatesQuery,
  HistoryRateView,
  IdentityResponse,
  LandBackendApiErrorBody,
  MarketView,
  MarketsQuery,
  PagedResponse,
  PriceTickView,
  PricesQuery,
  PriceView,
  ObligationHistoryPoint,
  ObligationRiskResponse,
  PositionHistoryPoint,
  TokenView,
  TokensQuery,
  UpdateWebhookSubscriptionRequest,
  WebhookEventResponse,
  WebhookSubscriptionResponse,
  WebhookSubscriptionsQuery,
  WebhookSubscriptionView,
  WalletLendingSummaryQuery,
  WalletLendingSummaryResponse,
  WalletObligationsQuery,
  WalletObligationsResponse,
  WalletPathParams,
  WalletPositionsQuery,
  WalletPositionsResponse,
  WalletSummaryResponse,
} from './types.js';

export interface CreateLandBackendClientOptions {
  baseUrl: string;
  timeout?: number;
  defaultHeaders?: Record<string, string>;
  fetchImpl?: typeof fetch;
}

export class LandBackendApiError extends Error {
  readonly status: number;
  readonly code: string | null;
  readonly body: unknown;

  constructor(params: { message: string; status: number; code?: string | null; body?: unknown }) {
    super(params.message);
    this.name = 'LandBackendApiError';
    this.status = params.status;
    this.code = params.code ?? null;
    this.body = params.body;
  }
}

type QueryValue = string | number | boolean | null | undefined;

function toQueryString(params?: object): string {
  if (!params) {
    return '';
  }

  const searchParams = new URLSearchParams();
  const entries = Object.entries(params as Record<string, QueryValue>);
  for (const [key, value] of entries) {
    if (value === undefined || value === null || value === '') {
      continue;
    }
    searchParams.append(key, String(value));
  }

  const qs = searchParams.toString();
  return qs ? `?${qs}` : '';
}

function readErrorMessage(parsed: unknown, status: number): { message: string; code: string | null } {
  if (parsed && typeof parsed === 'object') {
    const body = parsed as LandBackendApiErrorBody;
    const message =
      typeof body.message === 'string' && body.message.length > 0
        ? body.message
        : `Request failed with status ${status}`;
    const code = typeof body.code === 'string' ? body.code : null;
    return { message, code };
  }

  return { message: `Request failed with status ${status}`, code: null };
}

function joinPath(baseUrl: string, path: string): string {
  if (!baseUrl) {
    return path;
  }

  if (baseUrl.endsWith('/') && path.startsWith('/')) {
    return `${baseUrl.slice(0, -1)}${path}`;
  }
  if (!baseUrl.endsWith('/') && !path.startsWith('/')) {
    return `${baseUrl}/${path}`;
  }
  return `${baseUrl}${path}`;
}

export interface LandBackendClient {
  healthz(): Promise<HealthResponse>;
  readyz(): Promise<HealthResponse>;
  getAuthContext(): Promise<IdentityResponse>;
  getWalletSummary(params: WalletPathParams): Promise<WalletSummaryResponse>;
  listWalletObligations(params: {
    chain: WalletPathParams['chain'];
    address: string;
    query?: WalletObligationsQuery;
  }): Promise<WalletObligationsResponse>;
  listWalletPositions(params: {
    chain: WalletPathParams['chain'];
    address: string;
    query?: WalletPositionsQuery;
  }): Promise<WalletPositionsResponse>;
  getWalletLendingSummary(params: {
    chain: WalletPathParams['chain'];
    address: string;
    query: WalletLendingSummaryQuery;
  }): Promise<WalletLendingSummaryResponse>;
  getObligationRisk(obligationId: string): Promise<ObligationRiskResponse>;
  listMarkets(query?: MarketsQuery): Promise<PagedResponse<MarketView>>;
  getMarket(id: string): Promise<MarketView>;
  listTokens(query?: TokensQuery): Promise<PagedResponse<TokenView>>;
  listPrices(query?: PricesQuery): Promise<PagedResponse<PriceView>>;
  listHistoryEvents(query?: HistoryEventsQuery): Promise<PagedResponse<HistoryEventView>>;
  listHistoryPrices(query?: HistoryPricesQuery): Promise<PagedResponse<PriceTickView>>;
  listHistoryRates(query?: HistoryRatesQuery): Promise<PagedResponse<HistoryRateView>>;
  listObligationHistory(
    obligationId: string,
    query?: HistoryWindowQuery,
  ): Promise<PagedResponse<ObligationHistoryPoint>>;
  listPositionHistory(
    positionId: string,
    query?: HistoryWindowQuery,
  ): Promise<PagedResponse<PositionHistoryPoint>>;
  createWebhookSubscription(
    request: CreateWebhookSubscriptionRequest,
  ): Promise<WebhookSubscriptionResponse>;
  listWebhookSubscriptions(
    query?: WebhookSubscriptionsQuery,
  ): Promise<PagedResponse<WebhookSubscriptionView>>;
  getWebhookSubscription(subscriptionId: string): Promise<WebhookSubscriptionResponse>;
  updateWebhookSubscription(
    subscriptionId: string,
    request: UpdateWebhookSubscriptionRequest,
  ): Promise<WebhookSubscriptionResponse>;
  getWebhookEvent(eventId: string): Promise<WebhookEventResponse>;
}

export function createLandBackendClient(
  options: CreateLandBackendClientOptions,
): LandBackendClient {
  const {
    baseUrl,
    timeout = 30000,
    defaultHeaders = {},
    fetchImpl = fetch,
  } = options;

  async function requestJson<TResponse>(
    path: string,
    init?: RequestInit,
  ): Promise<TResponse> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    let response: Response;
    try {
      response = await fetchImpl(joinPath(baseUrl, path), {
        ...init,
        signal: controller.signal,
        headers: {
          Accept: 'application/json',
          ...defaultHeaders,
          ...(init?.headers ?? {}),
        },
      });
    } catch (error) {
      clearTimeout(timeoutId);
      if (error instanceof Error && error.name === 'AbortError') {
        throw new LandBackendApiError({
          message: `Request timeout after ${timeout}ms`,
          status: 408,
        });
      }
      throw error;
    }

    clearTimeout(timeoutId);

    const rawBody = await response.text();
    const parsedBody = rawBody ? safeJsonParse(rawBody) : null;

    if (!response.ok) {
      const { message, code } = readErrorMessage(parsedBody, response.status);
      throw new LandBackendApiError({
        message,
        status: response.status,
        code,
        body: parsedBody ?? rawBody,
      });
    }

    return (parsedBody ?? null) as TResponse;
  }

  return {
    async healthz() {
      return requestJson<HealthResponse>('/healthz');
    },

    async readyz() {
      return requestJson<HealthResponse>('/readyz');
    },

    async getAuthContext() {
      return requestJson<IdentityResponse>('/auth/context');
    },

    async getWalletSummary({ chain, address }) {
      return requestJson<WalletSummaryResponse>(
        `/wallets/${encodeURIComponent(chain)}/${encodeURIComponent(address)}`,
      );
    },

    async listWalletObligations({ chain, address, query }) {
      return requestJson<WalletObligationsResponse>(
        `/wallets/${encodeURIComponent(chain)}/${encodeURIComponent(address)}/obligations${toQueryString(
          query,
        )}`,
      );
    },

    async listWalletPositions({ chain, address, query }) {
      return requestJson<WalletPositionsResponse>(
        `/wallets/${encodeURIComponent(chain)}/${encodeURIComponent(address)}/positions${toQueryString(
          query,
        )}`,
      );
    },

    async getWalletLendingSummary({ chain, address, query }) {
      return requestJson<WalletLendingSummaryResponse>(
        `/wallets/${encodeURIComponent(chain)}/${encodeURIComponent(address)}/summary${toQueryString(
          query,
        )}`,
      );
    },

    async getObligationRisk(obligationId) {
      return requestJson<ObligationRiskResponse>(
        `/obligations/${encodeURIComponent(obligationId)}/risk`,
      );
    },

    async listMarkets(query) {
      return requestJson<PagedResponse<MarketView>>(`/markets${toQueryString(query)}`);
    },

    async getMarket(id) {
      return requestJson<MarketView>(`/markets/${encodeURIComponent(id)}`);
    },

    async listTokens(query) {
      return requestJson<PagedResponse<TokenView>>(`/tokens${toQueryString(query)}`);
    },

    async listPrices(query) {
      return requestJson<PagedResponse<PriceView>>(`/prices${toQueryString(query)}`);
    },

    async listHistoryEvents(query) {
      return requestJson<PagedResponse<HistoryEventView>>(
        `/history/events${toQueryString(query)}`,
      );
    },

    async listHistoryPrices(query) {
      return requestJson<PagedResponse<PriceTickView>>(
        `/history/prices${toQueryString(query)}`,
      );
    },

    async listHistoryRates(query) {
      return requestJson<PagedResponse<HistoryRateView>>(
        `/history/rates${toQueryString(query)}`,
      );
    },

    async listObligationHistory(obligationId, query) {
      return requestJson<PagedResponse<ObligationHistoryPoint>>(
        `/history/obligations/${encodeURIComponent(obligationId)}${toQueryString(query)}`,
      );
    },

    async listPositionHistory(positionId, query) {
      return requestJson<PagedResponse<PositionHistoryPoint>>(
        `/history/positions/${encodeURIComponent(positionId)}${toQueryString(query)}`,
      );
    },

    async createWebhookSubscription(request) {
      return requestJson<WebhookSubscriptionResponse>('/webhooks/subscriptions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      });
    },

    async listWebhookSubscriptions(query) {
      return requestJson<PagedResponse<WebhookSubscriptionView>>(
        `/webhooks/subscriptions${toQueryString(query)}`,
      );
    },

    async getWebhookSubscription(subscriptionId) {
      return requestJson<WebhookSubscriptionResponse>(
        `/webhooks/subscriptions/${encodeURIComponent(subscriptionId)}`,
      );
    },

    async updateWebhookSubscription(subscriptionId, request) {
      return requestJson<WebhookSubscriptionResponse>(
        `/webhooks/subscriptions/${encodeURIComponent(subscriptionId)}`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(request),
        },
      );
    },

    async getWebhookEvent(eventId) {
      return requestJson<WebhookEventResponse>(
        `/webhooks/events/${encodeURIComponent(eventId)}`,
      );
    },
  };
}

function safeJsonParse(value: string): unknown {
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
}
