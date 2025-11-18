import * as vscode from 'vscode';
import { generateCliSetupCommand } from '../core/setupCommands';
import { buildUserMenuItems } from './userMenu';
import { buildTeamMenuItems } from './teamMenu';

/**
 * Show custom setup menu for alternate OS
 */
export async function showCustomSetupMenu(
    context: vscode.ExtensionContext,
    apiKey: string,
    teamInfo: { teamApiKey: string; teamName: string } | null,
    targetOs: 'windows' | 'unix',
    targetOsLabel: string,
    baseUrl: string
): Promise<void> {
    // Build menu for alternate OS
    const menuItems: vscode.QuickPickItem[] = [];

    // Add User section
    menuItems.push({
        label: 'User',
        kind: vscode.QuickPickItemKind.Separator
    });

    menuItems.push(...buildUserMenuItems(targetOsLabel, false));

    // Add Team section if available
    if (teamInfo) {
        menuItems.push({
            label: 'Team',
            kind: vscode.QuickPickItemKind.Separator
        });

        menuItems.push(...buildTeamMenuItems(targetOsLabel, false));
    }

    const selected = await vscode.window.showQuickPick(menuItems, {
        placeHolder: `Select CLI to copy ${targetOsLabel} setup command`,
        title: `${targetOsLabel} Setup (Copy Command)`,
        ignoreFocusOut: true
    });

    if (!selected || selected.kind === vscode.QuickPickItemKind.Separator) {
        return;
    }

    // Parse selection
    const isTeam = selected.description === 'TEAM';
    const mode = isTeam ? 'team' : 'user';
    let cli: 'claude' | 'codex' | 'gemini';

    if (selected.label.includes('Claude')) {
        cli = 'claude';
    } else if (selected.label.includes('Codex')) {
        cli = 'codex';
    } else {
        cli = 'gemini';
    }

    // Generate the appropriate command
    const command = generateCliSetupCommand(
        cli,
        targetOs,
        mode,
        mode === 'team' && teamInfo ? teamInfo.teamApiKey : apiKey,
        baseUrl
    );

    // Copy to clipboard
    await vscode.env.clipboard.writeText(command);

    const cliName = cli.charAt(0).toUpperCase() + cli.slice(1);

    // Show confirmation - only copy for cross-platform usage
    vscode.window.showInformationMessage(
        `${cliName} ${targetOsLabel} setup command copied to clipboard!\n⚠️  Command contains API key, use with caution.`
    );
}
