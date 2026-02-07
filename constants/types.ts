export type Walk = {
    id: string;
    user_id: string;
    start_location?: string;
    end_location?: string;
    start_time: string;
    status?: "active" | "upcoming" | "past";
    start_lng: number;  
    start_lat: number;
    end_lng: number;
    end_lat: number;
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