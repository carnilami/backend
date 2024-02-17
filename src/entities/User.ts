export default interface User {
    _id: string;
    accessToken: string;
    refreshToken: string;
    email: string;
    name: string;
    bio: string;
    tokens: number;
    profilePicture: string;
    createdAt: number;
    notifications: Notifications;
}

export interface Notifications {
    sellerNewBid: boolean;
    sellerNewComment: boolean;
}