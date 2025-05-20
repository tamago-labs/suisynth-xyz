

/// SuiSynth Protocol
/// A synthetic asset protocol on Sui blockchain that enables:
///    1. Minting of synthetic BTC (suiBTC) backed by various collateral types
///    2. Leveraged trading of suiBTC with up to 4x leverage
///    3. Lending/borrowing of suiBTC with interest accrual
///
/// This protocol combines synthetic asset creation with leverage capabilities,
/// allowing users to gain exposure to BTC price movements on Sui blockchain.
///
/// Key features:
/// - Multi-collateral support for minting synthetic BTC
/// - Lending pool for leverage trading
/// - Dynamic interest rate model based on utilization
/// - Position-based accounting for lending and borrowing
/// - Liquidation mechanisms to maintain system solvency

module suisynth::sui_btc {

    use sui::url;
    use sui::sui::SUI;  
    use sui::balance::{ Self, Supply, Balance}; 
    use sui::tx_context::{ Self };
    use sui::coin::{Self, Coin};
    use sui::object::{ Self, ID };
    use sui::bag::{Self, Bag};
    use sui::table::{Self, Table};
    use sui::vec_map::{Self, VecMap};

    use std::string::{Self, String}; 
    use std::type_name::{get, into_string, TypeName};
    use std::ascii::into_bytes; 
    use std::option::{Self};

    use switchboard::aggregator::{Aggregator, CurrentResult}; 
    use sui::event;
    use suisynth::governance::{Self, GovernanceGlobal};


    // ======== Constants ========

    const ERR_PAUSED: u64 = 1;
    const ERR_TOO_LOW_VALUE: u64 = 2;
    const ERR_INVALID_VALUE: u64 = 3;
    const ERR_ALREADY_CREATED: u64 = 4;
    const ERR_POOL_NOT_REGISTER: u64 = 5;
    const ERR_ZERO_VALUE: u64 = 6;
    const ERR_NOT_EXCEED_MIN_C_RATIO: u64 = 7;
    const ERR_NO_ACTIVE_POSITION: u64 = 8;
    const ERR_NOT_ENOUGH_DEBT: u64 = 9;
    const ERR_INVALID_COLLATERAL_AMOUNT: u64 = 10;
    const ERR_INSUFFICIENT_AMOUNT: u64 = 11;
    const ERR_NOT_BELOW_THRESHOLD: u64 = 12;
    const ERR_NOT_ENOUGH_LIQUIDITY: u64 = 13;
    const ERR_INVALID_LEVERAGE: u64 = 14;
    const ERR_INVALID_PERCENTAGE: u64 = 15;
    const ERR_INVALID_COLLATERAL_TYPE: u64 = 16;
    const ERR_BELOW_THRESHOLD: u64 = 17;
    const ERR_STILL_DEBT: u64 = 18;
    const ERR_NO_PROFIT: u64 = 19;
    const ERR_INSUFFICIENT_LIQUIDITY: u64 = 20;

    

    // ======== Structs =========

    // synth assets represents BTC
    public struct SUI_BTC has drop {}

    public struct CollateralPool<phantom X> has store {
        global: ID,
        total_collateral: Balance<X>, // Total collateral deposited (in token X)
        total_debt: u64, // Total suiBTC minted against this collateral pool
        min_collateral_ratio: u64, // Minimum collateral ratio required (e.g., 150%)
        liquidation_threshold: u64, // Liquidation threshold (e.g., 120%)
        liquidation_penalty: u64, // Liquidation penalty (e.g., 10%)
        mint_fee: u64, // Fee for minting suiBTC (e.g., 0.25%)
        burn_fee: u64, // Fee for burning suiBTC (e.g., 0.25%)
        price_oracle: u64, // Price feed for this collateral asset against USD
        positions: Table<address, Position>, // Map of user addresses to their positions
    }

    // User position in the collateral pool
    public struct Position has store {
        collateral_amount: u64, // Amount of collateral deposited
        debt_amount: u64,// Amount of suiBTC minted
        last_collateral_ratio: u64, // User's collateral ratio at the time of last action
        last_update_time: u64 // Timestamp of last update
    }

    // Lending pool for suiBTC 
    public struct LendingPool has store { 
        total_suibtc: Balance<SUI_BTC>, // Total suiBTC in the pool 
        total_borrowed: u64, // Total suiBTC borrowed from the pool 
        borrow_rate: u64, // Borrow interest rate  
        supply_rate: u64, // Supply interest rate  
        max_leverage: u64, // Maximum leverage allowed (e.g., 4x = 40000) 
        optimal_utilization: u64, // Utilization rate threshold for optimal interest 
        suppliers: Table<address, SupplyPosition>,// Map of suppliers and their deposits 
        borrowers: Table<address, BorrowPosition>,// Map of borrowers and their loans
        borrower_list: vector<address>,
        last_accrual_time: u64, // Last interest accrual timestamp
        collaterals: Bag,
        base_rate: u64,
        multiplier_1: u64,
        multiplier_2: u64
    }
    
    // Supply position in the lending pool
    public struct SupplyPosition has store { 
        supplied_amount: u64, // Amount of suiBTC supplied 
        accrued_interest: u64, // Interest accrued but not claimed 
        last_interest_update_time: u64, // Last interest accrual timestamp
    }

    // Borrow position in the lending pool
    public struct BorrowPosition has store { 
        borrowed_amount: u64, // Amount of suiBTC borrowed 
        collateral: Table<TypeName, u64>,// Collateral provided (by type) 
        accrued_interest: u64,// Interest accrued but not repaid 
        leverage: u64, // Current leverage ratio 
        entry_btc_price: u64, // BTC price at position entry
        entry_collateral_price: u64, // Collateral price at position entry
        last_update_time: u64 // Last update timestamp
    }

    public struct SuiBTCGlobal has key {
        id: UID,
        collateral_pools: Bag, // Collection of different collateral pools (SUI, USDC, etc.)
        syth_supply: Supply<SUI_BTC>, // Supply of synthetic tokens (suiBTC) 
        fee_pool: Balance<SUI_BTC>, // Global protocol fee collected in suiBTC
        btc_price_oracle: u64, // Oracle price 
        has_paused: bool, // Paused state for emergencies
        global_min_c_ratio: u64, // Global minimum collateral ratio across all pools (e.g., 120%)
        global_liquidation_threshold: u64, // Global liquidation threshold (e.g., 110%) 
        fee_to_stakers_percentage: u64, // Fee distribution: percentage to stakers (e.g., 80%)
        fee_to_treasury_percentage: u64, // Fee distribution: percentage to treasury (e.g., 20%)
        lending_pool: LendingPool, // Lending pool with leverages
        governance_id: Option<ID>, // ID of governance object (optional to allow initialization)
    }

    // ======== Events =========

    // Events for synthetic asset minting and burning
    public struct MintEvent has copy, drop {
        sender: address,
        collateral_type: TypeName,
        collateral_amount: u64,
        suibtc_amount: u64,
        collateral_ratio: u64,
        fee_amount: u64
    }

    public struct BurnEvent has copy, drop {
        sender: address,
        collateral_type: TypeName,
        collateral_withdrawn: u64,
        suibtc_burned: u64,
        fee_amount: u64
    }

    public struct AddCollateralEvent has copy, drop {
        sender: address,
        collateral_type: TypeName,
        collateral_amount: u64,
        new_collateral_ratio: u64
    }

    public struct LiquidationEvent has copy, drop {
        target: address,
        liquidator: address,
        collateral_type: TypeName,
        collateral_seized: u64,
        debt_repaid: u64,
        collateral_ratio: u64
    }

    // Events for lending pool
    public struct SupplyEvent has copy, drop {
        sender: address,
        suibtc_amount: u64,
        supply_rate: u64,
        total_supplied: u64,
        utilization_rate: u64
    }

    public struct WithdrawEvent has copy, drop {
        sender: address,
        suibtc_amount: u64,
        remaining_supplied: u64,
        supply_rate: u64,
        utilization_rate: u64
    }

    public struct BorrowWithLeverageEvent has copy, drop {
        sender: address,
        collateral_type: TypeName,
        collateral_amount: u64,
        borrowed_amount: u64,
        leverage: u64,
        entry_btc_price: u64,
        entry_collateral_price: u64,
        borrow_rate: u64,
        utilization_rate: u64
    }

    public struct RepayLoanEvent has copy, drop {
        sender: address,
        repay_amount: u64,
        remaining_debt: u64,
        accrued_interest: u64,
        interest_paid: u64,
        utilization_rate: u64
    }

    public struct CashOutPositionEvent has copy, drop {
        sender: address,
        collateral_type: TypeName,
        percentage: u64,
        collateral_withdrawn: u64,
        profit_btc: u64,
        debt_reduced: u64
    }

    public struct WithdrawCollateralEvent has copy, drop {
        sender: address,
        collateral_type: TypeName,
        amount: u64,
        remaining_collateral: u64,
        remaining_debt: u64
    }

    public struct LiquidateLeveragedPositionEvent has copy, drop {
        borrower: address,
        liquidator: address,
        collateral_type: TypeName,
        collateral_seized: u64,
        debt_repaid: u64
    }

    // Governance events
    public struct CollateralPoolCreatedEvent has copy, drop {
        collateral_type: TypeName,
        min_c_ratio: u64,
        liq_threshold: u64,
        liq_penalty: u64,
        mint_fee: u64,
        burn_fee: u64,
        price: u64
    }

    public struct UpdatePriceEvent has copy, drop {
        price_type: String,
        asset_type: TypeName,
        old_price: u64,
        new_price: u64
    }

    public struct DistributeFeeEvent has copy, drop {
        staker_address: address,
        treasury_address: address,
        staker_amount: u64,
        treasury_amount: u64,
        total_fees: u64
    }

    // Using ManagerCap for admin permission
    public struct ManagerCap has key {
        id: UID
    }

    fun init(witness: SUI_BTC, ctx: &mut TxContext) {
        
        transfer::transfer(
            ManagerCap {id: object::new(ctx)},
            tx_context::sender(ctx)
        );

        let (treasury_cap, metadata) = coin::create_currency<SUI_BTC>(witness, 9, b"suiBTC", b"SuiSynth suiBTC Token", b"", option::some(url::new_unsafe_from_bytes(b"https://suisynth.xyz")), ctx);
        transfer::public_freeze_object(metadata);

        // Create empty tables for suppliers and borrowers
        let suppliers = table::new<address, SupplyPosition>(ctx);
        let borrowers = table::new<address, BorrowPosition>(ctx);

        transfer::share_object(SuiBTCGlobal {
            id: object::new(ctx),
            collateral_pools: bag::new(ctx),
            syth_supply: coin::treasury_into_supply<SUI_BTC>(treasury_cap),
            // min_liquidity: balance::zero<SUI_BTC>(),
            fee_pool: balance::zero<SUI_BTC>(),
            btc_price_oracle: 60000_0000, // default 60000 BTC/USD
            has_paused: false,
            global_min_c_ratio: 12000, // 120%
            global_liquidation_threshold: 11000, // 110%
            fee_to_stakers_percentage: 8000, // 80%
            fee_to_treasury_percentage: 2000, // 20%
            lending_pool: LendingPool {
                total_suibtc: balance::zero<SUI_BTC>(),
                total_borrowed: 0,
                borrow_rate: 1000, // 10% initial borrow rate
                supply_rate: 500,  // 5% initial supply rate
                max_leverage: 40000, // 4x maximum leverage
                optimal_utilization: 8000, // 80% optimal utilization
                suppliers,
                borrowers,
                borrower_list: vector::empty<address>(),
                last_accrual_time: tx_context::epoch_timestamp_ms(ctx),
                collaterals: bag::new(ctx),
                base_rate: 200, // 2% base rate
                multiplier_1: 800, // 8% increase per 100% utilization below optimal
                multiplier_2: 3000, // 30% increase per 100% utilization above optimal
            },
            governance_id: option::none(), // Initially null, will be set later
        })
    
    }

    // ======== Entry Points =========

    // ======== Synthetic Asset Functions =========

    // Deposit collateral and mint suiBTC
    // User provides collateral and receives newly minted suiBTC
    // Position must meet minimum collateral ratio requirements
    public entry fun mint<X>(
        global: &mut SuiBTCGlobal, 
        collateral: Coin<X>, 
        sui_btc_amount: u64, 
        ctx: &mut TxContext
    ) {
        // Check that protocol is not paused
        assert!(!global.has_paused, ERR_PAUSED);

        let btc_price_oracle = global.btc_price_oracle;
         
        let pool = get_mut_collateral_pool<X>(global);
        
        // Get collateral amount provided
        let collateral_amount = coin::value(&collateral);
        assert!(collateral_amount > 0, ERR_ZERO_VALUE);
        
        // Get the sender address
        let sender = tx_context::sender(ctx);
        
        // Calculate the value of the collateral in USD
        let collateral_value = (collateral_amount as u128) * (pool.price_oracle as u128) / 10000;
        
        // Calculate the value of the suiBTC being minted in USD
        let sui_btc_value = (sui_btc_amount as u128) * (btc_price_oracle as u128) / 10000;
        
        // Ensure collateral ratio meets the minimum requirement
        // (collateral_value / sui_btc_value) * 10000 >= min_collateral_ratio
        assert!(
            sui_btc_value == 0 || (collateral_value * 10000 / sui_btc_value) >= (pool.min_collateral_ratio as u128),
            ERR_NOT_EXCEED_MIN_C_RATIO
        );
        
        // Calculate fee amount (sui_btc_amount * mint_fee / 10000)
        let fee_amount = (sui_btc_amount as u128) * (pool.mint_fee as u128) / 10000;
        let fee_amount = (fee_amount as u64);
        
        // Extract collateral from coin and add to pool
        let collateral_balance = coin::into_balance(collateral);
        balance::join(&mut pool.total_collateral, collateral_balance);
        
        // Update total debt
        pool.total_debt = pool.total_debt + sui_btc_amount;
        
        // Update or create user position
        if (table::contains(&pool.positions, sender)) {
            let position = table::borrow_mut(&mut pool.positions, sender);
            position.collateral_amount = position.collateral_amount + collateral_amount;
            position.debt_amount = position.debt_amount + sui_btc_amount;
            position.last_collateral_ratio = ((collateral_value * 10000 / sui_btc_value) as u64);
            position.last_update_time = tx_context::epoch(ctx);
        } else {
            let new_position = Position {
                collateral_amount: collateral_amount,
                debt_amount: sui_btc_amount,
                last_collateral_ratio: ((collateral_value * 10000 / sui_btc_value) as u64),
                last_update_time: tx_context::epoch(ctx)
            };
            table::add(&mut pool.positions, sender, new_position);
        };
        
        // Mint suiBTC to the user
        let sui_btc = coin::from_balance(balance::increase_supply(&mut global.syth_supply, sui_btc_amount), ctx);
        transfer::public_transfer(sui_btc, sender);
        
        // Add fee to protocol fee pool
        balance::join(&mut global.fee_pool, balance::increase_supply(&mut global.syth_supply, fee_amount));

        // Emit mint event
        event::emit(MintEvent {
            sender,
            collateral_type: get<X>(),
            collateral_amount,
            suibtc_amount: sui_btc_amount,
            collateral_ratio: ((collateral_value * 10000 / sui_btc_value) as u64),
            fee_amount
        });
    }

    // Burn suiBTC and withdraw collateral
    // User returns suiBTC and receives their collateral back
    // Updates user's position in the collateral pool
    public entry fun burn<X>(global: &mut SuiBTCGlobal, sui_btc: Coin<SUI_BTC>, collateral_amount: u64, ctx: &mut TxContext) { 
        // Check that protocol is not paused
        assert!(!global.has_paused, 0);

        let btc_price_oracle = global.btc_price_oracle;

        let pool = get_mut_collateral_pool<X>(global);

        // Get suiBTC amount provided
        let sui_btc_amount = coin::value(&sui_btc);
        assert!(sui_btc_amount > 0, ERR_ZERO_VALUE);

        // Get the sender address
        let sender = tx_context::sender(ctx);
        
        // Ensure user has an existing position
        assert!(table::contains(&pool.positions, sender), ERR_NO_ACTIVE_POSITION);
        
        // Get user's current position
        let position = table::borrow_mut(&mut pool.positions, sender);

        // Ensure user has enough debt to burn
        assert!(position.debt_amount >= sui_btc_amount, ERR_NOT_ENOUGH_DEBT);

        // Ensure user is not withdrawing more collateral than they have
        assert!(position.collateral_amount >= collateral_amount, ERR_INVALID_COLLATERAL_AMOUNT);

        // Calculate fee amount (sui_btc_amount * burn_fee / 10000)
        let fee_amount = (sui_btc_amount as u128) * (pool.burn_fee as u128) / 10000;
        let fee_amount = (fee_amount as u64);

        // The actual debt reduction is (sui_btc_amount - fee)
        let debt_reduction = sui_btc_amount - fee_amount;
          
        // If withdrawing collateral, check remaining position health
        if (collateral_amount > 0 && (position.debt_amount - debt_reduction) > 0) {
            // Calculate the value of the remaining collateral in USD
            let remaining_collateral = position.collateral_amount - collateral_amount;
            let remaining_collateral_value = ((remaining_collateral as u128) * (pool.price_oracle as u128)) / 10000;
            
            // Calculate the value of the remaining debt in USD
            let remaining_debt = position.debt_amount - debt_reduction;
            let remaining_debt_value = ((remaining_debt as u128) * (btc_price_oracle as u128)) / 10000;
            
            // Ensure remaining position meets minimum collateral ratio
            assert!(
                (remaining_collateral_value * 10000 / remaining_debt_value) >= (pool.min_collateral_ratio as u128),
                ERR_NOT_EXCEED_MIN_C_RATIO
            );
        };
 
        // Process the coin - the entire amount is consumed
        let mut burn_balance = coin::into_balance(sui_btc); 
 
        // Add fee to protocol fee pool
        let fee_balance = balance::split(&mut burn_balance, fee_amount);
        
        // Update total debt
        pool.total_debt = pool.total_debt - debt_reduction;

        // Update user position
        position.debt_amount = position.debt_amount - debt_reduction;
        position.collateral_amount = position.collateral_amount - collateral_amount;

        // If collateral being withdrawn, transfer it to the user
        if (collateral_amount > 0) {
            let collateral_to_return = balance::split(&mut pool.total_collateral, collateral_amount);
            let collateral_coin = coin::from_balance(collateral_to_return, ctx);
            transfer::public_transfer(collateral_coin, sender);
        };

        // Recalculate collateral ratio
        if (position.debt_amount > 0) {
            // Calculate the value of the remaining collateral in USD
            let collateral_value = ((position.collateral_amount as u128) * (pool.price_oracle as u128)) / 10000;
            
            // Calculate the value of the remaining debt in USD
            let debt_value = ((position.debt_amount as u128) * (btc_price_oracle as u128)) / 10000;
            
            // Update collateral ratio
            position.last_collateral_ratio = ((collateral_value * 10000 / debt_value) as u64);
        } else {
            // If no debt left, set to maximum value
            position.last_collateral_ratio = 18446744073709551615;
            
            // If no collateral left either, remove the position entirely
            if (position.collateral_amount == 0) {
                let Position { collateral_amount: _, debt_amount: _, last_collateral_ratio: _, last_update_time: _ } = 
                    table::remove(&mut pool.positions, sender);
            };
        };

        // Update last update time if position still exists
        if (table::contains(&pool.positions, sender)) {
            let position = table::borrow_mut(&mut pool.positions, sender);
            position.last_update_time = tx_context::epoch(ctx);
        };
        balance::join(&mut global.fee_pool, fee_balance);  
        balance::decrease_supply(&mut global.syth_supply, burn_balance);

        // Emit burn event
        event::emit(BurnEvent {
            sender,
            collateral_type: get<X>(),
            collateral_withdrawn: collateral_amount,
            suibtc_burned: sui_btc_amount,
            fee_amount
        });
    }

    // Add more collateral to an existing position
    // User adds collateral to improve their collateral ratio
    // Does not mint additional suiBTC
    public entry fun add_collateral<X>(global: &mut SuiBTCGlobal, collateral: Coin<X>, ctx: &mut TxContext) {
        // Check that protocol is not paused
        assert!(!global.has_paused, ERR_PAUSED);

        let btc_price_oracle = global.btc_price_oracle;

        let pool = get_mut_collateral_pool<X>(global);

        // Get collateral amount provided
        let collateral_amount = coin::value(&collateral);
        assert!(collateral_amount > 0, ERR_ZERO_VALUE);

        // Get the sender address
        let sender = tx_context::sender(ctx);
        
        // Ensure user has an existing position
        assert!(table::contains(&pool.positions, sender), ERR_NO_ACTIVE_POSITION);

        // Get user's current position
        let position = table::borrow_mut(&mut pool.positions, sender);

        // Extract collateral from coin and add to pool
        let collateral_balance = coin::into_balance(collateral);
        balance::join(&mut pool.total_collateral, collateral_balance);

        // Update position's collateral amount
        position.collateral_amount = position.collateral_amount + collateral_amount;

        // Recalculate collateral ratio
        // Calculate the value of the total collateral in USD
        let collateral_value = ((position.collateral_amount as u128) * (pool.price_oracle as u128)) / 10000;

        // Calculate the value of the debt in USD
        let debt_value = ((position.debt_amount as u128) * (btc_price_oracle as u128)) / 10000;

        // Calculate new collateral ratio
        if (debt_value > 0) {
            position.last_collateral_ratio = ((collateral_value * 10000 / debt_value) as u64);
        } else {
            // If debt is zero, set to maximum value
            position.last_collateral_ratio = 18446744073709551615;
        };
    
        // Capture data for event
        let new_collateral_ratio = position.last_collateral_ratio;
        
        // Update last update time
        position.last_update_time = tx_context::epoch(ctx);

        // Emit add collateral event
        event::emit(AddCollateralEvent {
            sender,
            collateral_type: get<X>(),
            collateral_amount,
            new_collateral_ratio
        });
    }

    // Liquidate an undercollateralized position
    // Anyone can call this on positions below liquidation threshold
    // Liquidator provides suiBTC and receives discounted collateral
    public entry fun liquidate<X>(global: &mut SuiBTCGlobal, target: address, sui_btc: Coin<SUI_BTC>, ctx: &mut TxContext) {
        // Check that protocol is not paused
        assert!(!global.has_paused, ERR_PAUSED);
        
        let btc_price_oracle = global.btc_price_oracle;

        let pool = get_mut_collateral_pool<X>(global);
        
        // Ensure target has a position
        assert!(table::contains(&pool.positions, target), ERR_NO_ACTIVE_POSITION);
        
        // Get target's position
        let position = table::borrow(&pool.positions, target);
        
        // Calculate current collateral value in USD
        let collateral_value = ((position.collateral_amount as u128) * (pool.price_oracle as u128)) / 10000;
        
        // Calculate current debt value in USD
        let debt_value = ((position.debt_amount as u128) * (btc_price_oracle as u128)) / 10000;
        
        // Calculate current collateral ratio
        let current_ratio = if (debt_value > 0) {
            (collateral_value * 10000) / debt_value
        } else {
            18446744073709551615 // Maximum value if no debt
        };
        
        // Ensure position is below liquidation threshold
        assert!(current_ratio < (pool.liquidation_threshold as u128), ERR_NOT_BELOW_THRESHOLD);
        
        // Get the liquidator address
        let liquidator = tx_context::sender(ctx);
        
        // Determine how much debt to repay (limited by the liquidator's suiBTC)
        // We allow partial liquidations
        let liquidator_sui_btc = coin::value(&sui_btc);
        let debt_to_repay = if (liquidator_sui_btc >= position.debt_amount) {
            position.debt_amount
        } else {
            liquidator_sui_btc
        };
        
        // Calculate collateral to seize based on the repaid debt amount plus liquidation penalty
        // (debt_to_repay * btc_price * (1 + liquidation_penalty)) / collateral_price
        let penalty_multiplier = 10000 + pool.liquidation_penalty;
        let collateral_to_seize = (((debt_to_repay as u128) * (btc_price_oracle as u128) * (penalty_multiplier as u128)) 
                                / (pool.price_oracle as u128) / 10000);
        
        // Cap the collateral to seize to the available collateral
        let collateral_to_seize = if (collateral_to_seize > (position.collateral_amount as u128)) {
            position.collateral_amount
        } else {
            (collateral_to_seize as u64)
        };
        
        // Split off the exact amount of suiBTC needed
        let mut sui_btc_balance = coin::into_balance(sui_btc);
        let burn_balance = balance::split(&mut sui_btc_balance, debt_to_repay);
        
        // Return any remaining suiBTC to the liquidator
        if (balance::value(&sui_btc_balance) > 0) {
            transfer::public_transfer(coin::from_balance(sui_btc_balance, ctx), liquidator);
        } else {
            balance::destroy_zero(sui_btc_balance);
        };

        // Update pool's total debt
        pool.total_debt = pool.total_debt - debt_to_repay;
        
        // Transfer collateral to liquidator
        let collateral_to_transfer = balance::split(&mut pool.total_collateral, collateral_to_seize);
        let collateral_coin = coin::from_balance(collateral_to_transfer, ctx);
        transfer::public_transfer(collateral_coin, liquidator);
        
        // Update target's position
        let position = table::borrow_mut(&mut pool.positions, target);
        position.debt_amount = position.debt_amount - debt_to_repay;
        position.collateral_amount = position.collateral_amount - collateral_to_seize;
        
        // Recalculate collateral ratio
        if (position.debt_amount > 0) {
            // Calculate the value of the remaining collateral in USD
            let remaining_collateral_value = ((position.collateral_amount as u128) * (pool.price_oracle as u128)) / 10000;
            
            // Calculate the value of the remaining debt in USD
            let remaining_debt_value = ((position.debt_amount as u128) * (btc_price_oracle as u128)) / 10000;
            
            // Update collateral ratio
            position.last_collateral_ratio = ((remaining_collateral_value * 10000 / remaining_debt_value) as u64);
        } else {
            // If no debt left, set to maximum value
            position.last_collateral_ratio = 18446744073709551615;
            
            // If no collateral left either, remove the position entirely
            if (position.collateral_amount == 0) {
                let Position { collateral_amount: _, debt_amount: _, last_collateral_ratio: _, last_update_time: _ } = 
                    table::remove(&mut pool.positions, target);
            };
        };
        
        // Update last update time if position still exists
        if (table::contains(&pool.positions, target)) {
            let position = table::borrow_mut(&mut pool.positions, target);
            position.last_update_time = tx_context::epoch(ctx);
        };

        // Store collateral ratio for event
        let collateral_ratio_for_event = current_ratio as u64;
        
        // Decrease supply
        balance::decrease_supply(&mut global.syth_supply, burn_balance);

        // Emit liquidation event
        event::emit(LiquidationEvent {
            target,
            liquidator,
            collateral_type: get<X>(),
            collateral_seized: collateral_to_seize,
            debt_repaid: debt_to_repay,
            collateral_ratio: collateral_ratio_for_event
        });
    }

    // ======== Lending Pool Functions =========

    
    // Supply suiBTC to the lending pool
    // User deposits suiBTC into the pool and earns interest over time
    // Updates user's supply position directly in the pool
    public entry fun supply_suibtc(global: &mut SuiBTCGlobal, governance: &mut GovernanceGlobal, sui_btc: Coin<SUI_BTC>, ctx: &mut TxContext) { 
        // Check that protocol is not paused
        assert!(!global.has_paused, ERR_PAUSED);
        
        // First, accrue interest to update all positions
        accrue_interest(global, ctx);
        
        // Get suiBTC amount provided
        let sui_btc_amount = coin::value(&sui_btc);
        assert!(sui_btc_amount > 0, ERR_ZERO_VALUE);
        
        // Get the sender address
        let sender = tx_context::sender(ctx);
        
        // Add suiBTC to the lending pool
        let sui_btc_balance = coin::into_balance(sui_btc);
        balance::join(&mut global.lending_pool.total_suibtc, sui_btc_balance);
        
        // Check if user already has a supply position
        if (table::contains(&global.lending_pool.suppliers, sender)) {
            // Update existing position
            let position = table::borrow_mut(&mut global.lending_pool.suppliers, sender);
            position.supplied_amount = position.supplied_amount + sui_btc_amount;
            position.last_interest_update_time = tx_context::epoch(ctx);
            
        } else {
            // Create new supply position
            let new_position = SupplyPosition {
                supplied_amount: sui_btc_amount,
                accrued_interest: 0,
                last_interest_update_time: tx_context::epoch(ctx)
            };
            table::add(&mut global.lending_pool.suppliers, sender, new_position);
        };
        
        // Collect data for event before updating interest rates
        let pre_update_supply_rate = global.lending_pool.supply_rate;
        let total_supplied = balance::value(&global.lending_pool.total_suibtc);
        
        // Update interest rates based on new utilization
        update_interest_rates(global);

        // Register/update supplier in governance if linked
        if (option::is_some(&global.governance_id) && object::id(governance) == *option::borrow(&global.governance_id)) {
            governance::register_supplier(governance,  total_supplied , ctx);
        };

        // Calculate utilization rate for the event
        let utilization_rate = if (total_supplied == 0) {
            0
        } else {
            ((global.lending_pool.total_borrowed as u128) * 10000) / (total_supplied as u128)
        };

        // Emit supply event
        event::emit(SupplyEvent {
            sender,
            suibtc_amount: sui_btc_amount,
            supply_rate: pre_update_supply_rate,
            total_supplied,
            utilization_rate: utilization_rate as u64
        });
    }

    // Withdraw suiBTC from the lending pool
    // User withdraws supplied suiBTC plus accrued interest
    // Checks that withdrawal doesn't break minimum utilization requirements
    public entry fun withdraw_suibtc(
        global: &mut SuiBTCGlobal, 
        governance: &mut GovernanceGlobal,
        amount: u64, 
        ctx: &mut TxContext
    ) {
        // Check that protocol is not paused
        assert!(!global.has_paused, ERR_PAUSED);
        
        // First, accrue interest to update all positions
        accrue_interest(global, ctx);
        
        // Get the sender address
        let sender = tx_context::sender(ctx);
        
        // Ensure user has a supply position
        assert!(table::contains(&global.lending_pool.suppliers, sender), ERR_NO_ACTIVE_POSITION);
        
        // Calculate available liquidity in the pool
        let total_liquidity = balance::value(&global.lending_pool.total_suibtc);
        let available_liquidity = total_liquidity - global.lending_pool.total_borrowed;
        
        // Ensure there's enough liquidity to withdraw
        assert!(available_liquidity >= amount, ERR_NOT_ENOUGH_LIQUIDITY);

        // Get user's supply position
        let position = table::borrow_mut(&mut global.lending_pool.suppliers, sender);
        
        // Ensure user has enough suiBTC to withdraw
        assert!(position.supplied_amount >= amount, ERR_INSUFFICIENT_AMOUNT);
        
        // Update user's supply position
        position.supplied_amount = position.supplied_amount - amount;
        position.last_interest_update_time = tx_context::epoch(ctx);

        // If user's supply becomes zero, remove their position
        if (position.supplied_amount == 0) {
            let SupplyPosition { supplied_amount: _, accrued_interest: _, last_interest_update_time: _ } = 
                table::remove(&mut global.lending_pool.suppliers, sender);
        };
        
        // Split the amount from the lending pool
        let withdrawn_balance = balance::split(&mut global.lending_pool.total_suibtc, amount);
        
        // Create coin from the balance and transfer to user
        let sui_btc = coin::from_balance(withdrawn_balance, ctx);
        transfer::public_transfer(sui_btc, sender);
        
        // Collect data for event before updating interest rates
        let remaining_supplied = if (table::contains(&global.lending_pool.suppliers, sender)) {
            table::borrow(&global.lending_pool.suppliers, sender).supplied_amount
        } else {
            0
        };
        let pre_update_supply_rate = global.lending_pool.supply_rate;
        let total_supplied = balance::value(&global.lending_pool.total_suibtc);
        
        // Update interest rates based on new utilization
        update_interest_rates(global);

        // Update supplier in governance if linked
        if (option::is_some(&global.governance_id) && 
            object::id(governance) == *option::borrow(&global.governance_id)) {
            governance::update_supplier_amount(governance, sender, remaining_supplied, ctx);
        };

        // Calculate utilization rate for the event
        let utilization_rate = if (total_supplied == 0) {
            0
        } else {
            ((global.lending_pool.total_borrowed as u128) * 10000) / (total_supplied as u128)
        };

        // Emit withdraw event
        event::emit(WithdrawEvent {
            sender,
            suibtc_amount: amount,
            remaining_supplied,
            supply_rate: pre_update_supply_rate,
            utilization_rate: utilization_rate as u64
        });
    }

    // Add a helper function to claim governance rewards
    public entry fun claim_governance_rewards(
        global: &SuiBTCGlobal,
        governance: &mut GovernanceGlobal,
        ctx: &mut TxContext
    ) {
        // Check that protocol is not paused
        assert!(!global.has_paused, ERR_PAUSED);
        
        // Check that governance is linked
        assert!(option::is_some(&global.governance_id), ERR_POOL_NOT_REGISTER);
        assert!(object::id(governance) == *option::borrow(&global.governance_id), ERR_INVALID_VALUE);
        
        // Call the governance claim function
        governance::claim_governance_rewards(governance, ctx);
    }

    // Borrow suiBTC with leverage
    // User provides collateral and borrows additional suiBTC with leverage up to max_leverage
    // Collateral value must be sufficient to support the leveraged position
    public entry fun borrow_with_leverage<X>(
        global: &mut SuiBTCGlobal, 
        collateral: Coin<X>, 
        leverage: u64, 
        ctx: &mut TxContext
    ) {
        // Check that protocol is not paused
        assert!(!global.has_paused, ERR_PAUSED);
        
        // First, accrue interest to update all positions
        accrue_interest(global, ctx);
        
        // Get collateral type
        let type_name = get<X>();

        let btc_price_oracle = global.btc_price_oracle;
        let total_suibtc = balance::value(&global.lending_pool.total_suibtc);
        let total_borrowed = global.lending_pool.total_borrowed;

        // We need to access the collateral pool for price information
        assert!(bag::contains(&global.collateral_pools, type_name), ERR_POOL_NOT_REGISTER);
        let pool = bag::borrow<TypeName, CollateralPool<X>>(&global.collateral_pools, type_name);
        let pool_price_oracle = pool.price_oracle;

        // Ensure leverage is within allowed range (1x to max_leverage)
        // 1x leverage = 10000, 4x leverage = 40000
        assert!(leverage >= 10000 && leverage <= global.lending_pool.max_leverage, ERR_INVALID_LEVERAGE);
        
        // Get collateral amount and value
        let collateral_amount = coin::value(&collateral);
        assert!(collateral_amount > 0, ERR_ZERO_VALUE);
        
        // Calculate collateral value in USD
        let collateral_value = ((collateral_amount as u128) * (pool.price_oracle as u128)) / 10000;
        
        // Calculate borrow amount based on leverage
        // Subtract 1x (base collateral) to get the borrowing multiplier
        let borrow_multiplier = leverage - 10000;
        let borrow_value = (collateral_value * (borrow_multiplier as u128)) / 10000;
        
        // Convert to suiBTC amount
        let borrow_amount = (borrow_value * 10000) / (btc_price_oracle as u128);
        
        // Ensure borrowing at least a minimum amount (if leverage > 1x)
        if (leverage > 10000) {
            assert!((borrow_amount as u64) > 0, ERR_ZERO_VALUE);
        };

        // Get the sender address
        let sender = tx_context::sender(ctx);
        
        // If leverage is exactly 1x, no borrowing needed
        if (borrow_amount == 0) {
            // Just add collateral to position without borrowing
            add_collateral_to_position<X>(global, collateral, sender, ctx);
            return
        };
        
        // Check available liquidity in lending pool
        let available_liquidity = total_suibtc - total_borrowed;
        assert!((borrow_amount as u64) <= available_liquidity, ERR_NOT_ENOUGH_LIQUIDITY);
        
        // Add collateral to the lending pool
        let collateral_balance = coin::into_balance(collateral);
        
        // Store collateral in the lending pool's collaterals bag
        if (bag::contains(&global.lending_pool.collaterals, type_name)) {
            let existing_balance = bag::borrow_mut<TypeName, Balance<X>>(&mut global.lending_pool.collaterals, type_name);
            balance::join(existing_balance, collateral_balance);
        } else {
            bag::add(&mut global.lending_pool.collaterals, type_name, collateral_balance);
        };
        
        // Create or update borrow position
        if (table::contains(&global.lending_pool.borrowers, sender)) {
            // Update existing position
            let position = table::borrow_mut(&mut global.lending_pool.borrowers, sender);
            
            // Add to borrowed amount
            position.borrowed_amount = position.borrowed_amount + (borrow_amount as u64);
            
            // Add to collateral (create entry for this type if it doesn't exist)
            if (table::contains(&position.collateral, type_name)) {
                let existing_amount = table::borrow_mut(&mut position.collateral, type_name);
                *existing_amount = *existing_amount + collateral_amount;
            } else {
                table::add(&mut position.collateral, type_name, collateral_amount);
            };

            // Update leverage and timestamp
            position.leverage = leverage;
            position.last_update_time = tx_context::epoch(ctx);
        } else {
            // Create new position with collateral table
            let mut collateral_table = table::new<TypeName, u64>(ctx);
            table::add(&mut collateral_table, type_name, collateral_amount);
            
            let new_position = BorrowPosition {
                borrowed_amount: (borrow_amount as u64),
                collateral: collateral_table,
                accrued_interest: 0,
                leverage: leverage,
                last_update_time: tx_context::epoch(ctx),
                entry_btc_price: btc_price_oracle,  // Store current BTC price
                entry_collateral_price: pool_price_oracle // Store current collateral price
            };
            table::add(&mut global.lending_pool.borrowers, sender, new_position);
            vector::push_back( &mut global.lending_pool.borrower_list, sender );
        };
        
        // Update global borrowed amount
        global.lending_pool.total_borrowed = global.lending_pool.total_borrowed + (borrow_amount as u64);
        
        // Store data for event
        let event_borrowed_amount = (borrow_amount as u64);
        let entry_btc_price_copy = btc_price_oracle;
        let entry_collateral_price_copy = pool_price_oracle;
        let pre_update_borrow_rate = global.lending_pool.borrow_rate;
        let total_supplied = balance::value(&global.lending_pool.total_suibtc);
        
        // Update interest rates based on new utilization
        update_interest_rates(global);

        // Calculate utilization rate for the event
        let utilization_rate = if (total_supplied == 0) {
            0
        } else {
            ((global.lending_pool.total_borrowed as u128) * 10000) / (total_supplied as u128)
        };

        // Emit borrow with leverage event
        if (borrow_amount > 0) {
            event::emit(BorrowWithLeverageEvent {
                sender,
                collateral_type: get<X>(),
                collateral_amount,
                borrowed_amount: event_borrowed_amount,
                leverage,
                entry_btc_price: entry_btc_price_copy,
                entry_collateral_price: entry_collateral_price_copy,
                borrow_rate: pre_update_borrow_rate,
                utilization_rate: utilization_rate as u64
            });
        };
    }

    // Repay borrowed suiBTC from leveraged position
    // Reduces the user's debt position without requiring actual token transfer
    // Only updates the internal position tracking
    public entry fun repay_loan(
        global: &mut SuiBTCGlobal,
        repay_amount: u64, // Amount of debt to repay
        ctx: &mut TxContext
    ) {
        // Check that protocol is not paused
        assert!(!global.has_paused, ERR_PAUSED);
        
        // First, accrue interest to update all positions
        accrue_interest(global, ctx);
        
        // Get the sender address
        let sender = tx_context::sender(ctx);
        
        // Ensure user has a borrow position
        assert!(table::contains(&global.lending_pool.borrowers, sender), ERR_NO_ACTIVE_POSITION);
        
        // Ensure repay amount is positive
        assert!(repay_amount > 0, ERR_ZERO_VALUE);
        
        // Get user's borrow position
        let position = table::borrow_mut(&mut global.lending_pool.borrowers, sender);
        
        // Calculate total debt (borrowed amount + accrued interest)
        let total_debt = position.borrowed_amount + position.accrued_interest;
        
        // Cap repayment to the total debt
        let actual_repay_amount = if (repay_amount > total_debt) {
            total_debt
        } else {
            repay_amount
        };
        
        // Get data for event
        let repay_amount_copy = actual_repay_amount;
        let accrued_interest_copy = position.accrued_interest;
        
        // Calculate interest payment
        let interest_paid = if (position.accrued_interest > 0) {
            if (actual_repay_amount > position.accrued_interest) {
                position.accrued_interest
            } else {
                actual_repay_amount
            }
        } else {
            0
        };
        
        // Apply repayment (first to interest, then principal)
        if (position.accrued_interest > 0) {
            let interest_payment = if (actual_repay_amount > position.accrued_interest) {
                position.accrued_interest
            } else {
                actual_repay_amount
            };
            
            position.accrued_interest = position.accrued_interest - interest_payment;
            let principal_payment = actual_repay_amount - interest_payment;
            
            // Apply any remaining amount to principal
            position.borrowed_amount = position.borrowed_amount - principal_payment;
        } else {
            // No accrued interest, apply entire payment to principal
            position.borrowed_amount = position.borrowed_amount - actual_repay_amount;
        };
        
        // Calculate remaining debt
        let remaining_debt = position.borrowed_amount + position.accrued_interest;
        
        // Update last update time
        position.last_update_time = tx_context::epoch(ctx);
        
        // If debt is fully repaid, adjust leverage to 1x
        if (position.borrowed_amount == 0 && position.accrued_interest == 0) {
            position.leverage = 10000; // 1x leverage when no debt
        };

        // Update global borrowed amount
        global.lending_pool.total_borrowed = global.lending_pool.total_borrowed - actual_repay_amount;
        
        // Update interest rates based on new utilization
        update_interest_rates(global);

        let total_supplied = balance::value(&global.lending_pool.total_suibtc);

        // Calculate utilization rate for the event
        let utilization_rate = if (total_supplied == 0) {
            0
        } else {
            ((global.lending_pool.total_borrowed as u128) * 10000) / (total_supplied as u128)
        };

        // Emit repay loan event
        event::emit(RepayLoanEvent {
            sender,
            repay_amount: repay_amount_copy,
            remaining_debt,
            accrued_interest: accrued_interest_copy,
            interest_paid,
            utilization_rate: utilization_rate as u64
        });
    }

    // Cash out gains from a leveraged position
    // Calculates profits/losses based on current market prices
    // Transfers the net result to the user while maintaining the core position
    public entry fun cash_out_position<X>(
        global: &mut SuiBTCGlobal, 
        percentage: u64, // How much of the position to cash out (10000 = 100%)
        ctx: &mut TxContext
    ) {
        // Check that protocol is not paused
        assert!(!global.has_paused, ERR_PAUSED);
        
        // First, accrue interest to update all positions
        accrue_interest(global, ctx);
        
        // Get the sender address
        let sender = tx_context::sender(ctx);
        
        // Ensure user has a borrow position
        assert!(table::contains(&global.lending_pool.borrowers, sender), ERR_NO_ACTIVE_POSITION);
        
        // Ensure percentage is valid (0-100%)
        assert!(percentage > 0 && percentage <= 10000, ERR_INVALID_PERCENTAGE);
        
        // Get collateral type
        let type_name = get<X>();

        let btc_price_oracle = global.btc_price_oracle;
        let total_suibtc = balance::value(&global.lending_pool.total_suibtc);
        let total_borrowed = global.lending_pool.total_borrowed;

        // We need to access the collateral pool for price information
        assert!(bag::contains(&global.collateral_pools, type_name), ERR_POOL_NOT_REGISTER);
        let pool = bag::borrow<TypeName, CollateralPool<X>>(&global.collateral_pools, type_name);
        let pool_price_oracle = pool.price_oracle;

        // Get user's borrow position
        let position = table::borrow_mut(&mut global.lending_pool.borrowers, sender);
        
        // Check if user has this collateral type
        assert!(table::contains(&position.collateral, type_name), ERR_INVALID_COLLATERAL_TYPE);
         
        let entry_btc_price = position.entry_btc_price;
        let entry_collateral_price = position.entry_collateral_price;
        
        // Get user's collateral amount of this type
        let collateral_amount = *table::borrow(&position.collateral, type_name);

        // Initial position size in BTC
        let borrowed_btc = position.borrowed_amount;
        let collateral_in_usd = ((collateral_amount as u128) * (entry_collateral_price as u128)) / 10000;
        let collateral_in_btc = (collateral_in_usd * 10000) / (entry_btc_price as u128);
        let total_initial_btc_exposure = collateral_in_btc + (borrowed_btc as u128);

        // Value of that BTC exposure at entry
        let initial_position_value = (total_initial_btc_exposure * (entry_btc_price as u128)) / 10000;

        // Current value of the same BTC exposure
        let current_position_value = (total_initial_btc_exposure * (btc_price_oracle as u128)) / 10000;

        // Determine if there's a profit
        assert!(current_position_value > initial_position_value, ERR_NO_PROFIT); // No profit to cash out

        // Calculate profit in USD
        let profit_value = current_position_value - initial_position_value;

        // Apply percentage to determine cash out amount
        let cash_out_value = (profit_value * (percentage as u128)) / 10000;

        // Convert to suiBTC amount
        let cash_out_amount = (cash_out_value * 10000) / (btc_price_oracle as u128);
 
        assert!((cash_out_amount as u64) > 0, ERR_ZERO_VALUE);

        // Ensure there's enough liquidity in the pool
        let available_liquidity = total_suibtc - total_borrowed;
        assert!((cash_out_amount as u64) <= available_liquidity, ERR_INSUFFICIENT_LIQUIDITY);

        // Calculate how much collateral to reduce (proportional to percentage)
        let collateral_to_reduce = (collateral_amount as u128) * (percentage as u128) / 10000;
        let collateral_to_reduce = (collateral_to_reduce as u64);

        // Update position's collateral amount
        let current_amount = table::borrow_mut(&mut position.collateral, type_name);
        *current_amount = *current_amount - collateral_to_reduce;
 
        // Remove collateral type entry if zero
        if (*current_amount == 0) {
            let _ = table::remove(&mut position.collateral, type_name);
        };

        // Calculate debt to reduce (proportional to percentage)
        let debt_amount = position.borrowed_amount + position.accrued_interest;
        let debt_to_reduce = (debt_amount as u128) * (percentage as u128) / 10000;
        let debt_to_reduce = (debt_to_reduce as u64);

        // Apply debt reduction (first to interest, then principal)
        if (position.accrued_interest > 0) {
            let interest_payment = if (debt_to_reduce > position.accrued_interest) {
                position.accrued_interest
            } else {
                debt_to_reduce
            };
            
            position.accrued_interest = position.accrued_interest - interest_payment;
            let principal_payment = debt_to_reduce - interest_payment;
            position.borrowed_amount = position.borrowed_amount - principal_payment;
        } else {
            // No accrued interest, apply entire payment to principal
            position.borrowed_amount = position.borrowed_amount - debt_to_reduce;
        };

        // If this was a full cash-out or the last collateral type, check if position should be removed
        if (percentage == 10000 || table::is_empty(&position.collateral)) {
            if (position.borrowed_amount == 0 && position.accrued_interest == 0) {
                // Remove position entirely
                let BorrowPosition { 
                    borrowed_amount: _, 
                    collateral, 
                    accrued_interest: _, 
                    leverage: _,
                    entry_btc_price: _,
                    entry_collateral_price: _,
                    last_update_time: _ 
                } = table::remove(&mut global.lending_pool.borrowers, sender);
                
                // Destroy empty collateral table
                table::destroy_empty(collateral);

                let (_, index) = vector::index_of(&global.lending_pool.borrower_list, &sender );
                vector::swap_remove( &mut global.lending_pool.borrower_list, index );
            } else {
                // Update timestamp
                position.last_update_time = tx_context::epoch(ctx);
            };
        } else {
            // Update timestamp
            position.last_update_time = tx_context::epoch(ctx);
        };
        // Get collateral to return to user
        let collateral_balance = bag::borrow_mut<TypeName, Balance<X>>(&mut global.lending_pool.collaterals, type_name);
        let removed_collateral = balance::split(collateral_balance, collateral_to_reduce);
        
        // Take profit from lending pool
        let profit_balance = balance::split(&mut global.lending_pool.total_suibtc, (cash_out_amount as u64));
        
        // Convert to coins and transfer to user
        let collateral_coin = coin::from_balance(removed_collateral, ctx);
        let profit_coin = coin::from_balance(profit_balance, ctx);
        
        transfer::public_transfer(collateral_coin, sender);
        transfer::public_transfer(profit_coin, sender);
         
        // Update global borrowed amount
        global.lending_pool.total_borrowed = global.lending_pool.total_borrowed - debt_to_reduce;
        
        // Collect data for the event
        let collateral_withdrawn = collateral_to_reduce;
        let profit_btc = (cash_out_amount as u64);
        let debt_reduced_copy = debt_to_reduce;
        
        // Update interest rates based on new utilization
        update_interest_rates(global);
        
        // Emit cash out position event
        event::emit(CashOutPositionEvent {
            sender,
            collateral_type: type_name,
            percentage,
            collateral_withdrawn,
            profit_btc,
            debt_reduced: debt_reduced_copy
        });
    }

    // Withdraw collateral after repaying loan
    // User can withdraw collateral once loan is repaid
    public entry fun withdraw_collateral<X>(
        global: &mut SuiBTCGlobal, 
        amount: u64,  // Amount of collateral to withdraw (0 for all available)
        ctx: &mut TxContext
    ) {
        // Check that protocol is not paused
        assert!(!global.has_paused, ERR_PAUSED);

        // First, accrue interest to update all positions
        accrue_interest(global, ctx);

        // Get the sender address
        let sender = tx_context::sender(ctx);
        
        // Ensure user has a borrow position
        assert!(table::contains(&global.lending_pool.borrowers, sender), ERR_NO_ACTIVE_POSITION);
        
        let btc_price_oracle = global.btc_price_oracle;

        // Get user's borrow position
        let position = table::borrow_mut(&mut global.lending_pool.borrowers, sender);
        
        // Get collateral type
        let type_name = get<X>();
        
        // Check if user has this collateral type
        assert!(table::contains(&position.collateral, type_name), ERR_INVALID_COLLATERAL_TYPE);
        
        // Get user's collateral amount of this type
        let collateral_amount = *table::borrow(&position.collateral, type_name);
        
        let mut input_amount = amount;

        // If position has any debt, ensure sufficient collateral remains
        if (position.borrowed_amount > 0 || position.accrued_interest > 0) {
            // We need to ensure the remaining collateral after withdrawal
            // still provides sufficient coverage for the remaining debt
            
            // If amount is 0, default to maximum safe withdrawal amount
            if (amount == 0) {
                // Access the collateral pool for price information
                assert!(bag::contains(&global.collateral_pools, type_name), ERR_INVALID_COLLATERAL_TYPE);
                let pool = bag::borrow<TypeName, CollateralPool<X>>(&global.collateral_pools, type_name);
                
                // Calculate collateral value in USD
                let collateral_value = ((collateral_amount as u128) * (pool.price_oracle as u128)) / 10000;
                
                // Calculate debt value in USD
                let debt_amount = position.borrowed_amount + position.accrued_interest;
                let debt_value = ((debt_amount as u128) * (btc_price_oracle as u128)) / 10000;
                
                // Calculate required collateral value (debt * leverage / 10000)
                let required_value = (debt_value * (position.leverage as u128)) / 10000;
                
                // Calculate excess collateral value
                if (collateral_value <= required_value) {
                    input_amount = 0; // No excess, can't withdraw
                } else {
                    let excess_value = collateral_value - required_value;
                    
                    // Convert excess value to collateral amount
                    input_amount = ((excess_value * 10000) / (pool.price_oracle as u128)) as u64;
                };
            } else {
                // User specified an amount, verify it's safe to withdraw
                assert!(amount <= collateral_amount, ERR_INSUFFICIENT_AMOUNT);
                
                // Calculate remaining collateral after withdrawal
                let remaining = collateral_amount - amount;
                
                if (remaining > 0) {
                    // Access the collateral pool for price information
                    assert!(bag::contains(&global.collateral_pools, type_name), ERR_INVALID_COLLATERAL_TYPE);
                    let pool = bag::borrow<TypeName, CollateralPool<X>>(&global.collateral_pools, type_name);
                    
                    // Calculate remaining collateral value in USD
                    let remaining_value = ((remaining as u128) * (pool.price_oracle as u128)) / 10000;
                    
                    // Calculate debt value in USD
                    let debt_amount = position.borrowed_amount + position.accrued_interest;
                    let debt_value = ((debt_amount as u128) * (global.btc_price_oracle as u128)) / 10000;
                    
                    // Ensure remaining collateral meets minimum requirements
                    // (remaining_value / debt_value) >= (leverage / 10000)
                    assert!(debt_value == 0 || (remaining_value * 10000) / debt_value >= (position.leverage as u128), ERR_BELOW_THRESHOLD);
                } else {
                    // Trying to withdraw all collateral, ensure no debt
                    assert!(position.borrowed_amount == 0 && position.accrued_interest == 0, ERR_STILL_DEBT);
                };
            };
        } else {
            // No debt, can withdraw up to all collateral
            if (amount == 0 || amount > collateral_amount) {
                input_amount = collateral_amount;
            };
        };
        
        // Ensure amount to withdraw is valid
        assert!(input_amount > 0 && input_amount <= collateral_amount, ERR_INVALID_VALUE);
        
        // Update position's collateral amount
        let current_amount = table::borrow_mut(&mut position.collateral, type_name);
        *current_amount = *current_amount - input_amount;
        
        // Remove collateral type entry if zero
        if (*current_amount == 0) {
            let _ = table::remove(&mut position.collateral, type_name);
            
            // If this was the last collateral type and no debt, remove the position
            if (table::is_empty(&position.collateral) && 
                position.borrowed_amount == 0 && 
                position.accrued_interest == 0) {
                let BorrowPosition { 
                    borrowed_amount: _, 
                    collateral, 
                    accrued_interest: _, 
                    leverage: _, 
                    last_update_time: _ ,
                    entry_btc_price: _,
                    entry_collateral_price: _
                } = table::remove(&mut global.lending_pool.borrowers, sender);
 
                // Destroy empty collateral table
                table::destroy_empty(collateral);

                let (_, index) = vector::index_of(&global.lending_pool.borrower_list, &sender );
                vector::swap_remove( &mut global.lending_pool.borrower_list, index );
            };
        };

        // Update last update time if position still exists
        if (table::contains(&global.lending_pool.borrowers, sender)) {
            let position = table::borrow_mut(&mut global.lending_pool.borrowers, sender);
            position.last_update_time = tx_context::epoch(ctx);
        };
        
        // Take collateral from the lending pool
        let collateral_balance = bag::borrow_mut<TypeName, Balance<X>>(&mut global.lending_pool.collaterals, type_name);
        let removed_collateral = balance::split(collateral_balance, input_amount);
        
        // Convert to Coin and transfer to user
        // Collect event data before transferring
        let amount_for_event = input_amount;
        
        // Calculate remaining collateral
        let mut remaining_collateral = 0;
        if (table::contains(&global.lending_pool.borrowers, sender)) {
            let borrower_position = table::borrow(&global.lending_pool.borrowers, sender);
            if (table::contains(&borrower_position.collateral, type_name)) {
                remaining_collateral = *table::borrow(&borrower_position.collateral, type_name);
            }
        };
        
        // Calculate remaining debt
        let mut remaining_debt = 0;
        if (table::contains(&global.lending_pool.borrowers, sender)) {
            let borrower_position = table::borrow(&global.lending_pool.borrowers, sender);
            remaining_debt = borrower_position.borrowed_amount + borrower_position.accrued_interest;
        };
        
        // Transfer collateral back to user
        let collateral_coin = coin::from_balance(removed_collateral, ctx);
        transfer::public_transfer(collateral_coin, sender);
         
        // Emit withdraw collateral event
        event::emit(WithdrawCollateralEvent {
            sender,
            collateral_type: type_name,
            amount: amount_for_event,
            remaining_collateral,
            remaining_debt
        });
     }

    // Liquidate an undercollateralized leveraged position
    // Called when borrower position health factor falls below threshold
    // Liquidator receives a discount on the collateral as incentive 
    public entry fun liquidate_leveraged_position<X>(
        global: &mut SuiBTCGlobal, 
        borrower: address, 
        sui_btc: Coin<SUI_BTC>,
        ctx: &mut TxContext
    ) {
        // Check that protocol is not paused
        assert!(!global.has_paused, ERR_PAUSED);
        
        // First, accrue interest to update all positions
        accrue_interest(global, ctx);
        
        // Get the liquidator address
        let liquidator = tx_context::sender(ctx);
        
        // Ensure borrower has a position
        assert!(table::contains(&global.lending_pool.borrowers, borrower), ERR_NO_ACTIVE_POSITION);
        
        // Get collateral type
        let type_name = get<X>();

        let btc_price_oracle = global.btc_price_oracle;
        
        // Get collateral pool for price info
        assert!(bag::contains(&global.collateral_pools, type_name), ERR_POOL_NOT_REGISTER);
        let pool = bag::borrow<TypeName, CollateralPool<X>>(&global.collateral_pools, type_name);
        let pool_price_oracle = pool.price_oracle;

        // Get borrower's position
        let position = table::borrow(&global.lending_pool.borrowers, borrower);
        
        // Ensure borrower has this collateral type
        assert!(table::contains(&position.collateral, type_name), ERR_INVALID_COLLATERAL_TYPE);
        
        // Get borrower's collateral amount of this type
        let collateral_amount = *table::borrow(&position.collateral, type_name);
        
        // Calculate collateral value in USD
        let collateral_value = ((collateral_amount as u128) * (pool.price_oracle as u128)) / 10000;
        
        // Calculate debt value in USD
        let debt_amount = position.borrowed_amount + position.accrued_interest;
        let debt_value = ((debt_amount as u128) * (btc_price_oracle as u128)) / 10000;
        
        // Calculate current health factor (collateral_value / debt_value * 10000)
        let health_factor = if (debt_value == 0) {
            18446744073709551615 // Maximum value if no debt
        } else {
            (collateral_value * 10000) / debt_value
        };
        
        // Determine liquidation threshold based on collateral pool
        // Leverage positions typically use a stricter threshold than the pool's regular liquidation threshold 
        let leverage_multiplier = (position.leverage as u128) / 10000;
        let base_threshold = (pool.liquidation_threshold as u128);
        let adjusted_threshold = base_threshold + ((leverage_multiplier - 1) * 500); // Add 500 basis points per leverage multiple

        // Ensure position is below liquidation threshold
        assert!(health_factor < (adjusted_threshold as u128), ERR_NOT_BELOW_THRESHOLD);
        
        // Get suiBTC amount provided for liquidation
        let liquidation_amount = coin::value(&sui_btc);
        assert!(liquidation_amount > 0, ERR_ZERO_VALUE);

        // Cap liquidation amount to the borrower's total debt 
        let max_liquidation = debt_amount;
        let actual_liquidation = if (liquidation_amount > max_liquidation) {
            max_liquidation
        } else {
            liquidation_amount
        };

        // Handle the case where liquidator provided more than needed
        if (liquidation_amount > actual_liquidation) {
            // Split the coin and return excess
            let mut liquidation_balance = coin::into_balance(sui_btc);
            let splitted_balance = balance::split(&mut liquidation_balance, actual_liquidation);
            transfer::public_transfer( coin::from_balance( liquidation_balance  , ctx) , liquidator);
            
            // Use the split coin for liquidation 
            balance::join(&mut global.lending_pool.total_suibtc, splitted_balance);
        } else {
            // Use the entire coin for liquidation
            let liquidation_balance = coin::into_balance(sui_btc);
            balance::join(&mut global.lending_pool.total_suibtc, liquidation_balance);
        };
        
        // Calculate collateral to seize based on the liquidation amount plus penalty
        let penalty_multiplier = 10000 + pool.liquidation_penalty;
        let collateral_to_seize = (((actual_liquidation as u128) * (btc_price_oracle as u128) * (penalty_multiplier as u128)) 
                                / (pool_price_oracle as u128) / 10000);
        
        // Cap collateral to seize to available collateral
        let collateral_to_seize = if (collateral_to_seize > (collateral_amount as u128)) {
            collateral_amount
        } else {
            (collateral_to_seize as u64)
        };
        
        // Update borrower's position
        let position = table::borrow_mut(&mut global.lending_pool.borrowers, borrower);
        
        // Update collateral
        let current_amount = table::borrow_mut(&mut position.collateral, type_name);
        *current_amount = *current_amount - collateral_to_seize;
        
        // Remove collateral type entry if zero
        if (*current_amount == 0) {
            let _ = table::remove(&mut position.collateral, type_name);
        };
        
        // Apply debt reduction (first to interest, then principal)
        if (position.accrued_interest > 0) {
            let interest_payment = if (actual_liquidation > position.accrued_interest) {
                position.accrued_interest
            } else {
                actual_liquidation
            };
            
            position.accrued_interest = position.accrued_interest - interest_payment;
            let principal_payment = actual_liquidation - interest_payment;
            position.borrowed_amount = position.borrowed_amount - principal_payment;
        } else {
            // No accrued interest, apply entire payment to principal
            position.borrowed_amount = position.borrowed_amount - actual_liquidation;
        };
        
        // Check if position is now empty
        if (table::is_empty(&position.collateral) && 
            position.borrowed_amount == 0 && 
            position.accrued_interest == 0) {
            // Remove position entirely
            let BorrowPosition { 
                borrowed_amount: _, 
                collateral, 
                accrued_interest: _, 
                leverage: _, 
                last_update_time: _ ,
                entry_btc_price: _,
                entry_collateral_price: _
            } = table::remove(&mut global.lending_pool.borrowers, borrower);
            
            // Destroy empty collateral table
            table::destroy_empty(collateral);

            let (_, index) = vector::index_of(&global.lending_pool.borrower_list, &borrower );
            vector::swap_remove( &mut global.lending_pool.borrower_list, index );

        } else {
            // Update last update time
            position.last_update_time = tx_context::epoch(ctx);
        };
        
        // Take collateral from the lending pool to give to liquidator
        let collateral_balance = bag::borrow_mut<TypeName, Balance<X>>(&mut global.lending_pool.collaterals, type_name);
        let removed_collateral = balance::split(collateral_balance, collateral_to_seize);

        // Convert to Coin and transfer to liquidator
        let collateral_coin = coin::from_balance(removed_collateral, ctx);
        transfer::public_transfer(collateral_coin, liquidator);
        
        // Update global borrowed amount
        global.lending_pool.total_borrowed = global.lending_pool.total_borrowed - actual_liquidation;

        // Store event data
        let collateral_seized = collateral_to_seize;
        let debt_repaid = actual_liquidation;
   
        // Update interest rates based on new utilization
        update_interest_rates(global);

        // Emit liquidate leveraged position event
        event::emit(LiquidateLeveragedPositionEvent {
            borrower,
            liquidator,
            collateral_type: type_name,
            collateral_seized,
            debt_repaid
        });
    }

    // ======== Public Functions =========

    // Returns the ratio of collateral value to debt value
    // Returns the collateral ratio multiplied by 10000 (e.g., 150% = 15000)
    // Returns max u64 value if debt is zero
    public fun get_collateral_ratio<X>(global: &SuiBTCGlobal, user: address): u64 { 
        // Get collateral type
        let type_name = get<X>();
    
        // Ensure collateral pool exists for this token type
        assert!(bag::contains(&global.collateral_pools, type_name), ERR_POOL_NOT_REGISTER);
    
        let btc_price_oracle = global.btc_price_oracle;

        // Get reference to the collateral pool
        let pool = bag::borrow<TypeName, CollateralPool<X>>(&global.collateral_pools, type_name);
    
        // Ensure user has a position
        assert!(table::contains(&pool.positions, user), ERR_NO_ACTIVE_POSITION);
        
        // Get user's position
        let position = table::borrow(&pool.positions, user);
        
        // If debt is zero, return maximum value
        if (position.debt_amount == 0) {
            return 18446744073709551615
        };
        
        // Calculate collateral value in USD
        let collateral_value = ((position.collateral_amount as u128) * (pool.price_oracle as u128)) / 10000;
        
        // Calculate debt value in USD
        let debt_value = ((position.debt_amount as u128) * (btc_price_oracle as u128)) / 10000;
        
        // Calculate and return collateral ratio (collateral_value / debt_value * 10000)
        ((collateral_value * 10000 / debt_value) as u64)
    }

    // Calculate the maximum suiBTC that can be minted with given collateral
    // Based on current oracle prices and minimum collateral ratio
    public fun get_max_mint_amount<X>(global: &SuiBTCGlobal, collateral_amount: u64): u64 { 
        // Get collateral type
        let type_name = get<X>();
    
        // Ensure collateral pool exists for this token type
        assert!(bag::contains(&global.collateral_pools, type_name), ERR_POOL_NOT_REGISTER);
    
        let btc_price_oracle = global.btc_price_oracle;

        // Get reference to the collateral pool
        let pool = bag::borrow<TypeName, CollateralPool<X>>(&global.collateral_pools, type_name);

        // Calculate collateral value in USD
        let collateral_value = ((collateral_amount as u128) * (pool.price_oracle as u128)) / 10000;
        
        // Calculate max debt value allowed by minimum collateral ratio
        // collateral_value / min_ratio * 10000
        let max_debt_value = (collateral_value * 10000) / (pool.min_collateral_ratio as u128);
        
        // Convert max debt value to suiBTC amount
        // max_debt_value / btc_price * 10000
        let max_sui_btc = (max_debt_value * 10000) / (btc_price_oracle as u128);
        
        // Convert to u64, with safety check to prevent overflow
        if (max_sui_btc > (18446744073709551615 as u128)) {
            18446744073709551615
        } else {
            (max_sui_btc as u64)
        }
    }

    // Check if a position is eligible for liquidation
    // Returns true if position is below liquidation threshold
    public fun is_liquidatable<X>(global: &SuiBTCGlobal, user: address): bool { 
        // Get collateral type
        let type_name = get<X>();
        
        // Ensure collateral pool exists for this token type
        if (!bag::contains(&global.collateral_pools, type_name)) {
            return false
        };

        let btc_price_oracle = global.btc_price_oracle;

        // Get reference to the collateral pool
        let pool = bag::borrow<TypeName, CollateralPool<X>>(&global.collateral_pools, type_name);
        
        // Check if user has a position
        if (!table::contains(&pool.positions, user)) {
            return false
        };
        
        // Get user's position
        let position = table::borrow(&pool.positions, user);
        
        // If debt is zero, position can't be liquidated
        if (position.debt_amount == 0) {
            return false
        };
        
        // Calculate collateral value in USD
        let collateral_value = ((position.collateral_amount as u128) * (pool.price_oracle as u128)) / 10000;
        
        // Calculate debt value in USD
        let debt_value = ((position.debt_amount as u128) * (btc_price_oracle as u128)) / 10000;
        
        // Calculate current collateral ratio
        let current_ratio = (collateral_value * 10000) / debt_value;
        
        // Return true if current ratio is below liquidation threshold
        current_ratio < (pool.liquidation_threshold as u128)
    }

    public fun get_mut_collateral_pool<X>(global: &mut SuiBTCGlobal): &mut CollateralPool<X> {
        let pool_name = get<X>();
        let has_registered = bag::contains_with_type<TypeName, CollateralPool<X>>(&global.collateral_pools, pool_name);
        assert!(has_registered, ERR_POOL_NOT_REGISTER);

        bag::borrow_mut<TypeName, CollateralPool<X>>(&mut global.collateral_pools, pool_name)
    }

    // ======== Only Governance =========

    // Create a collateral pool for a specific token type
    public entry fun create_collateral_pool<X>(global: &mut SuiBTCGlobal, _manager_cap: &mut ManagerCap, min_c_ratio: u64, liq_threshold: u64, liq_penalty: u64, mint_fee: u64, burn_fee: u64, price: u64, ctx: &mut TxContext) {
        // Check that protocol is not paused
        assert!(!global.has_paused, ERR_PAUSED);
        // Ensure minimum collateral ratio is greater than global minimum
        assert!(min_c_ratio >= global.global_min_c_ratio, ERR_TOO_LOW_VALUE);
        // Ensure liquidation threshold is less than minimum collateral ratio
        assert!(liq_threshold < min_c_ratio, ERR_INVALID_VALUE);
        // Ensure liquidation threshold is greater than or equal to global threshold
        assert!(liq_threshold >= global.global_liquidation_threshold, ERR_TOO_LOW_VALUE);

        // Create a new positions table
        let positions = table::new<address, Position>(ctx);

        // Create the CollateralPool with the provided parameters
        let collateral_pool = CollateralPool<X> {
            global: object::id(global),
            total_collateral: balance::zero<X>(),
            total_debt: 0,
            min_collateral_ratio: min_c_ratio,
            liquidation_threshold: liq_threshold,
            liquidation_penalty: liq_penalty,
            mint_fee: mint_fee,
            burn_fee: burn_fee,
            price_oracle: price,
            positions: positions
        };

        // Get type info for X to use as a key in the bag
        let type_name = get<X>();
        
        // Make sure this collateral type doesn't already exist
        assert!(!bag::contains(&global.collateral_pools, type_name), ERR_ALREADY_CREATED);
        
        // Add the new collateral pool to the global state
        bag::add(&mut global.collateral_pools, type_name, collateral_pool);

        // Emit collateral pool created event
        event::emit(CollateralPoolCreatedEvent {
            collateral_type: type_name,
            min_c_ratio,
            liq_threshold,
            liq_penalty,
            mint_fee,
            burn_fee,
            price
        }); 
    }

    // Update BTC price oracle manually
    public entry fun update_btc_price_manual(global: &mut SuiBTCGlobal, _manager_cap: &ManagerCap, new_price: u64) { 
        let old_price = global.btc_price_oracle;
        global.btc_price_oracle = new_price;

        // Emit update price event
        event::emit(UpdatePriceEvent {
            price_type: string::utf8(b"BTC"),
            asset_type: get<SUI_BTC>(),
            old_price,
            new_price
        });
    }
 
    // Update BTC price with Switchboard Oracle
    // BTC Price Feed ID : 0xc1c608737dae8be35fb00e32bab782a933bf3d8530f7ec2dfafe6ba630a1a349
    public entry fun update_btc_price(global: &mut SuiBTCGlobal, _manager_cap: &ManagerCap, aggregator: &Aggregator ) {
        // Get the latest update info for the feed
        let current_result = aggregator.current_result(); 
        let result_u128: u128 = current_result.result().value();               // Result as u128

        let old_price = global.btc_price_oracle;
        let new_price = ((result_u128 / 100000000000000) as u64);
        global.btc_price_oracle = new_price;

        // Emit update price event
        event::emit(UpdatePriceEvent {
            price_type: string::utf8(b"BTC"),
            asset_type: get<SUI_BTC>(),
            old_price,
            new_price
        });
    }

    // Update collateral asset price 
    public entry fun update_collateral_price_manual<X>(global: &mut SuiBTCGlobal, _manager_cap: &ManagerCap,  new_price: u64) {
        let pool = get_mut_collateral_pool<X>(global);
        let old_price = pool.price_oracle;
        pool.price_oracle = new_price;

        // Emit update price event
        event::emit(UpdatePriceEvent {
            price_type: string::utf8(b"Collateral"),
            asset_type: get<X>(),
            old_price,
            new_price
        });
    }

    // Update collateral asset price with Switchboard Oracle
    // SUI Price Feed ID : 0x905b96e0c9862ef47d6a30971ab895ffb80ed1b58a107c3433fa69be64d9ac5d
    public entry fun update_collateral_price<X>(global: &mut SuiBTCGlobal, _manager_cap: &ManagerCap, aggregator: &Aggregator) {
        let pool = get_mut_collateral_pool<X>(global);

        let current_result = aggregator.current_result();

        // Access various result properties 
        let result_u128: u128 = current_result.result().value();               // Result as u128

        let old_price = pool.price_oracle;
        let new_price = ((result_u128 / 100000000000000) as u64);
        pool.price_oracle = new_price;

        // Emit update price event
        event::emit(UpdatePriceEvent {
            price_type: string::utf8(b"Collateral"),
            asset_type: get<X>(),
            old_price,
            new_price
        });
    }

    // Update global protocol parameters
    public entry fun update_global_params(global: &mut SuiBTCGlobal, _manager_cap: &ManagerCap, min_c_ratio: u64, liq_threshold: u64, fee_to_stakers: u64, fee_to_treasury: u64) { 
        global.global_min_c_ratio = min_c_ratio;
        global.global_liquidation_threshold = liq_threshold;
        global.fee_to_stakers_percentage = fee_to_stakers;
        global.fee_to_treasury_percentage = fee_to_treasury;
    }

    // Update pool-specific parameters
    public entry fun update_pool_params<X>(global: &mut SuiBTCGlobal, _manager_cap: &ManagerCap, min_c_ratio: u64, liq_threshold: u64, liq_penalty: u64, mint_fee: u64, burn_fee: u64) { 
        let pool = get_mut_collateral_pool<X>(global);
        pool.min_collateral_ratio = min_c_ratio;
        pool.liquidation_threshold = liq_threshold;
        pool.liquidation_penalty = liq_penalty;
        pool.mint_fee = mint_fee;
        pool.burn_fee = burn_fee;
    }

    // Update lending pool parameters 
    public entry fun update_lending_pool_params(global: &mut SuiBTCGlobal, _manager_cap: &ManagerCap, borrow_rate: u64, supply_rate: u64, max_leverage: u64, base_rate: u64, multiplier_1: u64, multiplier_2: u64) { 
        global.lending_pool.borrow_rate = borrow_rate;
        global.lending_pool.supply_rate = supply_rate;
        global.lending_pool.max_leverage = max_leverage;
        global.lending_pool.base_rate = base_rate;
        global.lending_pool.multiplier_1 = multiplier_1;
        global.lending_pool.multiplier_2 = multiplier_2;
    }

    // Pause/unpause the protocol
    // Emergency function to freeze all operations
    public entry fun set_paused(global: &mut SuiBTCGlobal, _manager_cap: &ManagerCap, is_paused: bool) { 
        global.has_paused = is_paused;
    }

    // Distribute accumulated fees
    // Moves fees from fee_pool to designated recipients
    public fun distribute_fees(global: &mut SuiBTCGlobal, _manager_cap: &ManagerCap, staker_address: address, treasury_address: address, ctx: &mut TxContext) { 
        // Check that protocol is not paused
        assert!(!global.has_paused, ERR_PAUSED);
        
        // Ensure there are fees to distribute
        let total_fees = balance::value(&global.fee_pool);
        assert!(total_fees > 0, ERR_ZERO_VALUE);

        // Calculate amount to distribute to stakers
        let staker_amount = (total_fees as u128) * (global.fee_to_stakers_percentage as u128) / 10000;
        let staker_amount = (staker_amount as u64);
        
        // Calculate amount to distribute to treasury
        let treasury_amount = (total_fees as u128) * (global.fee_to_treasury_percentage as u128) / 10000;
        let treasury_amount = (treasury_amount as u64);
        
        // Handle any dust (remainder) due to rounding
        let total_distributed = staker_amount + treasury_amount;
        let remainder = total_fees - total_distributed;

        // If remainder exists, add it to treasury amount
        let treasury_amount = treasury_amount + remainder;

        // Split and distribute the fees
        if (staker_amount > 0) {
            let staker_fee = balance::split(&mut global.fee_pool, staker_amount);
            let staker_coin = coin::from_balance(staker_fee, ctx);
            transfer::public_transfer(staker_coin, staker_address);
        };
        
        if (treasury_amount > 0) {
            let treasury_fee = balance::split(&mut global.fee_pool, treasury_amount);
            let treasury_coin = coin::from_balance(treasury_fee, ctx);
            transfer::public_transfer(treasury_coin, treasury_address);
        };

        // Emit distribute fee event
        let staker_address_copy = staker_address;
        let treasury_address_copy = treasury_address;
        let staker_amount_copy = staker_amount;
        let treasury_amount_copy = treasury_amount;
        
        event::emit(DistributeFeeEvent {
            staker_address: staker_address_copy,
            treasury_address: treasury_address_copy,
            staker_amount: staker_amount_copy,
            treasury_amount: treasury_amount_copy,
            total_fees
        });
    }

    // To link with governance
    public entry fun set_governance(
        global: &mut SuiBTCGlobal, 
         _manager_cap: &ManagerCap,
        governance: &GovernanceGlobal,
        ctx: &mut TxContext
    ) {
        // Check that protocol is not paused
        assert!(!global.has_paused, ERR_PAUSED);
        
        // Only allow setting once
        assert!(option::is_none(&global.governance_id), ERR_ALREADY_CREATED);
        
        // Set the governance ID
        global.governance_id = option::some(object::id(governance));
    }

    // ======== Internal Functions =========

    // Accrue interest in the lending pool
    // Updates all positions based on time elapsed and current rates
    // Called before any lending pool operation
    fun accrue_interest(global: &mut SuiBTCGlobal, ctx: &TxContext) {
        // Calculate time elapsed since last accrual
        let current_time = tx_context::epoch_timestamp_ms(ctx);
        let time_elapsed = current_time - global.lending_pool.last_accrual_time;
        
        // If no time elapsed, no interest to accrue
        if (time_elapsed == 0) {
            return
        };
        
        // Update last accrual time
        global.lending_pool.last_accrual_time = current_time;
        
        // Calculate utilization rate (borrowed / supplied) * 10000
        // let utilization_rate = if (balance::value(&global.lending_pool.total_suibtc) == 0) {
        //     0
        // } else {
        //     ((global.lending_pool.total_borrowed as u128) * 10000) / 
        //     (balance::value(&global.lending_pool.total_suibtc) as u128)
        // };
        
        // Calculate interest for supply and borrow based on rates
        // Convert APR to per-millisecond rate
        // rate * time_elapsed / (365 * 24 * 60 * 60 * 1000)
        let seconds_per_year = 31536000000; // 365 * 24 * 60 * 60 * 1000
        
        // Calculate borrow interest (rate per year * time elapsed / seconds per year)
        let borrow_interest = ((global.lending_pool.borrow_rate as u128) * (time_elapsed as u128)) / 
                            (seconds_per_year as u128);
        
        // Calculate supply interest (rate per year * time elapsed / seconds per year)
        let supply_interest = ((global.lending_pool.supply_rate as u128) * (time_elapsed as u128)) / 
                            (seconds_per_year as u128);
        
        // If no borrows or no interest to accrue, we're done
        if (global.lending_pool.total_borrowed == 0 || (borrow_interest == 0 && supply_interest == 0)) {
            return
        };
        
        // Calculate total borrow interest amount
        let borrow_interest_amount = ((global.lending_pool.total_borrowed as u128) * borrow_interest) / 10000;
        
        // Increase total borrowed by the interest amount
        global.lending_pool.total_borrowed = global.lending_pool.total_borrowed + (borrow_interest_amount as u64);
        
        // Mint interest to the lending pool (this increases total_suibtc)
        let interest_to_mint = (borrow_interest_amount as u64);
        balance::join(
            &mut global.lending_pool.total_suibtc, 
            balance::increase_supply(&mut global.syth_supply, interest_to_mint)
        );
        
        // Calculate interest for each borrower and update their positions 
        let mut i = 0;
        let len = vector::length(&global.lending_pool.borrower_list);
        
        while (i < len) {
            let borrower = *vector::borrow(&global.lending_pool.borrower_list, i);
            if (table::contains(&global.lending_pool.borrowers, borrower)) {
                let position = table::borrow_mut(&mut global.lending_pool.borrowers, borrower);
                
                // Calculate interest for this borrower
                let interest = ((position.borrowed_amount as u128) * borrow_interest) / 10000;
                
                // Update position
                position.accrued_interest = position.accrued_interest + (interest as u64);
                position.last_update_time = current_time;
                i = i + 1;
            };
        };
    }
 
    // Update interest rates based on current utilization
    // Dynamically adjusts rates to maintain optimal pool utilization
    fun update_interest_rates(global: &mut SuiBTCGlobal) { 
        // Calculate current utilization rate (borrowed / supplied) * 10000
        let utilization_rate = if (balance::value(&global.lending_pool.total_suibtc) == 0) {
            0
        } else {
            ((global.lending_pool.total_borrowed as u128) * 10000) / 
            (balance::value(&global.lending_pool.total_suibtc) as u128)
        };
        let utilization_rate = (utilization_rate as u64);
        
        // Update borrow rate based on utilization
        // We use a simple model:
        // - Below optimal: borrow_rate = base_rate + utilization_rate * multiplier_1
        // - Above optimal: borrow_rate = base_rate + optimal_rate + (utilization_rate - optimal) * multiplier_2

        global.lending_pool.borrow_rate = if (utilization_rate <= global.lending_pool.optimal_utilization) {
            global.lending_pool.base_rate + ((utilization_rate * global.lending_pool.multiplier_1) / global.lending_pool.optimal_utilization)
        } else {
            global.lending_pool.base_rate + global.lending_pool.multiplier_1 + (((utilization_rate - global.lending_pool.optimal_utilization) * global.lending_pool.multiplier_2) / (10000 - global.lending_pool.optimal_utilization))
        };
        
        // Update supply rate based on borrow rate and utilization
        // supply_rate = borrow_rate * utilization_rate * (1 - reserve_factor) / 10000
        let reserve_factor = 1000; // 10% of interest goes to reserves
        
        global.lending_pool.supply_rate = (((global.lending_pool.borrow_rate) * utilization_rate * (10000 - reserve_factor)) / (10000 * 10000));
    }

    // Helper function to add collateral to position without borrowing
    // Used when leverage is exactly 1x
    fun add_collateral_to_position<X>(
        global: &mut SuiBTCGlobal,
        collateral: Coin<X>,
        sender: address,
        ctx: &mut TxContext
    ) {
        // Get collateral type
        let type_name = get<X>();
        
        let btc_price_oracle = global.btc_price_oracle;
        // Get collateral pool for price info
        assert!(bag::contains(&global.collateral_pools, type_name), ERR_POOL_NOT_REGISTER);
        let pool = bag::borrow<TypeName, CollateralPool<X>>(&global.collateral_pools, type_name);
        let pool_price_oracle = pool.price_oracle;

        // Get collateral amount
        let collateral_amount = coin::value(&collateral);
        
        // Add collateral to the lending pool
        let collateral_balance = coin::into_balance(collateral);
        
        // Store collateral in the lending pool's collaterals bag
        if (bag::contains(&global.lending_pool.collaterals, type_name)) {
            let existing_balance = bag::borrow_mut<TypeName, Balance<X>>(&mut global.lending_pool.collaterals, type_name);
            balance::join(existing_balance, collateral_balance);
        } else {
            bag::add(&mut global.lending_pool.collaterals, type_name, collateral_balance);
        };
        
        // Create or update borrow position (even with no borrowing, we track the collateral)
        if (table::contains(&global.lending_pool.borrowers, sender)) {
            // Update existing position
            let position = table::borrow_mut(&mut global.lending_pool.borrowers, sender);
            
            // Add to collateral (create entry for this type if it doesn't exist)
            if (table::contains(&position.collateral, type_name)) {
                let existing_amount = table::borrow_mut(&mut position.collateral, type_name);
                *existing_amount = *existing_amount + collateral_amount;
            } else {
                table::add(&mut position.collateral, type_name, collateral_amount);
            };
            
            // Update timestamp (leverage remains unchanged)
            position.last_update_time = tx_context::epoch(ctx);
        } else {
            // Create new position with collateral table but zero borrowed amount
            let mut collateral_table = table::new<TypeName, u64>(ctx);
            table::add(&mut collateral_table, type_name, collateral_amount);
            
            let new_position = BorrowPosition {
                borrowed_amount: 0,
                collateral: collateral_table,
                accrued_interest: 0,
                leverage: 10000, // 1x leverage
                last_update_time: tx_context::epoch(ctx),
                entry_btc_price: btc_price_oracle,  // Store current BTC price
                entry_collateral_price: pool_price_oracle, // Store current collateral price
            };
            table::add(&mut global.lending_pool.borrowers, sender, new_position);
        };
    }

    // ======== Test-related Functions =========

    #[test_only]
    // Wrapper of module initializer for testing
    public fun test_init(ctx: &mut TxContext) {
        init(SUI_BTC {}, ctx)
    }

}
