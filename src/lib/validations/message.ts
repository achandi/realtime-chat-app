import { z } from "zod";

//validator one message
export const messageValidator = z.object({
  id: z.string(),
  senderId: z.string(),
  text: z.string(), //can do .max(2000) if we want to limit the length of the message
  timestamp: z.number(),
});

//validator for a list of messages
export const messageArrayValidator = z.array(messageValidator);

//z.infer handy to infer types
export type Message = z.infer<typeof messageValidator>;
