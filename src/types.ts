export interface SubscriptionPlan {
    name: string;
    daily_balance: number;
    weekly_limit: number;
}

export interface Team {
    name: string;
    daily_balance: number;
    per_user_daily_balance: number;
    weekly_limit: number;
}

export interface TeamMembership {
    current_week_spend: number;
    daily_subscription_spending: number;
    expires_at: string;
    last_week_reset: string;
    team_api_key: string;
    team_name: string;
}

export interface ProfileResponse {
    subscription_balance: number;
    pay_as_you_go_balance: number;
    current_week_spend: number;
    subscription_plan: SubscriptionPlan | null;
    balance_preference: string;
    last_week_reset: string;
    subscription_expiry: string | null;
    current_team?: Team | null;
    team_membership?: TeamMembership;
}

export interface BalanceResult {
    type: 'daily' | 'weekly' | 'payGo';
    percentage: number;
    displayText: string;
    tooltip: string;
}

// Provider Types
export interface Provider {
    id: number;
    type: string;
    name: string;
    display_name: string;
    description: string;
    api_url?: string;
    api_key?: string;
    is_enabled: boolean;
    sort_order: number;
    rate_multiplier: number;
    is_payg_default: boolean;
    created_at: string;
    updated_at: string;
}

export interface ProviderInfo {
    provider: Provider;
    rate_multiplier: number;
    is_default: boolean;
    source: string; // "team" | "payg" | "subscription" | ""
}

export interface AvailableProviderResponse {
    has_payg_balance: boolean;
    has_subscription: boolean;
    is_team_member: boolean;
    providers: ProviderInfo[];
}

export interface ProviderAlternative {
    id: number;
    user_id?: number;
    provider_id: number;
    alternative_id: number;
    alternative: Provider;
    display_name: string;
    is_self: boolean;
    priority: number;
    created_at: string;
    updated_at: string;
}

export interface ProviderAlternativesResponse {
    data: ProviderAlternative[];
}

export interface ProviderSelection {
    id: number;
    user_id: number;
    provider_id: number;
    selected_alternative_id: number;
    selected_alternative: Provider;
    created_at: string;
    updated_at: string;
}

export interface ProviderSelectionResponse {
    data: ProviderSelection;
}

// Team Provider Types
export interface TeamProviderAlternative {
    id: number;
    team_provider_config_id?: number;
    alternative_provider_id: number;
    alternative_provider: Provider;
    display_name: string;
    priority: number;
    provider_type: string;
    created_at: string;
    updated_at: string;
}

export interface TeamProviderAlternativesResponse {
    data: TeamProviderAlternative[];
    provider_type: string;
}

export interface TeamProviderSelection {
    id: number;
    user_id: number;
    team_provider_config_id?: number | null;
    provider_type: string;
    selected_provider_id: number;
    selected_provider: Provider;
    created_at: string;
    updated_at: string;
}

export interface TeamProviderSelectionResponse {
    data: TeamProviderSelection | null;
}
