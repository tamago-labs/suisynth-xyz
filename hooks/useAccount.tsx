
import { createContext, useCallback, ReactNode, useContext, useEffect, useMemo, useReducer, useState } from "react"
import useMarket from "./useMarket";
import { useWallet } from "@suiet/wallet-kit";
import { useInterval } from "./useInterval";


type accountContextType = {
    balances: any[]
};

const accountContextDefaultValues: accountContextType = {
    balances: []
};

type Props = {
    children: ReactNode;
};

type Values = {
    balances?: any[]
}

export const AccountContext = createContext<accountContextType>(accountContextDefaultValues)

const Provider = ({ children }: Props) => {

    const wallet = useWallet()
    const { account, connected } = wallet
    const address = account && account?.address
    const isTestnet = connected && account && account.chains && account.chains[0] === "sui:testnet" ? true : false

    const { fetchBalances } = useMarket()

    const [values, dispatch] = useReducer(
        (curVal: Values, newVal: Values) => ({ ...curVal, ...newVal }),
        {
            balances: []
        }
    )

    const { balances } = values

    const setBalances = (balances: any[]) => {
        dispatch({ balances })
    }

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

    const accountContext: any = useMemo(
        () => ({
            balances
        }),
        [
            balances
        ]
    )

    return (
        <AccountContext.Provider value={accountContext}>
            {children}
        </AccountContext.Provider>
    )
}

export default Provider

