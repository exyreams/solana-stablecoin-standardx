import chalk from "chalk";
import Table from "cli-table3";

export function success(msg: string) {
	console.log(chalk.green("✓"), msg);
}

export function info(msg: string) {
	console.log(chalk.cyan("ℹ"), msg);
}

export function warn(msg: string) {
	console.log(chalk.yellow("⚠"), msg);
}

export function error(msg: string) {
	console.error(chalk.red("✗"), msg);
}

export function printTable(headers: string[], rows: string[][]) {
	const table = new Table({
		head: headers.map((h) => chalk.bold(h)),
		style: { head: [], border: [] },
	});
	rows.forEach((r) => table.push(r));
	console.log(table.toString());
}

export function printTxLink(sig: string, cluster = "devnet") {
	const url = `https://explorer.solana.com/tx/${sig}?cluster=${cluster}`;
	console.log(chalk.dim(`TX: ${url}`));
}
