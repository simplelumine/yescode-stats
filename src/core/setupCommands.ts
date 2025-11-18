/**
 * Generate CLI setup command
 */
export function generateCliSetupCommand(
    cli: 'gemini' | 'codex' | 'claude',
    os: 'windows' | 'unix',
    mode: 'team' | 'user',
    apiKey: string,
    baseUrl: string
): string {
    // Get script name based on CLI
    const scriptName = cli === 'claude' ? 'claude-code' : cli === 'codex' ? 'codex' : 'gemini';
    const scriptFileName = cli === 'gemini' ? `setup_${scriptName}` : `setup-${scriptName}`;

    // Determine URL based on CLI and mode
    let url: string;
    if (mode === 'team') {
        url = cli === 'gemini' ? `${baseUrl}/team/gemini` : `${baseUrl}/team`;
    } else {
        url = cli === 'gemini' ? `${baseUrl}/gemini` : baseUrl;
    }

    // Build the command based on OS
    if (os === 'unix') {
        // Unix-based systems (Linux, macOS)
        return `curl -s ${baseUrl}/${scriptFileName}.sh | bash -s -- --url ${url} --key ${apiKey}`;
    } else {
        // Windows PowerShell
        return `& { $base='${baseUrl}'; $url='${url}'; $key='${apiKey}'; iwr -useb $base/${scriptFileName}.ps1 | iex }`;
    }
}
