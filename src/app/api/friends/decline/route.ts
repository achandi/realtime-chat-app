import { fetchRedis } from "@/helpers/redis";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { getServerSession } from "next-auth";
import { z } from "zod";

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const session = await getServerSession(authOptions);
    if (!session) {
      return new Response("Unauthorized", { status: 401 });
    }

    const { id: idToDecline } = z.object({ id: z.string() }).parse(body);
    await db.srem(
      `user:${session.user.id}:incoming_friend_requests`,
      idToDecline
    );

    return new Response("OK");
  } catch (error) {
    console.log(error);
    if (error instanceof z.ZodError) {
      return new Response("Invalid request payload", { status: 422 }); //422 is unprocessable entity
    }
    return new Response("Invalid request", { status: 400 }); //400 is bad request
  }
}
