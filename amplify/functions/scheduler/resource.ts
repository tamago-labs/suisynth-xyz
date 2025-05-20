import { defineFunction } from "@aws-amplify/backend"; 

export const scheduler = defineFunction({
    name: "scheduler",
    schedule: "every 1h", 
    entry: './handler.ts',
    timeoutSeconds: 200
})