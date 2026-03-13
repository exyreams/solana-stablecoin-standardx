import type { Connection, Keypair } from "@solana/web3.js";
import { SolanaStablecoin, Presets } from "@stbr/sss-token-sdk";

export async function createTokenScreen(
  blessed: any,
  screen: any,
  connection: Connection,
  authority: Keypair,
  onSuccess: (mint: string) => void,
  onBack: () => void,
) {
  screen.children.forEach((child: any) => screen.remove(child));

  const form = blessed.form({
    parent: screen,
    keys: true,
    left: "center",
    top: 2,
    width: 80,
    height: 24,
    border: {
      type: "line",
    },
    style: {
      border: {
        fg: "cyan",
      },
    },
    label: " ═ Create New Stablecoin ═ ",
  });

  // Title
  blessed.text({
    parent: form,
    top: 1,
    left: 2,
    content: "{bold}{cyan-fg}Configure your new stablecoin{/cyan-fg}{/bold}",
    tags: true,
  });

  // Name field
  blessed.text({
    parent: form,
    top: 3,
    left: 2,
    content: "Token Name:",
  });

  const nameInput = blessed.textbox({
    parent: form,
    name: "name",
    top: 4,
    left: 2,
    height: 3,
    width: 40,
    inputOnFocus: true,
    border: {
      type: "line",
    },
    style: {
      focus: {
        border: {
          fg: "green",
        },
      },
    },
  });

  // Symbol field
  blessed.text({
    parent: form,
    top: 3,
    left: 44,
    content: "Symbol:",
  });

  const symbolInput = blessed.textbox({
    parent: form,
    name: "symbol",
    top: 4,
    left: 44,
    height: 3,
    width: 20,
    inputOnFocus: true,
    border: {
      type: "line",
    },
    style: {
      focus: {
        border: {
          fg: "green",
        },
      },
    },
  });

  // Decimals field
  blessed.text({
    parent: form,
    top: 8,
    left: 2,
    content: "Decimals (0-9):",
  });

  const decimalsInput = blessed.textbox({
    parent: form,
    name: "decimals",
    top: 9,
    left: 2,
    height: 3,
    width: 20,
    inputOnFocus: true,
    border: {
      type: "line",
    },
    style: {
      focus: {
        border: {
          fg: "green",
        },
      },
    },
  });

  // Preset selection
  blessed.text({
    parent: form,
    top: 13,
    left: 2,
    content: "{bold}Select Preset:{/bold}",
    tags: true,
  });

  const presetList = blessed.list({
    parent: form,
    top: 14,
    left: 2,
    width: 76,
    height: 5,
    border: {
      type: "line",
    },
    style: {
      selected: {
        bg: "blue",
        fg: "white",
      },
      border: {
        fg: "yellow",
      },
    },
    keys: true,
    vi: true,
    items: [
      "SSS-1 (Minimal) - Basic stablecoin for internal use",
      "SSS-2 (Compliant) - Regulated stablecoin with blacklist",
    ],
  });

  // Status message
  const statusMsg = blessed.box({
    parent: form,
    bottom: 1,
    left: 2,
    width: 76,
    height: 1,
    tags: true,
    content: "{gray-fg}Press TAB to navigate, ENTER to submit, ESC to cancel{/gray-fg}",
  });

  // Submit button
  const submitBtn = blessed.button({
    parent: form,
    bottom: 3,
    left: 2,
    width: 20,
    height: 3,
    content: "Create Token",
    align: "center",
    border: {
      type: "line",
    },
    style: {
      focus: {
        border: {
          fg: "green",
        },
        bg: "green",
        fg: "black",
      },
      border: {
        fg: "green",
      },
    },
  });

  // Cancel button
  const cancelBtn = blessed.button({
    parent: form,
    bottom: 3,
    left: 24,
    width: 20,
    height: 3,
    content: "Cancel",
    align: "center",
    border: {
      type: "line",
    },
    style: {
      focus: {
        border: {
          fg: "red",
        },
        bg: "red",
        fg: "white",
      },
      border: {
        fg: "red",
      },
    },
  });

  nameInput.focus();

  submitBtn.on("press", async () => {
    const name = nameInput.getValue();
    const symbol = symbolInput.getValue();
    const decimalsStr = decimalsInput.getValue();
    const presetIndex = presetList.selected;

    if (!name || !symbol || !decimalsStr) {
      statusMsg.setContent("{red-fg}Error: All fields are required{/red-fg}");
      screen.render();
      return;
    }

    const decimals = Number.parseInt(decimalsStr);
    if (Number.isNaN(decimals) || decimals < 0 || decimals > 9) {
      statusMsg.setContent("{red-fg}Error: Decimals must be 0-9{/red-fg}");
      screen.render();
      return;
    }

    statusMsg.setContent("{yellow-fg}Creating token... Please wait{/yellow-fg}");
    screen.render();

    try {
      const preset = presetIndex === 1 ? Presets.SSS_2 : Presets.SSS_1;

      const result = await SolanaStablecoin.create(connection, {
        authority,
        name,
        symbol,
        decimals,
        preset,
      });

      statusMsg.setContent(
        `{green-fg}✓ Token created successfully!{/green-fg}`,
      );
      screen.render();

      setTimeout(() => {
        onSuccess(result.stablecoin.mint.toBase58());
      }, 2000);
    } catch (err: any) {
      statusMsg.setContent(`{red-fg}Error: ${err.message}{/red-fg}`);
      screen.render();
    }
  });

  cancelBtn.on("press", () => {
    onBack();
  });

  screen.key(["escape"], () => {
    onBack();
  });

  screen.key(["q", "C-c"], () => {
    process.exit(0);
  });

  screen.render();
}
