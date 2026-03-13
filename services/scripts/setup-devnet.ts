import {
	Connection,
	Keypair,
	LAMPORTS_PER_SOL,
	PublicKey,
} from "@solana/web3.js";
import { Presets, SolanaStablecoin } from "@stbr/sss-token-sdk";
import fs from "fs";
import os from "os";
import path from "path";

const TOKEN_PROGRAM_ID = new PublicKey(
	"GQp6UgyhLZP6zXRf24JH2BiwuoSAfYZruJ3WUPkqgj8X",
);
const ORACLE_PROGRAM_ID = new PublicKey(
	"7nFqXZae9mzYP7LefmCe9C1V2zzPbrY3nLR9WVGorQee",
);

async function setup() {
	console.log("Connecting to Devnet...");
	const connection = new Connection(
		"https://api.devnet.solana.com",
		"confirmed",
	);
	const walletPath = path.join(os.homedir(), ".config/solana/id.json");

	if (!fs.existsSync(walletPath)) {
		throw new Error(`Wallet not found at ${walletPath}`);
	}

	const secretKey = JSON.parse(fs.readFileSync(walletPath, "utf-8"));
	const authority = Keypair.fromSecretKey(Uint8Array.from(secretKey));

	console.log("Authority:", authority.publicKey.toBase58());
	const balance = await connection.getBalance(authority.publicKey);
	console.log("Balance:", balance / LAMPORTS_PER_SOL, "SOL");

	if (balance < 0.5 * LAMPORTS_PER_SOL) {
		throw new Error(
			"Insufficient balance for deployment on Devnet. Need at least 0.5 SOL.",
		);
	}

	console.log("Initializing Stablecoin via SDK on Devnet...");
	const mintKeypair = Keypair.generate();
	const { stablecoin: sdk } = await SolanaStablecoin.create(connection, {
		authority,
		mintKeypair,
		programId: TOKEN_PROGRAM_ID,
		oracleProgramId: ORACLE_PROGRAM_ID,
		preset: Presets.SSS_1,
		name: "USD Red",
		symbol: "USDr",
		decimals: 6,
		uri: "https://pastebin.com/raw/ZHzHzyK2",
	});

	console.log("Stablecoin Mint:", sdk.mint.toBase58());

	console.log("Initializing Metaplex metadata for wallet display...");
	const metadataPda = await sdk.initializeMetaplexMetadata(
		{
			name: "USD Red",
			symbol: "USDr",
			uri: "https://pastebin.com/raw/ZHzHzyK2",
			sellerFeeBasisPoints: 0,
		},
		mintKeypair,
	);
	console.log("Metaplex Metadata PDA:", metadataPda.toBase58());
	console.log("✓ Token will now display in wallets (Phantom, Solflare, etc.)");

	console.log("Initializing Oracle via SDK...");
	await sdk.oracle.initialize({
		baseCurrency: "USD",
		quoteCurrency: "USD",
		maxStalenessSeconds: 3600,
		aggregationMethod: 0,
		minFeedsRequired: 1,
	});

	console.log("Adding a manual feed for testing...");
	await sdk.oracle.addFeed({
		feedIndex: 0,
		feedType: 3, // Manual
		label: "Devnet Manual Feed 0",
	});

	console.log("\n--- COPY THESE TO YOUR .env ---");
	console.log(`STABLECOIN_MINT=${sdk.mint.toBase58()}`);
	console.log(`METADATA_PDA=${metadataPda.toBase58()}`);
	console.log("------------------------------");
}

setup().catch((err) => {
	console.error("❌ Setup failed:", err);
	process.exit(1);
});
