import { fetchRedis } from "./redis";

export const getFriendsByUserId = async (userId: string) => {
  //fetch friends for current user
  const friendIds = (await fetchRedis(
    "smembers",
    `user:${userId}:friends`
  )) as string[];

  const friends = await Promise.all(
    friendIds.map(async (friendId) => {
      //below fetching all the info that is linked to a certain friend
      const friend = (await fetchRedis("get", `user:${friendId}`)) as string;
      const parsedFriend = JSON.parse(friend) as User;
      return parsedFriend;
    })
  );
  return friends;
};
