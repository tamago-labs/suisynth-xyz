module suisynth::governance {
    use sui::object::{Self, UID};
    use sui::coin::{Self, Coin};
    use sui::balance::{Self, Balance, Supply};
    use sui::transfer;
    use sui::tx_context::{Self, TxContext};
    use sui::clock::{Self, Clock};
    use sui::table::{Self, Table};
    use sui::vec_map::{Self, VecMap};
    use sui::event;
    
    use std::vector;
    use std::option::{Self, Option};
    
    // Governance token type
    public struct GOVERNANCE has drop {}
    
    // Governance global object
    public struct GovernanceGlobal has key {
        id: UID,
        supply: Supply<GOVERNANCE>,
        treasury: Balance<GOVERNANCE>,
        rewards_pool: Balance<GOVERNANCE>,
        staking_pool: Balance<GOVERNANCE>,
        
        // Reward rates in tokens per day (scaled by 10^9)
        base_reward_rate: u64,
        
        // Emission schedule
        emission_start_time: u64,
        emission_end_time: u64,
        last_emission_update: u64,
        total_emission_per_day: u64,
        
        // Allocation percentages (scaled by 10^4 so 5000 = 50%)
        treasury_allocation: u64,
        rewards_allocation: u64,
        staking_allocation: u64,
        
        // Stakers and suppliers info
        stakers: Table<address, StakerInfo>,
        suppliers: Table<address, SupplierInfo>,
        supplier_list: vector<address>,

        // Vesting schedule for treasury
        treasury_vesting_start: u64,
        treasury_vesting_duration: u64,
        treasury_vested_amount: u64,
        
        // Utility fields
        paused: bool,
    }
    
    // Individual staker information
    public struct StakerInfo has store {
        staked_amount: u64,
        rewards_earned: u64,
        rewards_claimed: u64,
        last_reward_calculation: u64,
        lock_period: u64, // Selected lock period in days
        lock_end_time: u64,
        voting_power: u64, // Adjusted by lock period
    }
    
    // Supplier information for protocol users providing liquidity
    public struct SupplierInfo has store {
        supplied_amount: u64,
        rewards_earned: u64,
        rewards_claimed: u64,
        last_reward_calculation: u64,
    }
    
    // Cap to manage governance settings
    public struct GovernanceCap has key {
        id: UID
    }
    
    // Events
    public struct RewardClaimed has copy, drop {
        user: address,
        amount: u64,
        timestamp: u64,
        is_supplier: bool,
    }
    
    public struct RewardRateChanged has copy, drop {
        old_rate: u64,
        new_rate: u64,
        timestamp: u64,
    }
    
    public struct AllocationChanged has copy, drop {
        treasury_allocation: u64,
        rewards_allocation: u64,
        staking_allocation: u64,
        timestamp: u64,
    }
    
    // Error codes
    const ERR_PAUSED: u64 = 1;
    const ERR_NOT_AUTHORIZED: u64 = 2;
    const ERR_INVALID_AMOUNT: u64 = 3;
    const ERR_NO_REWARDS: u64 = 4;
    const ERR_INVALID_RATE: u64 = 5;
    const ERR_INVALID_ALLOCATION: u64 = 6;
    const ERR_VESTING_NOT_AVAILABLE: u64 = 7;
    const ERR_NOT_REGISTERED: u64 = 8;
    const ERR_STILL_LOCKED: u64 = 9;
    
    // Initialize the governance system
    fun init(witness: GOVERNANCE, ctx: &mut TxContext) {
        // Create the governance token
        let (treasury_cap, metadata) = coin::create_currency<GOVERNANCE>(
            witness, 
            9, // 9 decimals
            b"SYNTH", 
            b"SuiSynth Governance Token", 
            b"Governance token for SuiSynth protocol", 
            option::none(), 
            ctx
        );
        
        // Freeze the metadata
        transfer::public_freeze_object(metadata);
        
        // Current timestamp
        let current_time = tx_context::epoch_timestamp_ms(ctx);
        
        // Mint initial supply (e.g., 100 million tokens)
        let initial_supply = 100_000_000_000_000_000; // 100M with 9 decimals
        let mut supply = coin::treasury_into_supply<GOVERNANCE>(treasury_cap); 

        // Configure allocations
        let treasury_allocation = 5000; // 50%
        let rewards_allocation = 3000; // 30%
        let staking_allocation = 2000; // 20%
        
        let mut treasury = balance::zero<GOVERNANCE>();
        let mut rewards_pool = balance::zero<GOVERNANCE>();
        let mut staking_pool = balance::zero<GOVERNANCE>();

        // Allocate the initial supply
        let treasury_amount = (initial_supply as u128) * (treasury_allocation as u128) / 10000;
        let rewards_amount = (initial_supply as u128) * (rewards_allocation as u128) / 10000;
        let staking_amount = (initial_supply as u128) * (staking_allocation as u128) / 10000;
         
        // Treasury allocation
        let minted_treasury = balance::increase_supply<GOVERNANCE>(&mut supply, (treasury_amount as u64));
        balance::join(&mut treasury, minted_treasury);
        
        // Rewards allocation
        let minted_rewards = balance::increase_supply<GOVERNANCE>(&mut supply, (rewards_amount as u64)); 
        balance::join(&mut rewards_pool, minted_rewards);
        
        // Staking allocation  
        let minted_staking= balance::increase_supply<GOVERNANCE>(&mut supply, (staking_amount as u64)); 
        balance::join(&mut staking_pool, minted_staking);

        // Create the governance global object
        let governance = GovernanceGlobal {
            id: object::new(ctx),
            supply,
            treasury,
            rewards_pool,
            staking_pool,
            // base_reward_rate: 100_000_000, // 0.1 tokens per day per unit (adjust as needed)
            base_reward_rate: 100_000000000, // Use 100 tokens per day
            emission_start_time: current_time,
            emission_end_time: current_time + (365 * 24 * 60 * 60 * 1000), // 1 year in milliseconds
            last_emission_update: current_time,
            total_emission_per_day: 273_972_602_740, // ~100M / 365 days
            treasury_allocation,
            rewards_allocation,
            staking_allocation,
            stakers: table::new(ctx),
            suppliers: table::new(ctx),
            supplier_list: vector::empty<address>(),
            treasury_vesting_start: current_time,
            treasury_vesting_duration: 730 * 24 * 60 * 60 * 1000, // 2 years in milliseconds
            treasury_vested_amount: 0,
            paused: false,
        };
    
        // Share the governance object
        transfer::share_object(governance);
        
        // Transfer the governance cap to the admin
        transfer::transfer(GovernanceCap { id: object::new(ctx) }, tx_context::sender(ctx));
        
    }
    
    // Register a supplier to start earning rewards
    public(package) fun register_supplier(
        governance: &mut GovernanceGlobal,
        supplied_amount: u64,
        ctx: &mut TxContext
    ) {
        assert!(!governance.paused, ERR_PAUSED);
        
        let sender = tx_context::sender(ctx);
        let current_time = tx_context::epoch_timestamp_ms(ctx);
        
        if (table::contains(&governance.suppliers, sender)) {
            // Update existing supplier
            let info = table::borrow(&governance.suppliers, sender);
            
            // Calculate any pending rewards before updating
            let pending_rewards = calculate_supplier_rewards(governance, info, current_time);
            
            let supplier_info = table::borrow_mut(&mut governance.suppliers, sender);
            supplier_info.rewards_earned = supplier_info.rewards_earned + pending_rewards;
            
            // Update supplier info
            supplier_info.supplied_amount = supplied_amount;
            supplier_info.last_reward_calculation = current_time;
        } else {
            // Create new supplier entry
            let supplier_info = SupplierInfo {
                supplied_amount,
                rewards_earned: 0,
                rewards_claimed: 0,
                last_reward_calculation: current_time,
            };
            
            table::add(&mut governance.suppliers, sender, supplier_info);
            vector::push_back( &mut governance.supplier_list,  sender );
        };
    }
    
    // Update supplier supplied amount (called when supply changes)
    public(package) entry fun update_supplier_amount(
        governance: &mut GovernanceGlobal,
        supplier: address,
        new_amount: u64,
        ctx: &mut TxContext
    ) {
        assert!(!governance.paused, ERR_PAUSED);
        assert!(table::contains(&governance.suppliers, supplier), ERR_NOT_REGISTERED);
        
        let current_time = tx_context::epoch_timestamp_ms(ctx);
        let info = table::borrow(&governance.suppliers, supplier);
        
        // Calculate any pending rewards before updating
        let pending_rewards = calculate_supplier_rewards(governance, info, current_time);

        let supplier_info = table::borrow_mut(&mut governance.suppliers, supplier);
        supplier_info.rewards_earned = supplier_info.rewards_earned + pending_rewards;
        
        // Update supplier info
        supplier_info.supplied_amount = new_amount;
        supplier_info.last_reward_calculation = current_time;
    }
    
    // Claim governance rewards for suppliers
    public entry fun claim_governance_rewards(
        governance: &mut GovernanceGlobal,
        ctx: &mut TxContext
    ) {
        assert!(!governance.paused, ERR_PAUSED);
        
        let sender = tx_context::sender(ctx);
        let current_time = tx_context::epoch_timestamp_ms(ctx);
        
        // Ensure the sender is a registered supplier
        assert!(table::contains(&governance.suppliers, sender), ERR_NOT_REGISTERED);
        
        let info = table::borrow(&governance.suppliers, sender);
        
        // Calculate pending rewards
        let pending_rewards = calculate_supplier_rewards(governance, info, current_time);

        let supplier_info = table::borrow_mut(&mut governance.suppliers, sender);
        supplier_info.rewards_earned = supplier_info.rewards_earned + pending_rewards;
        
        // Get the total claimable amount
        let claimable_amount = supplier_info.rewards_earned - supplier_info.rewards_claimed;
        assert!(claimable_amount > 0, ERR_NO_REWARDS);
        
        // Ensure we have enough in the rewards pool
        assert!(balance::value(&governance.rewards_pool) >= claimable_amount, ERR_NO_REWARDS);
        
        // Update claimed amount
        supplier_info.rewards_claimed = supplier_info.rewards_claimed + claimable_amount;
        supplier_info.last_reward_calculation = current_time;
        
        // Transfer rewards to the supplier
        let reward_coin = coin::from_balance(
            balance::split(&mut governance.rewards_pool, claimable_amount),
            ctx
        );
        transfer::public_transfer(reward_coin, sender);
        
        // Emit event
        event::emit(RewardClaimed {
            user: sender,
            amount: claimable_amount,
            timestamp: current_time,
            is_supplier: true,
        });
    }
    
    // Change governance reward rate (admin only)
    public entry fun change_reward_rate(
        governance: &mut GovernanceGlobal,
        _cap: &GovernanceCap,
        new_rate: u64,
        ctx: &mut TxContext
    ) {
        assert!(!governance.paused, ERR_PAUSED);
        assert!(new_rate > 0, ERR_INVALID_RATE);
        
        let current_time = tx_context::epoch_timestamp_ms(ctx);
        let old_rate = governance.base_reward_rate;
        
        // Update rewards for all suppliers with the current rate before changing
        update_all_rewards(governance, current_time);
        
        // Change the rate
        governance.base_reward_rate = new_rate;
        governance.last_emission_update = current_time;
        
        // Emit event
        event::emit(RewardRateChanged {
            old_rate,
            new_rate,
            timestamp: current_time,
        });
    }
    
    // Change token allocation percentages (admin only)
    public entry fun change_allocation(
        governance: &mut GovernanceGlobal,
        _cap: &GovernanceCap,
        treasury_allocation: u64,
        rewards_allocation: u64,
        staking_allocation: u64,
        ctx: &mut TxContext
    ) {
        assert!(!governance.paused, ERR_PAUSED);
        
        // Ensure allocations sum to 100%
        assert!(
            treasury_allocation + rewards_allocation + staking_allocation == 10000,
            ERR_INVALID_ALLOCATION
        );
        
        let current_time = tx_context::epoch_timestamp_ms(ctx);
        
        // Update rewards for all suppliers with the current allocation before changing
        update_all_rewards(governance, current_time);
        
        // Update allocations
        governance.treasury_allocation = treasury_allocation;
        governance.rewards_allocation = rewards_allocation;
        governance.staking_allocation = staking_allocation;
        
        // Emit event
        event::emit(AllocationChanged {
            treasury_allocation,
            rewards_allocation,
            staking_allocation,
            timestamp: current_time,
        });
    }
    
    // Pause/unpause the governance system (admin only)
    public entry fun set_paused(
        governance: &mut GovernanceGlobal,
        _cap: &GovernanceCap,
        paused: bool
    ) {
        governance.paused = paused;
    }
    
    // ===== Helper Functions =====
    
    // Calculate rewards for a supplier
    fun calculate_supplier_rewards(
        governance: &GovernanceGlobal,
        supplier_info: &SupplierInfo,
        current_time: u64
    ): u64 {
        if (supplier_info.supplied_amount == 0) {
            return 0
        };
        
        // Calculate time elapsed in seconds
        let time_elapsed = (current_time - supplier_info.last_reward_calculation) / 1000;
        if (time_elapsed == 0) {
            return 0
        };
        
        // Calculate new rewards 
        let rewards_per_token = ((time_elapsed as u128) * (governance.base_reward_rate as u128)) / 10000;
        let reward_amount = ( rewards_per_token * (supplier_info.supplied_amount as u128)) / 1000000000  ;

        (reward_amount as u64)
    }
    
    // Update rewards for all suppliers
    fun update_all_rewards(governance: &mut GovernanceGlobal, current_time: u64) {

        let mut i = 0;
        let len = vector::length(&governance.supplier_list);
        
        while (i < len) {
            let supplier = *vector::borrow(&governance.supplier_list, i);
            let info = table::borrow(&mut governance.suppliers, supplier);
            
            let pending_rewards = calculate_supplier_rewards(governance, info, current_time);

            let supplier_info = table::borrow_mut(&mut governance.suppliers, supplier);
            supplier_info.rewards_earned = supplier_info.rewards_earned + pending_rewards;
            supplier_info.last_reward_calculation = current_time;
            
            i = i + 1;
        };
    }
    
    // Get pending rewards for a supplier (view function)
    public fun get_pending_rewards(
        governance: &GovernanceGlobal,
        supplier: address,
        current_time: u64
    ): u64 {
        if (!table::contains(&governance.suppliers, supplier)) {
            return 0
        };
        
        let supplier_info = table::borrow(&governance.suppliers, supplier);
        let pending_calculated = calculate_supplier_rewards(governance, supplier_info, current_time);
        
        // Add previously calculated but unclaimed rewards
        let total_pending = pending_calculated + (supplier_info.rewards_earned - supplier_info.rewards_claimed);
        
        total_pending
    }

    // TODO: Propose & Vote
    
    // ===== Test Functions =====
    
    #[test_only]
    public fun test_init(ctx: &mut TxContext) {
        init(GOVERNANCE {}, ctx);
    }
}
