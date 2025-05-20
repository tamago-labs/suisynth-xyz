
#[test_only]
module suisynth::governance_tests {
    use sui::test_scenario::{Self, Scenario, next_tx, later_epoch, ctx};
    use sui::coin::{Self, Coin};
    use sui::clock::{Self, Clock};

    use suisynth::governance::{Self, GovernanceGlobal, GovernanceCap, GOVERNANCE};

    // Test accounts
    const ADMIN: address = @0x1234;
    const SUPPLIER1: address = @0x5678;
    const SUPPLIER2: address = @0x9abc;

    // Setup function to initialize the governance
    fun setup_test(): Scenario {
        let mut scenario = test_scenario::begin(ADMIN);
        {
            governance::test_init(ctx(&mut scenario));
        };
        scenario
    }

    #[test]
    fun test_register_supplier() {
        let mut scenario = setup_test();

        // Admin registers a supplier
        next_tx(&mut scenario, ADMIN);
        {
            let mut global = test_scenario::take_shared<GovernanceGlobal>(&scenario);
            
            governance::register_supplier(
                &mut global,
                1000_000000000, // 1000 tokens supplied
                ctx(&mut scenario)
            );
            
            test_scenario::return_shared(global);
        };

        // Another supplier registers
        next_tx(&mut scenario, SUPPLIER1);
        {
            let mut global = test_scenario::take_shared<GovernanceGlobal>(&scenario);
            
            governance::register_supplier(
                &mut global,
                500_000000000, // 500 tokens supplied
                ctx(&mut scenario)
            );
            
            test_scenario::return_shared(global);
        };

        test_scenario::end(scenario);
    }


    #[test]
    fun test_claim_rewards() {
        let mut scenario = setup_test();

        // Register a supplier
        next_tx(&mut scenario, SUPPLIER1);
        {
            let mut global = test_scenario::take_shared<GovernanceGlobal>(&scenario);
            
            governance::register_supplier(
                &mut global,
                1000000, // 0.001 tokens supplied
                ctx(&mut scenario)
            );
            
            test_scenario::return_shared(global);
        };

        // Fast forward time (simulate 10 day passing)
        later_epoch( &mut scenario, 864000000 , SUPPLIER1);

        // Supplier claims rewards
        next_tx(&mut scenario, SUPPLIER1);
        {
            let mut global = test_scenario::take_shared<GovernanceGlobal>(&scenario);
            
            // Check pending rewards before claiming
            let current_time = test_scenario::ctx(&mut scenario).epoch_timestamp_ms();
            let pending = governance::get_pending_rewards(&global, SUPPLIER1, current_time);
        
            // Only claim if there are pending rewards
            if (pending > 0) {
                governance::claim_governance_rewards(&mut global, ctx(&mut scenario));
            };
            
            test_scenario::return_shared(global);
        };
 
        // Verify supplier received rewards
        next_tx(&mut scenario, SUPPLIER1);
        {  
            let governance_token = test_scenario::take_from_sender<Coin<GOVERNANCE>>(&scenario); 

            // 8.64 GOVEVERNANCE
            assert!(coin::value(&(governance_token)) == 8_640000000, 0); 
             
            test_scenario::return_to_sender( &scenario, governance_token ); 
        };

        test_scenario::end(scenario);
    }

    #[test]
    fun test_change_allocation() {
        let mut scenario = setup_test();

        // Admin changes allocation
        next_tx(&mut scenario, ADMIN);
        {
            let mut global = test_scenario::take_shared<GovernanceGlobal>(&scenario);
            let cap = test_scenario::take_from_address<GovernanceCap>(&scenario, ADMIN);
            
            // New allocation: 40% treasury, 40% rewards, 20% staking
            governance::change_allocation(
                &mut global, 
                &cap, 
                4000, // 40% treasury
                4000, // 40% rewards
                2000, // 20% staking
                ctx(&mut scenario)
            );
            
            test_scenario::return_shared(global);
            test_scenario::return_to_address(ADMIN, cap);
        };

        test_scenario::end(scenario);
    }


    #[test]
    fun test_multiple_suppliers_rewards() {
        let mut scenario = setup_test();

        // Register first supplier
        next_tx(&mut scenario, SUPPLIER1);
        {
            let mut global = test_scenario::take_shared<GovernanceGlobal>(&scenario);
            
            governance::register_supplier(
                &mut global,
                1000000, // 0.001 tokens supplied
                ctx(&mut scenario)
            );
            
            test_scenario::return_shared(global);
        };

        // Register second supplier
        next_tx(&mut scenario, SUPPLIER2);
        {
            let mut global = test_scenario::take_shared<GovernanceGlobal>(&scenario);
            
            governance::register_supplier(
                &mut global,
                2000000, // 0.002 tokens supplied
                ctx(&mut scenario)
            );
            
            test_scenario::return_shared(global);
        };

        // Update supplier1's amount
        next_tx(&mut scenario, ADMIN);
        {
            let mut global = test_scenario::take_shared<GovernanceGlobal>(&scenario);
            
            governance::update_supplier_amount(
                &mut global,
                SUPPLIER1,
                1500000, // Increase to 0.0015 tokens
                ctx(&mut scenario)
            );
            
            test_scenario::return_shared(global);
        };

        // Fast forward time (simulate 10 days passing)
        later_epoch( &mut scenario, 864000000 , SUPPLIER1);

        // Both suppliers claim rewards
        next_tx(&mut scenario, SUPPLIER1);
        {
            let mut global = test_scenario::take_shared<GovernanceGlobal>(&scenario);
            
            governance::claim_governance_rewards(&mut global, ctx(&mut scenario));
            
            test_scenario::return_shared(global);
        };

        next_tx(&mut scenario, SUPPLIER2);
        {
            let mut global = test_scenario::take_shared<GovernanceGlobal>(&scenario);
            
            governance::claim_governance_rewards(&mut global, ctx(&mut scenario));
            
            test_scenario::return_shared(global);
        };

        test_scenario::end(scenario);
    }

     


}