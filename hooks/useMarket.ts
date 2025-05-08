
import { useCallback } from "react";
import { useWallet } from "@suiet/wallet-kit"
import { Transaction } from '@mysten/sui/transactions'
import { SuiClient, getFullnodeUrl, SuiMoveObject } from '@mysten/sui.js/client'
import BigNumber from "bignumber.js"
import COINS from "../data/coins.json"
import COLLATERAL_POOLS from "../data/collateral_pools.json"

const useMarket = () => {

    const client = new SuiClient({ url: getFullnodeUrl("testnet") })

    const wallet = useWallet()
    const { connected } = wallet

    const faucet = useCallback(
        async (recipient: string) => {
            if (!wallet) {
                return;
            }

            const tx = new Transaction();
            tx.setGasBudget(50000000);

            tx.moveCall({
                target: `0xddd1dc7afe3888a05835345ecd98cf9c91fffa987a4d749d92b1a879d5c5e3b1::mock_usdc::mint`,
                arguments: [
                    tx.object(
                        "0xa3a951b5365f5c5f64ac9ee372d8533ea48707d2bf718918c08e11e4a5b5cb33"
                    ),
                    tx.pure.u64(`${BigNumber(100).multipliedBy(10 ** 9)}`),
                    tx.pure.address(recipient),
                ],
            });

            const params: any = {
                transaction: tx
            }

            await wallet.signAndExecuteTransaction(params);
        },
        [wallet]
    );

    const fetchBalances = useCallback(
        async (address: any) => {
            let output: any = [];
            const coinTypeList = COINS.map((coin) => coin.coin_type);

            for (let coinType of coinTypeList) {
                const data = await client.getBalance({
                    owner: address,
                    coinType,
                });
                const amount = parseAmount(BigNumber(data?.totalBalance), 9);
                output.push(amount);
            }

            return output;
        },
        [client]
    );

    const listMintPositions = useCallback(
        async (address: any) => {

            // fetch USDC table first
            let dynamicFieldPage = await client.getDynamicFields({
                parentId: "0x533bdd2ee04758d2039c3c6c0bd73aed09d296b8a7ac0f07ef7f300e692c8682"
            });

            let output = [];

            for (let position of dynamicFieldPage.data) {
                const { objectId, name } = position;

                if (name.value === address) {
                    const result: any = await client.getObject({
                        id: objectId,
                        options: {
                            showType: false,
                            showOwner: true,
                            showPreviousTransaction: false,
                            showDisplay: false,
                            showContent: true,
                            showBcs: false,
                            showStorageRebate: false,
                        },
                    });
                    const fields = result.data.content.fields.value.fields;
                    output.push({
                        collateralType: "USDC",
                        collateralAmount: parseAmount(BigNumber(fields?.collateral_amount), 9),
                        debtAmount: parseAmount(BigNumber(fields?.debt_amount), 9)
                    })
                }

            }

            // SUI
            // "0xb666d1aef14228b3918ab15d8a235e55315a711bc9814a86b6fde9727e4c6a8a"
            dynamicFieldPage = await client.getDynamicFields({
                parentId: "0xb666d1aef14228b3918ab15d8a235e55315a711bc9814a86b6fde9727e4c6a8a"
            });

            for (let position of dynamicFieldPage.data) {
                const { objectId, name } = position;

                if (name.value === address) {
                    const result: any = await client.getObject({
                        id: objectId,
                        options: {
                            showType: false,
                            showOwner: true,
                            showPreviousTransaction: false,
                            showDisplay: false,
                            showContent: true,
                            showBcs: false,
                            showStorageRebate: false,
                        },
                    });
                    const fields = result.data.content.fields.value.fields;
                    output.push({
                        collateralType: "SUI",
                        collateralAmount: parseAmount(BigNumber(fields?.collateral_amount), 9),
                        debtAmount: parseAmount(BigNumber(fields?.debt_amount), 9)
                    })
                }

            }

            return output;
        },
        [client]
    )



    const fetchPools = useCallback(async () => {

        const { data } = await client.getObject({
            id: "0x036faafff10ff640957e128670696113077340441429b34e97f63b6a252659e8",
            options: {
                showType: false,
                showOwner: false,
                showPreviousTransaction: false,
                showDisplay: false,
                showContent: true,
                showBcs: false,
                showStorageRebate: false,
            },
        });

        const content: any = data?.content;

        if (!content) {
            return;
        }

        let prices: any = {}

        prices["BTC"] = parseAmount(BigNumber(content.fields?.btc_price_oracle), 4)

        // console.log("content: ", content.fields)

        for (let pool of COLLATERAL_POOLS) {
            const { object_id } = pool
            const poolData: any = await client.getObject({
                id: object_id,
                options: {
                    showType: false,
                    showOwner: false,
                    showPreviousTransaction: false,
                    showDisplay: false,
                    showContent: true,
                    showBcs: false,
                    showStorageRebate: false,
                },
            });
            const poolFields = poolData.data.content.fields.value.fields;

            // console.log("poolFields :", poolFields)

            prices[pool.name] = parseAmount(BigNumber(poolFields.price_oracle), 4)
        }

        return {
            prices,
            lendingPool: {
                totalSupplied: parseAmount(BigNumber(content.fields.lending_pool.fields.total_suibtc), 9),
                borrowRate: parseAmount(BigNumber(content.fields.lending_pool.fields.borrow_rate), 2),
                supplyRate: parseAmount(BigNumber(content.fields.lending_pool.fields.supply_rate), 2),
            }
        }

    }, [client])

    const mint = useCallback(async (
        collateral_amount: number,
        collateral_asset_type: string,
        mint_amount: number
    ) => {
        if (!wallet) {
            return;
        }

        const { account } = wallet
        const address = account && account?.address

        if (!address) {
            return;
        }

        const tx = new Transaction();
        tx.setGasBudget(10000000);

        // get the coin object
        const allCoins = await client.getCoins({
            owner: address,
            coinType: collateral_asset_type === "SUI" ? "0x2::sui::SUI" : "0xddd1dc7afe3888a05835345ecd98cf9c91fffa987a4d749d92b1a879d5c5e3b1::mock_usdc::MOCK_USDC",
        });

        const [mainCoin, ...restCoins] = allCoins.data;

        // check if the balance is enough
        const totalBalance = allCoins.data.reduce(
            (output, coin) => output + Number(coin.balance),
            0,
        );

        if ((totalBalance / 10 ** 9) < collateral_amount) {
            throw new Error("Insufficient balance");
        }

        // merge the coins
        if (collateral_asset_type !== "SUI" && restCoins.length > 0) {
            tx.mergeCoins(
                tx.object(mainCoin.coinObjectId),
                restCoins.map((coin) => tx.object(coin.coinObjectId)),
            );
        }

        // split the coin
        const coinObjId = collateral_asset_type === "SUI" ? tx.gas : mainCoin.coinObjectId;

        const [coin] = tx.splitCoins(coinObjId, [`${(BigNumber(collateral_amount).multipliedBy(10 ** 9)).toFixed(0)}`]);

        tx.moveCall({
            target: `0xddd1dc7afe3888a05835345ecd98cf9c91fffa987a4d749d92b1a879d5c5e3b1::sui_btc::mint`,
            typeArguments: [
                collateral_asset_type === "SUI" ? "0x2::sui::SUI" : "0xddd1dc7afe3888a05835345ecd98cf9c91fffa987a4d749d92b1a879d5c5e3b1::mock_usdc::MOCK_USDC"
            ],
            arguments: [
                tx.object(
                    "0x036faafff10ff640957e128670696113077340441429b34e97f63b6a252659e8"
                ),
                coin,
                tx.pure.u64(`${(BigNumber(mint_amount).multipliedBy(10 ** 9)).toFixed(0)}`)
            ],
        });

        // tx.transferObjects([coin], address);

        const params: any = {
            transaction: tx
        }

        await wallet.signAndExecuteTransaction(params);
    },
        [wallet, client]
    );

    const burn = useCallback(async (
        sui_btc_amount: number,
        collateral_asset_type: string,
        collateral_amount: number
    ) => {
        if (!wallet) {
            return;
        }

        const { account } = wallet
        const address = account && account?.address

        if (!address) {
            return;
        }

        const tx = new Transaction();
        tx.setGasBudget(10000000);

        // get the coin object
        const allCoins = await client.getCoins({
            owner: address,
            coinType: "0xddd1dc7afe3888a05835345ecd98cf9c91fffa987a4d749d92b1a879d5c5e3b1::sui_btc::SUI_BTC"
        });

        const [mainCoin, ...restCoins] = allCoins.data;

        // check if the balance is enough
        const totalBalance = allCoins.data.reduce(
            (output, coin) => output + Number(coin.balance),
            0,
        );

        if ((totalBalance / 10 ** 9) < sui_btc_amount) {
            throw new Error("Insufficient balance");
        }

        // merge the coins
        if (restCoins.length > 0) {
            tx.mergeCoins(
                tx.object(mainCoin.coinObjectId),
                restCoins.map((coin) => tx.object(coin.coinObjectId)),
            );
        }

        // split the coin
        const coinObjId = mainCoin.coinObjectId

        const [coin] = tx.splitCoins(coinObjId, [`${(BigNumber(sui_btc_amount).multipliedBy(10 ** 9)).toFixed(0)}`]);

        tx.moveCall({
            target: `0xddd1dc7afe3888a05835345ecd98cf9c91fffa987a4d749d92b1a879d5c5e3b1::sui_btc::burn`,
            typeArguments: [
                collateral_asset_type === "SUI" ? "0x2::sui::SUI" : "0xddd1dc7afe3888a05835345ecd98cf9c91fffa987a4d749d92b1a879d5c5e3b1::mock_usdc::MOCK_USDC"
            ],
            arguments: [
                tx.object(
                    "0x036faafff10ff640957e128670696113077340441429b34e97f63b6a252659e8"
                ),
                coin,
                tx.pure.u64(`${(BigNumber(collateral_amount).multipliedBy(10 ** 9)).toFixed(0)}`)
            ],
        });

        const params: any = {
            transaction: tx
        }

        await wallet.signAndExecuteTransaction(params);
    },
        [wallet, client]
    );

    const supply = useCallback(async (
        sui_btc_amount: number
    ) => {
        if (!wallet) {
            return;
        }

        const { account } = wallet
        const address = account && account?.address

        if (!address) {
            return;
        }

        const tx = new Transaction();
        tx.setGasBudget(10000000);

        // get the coin object
        const allCoins = await client.getCoins({
            owner: address,
            coinType: "0xddd1dc7afe3888a05835345ecd98cf9c91fffa987a4d749d92b1a879d5c5e3b1::sui_btc::SUI_BTC"
        });

        const [mainCoin, ...restCoins] = allCoins.data;

        // check if the balance is enough
        const totalBalance = allCoins.data.reduce(
            (output, coin) => output + Number(coin.balance),
            0,
        );

        if ((totalBalance / 10 ** 9) < sui_btc_amount) {
            throw new Error("Insufficient balance");
        }

        // merge the coins
        if (restCoins.length > 0) {
            tx.mergeCoins(
                tx.object(mainCoin.coinObjectId),
                restCoins.map((coin) => tx.object(coin.coinObjectId)),
            );
        }

        // split the coin
        const coinObjId = mainCoin.coinObjectId

        const [coin] = tx.splitCoins(coinObjId, [`${(BigNumber(sui_btc_amount).multipliedBy(10 ** 9)).toFixed(0)}`]);

        tx.moveCall({
            target: `0xddd1dc7afe3888a05835345ecd98cf9c91fffa987a4d749d92b1a879d5c5e3b1::sui_btc::supply_suibtc`,
            arguments: [
                tx.object(
                    "0x036faafff10ff640957e128670696113077340441429b34e97f63b6a252659e8"
                ),
                coin
            ],
        });

        const params: any = {
            transaction: tx
        }

        await wallet.signAndExecuteTransaction(params);
    },
        [wallet, client]
    );

    const addCollateral = useCallback(async (
        collateral_amount: number,
        collateral_asset_type: string
    ) => {
        if (!wallet) {
            return;
        }
 
        const { account } = wallet
        const address = account && account?.address

        if (!address) {
            return;
        }

        const tx = new Transaction();
        tx.setGasBudget(10000000);

        // get the coin object
        const allCoins = await client.getCoins({
            owner: address,
            coinType: collateral_asset_type === "SUI" ? "0x2::sui::SUI" : "0xddd1dc7afe3888a05835345ecd98cf9c91fffa987a4d749d92b1a879d5c5e3b1::mock_usdc::MOCK_USDC",
        });

        const [mainCoin, ...restCoins] = allCoins.data;

        // check if the balance is enough
        const totalBalance = allCoins.data.reduce(
            (output, coin) => output + Number(coin.balance),
            0,
        );

        if ((totalBalance / 10 ** 9) < collateral_amount) {
            throw new Error("Insufficient balance");
        }

        // merge the coins
        if (collateral_asset_type !== "SUI" && restCoins.length > 0) {
            tx.mergeCoins(
                tx.object(mainCoin.coinObjectId),
                restCoins.map((coin) => tx.object(coin.coinObjectId)),
            );
        }

        // split the coin
        const coinObjId = collateral_asset_type === "SUI" ? tx.gas : mainCoin.coinObjectId;

        const [coin] = tx.splitCoins(coinObjId, [`${(BigNumber(collateral_amount).multipliedBy(10 ** 9)).toFixed(0)}`]);

        tx.moveCall({
            target: `0xddd1dc7afe3888a05835345ecd98cf9c91fffa987a4d749d92b1a879d5c5e3b1::sui_btc::add_collateral`,
            typeArguments: [
                collateral_asset_type === "SUI" ? "0x2::sui::SUI" : "0xddd1dc7afe3888a05835345ecd98cf9c91fffa987a4d749d92b1a879d5c5e3b1::mock_usdc::MOCK_USDC"
            ],
            arguments: [
                tx.object(
                    "0x036faafff10ff640957e128670696113077340441429b34e97f63b6a252659e8"
                ),
                coin
            ],
        });

        const params: any = {
            transaction: tx
        }

        await wallet.signAndExecuteTransaction(params);
    },
        [wallet, client]
    );

    const parseAmount = (input: any, decimals: number) => {
        return Number(input) / 10 ** decimals;
    };

    return {
        faucet,
        fetchBalances,
        fetchPools,
        mint,
        listMintPositions,
        addCollateral,
        burn,
        supply
    }
}

export default useMarket