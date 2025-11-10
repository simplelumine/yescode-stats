import * as vscode from 'vscode';
import { ProfileResponse } from './types';
import { fetchBalance, setApiKey } from './api';
import { calculateCriticalBalance } from './balance';

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
            await updateBalance(context, false);
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

    // Set up automatic refresh every 3 minutes
    refreshTimer = setInterval(() => {
        console.log('Automatic refresh triggered...');
        updateBalance(context, true); // Automatic refresh
    }, 3 * 60 * 1000); // 3 minutes in milliseconds

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

        const result = calculateCriticalBalance(data);

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
