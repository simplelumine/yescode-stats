import * as vscode from 'vscode';
import { fetchBalance } from '../api';
import { calculateBalance, DisplayMode } from '../monitor/balance';

let statusBarItem: vscode.StatusBarItem;
let refreshTimer: NodeJS.Timeout | undefined;
let currentDisplayMode: DisplayMode = 'auto';

// Retry configuration
const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 5000; // 5 seconds between retries

export function createStatusBar(context: vscode.ExtensionContext): vscode.StatusBarItem {
    // Load saved display mode
    currentDisplayMode = context.globalState.get<DisplayMode>('displayMode', 'auto');

    statusBarItem = vscode.window.createStatusBarItem(
        vscode.StatusBarAlignment.Right,
        100
    );
    statusBarItem.command = 'yescode.showMenu';
    statusBarItem.text = 'YesCode: Loading...';
    statusBarItem.show();

    return statusBarItem;
}

export function startAutoRefresh(context: vscode.ExtensionContext): void {
    // Initial balance update
    updateStatusBar(context, false);

    // Set up automatic refresh every 1 minute
    refreshTimer = setInterval(() => {
        console.log('Automatic refresh triggered...');
        updateStatusBar(context, true); // Automatic refresh
    }, 1 * 60 * 1000); // 1 minute in milliseconds
}

export function stopAutoRefresh(): void {
    if (refreshTimer) {
        clearInterval(refreshTimer);
        refreshTimer = undefined;
    }
}

export async function updateStatusBar(context: vscode.ExtensionContext, isAutoRefresh: boolean): Promise<void> {
    if (!isAutoRefresh) {
        statusBarItem.text = `$(sync~spin) YesCode...`;
    }

    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
        try {
            const data = await fetchBalance(context);

            if (!data) {
                // API key not set or returned null - don't retry
                statusBarItem.text = 'YesCode: Error';
                statusBarItem.tooltip = 'Failed to fetch balance. Click to retry.';
                statusBarItem.backgroundColor = new vscode.ThemeColor('statusBarItem.warningBackground');
                return;
            }

            // Success - update status bar with balance
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
            return; // Success, exit function

        } catch (error) {
            lastError = error instanceof Error ? error : new Error(String(error));
            console.error(`Fetch attempt ${attempt}/${MAX_RETRIES} failed:`, lastError.message);

            if (attempt < MAX_RETRIES) {
                // Show retrying status in status bar (no notification)
                statusBarItem.text = `$(sync~spin) YesCode: Retrying (${attempt}/${MAX_RETRIES})...`;
                statusBarItem.tooltip = `Fetch failed, retrying... (${attempt}/${MAX_RETRIES})`;
                statusBarItem.backgroundColor = undefined;

                // Wait before next retry
                await new Promise(resolve => setTimeout(resolve, RETRY_DELAY_MS));
            }
        }
    }

    // All retries exhausted - show error in status bar only (no notification)
    console.error('All retry attempts failed:', lastError?.message);
    statusBarItem.text = 'YesCode: Fetch Error';
    statusBarItem.tooltip = `Failed to fetch balance after ${MAX_RETRIES} attempts. Click to retry.\nError: ${lastError?.message || 'Unknown error'}`;
    statusBarItem.backgroundColor = new vscode.ThemeColor('statusBarItem.warningBackground');
}

export function setDisplayMode(mode: DisplayMode): void {
    currentDisplayMode = mode;
}

export function getDisplayMode(): DisplayMode {
    return currentDisplayMode;
}

export function getRefreshTimer(): NodeJS.Timeout | undefined {
    return refreshTimer;
}
