export type Walk = {
    id: string;
    created_at: string; 
    user_id: string;
    start_location?: string;
    end_location?: string;
    start_time: string;
    status?: "active" | "upcoming" | "past" | "cancelled";
    walk_type?: "public" | "private";
    max_walkers?: number;
    start_lng: number;  
    start_lat: number;
    end_lng: number;
    end_lat: number;
    route?: any;
}

export type Profile = {
    id: string;
    user_name?: string;
    avatar?: string;
    created_at: string;
    verified: boolean;
    total_walks?: number;
    rating?: number;
    connections?: number;
}

export type WalkRequest = {
    id: string;
    walk_id: string;
    requester_id: string;
    owner_id: string;
    status: "pending" | "accepted" | "declined" | "cancelled";
    created_at: string;
    walk?: Pick<Walk, "start_location" | "end_location" | "start_time" | "walk_type">;
    requester?: Pick<Profile, "user_name" | "avatar">;
}