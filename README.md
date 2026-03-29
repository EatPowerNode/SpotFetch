# SpotFetch

A browser extension for **Chromium** (Chrome, Brave, Edge, etc.) and **Firefox** that lets you quickly insert live spot prices for Gold (PAXG), Silver (KAG), and Platinum (GRAMP) into text fields on websites like X and Gab.

## Features

- Live prices for **Gold**, **Silver**, and **Platinum** fetched from CoinGecko every 5 minutes
- All prices displayed consistently in **troy ounces** (`/ozt`)
- Price direction indicator (`up`, `down`, or `unc`) based on the last fetch
- Timestamp with local date, time, and timezone abbreviation
- Smart insertion that works reliably on complex editors (including Draft.js on Gab)
- Cross-browser support using a lightweight polyfill
- Clean output format:  
  `[Gold: $3421.75/ozt up - 03/29/26 14:22:10 CDT]`

## Changelog

### Version 1.4 (March 2026)
- Added **Platinum (GRAMP)** support
- Converted all prices to **troy ounces** for consistency
- Improved text insertion reliability on Gab and other Draft.js-based editors
- Added hybrid background script support for better Chromium + Firefox compatibility
- Updated output format to include `/ozt`
- General code cleanup and bug fixes

### Version 1.3
- Firefox / Mullvad Browser compatibility fixes

## Installation

1. Clone or download the repository.
2. Open Chrome/Brave (`chrome://extensions/`) or Firefox (`about:debugging#/runtime/this-firefox`).
3. Enable Developer mode.
4. Click **"Load unpacked"** (Chrome/Brave) or **"Load Temporary Add-on"** (Firefox) and select the extension folder.
5. The extension will load and create the context menu items.

## Usage

1. Go to any site with a text input (X, Gab, forums, etc.).
2. Right-click inside the text field/composer.
3. Choose one of:
   - Insert Gold Spot Price (PAXG)
   - Insert Silver Spot Price (KAG)
   - Insert Platinum Spot Price (GRAMP)
4. The price will be inserted at the cursor in this format:  
   `[Platinum: $1871.50/ozt unc - 03/29/26 20:53:03 CDT]`

## Permissions

- `contextMenus`
- `activeTab`
- `scripting`
- `storage`
- `<all_urls>` (for CoinGecko API)

## Development Notes

- Uses `webextension-polyfill` for cleaner cross-browser API access (`browser.*` vs `chrome.*`)
- Background script supports both Manifest V3 service workers and legacy Firefox scripts
- Insertion logic prioritizes `ClipboardEvent` for Draft.js editors (Gab) and standard events for others

## License

This project is licensed under the GNU General Public License v3.0 (GPL-3.0). See the [LICENSE](LICENSE) file for details.

## Acknowledgments

- Built with assistance from Grok (xAI) for debugging complex editor insertion issues and cross-browser compatibility.
- Price data provided by the [CoinGecko API](https://www.coingecko.com/).
- Special thanks to users on Mullvad Browser and Gab for testing and feedback.

## Contact

For issues, feature requests, or questions, please open an issue on this repository or contact the maintainer at [nogruntees@gmail.com].