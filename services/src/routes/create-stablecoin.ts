import { TOKEN_2022_PROGRAM_ID } from "@solana/spl-token";
import { Connection, Keypair, PublicKey } from "@solana/web3.js";
import { Presets, SolanaStablecoin } from "@stbr/sss-token-sdk";
import { Hono } from "hono";
import { db } from "../db/index.js";
import { stablecoins } from "../db/schema.js";
import { log } from "../index.js";
import { adminAuth } from "../middleware/auth.js";

const app = new Hono();

// Protect all create-stablecoin routes
app.use("/*", adminAuth);

/**
 * POST /
 * Create a new stablecoin
 */
app.post("/", async (c) => {
	try {
		const body = await c.req.json();
		const {
			preset,
			name,
			symbol,
			decimals = 6,
			uri = "",
			extensions = {},
			roles = {},
		} = body;

		// Validate required fields
		if (!preset || !name || !symbol) {
			c.status(400);
			return c.json({
				error: "Missing required fields: preset, name, symbol",
			});
		}

		// Validate preset
		if (!["sss1", "sss2", "sss3"].includes(preset)) {
			c.status(400);
			return c.json({
				error: "Invalid preset. Must be sss1, sss2, or sss3",
			});
		}

		// Get authority keypair from env
		const authoritySecretKey = JSON.parse(
			process.env.AUTHORITY_SECRET_KEY || "[]",
		);
		if (authoritySecretKey.length === 0) {
			c.status(500);
			return c.json({ error: "Authority keypair not configured" });
		}
		const authority = Keypair.fromSecretKey(
			Uint8Array.from(authoritySecretKey),
		);

		// Connect to Solana
		const connection = new Connection(
			process.env.SOLANA_RPC_URL || "https://api.devnet.solana.com",
		);

		// Generate mint keypair
		const mintKeypair = Keypair.generate();

		// Map preset string to SDK preset
		const presetMap = {
			sss1: Presets.SSS_1,
			sss2: Presets.SSS_2,
			sss3: Presets.SSS_3,
		};

		log.info(
			`Creating ${preset.toUpperCase()} stablecoin: ${symbol} (${name})`,
		);

		// Get transfer hook program ID if requested or for SSS-2 preset
		const transferHookProgramId =
			preset === "sss2" || extensions.transferHook
				? new PublicKey(
						process.env.TRANSFER_HOOK_PROGRAM_ID ||
							"HPksBobjquMqBfnCgpqBQDkomJ4HmGB1AbvJnemNBEig",
					)
				: undefined;

		log.info(
			`Transfer hook program ID: ${transferHookProgramId?.toBase58() || "none"}`,
		);
		log.info(`Preset: ${preset}, Extensions: ${JSON.stringify(extensions)}`);

		// Create the stablecoin
		try {
			const { stablecoin, signature: creationSignature } =
				await SolanaStablecoin.create(connection, {
					preset: presetMap[preset as keyof typeof presetMap],
					name,
					symbol,
					decimals,
					uri,
					authority,
					mintKeypair,
					transferHookProgramId,
					extensions: {
						permanentDelegate: extensions.permanentDelegate,
						transferHook: extensions.transferHook,
						defaultAccountFrozen: extensions.defaultFrozen,
					},
				});

			const mintAddress = mintKeypair.publicKey.toBase58();
			log.info(`Stablecoin created: ${mintAddress}`);

			// If SSS-2, initialize transfer hook
			let hookSignature: string | undefined;
			if (preset === "sss2" && stablecoin.compliance) {
				log.info("Initializing transfer hook for SSS-2...");

				// Wait for mint to be confirmed on-chain with retry logic
				let retries = 0;
				const maxRetries = 5;

				while (retries < maxRetries) {
					try {
						// Wait with exponential backoff
						const delay = Math.min(2000 * Math.pow(2, retries), 15000);
						await new Promise((resolve) => setTimeout(resolve, delay));

						// Verify mint is properly initialized with finalized commitment
						// Finalized is much safer for subsequent simulations on common RPC clusters
						const mintInfo = await connection.getAccountInfo(
							mintKeypair.publicKey,
							"finalized",
						);
						if (!mintInfo) {
							log.warn(
								`Attempt ${retries + 1}: Mint account not fully finalized on RPC yet...`,
							);
							throw new Error("Mint account not finalized");
						}

						// Verify the mint account properties
						if (!mintInfo.owner.equals(TOKEN_2022_PROGRAM_ID)) {
							throw new Error(
								`Owner mismatch: ${mintInfo.owner.toBase58()}, expected ${TOKEN_2022_PROGRAM_ID.toBase58()}`,
							);
						}

						if (mintInfo.data.length < 82) {
							throw new Error(
								`Invalid mint data size: ${mintInfo.data.length}`,
							);
						}

						log.info(
							`Attempt ${retries + 1}: Mint finalized (${mintInfo.data.length} bytes). Waiting 2s for RPC state consistency...`,
						);
						await new Promise((resolve) => setTimeout(resolve, 2000));

						hookSignature = await stablecoin.compliance.initializeHook();
						log.info(`Transfer hook initialized: ${hookSignature}`);
						break;
					} catch (hookError: any) {
						retries++;

						// Log full details for debugging simulation failures
						if (hookError.logs) {
							log.error(
								`Hook Init Simulation Failure Logs: ${JSON.stringify(hookError.logs, null, 2)}`,
							);
						}

						log.warn(
							`Transfer hook initialization attempt ${retries} failed: ${hookError.message}`,
						);

						if (retries >= maxRetries) {
							log.error(
								"Transfer hook initialization failed after all retries. The mint was created but the hook requires manual initialization.",
							);
							break;
						}
					}
				}
			}

			// Add initial minter if specified
			if (roles.minter) {
				try {
					const minterPubkey = new PublicKey(roles.minter);
					log.info(`Adding initial minter: ${roles.minter}`);
					await stablecoin.addMinter(minterPubkey, BigInt(0)); // 0 = unlimited quota
				} catch (err) {
					log.warn(`Failed to add minter: ${err}`);
				}
			}

			// Update roles if specified
			const roleUpdates: any = {};
			if (roles.burner) roleUpdates.burner = new PublicKey(roles.burner);
			if (roles.pauser) roleUpdates.pauser = new PublicKey(roles.pauser);
			if (roles.blacklister && preset === "sss2")
				roleUpdates.blacklister = new PublicKey(roles.blacklister);

			if (Object.keys(roleUpdates).length > 0) {
				log.info("Updating roles...");
				await stablecoin.updateRoles(roleUpdates);
			}

			// Save to database
			await db.insert(stablecoins).values({
				mintAddress,
				preset,
				name,
				symbol,
				decimals,
				uri: uri || null,
				signature: hookSignature || creationSignature,
			});

			log.info(`Stablecoin saved to database: ${mintAddress}`);

			return c.json({
				success: true,
				mintAddress,
				preset,
				name,
				symbol,
				decimals,
				signature: hookSignature || creationSignature,
				hookInitialized: !!hookSignature,
				hookSignature: hookSignature || null,
				message: hookSignature
					? "Stablecoin created and transfer hook initialized successfully"
					: preset === "sss2"
						? "Stablecoin created but transfer hook initialization failed. Please initialize manually using the CLI or SDK."
						: "Stablecoin created successfully",
			});
		} catch (sdkError: any) {
			log.error(`SDK Error creating stablecoin: ${sdkError.message}`);
			if (sdkError.logs) {
				log.error(
					`Full Transaction Logs: ${JSON.stringify(sdkError.logs, null, 2)}`,
				);
			}

			// Check for specific transfer hook error
			if (
				sdkError.message?.includes("Transfer hook program ID not configured")
			) {
				c.status(400);
				return c.json({
					error: "Transfer hook configuration error",
					details: `SSS-2 preset requires a transfer hook program ID. Please ensure the TRANSFER_HOOK_PROGRAM_ID environment variable is set.`,
					originalError: sdkError.message,
				});
			}

			throw sdkError;
		}
	} catch (error: any) {
		log.error("Final catch creating stablecoin:", error.message);
		if (error.logs) {
			log.error(`Error Logs: ${JSON.stringify(error.logs, null, 2)}`);
		}
		c.status(500);
		return c.json({
			error: error.message || "Failed to create stablecoin",
			details: error.toString(),
		});
	}
});

export default app;
