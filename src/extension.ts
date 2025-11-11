import * as vscode from 'vscode';
import { ProfileResponse } from './types';
import { fetchBalance, setApiKey } from './api';
import { calculateBalance, DisplayMode } from './balance';

let statusBarItem: vscode.StatusBarItem;
let refreshTimer: NodeJS.Timeout | undefined;
let currentDisplayMode: DisplayMode = 'auto';

export function activate(context: vscode.ExtensionContext) {
    console.log('YesCode Stats extension is now active');

    // Load saved display mode
    currentDisplayMode = context.globalState.get<DisplayMode>('displayMode', 'auto');

    // Create status bar item
    statusBarItem = vscode.window.createStatusBarItem(
        vscode.StatusBarAlignment.Right,
        100
    );
    statusBarItem.command = 'yescode.showMenu';
    statusBarItem.text = 'YesCode: Loading...';
    statusBarItem.show();
    context.subscriptions.push(statusBarItem);

    // Register commands
    context.subscriptions.push(
        vscode.commands.registerCommand('yescode.showMenu', async () => {
            const items: vscode.QuickPickItem[] = [
                {
                    label: '$(sync) Refresh Balance',
                    description: 'Manually refresh balance data'
                },
                {
                    label: '$(symbol-color) Switch Display Mode',
                    description: 'Change between Auto/Subscription/PayGo/Team modes'
                },
                {
                    label: '$(key) Set API Key',
                    description: 'Configure your YesCode API key'
                }
            ];

            const selected = await vscode.window.showQuickPick(items, {
                placeHolder: 'YesCode Menu'
            });

            if (selected) {
                if (selected.label.includes('Refresh Balance')) {
                    await vscode.commands.executeCommand('yescode.refreshBalance');
                } else if (selected.label.includes('Switch Display Mode')) {
                    await vscode.commands.executeCommand('yescode.switchDisplayMode');
                } else if (selected.label.includes('Set API Key')) {
                    await vscode.commands.executeCommand('yescode.setApiKey');
                }
            }
        })
    );

    context.subscriptions.push(
        vscode.commands.registerCommand('yescode.setApiKey', async () => {
            await setApiKey(context);
            await updateBalance(context, false);
        })
    );

    context.subscriptions.push(
        vscode.commands.registerCommand('yescode.refreshBalance', async () => {
            await updateBalance(context, false); // Manual refresh
        })
    );

    context.subscriptions.push(
        vscode.commands.registerCommand('yescode.switchDisplayMode', async () => {
            // Fetch current profile to check available modes
            const profile = await fetchBalance(context);

            if (!profile) {
                vscode.window.showErrorMessage('Failed to fetch account data. Please try again.');
                return;
            }

            const hasSubscription = !!profile.subscription_plan;
            const hasTeam = !!profile.current_team;
            const isPayGoOnly = profile.balance_preference === 'payg_only';

            const items: vscode.QuickPickItem[] = [
                {
                    label: 'Auto',
                    description: 'Automatically detect mode based on account type',
                    detail: currentDisplayMode === 'auto' ? '✓ Currently selected' : ''
                },
                {
                    label: 'Subscription',
                    description: hasSubscription
                        ? (isPayGoOnly ? '⚠️ Warning: Your account is set to PayGo Only mode' : 'Always show subscription balance')
                        : '❌ Not available (no subscription)',
                    detail: currentDisplayMode === 'subscription' ? '✓ Currently selected' : ''
                },
                {
                    label: 'PayGo',
                    description: (hasSubscription && !isPayGoOnly)
                        ? '⚠️ Warning: Your account is set to Subscription First mode'
                        : 'Always show pay-as-you-go balance',
                    detail: currentDisplayMode === 'paygo' ? '✓ Currently selected' : ''
                },
                {
                    label: 'Team',
                    description: hasTeam
                        ? 'Always show team balance'
                        : '❌ Not available (no team)',
                    detail: currentDisplayMode === 'team' ? '✓ Currently selected' : ''
                }
            ];

            const selected = await vscode.window.showQuickPick(items, {
                placeHolder: 'Select display mode'
            });

            if (selected) {
                const modeMap: { [key: string]: DisplayMode } = {
                    'Auto': 'auto',
                    'Subscription': 'subscription',
                    'PayGo': 'paygo',
                    'Team': 'team'
                };

                const newMode = modeMap[selected.label];

                // Warn if selecting modes that conflict with balance preference
                if (newMode === 'subscription' && !hasSubscription) {
                    vscode.window.showWarningMessage('No subscription found. Will fall back to PayGo mode.');
                } else if (newMode === 'subscription' && isPayGoOnly) {
                    const confirm = await vscode.window.showWarningMessage(
                        'Your account is set to PayGo Only mode. Switching to Subscription display may show incorrect data.',
                        'Continue Anyway',
                        'Cancel'
                    );
                    if (confirm !== 'Continue Anyway') {
                        return;
                    }
                } else if (newMode === 'paygo' && hasSubscription && !isPayGoOnly) {
                    const confirm = await vscode.window.showWarningMessage(
                        'Your account is set to Subscription First mode. Switching to PayGo display may not reflect your actual usage.',
                        'Continue Anyway',
                        'Cancel'
                    );
                    if (confirm !== 'Continue Anyway') {
                        return;
                    }
                } else if (newMode === 'team' && !hasTeam) {
                    vscode.window.showWarningMessage('No team found. Will fall back to available mode.');
                }

                currentDisplayMode = newMode;
                await context.globalState.update('displayMode', currentDisplayMode);
                await updateBalance(context, false);

                vscode.window.showInformationMessage(`Display mode switched to: ${selected.label}`);
            }
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

        const result = calculateBalance(data, currentDisplayMode);

        statusBarItem.text = result.displayText;
        statusBarItem.tooltip = result.tooltip;

        if (result.type !== 'payGo') {
            if (result.percentage < 10) {
                statusBarItem.backgroundColor = new vscode.ThemeColor('statusBarItem.warningBackground');
            } else {
                statusBarItem.backgroundColor = undefined;
            }
        } else {
            if (result.percentage < 5) {
                statusBarItem.backgroundColor = new vscode.ThemeColor('statusBarItem.warningBackground');
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
        statusBarItem.backgroundColor = new vscode.ThemeColor('statusBarItem.warningBackground');
    }
}

export function deactivate() {
    if (refreshTimer) {
        clearInterval(refreshTimer);
    }
}
