import { ProfileResponse, BalanceResult } from './types';
import { formatDate, calculateNextReset, getDaysUntil } from './utils';

export function calculateCriticalBalance(data: ProfileResponse): BalanceResult {
    const {
        subscription_balance,
        pay_as_you_go_balance,
        current_week_spend,
        subscription_plan,
        balance_preference,
        last_week_reset,
        subscription_expiry
    } = data;

    const nextReset = calculateNextReset(last_week_reset);
    const resetDate = new Date(last_week_reset);
    resetDate.setDate(resetDate.getDate() + 7);
    const resetRelative = getDaysUntil(resetDate.toISOString());
    const expiryDate = formatDate(subscription_expiry);
    const expiryRelative = getDaysUntil(subscription_expiry);

    if (balance_preference === 'payg_only') {
        const tooltip = [
            `Plan: ${subscription_plan.name}`,
            `Daily: N/A (PayGo Only Mode)`,
            `Weekly: N/A (PayGo Only Mode)`,
            `Reset: ${nextReset} (${resetRelative})`,
            `Expiry: ${expiryDate} (${expiryRelative})`,
            `PayGo: $${pay_as_you_go_balance.toFixed(2)}`,
            ``,
            'Click to refresh'
        ].join('\n');

        return {
            type: 'payGo',
            percentage: pay_as_you_go_balance,
            displayText: `YesCode PayGo: $${pay_as_you_go_balance.toFixed(2)}`,
            tooltip
        };
    }

    const weeklyRemaining = subscription_plan.weekly_limit - current_week_spend;

    if (subscription_balance <= 0 || weeklyRemaining <= 0) {
        const tooltip = [
            `Plan: ${subscription_plan.name}`,
            `Daily: $${subscription_balance.toFixed(2)} / $${subscription_plan.daily_balance.toFixed(2)}`,
            `Weekly: $${weeklyRemaining.toFixed(2)} / $${subscription_plan.weekly_limit.toFixed(2)}`,
            `Reset: ${nextReset} (${resetRelative})`,
            `Expiry: ${expiryDate} (${expiryRelative})`,
            `PayGo: $${pay_as_you_go_balance.toFixed(2)}`,
            ``,
            'Click to refresh'
        ].join('\n');

        return {
            type: 'payGo',
            percentage: pay_as_you_go_balance,
            displayText: `YesCode PayGo: $${pay_as_you_go_balance.toFixed(2)}`,
            tooltip
        };
    }

    const dailyPercentage = (subscription_balance / subscription_plan.daily_balance) * 100;
    const weeklyPercentage = (weeklyRemaining / subscription_plan.weekly_limit) * 100;
    const isCriticalDaily = dailyPercentage <= weeklyPercentage;

    const tooltip = [
        `Plan: ${subscription_plan.name}`,
        `Daily: $${subscription_balance.toFixed(2)} / $${subscription_plan.daily_balance.toFixed(2)} (${dailyPercentage.toFixed(1)}%)`,
        `Weekly: $${weeklyRemaining.toFixed(2)} / $${subscription_plan.weekly_limit.toFixed(2)} (${weeklyPercentage.toFixed(1)}%)`,
        `Reset: ${nextReset} (${resetRelative})`,
        `Expiry: ${expiryDate} (${expiryRelative})`,
        `PayGo: $${pay_as_you_go_balance.toFixed(2)}`,
        ``,
        'Click to refresh'
    ].join('\n');

    if (isCriticalDaily) {
        return {
            type: 'daily',
            percentage: dailyPercentage,
            displayText: `YesCode Daily: ${dailyPercentage.toFixed(0)}%`,
            tooltip
        };
    } else {
        return {
            type: 'weekly',
            percentage: weeklyPercentage,
            displayText: `YesCode Weekly: ${weeklyPercentage.toFixed(0)}%`,
            tooltip
        };
    }
}
