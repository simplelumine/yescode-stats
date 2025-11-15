# YesCoder

**Official Website:** [https://co.yes.vg](https://co.yes.vg)

Your essential companion for YesCode in VS Code. Monitor your balance and manage providers seamlessly from the status bar.

## Features

-   **Balance Monitoring:** Keep an eye on your most critical balance (Team, Subscription, or PayGo) directly in the status bar.
-   **Provider Management:** Switch your default and alternative providers for both your user account and your team account without ever leaving the editor.
-   **Seamless Account Support:** Works with all types of YesCode accounts, including production and special/testing accounts, by automatically connecting to the correct backend services.
-   **Centralized Command Menu:** A single click on the status bar opens a menu with all core extension commands.
-   **Smart Display Modes:** Automatically detects the most relevant balance to display, with a manual override to lock it to a specific mode.
-   **Detailed Tooltips:** Hover over the status bar for a mini-dashboard with a full breakdown of your current balance.
-   **Secure API Key Storage:** Uses VS Code's native `SecretStorage` to keep your API key safe.
-   **Automatic Refresh:** Keeps your balance up-to-date by automatically refreshing every minute.

## Setup

1.  Install the extension from the VS Code Marketplace.
2.  Click the "YesCode: Loading..." item in the status bar to open the menu.
3.  Select `Set API Key` and enter your YesCode API key when prompted. The extension will automatically detect the correct environment.
4.  Your balance and provider management features are now active.

## Commands

-   **`YesCode: Show Menu`**: Opens the main command menu from the status bar.
-   **`YesCode: Refresh Balance`**: Manually refreshes your balance information.
-   **`YesCode: Switch Display Mode`**: Manually selects which balance to display.
-   **`YesCode: Switch Vendor`**: Opens the provider management interface. (Not available for special/testing accounts).
-   **`YesCode: Set API Key`**: Stores your API key securely.

## Known Issues

-   **API Data Dependency:** The extension is built to be resilient against missing optional data from the YesCode API. However, in the rare event that the API returns a fundamentally malformed data object (e.g., a provider object missing a required field like `display_name`), the extension may encounter an error. A refresh (`YesCode: Refresh Balance`) will typically resolve this once the API is stable.

## Project Architecture

This extension is built with a clean, feature-driven architecture:

-   `src/extension.ts`: The main activation file that orchestrates the different features.
-   `src/core/`: Contains the core logic for command registration and status bar creation.
-   `src/monitor/`: All logic for the balance monitoring feature.
-   `src/providers/`: All logic for the provider management feature.
-   `src/api.ts`: Manages all API calls to YesCode, including environment detection.
-   `src/types.ts`: Defines all shared data structures.

## Acknowledgements

This project would not have been possible without the incredible support and contributions from several key individuals:

-   A very special thanks to my mentor, **好果汁 (YesCode CFO)**, for providing the testing environment, crucial financial support, and invaluable guidance throughout the entire development process.
-   Thank you to the **YesCode CTO** for their insightful guidance on the project's name and direction.
-   Thank you to **喵酱 (YesCode User: 太阳照常升起)** for providing detailed API documentation which was essential for the implementation.
-   Thank you to **萝拉酱 (YesCode User: Aurora)** for their thorough testing and feedback.
-   Thank you to **杰森酱 (YesCode User: Jason 🅥)** for discovering the `cr` vendor switching key, building upon 喵酱's documentation.

## Development

```bash
# Clone the repository
git clone https://github.com/simplelumine/yescoder.git
cd yescoder

# Install dependencies
npm install

# Compile and watch for changes
npm run watch

# Open in VS Code and press F5 to launch the Extension Development Host.
```

## License

[MIT](./LICENSE.md)