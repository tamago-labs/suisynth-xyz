 
#[test_only]
module suisynth::sui_btc_tests;

use sui::test_scenario::{Self, Scenario, next_tx, ctx};
use sui::coin::{Self, Coin, mint_for_testing};
use sui::sui::SUI;
use sui::transfer;
use sui::test_utils::assert_eq;

use suisynth::sui_btc::{Self, SuiBTCGlobal, ManagerCap, SUI_BTC};

// Test accounts
const ADMIN: address = @0x1234;
const USER: address = @0x4567;
const LIQUIDATOR: address = @0x9999;

// Test parameters
const PRICE_BTC: u64 = 60000_0000; // $60,000
const PRICE_SUI: u64 = 2_0000;     // $2
const PRICE_USDC: u64 = 1_0000;     // $1
const MIN_C_RATIO: u64 = 15000;    // 150%
const LIQ_THRESHOLD: u64 = 12000;  // 120%
const LIQ_PENALTY: u64 = 1000;     // 10%
const MINT_FEE: u64 = 25;          // 0.25%
const BURN_FEE: u64 = 25;          // 0.25%

// test coins

public struct USDC {}

// Setup function to initialize the protocol
fun setup_test(): Scenario {
    let mut scenario = test_scenario::begin(ADMIN);
    {
        sui_btc::test_init(ctx(&mut scenario));
    };
    scenario
}

#[test]
fun test_pool_creation() {
    let mut scenario = setup_test();
    
    // Admin creates a collateral pool for SUI
    next_tx(&mut scenario, ADMIN);
    {
        let mut global = test_scenario::take_shared<SuiBTCGlobal>(&scenario);
        let mut cap = test_scenario::take_from_address<ManagerCap>(&scenario, ADMIN);
        
        sui_btc::create_collateral_pool<SUI>(
            &mut global,
            &mut cap, 
            MIN_C_RATIO,
            LIQ_THRESHOLD,
            LIQ_PENALTY,
            MINT_FEE,
            BURN_FEE,
            PRICE_SUI,
            ctx(&mut scenario)
        );
        
        // Verify pool creation by checking if we can mint
        assert!(sui_btc::get_max_mint_amount<SUI>(&global, 1_000000000) > 0, 1);
        
        test_scenario::return_shared(global);
        test_scenario::return_to_address(ADMIN, cap);
    };
    
    test_scenario::end(scenario);
}

#[test]
fun test_mint_suibtc() {
    let mut scenario = setup_test();
    
    // Create collateral pool
    next_tx(&mut scenario, ADMIN);
    {
        let mut global = test_scenario::take_shared<SuiBTCGlobal>(&scenario);
        let mut cap = test_scenario::take_from_address<ManagerCap>(&scenario, ADMIN);
        
        sui_btc::create_collateral_pool<SUI>(
            &mut global,
            &mut cap, 
            MIN_C_RATIO,
            LIQ_THRESHOLD,
            LIQ_PENALTY,
            MINT_FEE,
            BURN_FEE,
            PRICE_SUI,
            ctx(&mut scenario)
        );
        
        test_scenario::return_shared(global);
        test_scenario::return_to_address(ADMIN, cap);
    };
    
    // User mints suiBTC
    next_tx(&mut scenario, USER);
    {
        let mut global = test_scenario::take_shared<SuiBTCGlobal>(&scenario);
        
        // Create 10 SUI test coins for collateral
        let collateral = mint_for_testing<SUI>(10_000_000_000, ctx(&mut scenario));
        
        // Calculate how much suiBTC we can mint with this collateral
        let max_mint = sui_btc::get_max_mint_amount<SUI>(&global, 10_000_000_000);
        
        // Mint half of the maximum amount
        let mint_amount = max_mint / 2;
        sui_btc::mint<SUI>(&mut global, collateral, mint_amount, ctx(&mut scenario));
         
        // Check user's position
        assert!(sui_btc::get_collateral_ratio<SUI>(&global, USER) > MIN_C_RATIO, 2);
        
        test_scenario::return_shared(global);
    };

    // Verify user now has suiBTC
    next_tx(&mut scenario, USER);
    {
        let sui_btc_coin = test_scenario::take_from_address<Coin<SUI_BTC>>(&scenario, USER);
        // 0.000111111 BTC 
        assert!( coin::value(&sui_btc_coin) == 111111, 3 );
    
        test_scenario::return_to_address(USER, sui_btc_coin);
    };
    
    test_scenario::end(scenario);
}

#[test]
fun test_burn_suibtc() {
    let mut scenario = setup_test();
    
    // Create collateral pool
    next_tx(&mut scenario, ADMIN);
    {
        let mut global = test_scenario::take_shared<SuiBTCGlobal>(&scenario);
        let mut cap = test_scenario::take_from_address<ManagerCap>(&scenario, ADMIN);
        
        sui_btc::create_collateral_pool<SUI>(
            &mut global,
            &mut cap, 
            MIN_C_RATIO,
            LIQ_THRESHOLD,
            LIQ_PENALTY,
            MINT_FEE,
            BURN_FEE,
            PRICE_SUI,
            ctx(&mut scenario)
        );
        
        test_scenario::return_shared(global);
        test_scenario::return_to_address(ADMIN, cap);
    };
    
    // User mints suiBTC
    let mint_amount = 100000; // 0.0001 suiBTC

    next_tx(&mut scenario, USER);
    {
        let mut global = test_scenario::take_shared<SuiBTCGlobal>(&scenario);
        
        // Create SUI test coins for collateral
        let collateral = mint_for_testing<SUI>(10_000000000, ctx(&mut scenario));
        
        sui_btc::mint<SUI>(&mut global, collateral, mint_amount, ctx(&mut scenario));
        
        test_scenario::return_shared(global);
    };
    
    // User burns half of the suiBTC
    next_tx(&mut scenario, USER);
    {
        let mut global = test_scenario::take_shared<SuiBTCGlobal>(&scenario);
        let mut sui_btc_coin = test_scenario::take_from_address<Coin<SUI_BTC>>(&scenario, USER);
        
        // Get initial collateral amount
        let initial_collateral = sui_btc::get_collateral_ratio<SUI>(&global, USER);
        
         // Get total coin value
        let total_value = coin::value(&sui_btc_coin);
        
        // Split the coin in half
        let half_coin = coin::split(&mut sui_btc_coin, total_value / 2, ctx(&mut scenario));

        // Burn half of minted suiBTC and withdraw proportional collateral
        sui_btc::burn<SUI>(&mut global, half_coin, 50000, ctx(&mut scenario));
         
        // Verify position still exists with appropriate ratio
        assert!(sui_btc::get_collateral_ratio<SUI>(&global, USER) >= initial_collateral, 2);
        
        test_scenario::return_shared(global);
        test_scenario::return_to_address(USER, sui_btc_coin);
    };

    // Check user received SUI back
    next_tx(&mut scenario, USER);
    {
        let sui_coin = test_scenario::take_from_address<Coin<SUI>>(&scenario, USER);
        // 0.000050000 BTC 
        assert!( coin::value(&sui_coin) == 50000, 3 );  
        test_scenario::return_to_address(USER, sui_coin);
    };
    
    test_scenario::end(scenario);
}

#[test]
fun test_leverage_position_and_cash_out_profits() {
    let mut scenario = setup_test();
    
    // Create collateral pool and lending pool
    next_tx(&mut scenario, ADMIN);
    {
        let mut global = test_scenario::take_shared<SuiBTCGlobal>(&scenario);
        let mut cap = test_scenario::take_from_address<ManagerCap>(&scenario, ADMIN);
        
        sui_btc::create_collateral_pool<SUI>(
            &mut global,
            &mut cap, 
            MIN_C_RATIO,
            LIQ_THRESHOLD,
            LIQ_PENALTY,
            MINT_FEE,
            BURN_FEE,
            PRICE_SUI,
            ctx(&mut scenario)
        );

        sui_btc::create_collateral_pool<USDC>(
            &mut global,
            &mut cap, 
            MIN_C_RATIO,
            LIQ_THRESHOLD,
            LIQ_PENALTY,
            MINT_FEE,
            BURN_FEE,
            PRICE_USDC,
            ctx(&mut scenario)
        );
        
        // Add some suiBTC to the lending pool
        let seed_coin = mint_for_testing<SUI_BTC>(1_000000000, ctx(&mut scenario));
        sui_btc::supply_suibtc(
            &mut global,
            seed_coin,
            ctx(&mut scenario)
        );

        test_scenario::return_shared(global);
        test_scenario::return_to_address(ADMIN, cap);
    };
    
    // User creates a 3x leveraged position
    next_tx(&mut scenario, USER);
    {
        let mut global = test_scenario::take_shared<SuiBTCGlobal>(&scenario);
        
        // Create USDC test coins for collateral
        let collateral = mint_for_testing<USDC>(10_000_000_000, ctx(&mut scenario));
        
        sui_btc::borrow_with_leverage<USDC>(&mut global, collateral, 30000, ctx(&mut scenario));
        
        test_scenario::return_shared(global);
    };

    // Price of BTC increases (simulate profit)
    next_tx(&mut scenario, ADMIN);
    {
        let mut global = test_scenario::take_shared<SuiBTCGlobal>(&scenario);
        let mut cap = test_scenario::take_from_address<ManagerCap>(&scenario, ADMIN);
        
        // Update BTC price (20% increase)
        sui_btc::update_btc_price_manual(&mut global, &mut cap, 72000_0000);
        
        test_scenario::return_shared(global);
        test_scenario::return_to_address(ADMIN, cap);
    };

    // User cashes out 50% of the position
    next_tx(&mut scenario, USER);
    {
        let mut global = test_scenario::take_shared<SuiBTCGlobal>(&scenario); 
        sui_btc::cash_out_position<USDC>(&mut global, 5000, ctx(&mut scenario)); 
        test_scenario::return_shared(global);
    };

    // Verify user received both collateral and profit
    next_tx(&mut scenario, USER);
    {
        let collateral_coin = test_scenario::take_from_address<Coin<USDC>>(&scenario, USER);
        let profit_coin = test_scenario::take_from_address<Coin<SUI_BTC>>(&scenario, USER);
        // 5 USDC
        assert!( coin::value(&collateral_coin) == 5000000000, 1 );  
        // 0.000041666 BTC 
        assert!( coin::value(&profit_coin) == 41666, 2);
        test_scenario::return_to_address(USER, collateral_coin);
        test_scenario::return_to_address(USER, profit_coin);
    };
    
    test_scenario::end(scenario);
}

#[test]
fun test_repay_loan() {
    let mut scenario = setup_test();
    
    // Create collateral pool and lending pool
    next_tx(&mut scenario, ADMIN);
    {
        let mut global = test_scenario::take_shared<SuiBTCGlobal>(&scenario);
        let mut cap = test_scenario::take_from_address<ManagerCap>(&scenario, ADMIN);
        
        sui_btc::create_collateral_pool<SUI>(
            &mut global,
            &mut cap, 
            MIN_C_RATIO,
            LIQ_THRESHOLD,
            LIQ_PENALTY,
            MINT_FEE,
            BURN_FEE,
            PRICE_SUI,
            ctx(&mut scenario)
        );

        sui_btc::create_collateral_pool<USDC>(
            &mut global,
            &mut cap, 
            MIN_C_RATIO,
            LIQ_THRESHOLD,
            LIQ_PENALTY,
            MINT_FEE,
            BURN_FEE,
            PRICE_USDC,
            ctx(&mut scenario)
        );
        
        // Add some suiBTC to the lending pool
        let seed_coin = mint_for_testing<SUI_BTC>(100_000_000_000, ctx(&mut scenario));
        sui_btc::supply_suibtc(
            &mut global,
            seed_coin,
            ctx(&mut scenario)
        );
        
        test_scenario::return_shared(global);
        test_scenario::return_to_address(ADMIN, cap);
    };
    
    // User creates a 2x leveraged position
    next_tx(&mut scenario, USER);
    {
        let mut global = test_scenario::take_shared<SuiBTCGlobal>(&scenario);
        
        // Create SUI test coins for collateral
        let collateral = mint_for_testing<USDC>(10_000000000, ctx(&mut scenario)); 
        sui_btc::borrow_with_leverage<USDC>(&mut global, collateral, 20000, ctx(&mut scenario));
        
        test_scenario::return_shared(global);
    };
    
    // User repays half of the loan
    next_tx(&mut scenario, USER);
    {
        let mut global = test_scenario::take_shared<SuiBTCGlobal>(&scenario);
        
        // Get debt amount and repay half
        let borrowed_amount = 5_000_000_000; // Half of expected borrowed amount
        sui_btc::repay_loan(&mut global, borrowed_amount, ctx(&mut scenario));
        
        test_scenario::return_shared(global);
    };
    
    test_scenario::end(scenario);
}

#[test]
fun test_liquidation() {
    let mut scenario = setup_test();
    
    // Create collateral pool and lending pool
    next_tx(&mut scenario, ADMIN);
    {
        let mut global = test_scenario::take_shared<SuiBTCGlobal>(&scenario);
        let mut cap = test_scenario::take_from_address<ManagerCap>(&scenario, ADMIN);
        
        sui_btc::create_collateral_pool<SUI>(
            &mut global,
            &mut cap, 
            MIN_C_RATIO,
            LIQ_THRESHOLD,
            LIQ_PENALTY,
            MINT_FEE,
            BURN_FEE,
            PRICE_SUI,
            ctx(&mut scenario)
        );
        
        // Add some suiBTC to the lending pool
        let seed_coin = mint_for_testing<SUI_BTC>(100_000_000_000, ctx(&mut scenario));
         sui_btc::supply_suibtc(
            &mut global,
            seed_coin,
            ctx(&mut scenario)
        );
        
        
        test_scenario::return_shared(global);
        test_scenario::return_to_address(ADMIN, cap);
    };
    
    // User creates a highly leveraged position
    next_tx(&mut scenario, USER);
    {
        let mut global = test_scenario::take_shared<SuiBTCGlobal>(&scenario);
        
        // Create SUI test coins for collateral
        let collateral = mint_for_testing<SUI>(10_000_000_000, ctx(&mut scenario));
        
        sui_btc::borrow_with_leverage<SUI>(&mut global, collateral, 40000, ctx(&mut scenario));
        
        test_scenario::return_shared(global);
    };
    
    // Price of SUI drops, making position liquidatable
    next_tx(&mut scenario, ADMIN);
    {
        let mut global = test_scenario::take_shared<SuiBTCGlobal>(&scenario);
        let mut cap = test_scenario::take_from_address<ManagerCap>(&scenario, ADMIN);
        
        // Update SUI price (50% drop)
        sui_btc::update_collateral_price_manual<SUI>( &mut global, &mut cap, 1_0000);
        
        test_scenario::return_shared(global);
        test_scenario::return_to_address(ADMIN, cap);
    };
    
    // Liquidator liquidates the position
    next_tx(&mut scenario, LIQUIDATOR);
    {
        let mut global = test_scenario::take_shared<SuiBTCGlobal>(&scenario);
        
        // Create suiBTC for liquidation
        let liquidation_coin = mint_for_testing<SUI_BTC>(10_000_000_000, ctx(&mut scenario));
        
        sui_btc::liquidate_leveraged_position<SUI>(&mut global, USER, liquidation_coin, ctx(&mut scenario));
        
        test_scenario::return_shared(global);
    };

    // Verify liquidator received collateral
    next_tx(&mut scenario, LIQUIDATOR);
    {
        let collateral_coin = test_scenario::take_from_address<Coin<SUI>>(&scenario, LIQUIDATOR); 
        // 10 SUI
        assert!( coin::value(&collateral_coin) == 10_000000000, 1 );   
        test_scenario::return_to_address(LIQUIDATOR, collateral_coin); 
    };
    
    test_scenario::end(scenario);
}