
export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export type Database = {
  
  "graphql_public": {
          Tables: {
            [_ in never]: never
          }
          Views: {
            [_ in never]: never
          }
          Functions: {
            "graphql":
{ Args: { "extensions"?: Json,"operationName"?: string,"query"?: string,"variables"?: Json }; Returns: Json
                           }
          }
          Enums: {
            [_ in never]: never
          }
          CompositeTypes: {
            [_ in never]: never
          }
        },"public": {
          Tables: {
            "badges": {
                  Row: {
                    "art_key": string,"description": string | null,"id": string,"slug": string,"title": string
                  }
                  ComputedFields: never
                  Insert: {
                    "art_key": string,"description"?: string | null,"id"?: string,"slug": string,"title": string
                  }
                  Update: {
                    "art_key"?: string,"description"?: string | null,"id"?: string,"slug"?: string,"title"?: string
                  }
                  Relationships: [
                    
                  ]
                },"checkins": {
                  Row: {
                    "created_at": string,"id": string,"method": Database["public"]['Enums']["checkin_method"],"photo_path": string | null,"spot_id": string,"user_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"id"?: string,"method": Database["public"]['Enums']["checkin_method"],"photo_path"?: string | null,"spot_id": string,"user_id": string
                  }
                  Update: {
                    "created_at"?: string,"id"?: string,"method"?: Database["public"]['Enums']["checkin_method"],"photo_path"?: string | null,"spot_id"?: string,"user_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "checkins_spot_id_fkey"
      columns: ["spot_id"]
isOneToOne: false
      referencedRelation: "spots"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "checkins_user_id_fkey"
      columns: ["user_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"client_errors": {
                  Row: {
                    "app_version": string | null,"created_at": string,"fatal": boolean,"id": string,"message": string,"occurred_at": string,"platform": string | null,"runtime_version": string | null,"screen": string | null,"stack": string | null,"update_id": string | null,"user_id": string | null
                  }
                  ComputedFields: never
                  Insert: {
                    "app_version"?: string | null,"created_at"?: string,"fatal"?: boolean,"id"?: string,"message": string,"occurred_at"?: string,"platform"?: string | null,"runtime_version"?: string | null,"screen"?: string | null,"stack"?: string | null,"update_id"?: string | null,"user_id"?: string | null
                  }
                  Update: {
                    "app_version"?: string | null,"created_at"?: string,"fatal"?: boolean,"id"?: string,"message"?: string,"occurred_at"?: string,"platform"?: string | null,"runtime_version"?: string | null,"screen"?: string | null,"stack"?: string | null,"update_id"?: string | null,"user_id"?: string | null
                  }
                  Relationships: [
                    
                  ]
                },"friendships": {
                  Row: {
                    "addressee": string,"created_at": string,"requester": string,"status": Database["public"]['Enums']["friendship_status"]
                  }
                  ComputedFields: never
                  Insert: {
                    "addressee": string,"created_at"?: string,"requester": string,"status"?: Database["public"]['Enums']["friendship_status"]
                  }
                  Update: {
                    "addressee"?: string,"created_at"?: string,"requester"?: string,"status"?: Database["public"]['Enums']["friendship_status"]
                  }
                  Relationships: [
                    {
      foreignKeyName: "friendships_addressee_fkey"
      columns: ["addressee"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "friendships_requester_fkey"
      columns: ["requester"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"lands": {
                  Row: {
                    "id": string,"name": string,"park_id": string,"sort_order": number
                  }
                  ComputedFields: never
                  Insert: {
                    "id": string,"name": string,"park_id": string,"sort_order"?: number
                  }
                  Update: {
                    "id"?: string,"name"?: string,"park_id"?: string,"sort_order"?: number
                  }
                  Relationships: [
                    {
      foreignKeyName: "lands_park_id_fkey"
      columns: ["park_id"]
isOneToOne: false
      referencedRelation: "parks"
      referencedColumns: ["id"]
    }
                  ]
                },"parks": {
                  Row: {
                    "id": string,"name": string,"resort": string
                  }
                  ComputedFields: never
                  Insert: {
                    "id": string,"name": string,"resort": string
                  }
                  Update: {
                    "id"?: string,"name"?: string,"resort"?: string
                  }
                  Relationships: [
                    
                  ]
                },"profiles": {
                  Row: {
                    "age_confirmed_13": boolean,"avatar_key": string | null,"avatar_url": string | null,"created_at": string,"display_name": string | null,"id": string,"suspended_at": string | null,"terms_accepted_at": string | null,"username": string
                  }
                  ComputedFields: never
                  Insert: {
                    "age_confirmed_13"?: boolean,"avatar_key"?: string | null,"avatar_url"?: string | null,"created_at"?: string,"display_name"?: string | null,"id": string,"suspended_at"?: string | null,"terms_accepted_at"?: string | null,"username": string
                  }
                  Update: {
                    "age_confirmed_13"?: boolean,"avatar_key"?: string | null,"avatar_url"?: string | null,"created_at"?: string,"display_name"?: string | null,"id"?: string,"suspended_at"?: string | null,"terms_accepted_at"?: string | null,"username"?: string
                  }
                  Relationships: [
                    
                  ]
                },"quests": {
                  Row: {
                    "badge_id": string | null,"cover_photo_path": string | null,"created_at": string,"est_minutes": number,"id": string,"is_premium": boolean,"land_id": string,"season": string | null,"slug": string,"sort_order": number,"status": Database["public"]['Enums']["quest_status"],"story": string | null,"title": string
                  }
                  ComputedFields: never
                  Insert: {
                    "badge_id"?: string | null,"cover_photo_path"?: string | null,"created_at"?: string,"est_minutes"?: number,"id"?: string,"is_premium"?: boolean,"land_id": string,"season"?: string | null,"slug": string,"sort_order"?: number,"status"?: Database["public"]['Enums']["quest_status"],"story"?: string | null,"title": string
                  }
                  Update: {
                    "badge_id"?: string | null,"cover_photo_path"?: string | null,"created_at"?: string,"est_minutes"?: number,"id"?: string,"is_premium"?: boolean,"land_id"?: string,"season"?: string | null,"slug"?: string,"sort_order"?: number,"status"?: Database["public"]['Enums']["quest_status"],"story"?: string | null,"title"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "quests_badge_id_fkey"
      columns: ["badge_id"]
isOneToOne: false
      referencedRelation: "badges"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "quests_land_id_fkey"
      columns: ["land_id"]
isOneToOne: false
      referencedRelation: "lands"
      referencedColumns: ["id"]
    }
                  ]
                },"spot_reports": {
                  Row: {
                    "created_at": string,"id": string,"note": string | null,"reason": Database["public"]['Enums']["report_reason"],"spot_id": string,"user_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"id"?: string,"note"?: string | null,"reason": Database["public"]['Enums']["report_reason"],"spot_id": string,"user_id"?: string
                  }
                  Update: {
                    "created_at"?: string,"id"?: string,"note"?: string | null,"reason"?: Database["public"]['Enums']["report_reason"],"spot_id"?: string,"user_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "spot_reports_spot_id_fkey"
      columns: ["spot_id"]
isOneToOne: false
      referencedRelation: "spots"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "spot_reports_user_id_fkey"
      columns: ["user_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"spots": {
                  Row: {
                    "clue": string,"created_at": string,"hint": string | null,"holiday_note": string | null,"id": string,"lat": number | null,"lng": number | null,"method": Database["public"]['Enums']["checkin_method"],"pause_during_parades": boolean,"photo_path": string | null,"prompt": string,"quest_id": string,"radius_m": number,"sort_order": number,"source_url": string | null,"teaser": string,"title": string,"verified_on_site": boolean,"where_to_stand": string
                  }
                  ComputedFields: never
                  Insert: {
                    "clue": string,"created_at"?: string,"hint"?: string | null,"holiday_note"?: string | null,"id"?: string,"lat"?: number | null,"lng"?: number | null,"method": Database["public"]['Enums']["checkin_method"],"pause_during_parades"?: boolean,"photo_path"?: string | null,"prompt": string,"quest_id": string,"radius_m"?: number,"sort_order": number,"source_url"?: string | null,"teaser": string,"title": string,"verified_on_site"?: boolean,"where_to_stand": string
                  }
                  Update: {
                    "clue"?: string,"created_at"?: string,"hint"?: string | null,"holiday_note"?: string | null,"id"?: string,"lat"?: number | null,"lng"?: number | null,"method"?: Database["public"]['Enums']["checkin_method"],"pause_during_parades"?: boolean,"photo_path"?: string | null,"prompt"?: string,"quest_id"?: string,"radius_m"?: number,"sort_order"?: number,"source_url"?: string | null,"teaser"?: string,"title"?: string,"verified_on_site"?: boolean,"where_to_stand"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "spots_quest_id_fkey"
      columns: ["quest_id"]
isOneToOne: false
      referencedRelation: "quests"
      referencedColumns: ["id"]
    }
                  ]
                },"user_badges": {
                  Row: {
                    "badge_id": string,"earned_at": string,"user_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "badge_id": string,"earned_at"?: string,"user_id": string
                  }
                  Update: {
                    "badge_id"?: string,"earned_at"?: string,"user_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "user_badges_badge_id_fkey"
      columns: ["badge_id"]
isOneToOne: false
      referencedRelation: "badges"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "user_badges_user_id_fkey"
      columns: ["user_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"user_blocks": {
                  Row: {
                    "blocked": string,"blocker": string,"created_at": string
                  }
                  ComputedFields: never
                  Insert: {
                    "blocked": string,"blocker": string,"created_at"?: string
                  }
                  Update: {
                    "blocked"?: string,"blocker"?: string,"created_at"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "user_blocks_blocked_fkey"
      columns: ["blocked"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "user_blocks_blocker_fkey"
      columns: ["blocker"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"user_reports": {
                  Row: {
                    "action": string | null,"created_at": string,"id": string,"note": string | null,"reason": Database["public"]['Enums']["user_report_reason"],"reported": string,"reporter": string,"resolved_at": string | null,"resolved_by": string | null,"status": Database["public"]['Enums']["report_status"]
                  }
                  ComputedFields: never
                  Insert: {
                    "action"?: string | null,"created_at"?: string,"id"?: string,"note"?: string | null,"reason": Database["public"]['Enums']["user_report_reason"],"reported": string,"reporter"?: string,"resolved_at"?: string | null,"resolved_by"?: string | null,"status"?: Database["public"]['Enums']["report_status"]
                  }
                  Update: {
                    "action"?: string | null,"created_at"?: string,"id"?: string,"note"?: string | null,"reason"?: Database["public"]['Enums']["user_report_reason"],"reported"?: string,"reporter"?: string,"resolved_at"?: string | null,"resolved_by"?: string | null,"status"?: Database["public"]['Enums']["report_status"]
                  }
                  Relationships: [
                    {
      foreignKeyName: "user_reports_reported_fkey"
      columns: ["reported"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "user_reports_reporter_fkey"
      columns: ["reporter"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                }
          }
          Views: {
            [_ in never]: never
          }
          Functions: {
            "admin_metrics":
{ Args: Record<PropertyKey, never>; Returns: Json
                           },
"admin_recent_errors":
{ Args: { "p_days"?: number }; Returns: {
              "app_version": string,"fatal": boolean,"last_seen": string,"message": string,"occurrences": number,"platform": string,"screen": string,"stack": string,"update_id": string,"users": number
            }[]
                           },
"admin_resolve_report":
{ Args: { "p_action": string,"p_report_id": string }; Returns: string
                           },
"admin_set_quest_cover":
{ Args: { "p_photo_path": string,"p_quest_id": string }; Returns: undefined
                           },
"admin_update_spot":
{ Args: { "p_lat"?: number,"p_lng"?: number,"p_photo_path"?: string,"p_spot_id": string,"p_verified"?: boolean }; Returns: undefined
                           },
"am_i_admin":
{ Args: Record<PropertyKey, never>; Returns: boolean
                           },
"block_user":
{ Args: { "p_user_id": string }; Returns: undefined
                           },
"check_in":
{ Args: { "p_answer"?: string,"p_found_at"?: string,"p_lat"?: number,"p_lng"?: number,"p_parade_mode"?: boolean,"p_photo_path"?: string,"p_spot_id": string }; Returns: Json
                           },
"delete_my_account":
{ Args: Record<PropertyKey, never>; Returns: undefined
                           },
"friends_leaderboard":
{ Args: Record<PropertyKey, never>; Returns: {
              "avatar_key": string,"avatar_url": string,"badges": number,"is_me": boolean,"spots_found": number,"user_id": string,"username": string
            }[]
                           },
"username_available":
{ Args: { "p_username": string }; Returns: boolean
                           }
          }
          Enums: {
            "checkin_method": "answer"|"photo"|"listen"|"snack","friendship_status": "pending"|"accepted","quest_status": "draft"|"live"|"retired","report_reason": "spot_changed"|"unsafe"|"answer_wrong"|"other","report_status": "open"|"actioned"|"dismissed","user_report_reason": "inappropriate_photo"|"offensive_name"|"harassment"|"spam"|"other"
          }
          CompositeTypes: {
            [_ in never]: never
          }
        }
}

type DatabaseWithoutInternals = Omit<Database, '__InternalSupabase'>

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
  ? (DefaultSchema["Tables"] & DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
      Row: infer R
    }
    ? R
    : never
  : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
  ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
      Insert: infer I
    }
    ? I
    : never
  : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
  ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
      Update: infer U
    }
    ? U
    : never
  : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
  ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
  : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never
> = PublicCompositeTypeNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
  ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
  : never

export const Constants = {
  "graphql_public": {
          Enums: {
            
          }
        },"public": {
          Enums: {
            "checkin_method": ["answer", "photo", "listen", "snack"],"friendship_status": ["pending", "accepted"],"quest_status": ["draft", "live", "retired"],"report_reason": ["spot_changed", "unsafe", "answer_wrong", "other"],"report_status": ["open", "actioned", "dismissed"],"user_report_reason": ["inappropriate_photo", "offensive_name", "harassment", "spam", "other"]
          }
        }
} as const
