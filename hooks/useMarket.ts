
import { useCallback } from "react";
import { useWallet } from "@suiet/wallet-kit"
import { Transaction } from '@mysten/sui/transactions'
import { SuiClient, getFullnodeUrl, SuiMoveObject } from '@mysten/sui.js/client'
import BigNumber from "bignumber.js"
import COINS from "../data/coins.json"

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
                    tx.pure.u64(`${BigNumber(20).multipliedBy(10 ** 9)}`),
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

    const parseAmount = (input: any, decimals: number) => {
        return Number(input) / 10 ** decimals;
    };

    return {
        faucet,
        fetchBalances
    }
}

export default useMarket