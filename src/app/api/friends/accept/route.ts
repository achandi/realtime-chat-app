import { fetchRedis } from "@/helpers/redis";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { pusherServer } from "@/lib/pusher";
import { toPusherKey } from "@/lib/utils";
import { getServerSession } from "next-auth";
import { z } from "zod";

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const { id: idToAdd } = z.object({ id: z.string() }).parse(body);

    const session = await getServerSession(authOptions);
    if (!session) {
      return new Response("Unauthorized", { status: 401 });
    }
    // verify users arent already friends
    const isAlreadyFriends = await fetchRedis(
      "sismember",
      `user:${session.user.id}:friends`,
      idToAdd
    );
    if (isAlreadyFriends) {
      return new Response("You are already friends with this person.", {
        status: 400,
      });
    }
    const hasFriendRequests = await fetchRedis(
      "sismember",
      `user:${session.user.id}:incoming_friend_requests`,
      idToAdd
    );

    if (!hasFriendRequests) {
      return new Response("This person has not sent you a friend request.", {
        status: 400,
      });
    }

    const [rawUser, rawFriend] = (await Promise.all([
      fetchRedis(`get`, `user:${session.user.id}`),
      fetchRedis(`get`, `user:${idToAdd}`),
    ])) as [string, string];

    const user = JSON.parse(rawUser);
    const friend = JSON.parse(rawFriend);

    //all below requests can happen simultaneously.. refactorting to make it faster
    await Promise.all([
      //friend gets your data and vice versa
      pusherServer.trigger(
        toPusherKey(`user:${idToAdd}:friends`),
        "new_friend",
        user
      ),
      pusherServer.trigger(
        toPusherKey(`user:${session.user.id}:friends`),
        "new_friend",
        friend
      ),
      //add to each others friends list
      await db.sadd(`user:${session.user.id}:friends`, idToAdd),
      await db.sadd(`user:${idToAdd}:friends`, session.user.id),
      //sadd = set add vs srem = set remove

      await db.srem(
        `user:${session.user.id}:incoming_friend_requests`,
        idToAdd
      ),
      //can implement below later
      // await db.srem(`user:${idToAdd}:outbound_friend_requests`, session.user.id);
    ]);

    return new Response("OK");
  } catch (error) {
    if (error instanceof z.ZodError) {
      return new Response("Invalid request payload", { status: 422 }); //422 is unprocessable entity
    }
    return new Response("Invalid request", { status: 400 }); //400 is bad request
  }
}
