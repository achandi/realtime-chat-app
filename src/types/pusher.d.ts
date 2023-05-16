//used for realtime communication

interface IncomingFriendRequest {
  senderId: string;
  senderEmail: string | null | undefined;
}
