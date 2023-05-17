"use client";

import { pusherClient } from "@/lib/pusher";
import { chatHrefConstructor, toPusherKey } from "@/lib/utils";
import { usePathname, useRouter } from "next/navigation";
import { FC, useEffect, useState } from "react";
import { toast } from "react-hot-toast";
import UnseenChatToast from "./UnseenChatToast";

interface SidebarChatListProps {
  friends: User[];
  sessionId: string;
}

interface ExtendedMessage extends Message {
  senderImg: string;
  senderName: string;
}

const SidebarChatList: FC<SidebarChatListProps> = ({ friends, sessionId }) => {
  //router as we get access to chatid from the url, by doing that we can check if user has seen messages in that chatid
  const router = useRouter();
  const pathName = usePathname();

  //later can also implement functionality to show unseen messages since the last time you were in the app
  //below will only show messages that are unseen while you were online
  const [unseenMessages, setUnseenMessages] = useState<Message[]>([]);

  const [activeChats, setActiveChats] = useState<User[]>(friends);

  //subscribe to chats and friendrequests
  useEffect(() => {
    pusherClient.subscribe(toPusherKey(`user:${sessionId}:chats`));
    pusherClient.subscribe(toPusherKey(`user:${sessionId}:friends`));

    const newFriendHandler = (newFriend: User) => {
      setActiveChats((prev) => [...prev, newFriend]);
    };

    //we only want to listen to one event
    const chatHandler = (message: ExtendedMessage) => {
      const { senderId, senderImg, senderName, text } = message;
      const shouldNotify =
        pathName !==
        `/dashboard/chat/${chatHrefConstructor(sessionId, senderId)}`;

      if (!shouldNotify) return;

      toast.custom((t) => (
        <UnseenChatToast
          t={t}
          sessionId={sessionId}
          senderId={senderId}
          senderImg={senderImg}
          senderMessage={text}
          senderName={senderName}
        />
        // custom component
      ));

      setUnseenMessages((prev) => [...prev, message]);
    };
    pusherClient.bind("new_message", chatHandler);
    pusherClient.bind("new_friend", newFriendHandler);

    return () => {
      pusherClient.unsubscribe(toPusherKey(`user:${sessionId}:chats`));
      pusherClient.unsubscribe(toPusherKey(`user:${sessionId}:friends`));
      pusherClient.unbind("new_message", chatHandler);
      pusherClient.unbind("new_friend", newFriendHandler);
    };
  }, [pathName, sessionId, router]);

  useEffect(() => {
    if (pathName?.includes("chat")) {
      setUnseenMessages((prev) => {
        return prev.filter((message) => !pathName.includes(message.senderId));
      });
    }
  }, [pathName]);

  return (
    <ul role="list" className="max-h-[25rem] overflow-y-auto -mx-2 space-y-1">
      {friends.sort().map((friend) => {
        const unseenMessagesCount = unseenMessages.filter((unseenMessage) => {
          return unseenMessage.senderId === friend.id;
        }).length;

        return (
          <li key={friend.id}>
            {/* use a tag to trigger hard refresh when friend is visited */}
            <a
              className="text-gray-700 hover:text-indigo-700 hover:bg-gray-50 group flex items-center gap-x-3 rounded-md p-2 text-sm leading-6 font-semibold"
              href={`/dashboard/chat/${chatHrefConstructor(
                sessionId,
                friend.id
              )}`}
            >
              {friend.name}
              {unseenMessagesCount > 0 ? (
                <div className="bg-indigo-600 font-medium text-xs text-white w-4 h-4 rounded-full flex justify-center items-center">
                  {unseenMessagesCount}
                </div>
              ) : null}
            </a>
          </li>
        );
      })}
    </ul>
  );
};

export default SidebarChatList;

//5:57
