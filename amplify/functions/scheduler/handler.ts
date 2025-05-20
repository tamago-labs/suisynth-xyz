import type { Handler } from 'aws-lambda';
import type { EventBridgeHandler } from "aws-lambda";
import type { Schema } from '../../data/resource';
import { Amplify } from 'aws-amplify';
import { generateClient } from 'aws-amplify/data';
import { getAmplifyDataClientConfig } from '@aws-amplify/backend/function/runtime';
import { env } from '$amplify/env/scheduler';
import axios from 'axios';

const { resourceConfig, libraryOptions } = await getAmplifyDataClientConfig(env);

Amplify.configure(resourceConfig, libraryOptions);

const client = generateClient<Schema>();


export const handler: EventBridgeHandler<"Scheduled Event", null, void> = async (event) => {
    console.log("event", JSON.stringify(event, null, 2))

    const { data } = await axios.get("https://api.bybit.com/v5/market/tickers?category=spot")

    const entry = data.result.list.find((item: any) => item.symbol === "BTCUSDT")

    console.log("saving : ", entry)

    await client.models.CryptoPrice.create({
        symbol: entry.symbol,
        lastPrice: entry.lastPrice,
        prevPrice24h: entry.prevPrice24h,
        price24hPcnt: entry.price24hPcnt,
        volume24h: entry.volume24h,
        usdIndexPrice: entry.usdIndexPrice,
        source: "Bybit"
    })

}
