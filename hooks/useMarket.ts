
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
                target: `0xa22ab9bb6c4fa77a3b72395841b4df9506d154f84a673138816cbb3ea4414502::mock_usdc::mint`,
                arguments: [
                    tx.object(
                        "0x813f6b5e47d151a970e0f396fae5f3e91c8f9738270f5ed68e0ecfc0656861f4"
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

            //       const eventsResult = await client.queryEvents({
            //   query: {  
            //        "MoveEventType" : "0xa22ab9bb6c4fa77a3b72395841b4df9506d154f84a673138816cbb3ea4414502::sui_btc::MintEvent"
            //    },
            // });

            //       const myEvents = eventsResult.data.filter( (item:any) => item.sender === address)

            //       const result = myEvents.map((event: any) => {
            //           return {
            //               collateralType: event.parsedJson.collateral_type.name === "a22ab9bb6c4fa77a3b72395841b4df9506d154f84a673138816cbb3ea4414502::mock_usdc::MOCK_USDC" ? "USDC" : "SUI",
            //               collateralAmount: parseAmount(BigNumber(event.parsedJson.collateral_amount), 9),
            //               debtAmount: parseAmount(BigNumber(event.parsedJson.suibtc_amount), 9)
            //           }   
            //       }).reduce((output: any, item: any) => {
            //           if (output.find(entry => item.collateralType === entry.collateralType)) {
            //               let entry = output.find(entry => item.collateralType === entry.collateralType)
            //               entry.collateralAmount += item.collateralAmount
            //               entry.debtAmount += item.debtAmount
            //           } else {
            //               output.push(item)
            //           }
            //           return output
            //       }, [])

            // fetch USDC table first
            let dynamicFieldPage = await client.getDynamicFields({
                parentId: "0x8698896b3cef2b8043420c42e4f7d7909cf714ad178276f5af3daf9cbe80538e"
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
            // "0x6df9c59b6657cd3657cc3bc65a9431bffec9d9e516e43d98353e300db86778c8"
            dynamicFieldPage = await client.getDynamicFields({
                parentId: "0x6df9c59b6657cd3657cc3bc65a9431bffec9d9e516e43d98353e300db86778c8"
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

            return output
        },
        [client]
    )

    const listSupplyPositions = useCallback(
        async (address: any) => {

            let dynamicFieldPage = await client.getDynamicFields({
                parentId: "0x80f61ac2bbc51bb0dd9588353183a3e39e0e377e1155da9b4831eaf05231adf6"
            });

            let output: any = [];

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
                        accruedInterest: parseAmount(BigNumber(fields?.accrued_interest), 9),
                        suppliedAmount: parseAmount(BigNumber(fields?.supplied_amount), 9),

                    })
                }

            }

            return output
        },
        [client]
    )

    const listActivePositions = useCallback(
        async (address: any) => {

            let dynamicFieldPage = await client.getDynamicFields({
                parentId: "0xcdb19e0e2f9ea72b25bdb4aebb85ef46bbc3e59ef3cfe48d5aead691c502738c"
            });

            let output: any = [];

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

                    const tableId = fields.collateral.fields.id.id;
                    const dynamicFieldPage = await client.getDynamicFields({
                        parentId: tableId,
                    });

                    let positionInfo: any = {
                        accruedInterest: parseAmount(BigNumber(fields?.accrued_interest), 9),
                        borrowedAmount: parseAmount(BigNumber(fields?.borrowed_amount), 9),
                        entryBtcPrice: parseAmount(BigNumber(fields?.entry_btc_price), 4),
                        entryCollateralPrice: parseAmount(BigNumber(fields?.entry_collateral_price), 4),
                        leverage: parseAmount(BigNumber(fields?.leverage), 4)
                    }

                    for (let pool of dynamicFieldPage.data) {
                        const { objectId } = pool;
                        const result: any = await client.getObject({
                            id: objectId,
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

                        const assetType = result.data.content.fields.name.fields.name
                        const value = result.data.content.fields.value;

                        positionInfo.collateralType = assetType === "a22ab9bb6c4fa77a3b72395841b4df9506d154f84a673138816cbb3ea4414502::mock_usdc::MOCK_USDC" ? "USDC" : "SUI"
                        positionInfo.collateralAmount = parseAmount(BigNumber(value), 9)
                    }

                    output.push(positionInfo)

                }

            }

            return output
        },
        [client]
    )

    const fetchPools = useCallback(async () => {

        const { data } = await client.getObject({
            id: "0x1c84c83c45ccd39cbfc93743dab7a01fc5d15ef29fdcccbb021b22ad6171cc81",
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
                totalBorrowed: parseAmount(BigNumber(content.fields.lending_pool.fields.total_borrowed), 9),
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
            coinType: collateral_asset_type === "SUI" ? "0x2::sui::SUI" : "0xa22ab9bb6c4fa77a3b72395841b4df9506d154f84a673138816cbb3ea4414502::mock_usdc::MOCK_USDC",
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
            target: `0xa22ab9bb6c4fa77a3b72395841b4df9506d154f84a673138816cbb3ea4414502::sui_btc::mint`,
            typeArguments: [
                collateral_asset_type === "SUI" ? "0x2::sui::SUI" : "0xa22ab9bb6c4fa77a3b72395841b4df9506d154f84a673138816cbb3ea4414502::mock_usdc::MOCK_USDC"
            ],
            arguments: [
                tx.object(
                    "0x1c84c83c45ccd39cbfc93743dab7a01fc5d15ef29fdcccbb021b22ad6171cc81"
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
            coinType: "0xa22ab9bb6c4fa77a3b72395841b4df9506d154f84a673138816cbb3ea4414502::sui_btc::SUI_BTC"
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
            target: `0xa22ab9bb6c4fa77a3b72395841b4df9506d154f84a673138816cbb3ea4414502::sui_btc::burn`,
            typeArguments: [
                collateral_asset_type === "SUI" ? "0x2::sui::SUI" : "0xa22ab9bb6c4fa77a3b72395841b4df9506d154f84a673138816cbb3ea4414502::mock_usdc::MOCK_USDC"
            ],
            arguments: [
                tx.object(
                    "0x1c84c83c45ccd39cbfc93743dab7a01fc5d15ef29fdcccbb021b22ad6171cc81"
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
            coinType: "0xa22ab9bb6c4fa77a3b72395841b4df9506d154f84a673138816cbb3ea4414502::sui_btc::SUI_BTC"
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
            target: `0xa22ab9bb6c4fa77a3b72395841b4df9506d154f84a673138816cbb3ea4414502::sui_btc::supply_suibtc`,
            arguments: [
                tx.object(
                    "0x1c84c83c45ccd39cbfc93743dab7a01fc5d15ef29fdcccbb021b22ad6171cc81"
                ),
                tx.object(
                    "0x1ee2d2dfc5ab195ec948a2a1422fdf86866954fd70853b4b4b16d593bbd8d048"
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

    const withdraw = useCallback(async (
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

        tx.moveCall({
            target: `0xa22ab9bb6c4fa77a3b72395841b4df9506d154f84a673138816cbb3ea4414502::sui_btc::withdraw_suibtc`,
            arguments: [
                tx.object(
                    "0x1c84c83c45ccd39cbfc93743dab7a01fc5d15ef29fdcccbb021b22ad6171cc81"
                ),
                tx.pure.u64(`${(BigNumber(sui_btc_amount).multipliedBy(10 ** 9)).toFixed(0)}`)
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
            coinType: collateral_asset_type === "SUI" ? "0x2::sui::SUI" : "0xa22ab9bb6c4fa77a3b72395841b4df9506d154f84a673138816cbb3ea4414502::mock_usdc::MOCK_USDC",
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
            target: `0xa22ab9bb6c4fa77a3b72395841b4df9506d154f84a673138816cbb3ea4414502::sui_btc::add_collateral`,
            typeArguments: [
                collateral_asset_type === "SUI" ? "0x2::sui::SUI" : "0xa22ab9bb6c4fa77a3b72395841b4df9506d154f84a673138816cbb3ea4414502::mock_usdc::MOCK_USDC"
            ],
            arguments: [
                tx.object(
                    "0x1c84c83c45ccd39cbfc93743dab7a01fc5d15ef29fdcccbb021b22ad6171cc81"
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

    const borrow = useCallback(async (
        collateral_amount: number,
        collateral_asset_type: string,
        leverage: number
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
            coinType: collateral_asset_type === "SUI" ? "0x2::sui::SUI" : "0xa22ab9bb6c4fa77a3b72395841b4df9506d154f84a673138816cbb3ea4414502::mock_usdc::MOCK_USDC",
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
            target: `0xa22ab9bb6c4fa77a3b72395841b4df9506d154f84a673138816cbb3ea4414502::sui_btc::borrow_with_leverage`,
            typeArguments: [
                collateral_asset_type === "SUI" ? "0x2::sui::SUI" : "0xa22ab9bb6c4fa77a3b72395841b4df9506d154f84a673138816cbb3ea4414502::mock_usdc::MOCK_USDC"
            ],
            arguments: [
                tx.object(
                    "0x1c84c83c45ccd39cbfc93743dab7a01fc5d15ef29fdcccbb021b22ad6171cc81"
                ),
                coin,
                tx.pure.u64(`${(BigNumber(leverage).multipliedBy(10 ** 4)).toFixed(0)}`)
            ],
        });

        const params: any = {
            transaction: tx
        }

        await wallet.signAndExecuteTransaction(params);

    }, [wallet, client])

    const cashOut = useCallback(async (percentage: number, collateral_asset_type: string) => {

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

        if (!(percentage > 0 && percentage <= 1)) {
            throw new Error("Invalid percentage");
        }

        tx.moveCall({
            target: `0xa22ab9bb6c4fa77a3b72395841b4df9506d154f84a673138816cbb3ea4414502::sui_btc::cash_out_position`,
            typeArguments: [
                collateral_asset_type === "SUI" ? "0x2::sui::SUI" : "0xa22ab9bb6c4fa77a3b72395841b4df9506d154f84a673138816cbb3ea4414502::mock_usdc::MOCK_USDC"
            ],
            arguments: [
                tx.object(
                    "0x1c84c83c45ccd39cbfc93743dab7a01fc5d15ef29fdcccbb021b22ad6171cc81"
                ),
                tx.pure.u64(`${(BigNumber(percentage).multipliedBy(10 ** 4)).toFixed(0)}`)
            ],
        });

        const params: any = {
            transaction: tx
        }

        await wallet.signAndExecuteTransaction(params);

    }, [wallet, client])

    const repay = useCallback(async (
        repay_amount: number,
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

        tx.moveCall({
            target: `0xa22ab9bb6c4fa77a3b72395841b4df9506d154f84a673138816cbb3ea4414502::sui_btc::repay_loan`,
            typeArguments: [
                collateral_asset_type === "SUI" ? "0x2::sui::SUI" : "0xa22ab9bb6c4fa77a3b72395841b4df9506d154f84a673138816cbb3ea4414502::mock_usdc::MOCK_USDC"
            ],
            arguments: [
                tx.object(
                    "0x1c84c83c45ccd39cbfc93743dab7a01fc5d15ef29fdcccbb021b22ad6171cc81"
                ),
                tx.pure.u64(`${(BigNumber(repay_amount).multipliedBy(10 ** 9)).toFixed(0)}`)
            ],
        });

        const params: any = {
            transaction: tx
        }

        await wallet.signAndExecuteTransaction(params);
    },
        [wallet, client]
    );

    const addMoreCollateral = useCallback(async (
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
            coinType: collateral_asset_type === "SUI" ? "0x2::sui::SUI" : "0xa22ab9bb6c4fa77a3b72395841b4df9506d154f84a673138816cbb3ea4414502::mock_usdc::MOCK_USDC",
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
            target: `0xa22ab9bb6c4fa77a3b72395841b4df9506d154f84a673138816cbb3ea4414502::sui_btc::borrow_with_leverage`,
            typeArguments: [
                collateral_asset_type === "SUI" ? "0x2::sui::SUI" : "0xa22ab9bb6c4fa77a3b72395841b4df9506d154f84a673138816cbb3ea4414502::mock_usdc::MOCK_USDC"
            ],
            arguments: [
                tx.object(
                    "0x1c84c83c45ccd39cbfc93743dab7a01fc5d15ef29fdcccbb021b22ad6171cc81"
                ),
                coin,
                tx.pure.u64(`${(BigNumber(1).multipliedBy(10 ** 4)).toFixed(0)}`)
            ],
        });

        const params: any = {
            transaction: tx
        }

        await wallet.signAndExecuteTransaction(params);

    }, [wallet, client])

    const parseAmount = (input: any, decimals: number) => {
        return Number(input) / 10 ** decimals;
    };

    return {
        faucet,
        fetchBalances,
        fetchPools,
        mint,
        listMintPositions,
        listSupplyPositions,
        listActivePositions,
        addCollateral,
        burn,
        supply,
        borrow,
        withdraw,
        cashOut,
        repay,
        addMoreCollateral
    }
}

export default useMarket