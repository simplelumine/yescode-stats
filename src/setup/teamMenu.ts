import * as vscode from 'vscode';
import { generateCliSetupCommand } from '../core/setupCommands';

interface TeamMenuItem extends vscode.QuickPickItem {
    cli: 'gemini' | 'codex' | 'claude';
}

/**
 * Build team menu items
 * @param osLabel - The OS label (e.g., "PowerShell" or "Unix")
 * @param showAutoOption - Whether to show AUTO option (true for current OS, false for cross-platform)
 */
export function buildTeamMenuItems(osLabel: string, showAutoOption: boolean = true): TeamMenuItem[] {
    const modeText = showAutoOption ? 'AUTO / Manual Copy' : 'Manual Copy Only';

    return [
        {
            label: '$(organization) Claude Code',
            description: 'TEAM',
            cli: 'claude',
            detail: `  └ ${osLabel} • ${modeText}`
        },
        {
            label: '$(organization) Codex CLI',
            description: 'TEAM',
            cli: 'codex',
            detail: `  └ ${osLabel} • ${modeText}`
        },
        {
            label: '$(organization) Gemini CLI',
            description: 'TEAM',
            cli: 'gemini',
            detail: `  └ ${osLabel} • ${modeText}`
        }
    ];
}

/**
 * Handle team menu selection - with confirmation dialog
 */
export async function handleTeamSelection(
    context: vscode.ExtensionContext,
    selectedCli: 'gemini' | 'codex' | 'claude',
    os: 'windows' | 'unix',
    teamApiKey: string,
    baseUrl: string
): Promise<void> {
    const cliName = selectedCli.charAt(0).toUpperCase() + selectedCli.slice(1);

    // Show confirmation dialog with options
    const choice = await vscode.window.showInformationMessage(
        `Setup ${cliName} CLI for Team:`,
        { modal: true, detail: 'Choose how to proceed with the team setup command.' },
        'Auto Execute (Secure)',
        'Copy Command'
    );

    if (!choice) {
        return;
    }

    // Generate the appropriate command
    const command = generateCliSetupCommand(
        selectedCli,
        os,
        'team',
        teamApiKey,
        baseUrl
    );

    if (choice === 'Auto Execute (Secure)') {
        // Auto-execute in terminal without exposing team key to clipboard
        const terminal = vscode.window.createTerminal(`${cliName} Team Setup`);
        terminal.show();
        terminal.sendText(command);

        vscode.window.showInformationMessage(
            `${cliName} team setup is running in the terminal...`
        );
    } else if (choice === 'Copy Command') {
        // Copy to clipboard with warning
        await vscode.env.clipboard.writeText(command);

        vscode.window.showWarningMessage(
            `${cliName} team setup command copied to clipboard.\n⚠️  Command contains Team API key, use with caution.`
        );
    }
}
