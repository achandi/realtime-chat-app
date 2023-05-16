import { fetchRedis } from "@/helpers/redis";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { pusherServer } from "@/lib/pusher";
import { toPusherKey } from "@/lib/utils";
import { addFriendValidator } from "@/lib/validations/add-friend";
import { getServerSession } from "next-auth";
import { z } from "zod";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { email: emailToAdd } = addFriendValidator.parse(body.email);
    //user:email shown in upstash redis data provider (changed to use fetchRedist after with 'get' to avoid caching issues)
    const idToAdd = (await fetchRedis(
      "get",
      `user:email:${emailToAdd}`
    )) as string;

    //5 checks:
    //1 new user exists:
    if (!idToAdd) {
      return new Response("This person does not exist.", { status: 400 });
    }

    //2 your log in identity with server session, as client only is unsafe
    const session = await getServerSession(authOptions);
    if (!session) {
      return new Response("Unauthorized", { status: 401 });
    }
    // 3 you're not trying to add yourself
    if (idToAdd === session.user.id) {
      return new Response("You cannot add yourself as a friend.", {
        status: 400,
      });
    }
    //4 check if user has already been added(using custom helper function to get around problems with nextjs default get caching)
    const isAlreadyAdded = (await fetchRedis(
      "sismember",
      `user:${idToAdd}:incoming_friend_requests`,
      session.user.id
    )) as 0 | 1;
    if (isAlreadyAdded) {
      return new Response("You have already added this person.", {
        status: 400,
      });
    }

    //5 is already friend (similar to check 4)
    const isAlreadyFriends = (await fetchRedis(
      "sismember",
      `user:${session.user.id}:friends`,
      idToAdd
    )) as 0 | 1;

    if (isAlreadyFriends) {
      return new Response("You have already friends with this person.", {
        status: 400,
      });
    }

    console.log("trigger pusher");
    //notify related clients the friend request has been sent
    pusherServer.trigger(
      toPusherKey(`user:${idToAdd}:incoming_friend_requests`), //route to watch
      "incoming_friend_requests", //trigger func in FriendRequests.tsx
      { senderId: session.user.id, senderEmail: session.user.email }
    );

    //valid request user that is loggedin is going to be put into incoming friend request
    db.sadd(`user:${idToAdd}:incoming_friend_requests`, session.user.id);
    return new Response("OK"); //by default status is 200
  } catch (error) {
    if (error instanceof z.ZodError) {
      return new Response("Invalid request payload", { status: 422 });
    }
    console.error(error);
    //default catch all
    return new Response("Invalid Requests" + error, { status: 400 });
  }
}
