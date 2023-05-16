const upstashRedisRestUrl = process.env.UPSTASH_REDIS_REST_URL;
const authToken = process.env.UPSTASH_REDIS_REST_TOKEN;

type Command = "zrange" | "sismember" | "get" | "smembers";
export const revalidate = 0; // disable cache

//esentially same thing as /db.ts but guaranteeing without caching
export async function fetchRedis(
  command: Command,
  ...args: (string | number)[]
) {
  const commandUrl = `${upstashRedisRestUrl}/${command}/${args.join("/")}`;

  const response = await fetch(commandUrl, {
    headers: {
      Authorization: `Bearer ${authToken}`,
    },
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`Error in Redis query: ${response.statusText}`);
  }

  const data = await response.json();
  return data.result;
}

// const response = await axios.get(commandUrl, {
//     headers: {
//         Authorization: 'Bearer ' +authToken,
//         "common['Cache-Control']": "no-store",
//     },
//     cache: 'no-store',
// })
