"use client"
import { useSelectedUser, useUser } from '@/store/userStore';
import { PhoneIcon } from '@/utils/icons'
import { useRouter } from 'next/navigation'
import React from 'react';
import { useCookies } from 'react-cookie';
import { io } from "socket.io-client";

function CallBtn() {
  const router = useRouter();
  const socket = io(`${process.env.NEXT_PUBLIC_API_URL}`);
  const [cookie] = useCookies(["user"]);
  const selectedUser = useSelectedUser((state) => state.selectedUser);
  const myUser = useUser((state) => state.myUser);

  function handleClick() {
    socket.emit(
      "private message",
      selectedUser.email,
      "📞" + myUser.name + " is calling " + selectedUser.name + "📞",
      cookie.user
    )
    router.push("/chat/room");
  }


  return (
      <button onClick={handleClick}>
          <PhoneIcon/>
    </button>
  )
}

export default CallBtn