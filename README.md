# SuiSynth.XYZ

**SuiSynth** is a decentralized synthetic asset protocol on **Sui**, offering up to 4x leverage with AI-optimized risk management. Users can borrow with leverage to gain amplified exposure to real-world assets without the recurring funding rates typical of perpetual exchanges. Real-time price feeds are secured by **Switchboard Oracle**. SYNTH governance tokens are distributed through a fair-launch model to suppliers who mint synthetic assets and supply to the lending pool.

- [YouTube Demo](https://youtu.be/EDbn6wOPbE8) 
- [Dapps](https://www.suisynth.xyz/)
- [Presentation](https://github.com/tamago-labs/suisynth-xyz/blob/main/SuiSynth%20-%20Sui%20Overflow'25.pdf)

## Target Users

### For Traders:
- **No Funding Rates:** Unlike perpetuals, no recurring funding costs
- **Capital Efficiency:** Up to 4x leverage on BTC exposure
- **Multi-Collateral:** Use SUI, USDC, or other approved assets
- **Flexible Management:** Add collateral, take profits, or exit anytime

### For Suppliers:
- **Dual Rewards:** Earn both interest and $SYNTH governance tokens
- **Fair Distribution:** Early suppliers get proportionally more $SYNTH
- **Governance Rights:** Participate in protocol decisions
- **Low Risk:** Lending to overcollateralized positions

## System Architecture

The current version consists of 3 smart contracts as follows:

### 1. SuiBTC Contract (sui_btc.move)
The core protocol contract that manages:
- **Synthetic Asset Creation:** Mint/burn suiBTC backed by collateral
- **Leveraged Trading:** Borrow suiBTC with leverage up to 4x
- **Multi-Collateral Pools:** Support for SUI, USDC, and other assets
- **Liquidation System:** Liquidation mechanism for undercollateralized positions
- **Oracle Integration:** Real-time price feeds from Switchboard

**Structs:**
- `SuiBTCGlobal` Main protocol state containing all pools and configuration
- `CollateralPool<X>` Individual collateral pools for each asset type
- `LendingPool` Central pool for leveraged borrowing
- `Position` User positions in collateral pools
- `BorrowPosition` User leveraged positions in lending pool

### 2. Governance Contract (governance.move)
Manages the SYNTH token distribution and protocol governance:
- **Fair Launch Distribution:** Rewards suppliers and stakers
- **Vesting Schedule:** Treasury tokens with time-locked vesting
- **Staking Mechanism:** Lock SYNTH tokens for governance power
- **Emission Control:** Dynamic reward rates based on protocol usage

**Tokenomics:**
- 100M total SYNTH supply (50% treasury, 30% rewards, 20% staking)
- Time-based emission schedule
- Lock periods for enhanced rewards
- Governance voting power based on staked amount and lock duration

### 3. Mock USDC Contract (mock_usdc.move)
Test token for development and testing purposes.

## Borrow Flow

Users can open leveraged long positions on suiBTC by providing collateral and borrowing additional funds.

### Position Calculation
- *Collateral Value:* Your SUI collateral × SUI price
- *Position Size:* Collateral value × leverage ratio
- *Borrowed Amount:* (Position size - collateral value) ÷ BTC price
- *Total Exposure:* Initial collateral + borrowed suiBTC in BTC terms

### Risk Management
- **Health Factor:** Continuous monitoring of collateral ratio
- **Liquidation Threshold:** Dynamic based on leverage (120% + 5% per leverage multiple)
- **Maximum Leverage:** 4x to maintain protocol safety 

### Example Borrow Flow:
1. Deposit 100 SUI (worth $575) as collateral
2. Choose 3x leverage
3. Borrow approximately $1,150 worth of suiBTC from the protocol
4. Gain a total BTC exposure of $1,725
5. Monitor your position health and BTC price movements
6. Manage your position by adding collateral, taking profits, or closing it as needed

## Supply Flow
Suppliers provide suiBTC liquidity to the lending pool and earn both interest and SYNTH governance tokens.

## Dynamic Interest Rates
- **Supply APY:** Dynamic rate based on pool utilization
- **Interest Accrual:** Compound interest calculated per block
- **Flexible Withdrawal:** Withdraw supplied assets anytime (subject to liquidity)

## SYNTH Token Rewards
- **Fair Launch:** SYNTH tokens distributed to early suppliers
- **Emission Schedule:** Time-based distribution over protocol lifecycle
- **Proportional Rewards:** Based on your share of total supplied liquidity

## Example Supply Flow:
1. Mint suiBTC by depositing collateral
2. Deposit your suiBTC into the lending pool
3. Earn dynamic interest based on pool utilization
4. Periodically claim your accumulated SYNTH token rewards

## AI-Optimized Risk Management

The system uses [SUI Butler](https://github.com/tamago-labs/sui-butler) to manage AI-driven risk parameters by observing external sources for market volatility. It allows AI to suggest and approve parameters for each lending pool and collateral asset pool. For example, when a collateral asset is volatile, the collateralization ratio needs to be increased or the supply and borrow rates adjusted to maintain balance based directly on insights from the AI chat conversation.

![Screenshot from 2025-05-22 08-02-10](https://github.com/user-attachments/assets/f7fcd34b-4b88-4950-9993-391480b45968)

## How to Test

The system is packaged with the AWS Amplify serverless stack, providing a serverless backend with a database to store historical prices for synthetic assets, and a frontend built with Next.js. Smart contracts are located in the /contracts folder. Refer to the [AWS documentation](https://docs.amplify.aws/nextjs/start/quickstart/) if you want to deploy a new system.

**Build Contracts**
```
cd contracts/suisynth
sui move build
```

**Run Tests**
```
sui move test
```

**Deploy**
```
sui client publish --gas-budget 200000000
```

## Deployment

### Sui Testnet

Component Name | ID/Address
--- | --- 
Package ID |  0xa22ab9bb6c4fa77a3b72395841b4df9506d154f84a673138816cbb3ea4414502
suiBTC Global State | 0x1c84c83c45ccd39cbfc93743dab7a01fc5d15ef29fdcccbb021b22ad6171cc81
Mock USDC Global State | 0x813f6b5e47d151a970e0f396fae5f3e91c8f9738270f5ed68e0ecfc0656861f4
Mock USDC Type | 0xa22ab9bb6c4fa77a3b72395841b4df9506d154f84a673138816cbb3ea4414502::mock_usdc::MOCK_USDC
ManagerCap | 0xcee5975588f2efdfcfe29d2687deb3b68f308669ae9b4d13af8cb92632ec3156
Switchboard Sui/USD Price State | 0x905b96e0c9862ef47d6a30971ab895ffb80ed1b58a107c3433fa69be64d9ac5d 
Switchboard BTC/USD Price State | 0xc1c608737dae8be35fb00e32bab782a933bf3d8530f7ec2dfafe6ba630a1a349 
Governance Global State | 0x1ee2d2dfc5ab195ec948a2a1422fdf86866954fd70853b4b4b16d593bbd8d048
GovernanceCap | 0x79ff270ce77974378f4e9d6217db66ebd416f162b5820bcd1fe6301241d35b0f
Governance Token Type | 0xa22ab9bb6c4fa77a3b72395841b4df9506d154f84a673138816cbb3ea4414502::governance::GOVERNANCE

## Future Improvements

- Expand synthetic asset offerings to cover diverse use cases, including suiS&P500 and suiGOLD.
- Implement a voting system enabling $SYNTH token holders to vote on key decisions such as governance parameter changes.
- Enable $SYNTH tokens to be used as collateral once its value stabilizes on Mainnet.
- Develop a scheduler to continuously monitor market conditions, propose parameter updates, and notify token holders of important changes.

## License

This library is licensed under the MIT-0 License. See the LICENSE file.
