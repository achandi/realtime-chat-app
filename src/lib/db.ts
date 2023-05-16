import  { Redis } from '@upstash/redis'
export const revalidate = 0 // disable cache 

export const db = new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL,
    token: process.env.UPSTASH_REDIS_REST_TOKEN,
})



