import * as vscode from 'vscode';
import { ProfileResponse } from './types';

export async function fetchBalance(context: vscode.ExtensionContext): Promise<ProfileResponse | null> {
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

export async function setApiKey(context: vscode.ExtensionContext): Promise<void> {
    const apiKey = await vscode.window.showInputBox({
        prompt: 'Enter your YesCode API Key',
        password: true,
        ignoreFocusOut: true,
        placeHolder: 'Your API key will be stored securely'
    });

    if (apiKey) {
        await context.secrets.store('yescode.apiKey', apiKey);
        vscode.window.showInformationMessage('API Key saved securely!');
    } else {
        vscode.window.showWarningMessage('API Key not saved');
    }
}
