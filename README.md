# YesCode StatusBar

**Official Website:** [https://co.yes.vg](https://co.yes.vg)

A VS Code extension that displays your YesCode subscription balance in the status bar.

## Features

-   **Interactive Status Bar Menu:** Click the status bar item to open a menu with all available commands.
-   **Multi-Mode Display:** Supports automatic detection and manual switching between Subscription, Team, and PayGo balance displays.
-   **Smart "Auto" Mode:** Automatically displays your Team balance if available, otherwise falls back to your Subscription or PayGo balance.
-   **Detailed Tooltip Dashboard:** Hover over the status bar item to see a full "mini-dashboard" with a breakdown of your currently displayed mode (Subscription or Team).
-   **Secure API Key Storage:** Uses VS Code's native `SecretStorage` to keep your API key safe.
-   **Automatic Refresh:** Keeps your balance up-to-date by automatically refreshing every minute.
-   **Critical Balance Warning:** The status bar item turns yellow to warn you when your subscription balance is low (<10%) or your PayGo balance is very low (<$5).

## Setup

1.  Install the extension from the VS Code Marketplace.
2.  Click the "YesCode: Loading..." item in the status bar to open the menu.
3.  Select `Set API Key` and enter your YesCode API key when prompted.
4.  Your balance will immediately appear in the status bar.

## Commands

-   **`YesCode: Show Menu`**: (Accessible by clicking the status bar item) Opens the main command menu.
-   **`YesCode: Set API Key`**: Store your API key securely.
-   **`YesCode: Refresh Balance`**: Manually trigger a refresh of your balance.
-   **`YesCode: Switch Display Mode`**: Manually select which balance to display (Auto, Subscription, Team, or PayGo).

## Project Structure

This extension is built with a clean, modular architecture to separate concerns:

-   `extension.ts`: The main activation file that handles VS Code integration and UI.
-   `api.ts`: Manages all API calls and secure key storage.
-   `balance.ts`: A central dispatcher for routing to the correct logic module.
-   `subscription.ts`: Contains all logic for calculating subscription balances.
-   `team.ts`: Contains all logic for calculating team balances.
-   `paygo.ts`: Contains all logic for calculating PayGo balances.
-   `utils.ts`: Helper functions for date and time formatting.
-   `types.ts`: Defines the data structures and types used throughout the extension.

## Acknowledgements

Special thanks to **好果汁**, the CFO of YesCode, for providing invaluable testing, support, and guidance throughout the development of this extension.

## Development

If you wish to contribute or run the extension locally:

```bash
# Clone the repository
git clone https://github.com/simplelumine/yescode-statusbar.git
cd yescode-statusbar

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