import * as vscode from 'vscode';
import { fetchBalance, getBaseUrl } from '../api';
import { getTeamInfo, getOperatingSystem } from './utils';
import { buildUserMenuItems, handleUserSelection } from './userMenu';
import { buildTeamMenuItems, handleTeamSelection } from './teamMenu';
import { showCustomSetupMenu } from './customMenu';

interface CliOption extends vscode.QuickPickItem {
    cli: 'gemini' | 'codex' | 'claude';
    mode: 'team' | 'user';
    isCustom?: boolean;
}

export async function showCliSetupMenu(context: vscode.ExtensionContext): Promise<void> {
    try {
        // Fetch user profile to check team status
        const profile = await fetchBalance(context);

        if (!profile) {
            vscode.window.showErrorMessage('Failed to fetch profile data. Please ensure your API key is set.');
            return;
        }

        // Get team information if available
        const teamInfo = getTeamInfo(profile);
        const apiKey = await context.secrets.get('yescode.apiKey');

        if (!apiKey) {
            vscode.window.showErrorMessage('API key not found. Please set your API key first.');
            return;
        }

        // Get base URL for current environment
        const baseUrl = await getBaseUrl(context);

        // Detect operating system
        const os = getOperatingSystem();
        const osLabel = os === 'windows' ? 'PowerShell' : 'Unix';
        const alternateOs = os === 'windows' ? 'unix' : 'windows';
        const alternateOsLabel = os === 'windows' ? 'Unix' : 'PowerShell';

        // Build menu items
        const menuItems: CliOption[] = [];

        // Add User section separator
        menuItems.push({
            label: 'User',
            description: '',
            cli: 'claude',
            mode: 'user',
            kind: vscode.QuickPickItemKind.Separator
        });

        // Add User options
        const userItems = buildUserMenuItems(osLabel);
        menuItems.push(...userItems.map(item => ({
            ...item,
            mode: 'user' as const
        })));

        // Add Team section if user is in a team
        if (teamInfo) {
            menuItems.push({
                label: 'Team',
                description: '',
                cli: 'claude',
                mode: 'team',
                kind: vscode.QuickPickItemKind.Separator
            });

            // Add Team options
            const teamItems = buildTeamMenuItems(osLabel);
            menuItems.push(...teamItems.map(item => ({
                ...item,
                mode: 'team' as const
            })));
        }

        // Add Custom Setup option (for alternate OS)
        menuItems.push({
            label: `$(tools) ${alternateOsLabel} Setup`,
            description: 'Cross-platform',
            cli: 'claude',
            mode: 'user',
            detail: `  └ Copy command for ${alternateOsLabel} (for use on other machines)`,
            isCustom: true
        });

        // Create and configure QuickPick
        const quickPick = vscode.window.createQuickPick<CliOption>();
        quickPick.title = 'Configure CLI Environment';
        quickPick.placeholder = 'Select a CLI setup option';
        quickPick.items = menuItems;
        quickPick.matchOnDescription = true;

        quickPick.onDidAccept(async () => {
            const selected = quickPick.selectedItems[0];
            if (selected) {
                quickPick.hide();

                // Skip separators
                if (selected.kind === vscode.QuickPickItemKind.Separator) {
                    return;
                }

                // Handle custom setup
                if (selected.isCustom) {
                    await showCustomSetupMenu(context, apiKey, teamInfo, alternateOs, alternateOsLabel, baseUrl);
                    return;
                }

                // Handle user or team selection
                if (selected.mode === 'team' && teamInfo) {
                    await handleTeamSelection(context, selected.cli, os, teamInfo.teamApiKey, baseUrl);
                } else {
                    await handleUserSelection(context, selected.cli, os, apiKey, baseUrl);
                }
            }
        });

        quickPick.onDidHide(() => quickPick.dispose());
        quickPick.show();
    } catch (error) {
        console.error('Error in showCliSetupMenu:', error);
        vscode.window.showErrorMessage(`Failed to show CLI setup menu: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
}
