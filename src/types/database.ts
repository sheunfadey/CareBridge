export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.18"
  }
  public: {
    Tables: {
      audit_logs: {
        Row: {
          action: string
          actor_id: string | null
          created_at: string
          entity_id: string | null
          entity_type: string
          id: string
          metadata: Json
          organisation_id: string | null
        }
        Insert: {
          action: string
          actor_id?: string | null
          created_at?: string
          entity_id?: string | null
          entity_type: string
          id?: string
          metadata?: Json
          organisation_id?: string | null
        }
        Update: {
          action?: string
          actor_id?: string | null
          created_at?: string
          entity_id?: string | null
          entity_type?: string
          id?: string
          metadata?: Json
          organisation_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "audit_logs_actor_id_fkey"
            columns: ["actor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "audit_logs_organisation_id_fkey"
            columns: ["organisation_id"]
            isOneToOne: false
            referencedRelation: "organisations"
            referencedColumns: ["id"]
          },
        ]
      }
      certificates: {
        Row: {
          certificate_number: string
          completion_record_id: string
          course_id: string
          course_title: string
          created_at: string
          credential_scope: string
          disclaimer: string
          id: string
          issued_at: string
          issuer_name: string
          learner_name: string
          revoked_at: string | null
          revoked_reason: string | null
          user_id: string
          verification_code: string
        }
        Insert: {
          certificate_number: string
          completion_record_id: string
          course_id: string
          course_title: string
          created_at?: string
          credential_scope: string
          disclaimer: string
          id?: string
          issued_at?: string
          issuer_name: string
          learner_name: string
          revoked_at?: string | null
          revoked_reason?: string | null
          user_id: string
          verification_code: string
        }
        Update: {
          certificate_number?: string
          completion_record_id?: string
          course_id?: string
          course_title?: string
          created_at?: string
          credential_scope?: string
          disclaimer?: string
          id?: string
          issued_at?: string
          issuer_name?: string
          learner_name?: string
          revoked_at?: string | null
          revoked_reason?: string | null
          user_id?: string
          verification_code?: string
        }
        Relationships: [
          {
            foreignKeyName: "certificates_completion_record_id_fkey"
            columns: ["completion_record_id"]
            isOneToOne: true
            referencedRelation: "completion_records"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "certificates_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "certificates_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      completion_records: {
        Row: {
          completed_at: string
          course_id: string
          course_version: number
          criteria_snapshot: Json
          enrolment_id: string
          id: string
          user_id: string
        }
        Insert: {
          completed_at?: string
          course_id: string
          course_version: number
          criteria_snapshot?: Json
          enrolment_id: string
          id?: string
          user_id: string
        }
        Update: {
          completed_at?: string
          course_id?: string
          course_version?: number
          criteria_snapshot?: Json
          enrolment_id?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "completion_records_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "completion_records_enrolment_id_fkey"
            columns: ["enrolment_id"]
            isOneToOne: true
            referencedRelation: "course_enrolments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "completion_records_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      course_enrolments: {
        Row: {
          completed_at: string | null
          course_id: string
          created_at: string
          enrolled_at: string
          id: string
          organisation_id: string | null
          source: string
          status: Database["public"]["Enums"]["enrolment_status"]
          updated_at: string
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          course_id: string
          created_at?: string
          enrolled_at?: string
          id?: string
          organisation_id?: string | null
          source?: string
          status?: Database["public"]["Enums"]["enrolment_status"]
          updated_at?: string
          user_id: string
        }
        Update: {
          completed_at?: string | null
          course_id?: string
          created_at?: string
          enrolled_at?: string
          id?: string
          organisation_id?: string | null
          source?: string
          status?: Database["public"]["Enums"]["enrolment_status"]
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "course_enrolments_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "course_enrolments_organisation_id_fkey"
            columns: ["organisation_id"]
            isOneToOne: false
            referencedRelation: "organisations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "course_enrolments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      course_modules: {
        Row: {
          course_id: string
          created_at: string
          id: string
          is_required: boolean
          position: number
          summary: string | null
          title: string
          updated_at: string
        }
        Insert: {
          course_id: string
          created_at?: string
          id?: string
          is_required?: boolean
          position?: number
          summary?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          course_id?: string
          created_at?: string
          id?: string
          is_required?: boolean
          position?: number
          summary?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "course_modules_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
        ]
      }
      courses: {
        Row: {
          category: string | null
          certificate_enabled: boolean
          certificate_issuer: string
          completion_criteria: Json
          cover_image_url: string | null
          created_at: string
          created_by: string | null
          currency: string
          description: string | null
          difficulty: Database["public"]["Enums"]["course_difficulty"]
          enrolment_limit: number | null
          estimated_minutes: number
          id: string
          instructor_id: string | null
          is_public: boolean
          learning_outcomes: string[]
          organisation_id: string | null
          prerequisites: string[]
          price_minor_units: number
          programme_id: string
          published_at: string | null
          scholarship_eligible: boolean
          slug: string
          status: Database["public"]["Enums"]["course_status"]
          summary: string | null
          title: string
          updated_at: string
          version: number
        }
        Insert: {
          category?: string | null
          certificate_enabled?: boolean
          certificate_issuer?: string
          completion_criteria?: Json
          cover_image_url?: string | null
          created_at?: string
          created_by?: string | null
          currency?: string
          description?: string | null
          difficulty?: Database["public"]["Enums"]["course_difficulty"]
          enrolment_limit?: number | null
          estimated_minutes?: number
          id?: string
          instructor_id?: string | null
          is_public?: boolean
          learning_outcomes?: string[]
          organisation_id?: string | null
          prerequisites?: string[]
          price_minor_units?: number
          programme_id: string
          published_at?: string | null
          scholarship_eligible?: boolean
          slug: string
          status?: Database["public"]["Enums"]["course_status"]
          summary?: string | null
          title: string
          updated_at?: string
          version?: number
        }
        Update: {
          category?: string | null
          certificate_enabled?: boolean
          certificate_issuer?: string
          completion_criteria?: Json
          cover_image_url?: string | null
          created_at?: string
          created_by?: string | null
          currency?: string
          description?: string | null
          difficulty?: Database["public"]["Enums"]["course_difficulty"]
          enrolment_limit?: number | null
          estimated_minutes?: number
          id?: string
          instructor_id?: string | null
          is_public?: boolean
          learning_outcomes?: string[]
          organisation_id?: string | null
          prerequisites?: string[]
          price_minor_units?: number
          programme_id?: string
          published_at?: string | null
          scholarship_eligible?: boolean
          slug?: string
          status?: Database["public"]["Enums"]["course_status"]
          summary?: string | null
          title?: string
          updated_at?: string
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "courses_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "courses_instructor_id_fkey"
            columns: ["instructor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "courses_organisation_id_fkey"
            columns: ["organisation_id"]
            isOneToOne: false
            referencedRelation: "organisations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "courses_programme_id_fkey"
            columns: ["programme_id"]
            isOneToOne: false
            referencedRelation: "programmes"
            referencedColumns: ["id"]
          },
        ]
      }
      internship_applications: {
        Row: {
          applicant_id: string
          cover_note: string | null
          created_at: string
          decided_at: string | null
          decided_by: string | null
          id: string
          listing_id: string
          status: Database["public"]["Enums"]["internship_application_status"]
          submitted_at: string
          updated_at: string
        }
        Insert: {
          applicant_id: string
          cover_note?: string | null
          created_at?: string
          decided_at?: string | null
          decided_by?: string | null
          id?: string
          listing_id: string
          status?: Database["public"]["Enums"]["internship_application_status"]
          submitted_at?: string
          updated_at?: string
        }
        Update: {
          applicant_id?: string
          cover_note?: string | null
          created_at?: string
          decided_at?: string | null
          decided_by?: string | null
          id?: string
          listing_id?: string
          status?: Database["public"]["Enums"]["internship_application_status"]
          submitted_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "internship_applications_applicant_id_fkey"
            columns: ["applicant_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "internship_applications_decided_by_fkey"
            columns: ["decided_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "internship_applications_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "internship_listings"
            referencedColumns: ["id"]
          },
        ]
      }
      internship_attendance: {
        Row: {
          attendance_date: string
          created_at: string
          hours: number
          id: string
          notes: string | null
          placement_id: string
          recorded_by: string | null
          status: Database["public"]["Enums"]["attendance_status"]
          updated_at: string
        }
        Insert: {
          attendance_date: string
          created_at?: string
          hours?: number
          id?: string
          notes?: string | null
          placement_id: string
          recorded_by?: string | null
          status?: Database["public"]["Enums"]["attendance_status"]
          updated_at?: string
        }
        Update: {
          attendance_date?: string
          created_at?: string
          hours?: number
          id?: string
          notes?: string | null
          placement_id?: string
          recorded_by?: string | null
          status?: Database["public"]["Enums"]["attendance_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "internship_attendance_placement_id_fkey"
            columns: ["placement_id"]
            isOneToOne: false
            referencedRelation: "internship_placements"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "internship_attendance_recorded_by_fkey"
            columns: ["recorded_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      internship_completion_records: {
        Row: {
          candidate_id: string
          certificate_code: string
          created_at: string
          hours_completed: number
          id: string
          issued_at: string
          issued_by: string | null
          organisation_id: string
          outcome: string
          placement_id: string
          summary: string | null
        }
        Insert: {
          candidate_id: string
          certificate_code: string
          created_at?: string
          hours_completed?: number
          id?: string
          issued_at?: string
          issued_by?: string | null
          organisation_id: string
          outcome?: string
          placement_id: string
          summary?: string | null
        }
        Update: {
          candidate_id?: string
          certificate_code?: string
          created_at?: string
          hours_completed?: number
          id?: string
          issued_at?: string
          issued_by?: string | null
          organisation_id?: string
          outcome?: string
          placement_id?: string
          summary?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "internship_completion_records_candidate_id_fkey"
            columns: ["candidate_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "internship_completion_records_issued_by_fkey"
            columns: ["issued_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "internship_completion_records_organisation_id_fkey"
            columns: ["organisation_id"]
            isOneToOne: false
            referencedRelation: "organisations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "internship_completion_records_placement_id_fkey"
            columns: ["placement_id"]
            isOneToOne: true
            referencedRelation: "internship_placements"
            referencedColumns: ["id"]
          },
        ]
      }
      internship_evaluations: {
        Row: {
          areas_for_improvement: string | null
          care_practice_rating: number | null
          communication_rating: number | null
          created_at: string
          evaluation_date: string
          evaluator_id: string
          id: string
          overall_rating: number
          placement_id: string
          professionalism_rating: number | null
          recommendation: Database["public"]["Enums"]["evaluation_recommendation"]
          safeguarding_rating: number | null
          status: Database["public"]["Enums"]["evaluation_status"]
          strengths: string | null
          updated_at: string
        }
        Insert: {
          areas_for_improvement?: string | null
          care_practice_rating?: number | null
          communication_rating?: number | null
          created_at?: string
          evaluation_date?: string
          evaluator_id: string
          id?: string
          overall_rating: number
          placement_id: string
          professionalism_rating?: number | null
          recommendation: Database["public"]["Enums"]["evaluation_recommendation"]
          safeguarding_rating?: number | null
          status?: Database["public"]["Enums"]["evaluation_status"]
          strengths?: string | null
          updated_at?: string
        }
        Update: {
          areas_for_improvement?: string | null
          care_practice_rating?: number | null
          communication_rating?: number | null
          created_at?: string
          evaluation_date?: string
          evaluator_id?: string
          id?: string
          overall_rating?: number
          placement_id?: string
          professionalism_rating?: number | null
          recommendation?: Database["public"]["Enums"]["evaluation_recommendation"]
          safeguarding_rating?: number | null
          status?: Database["public"]["Enums"]["evaluation_status"]
          strengths?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "internship_evaluations_evaluator_id_fkey"
            columns: ["evaluator_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "internship_evaluations_placement_id_fkey"
            columns: ["placement_id"]
            isOneToOne: false
            referencedRelation: "internship_placements"
            referencedColumns: ["id"]
          },
        ]
      }
      internship_incidents: {
        Row: {
          category: string
          created_at: string
          description: string
          id: string
          occurred_at: string
          placement_id: string
          reported_by: string
          resolution: string | null
          resolved_at: string | null
          resolved_by: string | null
          severity: Database["public"]["Enums"]["incident_severity"]
          status: Database["public"]["Enums"]["incident_status"]
          updated_at: string
        }
        Insert: {
          category: string
          created_at?: string
          description: string
          id?: string
          occurred_at?: string
          placement_id: string
          reported_by: string
          resolution?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          severity?: Database["public"]["Enums"]["incident_severity"]
          status?: Database["public"]["Enums"]["incident_status"]
          updated_at?: string
        }
        Update: {
          category?: string
          created_at?: string
          description?: string
          id?: string
          occurred_at?: string
          placement_id?: string
          reported_by?: string
          resolution?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          severity?: Database["public"]["Enums"]["incident_severity"]
          status?: Database["public"]["Enums"]["incident_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "internship_incidents_placement_id_fkey"
            columns: ["placement_id"]
            isOneToOne: false
            referencedRelation: "internship_placements"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "internship_incidents_reported_by_fkey"
            columns: ["reported_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "internship_incidents_resolved_by_fkey"
            columns: ["resolved_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      internship_listings: {
        Row: {
          application_deadline: string | null
          city: string | null
          created_at: string
          created_by: string | null
          description: string | null
          end_date: string | null
          expected_hours: number | null
          id: string
          learning_objectives: string[]
          location: string | null
          organisation_id: string
          published_at: string | null
          requirements: string[]
          slots: number
          slug: string
          start_date: string | null
          state: string | null
          status: Database["public"]["Enums"]["internship_listing_status"]
          summary: string | null
          title: string
          updated_at: string
        }
        Insert: {
          application_deadline?: string | null
          city?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          end_date?: string | null
          expected_hours?: number | null
          id?: string
          learning_objectives?: string[]
          location?: string | null
          organisation_id: string
          published_at?: string | null
          requirements?: string[]
          slots?: number
          slug: string
          start_date?: string | null
          state?: string | null
          status?: Database["public"]["Enums"]["internship_listing_status"]
          summary?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          application_deadline?: string | null
          city?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          end_date?: string | null
          expected_hours?: number | null
          id?: string
          learning_objectives?: string[]
          location?: string | null
          organisation_id?: string
          published_at?: string | null
          requirements?: string[]
          slots?: number
          slug?: string
          start_date?: string | null
          state?: string | null
          status?: Database["public"]["Enums"]["internship_listing_status"]
          summary?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "internship_listings_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "internship_listings_organisation_id_fkey"
            columns: ["organisation_id"]
            isOneToOne: false
            referencedRelation: "organisations"
            referencedColumns: ["id"]
          },
        ]
      }
      internship_logs: {
        Row: {
          author_id: string
          challenges: string | null
          created_at: string
          hours: number
          id: string
          next_steps: string | null
          placement_id: string
          reviewed_at: string | null
          reviewed_by: string | null
          status: Database["public"]["Enums"]["internship_log_status"]
          summary: string
          supervisor_feedback: string | null
          updated_at: string
          week_end: string
          week_start: string
        }
        Insert: {
          author_id: string
          challenges?: string | null
          created_at?: string
          hours?: number
          id?: string
          next_steps?: string | null
          placement_id: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: Database["public"]["Enums"]["internship_log_status"]
          summary: string
          supervisor_feedback?: string | null
          updated_at?: string
          week_end: string
          week_start: string
        }
        Update: {
          author_id?: string
          challenges?: string | null
          created_at?: string
          hours?: number
          id?: string
          next_steps?: string | null
          placement_id?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: Database["public"]["Enums"]["internship_log_status"]
          summary?: string
          supervisor_feedback?: string | null
          updated_at?: string
          week_end?: string
          week_start?: string
        }
        Relationships: [
          {
            foreignKeyName: "internship_logs_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "internship_logs_placement_id_fkey"
            columns: ["placement_id"]
            isOneToOne: false
            referencedRelation: "internship_placements"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "internship_logs_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      internship_offers: {
        Row: {
          application_id: string
          created_at: string
          end_date: string | null
          expected_hours: number | null
          expires_at: string | null
          id: string
          location: string | null
          notes: string | null
          offered_by: string | null
          responded_at: string | null
          start_date: string | null
          status: Database["public"]["Enums"]["offer_status"]
          updated_at: string
        }
        Insert: {
          application_id: string
          created_at?: string
          end_date?: string | null
          expected_hours?: number | null
          expires_at?: string | null
          id?: string
          location?: string | null
          notes?: string | null
          offered_by?: string | null
          responded_at?: string | null
          start_date?: string | null
          status?: Database["public"]["Enums"]["offer_status"]
          updated_at?: string
        }
        Update: {
          application_id?: string
          created_at?: string
          end_date?: string | null
          expected_hours?: number | null
          expires_at?: string | null
          id?: string
          location?: string | null
          notes?: string | null
          offered_by?: string | null
          responded_at?: string | null
          start_date?: string | null
          status?: Database["public"]["Enums"]["offer_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "internship_offers_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: true
            referencedRelation: "internship_applications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "internship_offers_offered_by_fkey"
            columns: ["offered_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      internship_placements: {
        Row: {
          agreement_status: Database["public"]["Enums"]["placement_agreement_status"]
          application_id: string
          candidate_id: string
          city: string | null
          completed_at: string | null
          completion_summary: string | null
          created_at: string
          created_by: string | null
          end_date: string
          expected_hours: number | null
          id: string
          insurance_cleared: boolean
          learning_objectives: string[]
          listing_id: string
          location: string | null
          organisation_id: string
          safeguarding_cleared: boolean
          start_date: string
          started_at: string | null
          state: string | null
          status: Database["public"]["Enums"]["placement_status"]
          supervision_arrangements: string | null
          supervisor_id: string | null
          updated_at: string
        }
        Insert: {
          agreement_status?: Database["public"]["Enums"]["placement_agreement_status"]
          application_id: string
          candidate_id: string
          city?: string | null
          completed_at?: string | null
          completion_summary?: string | null
          created_at?: string
          created_by?: string | null
          end_date: string
          expected_hours?: number | null
          id?: string
          insurance_cleared?: boolean
          learning_objectives?: string[]
          listing_id: string
          location?: string | null
          organisation_id: string
          safeguarding_cleared?: boolean
          start_date: string
          started_at?: string | null
          state?: string | null
          status?: Database["public"]["Enums"]["placement_status"]
          supervision_arrangements?: string | null
          supervisor_id?: string | null
          updated_at?: string
        }
        Update: {
          agreement_status?: Database["public"]["Enums"]["placement_agreement_status"]
          application_id?: string
          candidate_id?: string
          city?: string | null
          completed_at?: string | null
          completion_summary?: string | null
          created_at?: string
          created_by?: string | null
          end_date?: string
          expected_hours?: number | null
          id?: string
          insurance_cleared?: boolean
          learning_objectives?: string[]
          listing_id?: string
          location?: string | null
          organisation_id?: string
          safeguarding_cleared?: boolean
          start_date?: string
          started_at?: string | null
          state?: string | null
          status?: Database["public"]["Enums"]["placement_status"]
          supervision_arrangements?: string | null
          supervisor_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "internship_placements_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: true
            referencedRelation: "internship_applications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "internship_placements_candidate_id_fkey"
            columns: ["candidate_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "internship_placements_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "internship_placements_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "internship_listings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "internship_placements_organisation_id_fkey"
            columns: ["organisation_id"]
            isOneToOne: false
            referencedRelation: "organisations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "internship_placements_supervisor_id_fkey"
            columns: ["supervisor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      interviews: {
        Row: {
          completed_at: string | null
          created_at: string
          duration_minutes: number
          feedback: string | null
          id: string
          internship_application_id: string | null
          job_application_id: string | null
          location: string | null
          meeting_link: string | null
          mode: Database["public"]["Enums"]["interview_mode"]
          rating: number | null
          scheduled_at: string
          scheduled_by: string | null
          status: Database["public"]["Enums"]["interview_status"]
          updated_at: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          duration_minutes?: number
          feedback?: string | null
          id?: string
          internship_application_id?: string | null
          job_application_id?: string | null
          location?: string | null
          meeting_link?: string | null
          mode?: Database["public"]["Enums"]["interview_mode"]
          rating?: number | null
          scheduled_at: string
          scheduled_by?: string | null
          status?: Database["public"]["Enums"]["interview_status"]
          updated_at?: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          duration_minutes?: number
          feedback?: string | null
          id?: string
          internship_application_id?: string | null
          job_application_id?: string | null
          location?: string | null
          meeting_link?: string | null
          mode?: Database["public"]["Enums"]["interview_mode"]
          rating?: number | null
          scheduled_at?: string
          scheduled_by?: string | null
          status?: Database["public"]["Enums"]["interview_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "interviews_internship_application_id_fkey"
            columns: ["internship_application_id"]
            isOneToOne: false
            referencedRelation: "internship_applications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "interviews_job_application_id_fkey"
            columns: ["job_application_id"]
            isOneToOne: false
            referencedRelation: "job_applications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "interviews_scheduled_by_fkey"
            columns: ["scheduled_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      job_applications: {
        Row: {
          applicant_id: string
          cover_letter: string | null
          created_at: string
          decided_at: string | null
          decided_by: string | null
          id: string
          job_id: string
          status: Database["public"]["Enums"]["application_status"]
          submitted_at: string
          updated_at: string
        }
        Insert: {
          applicant_id: string
          cover_letter?: string | null
          created_at?: string
          decided_at?: string | null
          decided_by?: string | null
          id?: string
          job_id: string
          status?: Database["public"]["Enums"]["application_status"]
          submitted_at?: string
          updated_at?: string
        }
        Update: {
          applicant_id?: string
          cover_letter?: string | null
          created_at?: string
          decided_at?: string | null
          decided_by?: string | null
          id?: string
          job_id?: string
          status?: Database["public"]["Enums"]["application_status"]
          submitted_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "job_applications_applicant_id_fkey"
            columns: ["applicant_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "job_applications_decided_by_fkey"
            columns: ["decided_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "job_applications_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "job_postings"
            referencedColumns: ["id"]
          },
        ]
      }
      job_offers: {
        Row: {
          application_id: string
          created_at: string
          employment_type: Database["public"]["Enums"]["employment_type"]
          expires_at: string | null
          id: string
          notes: string | null
          offered_by: string | null
          responded_at: string | null
          salary_currency: string
          salary_minor_units: number | null
          start_date: string | null
          status: Database["public"]["Enums"]["offer_status"]
          updated_at: string
        }
        Insert: {
          application_id: string
          created_at?: string
          employment_type?: Database["public"]["Enums"]["employment_type"]
          expires_at?: string | null
          id?: string
          notes?: string | null
          offered_by?: string | null
          responded_at?: string | null
          salary_currency?: string
          salary_minor_units?: number | null
          start_date?: string | null
          status?: Database["public"]["Enums"]["offer_status"]
          updated_at?: string
        }
        Update: {
          application_id?: string
          created_at?: string
          employment_type?: Database["public"]["Enums"]["employment_type"]
          expires_at?: string | null
          id?: string
          notes?: string | null
          offered_by?: string | null
          responded_at?: string | null
          salary_currency?: string
          salary_minor_units?: number | null
          start_date?: string | null
          status?: Database["public"]["Enums"]["offer_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "job_offers_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: true
            referencedRelation: "job_applications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "job_offers_offered_by_fkey"
            columns: ["offered_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      job_postings: {
        Row: {
          application_deadline: string | null
          city: string | null
          created_at: string
          created_by: string | null
          description: string | null
          duties: string[]
          employment_type: Database["public"]["Enums"]["employment_type"]
          experience_requirements: string | null
          id: string
          is_salary_disclosed: boolean
          organisation_id: string
          published_at: string | null
          qualifications: string[]
          safeguarding_requirements: string | null
          salary_currency: string
          salary_max_minor_units: number | null
          salary_min_minor_units: number | null
          shift_requirements: string | null
          skills: string[]
          slug: string
          state: string | null
          status: Database["public"]["Enums"]["job_status"]
          summary: string | null
          title: string
          updated_at: string
          work_location: string | null
        }
        Insert: {
          application_deadline?: string | null
          city?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          duties?: string[]
          employment_type?: Database["public"]["Enums"]["employment_type"]
          experience_requirements?: string | null
          id?: string
          is_salary_disclosed?: boolean
          organisation_id: string
          published_at?: string | null
          qualifications?: string[]
          safeguarding_requirements?: string | null
          salary_currency?: string
          salary_max_minor_units?: number | null
          salary_min_minor_units?: number | null
          shift_requirements?: string | null
          skills?: string[]
          slug: string
          state?: string | null
          status?: Database["public"]["Enums"]["job_status"]
          summary?: string | null
          title: string
          updated_at?: string
          work_location?: string | null
        }
        Update: {
          application_deadline?: string | null
          city?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          duties?: string[]
          employment_type?: Database["public"]["Enums"]["employment_type"]
          experience_requirements?: string | null
          id?: string
          is_salary_disclosed?: boolean
          organisation_id?: string
          published_at?: string | null
          qualifications?: string[]
          safeguarding_requirements?: string | null
          salary_currency?: string
          salary_max_minor_units?: number | null
          salary_min_minor_units?: number | null
          shift_requirements?: string | null
          skills?: string[]
          slug?: string
          state?: string | null
          status?: Database["public"]["Enums"]["job_status"]
          summary?: string | null
          title?: string
          updated_at?: string
          work_location?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "job_postings_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "job_postings_organisation_id_fkey"
            columns: ["organisation_id"]
            isOneToOne: false
            referencedRelation: "organisations"
            referencedColumns: ["id"]
          },
        ]
      }
      learning_resources: {
        Row: {
          course_id: string
          created_at: string
          created_by: string | null
          external_url: string | null
          id: string
          is_private: boolean
          kind: Database["public"]["Enums"]["learning_resource_kind"]
          lesson_id: string | null
          mime_type: string | null
          position: number
          size_bytes: number | null
          storage_path: string | null
          title: string
        }
        Insert: {
          course_id: string
          created_at?: string
          created_by?: string | null
          external_url?: string | null
          id?: string
          is_private?: boolean
          kind?: Database["public"]["Enums"]["learning_resource_kind"]
          lesson_id?: string | null
          mime_type?: string | null
          position?: number
          size_bytes?: number | null
          storage_path?: string | null
          title: string
        }
        Update: {
          course_id?: string
          created_at?: string
          created_by?: string | null
          external_url?: string | null
          id?: string
          is_private?: boolean
          kind?: Database["public"]["Enums"]["learning_resource_kind"]
          lesson_id?: string | null
          mime_type?: string | null
          position?: number
          size_bytes?: number | null
          storage_path?: string | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "learning_resources_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "learning_resources_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "learning_resources_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "lessons"
            referencedColumns: ["id"]
          },
        ]
      }
      lesson_progress: {
        Row: {
          completed_at: string
          created_at: string
          enrolment_id: string
          id: string
          lesson_id: string
          user_id: string
        }
        Insert: {
          completed_at?: string
          created_at?: string
          enrolment_id: string
          id?: string
          lesson_id: string
          user_id: string
        }
        Update: {
          completed_at?: string
          created_at?: string
          enrolment_id?: string
          id?: string
          lesson_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "lesson_progress_enrolment_id_fkey"
            columns: ["enrolment_id"]
            isOneToOne: false
            referencedRelation: "course_enrolments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lesson_progress_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "lessons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lesson_progress_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      lessons: {
        Row: {
          content: string
          created_at: string
          estimated_minutes: number
          id: string
          is_preview: boolean
          is_required: boolean
          module_id: string
          position: number
          slug: string
          title: string
          updated_at: string
          video_url: string | null
        }
        Insert: {
          content?: string
          created_at?: string
          estimated_minutes?: number
          id?: string
          is_preview?: boolean
          is_required?: boolean
          module_id: string
          position?: number
          slug: string
          title: string
          updated_at?: string
          video_url?: string | null
        }
        Update: {
          content?: string
          created_at?: string
          estimated_minutes?: number
          id?: string
          is_preview?: boolean
          is_required?: boolean
          module_id?: string
          position?: number
          slug?: string
          title?: string
          updated_at?: string
          video_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "lessons_module_id_fkey"
            columns: ["module_id"]
            isOneToOne: false
            referencedRelation: "course_modules"
            referencedColumns: ["id"]
          },
        ]
      }
      notification_events: {
        Row: {
          action_url: string | null
          body: string | null
          created_at: string
          dedupe_key: string | null
          event_type: string
          id: string
          metadata: Json
          organisation_id: string | null
          read_at: string | null
          title: string
          user_id: string
        }
        Insert: {
          action_url?: string | null
          body?: string | null
          created_at?: string
          dedupe_key?: string | null
          event_type: string
          id?: string
          metadata?: Json
          organisation_id?: string | null
          read_at?: string | null
          title: string
          user_id: string
        }
        Update: {
          action_url?: string | null
          body?: string | null
          created_at?: string
          dedupe_key?: string | null
          event_type?: string
          id?: string
          metadata?: Json
          organisation_id?: string | null
          read_at?: string | null
          title?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notification_events_organisation_id_fkey"
            columns: ["organisation_id"]
            isOneToOne: false
            referencedRelation: "organisations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notification_events_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          action_url: string | null
          body: string | null
          category: Database["public"]["Enums"]["notification_category"]
          created_at: string
          id: string
          metadata: Json
          organisation_id: string | null
          priority: Database["public"]["Enums"]["notification_priority"]
          read_at: string | null
          title: string
          user_id: string
        }
        Insert: {
          action_url?: string | null
          body?: string | null
          category?: Database["public"]["Enums"]["notification_category"]
          created_at?: string
          id?: string
          metadata?: Json
          organisation_id?: string | null
          priority?: Database["public"]["Enums"]["notification_priority"]
          read_at?: string | null
          title: string
          user_id: string
        }
        Update: {
          action_url?: string | null
          body?: string | null
          category?: Database["public"]["Enums"]["notification_category"]
          created_at?: string
          id?: string
          metadata?: Json
          organisation_id?: string | null
          priority?: Database["public"]["Enums"]["notification_priority"]
          read_at?: string | null
          title?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_organisation_id_fkey"
            columns: ["organisation_id"]
            isOneToOne: false
            referencedRelation: "organisations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      organisation_invitations: {
        Row: {
          accepted_at: string | null
          accepted_by: string | null
          created_at: string
          email: string
          expires_at: string
          id: string
          invited_by: string | null
          organisation_id: string
          role_key: string
          status: string
          token: string
        }
        Insert: {
          accepted_at?: string | null
          accepted_by?: string | null
          created_at?: string
          email: string
          expires_at?: string
          id?: string
          invited_by?: string | null
          organisation_id: string
          role_key: string
          status?: string
          token?: string
        }
        Update: {
          accepted_at?: string | null
          accepted_by?: string | null
          created_at?: string
          email?: string
          expires_at?: string
          id?: string
          invited_by?: string | null
          organisation_id?: string
          role_key?: string
          status?: string
          token?: string
        }
        Relationships: [
          {
            foreignKeyName: "organisation_invitations_accepted_by_fkey"
            columns: ["accepted_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "organisation_invitations_invited_by_fkey"
            columns: ["invited_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "organisation_invitations_organisation_id_fkey"
            columns: ["organisation_id"]
            isOneToOne: false
            referencedRelation: "organisations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "organisation_invitations_role_key_fkey"
            columns: ["role_key"]
            isOneToOne: false
            referencedRelation: "roles"
            referencedColumns: ["key"]
          },
        ]
      }
      organisation_memberships: {
        Row: {
          created_at: string
          id: string
          is_owner: boolean
          joined_at: string | null
          organisation_id: string
          status: Database["public"]["Enums"]["membership_status"]
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_owner?: boolean
          joined_at?: string | null
          organisation_id: string
          status?: Database["public"]["Enums"]["membership_status"]
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_owner?: boolean
          joined_at?: string | null
          organisation_id?: string
          status?: Database["public"]["Enums"]["membership_status"]
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "organisation_memberships_organisation_id_fkey"
            columns: ["organisation_id"]
            isOneToOne: false
            referencedRelation: "organisations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "organisation_memberships_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      organisation_verifications: {
        Row: {
          created_at: string
          id: string
          notes: string | null
          organisation_id: string
          reviewed_at: string | null
          reviewer_id: string | null
          status: Database["public"]["Enums"]["verification_status"]
        }
        Insert: {
          created_at?: string
          id?: string
          notes?: string | null
          organisation_id: string
          reviewed_at?: string | null
          reviewer_id?: string | null
          status: Database["public"]["Enums"]["verification_status"]
        }
        Update: {
          created_at?: string
          id?: string
          notes?: string | null
          organisation_id?: string
          reviewed_at?: string | null
          reviewer_id?: string | null
          status?: Database["public"]["Enums"]["verification_status"]
        }
        Relationships: [
          {
            foreignKeyName: "organisation_verifications_organisation_id_fkey"
            columns: ["organisation_id"]
            isOneToOne: false
            referencedRelation: "organisations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "organisation_verifications_reviewer_id_fkey"
            columns: ["reviewer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      organisations: {
        Row: {
          address: string | null
          city: string | null
          contact_email: string | null
          contact_phone: string | null
          created_at: string
          created_by: string | null
          id: string
          logo_url: string | null
          name: string
          permitted_modules: string[]
          settings: Json
          slug: string
          state: string | null
          status: Database["public"]["Enums"]["organisation_status"]
          type: Database["public"]["Enums"]["organisation_type"]
          updated_at: string
          verification_status: Database["public"]["Enums"]["verification_status"]
        }
        Insert: {
          address?: string | null
          city?: string | null
          contact_email?: string | null
          contact_phone?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          logo_url?: string | null
          name: string
          permitted_modules?: string[]
          settings?: Json
          slug: string
          state?: string | null
          status?: Database["public"]["Enums"]["organisation_status"]
          type: Database["public"]["Enums"]["organisation_type"]
          updated_at?: string
          verification_status?: Database["public"]["Enums"]["verification_status"]
        }
        Update: {
          address?: string | null
          city?: string | null
          contact_email?: string | null
          contact_phone?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          logo_url?: string | null
          name?: string
          permitted_modules?: string[]
          settings?: Json
          slug?: string
          state?: string | null
          status?: Database["public"]["Enums"]["organisation_status"]
          type?: Database["public"]["Enums"]["organisation_type"]
          updated_at?: string
          verification_status?: Database["public"]["Enums"]["verification_status"]
        }
        Relationships: [
          {
            foreignKeyName: "organisations_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      payment_refunds: {
        Row: {
          amount_minor_units: number
          created_at: string
          id: string
          initiated_by: string | null
          processed_at: string | null
          provider_payload: Json
          provider_reference: string | null
          reason: string
          status: string
          transaction_id: string
        }
        Insert: {
          amount_minor_units: number
          created_at?: string
          id?: string
          initiated_by?: string | null
          processed_at?: string | null
          provider_payload?: Json
          provider_reference?: string | null
          reason: string
          status?: string
          transaction_id: string
        }
        Update: {
          amount_minor_units?: number
          created_at?: string
          id?: string
          initiated_by?: string | null
          processed_at?: string | null
          provider_payload?: Json
          provider_reference?: string | null
          reason?: string
          status?: string
          transaction_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "payment_refunds_initiated_by_fkey"
            columns: ["initiated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payment_refunds_transaction_id_fkey"
            columns: ["transaction_id"]
            isOneToOne: false
            referencedRelation: "payment_transactions"
            referencedColumns: ["id"]
          },
        ]
      }
      payment_transactions: {
        Row: {
          access_code: string | null
          amount_minor_units: number
          checkout_url: string | null
          created_at: string
          currency: string
          description: string | null
          failed_at: string | null
          id: string
          idempotency_key: string | null
          last_verified_at: string | null
          metadata: Json
          organisation_id: string | null
          paid_at: string | null
          payer_email: string
          payer_id: string
          product_id: string | null
          product_type: string | null
          provider: Database["public"]["Enums"]["payment_provider"]
          provider_mode: string
          provider_payload: Json
          provider_reference: string | null
          purpose: Database["public"]["Enums"]["payment_purpose"]
          reconciliation_status: Database["public"]["Enums"]["payment_reconciliation_status"]
          reference: string
          referral_attribution_id: string | null
          refunded_amount_minor_units: number
          status: Database["public"]["Enums"]["payment_status"]
          updated_at: string
          verified_at: string | null
        }
        Insert: {
          access_code?: string | null
          amount_minor_units: number
          checkout_url?: string | null
          created_at?: string
          currency?: string
          description?: string | null
          failed_at?: string | null
          id?: string
          idempotency_key?: string | null
          last_verified_at?: string | null
          metadata?: Json
          organisation_id?: string | null
          paid_at?: string | null
          payer_email: string
          payer_id: string
          product_id?: string | null
          product_type?: string | null
          provider?: Database["public"]["Enums"]["payment_provider"]
          provider_mode?: string
          provider_payload?: Json
          provider_reference?: string | null
          purpose: Database["public"]["Enums"]["payment_purpose"]
          reconciliation_status?: Database["public"]["Enums"]["payment_reconciliation_status"]
          reference?: string
          referral_attribution_id?: string | null
          refunded_amount_minor_units?: number
          status?: Database["public"]["Enums"]["payment_status"]
          updated_at?: string
          verified_at?: string | null
        }
        Update: {
          access_code?: string | null
          amount_minor_units?: number
          checkout_url?: string | null
          created_at?: string
          currency?: string
          description?: string | null
          failed_at?: string | null
          id?: string
          idempotency_key?: string | null
          last_verified_at?: string | null
          metadata?: Json
          organisation_id?: string | null
          paid_at?: string | null
          payer_email?: string
          payer_id?: string
          product_id?: string | null
          product_type?: string | null
          provider?: Database["public"]["Enums"]["payment_provider"]
          provider_mode?: string
          provider_payload?: Json
          provider_reference?: string | null
          purpose?: Database["public"]["Enums"]["payment_purpose"]
          reconciliation_status?: Database["public"]["Enums"]["payment_reconciliation_status"]
          reference?: string
          referral_attribution_id?: string | null
          refunded_amount_minor_units?: number
          status?: Database["public"]["Enums"]["payment_status"]
          updated_at?: string
          verified_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payment_transactions_organisation_id_fkey"
            columns: ["organisation_id"]
            isOneToOne: false
            referencedRelation: "organisations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payment_transactions_payer_id_fkey"
            columns: ["payer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payment_transactions_referral_attribution_id_fkey"
            columns: ["referral_attribution_id"]
            isOneToOne: false
            referencedRelation: "referral_attributions"
            referencedColumns: ["id"]
          },
        ]
      }
      payment_webhook_events: {
        Row: {
          attempts: number
          error_message: string | null
          event_type: string
          id: string
          payload: Json
          processed_at: string | null
          processing_status: string
          provider: Database["public"]["Enums"]["payment_provider"]
          provider_event_id: string
          received_at: string
          signature_valid: boolean
        }
        Insert: {
          attempts?: number
          error_message?: string | null
          event_type: string
          id?: string
          payload: Json
          processed_at?: string | null
          processing_status?: string
          provider?: Database["public"]["Enums"]["payment_provider"]
          provider_event_id: string
          received_at?: string
          signature_valid?: boolean
        }
        Update: {
          attempts?: number
          error_message?: string | null
          event_type?: string
          id?: string
          payload?: Json
          processed_at?: string | null
          processing_status?: string
          provider?: Database["public"]["Enums"]["payment_provider"]
          provider_event_id?: string
          received_at?: string
          signature_valid?: boolean
        }
        Relationships: []
      }
      permissions: {
        Row: {
          category: string
          created_at: string
          description: string | null
          key: string
        }
        Insert: {
          category: string
          created_at?: string
          description?: string | null
          key: string
        }
        Update: {
          category?: string
          created_at?: string
          description?: string | null
          key?: string
        }
        Relationships: []
      }
      placement_providers: {
        Row: {
          address: string | null
          city: string | null
          contact_email: string | null
          contact_phone: string | null
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          is_accepting_interns: boolean
          organisation_id: string
          safeguarding_lead: string | null
          state: string | null
          updated_at: string
        }
        Insert: {
          address?: string | null
          city?: string | null
          contact_email?: string | null
          contact_phone?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          is_accepting_interns?: boolean
          organisation_id: string
          safeguarding_lead?: string | null
          state?: string | null
          updated_at?: string
        }
        Update: {
          address?: string | null
          city?: string | null
          contact_email?: string | null
          contact_phone?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          is_accepting_interns?: boolean
          organisation_id?: string
          safeguarding_lead?: string | null
          state?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "placement_providers_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "placement_providers_organisation_id_fkey"
            columns: ["organisation_id"]
            isOneToOne: true
            referencedRelation: "organisations"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          account_type: Database["public"]["Enums"]["account_type"] | null
          avatar_url: string | null
          city: string | null
          created_at: string
          email: string
          full_name: string | null
          id: string
          is_super_admin: boolean
          onboarding_completed_at: string | null
          phone: string | null
          state: string | null
          status: Database["public"]["Enums"]["account_status"]
          timezone: string
          updated_at: string
        }
        Insert: {
          account_type?: Database["public"]["Enums"]["account_type"] | null
          avatar_url?: string | null
          city?: string | null
          created_at?: string
          email: string
          full_name?: string | null
          id: string
          is_super_admin?: boolean
          onboarding_completed_at?: string | null
          phone?: string | null
          state?: string | null
          status?: Database["public"]["Enums"]["account_status"]
          timezone?: string
          updated_at?: string
        }
        Update: {
          account_type?: Database["public"]["Enums"]["account_type"] | null
          avatar_url?: string | null
          city?: string | null
          created_at?: string
          email?: string
          full_name?: string | null
          id?: string
          is_super_admin?: boolean
          onboarding_completed_at?: string | null
          phone?: string | null
          state?: string | null
          status?: Database["public"]["Enums"]["account_status"]
          timezone?: string
          updated_at?: string
        }
        Relationships: []
      }
      programmes: {
        Row: {
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          organisation_id: string | null
          slug: string
          status: Database["public"]["Enums"]["programme_status"]
          summary: string | null
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          organisation_id?: string | null
          slug: string
          status?: Database["public"]["Enums"]["programme_status"]
          summary?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          organisation_id?: string | null
          slug?: string
          status?: Database["public"]["Enums"]["programme_status"]
          summary?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "programmes_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "programmes_organisation_id_fkey"
            columns: ["organisation_id"]
            isOneToOne: false
            referencedRelation: "organisations"
            referencedColumns: ["id"]
          },
        ]
      }
      referral_attributions: {
        Row: {
          attributed_at: string
          created_at: string
          customer_user_id: string
          expires_at: string
          id: string
          partner_id: string
          referral_code: string
          source: string | null
          status: string
        }
        Insert: {
          attributed_at?: string
          created_at?: string
          customer_user_id: string
          expires_at: string
          id?: string
          partner_id: string
          referral_code: string
          source?: string | null
          status?: string
        }
        Update: {
          attributed_at?: string
          created_at?: string
          customer_user_id?: string
          expires_at?: string
          id?: string
          partner_id?: string
          referral_code?: string
          source?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "referral_attributions_customer_user_id_fkey"
            columns: ["customer_user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "referral_attributions_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "referral_partner_balances"
            referencedColumns: ["partner_id"]
          },
          {
            foreignKeyName: "referral_attributions_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "referral_partners"
            referencedColumns: ["id"]
          },
        ]
      }
      referral_commission_events: {
        Row: {
          actor_id: string | null
          commission_id: string
          created_at: string
          from_status:
            | Database["public"]["Enums"]["referral_commission_status"]
            | null
          id: string
          reason: string | null
          to_status: Database["public"]["Enums"]["referral_commission_status"]
        }
        Insert: {
          actor_id?: string | null
          commission_id: string
          created_at?: string
          from_status?:
            | Database["public"]["Enums"]["referral_commission_status"]
            | null
          id?: string
          reason?: string | null
          to_status: Database["public"]["Enums"]["referral_commission_status"]
        }
        Update: {
          actor_id?: string | null
          commission_id?: string
          created_at?: string
          from_status?:
            | Database["public"]["Enums"]["referral_commission_status"]
            | null
          id?: string
          reason?: string | null
          to_status?: Database["public"]["Enums"]["referral_commission_status"]
        }
        Relationships: [
          {
            foreignKeyName: "referral_commission_events_actor_id_fkey"
            columns: ["actor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "referral_commission_events_commission_id_fkey"
            columns: ["commission_id"]
            isOneToOne: false
            referencedRelation: "referral_commissions"
            referencedColumns: ["id"]
          },
        ]
      }
      referral_commission_policies: {
        Row: {
          attribution_window_days: number
          commission_type: Database["public"]["Enums"]["referral_commission_type"]
          created_at: string
          created_by: string | null
          currency: string
          description: string | null
          effective_from: string
          effective_to: string | null
          eligible_purposes: Database["public"]["Enums"]["payment_purpose"][]
          fixed_amount_minor_units: number | null
          id: string
          is_active: boolean
          minimum_payout_minor_units: number
          name: string
          payout_delay_days: number
          percentage_bps: number | null
          refund_policy: string | null
          updated_at: string
        }
        Insert: {
          attribution_window_days?: number
          commission_type: Database["public"]["Enums"]["referral_commission_type"]
          created_at?: string
          created_by?: string | null
          currency?: string
          description?: string | null
          effective_from?: string
          effective_to?: string | null
          eligible_purposes?: Database["public"]["Enums"]["payment_purpose"][]
          fixed_amount_minor_units?: number | null
          id?: string
          is_active?: boolean
          minimum_payout_minor_units?: number
          name: string
          payout_delay_days?: number
          percentage_bps?: number | null
          refund_policy?: string | null
          updated_at?: string
        }
        Update: {
          attribution_window_days?: number
          commission_type?: Database["public"]["Enums"]["referral_commission_type"]
          created_at?: string
          created_by?: string | null
          currency?: string
          description?: string | null
          effective_from?: string
          effective_to?: string | null
          eligible_purposes?: Database["public"]["Enums"]["payment_purpose"][]
          fixed_amount_minor_units?: number | null
          id?: string
          is_active?: boolean
          minimum_payout_minor_units?: number
          name?: string
          payout_delay_days?: number
          percentage_bps?: number | null
          refund_policy?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "referral_commission_policies_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      referral_commissions: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          attribution_id: string | null
          basis: string
          commission_amount_minor_units: number
          created_at: string
          currency: string
          eligible_at: string | null
          entry_type: Database["public"]["Enums"]["referral_commission_entry"]
          gross_amount_minor_units: number
          id: string
          paid_at: string | null
          partner_id: string
          policy_id: string | null
          reversal_of_commission_id: string | null
          reversed_at: string | null
          status: Database["public"]["Enums"]["referral_commission_status"]
          status_reason: string | null
          transaction_id: string | null
          updated_at: string
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          attribution_id?: string | null
          basis: string
          commission_amount_minor_units: number
          created_at?: string
          currency?: string
          eligible_at?: string | null
          entry_type?: Database["public"]["Enums"]["referral_commission_entry"]
          gross_amount_minor_units: number
          id?: string
          paid_at?: string | null
          partner_id: string
          policy_id?: string | null
          reversal_of_commission_id?: string | null
          reversed_at?: string | null
          status?: Database["public"]["Enums"]["referral_commission_status"]
          status_reason?: string | null
          transaction_id?: string | null
          updated_at?: string
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          attribution_id?: string | null
          basis?: string
          commission_amount_minor_units?: number
          created_at?: string
          currency?: string
          eligible_at?: string | null
          entry_type?: Database["public"]["Enums"]["referral_commission_entry"]
          gross_amount_minor_units?: number
          id?: string
          paid_at?: string | null
          partner_id?: string
          policy_id?: string | null
          reversal_of_commission_id?: string | null
          reversed_at?: string | null
          status?: Database["public"]["Enums"]["referral_commission_status"]
          status_reason?: string | null
          transaction_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "referral_commissions_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "referral_commissions_attribution_id_fkey"
            columns: ["attribution_id"]
            isOneToOne: false
            referencedRelation: "referral_attributions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "referral_commissions_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "referral_partner_balances"
            referencedColumns: ["partner_id"]
          },
          {
            foreignKeyName: "referral_commissions_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "referral_partners"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "referral_commissions_policy_id_fkey"
            columns: ["policy_id"]
            isOneToOne: false
            referencedRelation: "referral_commission_policies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "referral_commissions_reversal_of_commission_id_fkey"
            columns: ["reversal_of_commission_id"]
            isOneToOne: false
            referencedRelation: "referral_commissions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "referral_commissions_transaction_id_fkey"
            columns: ["transaction_id"]
            isOneToOne: false
            referencedRelation: "payment_transactions"
            referencedColumns: ["id"]
          },
        ]
      }
      referral_partners: {
        Row: {
          applied_at: string
          approved_at: string | null
          approved_by: string | null
          code: string
          created_at: string
          display_name: string | null
          id: string
          phone: string | null
          rejected_at: string | null
          rejection_reason: string | null
          status: Database["public"]["Enums"]["referral_partner_status"]
          suspended_at: string | null
          suspension_reason: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          applied_at?: string
          approved_at?: string | null
          approved_by?: string | null
          code: string
          created_at?: string
          display_name?: string | null
          id?: string
          phone?: string | null
          rejected_at?: string | null
          rejection_reason?: string | null
          status?: Database["public"]["Enums"]["referral_partner_status"]
          suspended_at?: string | null
          suspension_reason?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          applied_at?: string
          approved_at?: string | null
          approved_by?: string | null
          code?: string
          created_at?: string
          display_name?: string | null
          id?: string
          phone?: string | null
          rejected_at?: string | null
          rejection_reason?: string | null
          status?: Database["public"]["Enums"]["referral_partner_status"]
          suspended_at?: string | null
          suspension_reason?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "referral_partners_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "referral_partners_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      referral_payout_accounts: {
        Row: {
          account_name: string
          account_number: string
          bank_code: string
          bank_name: string | null
          created_at: string
          id: string
          partner_id: string
          provider_recipient_code: string | null
          updated_at: string
          verified_at: string | null
          verified_by: string | null
        }
        Insert: {
          account_name: string
          account_number: string
          bank_code: string
          bank_name?: string | null
          created_at?: string
          id?: string
          partner_id: string
          provider_recipient_code?: string | null
          updated_at?: string
          verified_at?: string | null
          verified_by?: string | null
        }
        Update: {
          account_name?: string
          account_number?: string
          bank_code?: string
          bank_name?: string | null
          created_at?: string
          id?: string
          partner_id?: string
          provider_recipient_code?: string | null
          updated_at?: string
          verified_at?: string | null
          verified_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "referral_payout_accounts_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: true
            referencedRelation: "referral_partner_balances"
            referencedColumns: ["partner_id"]
          },
          {
            foreignKeyName: "referral_payout_accounts_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: true
            referencedRelation: "referral_partners"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "referral_payout_accounts_verified_by_fkey"
            columns: ["verified_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      referral_payout_items: {
        Row: {
          amount_minor_units: number
          commission_id: string
          created_at: string
          payout_request_id: string
        }
        Insert: {
          amount_minor_units: number
          commission_id: string
          created_at?: string
          payout_request_id: string
        }
        Update: {
          amount_minor_units?: number
          commission_id?: string
          created_at?: string
          payout_request_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "referral_payout_items_commission_id_fkey"
            columns: ["commission_id"]
            isOneToOne: false
            referencedRelation: "referral_commissions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "referral_payout_items_payout_request_id_fkey"
            columns: ["payout_request_id"]
            isOneToOne: false
            referencedRelation: "referral_payout_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      referral_payout_requests: {
        Row: {
          amount_minor_units: number
          created_at: string
          currency: string
          decision_reason: string | null
          failed_at: string | null
          failure_reason: string | null
          id: string
          idempotency_key: string | null
          paid_at: string | null
          partner_id: string
          processing_at: string | null
          provider: Database["public"]["Enums"]["payment_provider"]
          provider_recipient_reference: string | null
          provider_transfer_reference: string | null
          requested_at: string
          reviewed_at: string | null
          reviewed_by: string | null
          status: Database["public"]["Enums"]["referral_payout_status"]
          updated_at: string
        }
        Insert: {
          amount_minor_units: number
          created_at?: string
          currency?: string
          decision_reason?: string | null
          failed_at?: string | null
          failure_reason?: string | null
          id?: string
          idempotency_key?: string | null
          paid_at?: string | null
          partner_id: string
          processing_at?: string | null
          provider?: Database["public"]["Enums"]["payment_provider"]
          provider_recipient_reference?: string | null
          provider_transfer_reference?: string | null
          requested_at?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: Database["public"]["Enums"]["referral_payout_status"]
          updated_at?: string
        }
        Update: {
          amount_minor_units?: number
          created_at?: string
          currency?: string
          decision_reason?: string | null
          failed_at?: string | null
          failure_reason?: string | null
          id?: string
          idempotency_key?: string | null
          paid_at?: string | null
          partner_id?: string
          processing_at?: string | null
          provider?: Database["public"]["Enums"]["payment_provider"]
          provider_recipient_reference?: string | null
          provider_transfer_reference?: string | null
          requested_at?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: Database["public"]["Enums"]["referral_payout_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "referral_payout_requests_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "referral_partner_balances"
            referencedColumns: ["partner_id"]
          },
          {
            foreignKeyName: "referral_payout_requests_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "referral_partners"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "referral_payout_requests_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      role_permissions: {
        Row: {
          permission_key: string
          role_key: string
        }
        Insert: {
          permission_key: string
          role_key: string
        }
        Update: {
          permission_key?: string
          role_key?: string
        }
        Relationships: [
          {
            foreignKeyName: "role_permissions_permission_key_fkey"
            columns: ["permission_key"]
            isOneToOne: false
            referencedRelation: "permissions"
            referencedColumns: ["key"]
          },
          {
            foreignKeyName: "role_permissions_role_key_fkey"
            columns: ["role_key"]
            isOneToOne: false
            referencedRelation: "roles"
            referencedColumns: ["key"]
          },
        ]
      }
      roles: {
        Row: {
          created_at: string
          description: string | null
          is_system: boolean
          key: string
          name: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          is_system?: boolean
          key: string
          name: string
        }
        Update: {
          created_at?: string
          description?: string | null
          is_system?: boolean
          key?: string
          name?: string
        }
        Relationships: []
      }
      user_consents: {
        Row: {
          consent_type: string
          created_at: string
          granted: boolean
          granted_at: string
          id: string
          user_id: string
          version: string
        }
        Insert: {
          consent_type: string
          created_at?: string
          granted: boolean
          granted_at?: string
          id?: string
          user_id: string
          version: string
        }
        Update: {
          consent_type?: string
          created_at?: string
          granted?: boolean
          granted_at?: string
          id?: string
          user_id?: string
          version?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_consents_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_notification_preferences: {
        Row: {
          email_enabled: boolean
          in_app_enabled: boolean
          sms_enabled: boolean
          updated_at: string
          user_id: string
        }
        Insert: {
          email_enabled?: boolean
          in_app_enabled?: boolean
          sms_enabled?: boolean
          updated_at?: string
          user_id: string
        }
        Update: {
          email_enabled?: boolean
          in_app_enabled?: boolean
          sms_enabled?: boolean
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_notification_preferences_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_role_assignments: {
        Row: {
          created_at: string
          granted_by: string | null
          id: string
          organisation_id: string | null
          role_key: string
          user_id: string
        }
        Insert: {
          created_at?: string
          granted_by?: string | null
          id?: string
          organisation_id?: string | null
          role_key: string
          user_id: string
        }
        Update: {
          created_at?: string
          granted_by?: string | null
          id?: string
          organisation_id?: string | null
          role_key?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_role_assignments_granted_by_fkey"
            columns: ["granted_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_role_assignments_organisation_id_fkey"
            columns: ["organisation_id"]
            isOneToOne: false
            referencedRelation: "organisations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_role_assignments_role_key_fkey"
            columns: ["role_key"]
            isOneToOne: false
            referencedRelation: "roles"
            referencedColumns: ["key"]
          },
          {
            foreignKeyName: "user_role_assignments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      referral_partner_balances: {
        Row: {
          approved_minor_units: number | null
          in_payout_minor_units: number | null
          paid_minor_units: number | null
          partner_id: string | null
          pending_minor_units: number | null
          user_id: string | null
        }
        Relationships: [
          {
            foreignKeyName: "referral_partners_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      accept_invitation: { Args: { p_token: string }; Returns: string }
      apply_payment_failure: {
        Args: { p_reason?: string; p_reference: string; p_status: string }
        Returns: undefined
      }
      apply_payment_refund: {
        Args: {
          p_amount_minor_units: number
          p_provider_reference?: string
          p_reference: string
        }
        Returns: Json
      }
      apply_payment_success: {
        Args: {
          p_amount_minor_units: number
          p_currency: string
          p_provider_payload?: Json
          p_provider_reference: string
          p_reference: string
        }
        Returns: Json
      }
      apply_referral_partner: {
        Args: { p_display_name?: string; p_phone?: string }
        Returns: string
      }
      attribute_referral: { Args: { p_code: string }; Returns: string }
      can_manage_course: { Args: { p_course: string }; Returns: boolean }
      can_manage_internships: {
        Args: { p_organisation: string }
        Returns: boolean
      }
      can_manage_jobs: { Args: { p_organisation: string }; Returns: boolean }
      can_read_placement: { Args: { p_placement: string }; Returns: boolean }
      can_supervise_placement: {
        Args: { p_placement: string }
        Returns: boolean
      }
      complete_lesson: { Args: { p_lesson: string }; Returns: Json }
      course_readable: { Args: { p_course: string }; Returns: boolean }
      current_organisation_ids: { Args: never; Returns: string[] }
      enrol_in_course: { Args: { p_course: string }; Returns: string }
      get_public_certificate: {
        Args: { p_code: string }
        Returns: {
          certificate_number: string
          course_title: string
          credential_scope: string
          disclaimer: string
          issued_at: string
          issuer_name: string
          learner_name: string
          revoked: boolean
        }[]
      }
      grant_paid_course_enrolment: {
        Args: { p_course: string; p_user: string }
        Returns: string
      }
      has_permission: {
        Args: { p_organisation?: string; p_permission: string }
        Returns: boolean
      }
      internship_application_organisation: {
        Args: { p_application: string }
        Returns: string
      }
      internship_listing_readable: {
        Args: { p_listing: string }
        Returns: boolean
      }
      is_enrolled: { Args: { p_course: string }; Returns: boolean }
      is_org_member: { Args: { p_organisation: string }; Returns: boolean }
      is_super_admin: { Args: never; Returns: boolean }
      job_application_organisation: {
        Args: { p_application: string }
        Returns: string
      }
      job_readable: { Args: { p_job: string }; Returns: boolean }
      record_referral_payout_transfer: {
        Args: {
          p_payout: string
          p_provider_reference?: string
          p_reason?: string
          p_status: string
        }
        Returns: undefined
      }
      release_due_commissions: { Args: never; Returns: number }
      request_referral_payout: { Args: never; Returns: string }
      review_referral_commission: {
        Args: { p_commission: string; p_decision: string; p_reason?: string }
        Returns: Database["public"]["Enums"]["referral_commission_status"]
      }
      review_referral_partner: {
        Args: { p_decision: string; p_partner: string; p_reason?: string }
        Returns: Database["public"]["Enums"]["referral_partner_status"]
      }
      review_referral_payout: {
        Args: { p_decision: string; p_payout: string; p_reason?: string }
        Returns: Database["public"]["Enums"]["referral_payout_status"]
      }
      unread_notification_count: { Args: never; Returns: number }
      verify_referral_payout_account: {
        Args: {
          p_partner: string
          p_provider_recipient_code?: string
          p_verified: boolean
        }
        Returns: undefined
      }
    }
    Enums: {
      account_status: "active" | "deactivated"
      account_type:
        | "caregiver"
        | "training_provider"
        | "care_provider"
        | "referral_partner"
        | "charity"
        | "employer"
      application_status:
        | "submitted"
        | "under_review"
        | "shortlisted"
        | "interview"
        | "offered"
        | "hired"
        | "rejected"
        | "withdrawn"
      attendance_status: "present" | "absent" | "late" | "excused"
      course_difficulty: "foundation" | "intermediate" | "advanced"
      course_status: "draft" | "in_review" | "published" | "archived"
      employment_type:
        | "full_time"
        | "part_time"
        | "temporary"
        | "contract"
        | "internship"
      enrolment_status: "active" | "completed" | "withdrawn"
      evaluation_recommendation: "pass" | "needs_improvement" | "fail"
      evaluation_status: "draft" | "submitted"
      incident_severity: "low" | "medium" | "high" | "critical"
      incident_status: "open" | "investigating" | "resolved" | "closed"
      internship_application_status:
        | "submitted"
        | "under_review"
        | "shortlisted"
        | "offered"
        | "accepted"
        | "rejected"
        | "withdrawn"
      internship_listing_status: "draft" | "open" | "closed" | "archived"
      internship_log_status: "submitted" | "approved" | "changes_requested"
      interview_mode: "in_person" | "video" | "phone"
      interview_status: "scheduled" | "completed" | "cancelled" | "no_show"
      job_status:
        | "draft"
        | "pending_approval"
        | "published"
        | "closed"
        | "archived"
      learning_resource_kind:
        | "pdf"
        | "document"
        | "presentation"
        | "audio"
        | "video"
        | "image"
        | "link"
        | "other"
      membership_status: "invited" | "active" | "suspended" | "removed"
      notification_category:
        | "account"
        | "learning"
        | "assessment"
        | "internship"
        | "employment"
        | "referral"
        | "payment"
        | "charity"
        | "care_operations"
        | "platform"
      notification_priority: "low" | "normal" | "high"
      offer_status: "sent" | "accepted" | "declined" | "withdrawn" | "expired"
      organisation_status: "pending" | "active" | "suspended" | "disabled"
      organisation_type:
        | "platform_academy"
        | "training_provider"
        | "care_home"
        | "home_care_agency"
        | "recruitment_partner"
        | "charity"
        | "corporate_customer"
      payment_provider: "paystack"
      payment_purpose:
        | "course_purchase"
        | "training_fee"
        | "subscription"
        | "care_home_subscription"
        | "donation"
        | "other"
      payment_reconciliation_status:
        | "pending"
        | "matched"
        | "mismatch"
        | "review_required"
        | "not_applicable"
      payment_status:
        | "initiated"
        | "pending"
        | "successful"
        | "failed"
        | "cancelled"
        | "refunded"
        | "partially_refunded"
      placement_agreement_status: "pending" | "accepted" | "declined"
      placement_status:
        | "pending_agreement"
        | "active"
        | "completed"
        | "terminated"
      programme_status: "active" | "archived"
      referral_commission_entry: "commission" | "reversal" | "adjustment"
      referral_commission_status:
        | "pending"
        | "eligible"
        | "approved"
        | "processing"
        | "paid"
        | "rejected"
        | "reversed"
        | "failed"
        | "on_hold"
      referral_commission_type: "percentage" | "fixed"
      referral_partner_status: "pending" | "approved" | "suspended" | "rejected"
      referral_payout_status:
        | "pending"
        | "approved"
        | "processing"
        | "paid"
        | "rejected"
        | "failed"
        | "cancelled"
      verification_status: "unverified" | "pending" | "verified" | "rejected"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      account_status: ["active", "deactivated"],
      account_type: [
        "caregiver",
        "training_provider",
        "care_provider",
        "referral_partner",
        "charity",
        "employer",
      ],
      application_status: [
        "submitted",
        "under_review",
        "shortlisted",
        "interview",
        "offered",
        "hired",
        "rejected",
        "withdrawn",
      ],
      attendance_status: ["present", "absent", "late", "excused"],
      course_difficulty: ["foundation", "intermediate", "advanced"],
      course_status: ["draft", "in_review", "published", "archived"],
      employment_type: [
        "full_time",
        "part_time",
        "temporary",
        "contract",
        "internship",
      ],
      enrolment_status: ["active", "completed", "withdrawn"],
      evaluation_recommendation: ["pass", "needs_improvement", "fail"],
      evaluation_status: ["draft", "submitted"],
      incident_severity: ["low", "medium", "high", "critical"],
      incident_status: ["open", "investigating", "resolved", "closed"],
      internship_application_status: [
        "submitted",
        "under_review",
        "shortlisted",
        "offered",
        "accepted",
        "rejected",
        "withdrawn",
      ],
      internship_listing_status: ["draft", "open", "closed", "archived"],
      internship_log_status: ["submitted", "approved", "changes_requested"],
      interview_mode: ["in_person", "video", "phone"],
      interview_status: ["scheduled", "completed", "cancelled", "no_show"],
      job_status: [
        "draft",
        "pending_approval",
        "published",
        "closed",
        "archived",
      ],
      learning_resource_kind: [
        "pdf",
        "document",
        "presentation",
        "audio",
        "video",
        "image",
        "link",
        "other",
      ],
      membership_status: ["invited", "active", "suspended", "removed"],
      notification_category: [
        "account",
        "learning",
        "assessment",
        "internship",
        "employment",
        "referral",
        "payment",
        "charity",
        "care_operations",
        "platform",
      ],
      notification_priority: ["low", "normal", "high"],
      offer_status: ["sent", "accepted", "declined", "withdrawn", "expired"],
      organisation_status: ["pending", "active", "suspended", "disabled"],
      organisation_type: [
        "platform_academy",
        "training_provider",
        "care_home",
        "home_care_agency",
        "recruitment_partner",
        "charity",
        "corporate_customer",
      ],
      payment_provider: ["paystack"],
      payment_purpose: [
        "course_purchase",
        "training_fee",
        "subscription",
        "care_home_subscription",
        "donation",
        "other",
      ],
      payment_reconciliation_status: [
        "pending",
        "matched",
        "mismatch",
        "review_required",
        "not_applicable",
      ],
      payment_status: [
        "initiated",
        "pending",
        "successful",
        "failed",
        "cancelled",
        "refunded",
        "partially_refunded",
      ],
      placement_agreement_status: ["pending", "accepted", "declined"],
      placement_status: [
        "pending_agreement",
        "active",
        "completed",
        "terminated",
      ],
      programme_status: ["active", "archived"],
      referral_commission_entry: ["commission", "reversal", "adjustment"],
      referral_commission_status: [
        "pending",
        "eligible",
        "approved",
        "processing",
        "paid",
        "rejected",
        "reversed",
        "failed",
        "on_hold",
      ],
      referral_commission_type: ["percentage", "fixed"],
      referral_partner_status: ["pending", "approved", "suspended", "rejected"],
      referral_payout_status: [
        "pending",
        "approved",
        "processing",
        "paid",
        "rejected",
        "failed",
        "cancelled",
      ],
      verification_status: ["unverified", "pending", "verified", "rejected"],
    },
  },
} as const

// -----------------------------------------------------------------------------
// Application-level aliases for database enums.
// `supabase gen types` only emits the raw Database shape; these aliases keep the
// rest of the codebase readable and are preserved across regenerations.
// -----------------------------------------------------------------------------

export type AccountType = Database["public"]["Enums"]["account_type"];
export type AccountStatus = Database["public"]["Enums"]["account_status"];
export type MembershipStatus = Database["public"]["Enums"]["membership_status"];
export type OrganisationType = Database["public"]["Enums"]["organisation_type"];
export type OrganisationStatus = Database["public"]["Enums"]["organisation_status"];
export type VerificationStatus = Database["public"]["Enums"]["verification_status"];
export type RoleKey =
  | "super_admin"
  | "platform_support"
  | "training_admin"
  | "instructor"
  | "caregiver"
  | "internship_supervisor"
  | "employer"
  | "care_home_owner"
  | "care_home_manager"
  | "care_staff"
  | "care_medication_staff"
  | "referral_partner"
  | "charity_admin"
  | "donor"
  | "finance_officer"
  | "compliance_officer"
  | "family_member";

export type NotificationCategory =
  Database["public"]["Enums"]["notification_category"];
export type NotificationPriority =
  Database["public"]["Enums"]["notification_priority"];

export type CourseDifficulty = Database["public"]["Enums"]["course_difficulty"];
export type CourseStatus = Database["public"]["Enums"]["course_status"];
export type EnrolmentStatus = Database["public"]["Enums"]["enrolment_status"];
export type LearningResourceKind =
  Database["public"]["Enums"]["learning_resource_kind"];

export type EmploymentType = Database["public"]["Enums"]["employment_type"];
export type JobStatus = Database["public"]["Enums"]["job_status"];
export type ApplicationStatus =
  Database["public"]["Enums"]["application_status"];
export type InternshipListingStatus =
  Database["public"]["Enums"]["internship_listing_status"];
export type InternshipApplicationStatus =
  Database["public"]["Enums"]["internship_application_status"];
export type InterviewMode = Database["public"]["Enums"]["interview_mode"];
export type InterviewStatus = Database["public"]["Enums"]["interview_status"];
export type OfferStatus = Database["public"]["Enums"]["offer_status"];
export type PlacementStatus = Database["public"]["Enums"]["placement_status"];
export type PlacementAgreementStatus =
  Database["public"]["Enums"]["placement_agreement_status"];
export type AttendanceStatus = Database["public"]["Enums"]["attendance_status"];
export type EvaluationRecommendation =
  Database["public"]["Enums"]["evaluation_recommendation"];
export type EvaluationStatus = Database["public"]["Enums"]["evaluation_status"];
export type IncidentSeverity = Database["public"]["Enums"]["incident_severity"];
export type IncidentStatus = Database["public"]["Enums"]["incident_status"];
export type InternshipLogStatus =
  Database["public"]["Enums"]["internship_log_status"];

export type PaymentStatus = Database["public"]["Enums"]["payment_status"];
export type PaymentPurpose = Database["public"]["Enums"]["payment_purpose"];
export type PaymentProvider = Database["public"]["Enums"]["payment_provider"];
export type PaymentReconciliationStatus =
  Database["public"]["Enums"]["payment_reconciliation_status"];
export type ReferralPartnerStatus =
  Database["public"]["Enums"]["referral_partner_status"];
export type ReferralCommissionType =
  Database["public"]["Enums"]["referral_commission_type"];
export type ReferralCommissionStatus =
  Database["public"]["Enums"]["referral_commission_status"];
export type ReferralCommissionEntry =
  Database["public"]["Enums"]["referral_commission_entry"];
export type ReferralPayoutStatus =
  Database["public"]["Enums"]["referral_payout_status"];
