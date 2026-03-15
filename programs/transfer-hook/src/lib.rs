use anchor_lang::prelude::*;
use spl_transfer_hook_interface::instruction::TransferHookInstruction;

pub mod errors;
pub mod execute;
pub mod initialize_extra_account_meta_list;

pub use execute::*;
pub use initialize_extra_account_meta_list::*;

declare_id!("HPksBobjquMqBfnCgpqBQDkomJ4HmGB1AbvJnemNBEig");

#[program]
pub mod transfer_hook {
    use super::*;

    /// Called once after the SSS-2 mint is created. Writes the ExtraAccountMetaList
    /// PDA so Token-2022 knows which extra accounts to pass to the hook on every transfer.
    pub fn initialize_extra_account_meta_list(
        ctx: Context<InitializeExtraAccountMetaList>,
    ) -> Result<()> {
        crate::initialize_extra_account_meta_list::initialize_handler(ctx)
    }

    /// Transfer hook logic — checks blacklist entries.
    /// Called internally by the fallback below; never called directly by clients.
    pub fn transfer_hook(ctx: Context<Execute>, amount: u64) -> Result<()> {
        crate::execute::execute_handler(ctx, amount)
    }

    /// Token-2022 invokes the transfer hook using the SPL interface discriminator,
    /// not Anchor's. When no Anchor instruction matches, Anchor calls this fallback,
    /// which parses the SPL instruction and routes it to the transfer_hook handler.
    pub fn fallback<'info>(
        program_id: &Pubkey,
        accounts: &'info [AccountInfo<'info>],
        data: &[u8],
    ) -> Result<()> {
        let instruction = TransferHookInstruction::unpack(data)?;
        match instruction {
            TransferHookInstruction::Execute { amount } => {
                let amount_bytes = amount.to_le_bytes();
                __private::__global::transfer_hook(program_id, accounts, &amount_bytes)
            }
            _ => Err(ProgramError::InvalidInstructionData.into()),
        }
    }
}
