"use client";
import { useSelectedUser, useUser } from "@/store/userStore";
import { SendMsIcon, SmileFaceIcon, AttachFileIcon } from "@/utils/icons";
import dynamic from "next/dynamic";
import React, { useState, useRef } from "react";
import { useCookies } from "react-cookie";
import { io } from "socket.io-client";

const Picker = dynamic(() => import("emoji-picker-react"), { ssr: false });

function MessageInp() {
  const [inpValue, setInpValue] = useState<string>("");
  const [showEmojies, setShowEmojies] = useState<boolean>(false);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [uploadStatus, setUploadStatus] = useState<string>("");
  const selectedUser = useSelectedUser((state) => state.selectedUser);
  const myUser = useUser((state) => state.myUser);
  const [cookie] = useCookies(["user"]);
  const socket = io("http://localhost:4000");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inpValue.trim()) {
      socket.emit("private message", selectedUser.email, inpValue, cookie.user);
      setInpValue("");
    }
  };

  const onEmojiClick = (emojiObject: { emoji: string }) => {
    setInpValue((prev) => prev + emojiObject.emoji);
  };

  const handleFileUpload = async (file: File) => {
    if (!file || !selectedUser || !myUser) {
      alert("Please select a user and file.");
      return;
    }

    setIsUploading(true);
    setUploadStatus("");
    const formData = new FormData();
    formData.append("file", file);
    formData.append("sender", myUser.email);
    formData.append("receiver", selectedUser.email);
    formData.append("token", cookie.user);

    try {
      const response = await fetch("http://localhost:4000/api/upload", {
        method: "POST",
        body: formData,
      });
      if (!response.ok) throw new Error("File upload failed");
      setUploadStatus(`File "${file.name}" uploaded successfully!`);
      if (fileInputRef.current) fileInputRef.current.value = "";
      setTimeout(() => setUploadStatus(""), 3000); // Clear status after 3s
    } catch (error) {
      console.error("File upload error:", error);
      setUploadStatus("Failed to upload file.");
      setTimeout(() => setUploadStatus(""), 3000);
    } finally {
      setIsUploading(false);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFileUpload(file);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFileUpload(file);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  return (
    <div
      className={`mt-auto relative ${isDragging ? "bg-gray-200" : ""}`}
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
    >
      <form className="relative" onSubmit={handleSubmit}>
        <div className="w-full relative">
          <input
            type="text"
            placeholder={isUploading ? "Uploading..." : "Message"}
            className="input w-full pl-14 pr-20 input-bordered"
            onChange={(e) => setInpValue(e.target.value)}
            value={inpValue}
            disabled={isUploading}
          />
        </div>
        <button
          type="button"
          onClick={() => setShowEmojies(!showEmojies)}
          className="absolute top-1/2 left-5 -translate-y-1/2"
          disabled={isUploading}
        >
          <SmileFaceIcon />
        </button>
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="absolute top-1/2 right-12 -translate-y-1/2"
          disabled={isUploading}
        >
          <AttachFileIcon />
        </button>
        <input
          type="file"
          ref={fileInputRef}
          className="hidden"
          onChange={handleFileInputChange}
          accept="image/*,application/pdf"
          disabled={isUploading}
        />
        {showEmojies && (
          <div className="absolute bottom-full">
            <Picker onEmojiClick={onEmojiClick} />
          </div>
        )}
        <button
          type="submit"
          className="absolute top-1/2 right-5 -translate-y-1/2"
          disabled={isUploading}
        >
          <SendMsIcon />
        </button>
      </form>
      {isDragging && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-200 bg-opacity-75">
          Drop file here
        </div>
      )}
      {uploadStatus && (
        <div className="mt-2 text-sm text-center text-gray-600">
          {uploadStatus}
        </div>
      )}
    </div>
  );
}

export default MessageInp;