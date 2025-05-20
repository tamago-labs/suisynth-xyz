import { type ClientSchema, a, defineData } from "@aws-amplify/backend";

const schema = a.schema({
  CryptoPrice: a
    .model({
      symbol: a.string(),
      lastPrice: a.string(),
      prevPrice24h: a.string(),
      price24hPcnt: a.string(),
      volume24h: a.string(),
      usdIndexPrice: a.string(),
      source: a.string()
    })
    .authorization((allow) => [allow.guest()]),
});

export type Schema = ClientSchema<typeof schema>;

export const data = defineData({
  schema,
  authorizationModes: {
    defaultAuthorizationMode: "iam"
  },
});
