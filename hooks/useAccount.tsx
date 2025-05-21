
import { createContext, useCallback, ReactNode, useContext, useEffect, useMemo, useReducer, useState } from "react"
import useMarket from "./useMarket";
import { useWallet } from "@suiet/wallet-kit";
import { useInterval } from "./useInterval";
import type { Schema } from "../amplify/data/resource"
import { generateClient } from "aws-amplify/api"

const client = generateClient<Schema>()

type accountContextType = {
    balances: any[],
    poolData: any
};

const accountContextDefaultValues: accountContextType = {
    balances: [],
    poolData: undefined
};

type Props = {
    children: ReactNode;
};

type Values = {
    balances?: any[],
    interval?: any,
    poolData?: any
}

export const AccountContext = createContext<accountContextType>(accountContextDefaultValues)



const Provider = ({ children }: Props) => {

    const wallet = useWallet()
    const { account, connected } = wallet
    const address = account && account?.address
    const isTestnet = connected && account && account.chains && account.chains[0] === "sui:testnet" ? true : false

    const { fetchBalances, fetchPools } = useMarket()

    const [values, dispatch] = useReducer(
        (curVal: Values, newVal: Values) => ({ ...curVal, ...newVal }),
        {
            balances: [],
            interval: 1000,
            poolData: undefined
        }
    )

    const { balances, interval, poolData } = values

    // const setBalances = (balances: any[]) => {
    //     dispatch({ balances })
    // }

    const updateBalances = async (address: any) => {
        const balances = await fetchBalances(address)
        dispatch({ balances })
    }

    const clearBalances = () => {
        dispatch({ balances: [] })
    }

    useInterval(() => {
        if (address && isTestnet) {
            updateBalances(address)
        } else {
            clearBalances()
        }

    }, 3000)

    useInterval(() => {

        fetchPools().then(
            (data) => {

                dispatch({
                    poolData: data
                })

                if (data !== undefined) {
                    dispatch({
                        interval: 10000
                    })
                }

            }
        )

    }, interval)

    const getBTCPrices = async (timeFilter : any = {}) => {
        try {
            // Build the filter object based on the API's required format
            let filter: any = {
                symbol: {
                    eq: "BTCUSDT"  // Always filter for Bitcoin/USDT pair
                }
            };

            // Add time-based filters if provided
            if (timeFilter.createdAt && timeFilter.createdAt.gt) {
                filter.createdAt = {
                    gt: timeFilter.createdAt.gt
                };
            }

            // Call the API with the constructed filter
            const { data } = await client.models.CryptoPrice.list({
                filter: filter
            });

            return data;
        } catch (error) {
            console.error("Error fetching BTC prices:", error);
            return [];
        }
    };


    const accountContext: any = useMemo(
        () => ({
            balances,
            poolData,
            getBTCPrices
        }),
        [
            balances,
            poolData
        ]
    )

    return (
        <AccountContext.Provider value={accountContext}>
            {children}
        </AccountContext.Provider>
    )
}

export default Provider

