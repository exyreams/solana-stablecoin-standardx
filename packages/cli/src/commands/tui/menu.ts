import type { Connection, Keypair, PublicKey } from "@solana/web3.js";
import type { SolanaStablecoin } from "@stbr/sss-token-sdk";

export type Screen = "menu" | "dashboard" | "create" | "minters" | "compliance" | "settings";

export interface AppState {
  currentScreen: Screen;
  connection: Connection;
  authority: Keypair;
  mint: PublicKey | null;
  stable: SolanaStablecoin | null;
  refreshInterval: number;
  error: string | null;
}

export function createMenuScreen(blessed: any, screen: any, state: AppState, onNavigate: (screen: Screen) => void) {
  // Clear screen
  screen.children.forEach((child: any) => screen.remove(child));

  // Title
  const title = blessed.box({
    top: 2,
    left: "center",
    width: "80%",
    height: 5,
    content: "{center}{bold}{cyan-fg}🪙 Solana Stablecoin Standard{/cyan-fg}{/bold}\n{center}Terminal User Interface\n{center}{gray-fg}v0.1.0{/gray-fg}{/center}",
    tags: true,
    border: {
      type: "line",
    },
    style: {
      border: {
        fg: "cyan",
      },
    },
  });

  // Menu box
  const menuBox = blessed.list({
    top: 8,
    left: "center",
    width: 60,
    height: 14,
    label: " Main Menu ",
    tags: true,
    border: {
      type: "line",
    },
    style: {
      border: {
        fg: "green",
      },
      selected: {
        bg: "blue",
        fg: "white",
        bold: true,
      },
      item: {
        fg: "white",
      },
    },
    keys: true,
    vi: true,
    mouse: true,
    items: [
      "{green-fg}📊 Dashboard{/green-fg}          - View token metrics and stats",
      "{yellow-fg}🏭 Create Token{/yellow-fg}       - Initialize a new stablecoin",
      "{blue-fg}👥 Manage Minters{/blue-fg}     - Add/remove authorized minters",
      "{red-fg}🛡️  Compliance{/red-fg}          - Blacklist and compliance tools",
      "{magenta-fg}⚙️  Settings{/magenta-fg}           - Configure TUI preferences",
      "",
      "{gray-fg}Press 'q' to quit{/gray-fg}",
    ],
  });

  // Info box
  const infoBox = blessed.box({
    bottom: 3,
    left: "center",
    width: 60,
    height: 5,
    content: state.mint
      ? `{center}{bold}Current Token:{/bold}\n{cyan-fg}${state.mint.toBase58()}{/cyan-fg}\n{gray-fg}Network: ${state.connection.rpcEndpoint.includes("devnet") ? "Devnet" : "Mainnet"}{/gray-fg}{/center}`
      : `{center}{yellow-fg}⚠ No token selected{/yellow-fg}\n{gray-fg}Create a new token or load existing{/gray-fg}{/center}`,
    tags: true,
    border: {
      type: "line",
    },
    style: {
      border: {
        fg: "yellow",
      },
    },
  });

  screen.append(title);
  screen.append(menuBox);
  screen.append(infoBox);

  menuBox.focus();

  // Handle selection
  menuBox.on("select", (item: any, index: number) => {
    switch (index) {
      case 0: // Dashboard
        if (state.mint) {
          onNavigate("dashboard");
        } else {
          state.error = "No token selected. Please create or load a token first.";
          screen.render();
        }
        break;
      case 1: // Create Token
        onNavigate("create");
        break;
      case 2: // Manage Minters
        if (state.mint) {
          onNavigate("minters");
        } else {
          state.error = "No token selected. Please create a token first.";
          screen.render();
        }
        break;
      case 3: // Compliance
        if (state.mint) {
          onNavigate("compliance");
        } else {
          state.error = "No token selected. Please create a token first.";
          screen.render();
        }
        break;
      case 4: // Settings
        onNavigate("settings");
        break;
    }
  });

  screen.key(["q", "C-c"], () => {
    process.exit(0);
  });

  screen.render();
}
