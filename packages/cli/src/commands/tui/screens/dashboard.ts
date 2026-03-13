import type { Connection } from "@solana/web3.js";
import type { SolanaStablecoin } from "@stbr/sss-token-sdk";

export async function createDashboardScreen(
  blessed: any,
  contrib: any,
  screen: any,
  stable: SolanaStablecoin,
  connection: Connection,
  refreshInterval: number,
  onBack: () => void,
) {
  screen.children.forEach((child: any) => screen.remove(child));

  const grid = new contrib.grid({ rows: 16, cols: 12, screen });

  // Header
  const headerBox = grid.set(0, 0, 2, 12, blessed.box, {
    label: " ═ Token Dashboard ═ ",
    tags: true,
    border: { type: "line" },
    style: {
      fg: "white",
      border: { fg: "cyan" },
      label: { fg: "cyan", bold: true },
    },
  });

  // Token Info
  const tokenInfoBox = grid.set(2, 0, 4, 4, blessed.box, {
    label: " ═ Token Info ═ ",
    tags: true,
    border: { type: "line" },
    style: {
      fg: "white",
      border: { fg: "green" },
      label: { fg: "green", bold: true },
    },
    scrollable: true,
    keys: true,
    vi: true,
  });

  // Supply Metrics
  const supplyMetricsBox = grid.set(2, 4, 4, 4, blessed.box, {
    label: " ═ Supply Metrics ═ ",
    tags: true,
    border: { type: "line" },
    style: {
      fg: "white",
      border: { fg: "yellow" },
      label: { fg: "yellow", bold: true },
    },
  });

  // Roles
  const rolesBox = grid.set(2, 8, 4, 4, blessed.box, {
    label: " ═ Access Control ═ ",
    tags: true,
    border: { type: "line" },
    style: {
      fg: "white",
      border: { fg: "magenta" },
      label: { fg: "magenta", bold: true },
    },
    scrollable: true,
    keys: true,
    vi: true,
  });

  // Minters Table
  const mintersTable = grid.set(6, 0, 3, 12, contrib.table, {
    label: " ═ Authorized Minters ═ ",
    keys: true,
    vi: true,
    fg: "white",
    selectedFg: "white",
    selectedBg: "blue",
    interactive: false,
    columnSpacing: 3,
    columnWidth: [46, 12, 18, 18, 12],
    style: {
      border: { fg: "blue" },
      header: { fg: "cyan", bold: true },
      label: { fg: "blue", bold: true },
    },
  });

  // Supply Chart
  const supplyLine = grid.set(9, 0, 4, 6, contrib.line, {
    label: " ═ Supply History ═ ",
    showLegend: true,
    legend: { width: 14 },
    style: {
      line: "yellow",
      text: "white",
      baseline: "white",
      border: { fg: "yellow" },
      label: { fg: "yellow", bold: true },
    },
  });

  // Blockchain Stats
  const blockchainBox = grid.set(9, 6, 2, 6, blessed.box, {
    label: " ═ Blockchain Stats ═ ",
    tags: true,
    border: { type: "line" },
    style: {
      fg: "white",
      border: { fg: "cyan" },
      label: { fg: "cyan", bold: true },
    },
  });

  // Activity Log
  const activityLog = grid.set(11, 6, 2, 6, blessed.log, {
    label: " ═ Activity Log ═ ",
    tags: true,
    border: { type: "line" },
    style: {
      fg: "white",
      border: { fg: "green" },
      label: { fg: "green", bold: true },
    },
    scrollable: true,
    alwaysScroll: true,
  });

  // Compliance Status
  const complianceBox = grid.set(13, 0, 2, 6, blessed.box, {
    label: " ═ Compliance Status ═ ",
    tags: true,
    border: { type: "line" },
    style: {
      fg: "white",
      border: { fg: "red" },
      label: { fg: "red", bold: true },
    },
  });

  // Oracle Status
  const oracleBox = grid.set(13, 6, 2, 6, blessed.box, {
    label: " ═ Oracle Status ═ ",
    tags: true,
    border: { type: "line" },
    style: {
      fg: "white",
      border: { fg: "blue" },
      label: { fg: "blue", bold: true },
    },
  });

  // Status Bar
  const statusBar = blessed.box({
    bottom: 0,
    left: 0,
    width: "100%",
    height: 1,
    tags: true,
    style: {
      fg: "white",
      bg: "blue",
    },
  });
  screen.append(statusBar);

  const supplyHistory: { x: string[]; y: number[] } = { x: [], y: [] };
  let updateCount = 0;
  let lastBlockHeight = 0;
  let lastSlot = 0;

  function formatAddress(address: any, length = 8): string {
    const str = address.toBase58();
    return `${str.slice(0, length)}...${str.slice(-length)}`;
  }

  function formatNumber(num: number | bigint, decimals = 2): string {
    return Number(num).toLocaleString(undefined, {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    });
  }

  function getClusterName(endpoint: string): string {
    if (endpoint.includes("mainnet")) return "Mainnet-Beta";
    if (endpoint.includes("devnet")) return "Devnet";
    if (endpoint.includes("testnet")) return "Testnet";
    return "Localnet";
  }

  async function updateData() {
    try {
      updateCount++;
      const timestamp = new Date().toLocaleTimeString();
      const date = new Date().toLocaleDateString();

      activityLog.log(`{cyan-fg}[${timestamp}] Fetching data...{/cyan-fg}`);

      const [blockHeight, slot, epochInfo] = await Promise.all([
        connection.getBlockHeight().catch(() => 0),
        connection.getSlot().catch(() => 0),
        connection.getEpochInfo().catch(() => null),
      ]);

      const [status, supply, roles, minters] = await Promise.all([
        stable.getStatus(),
        stable.getTotalSupply(),
        stable.getRoles(),
        stable.getMinters(),
      ]);

      const decimals = status.decimals;
      const humanSupply = Number(supply) / 10 ** decimals;

      let preset = "SSS-1 (Minimal)";
      let presetColor = "green";
      if (
        status.enablePermanentDelegate &&
        status.enableTransferHook &&
        status.enableConfidentialTransfers
      ) {
        preset = "SSS-2 + SSS-3 (Hybrid)";
        presetColor = "magenta";
      } else if (status.enablePermanentDelegate && status.enableTransferHook) {
        preset = "SSS-2 (Compliant)";
        presetColor = "yellow";
      } else if (status.enableConfidentialTransfers) {
        preset = "SSS-3 (Private)";
        presetColor = "cyan";
      }

      headerBox.setContent(
        `{center}{bold}{${presetColor}-fg}${status.name} (${status.symbol}){/${presetColor}-fg}{/bold}\n` +
        `{gray-fg}Mint: ${status.mint.toBase58()}{/gray-fg}\n` +
        `{gray-fg}${date} ${timestamp} | Update #${updateCount}{/gray-fg}{/center}`,
      );

      const pausedStatus = status.paused
        ? "{red-fg}{bold}[!] PAUSED{/bold}{/red-fg}"
        : "{green-fg}[+] Active{/green-fg}";

      tokenInfoBox.setContent(
        `{bold}Preset:{/bold} {${presetColor}-fg}${preset}{/${presetColor}-fg}\n` +
        `{bold}Status:{/bold} ${pausedStatus}\n` +
        `{bold}Version:{/bold} ${status.version}\n` +
        `{bold}Decimals:{/bold} ${decimals}\n\n` +
        `{bold}Token-2022 Extensions:{/bold}\n` +
        `  ${status.enablePermanentDelegate ? "{green-fg}[+]{/green-fg}" : "{gray-fg}[-]{/gray-fg}"} Permanent Delegate\n` +
        `  ${status.enableTransferHook ? "{green-fg}[+]{/green-fg}" : "{gray-fg}[-]{/gray-fg}"} Transfer Hook\n` +
        `  ${status.defaultAccountFrozen ? "{green-fg}[+]{/green-fg}" : "{gray-fg}[-]{/gray-fg}"} Default Frozen\n` +
        `  ${status.enableConfidentialTransfers ? "{green-fg}[+]{/green-fg}" : "{gray-fg}[-]{/gray-fg}"} Confidential Transfers`,
      );

      const totalMinted = minters.reduce(
        (sum: bigint, m: any) => sum + m.minted,
        0n,
      );
      const totalQuota = minters.reduce((sum: bigint, m: any) => {
        return m.quota === 0n ? sum : sum + m.quota;
      }, 0n);

      const activeMinters = minters.filter((m: any) => m.active).length;
      const utilizationPct =
        totalQuota > 0n
          ? ((Number(totalMinted) / Number(totalQuota)) * 100).toFixed(2)
          : "N/A";

      supplyMetricsBox.setContent(
        `{bold}Total Supply:{/bold}\n` +
        `  {yellow-fg}{bold}${formatNumber(humanSupply, decimals)} ${status.symbol}{/bold}{/yellow-fg}\n\n` +
        `{bold}Minter Stats:{/bold}\n` +
        `  Active Minters: {green-fg}${activeMinters}{/green-fg} / ${minters.length}\n` +
        `  Total Minted: ${formatNumber(Number(totalMinted) / 10 ** decimals, 2)}\n` +
        `  Total Quota: ${totalQuota === 0n ? "Unlimited" : formatNumber(Number(totalQuota) / 10 ** decimals, 2)}\n` +
        `  Utilization: ${utilizationPct === "N/A" ? "N/A" : `${utilizationPct}%`}`,
      );

      rolesBox.setContent(
        `{bold}Master Authority:{/bold}\n` +
        `  ${formatAddress(roles.masterAuthority, 10)}\n\n` +
        `{bold}Pending Master:{/bold}\n` +
        `  ${roles.pendingMaster ? formatAddress(roles.pendingMaster, 10) : "{gray-fg}(none){/gray-fg}"}\n\n` +
        `{bold}Burner:{/bold}\n` +
        `  ${formatAddress(roles.burner, 10)}\n\n` +
        `{bold}Pauser:{/bold}\n` +
        `  ${formatAddress(roles.pauser, 10)}\n\n` +
        `{bold}Blacklister:{/bold}\n` +
        `  ${formatAddress(roles.blacklister, 10)}\n\n` +
        `{bold}Seizer:{/bold}\n` +
        `  ${formatAddress(roles.seizer, 10)}`,
      );

      const minterRows = minters.map((m: any) => {
        const quotaHuman =
          m.quota === 0n
            ? "Unlimited"
            : formatNumber(Number(m.quota) / 10 ** decimals, 2);
        const mintedHuman = formatNumber(Number(m.minted) / 10 ** decimals, 2);
        const remaining =
          m.quota === 0n
            ? "INF"
            : formatNumber(Number(m.quota - m.minted) / 10 ** decimals, 2);
        const statusIcon = m.active ? "[+] Active" : "[-] Inactive";

        return [
          formatAddress(m.minter, 11),
          statusIcon,
          quotaHuman,
          mintedHuman,
          remaining,
        ];
      });

      mintersTable.setData({
        headers: ["Minter Address", "Status", "Quota", "Minted", "Remaining"],
        data:
          minterRows.length > 0
            ? minterRows
            : [["(no minters configured)", "", "", "", ""]],
      });

      const timeLabel = new Date().toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
      });
      supplyHistory.x.push(timeLabel);
      supplyHistory.y.push(humanSupply);

      if (supplyHistory.x.length > 30) {
        supplyHistory.x.shift();
        supplyHistory.y.shift();
      }

      supplyLine.setData([
        {
          title: `${status.symbol} Supply`,
          x: supplyHistory.x,
          y: supplyHistory.y,
          style: { line: "yellow" },
        },
      ]);

      const blockDiff = blockHeight - lastBlockHeight;
      const slotDiff = slot - lastSlot;
      lastBlockHeight = blockHeight;
      lastSlot = slot;

      blockchainBox.setContent(
        `{bold}Network:{/bold} {cyan-fg}${getClusterName(connection.rpcEndpoint)}{/cyan-fg}\n` +
        `{bold}Block Height:{/bold} ${formatNumber(blockHeight, 0)} ${blockDiff > 0 ? `{green-fg}(+${blockDiff}){/green-fg}` : ""}\n` +
        `{bold}Slot:{/bold} ${formatNumber(slot, 0)} ${slotDiff > 0 ? `{green-fg}(+${slotDiff}){/green-fg}` : ""}\n` +
        `{bold}Epoch:{/bold} ${epochInfo ? epochInfo.epoch : "N/A"}`,
      );

      if (status.enableTransferHook && stable.compliance) {
        complianceBox.setContent(
          `{bold}Transfer Hook:{/bold} {green-fg}[+] Enabled{/green-fg}\n` +
          `{bold}Blacklist:{/bold} Active\n` +
          `{bold}Seize Authority:{/bold} ${formatAddress(roles.seizer, 8)}\n` +
          `{bold}Mode:{/bold} SSS-2 Compliant`,
        );
      } else {
        complianceBox.setContent(
          `{bold}Transfer Hook:{/bold} {gray-fg}[-] Disabled{/gray-fg}\n` +
          `{bold}Blacklist:{/bold} Not Available\n` +
          `{bold}Mode:{/bold} SSS-1 (No Enforcement)`,
        );
      }

      if (stable.oracle) {
        try {
          const oracleStatus = await stable.oracle.getStatus();
          const feeds = await stable.oracle.getFeeds();

          oracleBox.setContent(
            `{bold}Oracle:{/bold} {green-fg}[+] Enabled{/green-fg}\n` +
            `{bold}Feeds:{/bold} ${feeds.length} active\n` +
            `{bold}Authority:{/bold} ${formatAddress(oracleStatus.authority, 8)}\n` +
            `{bold}Status:{/bold} Operational`,
          );
        } catch {
          oracleBox.setContent(
            `{bold}Oracle:{/bold} {yellow-fg}[!] Error{/yellow-fg}\n` +
            `{bold}Status:{/bold} Unable to fetch data`,
          );
        }
      } else {
        oracleBox.setContent(
          `{bold}Oracle:{/bold} {gray-fg}[-] Not Configured{/gray-fg}\n` +
          `{bold}Peg:{/bold} USD (Default)\n` +
          `{bold}Mode:{/bold} Fixed 1:1`,
        );
      }

      activityLog.log(
        `{green-fg}[${timestamp}] [+] Updated - Supply: ${formatNumber(humanSupply, 2)} ${status.symbol}{/green-fg}`,
      );

      if (status.paused) {
        activityLog.log(`{red-fg}[${timestamp}] [!] TOKEN IS PAUSED{/red-fg}`);
      }

      const refreshSec = refreshInterval / 1000;
      statusBar.setContent(
        ` SSS Token Dashboard | ` +
        `Cluster: ${getClusterName(connection.rpcEndpoint)} | ` +
        `Auto-refresh: ${refreshSec}s | ` +
        `[ESC] Back to Menu | [R] Refresh | [Q] Quit`,
      );

      screen.render();
    } catch (err: any) {
      const timestamp = new Date().toLocaleTimeString();
      activityLog.log(
        `{red-fg}[${timestamp}] [X] ERROR: ${err.message}{/red-fg}`,
      );
      screen.render();
    }
  }

  screen.key(["escape"], () => {
    onBack();
  });

  screen.key(["q", "Q", "C-c"], () => {
    process.exit(0);
  });

  screen.key(["r", "R"], () => {
    activityLog.log("{cyan-fg}[MANUAL] Forcing refresh...{/cyan-fg}");
    screen.render();
    updateData();
  });

  activityLog.log(
    "{green-fg}{bold}[STARTED] Dashboard Initialized{/bold}{/green-fg}",
  );

  await updateData();
  const interval = setInterval(updateData, refreshInterval);

  return () => clearInterval(interval);
}
