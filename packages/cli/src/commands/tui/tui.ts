import { Connection, PublicKey } from "@solana/web3.js";
import { SolanaStablecoin } from "@stbr/sss-token-sdk";
import { Command } from "commander";
import { error } from "../../utils/display";
import { loadKeypair } from "../../utils/keypair";

export function tuiCommand(): Command {
  const cmd = new Command("tui");
  cmd
    .description("Launch interactive Terminal UI for real-time monitoring")
    .option("-i, --interval <seconds>", "Refresh interval in seconds", "5")
    .action(async (opts, cmd) => {
      const globals = cmd.parent!.opts();
      try {
        // Check if blessed is installed
        let blessed: any;
        let contrib: any;
        try {
          blessed = require("blessed");
          contrib = require("blessed-contrib");
        } catch {
          error("TUI requires blessed and blessed-contrib packages.");
          error(
            "Install them with: pnpm add blessed blessed-contrib @types/blessed",
          );
          process.exit(1);
        }

        const authority = loadKeypair(globals.keypair);
        const connection = new Connection(globals.url, "confirmed");

        const refreshInterval = Number.parseInt(opts.interval) * 1000;

        // Launch TUI with menu system
        await launchTUI(
          connection,
          authority,
          globals.mint ? new PublicKey(globals.mint) : null,
          blessed,
          contrib,
          refreshInterval,
        );
      } catch (err: any) {
        error(`TUI launch failed: ${err.message}`);
        process.exit(1);
      }
    });
  return cmd;
}

async function launchTUI(
  connection: Connection,
  authority: any,
  initialMint: PublicKey | null,
  blessed: any,
  contrib: any,
  refreshInterval: number,
) {
  const screen = blessed.screen({
    smartCSR: true,
    title: "SSS Token TUI",
    fullUnicode: true,
  });

  let mint = initialMint;
  let stable: SolanaStablecoin | null = null;
  let cleanupFn: (() => void) | null = null;

  if (mint) {
    try {
      stable = await SolanaStablecoin.load(connection, mint, authority);
    } catch (err: any) {
      console.error(`Failed to load token: ${err.message}`);
    }
  }

  async function showMenu() {
    if (cleanupFn) {
      cleanupFn();
      cleanupFn = null;
    }
    screen.children.forEach((child: any) => screen.remove(child));

    // Title
    const title = blessed.box({
      top: 1,
      left: "center",
      width: "90%",
      height: 5,
      content:
        "{center}{bold}{cyan-fg}╔═══════════════════════════════════════════════════════════╗{/cyan-fg}{/bold}\n" +
        "{center}{bold}{cyan-fg}║     SOLANA STABLECOIN STANDARD - TERMINAL INTERFACE       ║{/cyan-fg}{/bold}\n" +
        "{center}{bold}{cyan-fg}╚═══════════════════════════════════════════════════════════╝{/cyan-fg}{/bold}\n" +
        "{center}{gray-fg}v0.1.0{/gray-fg}{/center}",
      tags: true,
      style: {
        fg: "white",
      },
    });

    // Menu
    const menuBox = blessed.list({
      top: 7,
      left: "center",
      width: 70,
      height: 13,
      label: " ═ Main Menu ═ ",
      tags: true,
      border: {
        type: "line",
      },
      style: {
        border: {
          fg: "cyan",
        },
        label: {
          fg: "cyan",
          bold: true,
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
        "  [1] Dashboard          View token metrics and real-time stats",
        "  [2] Select Token       Choose from existing tokens",
        "  [3] Create Token       Initialize a new stablecoin",
        "",
        "  [Q] Quit               Exit application",
      ],
    });

    // Info box
    const infoBox = blessed.box({
      bottom: 2,
      left: "center",
      width: 70,
      height: 6,
      label: " ═ Current Configuration ═ ",
      content: mint
        ? "{center}{bold}Token Mint:{/bold}\n{cyan-fg}" + mint.toBase58() + "{/cyan-fg}\n\n{bold}Network:{/bold} {green-fg}" + (connection.rpcEndpoint.includes("devnet") ? "Devnet" : connection.rpcEndpoint.includes("mainnet") ? "Mainnet-Beta" : "Localnet") + "{/green-fg}{/center}"
        : "{center}{yellow-fg}No token selected{/yellow-fg}\n{gray-fg}Create a new token to get started{/gray-fg}{/center}",
      tags: true,
      border: {
        type: "line",
      },
      style: {
        border: {
          fg: "yellow",
        },
        label: {
          fg: "yellow",
          bold: true,
        },
      },
    });

    screen.append(title);
    screen.append(menuBox);
    screen.append(infoBox);

    menuBox.focus();

    menuBox.on("select", async (item: any, index: number) => {
      switch (index) {
        case 0: // Dashboard
          if (mint && stable) {
            await showDashboard();
          } else {
            infoBox.setContent(
              "{center}{red-fg}ERROR: No token selected{/red-fg}\n{gray-fg}Please select or create a token first{/gray-fg}{/center}",
            );
            screen.render();
          }
          break;
        case 1: // Select Token
          await showSelectToken();
          break;
        case 2: // Create Token
          await showCreate();
          break;
      }
    });

    screen.key(["q", "Q", "C-c"], () => {
      process.exit(0);
    });

    screen.key(["1"], async () => {
      if (mint && stable) {
        await showDashboard();
      }
    });

    screen.key(["2"], async () => {
      await showSelectToken();
    });

    screen.key(["3"], async () => {
      await showCreate();
    });

    screen.render();
  }

  async function showSelectToken() {
    screen.children.forEach((child: any) => screen.remove(child));

    const { selectTokenScreen } = await import("./screens/select-token.js");
    await selectTokenScreen(
      blessed,
      screen,
      connection,
      authority,
      async (selectedMint: PublicKey) => {
        mint = selectedMint;
        stable = await SolanaStablecoin.load(connection, mint, authority);
        await showMenu();
      },
      showMenu,
    );
  }

  async function showDashboard() {
    if (!stable) return;
    screen.children.forEach((child: any) => screen.remove(child));

    const { createDashboardScreen } = await import("./screens/dashboard.js");
    cleanupFn = await createDashboardScreen(
      blessed,
      contrib,
      screen,
      stable,
      connection,
      refreshInterval,
      showMenu,
    );
  }

  async function showCreate() {
    screen.children.forEach((child: any) => screen.remove(child));

    const { createTokenScreen } = await import("./screens/create.js");
    await createTokenScreen(
      blessed,
      screen,
      connection,
      authority,
      async (newMint: string) => {
        mint = new PublicKey(newMint);
        stable = await SolanaStablecoin.load(connection, mint, authority);
        await showMenu();
      },
      showMenu,
    );
  }

  await showMenu();
}
