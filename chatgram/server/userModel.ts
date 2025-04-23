// usermodel.ts

export interface User {
  email: string;     // Unique email used as the identifier (primary key)
  name: string;
  imageId: string;
}

// Messages are stored in a separate DynamoDB table: `chatgram_messages`
export interface Message {
    messageId: string;
    conversationId: string;
    timestamp: number;
    message: string;
    sender: string;
    reciver: string;
    time: string;
  }
  