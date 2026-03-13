import { Connection, Keypair, PublicKey } from "@solana/web3.js";
import { TOKEN_2022_PROGRAM_ID } from "@solana/spl-token";

export async function selectTokenScreen(
  blessed: any,
  screen: any,
  connection: Connection,
  authority: Keypair,
  onSelect: (mint: PublicKey) => void,
  onBack: () => void,
) {
  screen.children.forEach((child: any) => screen.remove(child));

  // Title
  const title = blessed.box({
    top: 1,
    left: "center",
    width: "90%",
    height: 3,
    content: "{center}{bold}{cyan-fg}═ Select Token ═{/cyan-fg}{/bold}{/center}",
    tags: true,
    style: {
      fg: "white",
    },
  });

  // Status message
  const statusMsg = blessed.box({
    top: 5,
    left: "center",
    width: "80%",
    height: 3,
    content: "{center}{yellow-fg}Loading tokens...{/yellow-fg}{/center}",
    tags: true,
    style: {
      fg: "white",
    },
  });

  // Token list
  const tokenList = blessed.list({
    top: 9,
    left: "center",
    width: "80%",
    height: 20,
    label: " ═ Available Tokens ═ ",
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
    items: [],
    scrollable: true,
    alwaysScroll: true,
    scrollbar: {
      ch: " ",
      style: {
        bg: "cyan",
      },
    },
  });

  // Instructions
  const instructions = blessed.box({
    bottom: 2,
    left: "center",
    width: "80%",
    height: 3,
    content:
      "{center}{gray-fg}Use arrow keys to navigate, ENTER to select, ESC to go back{/gray-fg}{/center}",
    tags: true,
    style: {
      fg: "white",
    },
  });

  screen.append(title);
  screen.append(statusMsg);
  screen.append(tokenList);
  screen.append(instructions);

  screen.render();

  // Fetch tokens
  try {
    // Get all token accounts owned by the authority
    const tokenAccounts = await connection.getParsedTokenAccountsByOwner(
      authority.publicKey,
      {
        programId: TOKEN_2022_PROGRAM_ID,
      },
    );

    // Extract unique mints
    const mints = new Map<string, any>();
    for (const account of tokenAccounts.value) {
      const mintAddress = account.account.data.parsed.info.mint;
      const balance = account.account.data.parsed.info.tokenAmount.uiAmount;

      if (!mints.has(mintAddress)) {
        mints.set(mintAddress, {
          mint: mintAddress,
          balance: balance || 0,
        });
      }
    }

    if (mints.size === 0) {
      statusMsg.setContent(
        "{center}{yellow-fg}No tokens found{/yellow-fg}\n{gray-fg}Create a new token to get started{/gray-fg}{/center}",
      );
      tokenList.setItems([
        "  No tokens available",
        "",
        "  Press ESC to go back and create a token",
      ]);
      screen.render();
    } else {
      statusMsg.setContent(
        `{center}{green-fg}Found ${mints.size} token(s){/green-fg}{/center}`,
      );

      // Fetch token metadata for each mint
      const tokenItems: Array<{ display: string; mint: string }> = [];

      for (const [mintAddress, data] of mints.entries()) {
        try {
          // Try to get token supply and metadata
          const mintInfo = await connection.getParsedAccountInfo(
            new PublicKey(mintAddress),
          );

          let name = "Unknown Token";
          let symbol = "???";

          if (mintInfo.value && "parsed" in mintInfo.value.data) {
            const parsed = mintInfo.value.data.parsed;
            if (parsed.info) {
              // Try to get extensions for metadata
              const extensions = parsed.info.extensions;
              if (extensions) {
                for (const ext of extensions) {
                  if (ext.extension === "tokenMetadata") {
                    name = ext.state.name || name;
                    symbol = ext.state.symbol || symbol;
                  }
                }
              }
            }
          }

          const shortMint = `${mintAddress.slice(0, 8)}...${mintAddress.slice(-8)}`;
          tokenItems.push({
            display: `  ${symbol.padEnd(8)} | ${name.padEnd(20)} | ${shortMint} | Balance: ${data.balance}`,
            mint: mintAddress,
          });
        } catch (err) {
          // If we can't fetch metadata, just show the mint
          const shortMint = `${mintAddress.slice(0, 8)}...${mintAddress.slice(-8)}`;
          tokenItems.push({
            display: `  ???      | Unknown Token        | ${shortMint} | Balance: ${data.balance}`,
            mint: mintAddress,
          });
        }
      }

      tokenList.setItems(tokenItems.map((t) => t.display));

      tokenList.on("select", (item: any, index: number) => {
        if (index < tokenItems.length) {
          const selected = tokenItems[index];
          onSelect(new PublicKey(selected.mint));
        }
      });

      screen.render();
    }
  } catch (err: any) {
    statusMsg.setContent(
      `{center}{red-fg}Error loading tokens:{/red-fg}\n{gray-fg}${err.message}{/gray-fg}{/center}`,
    );
    tokenList.setItems([
      "  Failed to load tokens",
      "",
      "  Press ESC to go back",
    ]);
    screen.render();
  }

  tokenList.focus();

  screen.key(["escape"], () => {
    onBack();
  });

  screen.key(["q", "Q", "C-c"], () => {
    process.exit(0);
  });

  screen.render();
}
