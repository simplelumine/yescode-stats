# YesCode Stats

A VS Code extension that displays your YesCode subscription balance in the status bar.

## Features

-   **At-a-Glance Balance:** Displays the most critical balance metric (Daily or Weekly percentage) directly in the status bar.
-   **Smart Display Logic:** Automatically switches to your PayGo balance when your daily or weekly subscription balance is depleted.
-   **Detailed Tooltip Dashboard:** Hover over the status bar item to see a full "mini-dashboard" with:
    -   Plan Name
    -   Daily and Weekly breakdown (balance, limit, and percentage)
    -   PayGo Balance
    -   Next Reset and Subscription Expiry dates, shown in both absolute and relative time (e.g., "in 7 days" or "in 3 hours").
-   **Secure API Key Storage:** Uses VS Code's native `SecretStorage` to keep your API key safe.
-   **Automatic Refresh:** Keeps your balance up-to-date by automatically refreshing every 3 minutes.
-   **Critical Balance Warning:** The status bar item turns yellow to warn you when your subscription balance is low (<10%) or your PayGo balance is very low (<$5).

## Setup

1.  Install the extension from the VS Code Marketplace.
2.  Open the Command Palette (`Ctrl+Shift+P` or `Cmd+Shift+P`).
3.  Run the command `YesCode: Set API Key` and enter your YesCode API key when prompted.
4.  Your balance will immediately appear in the status bar.

## Commands

-   `YesCode: Set API Key`: Store your API key securely.
-   `YesCode: Refresh Balance`: Manually trigger a refresh of your balance.

## Project Structure

This extension is built with a clean, modular architecture to separate concerns:

-   `extension.ts`: The main activation file that handles VS Code integration and UI.
-   `api.ts`: Manages all API calls and secure key storage.
-   `balance.ts`: Contains the core business logic for calculating which balance to display.
-   `utils.ts`: Helper functions for date and time formatting.
-   `types.ts`: Defines the data structures and types used throughout the extension.

## Development

If you wish to contribute or run the extension locally:

```bash
# Clone the repository
git clone https://github.com/simplelumine/yescode-stats.git
cd yescode-stats

# Install dependencies
npm install

# Compile the TypeScript code
npm run compile

# Open the project in VS Code
code .

# Start the debugger
Press F5 to open the Extension Development Host with the extension running.
```

## License

[MIT](./LICENSE.md)