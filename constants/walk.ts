export type Walk = {
    id: string;
    start_location?: string;
    end_location?: string;
    start_time: string;
    status?: "active" | "upcoming" | "past";
    start_lng: number;  
    start_lat: number;
    end_lng: number;
    end_lat: number;
}