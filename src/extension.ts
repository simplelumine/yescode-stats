import * as vscode from 'vscode';

interface SubscriptionPlan {
    daily_balance: number;
    weekly_limit: number;
    name: string;
}

interface ProfileResponse {
    subscription_balance: number;
    pay_as_you_go_balance: number;
    current_week_spend: number;
    subscription_plan: SubscriptionPlan;
    balance_preference: string;
    last_week_reset: string;
    subscription_expiry: string;
}

let statusBarItem: vscode.StatusBarItem;
let refreshTimer: NodeJS.Timeout | undefined;

export function activate(context: vscode.ExtensionContext) {
    console.log('YesCode Stats extension is now active');

    // Create status bar item
    statusBarItem = vscode.window.createStatusBarItem(
        vscode.StatusBarAlignment.Right,
        100
    );
    statusBarItem.command = 'yescode.refreshBalance';
    statusBarItem.text = 'YesCode: Loading...';
    statusBarItem.show();
    context.subscriptions.push(statusBarItem);

    // Register commands
    context.subscriptions.push(
        vscode.commands.registerCommand('yescode.setApiKey', async () => {
            await setApiKey(context);
        })
    );

    context.subscriptions.push(
        vscode.commands.registerCommand('yescode.refreshBalance', async () => {
            await updateBalance(context, false); // Manual refresh
        })
    );

    context.subscriptions.push(
        vscode.commands.registerCommand('yescode.showBalance', async () => {
            await updateBalance(context, false); // Manual refresh
        })
    );

    // Initial balance update
    updateBalance(context, false);

    // Set up automatic refresh every 1 minute
    refreshTimer = setInterval(() => {
        console.log('Automatic refresh triggered...');
        updateBalance(context, true); // Automatic refresh
    }, 1 * 60 * 1000); // 1 minute in milliseconds

    // Clean up timer on deactivation
    context.subscriptions.push({
        dispose: () => {
            if (refreshTimer) {
                clearInterval(refreshTimer);
            }
        }
    });
}

async function setApiKey(context: vscode.ExtensionContext): Promise<void> {
    const apiKey = await vscode.window.showInputBox({
        prompt: 'Enter your YesCode API Key',
        password: true,
        ignoreFocusOut: true,
        placeHolder: 'Your API key will be stored securely'
    });

    if (apiKey) {
        await context.secrets.store('yescode.apiKey', apiKey);
        vscode.window.showInformationMessage('API Key saved securely!');
        await updateBalance(context, false);
    } else {
        vscode.window.showWarningMessage('API Key not saved');
    }
}

async function fetchBalance(context: vscode.ExtensionContext): Promise<ProfileResponse | null> {
    try {
        const apiKey = await context.secrets.get('yescode.apiKey');

        if (!apiKey) {
            vscode.window.showWarningMessage(
                'YesCode API Key not set. Please run "YesCode: Set API Key" command.',
                'Set API Key'
            ).then(selection => {
                if (selection === 'Set API Key') {
                    vscode.commands.executeCommand('yescode.setApiKey');
                }
            });
            return null;
        }

        const response = await fetch('https://co.yes.vg/api/v1/auth/profile', {
            method: 'GET',
            headers: {
                'X-API-Key': apiKey
            }
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json() as ProfileResponse;
        return data;
    } catch (error) {
        console.error('Error fetching balance:', error);
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        vscode.window.showErrorMessage(`Failed to fetch YesCode balance: ${errorMessage}`);
        return null;
    }
}

function formatDate(dateString: string): string {
    const date = new Date(dateString);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

function calculateNextReset(lastWeekReset: string): string {
    const resetDate = new Date(lastWeekReset);
    resetDate.setDate(resetDate.getDate() + 7);
    return formatDate(resetDate.toISOString());
}

function getDaysUntil(dateString: string): string {
    const targetDate = new Date(dateString);
    const now = new Date();
    const diffTime = targetDate.getTime() - now.getTime();
    const diffHours = Math.floor(diffTime / (1000 * 60 * 60));
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    // If within 24 hours (positive or negative), show hours
    if (Math.abs(diffHours) <= 24) {
        if (diffHours === 0) {
            return 'less than 1 hour';
        } else if (diffHours === 1) {
            return 'in 1 hour';
        } else if (diffHours === -1) {
            return '1 hour ago';
        } else if (diffHours > 0) {
            return `in ${diffHours} hours`;
        } else {
            return `${Math.abs(diffHours)} hours ago`;
        }
    }

    // Otherwise show days
    if (diffDays === 0) {
        return 'today';
    } else if (diffDays === 1) {
        return 'in 1 day';
    } else if (diffDays < 0) {
        return `${Math.abs(diffDays)} days ago`;
    } else {
        return `in ${diffDays} days`;
    }
}

function calculateCriticalBalance(data: ProfileResponse): {
    type: 'daily' | 'weekly' | 'payGo';
    percentage: number;
    displayText: string;
    tooltip: string;
} {
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

async function updateBalance(context: vscode.ExtensionContext, isAutoRefresh: boolean): Promise<void> {
    try {
        if (!isAutoRefresh) {
            statusBarItem.text = `$(sync~spin) YesCode...`;
        }
        
        const data = await fetchBalance(context);

        if (!data) {
            statusBarItem.text = 'YesCode: Error';
            statusBarItem.tooltip = 'Failed to fetch balance. Click to retry.';
            return;
        }

        const result = calculateCriticalBalance(data);

        statusBarItem.text = result.displayText;
        statusBarItem.tooltip = result.tooltip;

        if (result.type !== 'payGo') {
            if (result.percentage < 20) {
                statusBarItem.backgroundColor = new vscode.ThemeColor('statusBarItem.errorBackground');
            } else {
                statusBarItem.backgroundColor = undefined;
            }
        } else {
            if (result.percentage < 10) {
                statusBarItem.backgroundColor = new vscode.ThemeColor('statusBarItem.errorBackground');
            } else {
                statusBarItem.backgroundColor = undefined;
            }
        }
        if (!isAutoRefresh) {
            console.log('Balance updated successfully:', result.displayText);
        }

    } catch (error) {
        console.error('Error updating balance:', error);
        statusBarItem.text = 'YesCode: Error';
        statusBarItem.tooltip = 'An unexpected error occurred. Click to retry.';
        statusBarItem.backgroundColor = new vscode.ThemeColor('statusBarItem.errorBackground');
    }
}

export function deactivate() {
    if (refreshTimer) {
        clearInterval(refreshTimer);
    }
}