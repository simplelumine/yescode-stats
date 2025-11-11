import { ProfileResponse, BalanceResult } from './types';

export function calculatePayGoBalance(profile: ProfileResponse): BalanceResult {
    const { pay_as_you_go_balance } = profile;

    const tooltip = [
        `Pay-as-you-go Mode`,
        `Balance: $${pay_as_you_go_balance.toFixed(2)}`,
        ``,
        'Click to open menu'
    ].join('\n');

    return {
        type: 'payGo',
        percentage: pay_as_you_go_balance,
        displayText: `YesCode PGO: $${pay_as_you_go_balance.toFixed(1)}`,
        tooltip
    };
}
