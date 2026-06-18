# TradeAssist Desktop App

Home services quoting and invoicing tool. Built with Tauri (Rust + HTML/CSS/JS).

## Download

Get the latest installer from the [Releases](https://github.com/PorkJelly77/TradeAssist-desktop-app/releases) page.

## Build from Source

### Prerequisites

- [Rust](https://rustup.rs/)
- [Node.js](https://nodejs.org/)

### Steps

```bash
git clone https://github.com/PorkJelly77/TradeAssist-desktop-app.git
cd TradeAssist-desktop-app

# Build the desktop app
cd src-tauri
cargo build --release

# Installer will be in:
# src-tauri/target/release/bundle/nsis/TradeAssist_*.exe
```

Or run the build script:

```bash
cd src-tauri
./build-native.sh
```

## Features

- Create quotes and invoices
- Customer management
- Freight calculations
- Tax calculations
- Local data storage (no internet required)

## License

MIT
