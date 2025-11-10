export interface SubscriptionPlan {
    daily_balance: number;
    weekly_limit: number;
    name: string;
}

export interface ProfileResponse {
    subscription_balance: number;
    pay_as_you_go_balance: number;
    current_week_spend: number;
    subscription_plan: SubscriptionPlan;
    balance_preference: string;
    last_week_reset: string;
    subscription_expiry: string;
}

export interface BalanceResult {
    type: 'daily' | 'weekly' | 'payGo';
    percentage: number;
    displayText: string;
    tooltip: string;
}
