export type Json = string | number | boolean | null | { [key: string]: Json } | Json[];

export interface Database {
  public: {
    Tables: {
      trips: {
        Row: {
          id:            string;
          name:          string;
          departure:     string;
          transport:     string;
          vehicle_profile: string | null;
          destinations:  Json;
          carry_on_only: boolean;
          is_work:       boolean;
          weather:       Json | null;
          packing_reasoning: string | null;
          created_at:    string;
          updated_at:    string;
        };
        Insert: Omit<Database['public']['Tables']['trips']['Row'], 'id' | 'created_at' | 'updated_at' | 'weather' | 'packing_reasoning'> &
          Partial<Pick<Database['public']['Tables']['trips']['Row'], 'weather' | 'packing_reasoning'>>;
        Update: Partial<Database['public']['Tables']['trips']['Insert']>;
      };
      packing_lists: {
        Row: {
          id:                string;
          trip_id:           string;
          category:          string;
          name:              string;
          quantity:          number;
          packed:            boolean;
          is_clothing:       boolean;
          priority:          string;
          notes:             string | null;
          destination_label: string | null;
          created_at:        string;
        };
        Insert: Omit<Database['public']['Tables']['packing_lists']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['packing_lists']['Insert']>;
      };
      travel_items: {
        Row: {
          id:          string;
          name:        string;
          category:    string;
          layer:       string | null;
          warmth:      number | null;
          formality:   number | null;
          color:       string | null;
          tags:        string[];
          is_clothing: boolean;
          image_url:   string | null;
          created_at:  string;
        };
        Insert: Omit<Database['public']['Tables']['travel_items']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['travel_items']['Insert']>;
      };
      packing_rules: {
        Row: {
          id:        string;
          situation: string;
          item_name: string;
          quantity:  number;
          notes:     string | null;
        };
        Insert: Omit<Database['public']['Tables']['packing_rules']['Row'], 'id'>;
        Update: Partial<Database['public']['Tables']['packing_rules']['Insert']>;
      };
    };
  };
}
