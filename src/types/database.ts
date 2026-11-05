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
      assessment_attempt_answers: {
        Row: {
          answer: Json
          attempt_id: string
          awarded_points: number
          created_at: string
          id: string
          is_correct: boolean
          question_id: string
        }
        Insert: {
          answer?: Json
          attempt_id: string
          awarded_points?: number
          created_at?: string
          id?: string
          is_correct?: boolean
          question_id: string
        }
        Update: {
          answer?: Json
          attempt_id?: string
          awarded_points?: number
          created_at?: string
          id?: string
          is_correct?: boolean
          question_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "assessment_attempt_answers_attempt_id_fkey"
            columns: ["attempt_id"]
            isOneToOne: false
            referencedRelation: "assessment_attempts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assessment_attempt_answers_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "assessment_questions"
            referencedColumns: ["id"]
          },
        ]
      }
      assessment_attempts: {
        Row: {
          assessment_id: string
          attempt_number: number
          enrolment_id: string
          expires_at: string | null
          id: string
          max_points: number | null
          passed: boolean | null
          score_points: number | null
          started_at: string
          status: Database["public"]["Enums"]["assessment_attempt_status"]
          submitted_at: string | null
          user_id: string
        }
        Insert: {
          assessment_id: string
          attempt_number: number
          enrolment_id: string
          expires_at?: string | null
          id?: string
          max_points?: number | null
          passed?: boolean | null
          score_points?: number | null
          started_at?: string
          status?: Database["public"]["Enums"]["assessment_attempt_status"]
          submitted_at?: string | null
          user_id: string
        }
        Update: {
          assessment_id?: string
          attempt_number?: number
          enrolment_id?: string
          expires_at?: string | null
          id?: string
          max_points?: number | null
          passed?: boolean | null
          score_points?: number | null
          started_at?: string
          status?: Database["public"]["Enums"]["assessment_attempt_status"]
          submitted_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "assessment_attempts_assessment_id_fkey"
            columns: ["assessment_id"]
            isOneToOne: false
            referencedRelation: "assessments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assessment_attempts_enrolment_id_fkey"
            columns: ["enrolment_id"]
            isOneToOne: false
            referencedRelation: "course_enrolments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assessment_attempts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      assessment_questions: {
        Row: {
          assessment_id: string
          correct_answer: Json
          created_at: string
          explanation: string | null
          id: string
          options: Json
          points: number
          position: number
          prompt: string
          question_type: Database["public"]["Enums"]["assessment_question_type"]
        }
        Insert: {
          assessment_id: string
          correct_answer: Json
          created_at?: string
          explanation?: string | null
          id?: string
          options?: Json
          points?: number
          position?: number
          prompt: string
          question_type?: Database["public"]["Enums"]["assessment_question_type"]
        }
        Update: {
          assessment_id?: string
          correct_answer?: Json
          created_at?: string
          explanation?: string | null
          id?: string
          options?: Json
          points?: number
          position?: number
          prompt?: string
          question_type?: Database["public"]["Enums"]["assessment_question_type"]
        }
        Relationships: [
          {
            foreignKeyName: "assessment_questions_assessment_id_fkey"
            columns: ["assessment_id"]
            isOneToOne: false
            referencedRelation: "assessments"
            referencedColumns: ["id"]
          },
        ]
      }
      assessments: {
        Row: {
          course_id: string
          created_at: string
          created_by: string | null
          id: string
          instructions: string | null
          is_required: boolean
          kind: Database["public"]["Enums"]["assessment_kind"]
          max_attempts: number
          organisation_id: string | null
          pass_mark_percent: number
          published_at: string | null
          status: Database["public"]["Enums"]["assessment_status"]
          time_limit_minutes: number | null
          title: string
          updated_at: string
        }
        Insert: {
          course_id: string
          created_at?: string
          created_by?: string | null
          id?: string
          instructions?: string | null
          is_required?: boolean
          kind?: Database["public"]["Enums"]["assessment_kind"]
          max_attempts?: number
          organisation_id?: string | null
          pass_mark_percent?: number
          published_at?: string | null
          status?: Database["public"]["Enums"]["assessment_status"]
          time_limit_minutes?: number | null
          title: string
          updated_at?: string
        }
        Update: {
          course_id?: string
          created_at?: string
          created_by?: string | null
          id?: string
          instructions?: string | null
          is_required?: boolean
          kind?: Database["public"]["Enums"]["assessment_kind"]
          max_attempts?: number
          organisation_id?: string | null
          pass_mark_percent?: number
          published_at?: string | null
          status?: Database["public"]["Enums"]["assessment_status"]
          time_limit_minutes?: number | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "assessments_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assessments_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assessments_organisation_id_fkey"
            columns: ["organisation_id"]
            isOneToOne: false
            referencedRelation: "organisations"
            referencedColumns: ["id"]
          },
        ]
      }
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
      campaign_allocations: {
        Row: {
          allocated_by: string | null
          allocation_type: Database["public"]["Enums"]["campaign_allocation_type"]
          amount_minor_units: number
          campaign_id: string
          category: string
          created_at: string
          currency: string
          id: string
          notes: string | null
          organisation_id: string
        }
        Insert: {
          allocated_by?: string | null
          allocation_type?: Database["public"]["Enums"]["campaign_allocation_type"]
          amount_minor_units: number
          campaign_id: string
          category: string
          created_at?: string
          currency?: string
          id?: string
          notes?: string | null
          organisation_id: string
        }
        Update: {
          allocated_by?: string | null
          allocation_type?: Database["public"]["Enums"]["campaign_allocation_type"]
          amount_minor_units?: number
          campaign_id?: string
          category?: string
          created_at?: string
          currency?: string
          id?: string
          notes?: string | null
          organisation_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "campaign_allocations_allocated_by_fkey"
            columns: ["allocated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "campaign_allocations_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "charity_campaign_finance"
            referencedColumns: ["campaign_id"]
          },
          {
            foreignKeyName: "campaign_allocations_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "charity_campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "campaign_allocations_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "charity_public_campaign_progress"
            referencedColumns: ["campaign_id"]
          },
          {
            foreignKeyName: "campaign_allocations_organisation_id_fkey"
            columns: ["organisation_id"]
            isOneToOne: false
            referencedRelation: "organisations"
            referencedColumns: ["id"]
          },
        ]
      }
      campaign_expenses: {
        Row: {
          amount_minor_units: number
          approved_at: string | null
          approved_by: string | null
          campaign_id: string
          category: string
          created_at: string
          currency: string
          description: string | null
          id: string
          incurred_on: string
          organisation_id: string
          payee: string | null
          receipt_reference: string | null
          recorded_by: string | null
          status: Database["public"]["Enums"]["campaign_expense_status"]
        }
        Insert: {
          amount_minor_units: number
          approved_at?: string | null
          approved_by?: string | null
          campaign_id: string
          category: string
          created_at?: string
          currency?: string
          description?: string | null
          id?: string
          incurred_on?: string
          organisation_id: string
          payee?: string | null
          receipt_reference?: string | null
          recorded_by?: string | null
          status?: Database["public"]["Enums"]["campaign_expense_status"]
        }
        Update: {
          amount_minor_units?: number
          approved_at?: string | null
          approved_by?: string | null
          campaign_id?: string
          category?: string
          created_at?: string
          currency?: string
          description?: string | null
          id?: string
          incurred_on?: string
          organisation_id?: string
          payee?: string | null
          receipt_reference?: string | null
          recorded_by?: string | null
          status?: Database["public"]["Enums"]["campaign_expense_status"]
        }
        Relationships: [
          {
            foreignKeyName: "campaign_expenses_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "campaign_expenses_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "charity_campaign_finance"
            referencedColumns: ["campaign_id"]
          },
          {
            foreignKeyName: "campaign_expenses_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "charity_campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "campaign_expenses_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "charity_public_campaign_progress"
            referencedColumns: ["campaign_id"]
          },
          {
            foreignKeyName: "campaign_expenses_organisation_id_fkey"
            columns: ["organisation_id"]
            isOneToOne: false
            referencedRelation: "organisations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "campaign_expenses_recorded_by_fkey"
            columns: ["recorded_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      campaign_reviews: {
        Row: {
          campaign_id: string
          created_at: string
          decision: Database["public"]["Enums"]["campaign_review_decision"]
          id: string
          notes: string | null
          organisation_id: string
          reviewer_id: string | null
        }
        Insert: {
          campaign_id: string
          created_at?: string
          decision: Database["public"]["Enums"]["campaign_review_decision"]
          id?: string
          notes?: string | null
          organisation_id: string
          reviewer_id?: string | null
        }
        Update: {
          campaign_id?: string
          created_at?: string
          decision?: Database["public"]["Enums"]["campaign_review_decision"]
          id?: string
          notes?: string | null
          organisation_id?: string
          reviewer_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "campaign_reviews_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "charity_campaign_finance"
            referencedColumns: ["campaign_id"]
          },
          {
            foreignKeyName: "campaign_reviews_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "charity_campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "campaign_reviews_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "charity_public_campaign_progress"
            referencedColumns: ["campaign_id"]
          },
          {
            foreignKeyName: "campaign_reviews_organisation_id_fkey"
            columns: ["organisation_id"]
            isOneToOne: false
            referencedRelation: "organisations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "campaign_reviews_reviewer_id_fkey"
            columns: ["reviewer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      care_facilities: {
        Row: {
          address: string | null
          capacity: number | null
          city: string | null
          created_at: string
          created_by: string | null
          email: string | null
          id: string
          name: string
          organisation_id: string
          phone: string | null
          state: string | null
          status: Database["public"]["Enums"]["care_facility_status"]
          updated_at: string
        }
        Insert: {
          address?: string | null
          capacity?: number | null
          city?: string | null
          created_at?: string
          created_by?: string | null
          email?: string | null
          id?: string
          name: string
          organisation_id: string
          phone?: string | null
          state?: string | null
          status?: Database["public"]["Enums"]["care_facility_status"]
          updated_at?: string
        }
        Update: {
          address?: string | null
          capacity?: number | null
          city?: string | null
          created_at?: string
          created_by?: string | null
          email?: string | null
          id?: string
          name?: string
          organisation_id?: string
          phone?: string | null
          state?: string | null
          status?: Database["public"]["Enums"]["care_facility_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "care_facilities_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "care_facilities_organisation_id_fkey"
            columns: ["organisation_id"]
            isOneToOne: false
            referencedRelation: "organisations"
            referencedColumns: ["id"]
          },
        ]
      }
      care_plan_assignments: {
        Row: {
          completed_at: string | null
          created_at: string
          created_by: string | null
          due_on: string | null
          id: string
          organisation_id: string
          plan_id: string
          responsibility: string
          staff_user_id: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          created_by?: string | null
          due_on?: string | null
          id?: string
          organisation_id: string
          plan_id: string
          responsibility: string
          staff_user_id: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          created_by?: string | null
          due_on?: string | null
          id?: string
          organisation_id?: string
          plan_id?: string
          responsibility?: string
          staff_user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "care_plan_assignments_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "care_plan_assignments_organisation_id_fkey"
            columns: ["organisation_id"]
            isOneToOne: false
            referencedRelation: "organisations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "care_plan_assignments_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "care_plans"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "care_plan_assignments_staff_user_id_fkey"
            columns: ["staff_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      care_plan_versions: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          change_summary: string | null
          content: Json
          created_at: string
          created_by: string | null
          id: string
          organisation_id: string
          plan_id: string
          resident_id: string
          version_number: number
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          change_summary?: string | null
          content?: Json
          created_at?: string
          created_by?: string | null
          id?: string
          organisation_id: string
          plan_id: string
          resident_id: string
          version_number: number
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          change_summary?: string | null
          content?: Json
          created_at?: string
          created_by?: string | null
          id?: string
          organisation_id?: string
          plan_id?: string
          resident_id?: string
          version_number?: number
        }
        Relationships: [
          {
            foreignKeyName: "care_plan_versions_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "care_plan_versions_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "care_plan_versions_organisation_id_fkey"
            columns: ["organisation_id"]
            isOneToOne: false
            referencedRelation: "organisations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "care_plan_versions_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "care_plans"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "care_plan_versions_resident_id_fkey"
            columns: ["resident_id"]
            isOneToOne: false
            referencedRelation: "residents"
            referencedColumns: ["id"]
          },
        ]
      }
      care_plans: {
        Row: {
          access_level: Database["public"]["Enums"]["care_plan_access"]
          approved_at: string | null
          approved_by: string | null
          archived_at: string | null
          created_at: string
          created_by: string | null
          current_version_id: string | null
          id: string
          organisation_id: string
          resident_id: string
          review_due_on: string | null
          status: Database["public"]["Enums"]["care_plan_status"]
          summary: string | null
          title: string
          updated_at: string
        }
        Insert: {
          access_level?: Database["public"]["Enums"]["care_plan_access"]
          approved_at?: string | null
          approved_by?: string | null
          archived_at?: string | null
          created_at?: string
          created_by?: string | null
          current_version_id?: string | null
          id?: string
          organisation_id: string
          resident_id: string
          review_due_on?: string | null
          status?: Database["public"]["Enums"]["care_plan_status"]
          summary?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          access_level?: Database["public"]["Enums"]["care_plan_access"]
          approved_at?: string | null
          approved_by?: string | null
          archived_at?: string | null
          created_at?: string
          created_by?: string | null
          current_version_id?: string | null
          id?: string
          organisation_id?: string
          resident_id?: string
          review_due_on?: string | null
          status?: Database["public"]["Enums"]["care_plan_status"]
          summary?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "care_plans_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "care_plans_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "care_plans_current_version_fk"
            columns: ["current_version_id"]
            isOneToOne: false
            referencedRelation: "care_plan_versions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "care_plans_organisation_id_fkey"
            columns: ["organisation_id"]
            isOneToOne: false
            referencedRelation: "organisations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "care_plans_resident_id_fkey"
            columns: ["resident_id"]
            isOneToOne: false
            referencedRelation: "residents"
            referencedColumns: ["id"]
          },
        ]
      }
      care_staff_profiles: {
        Row: {
          availability: Json
          created_at: string
          created_by: string | null
          employment_status: Database["public"]["Enums"]["care_employment_status"]
          end_date: string | null
          id: string
          job_title: string | null
          notes: string | null
          organisation_id: string
          start_date: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          availability?: Json
          created_at?: string
          created_by?: string | null
          employment_status?: Database["public"]["Enums"]["care_employment_status"]
          end_date?: string | null
          id?: string
          job_title?: string | null
          notes?: string | null
          organisation_id: string
          start_date?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          availability?: Json
          created_at?: string
          created_by?: string | null
          employment_status?: Database["public"]["Enums"]["care_employment_status"]
          end_date?: string | null
          id?: string
          job_title?: string | null
          notes?: string | null
          organisation_id?: string
          start_date?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "care_staff_profiles_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "care_staff_profiles_organisation_id_fkey"
            columns: ["organisation_id"]
            isOneToOne: false
            referencedRelation: "organisations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "care_staff_profiles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      care_task_records: {
        Row: {
          assistance_notes: string | null
          completed_at: string | null
          created_at: string
          hydration_ml: number | null
          id: string
          meal_consumed: string | null
          meal_offered: string | null
          mobility_notes: string | null
          observations: string | null
          organisation_id: string
          recorded_by: string | null
          resident_id: string
          review_notes: string | null
          review_outcome:
            | Database["public"]["Enums"]["care_review_outcome"]
            | null
          reviewed_at: string | null
          reviewed_by: string | null
          shift_id: string | null
          status: Database["public"]["Enums"]["care_task_record_status"]
          task_id: string | null
          updated_at: string
        }
        Insert: {
          assistance_notes?: string | null
          completed_at?: string | null
          created_at?: string
          hydration_ml?: number | null
          id?: string
          meal_consumed?: string | null
          meal_offered?: string | null
          mobility_notes?: string | null
          observations?: string | null
          organisation_id: string
          recorded_by?: string | null
          resident_id: string
          review_notes?: string | null
          review_outcome?:
            | Database["public"]["Enums"]["care_review_outcome"]
            | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          shift_id?: string | null
          status?: Database["public"]["Enums"]["care_task_record_status"]
          task_id?: string | null
          updated_at?: string
        }
        Update: {
          assistance_notes?: string | null
          completed_at?: string | null
          created_at?: string
          hydration_ml?: number | null
          id?: string
          meal_consumed?: string | null
          meal_offered?: string | null
          mobility_notes?: string | null
          observations?: string | null
          organisation_id?: string
          recorded_by?: string | null
          resident_id?: string
          review_notes?: string | null
          review_outcome?:
            | Database["public"]["Enums"]["care_review_outcome"]
            | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          shift_id?: string | null
          status?: Database["public"]["Enums"]["care_task_record_status"]
          task_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "care_task_records_organisation_id_fkey"
            columns: ["organisation_id"]
            isOneToOne: false
            referencedRelation: "organisations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "care_task_records_recorded_by_fkey"
            columns: ["recorded_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "care_task_records_resident_id_fkey"
            columns: ["resident_id"]
            isOneToOne: false
            referencedRelation: "residents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "care_task_records_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "care_task_records_shift_id_fkey"
            columns: ["shift_id"]
            isOneToOne: false
            referencedRelation: "care_staffing_coverage"
            referencedColumns: ["shift_id"]
          },
          {
            foreignKeyName: "care_task_records_shift_id_fkey"
            columns: ["shift_id"]
            isOneToOne: false
            referencedRelation: "shift_schedules"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "care_task_records_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "care_tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      care_tasks: {
        Row: {
          care_plan_id: string | null
          category: Database["public"]["Enums"]["care_task_category"]
          created_at: string
          created_by: string | null
          id: string
          instructions: string | null
          is_active: boolean
          organisation_id: string
          required_qualification: string | null
          requires_two_staff: boolean
          resident_id: string
          schedule_times: string[]
          title: string
          updated_at: string
        }
        Insert: {
          care_plan_id?: string | null
          category?: Database["public"]["Enums"]["care_task_category"]
          created_at?: string
          created_by?: string | null
          id?: string
          instructions?: string | null
          is_active?: boolean
          organisation_id: string
          required_qualification?: string | null
          requires_two_staff?: boolean
          resident_id: string
          schedule_times?: string[]
          title: string
          updated_at?: string
        }
        Update: {
          care_plan_id?: string | null
          category?: Database["public"]["Enums"]["care_task_category"]
          created_at?: string
          created_by?: string | null
          id?: string
          instructions?: string | null
          is_active?: boolean
          organisation_id?: string
          required_qualification?: string | null
          requires_two_staff?: boolean
          resident_id?: string
          schedule_times?: string[]
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "care_tasks_care_plan_id_fkey"
            columns: ["care_plan_id"]
            isOneToOne: false
            referencedRelation: "care_plans"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "care_tasks_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "care_tasks_organisation_id_fkey"
            columns: ["organisation_id"]
            isOneToOne: false
            referencedRelation: "organisations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "care_tasks_resident_id_fkey"
            columns: ["resident_id"]
            isOneToOne: false
            referencedRelation: "residents"
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
      charity_campaigns: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          beneficiary_criteria: string | null
          created_at: string
          created_by: string | null
          currency: string
          description: string | null
          ends_on: string | null
          funding_target_minor_units: number
          id: string
          is_public: boolean
          organisation_id: string
          published_at: string | null
          purpose: string
          slug: string
          sponsorship_options: Json
          starts_on: string
          status: Database["public"]["Enums"]["charity_campaign_status"]
          supporting_documents: Json
          title: string
          updated_at: string
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          beneficiary_criteria?: string | null
          created_at?: string
          created_by?: string | null
          currency?: string
          description?: string | null
          ends_on?: string | null
          funding_target_minor_units: number
          id?: string
          is_public?: boolean
          organisation_id: string
          published_at?: string | null
          purpose: string
          slug: string
          sponsorship_options?: Json
          starts_on?: string
          status?: Database["public"]["Enums"]["charity_campaign_status"]
          supporting_documents?: Json
          title: string
          updated_at?: string
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          beneficiary_criteria?: string | null
          created_at?: string
          created_by?: string | null
          currency?: string
          description?: string | null
          ends_on?: string | null
          funding_target_minor_units?: number
          id?: string
          is_public?: boolean
          organisation_id?: string
          published_at?: string | null
          purpose?: string
          slug?: string
          sponsorship_options?: Json
          starts_on?: string
          status?: Database["public"]["Enums"]["charity_campaign_status"]
          supporting_documents?: Json
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "charity_campaigns_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "charity_campaigns_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "charity_campaigns_organisation_id_fkey"
            columns: ["organisation_id"]
            isOneToOne: false
            referencedRelation: "organisations"
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
      conversation_participants: {
        Row: {
          conversation_id: string
          created_at: string
          id: string
          is_muted: boolean
          last_read_at: string | null
          user_id: string
        }
        Insert: {
          conversation_id: string
          created_at?: string
          id?: string
          is_muted?: boolean
          last_read_at?: string | null
          user_id: string
        }
        Update: {
          conversation_id?: string
          created_at?: string
          id?: string
          is_muted?: boolean
          last_read_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "conversation_participants_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversation_participants_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      conversations: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          last_message_at: string
          last_message_preview: string | null
          last_message_sender_id: string | null
          organisation_id: string
          subject: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          last_message_at?: string
          last_message_preview?: string | null
          last_message_sender_id?: string | null
          organisation_id: string
          subject: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          last_message_at?: string
          last_message_preview?: string | null
          last_message_sender_id?: string | null
          organisation_id?: string
          subject?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "conversations_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversations_last_message_sender_id_fkey"
            columns: ["last_message_sender_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversations_organisation_id_fkey"
            columns: ["organisation_id"]
            isOneToOne: false
            referencedRelation: "organisations"
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
      donations: {
        Row: {
          amount_minor_units: number
          campaign_id: string
          created_at: string
          currency: string
          donor_display_name: string | null
          donor_id: string | null
          id: string
          is_public: boolean
          message: string | null
          organisation_id: string
          paid_at: string | null
          payment_transaction_id: string | null
          receipt_reference: string | null
          refunded_amount_minor_units: number
          status: Database["public"]["Enums"]["donation_status"]
          updated_at: string
        }
        Insert: {
          amount_minor_units: number
          campaign_id: string
          created_at?: string
          currency?: string
          donor_display_name?: string | null
          donor_id?: string | null
          id?: string
          is_public?: boolean
          message?: string | null
          organisation_id: string
          paid_at?: string | null
          payment_transaction_id?: string | null
          receipt_reference?: string | null
          refunded_amount_minor_units?: number
          status?: Database["public"]["Enums"]["donation_status"]
          updated_at?: string
        }
        Update: {
          amount_minor_units?: number
          campaign_id?: string
          created_at?: string
          currency?: string
          donor_display_name?: string | null
          donor_id?: string | null
          id?: string
          is_public?: boolean
          message?: string | null
          organisation_id?: string
          paid_at?: string | null
          payment_transaction_id?: string | null
          receipt_reference?: string | null
          refunded_amount_minor_units?: number
          status?: Database["public"]["Enums"]["donation_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "donations_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "charity_campaign_finance"
            referencedColumns: ["campaign_id"]
          },
          {
            foreignKeyName: "donations_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "charity_campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "donations_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "charity_public_campaign_progress"
            referencedColumns: ["campaign_id"]
          },
          {
            foreignKeyName: "donations_donor_id_fkey"
            columns: ["donor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "donations_organisation_id_fkey"
            columns: ["organisation_id"]
            isOneToOne: false
            referencedRelation: "organisations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "donations_payment_transaction_id_fkey"
            columns: ["payment_transaction_id"]
            isOneToOne: true
            referencedRelation: "payment_transactions"
            referencedColumns: ["id"]
          },
        ]
      }
      expense_records: {
        Row: {
          amount_minor_units: number
          approved_at: string | null
          approved_by: string | null
          category: string
          created_at: string
          currency: string
          description: string | null
          facility_id: string
          id: string
          incurred_on: string
          organisation_id: string
          payment_method: string | null
          payment_status: Database["public"]["Enums"]["expense_payment_status"]
          purchase_id: string | null
          receipt_reference: string | null
          recorded_by: string | null
          supplier_id: string | null
          updated_at: string
        }
        Insert: {
          amount_minor_units: number
          approved_at?: string | null
          approved_by?: string | null
          category: string
          created_at?: string
          currency?: string
          description?: string | null
          facility_id: string
          id?: string
          incurred_on?: string
          organisation_id: string
          payment_method?: string | null
          payment_status?: Database["public"]["Enums"]["expense_payment_status"]
          purchase_id?: string | null
          receipt_reference?: string | null
          recorded_by?: string | null
          supplier_id?: string | null
          updated_at?: string
        }
        Update: {
          amount_minor_units?: number
          approved_at?: string | null
          approved_by?: string | null
          category?: string
          created_at?: string
          currency?: string
          description?: string | null
          facility_id?: string
          id?: string
          incurred_on?: string
          organisation_id?: string
          payment_method?: string | null
          payment_status?: Database["public"]["Enums"]["expense_payment_status"]
          purchase_id?: string | null
          receipt_reference?: string | null
          recorded_by?: string | null
          supplier_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "expense_records_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "expense_records_facility_id_fkey"
            columns: ["facility_id"]
            isOneToOne: false
            referencedRelation: "care_facilities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "expense_records_facility_id_fkey"
            columns: ["facility_id"]
            isOneToOne: false
            referencedRelation: "care_occupancy"
            referencedColumns: ["facility_id"]
          },
          {
            foreignKeyName: "expense_records_organisation_id_fkey"
            columns: ["organisation_id"]
            isOneToOne: false
            referencedRelation: "organisations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "expense_records_purchase_id_fkey"
            columns: ["purchase_id"]
            isOneToOne: false
            referencedRelation: "purchases"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "expense_records_recorded_by_fkey"
            columns: ["recorded_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "expense_records_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
        ]
      }
      impact_reports: {
        Row: {
          campaign_id: string
          created_at: string
          created_by: string | null
          id: string
          is_published: boolean
          metrics: Json
          organisation_id: string
          published_at: string | null
          summary: string | null
          title: string
          updated_at: string
        }
        Insert: {
          campaign_id: string
          created_at?: string
          created_by?: string | null
          id?: string
          is_published?: boolean
          metrics?: Json
          organisation_id: string
          published_at?: string | null
          summary?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          campaign_id?: string
          created_at?: string
          created_by?: string | null
          id?: string
          is_published?: boolean
          metrics?: Json
          organisation_id?: string
          published_at?: string | null
          summary?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "impact_reports_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "charity_campaign_finance"
            referencedColumns: ["campaign_id"]
          },
          {
            foreignKeyName: "impact_reports_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "charity_campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "impact_reports_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "charity_public_campaign_progress"
            referencedColumns: ["campaign_id"]
          },
          {
            foreignKeyName: "impact_reports_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "impact_reports_organisation_id_fkey"
            columns: ["organisation_id"]
            isOneToOne: false
            referencedRelation: "organisations"
            referencedColumns: ["id"]
          },
        ]
      }
      incident_actions: {
        Row: {
          action: string
          completed_at: string | null
          created_at: string
          created_by: string | null
          due_on: string | null
          id: string
          incident_id: string
          notes: string | null
          organisation_id: string
          owner_id: string | null
          status: Database["public"]["Enums"]["incident_action_status"]
          updated_at: string
        }
        Insert: {
          action: string
          completed_at?: string | null
          created_at?: string
          created_by?: string | null
          due_on?: string | null
          id?: string
          incident_id: string
          notes?: string | null
          organisation_id: string
          owner_id?: string | null
          status?: Database["public"]["Enums"]["incident_action_status"]
          updated_at?: string
        }
        Update: {
          action?: string
          completed_at?: string | null
          created_at?: string
          created_by?: string | null
          due_on?: string | null
          id?: string
          incident_id?: string
          notes?: string | null
          organisation_id?: string
          owner_id?: string | null
          status?: Database["public"]["Enums"]["incident_action_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "incident_actions_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "incident_actions_incident_id_fkey"
            columns: ["incident_id"]
            isOneToOne: false
            referencedRelation: "incidents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "incident_actions_organisation_id_fkey"
            columns: ["organisation_id"]
            isOneToOne: false
            referencedRelation: "organisations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "incident_actions_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      incidents: {
        Row: {
          assigned_reviewer: string | null
          category: Database["public"]["Enums"]["incident_category"]
          closed_at: string | null
          closed_by: string | null
          closure_notes: string | null
          created_at: string
          description: string
          external_reference: string | null
          facility_id: string
          id: string
          immediate_action: string | null
          is_safeguarding: boolean
          occurred_at: string
          organisation_id: string
          reported_by: string | null
          resident_id: string | null
          severity: Database["public"]["Enums"]["incident_severity"]
          status: Database["public"]["Enums"]["incident_status"]
          updated_at: string
        }
        Insert: {
          assigned_reviewer?: string | null
          category: Database["public"]["Enums"]["incident_category"]
          closed_at?: string | null
          closed_by?: string | null
          closure_notes?: string | null
          created_at?: string
          description: string
          external_reference?: string | null
          facility_id: string
          id?: string
          immediate_action?: string | null
          is_safeguarding?: boolean
          occurred_at: string
          organisation_id: string
          reported_by?: string | null
          resident_id?: string | null
          severity?: Database["public"]["Enums"]["incident_severity"]
          status?: Database["public"]["Enums"]["incident_status"]
          updated_at?: string
        }
        Update: {
          assigned_reviewer?: string | null
          category?: Database["public"]["Enums"]["incident_category"]
          closed_at?: string | null
          closed_by?: string | null
          closure_notes?: string | null
          created_at?: string
          description?: string
          external_reference?: string | null
          facility_id?: string
          id?: string
          immediate_action?: string | null
          is_safeguarding?: boolean
          occurred_at?: string
          organisation_id?: string
          reported_by?: string | null
          resident_id?: string | null
          severity?: Database["public"]["Enums"]["incident_severity"]
          status?: Database["public"]["Enums"]["incident_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "incidents_assigned_reviewer_fkey"
            columns: ["assigned_reviewer"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "incidents_closed_by_fkey"
            columns: ["closed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "incidents_facility_id_fkey"
            columns: ["facility_id"]
            isOneToOne: false
            referencedRelation: "care_facilities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "incidents_facility_id_fkey"
            columns: ["facility_id"]
            isOneToOne: false
            referencedRelation: "care_occupancy"
            referencedColumns: ["facility_id"]
          },
          {
            foreignKeyName: "incidents_organisation_id_fkey"
            columns: ["organisation_id"]
            isOneToOne: false
            referencedRelation: "organisations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "incidents_reported_by_fkey"
            columns: ["reported_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "incidents_resident_id_fkey"
            columns: ["resident_id"]
            isOneToOne: false
            referencedRelation: "residents"
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
      inventory_items: {
        Row: {
          category: string | null
          created_at: string
          created_by: string | null
          facility_id: string
          id: string
          is_active: boolean
          name: string
          organisation_id: string
          reorder_level: number
          sku: string
          unit: string
          updated_at: string
        }
        Insert: {
          category?: string | null
          created_at?: string
          created_by?: string | null
          facility_id: string
          id?: string
          is_active?: boolean
          name: string
          organisation_id: string
          reorder_level?: number
          sku: string
          unit?: string
          updated_at?: string
        }
        Update: {
          category?: string | null
          created_at?: string
          created_by?: string | null
          facility_id?: string
          id?: string
          is_active?: boolean
          name?: string
          organisation_id?: string
          reorder_level?: number
          sku?: string
          unit?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "inventory_items_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_items_facility_id_fkey"
            columns: ["facility_id"]
            isOneToOne: false
            referencedRelation: "care_facilities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_items_facility_id_fkey"
            columns: ["facility_id"]
            isOneToOne: false
            referencedRelation: "care_occupancy"
            referencedColumns: ["facility_id"]
          },
          {
            foreignKeyName: "inventory_items_organisation_id_fkey"
            columns: ["organisation_id"]
            isOneToOne: false
            referencedRelation: "organisations"
            referencedColumns: ["id"]
          },
        ]
      }
      inventory_movements: {
        Row: {
          created_at: string
          id: string
          item_id: string
          movement_type: Database["public"]["Enums"]["inventory_movement_type"]
          organisation_id: string
          quantity_delta: number
          reason: string | null
          recorded_by: string | null
          reference: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          item_id: string
          movement_type: Database["public"]["Enums"]["inventory_movement_type"]
          organisation_id: string
          quantity_delta: number
          reason?: string | null
          recorded_by?: string | null
          reference?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          item_id?: string
          movement_type?: Database["public"]["Enums"]["inventory_movement_type"]
          organisation_id?: string
          quantity_delta?: number
          reason?: string | null
          recorded_by?: string | null
          reference?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "inventory_movements_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "care_inventory_status"
            referencedColumns: ["item_id"]
          },
          {
            foreignKeyName: "inventory_movements_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "inventory_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_movements_organisation_id_fkey"
            columns: ["organisation_id"]
            isOneToOne: false
            referencedRelation: "organisations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_movements_recorded_by_fkey"
            columns: ["recorded_by"]
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
      medication_record_events: {
        Row: {
          actor_id: string | null
          created_at: string
          from_status: Database["public"]["Enums"]["medication_status"] | null
          id: string
          medication_record_id: string
          organisation_id: string
          reason: string | null
          to_status: Database["public"]["Enums"]["medication_status"]
        }
        Insert: {
          actor_id?: string | null
          created_at?: string
          from_status?: Database["public"]["Enums"]["medication_status"] | null
          id?: string
          medication_record_id: string
          organisation_id: string
          reason?: string | null
          to_status: Database["public"]["Enums"]["medication_status"]
        }
        Update: {
          actor_id?: string | null
          created_at?: string
          from_status?: Database["public"]["Enums"]["medication_status"] | null
          id?: string
          medication_record_id?: string
          organisation_id?: string
          reason?: string | null
          to_status?: Database["public"]["Enums"]["medication_status"]
        }
        Relationships: [
          {
            foreignKeyName: "medication_record_events_actor_id_fkey"
            columns: ["actor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "medication_record_events_medication_record_id_fkey"
            columns: ["medication_record_id"]
            isOneToOne: false
            referencedRelation: "medication_records"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "medication_record_events_organisation_id_fkey"
            columns: ["organisation_id"]
            isOneToOne: false
            referencedRelation: "organisations"
            referencedColumns: ["id"]
          },
        ]
      }
      medication_records: {
        Row: {
          administered_at: string | null
          administered_by: string | null
          created_at: string
          dose_text: string | null
          facility_id: string
          id: string
          medication_name: string
          notes: string | null
          organisation_id: string
          reason: string | null
          recorded_by: string | null
          resident_id: string
          route: string | null
          scheduled_at: string
          status: Database["public"]["Enums"]["medication_status"]
          updated_at: string
          witnessed_by: string | null
        }
        Insert: {
          administered_at?: string | null
          administered_by?: string | null
          created_at?: string
          dose_text?: string | null
          facility_id: string
          id?: string
          medication_name: string
          notes?: string | null
          organisation_id: string
          reason?: string | null
          recorded_by?: string | null
          resident_id: string
          route?: string | null
          scheduled_at: string
          status?: Database["public"]["Enums"]["medication_status"]
          updated_at?: string
          witnessed_by?: string | null
        }
        Update: {
          administered_at?: string | null
          administered_by?: string | null
          created_at?: string
          dose_text?: string | null
          facility_id?: string
          id?: string
          medication_name?: string
          notes?: string | null
          organisation_id?: string
          reason?: string | null
          recorded_by?: string | null
          resident_id?: string
          route?: string | null
          scheduled_at?: string
          status?: Database["public"]["Enums"]["medication_status"]
          updated_at?: string
          witnessed_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "medication_records_administered_by_fkey"
            columns: ["administered_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "medication_records_facility_id_fkey"
            columns: ["facility_id"]
            isOneToOne: false
            referencedRelation: "care_facilities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "medication_records_facility_id_fkey"
            columns: ["facility_id"]
            isOneToOne: false
            referencedRelation: "care_occupancy"
            referencedColumns: ["facility_id"]
          },
          {
            foreignKeyName: "medication_records_organisation_id_fkey"
            columns: ["organisation_id"]
            isOneToOne: false
            referencedRelation: "organisations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "medication_records_recorded_by_fkey"
            columns: ["recorded_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "medication_records_resident_id_fkey"
            columns: ["resident_id"]
            isOneToOne: false
            referencedRelation: "residents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "medication_records_witnessed_by_fkey"
            columns: ["witnessed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          body: string
          conversation_id: string
          created_at: string
          id: string
          sender_id: string
        }
        Insert: {
          body: string
          conversation_id: string
          created_at?: string
          id?: string
          sender_id: string
        }
        Update: {
          body?: string
          conversation_id?: string
          created_at?: string
          id?: string
          sender_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "profiles"
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
      organisation_subscriptions: {
        Row: {
          billing_cycle: Database["public"]["Enums"]["subscription_billing_cycle"]
          cancel_at_period_end: boolean
          cancelled_at: string | null
          created_at: string
          created_by: string | null
          current_period_end: string
          current_period_start: string
          ended_at: string | null
          grace_ends_at: string | null
          id: string
          notes: string | null
          organisation_id: string
          plan_id: string
          started_at: string
          status: Database["public"]["Enums"]["subscription_status"]
          suspended_at: string | null
          trial_ends_at: string | null
          updated_at: string
        }
        Insert: {
          billing_cycle?: Database["public"]["Enums"]["subscription_billing_cycle"]
          cancel_at_period_end?: boolean
          cancelled_at?: string | null
          created_at?: string
          created_by?: string | null
          current_period_end?: string
          current_period_start?: string
          ended_at?: string | null
          grace_ends_at?: string | null
          id?: string
          notes?: string | null
          organisation_id: string
          plan_id: string
          started_at?: string
          status?: Database["public"]["Enums"]["subscription_status"]
          suspended_at?: string | null
          trial_ends_at?: string | null
          updated_at?: string
        }
        Update: {
          billing_cycle?: Database["public"]["Enums"]["subscription_billing_cycle"]
          cancel_at_period_end?: boolean
          cancelled_at?: string | null
          created_at?: string
          created_by?: string | null
          current_period_end?: string
          current_period_start?: string
          ended_at?: string | null
          grace_ends_at?: string | null
          id?: string
          notes?: string | null
          organisation_id?: string
          plan_id?: string
          started_at?: string
          status?: Database["public"]["Enums"]["subscription_status"]
          suspended_at?: string | null
          trial_ends_at?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "organisation_subscriptions_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "organisation_subscriptions_organisation_id_fkey"
            columns: ["organisation_id"]
            isOneToOne: true
            referencedRelation: "organisations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "organisation_subscriptions_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "subscription_plans"
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
      purchase_items: {
        Row: {
          created_at: string
          description: string
          id: string
          inventory_item_id: string | null
          line_total_minor_units: number | null
          organisation_id: string
          purchase_id: string
          quantity: number
          unit_cost_minor_units: number
        }
        Insert: {
          created_at?: string
          description: string
          id?: string
          inventory_item_id?: string | null
          line_total_minor_units?: number | null
          organisation_id: string
          purchase_id: string
          quantity: number
          unit_cost_minor_units?: number
        }
        Update: {
          created_at?: string
          description?: string
          id?: string
          inventory_item_id?: string | null
          line_total_minor_units?: number | null
          organisation_id?: string
          purchase_id?: string
          quantity?: number
          unit_cost_minor_units?: number
        }
        Relationships: [
          {
            foreignKeyName: "purchase_items_inventory_item_id_fkey"
            columns: ["inventory_item_id"]
            isOneToOne: false
            referencedRelation: "care_inventory_status"
            referencedColumns: ["item_id"]
          },
          {
            foreignKeyName: "purchase_items_inventory_item_id_fkey"
            columns: ["inventory_item_id"]
            isOneToOne: false
            referencedRelation: "inventory_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "purchase_items_organisation_id_fkey"
            columns: ["organisation_id"]
            isOneToOne: false
            referencedRelation: "organisations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "purchase_items_purchase_id_fkey"
            columns: ["purchase_id"]
            isOneToOne: false
            referencedRelation: "purchases"
            referencedColumns: ["id"]
          },
        ]
      }
      purchase_request_items: {
        Row: {
          created_at: string
          description: string
          estimated_unit_cost_minor_units: number
          id: string
          inventory_item_id: string | null
          organisation_id: string
          quantity: number
          request_id: string
        }
        Insert: {
          created_at?: string
          description: string
          estimated_unit_cost_minor_units?: number
          id?: string
          inventory_item_id?: string | null
          organisation_id: string
          quantity: number
          request_id: string
        }
        Update: {
          created_at?: string
          description?: string
          estimated_unit_cost_minor_units?: number
          id?: string
          inventory_item_id?: string | null
          organisation_id?: string
          quantity?: number
          request_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "purchase_request_items_inventory_item_id_fkey"
            columns: ["inventory_item_id"]
            isOneToOne: false
            referencedRelation: "care_inventory_status"
            referencedColumns: ["item_id"]
          },
          {
            foreignKeyName: "purchase_request_items_inventory_item_id_fkey"
            columns: ["inventory_item_id"]
            isOneToOne: false
            referencedRelation: "inventory_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "purchase_request_items_organisation_id_fkey"
            columns: ["organisation_id"]
            isOneToOne: false
            referencedRelation: "organisations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "purchase_request_items_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: false
            referencedRelation: "purchase_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      purchase_requests: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          created_at: string
          facility_id: string
          id: string
          needed_by: string | null
          notes: string | null
          organisation_id: string
          rejection_reason: string | null
          requested_by: string | null
          status: Database["public"]["Enums"]["purchase_request_status"]
          updated_at: string
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string
          facility_id: string
          id?: string
          needed_by?: string | null
          notes?: string | null
          organisation_id: string
          rejection_reason?: string | null
          requested_by?: string | null
          status?: Database["public"]["Enums"]["purchase_request_status"]
          updated_at?: string
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string
          facility_id?: string
          id?: string
          needed_by?: string | null
          notes?: string | null
          organisation_id?: string
          rejection_reason?: string | null
          requested_by?: string | null
          status?: Database["public"]["Enums"]["purchase_request_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "purchase_requests_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "purchase_requests_facility_id_fkey"
            columns: ["facility_id"]
            isOneToOne: false
            referencedRelation: "care_facilities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "purchase_requests_facility_id_fkey"
            columns: ["facility_id"]
            isOneToOne: false
            referencedRelation: "care_occupancy"
            referencedColumns: ["facility_id"]
          },
          {
            foreignKeyName: "purchase_requests_organisation_id_fkey"
            columns: ["organisation_id"]
            isOneToOne: false
            referencedRelation: "organisations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "purchase_requests_requested_by_fkey"
            columns: ["requested_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      purchases: {
        Row: {
          created_at: string
          currency: string
          facility_id: string
          id: string
          invoice_number: string | null
          notes: string | null
          organisation_id: string
          purchase_request_id: string | null
          purchased_on: string
          recorded_by: string | null
          status: Database["public"]["Enums"]["purchase_status"]
          supplier_id: string | null
          total_minor_units: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          currency?: string
          facility_id: string
          id?: string
          invoice_number?: string | null
          notes?: string | null
          organisation_id: string
          purchase_request_id?: string | null
          purchased_on?: string
          recorded_by?: string | null
          status?: Database["public"]["Enums"]["purchase_status"]
          supplier_id?: string | null
          total_minor_units?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          currency?: string
          facility_id?: string
          id?: string
          invoice_number?: string | null
          notes?: string | null
          organisation_id?: string
          purchase_request_id?: string | null
          purchased_on?: string
          recorded_by?: string | null
          status?: Database["public"]["Enums"]["purchase_status"]
          supplier_id?: string | null
          total_minor_units?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "purchases_facility_id_fkey"
            columns: ["facility_id"]
            isOneToOne: false
            referencedRelation: "care_facilities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "purchases_facility_id_fkey"
            columns: ["facility_id"]
            isOneToOne: false
            referencedRelation: "care_occupancy"
            referencedColumns: ["facility_id"]
          },
          {
            foreignKeyName: "purchases_organisation_id_fkey"
            columns: ["organisation_id"]
            isOneToOne: false
            referencedRelation: "organisations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "purchases_purchase_request_id_fkey"
            columns: ["purchase_request_id"]
            isOneToOne: false
            referencedRelation: "purchase_requests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "purchases_recorded_by_fkey"
            columns: ["recorded_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "purchases_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
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
      resident_access_events: {
        Row: {
          action: string
          created_at: string
          id: string
          metadata: Json
          organisation_id: string
          resident_id: string
          user_id: string | null
        }
        Insert: {
          action?: string
          created_at?: string
          id?: string
          metadata?: Json
          organisation_id: string
          resident_id: string
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string
          id?: string
          metadata?: Json
          organisation_id?: string
          resident_id?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "resident_access_events_organisation_id_fkey"
            columns: ["organisation_id"]
            isOneToOne: false
            referencedRelation: "organisations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "resident_access_events_resident_id_fkey"
            columns: ["resident_id"]
            isOneToOne: false
            referencedRelation: "residents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "resident_access_events_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      resident_consents: {
        Row: {
          consent_type: Database["public"]["Enums"]["resident_consent_type"]
          created_at: string
          effective_from: string
          evidence_reference: string | null
          expires_on: string | null
          granted: boolean
          granted_by_name: string | null
          id: string
          notes: string | null
          organisation_id: string
          recorded_by: string | null
          resident_id: string
          withdrawn_at: string | null
        }
        Insert: {
          consent_type: Database["public"]["Enums"]["resident_consent_type"]
          created_at?: string
          effective_from?: string
          evidence_reference?: string | null
          expires_on?: string | null
          granted: boolean
          granted_by_name?: string | null
          id?: string
          notes?: string | null
          organisation_id: string
          recorded_by?: string | null
          resident_id: string
          withdrawn_at?: string | null
        }
        Update: {
          consent_type?: Database["public"]["Enums"]["resident_consent_type"]
          created_at?: string
          effective_from?: string
          evidence_reference?: string | null
          expires_on?: string | null
          granted?: boolean
          granted_by_name?: string | null
          id?: string
          notes?: string | null
          organisation_id?: string
          recorded_by?: string | null
          resident_id?: string
          withdrawn_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "resident_consents_organisation_id_fkey"
            columns: ["organisation_id"]
            isOneToOne: false
            referencedRelation: "organisations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "resident_consents_recorded_by_fkey"
            columns: ["recorded_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "resident_consents_resident_id_fkey"
            columns: ["resident_id"]
            isOneToOne: false
            referencedRelation: "residents"
            referencedColumns: ["id"]
          },
        ]
      }
      resident_contacts: {
        Row: {
          created_at: string
          created_by: string | null
          email: string | null
          id: string
          is_authorised_representative: boolean
          is_emergency: boolean
          name: string
          notes: string | null
          organisation_id: string
          phone: string | null
          priority: number
          relationship: string | null
          resident_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          email?: string | null
          id?: string
          is_authorised_representative?: boolean
          is_emergency?: boolean
          name: string
          notes?: string | null
          organisation_id: string
          phone?: string | null
          priority?: number
          relationship?: string | null
          resident_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          email?: string | null
          id?: string
          is_authorised_representative?: boolean
          is_emergency?: boolean
          name?: string
          notes?: string | null
          organisation_id?: string
          phone?: string | null
          priority?: number
          relationship?: string | null
          resident_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "resident_contacts_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "resident_contacts_organisation_id_fkey"
            columns: ["organisation_id"]
            isOneToOne: false
            referencedRelation: "organisations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "resident_contacts_resident_id_fkey"
            columns: ["resident_id"]
            isOneToOne: false
            referencedRelation: "residents"
            referencedColumns: ["id"]
          },
        ]
      }
      resident_relationships: {
        Row: {
          access_level: Database["public"]["Enums"]["resident_access_level"]
          created_at: string
          id: string
          invited_by: string | null
          organisation_id: string
          relationship: string | null
          resident_id: string
          revoked_at: string | null
          user_id: string
        }
        Insert: {
          access_level?: Database["public"]["Enums"]["resident_access_level"]
          created_at?: string
          id?: string
          invited_by?: string | null
          organisation_id: string
          relationship?: string | null
          resident_id: string
          revoked_at?: string | null
          user_id: string
        }
        Update: {
          access_level?: Database["public"]["Enums"]["resident_access_level"]
          created_at?: string
          id?: string
          invited_by?: string | null
          organisation_id?: string
          relationship?: string | null
          resident_id?: string
          revoked_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "resident_relationships_invited_by_fkey"
            columns: ["invited_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "resident_relationships_organisation_id_fkey"
            columns: ["organisation_id"]
            isOneToOne: false
            referencedRelation: "organisations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "resident_relationships_resident_id_fkey"
            columns: ["resident_id"]
            isOneToOne: false
            referencedRelation: "residents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "resident_relationships_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      residents: {
        Row: {
          accessibility_needs: string | null
          admission_date: string
          care_level: string | null
          care_requirements: string | null
          communication_notes: string | null
          created_at: string
          created_by: string | null
          date_of_birth: string | null
          dietary_notes: string | null
          discharge_date: string | null
          facility_id: string
          first_name: string
          gender: string | null
          id: string
          last_name: string
          medical_notes: string | null
          mobility_notes: string | null
          organisation_id: string
          preferred_name: string | null
          reference: string
          room_number: string | null
          status: Database["public"]["Enums"]["resident_status"]
          updated_at: string
        }
        Insert: {
          accessibility_needs?: string | null
          admission_date?: string
          care_level?: string | null
          care_requirements?: string | null
          communication_notes?: string | null
          created_at?: string
          created_by?: string | null
          date_of_birth?: string | null
          dietary_notes?: string | null
          discharge_date?: string | null
          facility_id: string
          first_name: string
          gender?: string | null
          id?: string
          last_name: string
          medical_notes?: string | null
          mobility_notes?: string | null
          organisation_id: string
          preferred_name?: string | null
          reference: string
          room_number?: string | null
          status?: Database["public"]["Enums"]["resident_status"]
          updated_at?: string
        }
        Update: {
          accessibility_needs?: string | null
          admission_date?: string
          care_level?: string | null
          care_requirements?: string | null
          communication_notes?: string | null
          created_at?: string
          created_by?: string | null
          date_of_birth?: string | null
          dietary_notes?: string | null
          discharge_date?: string | null
          facility_id?: string
          first_name?: string
          gender?: string | null
          id?: string
          last_name?: string
          medical_notes?: string | null
          mobility_notes?: string | null
          organisation_id?: string
          preferred_name?: string | null
          reference?: string
          room_number?: string | null
          status?: Database["public"]["Enums"]["resident_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "residents_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "residents_facility_id_fkey"
            columns: ["facility_id"]
            isOneToOne: false
            referencedRelation: "care_facilities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "residents_facility_id_fkey"
            columns: ["facility_id"]
            isOneToOne: false
            referencedRelation: "care_occupancy"
            referencedColumns: ["facility_id"]
          },
          {
            foreignKeyName: "residents_organisation_id_fkey"
            columns: ["organisation_id"]
            isOneToOne: false
            referencedRelation: "organisations"
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
      scholarship_applications: {
        Row: {
          applicant_id: string
          created_at: string
          decision_notes: string | null
          evidence_references: Json
          id: string
          organisation_id: string
          programme_id: string
          reviewed_at: string | null
          reviewer_id: string | null
          statement: string
          status: Database["public"]["Enums"]["scholarship_application_status"]
          updated_at: string
        }
        Insert: {
          applicant_id: string
          created_at?: string
          decision_notes?: string | null
          evidence_references?: Json
          id?: string
          organisation_id: string
          programme_id: string
          reviewed_at?: string | null
          reviewer_id?: string | null
          statement: string
          status?: Database["public"]["Enums"]["scholarship_application_status"]
          updated_at?: string
        }
        Update: {
          applicant_id?: string
          created_at?: string
          decision_notes?: string | null
          evidence_references?: Json
          id?: string
          organisation_id?: string
          programme_id?: string
          reviewed_at?: string | null
          reviewer_id?: string | null
          statement?: string
          status?: Database["public"]["Enums"]["scholarship_application_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "scholarship_applications_applicant_id_fkey"
            columns: ["applicant_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "scholarship_applications_organisation_id_fkey"
            columns: ["organisation_id"]
            isOneToOne: false
            referencedRelation: "organisations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "scholarship_applications_programme_id_fkey"
            columns: ["programme_id"]
            isOneToOne: false
            referencedRelation: "scholarship_programmes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "scholarship_applications_reviewer_id_fkey"
            columns: ["reviewer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      scholarship_awards: {
        Row: {
          accepted_at: string | null
          amount_minor_units: number
          applicant_id: string
          application_id: string
          awarded_at: string
          awarded_by: string | null
          completion_outcome: string | null
          course_id: string | null
          coverage: Database["public"]["Enums"]["scholarship_coverage"]
          created_at: string
          currency: string
          employment_outcome: string | null
          id: string
          internship_outcome: string | null
          organisation_id: string
          outcome_shareable: boolean
          programme_id: string
          status: Database["public"]["Enums"]["scholarship_award_status"]
          updated_at: string
        }
        Insert: {
          accepted_at?: string | null
          amount_minor_units: number
          applicant_id: string
          application_id: string
          awarded_at?: string
          awarded_by?: string | null
          completion_outcome?: string | null
          course_id?: string | null
          coverage?: Database["public"]["Enums"]["scholarship_coverage"]
          created_at?: string
          currency?: string
          employment_outcome?: string | null
          id?: string
          internship_outcome?: string | null
          organisation_id: string
          outcome_shareable?: boolean
          programme_id: string
          status?: Database["public"]["Enums"]["scholarship_award_status"]
          updated_at?: string
        }
        Update: {
          accepted_at?: string | null
          amount_minor_units?: number
          applicant_id?: string
          application_id?: string
          awarded_at?: string
          awarded_by?: string | null
          completion_outcome?: string | null
          course_id?: string | null
          coverage?: Database["public"]["Enums"]["scholarship_coverage"]
          created_at?: string
          currency?: string
          employment_outcome?: string | null
          id?: string
          internship_outcome?: string | null
          organisation_id?: string
          outcome_shareable?: boolean
          programme_id?: string
          status?: Database["public"]["Enums"]["scholarship_award_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "scholarship_awards_applicant_id_fkey"
            columns: ["applicant_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "scholarship_awards_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: true
            referencedRelation: "scholarship_applications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "scholarship_awards_awarded_by_fkey"
            columns: ["awarded_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "scholarship_awards_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "scholarship_awards_organisation_id_fkey"
            columns: ["organisation_id"]
            isOneToOne: false
            referencedRelation: "organisations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "scholarship_awards_programme_id_fkey"
            columns: ["programme_id"]
            isOneToOne: false
            referencedRelation: "scholarship_programmes"
            referencedColumns: ["id"]
          },
        ]
      }
      scholarship_programmes: {
        Row: {
          closes_on: string | null
          course_id: string | null
          coverage: Database["public"]["Enums"]["scholarship_coverage"]
          created_at: string
          created_by: string | null
          currency: string
          description: string | null
          eligibility: string | null
          id: string
          is_public: boolean
          max_award_minor_units: number
          name: string
          opens_on: string
          organisation_id: string
          slug: string
          status: Database["public"]["Enums"]["scholarship_programme_status"]
          updated_at: string
        }
        Insert: {
          closes_on?: string | null
          course_id?: string | null
          coverage?: Database["public"]["Enums"]["scholarship_coverage"]
          created_at?: string
          created_by?: string | null
          currency?: string
          description?: string | null
          eligibility?: string | null
          id?: string
          is_public?: boolean
          max_award_minor_units: number
          name: string
          opens_on?: string
          organisation_id: string
          slug: string
          status?: Database["public"]["Enums"]["scholarship_programme_status"]
          updated_at?: string
        }
        Update: {
          closes_on?: string | null
          course_id?: string | null
          coverage?: Database["public"]["Enums"]["scholarship_coverage"]
          created_at?: string
          created_by?: string | null
          currency?: string
          description?: string | null
          eligibility?: string | null
          id?: string
          is_public?: boolean
          max_award_minor_units?: number
          name?: string
          opens_on?: string
          organisation_id?: string
          slug?: string
          status?: Database["public"]["Enums"]["scholarship_programme_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "scholarship_programmes_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "scholarship_programmes_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "scholarship_programmes_organisation_id_fkey"
            columns: ["organisation_id"]
            isOneToOne: false
            referencedRelation: "organisations"
            referencedColumns: ["id"]
          },
        ]
      }
      service_invoice_counters: {
        Row: {
          last_value: number
          organisation_id: string
          period: string
        }
        Insert: {
          last_value?: number
          organisation_id: string
          period: string
        }
        Update: {
          last_value?: number
          organisation_id?: string
          period?: string
        }
        Relationships: [
          {
            foreignKeyName: "service_invoice_counters_organisation_id_fkey"
            columns: ["organisation_id"]
            isOneToOne: false
            referencedRelation: "organisations"
            referencedColumns: ["id"]
          },
        ]
      }
      service_invoice_items: {
        Row: {
          created_at: string
          description: string
          id: string
          invoice_id: string
          line_total_minor_units: number | null
          organisation_id: string
          quantity: number
          unit_price_minor_units: number
        }
        Insert: {
          created_at?: string
          description: string
          id?: string
          invoice_id: string
          line_total_minor_units?: number | null
          organisation_id: string
          quantity: number
          unit_price_minor_units?: number
        }
        Update: {
          created_at?: string
          description?: string
          id?: string
          invoice_id?: string
          line_total_minor_units?: number | null
          organisation_id?: string
          quantity?: number
          unit_price_minor_units?: number
        }
        Relationships: [
          {
            foreignKeyName: "service_invoice_items_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "care_invoice_ageing"
            referencedColumns: ["invoice_id"]
          },
          {
            foreignKeyName: "service_invoice_items_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "service_invoices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "service_invoice_items_organisation_id_fkey"
            columns: ["organisation_id"]
            isOneToOne: false
            referencedRelation: "organisations"
            referencedColumns: ["id"]
          },
        ]
      }
      service_invoices: {
        Row: {
          amount_paid_minor_units: number
          created_at: string
          created_by: string | null
          currency: string
          due_date: string
          facility_id: string
          id: string
          invoice_number: string
          issue_date: string
          notes: string | null
          organisation_id: string
          payer_contact: string | null
          payer_name: string
          resident_id: string | null
          status: Database["public"]["Enums"]["service_invoice_status"]
          subtotal_minor_units: number
          total_minor_units: number
          updated_at: string
        }
        Insert: {
          amount_paid_minor_units?: number
          created_at?: string
          created_by?: string | null
          currency?: string
          due_date: string
          facility_id: string
          id?: string
          invoice_number: string
          issue_date?: string
          notes?: string | null
          organisation_id: string
          payer_contact?: string | null
          payer_name: string
          resident_id?: string | null
          status?: Database["public"]["Enums"]["service_invoice_status"]
          subtotal_minor_units?: number
          total_minor_units?: number
          updated_at?: string
        }
        Update: {
          amount_paid_minor_units?: number
          created_at?: string
          created_by?: string | null
          currency?: string
          due_date?: string
          facility_id?: string
          id?: string
          invoice_number?: string
          issue_date?: string
          notes?: string | null
          organisation_id?: string
          payer_contact?: string | null
          payer_name?: string
          resident_id?: string | null
          status?: Database["public"]["Enums"]["service_invoice_status"]
          subtotal_minor_units?: number
          total_minor_units?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "service_invoices_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "service_invoices_facility_id_fkey"
            columns: ["facility_id"]
            isOneToOne: false
            referencedRelation: "care_facilities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "service_invoices_facility_id_fkey"
            columns: ["facility_id"]
            isOneToOne: false
            referencedRelation: "care_occupancy"
            referencedColumns: ["facility_id"]
          },
          {
            foreignKeyName: "service_invoices_organisation_id_fkey"
            columns: ["organisation_id"]
            isOneToOne: false
            referencedRelation: "organisations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "service_invoices_resident_id_fkey"
            columns: ["resident_id"]
            isOneToOne: false
            referencedRelation: "residents"
            referencedColumns: ["id"]
          },
        ]
      }
      service_payments: {
        Row: {
          amount_minor_units: number
          created_at: string
          id: string
          invoice_id: string
          method: Database["public"]["Enums"]["service_payment_method"]
          notes: string | null
          organisation_id: string
          paid_at: string
          receipt_reference: string | null
          recorded_by: string | null
          reference: string | null
        }
        Insert: {
          amount_minor_units: number
          created_at?: string
          id?: string
          invoice_id: string
          method?: Database["public"]["Enums"]["service_payment_method"]
          notes?: string | null
          organisation_id: string
          paid_at?: string
          receipt_reference?: string | null
          recorded_by?: string | null
          reference?: string | null
        }
        Update: {
          amount_minor_units?: number
          created_at?: string
          id?: string
          invoice_id?: string
          method?: Database["public"]["Enums"]["service_payment_method"]
          notes?: string | null
          organisation_id?: string
          paid_at?: string
          receipt_reference?: string | null
          recorded_by?: string | null
          reference?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "service_payments_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "care_invoice_ageing"
            referencedColumns: ["invoice_id"]
          },
          {
            foreignKeyName: "service_payments_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "service_invoices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "service_payments_organisation_id_fkey"
            columns: ["organisation_id"]
            isOneToOne: false
            referencedRelation: "organisations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "service_payments_recorded_by_fkey"
            columns: ["recorded_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      service_refunds: {
        Row: {
          amount_minor_units: number
          created_at: string
          id: string
          invoice_id: string
          organisation_id: string
          payment_id: string
          reason: string
          recorded_by: string | null
          refunded_at: string
        }
        Insert: {
          amount_minor_units: number
          created_at?: string
          id?: string
          invoice_id: string
          organisation_id: string
          payment_id: string
          reason: string
          recorded_by?: string | null
          refunded_at?: string
        }
        Update: {
          amount_minor_units?: number
          created_at?: string
          id?: string
          invoice_id?: string
          organisation_id?: string
          payment_id?: string
          reason?: string
          recorded_by?: string | null
          refunded_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "service_refunds_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "care_invoice_ageing"
            referencedColumns: ["invoice_id"]
          },
          {
            foreignKeyName: "service_refunds_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "service_invoices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "service_refunds_organisation_id_fkey"
            columns: ["organisation_id"]
            isOneToOne: false
            referencedRelation: "organisations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "service_refunds_payment_id_fkey"
            columns: ["payment_id"]
            isOneToOne: false
            referencedRelation: "service_payments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "service_refunds_recorded_by_fkey"
            columns: ["recorded_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      shift_assignments: {
        Row: {
          assigned_by: string | null
          created_at: string
          id: string
          organisation_id: string
          shift_id: string
          staff_user_id: string
          status: Database["public"]["Enums"]["shift_assignment_status"]
          updated_at: string
        }
        Insert: {
          assigned_by?: string | null
          created_at?: string
          id?: string
          organisation_id: string
          shift_id: string
          staff_user_id: string
          status?: Database["public"]["Enums"]["shift_assignment_status"]
          updated_at?: string
        }
        Update: {
          assigned_by?: string | null
          created_at?: string
          id?: string
          organisation_id?: string
          shift_id?: string
          staff_user_id?: string
          status?: Database["public"]["Enums"]["shift_assignment_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "shift_assignments_assigned_by_fkey"
            columns: ["assigned_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shift_assignments_organisation_id_fkey"
            columns: ["organisation_id"]
            isOneToOne: false
            referencedRelation: "organisations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shift_assignments_shift_id_fkey"
            columns: ["shift_id"]
            isOneToOne: false
            referencedRelation: "care_staffing_coverage"
            referencedColumns: ["shift_id"]
          },
          {
            foreignKeyName: "shift_assignments_shift_id_fkey"
            columns: ["shift_id"]
            isOneToOne: false
            referencedRelation: "shift_schedules"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shift_assignments_staff_user_id_fkey"
            columns: ["staff_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      shift_attendance: {
        Row: {
          assignment_id: string
          break_minutes: number
          clock_in_at: string | null
          clock_out_at: string | null
          created_at: string
          id: string
          notes: string | null
          organisation_id: string
          recorded_by: string | null
          source: string | null
          updated_at: string
        }
        Insert: {
          assignment_id: string
          break_minutes?: number
          clock_in_at?: string | null
          clock_out_at?: string | null
          created_at?: string
          id?: string
          notes?: string | null
          organisation_id: string
          recorded_by?: string | null
          source?: string | null
          updated_at?: string
        }
        Update: {
          assignment_id?: string
          break_minutes?: number
          clock_in_at?: string | null
          clock_out_at?: string | null
          created_at?: string
          id?: string
          notes?: string | null
          organisation_id?: string
          recorded_by?: string | null
          source?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "shift_attendance_assignment_id_fkey"
            columns: ["assignment_id"]
            isOneToOne: true
            referencedRelation: "shift_assignments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shift_attendance_organisation_id_fkey"
            columns: ["organisation_id"]
            isOneToOne: false
            referencedRelation: "organisations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shift_attendance_recorded_by_fkey"
            columns: ["recorded_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      shift_handovers: {
        Row: {
          accepted_at: string | null
          accepted_by: string | null
          created_at: string
          facility_id: string
          id: string
          organisation_id: string
          outstanding_tasks: string | null
          shift_id: string
          submitted_at: string
          submitted_by: string | null
          summary: string
        }
        Insert: {
          accepted_at?: string | null
          accepted_by?: string | null
          created_at?: string
          facility_id: string
          id?: string
          organisation_id: string
          outstanding_tasks?: string | null
          shift_id: string
          submitted_at?: string
          submitted_by?: string | null
          summary: string
        }
        Update: {
          accepted_at?: string | null
          accepted_by?: string | null
          created_at?: string
          facility_id?: string
          id?: string
          organisation_id?: string
          outstanding_tasks?: string | null
          shift_id?: string
          submitted_at?: string
          submitted_by?: string | null
          summary?: string
        }
        Relationships: [
          {
            foreignKeyName: "shift_handovers_accepted_by_fkey"
            columns: ["accepted_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shift_handovers_facility_id_fkey"
            columns: ["facility_id"]
            isOneToOne: false
            referencedRelation: "care_facilities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shift_handovers_facility_id_fkey"
            columns: ["facility_id"]
            isOneToOne: false
            referencedRelation: "care_occupancy"
            referencedColumns: ["facility_id"]
          },
          {
            foreignKeyName: "shift_handovers_organisation_id_fkey"
            columns: ["organisation_id"]
            isOneToOne: false
            referencedRelation: "organisations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shift_handovers_shift_id_fkey"
            columns: ["shift_id"]
            isOneToOne: false
            referencedRelation: "care_staffing_coverage"
            referencedColumns: ["shift_id"]
          },
          {
            foreignKeyName: "shift_handovers_shift_id_fkey"
            columns: ["shift_id"]
            isOneToOne: false
            referencedRelation: "shift_schedules"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shift_handovers_submitted_by_fkey"
            columns: ["submitted_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      shift_schedules: {
        Row: {
          created_at: string
          created_by: string | null
          ends_at: string
          facility_id: string
          id: string
          notes: string | null
          organisation_id: string
          required_qualification: string | null
          required_staff: number
          starts_at: string
          status: Database["public"]["Enums"]["shift_status"]
          title: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          ends_at: string
          facility_id: string
          id?: string
          notes?: string | null
          organisation_id: string
          required_qualification?: string | null
          required_staff?: number
          starts_at: string
          status?: Database["public"]["Enums"]["shift_status"]
          title?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          ends_at?: string
          facility_id?: string
          id?: string
          notes?: string | null
          organisation_id?: string
          required_qualification?: string | null
          required_staff?: number
          starts_at?: string
          status?: Database["public"]["Enums"]["shift_status"]
          title?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "shift_schedules_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shift_schedules_facility_id_fkey"
            columns: ["facility_id"]
            isOneToOne: false
            referencedRelation: "care_facilities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shift_schedules_facility_id_fkey"
            columns: ["facility_id"]
            isOneToOne: false
            referencedRelation: "care_occupancy"
            referencedColumns: ["facility_id"]
          },
          {
            foreignKeyName: "shift_schedules_organisation_id_fkey"
            columns: ["organisation_id"]
            isOneToOne: false
            referencedRelation: "organisations"
            referencedColumns: ["id"]
          },
        ]
      }
      staff_documents: {
        Row: {
          created_at: string
          created_by: string | null
          document_type: string
          expires_on: string | null
          file_reference: string | null
          id: string
          notes: string | null
          organisation_id: string
          staff_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          document_type: string
          expires_on?: string | null
          file_reference?: string | null
          id?: string
          notes?: string | null
          organisation_id: string
          staff_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          document_type?: string
          expires_on?: string | null
          file_reference?: string | null
          id?: string
          notes?: string | null
          organisation_id?: string
          staff_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "staff_documents_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "staff_documents_organisation_id_fkey"
            columns: ["organisation_id"]
            isOneToOne: false
            referencedRelation: "organisations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "staff_documents_staff_id_fkey"
            columns: ["staff_id"]
            isOneToOne: false
            referencedRelation: "care_staff_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "staff_documents_staff_id_fkey"
            columns: ["staff_id"]
            isOneToOne: false
            referencedRelation: "care_training_compliance"
            referencedColumns: ["staff_id"]
          },
        ]
      }
      staff_qualifications: {
        Row: {
          awarded_on: string | null
          code: string
          created_at: string
          created_by: string | null
          evidence_reference: string | null
          expires_on: string | null
          id: string
          name: string
          organisation_id: string
          staff_id: string
          updated_at: string
          verification_status: Database["public"]["Enums"]["verification_status"]
        }
        Insert: {
          awarded_on?: string | null
          code: string
          created_at?: string
          created_by?: string | null
          evidence_reference?: string | null
          expires_on?: string | null
          id?: string
          name: string
          organisation_id: string
          staff_id: string
          updated_at?: string
          verification_status?: Database["public"]["Enums"]["verification_status"]
        }
        Update: {
          awarded_on?: string | null
          code?: string
          created_at?: string
          created_by?: string | null
          evidence_reference?: string | null
          expires_on?: string | null
          id?: string
          name?: string
          organisation_id?: string
          staff_id?: string
          updated_at?: string
          verification_status?: Database["public"]["Enums"]["verification_status"]
        }
        Relationships: [
          {
            foreignKeyName: "staff_qualifications_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "staff_qualifications_organisation_id_fkey"
            columns: ["organisation_id"]
            isOneToOne: false
            referencedRelation: "organisations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "staff_qualifications_staff_id_fkey"
            columns: ["staff_id"]
            isOneToOne: false
            referencedRelation: "care_staff_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "staff_qualifications_staff_id_fkey"
            columns: ["staff_id"]
            isOneToOne: false
            referencedRelation: "care_training_compliance"
            referencedColumns: ["staff_id"]
          },
        ]
      }
      staff_training_records: {
        Row: {
          completed_on: string
          created_at: string
          created_by: string | null
          evidence_reference: string | null
          expires_on: string | null
          id: string
          organisation_id: string
          staff_id: string
          title: string
          updated_at: string
        }
        Insert: {
          completed_on?: string
          created_at?: string
          created_by?: string | null
          evidence_reference?: string | null
          expires_on?: string | null
          id?: string
          organisation_id: string
          staff_id: string
          title: string
          updated_at?: string
        }
        Update: {
          completed_on?: string
          created_at?: string
          created_by?: string | null
          evidence_reference?: string | null
          expires_on?: string | null
          id?: string
          organisation_id?: string
          staff_id?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "staff_training_records_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "staff_training_records_organisation_id_fkey"
            columns: ["organisation_id"]
            isOneToOne: false
            referencedRelation: "organisations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "staff_training_records_staff_id_fkey"
            columns: ["staff_id"]
            isOneToOne: false
            referencedRelation: "care_staff_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "staff_training_records_staff_id_fkey"
            columns: ["staff_id"]
            isOneToOne: false
            referencedRelation: "care_training_compliance"
            referencedColumns: ["staff_id"]
          },
        ]
      }
      subscription_events: {
        Row: {
          actor_id: string | null
          created_at: string
          event_type: Database["public"]["Enums"]["subscription_event_type"]
          from_status: Database["public"]["Enums"]["subscription_status"] | null
          id: string
          metadata: Json
          organisation_id: string
          subscription_id: string
          to_status: Database["public"]["Enums"]["subscription_status"] | null
        }
        Insert: {
          actor_id?: string | null
          created_at?: string
          event_type: Database["public"]["Enums"]["subscription_event_type"]
          from_status?:
            | Database["public"]["Enums"]["subscription_status"]
            | null
          id?: string
          metadata?: Json
          organisation_id: string
          subscription_id: string
          to_status?: Database["public"]["Enums"]["subscription_status"] | null
        }
        Update: {
          actor_id?: string | null
          created_at?: string
          event_type?: Database["public"]["Enums"]["subscription_event_type"]
          from_status?:
            | Database["public"]["Enums"]["subscription_status"]
            | null
          id?: string
          metadata?: Json
          organisation_id?: string
          subscription_id?: string
          to_status?: Database["public"]["Enums"]["subscription_status"] | null
        }
        Relationships: [
          {
            foreignKeyName: "subscription_events_actor_id_fkey"
            columns: ["actor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "subscription_events_organisation_id_fkey"
            columns: ["organisation_id"]
            isOneToOne: false
            referencedRelation: "organisations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "subscription_events_subscription_id_fkey"
            columns: ["subscription_id"]
            isOneToOne: false
            referencedRelation: "organisation_subscriptions"
            referencedColumns: ["id"]
          },
        ]
      }
      subscription_payments: {
        Row: {
          amount_minor_units: number
          created_at: string
          currency: string
          id: string
          notes: string | null
          organisation_id: string
          period_end: string
          period_start: string
          provider_reference: string | null
          receipt_reference: string | null
          recorded_by: string | null
          status: Database["public"]["Enums"]["subscription_payment_status"]
          subscription_id: string
        }
        Insert: {
          amount_minor_units: number
          created_at?: string
          currency?: string
          id?: string
          notes?: string | null
          organisation_id: string
          period_end: string
          period_start: string
          provider_reference?: string | null
          receipt_reference?: string | null
          recorded_by?: string | null
          status?: Database["public"]["Enums"]["subscription_payment_status"]
          subscription_id: string
        }
        Update: {
          amount_minor_units?: number
          created_at?: string
          currency?: string
          id?: string
          notes?: string | null
          organisation_id?: string
          period_end?: string
          period_start?: string
          provider_reference?: string | null
          receipt_reference?: string | null
          recorded_by?: string | null
          status?: Database["public"]["Enums"]["subscription_payment_status"]
          subscription_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "subscription_payments_organisation_id_fkey"
            columns: ["organisation_id"]
            isOneToOne: false
            referencedRelation: "organisations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "subscription_payments_recorded_by_fkey"
            columns: ["recorded_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "subscription_payments_subscription_id_fkey"
            columns: ["subscription_id"]
            isOneToOne: false
            referencedRelation: "organisation_subscriptions"
            referencedColumns: ["id"]
          },
        ]
      }
      subscription_plans: {
        Row: {
          annual_price_minor_units: number | null
          code: string
          created_at: string
          currency: string
          description: string | null
          grace_days: number
          id: string
          is_active: boolean
          max_facilities: number | null
          max_users: number | null
          monthly_price_minor_units: number | null
          name: string
          permitted_modules: string[]
          sort_order: number
          storage_allowance_mb: number | null
          trial_days: number
          updated_at: string
          usage_limits: Json
        }
        Insert: {
          annual_price_minor_units?: number | null
          code: string
          created_at?: string
          currency?: string
          description?: string | null
          grace_days?: number
          id?: string
          is_active?: boolean
          max_facilities?: number | null
          max_users?: number | null
          monthly_price_minor_units?: number | null
          name: string
          permitted_modules?: string[]
          sort_order?: number
          storage_allowance_mb?: number | null
          trial_days?: number
          updated_at?: string
          usage_limits?: Json
        }
        Update: {
          annual_price_minor_units?: number | null
          code?: string
          created_at?: string
          currency?: string
          description?: string | null
          grace_days?: number
          id?: string
          is_active?: boolean
          max_facilities?: number | null
          max_users?: number | null
          monthly_price_minor_units?: number | null
          name?: string
          permitted_modules?: string[]
          sort_order?: number
          storage_allowance_mb?: number | null
          trial_days?: number
          updated_at?: string
          usage_limits?: Json
        }
        Relationships: []
      }
      suppliers: {
        Row: {
          address: string | null
          contact_name: string | null
          created_at: string
          created_by: string | null
          email: string | null
          id: string
          name: string
          notes: string | null
          organisation_id: string
          phone: string | null
          status: Database["public"]["Enums"]["supplier_status"]
          updated_at: string
        }
        Insert: {
          address?: string | null
          contact_name?: string | null
          created_at?: string
          created_by?: string | null
          email?: string | null
          id?: string
          name: string
          notes?: string | null
          organisation_id: string
          phone?: string | null
          status?: Database["public"]["Enums"]["supplier_status"]
          updated_at?: string
        }
        Update: {
          address?: string | null
          contact_name?: string | null
          created_at?: string
          created_by?: string | null
          email?: string | null
          id?: string
          name?: string
          notes?: string | null
          organisation_id?: string
          phone?: string | null
          status?: Database["public"]["Enums"]["supplier_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "suppliers_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "suppliers_organisation_id_fkey"
            columns: ["organisation_id"]
            isOneToOne: false
            referencedRelation: "organisations"
            referencedColumns: ["id"]
          },
        ]
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
      care_expense_summary: {
        Row: {
          category: string | null
          expense_count: number | null
          facility_id: string | null
          month: string | null
          organisation_id: string | null
          total_minor_units: number | null
        }
        Relationships: [
          {
            foreignKeyName: "expense_records_facility_id_fkey"
            columns: ["facility_id"]
            isOneToOne: false
            referencedRelation: "care_facilities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "expense_records_facility_id_fkey"
            columns: ["facility_id"]
            isOneToOne: false
            referencedRelation: "care_occupancy"
            referencedColumns: ["facility_id"]
          },
          {
            foreignKeyName: "expense_records_organisation_id_fkey"
            columns: ["organisation_id"]
            isOneToOne: false
            referencedRelation: "organisations"
            referencedColumns: ["id"]
          },
        ]
      }
      care_incident_summary: {
        Row: {
          category: Database["public"]["Enums"]["incident_category"] | null
          facility_id: string | null
          incident_count: number | null
          organisation_id: string | null
          safeguarding_count: number | null
          severity: Database["public"]["Enums"]["incident_severity"] | null
          status: Database["public"]["Enums"]["incident_status"] | null
        }
        Relationships: [
          {
            foreignKeyName: "incidents_facility_id_fkey"
            columns: ["facility_id"]
            isOneToOne: false
            referencedRelation: "care_facilities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "incidents_facility_id_fkey"
            columns: ["facility_id"]
            isOneToOne: false
            referencedRelation: "care_occupancy"
            referencedColumns: ["facility_id"]
          },
          {
            foreignKeyName: "incidents_organisation_id_fkey"
            columns: ["organisation_id"]
            isOneToOne: false
            referencedRelation: "organisations"
            referencedColumns: ["id"]
          },
        ]
      }
      care_inventory_status: {
        Row: {
          below_reorder: boolean | null
          category: string | null
          current_quantity: number | null
          facility_id: string | null
          item_id: string | null
          name: string | null
          organisation_id: string | null
          reorder_level: number | null
          sku: string | null
          unit: string | null
        }
        Relationships: [
          {
            foreignKeyName: "inventory_items_facility_id_fkey"
            columns: ["facility_id"]
            isOneToOne: false
            referencedRelation: "care_facilities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_items_facility_id_fkey"
            columns: ["facility_id"]
            isOneToOne: false
            referencedRelation: "care_occupancy"
            referencedColumns: ["facility_id"]
          },
          {
            foreignKeyName: "inventory_items_organisation_id_fkey"
            columns: ["organisation_id"]
            isOneToOne: false
            referencedRelation: "organisations"
            referencedColumns: ["id"]
          },
        ]
      }
      care_invoice_ageing: {
        Row: {
          amount_paid_minor_units: number | null
          days_overdue: number | null
          due_date: string | null
          facility_id: string | null
          invoice_id: string | null
          invoice_number: string | null
          issue_date: string | null
          organisation_id: string | null
          outstanding_minor_units: number | null
          payer_name: string | null
          status: Database["public"]["Enums"]["service_invoice_status"] | null
          total_minor_units: number | null
        }
        Insert: {
          amount_paid_minor_units?: number | null
          days_overdue?: never
          due_date?: string | null
          facility_id?: string | null
          invoice_id?: string | null
          invoice_number?: string | null
          issue_date?: string | null
          organisation_id?: string | null
          outstanding_minor_units?: never
          payer_name?: string | null
          status?: Database["public"]["Enums"]["service_invoice_status"] | null
          total_minor_units?: number | null
        }
        Update: {
          amount_paid_minor_units?: number | null
          days_overdue?: never
          due_date?: string | null
          facility_id?: string | null
          invoice_id?: string | null
          invoice_number?: string | null
          issue_date?: string | null
          organisation_id?: string | null
          outstanding_minor_units?: never
          payer_name?: string | null
          status?: Database["public"]["Enums"]["service_invoice_status"] | null
          total_minor_units?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "service_invoices_facility_id_fkey"
            columns: ["facility_id"]
            isOneToOne: false
            referencedRelation: "care_facilities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "service_invoices_facility_id_fkey"
            columns: ["facility_id"]
            isOneToOne: false
            referencedRelation: "care_occupancy"
            referencedColumns: ["facility_id"]
          },
          {
            foreignKeyName: "service_invoices_organisation_id_fkey"
            columns: ["organisation_id"]
            isOneToOne: false
            referencedRelation: "organisations"
            referencedColumns: ["id"]
          },
        ]
      }
      care_occupancy: {
        Row: {
          active_residents: number | null
          capacity: number | null
          facility_id: string | null
          facility_name: string | null
          occupancy_percent: number | null
          organisation_id: string | null
        }
        Relationships: [
          {
            foreignKeyName: "care_facilities_organisation_id_fkey"
            columns: ["organisation_id"]
            isOneToOne: false
            referencedRelation: "organisations"
            referencedColumns: ["id"]
          },
        ]
      }
      care_staffing_coverage: {
        Row: {
          assigned_staff: number | null
          coverage_gap: number | null
          ends_at: string | null
          facility_id: string | null
          organisation_id: string | null
          required_staff: number | null
          shift_id: string | null
          starts_at: string | null
          status: Database["public"]["Enums"]["shift_status"] | null
        }
        Relationships: [
          {
            foreignKeyName: "shift_schedules_facility_id_fkey"
            columns: ["facility_id"]
            isOneToOne: false
            referencedRelation: "care_facilities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shift_schedules_facility_id_fkey"
            columns: ["facility_id"]
            isOneToOne: false
            referencedRelation: "care_occupancy"
            referencedColumns: ["facility_id"]
          },
          {
            foreignKeyName: "shift_schedules_organisation_id_fkey"
            columns: ["organisation_id"]
            isOneToOne: false
            referencedRelation: "organisations"
            referencedColumns: ["id"]
          },
        ]
      }
      care_training_compliance: {
        Row: {
          employment_status:
            | Database["public"]["Enums"]["care_employment_status"]
            | null
          expired_documents: number | null
          expired_qualifications: number | null
          expired_training: number | null
          organisation_id: string | null
          staff_id: string | null
          unverified_qualifications: number | null
          user_id: string | null
        }
        Relationships: [
          {
            foreignKeyName: "care_staff_profiles_organisation_id_fkey"
            columns: ["organisation_id"]
            isOneToOne: false
            referencedRelation: "organisations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "care_staff_profiles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      charity_campaign_finance: {
        Row: {
          campaign_id: string | null
          committed_minor_units: number | null
          currency: string | null
          disbursed_minor_units: number | null
          funding_target_minor_units: number | null
          organisation_id: string | null
          received_minor_units: number | null
          title: string | null
        }
        Insert: {
          campaign_id?: string | null
          committed_minor_units?: never
          currency?: string | null
          disbursed_minor_units?: never
          funding_target_minor_units?: number | null
          organisation_id?: string | null
          received_minor_units?: never
          title?: string | null
        }
        Update: {
          campaign_id?: string | null
          committed_minor_units?: never
          currency?: string | null
          disbursed_minor_units?: never
          funding_target_minor_units?: number | null
          organisation_id?: string | null
          received_minor_units?: never
          title?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "charity_campaigns_organisation_id_fkey"
            columns: ["organisation_id"]
            isOneToOne: false
            referencedRelation: "organisations"
            referencedColumns: ["id"]
          },
        ]
      }
      charity_public_campaign_progress: {
        Row: {
          campaign_id: string | null
          currency: string | null
          description: string | null
          donation_count: number | null
          ends_on: string | null
          funding_target_minor_units: number | null
          progress_percent: number | null
          purpose: string | null
          received_minor_units: number | null
          slug: string | null
          starts_on: string | null
          title: string | null
        }
        Relationships: []
      }
      charity_public_donors: {
        Row: {
          amount_minor_units: number | null
          campaign_id: string | null
          created_at: string | null
          display_name: string | null
        }
        Relationships: [
          {
            foreignKeyName: "donations_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "charity_campaign_finance"
            referencedColumns: ["campaign_id"]
          },
          {
            foreignKeyName: "donations_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "charity_campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "donations_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "charity_public_campaign_progress"
            referencedColumns: ["campaign_id"]
          },
        ]
      }
      charity_scholarship_outcomes: {
        Row: {
          award_count: number | null
          awarded_minor_units: number | null
          completions_recorded: number | null
          employment_outcomes: number | null
          internship_outcomes: number | null
          organisation_id: string | null
          programme_id: string | null
          status: Database["public"]["Enums"]["scholarship_award_status"] | null
        }
        Relationships: [
          {
            foreignKeyName: "scholarship_awards_organisation_id_fkey"
            columns: ["organisation_id"]
            isOneToOne: false
            referencedRelation: "organisations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "scholarship_awards_programme_id_fkey"
            columns: ["programme_id"]
            isOneToOne: false
            referencedRelation: "scholarship_programmes"
            referencedColumns: ["id"]
          },
        ]
      }
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
      can_access_resident: {
        Args: { p_permission?: string; p_resident: string }
        Returns: boolean
      }
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
      course_required_assessments_complete: {
        Args: { p_enrolment: string }
        Returns: boolean
      }
      course_required_lessons_complete: {
        Args: { p_enrolment: string }
        Returns: boolean
      }
      current_organisation_ids: { Args: never; Returns: string[] }
      enrol_in_course: { Args: { p_course: string }; Returns: string }
      family_resident_summaries: {
        Args: never
        Returns: {
          access_level: Database["public"]["Enums"]["resident_access_level"]
          admission_date: string
          care_level: string
          facility_name: string
          first_name: string
          last_name: string
          preferred_name: string
          relationship: string
          resident_id: string
          room_number: string
          status: Database["public"]["Enums"]["resident_status"]
        }[]
      }
      finalise_course_completion: {
        Args: { p_enrolment: string }
        Returns: Json
      }
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
      is_conversation_participant: {
        Args: { p_conversation: string }
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
      mark_conversation_read: {
        Args: { p_conversation: string }
        Returns: boolean
      }
      organisation_can_add_facility: {
        Args: { p_organisation: string }
        Returns: boolean
      }
      organisation_can_add_member: {
        Args: { p_organisation: string }
        Returns: boolean
      }
      organisation_can_write: {
        Args: { p_organisation: string }
        Returns: boolean
      }
      organisation_has_module: {
        Args: { p_module: string; p_organisation: string }
        Returns: boolean
      }
      record_referral_payout_transfer: {
        Args: {
          p_payout: string
          p_provider_reference?: string
          p_reason?: string
          p_status: string
        }
        Returns: undefined
      }
      record_resident_access: {
        Args: { p_action?: string; p_metadata?: Json; p_resident: string }
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
      send_message: {
        Args: { p_body: string; p_conversation: string }
        Returns: string
      }
      start_assessment_attempt: {
        Args: { p_assessment: string }
        Returns: Json
      }
      start_conversation: {
        Args: {
          p_body: string
          p_organisation: string
          p_participant_ids: string[]
          p_subject: string
        }
        Returns: string
      }
      submit_assessment_attempt: {
        Args: { p_answers: Json; p_attempt: string }
        Returns: Json
      }
      subscription_effective_status: {
        Args: { p_organisation: string }
        Returns: string
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
      assessment_attempt_status: "in_progress" | "submitted" | "expired"
      assessment_kind: "quiz" | "exam"
      assessment_question_type:
        | "single_choice"
        | "multiple_choice"
        | "true_false"
      assessment_status: "draft" | "published" | "archived"
      attendance_status: "present" | "absent" | "late" | "excused"
      campaign_allocation_type: "allocation" | "release"
      campaign_expense_status: "pending" | "approved" | "paid" | "void"
      campaign_review_decision: "approved" | "rejected" | "changes_requested"
      care_employment_status: "active" | "on_leave" | "suspended" | "ended"
      care_facility_status: "active" | "inactive"
      care_plan_access: "standard" | "restricted"
      care_plan_status:
        | "draft"
        | "pending_approval"
        | "active"
        | "rejected"
        | "archived"
      care_review_outcome: "accepted" | "follow_up_required" | "escalated"
      care_task_category:
        | "personal_care"
        | "meals_hydration"
        | "mobility"
        | "activities"
        | "observation"
        | "clinical"
        | "other"
      care_task_record_status: "completed" | "refused" | "not_done" | "deferred"
      charity_campaign_status:
        | "draft"
        | "pending_approval"
        | "approved"
        | "rejected"
        | "completed"
        | "archived"
      course_difficulty: "foundation" | "intermediate" | "advanced"
      course_status: "draft" | "in_review" | "published" | "archived"
      donation_status:
        | "pending"
        | "successful"
        | "partially_refunded"
        | "refunded"
        | "failed"
      employment_type:
        | "full_time"
        | "part_time"
        | "temporary"
        | "contract"
        | "internship"
      enrolment_status: "active" | "completed" | "withdrawn"
      evaluation_recommendation: "pass" | "needs_improvement" | "fail"
      evaluation_status: "draft" | "submitted"
      expense_payment_status: "unpaid" | "paid" | "reimbursed" | "void"
      incident_action_status: "open" | "in_progress" | "completed" | "cancelled"
      incident_category:
        | "fall"
        | "injury"
        | "safeguarding"
        | "medication"
        | "missing_person"
        | "property"
        | "other"
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
      inventory_movement_type:
        | "opening"
        | "purchase"
        | "issue"
        | "adjustment"
        | "wastage"
        | "return"
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
      medication_status:
        | "scheduled"
        | "administered"
        | "refused"
        | "held"
        | "omitted"
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
        | "message"
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
      purchase_request_status:
        | "draft"
        | "submitted"
        | "approved"
        | "rejected"
        | "ordered"
        | "received"
        | "cancelled"
      purchase_status: "pending" | "paid" | "partially_paid" | "void"
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
      resident_access_level: "summary" | "full"
      resident_consent_type:
        | "care"
        | "medical"
        | "data_sharing"
        | "photography"
        | "research"
        | "other"
      resident_status: "active" | "on_leave" | "discharged" | "deceased"
      scholarship_application_status:
        | "submitted"
        | "under_review"
        | "shortlisted"
        | "approved"
        | "rejected"
        | "withdrawn"
      scholarship_award_status:
        | "awarded"
        | "accepted"
        | "active"
        | "completed"
        | "withdrawn"
        | "revoked"
      scholarship_coverage: "full" | "partial"
      scholarship_programme_status: "draft" | "open" | "closed" | "archived"
      service_invoice_status:
        | "draft"
        | "issued"
        | "partially_paid"
        | "paid"
        | "overdue"
        | "void"
      service_payment_method:
        | "cash"
        | "bank_transfer"
        | "card"
        | "cheque"
        | "other"
      shift_assignment_status:
        | "assigned"
        | "confirmed"
        | "declined"
        | "absent"
        | "completed"
        | "cancelled"
      shift_status: "draft" | "published" | "completed" | "cancelled"
      subscription_billing_cycle: "monthly" | "annual"
      subscription_event_type:
        | "created"
        | "trial_started"
        | "plan_changed"
        | "renewed"
        | "payment_failed"
        | "past_due"
        | "grace_started"
        | "suspended"
        | "reactivated"
        | "cancelled"
        | "expired"
        | "settings_updated"
      subscription_payment_status: "recorded" | "void"
      subscription_status:
        | "trialing"
        | "active"
        | "past_due"
        | "grace"
        | "suspended"
        | "cancelled"
        | "expired"
      supplier_status: "active" | "inactive"
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
      assessment_attempt_status: ["in_progress", "submitted", "expired"],
      assessment_kind: ["quiz", "exam"],
      assessment_question_type: [
        "single_choice",
        "multiple_choice",
        "true_false",
      ],
      assessment_status: ["draft", "published", "archived"],
      attendance_status: ["present", "absent", "late", "excused"],
      campaign_allocation_type: ["allocation", "release"],
      campaign_expense_status: ["pending", "approved", "paid", "void"],
      campaign_review_decision: ["approved", "rejected", "changes_requested"],
      care_employment_status: ["active", "on_leave", "suspended", "ended"],
      care_facility_status: ["active", "inactive"],
      care_plan_access: ["standard", "restricted"],
      care_plan_status: [
        "draft",
        "pending_approval",
        "active",
        "rejected",
        "archived",
      ],
      care_review_outcome: ["accepted", "follow_up_required", "escalated"],
      care_task_category: [
        "personal_care",
        "meals_hydration",
        "mobility",
        "activities",
        "observation",
        "clinical",
        "other",
      ],
      care_task_record_status: ["completed", "refused", "not_done", "deferred"],
      charity_campaign_status: [
        "draft",
        "pending_approval",
        "approved",
        "rejected",
        "completed",
        "archived",
      ],
      course_difficulty: ["foundation", "intermediate", "advanced"],
      course_status: ["draft", "in_review", "published", "archived"],
      donation_status: [
        "pending",
        "successful",
        "partially_refunded",
        "refunded",
        "failed",
      ],
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
      expense_payment_status: ["unpaid", "paid", "reimbursed", "void"],
      incident_action_status: ["open", "in_progress", "completed", "cancelled"],
      incident_category: [
        "fall",
        "injury",
        "safeguarding",
        "medication",
        "missing_person",
        "property",
        "other",
      ],
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
      inventory_movement_type: [
        "opening",
        "purchase",
        "issue",
        "adjustment",
        "wastage",
        "return",
      ],
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
      medication_status: [
        "scheduled",
        "administered",
        "refused",
        "held",
        "omitted",
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
        "message",
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
      purchase_request_status: [
        "draft",
        "submitted",
        "approved",
        "rejected",
        "ordered",
        "received",
        "cancelled",
      ],
      purchase_status: ["pending", "paid", "partially_paid", "void"],
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
      resident_access_level: ["summary", "full"],
      resident_consent_type: [
        "care",
        "medical",
        "data_sharing",
        "photography",
        "research",
        "other",
      ],
      resident_status: ["active", "on_leave", "discharged", "deceased"],
      scholarship_application_status: [
        "submitted",
        "under_review",
        "shortlisted",
        "approved",
        "rejected",
        "withdrawn",
      ],
      scholarship_award_status: [
        "awarded",
        "accepted",
        "active",
        "completed",
        "withdrawn",
        "revoked",
      ],
      scholarship_coverage: ["full", "partial"],
      scholarship_programme_status: ["draft", "open", "closed", "archived"],
      service_invoice_status: [
        "draft",
        "issued",
        "partially_paid",
        "paid",
        "overdue",
        "void",
      ],
      service_payment_method: [
        "cash",
        "bank_transfer",
        "card",
        "cheque",
        "other",
      ],
      shift_assignment_status: [
        "assigned",
        "confirmed",
        "declined",
        "absent",
        "completed",
        "cancelled",
      ],
      shift_status: ["draft", "published", "completed", "cancelled"],
      subscription_billing_cycle: ["monthly", "annual"],
      subscription_event_type: [
        "created",
        "trial_started",
        "plan_changed",
        "renewed",
        "payment_failed",
        "past_due",
        "grace_started",
        "suspended",
        "reactivated",
        "cancelled",
        "expired",
        "settings_updated",
      ],
      subscription_payment_status: ["recorded", "void"],
      subscription_status: [
        "trialing",
        "active",
        "past_due",
        "grace",
        "suspended",
        "cancelled",
        "expired",
      ],
      supplier_status: ["active", "inactive"],
      verification_status: ["unverified", "pending", "verified", "rejected"],
    },
  },
} as const

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
export type AssessmentKind = Database["public"]["Enums"]["assessment_kind"];
export type AssessmentStatus = Database["public"]["Enums"]["assessment_status"];
export type AssessmentQuestionType =
  Database["public"]["Enums"]["assessment_question_type"];
export type AssessmentAttemptStatus =
  Database["public"]["Enums"]["assessment_attempt_status"];

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

// Phase 7 care operations ------------------------------------------------------

export type CareFacilityStatus = Database["public"]["Enums"]["care_facility_status"];
export type ResidentStatus = Database["public"]["Enums"]["resident_status"];
export type ResidentAccessLevel = Database["public"]["Enums"]["resident_access_level"];
export type ResidentConsentType = Database["public"]["Enums"]["resident_consent_type"];
export type CareEmploymentStatus = Database["public"]["Enums"]["care_employment_status"];
export type ShiftStatus = Database["public"]["Enums"]["shift_status"];
export type ShiftAssignmentStatus = Database["public"]["Enums"]["shift_assignment_status"];
export type CareTaskCategory = Database["public"]["Enums"]["care_task_category"];
export type CareTaskRecordStatus = Database["public"]["Enums"]["care_task_record_status"];
export type CareReviewOutcome = Database["public"]["Enums"]["care_review_outcome"];
export type CarePlanStatus = Database["public"]["Enums"]["care_plan_status"];
export type CarePlanAccess = Database["public"]["Enums"]["care_plan_access"];
export type MedicationStatus = Database["public"]["Enums"]["medication_status"];
export type IncidentCategory = Database["public"]["Enums"]["incident_category"];
export type SupplierStatus = Database["public"]["Enums"]["supplier_status"];
export type InventoryMovementType = Database["public"]["Enums"]["inventory_movement_type"];
export type PurchaseRequestStatus = Database["public"]["Enums"]["purchase_request_status"];
export type PurchaseStatus = Database["public"]["Enums"]["purchase_status"];
export type ExpensePaymentStatus = Database["public"]["Enums"]["expense_payment_status"];
export type ServiceInvoiceStatus = Database["public"]["Enums"]["service_invoice_status"];
export type ServicePaymentMethod = Database["public"]["Enums"]["service_payment_method"];

// Phase 8 charity and scholarships ---------------------------------------------

export type CharityCampaignStatus = Database["public"]["Enums"]["charity_campaign_status"];
export type CampaignReviewDecision = Database["public"]["Enums"]["campaign_review_decision"];
export type DonationStatus = Database["public"]["Enums"]["donation_status"];
export type CampaignAllocationType = Database["public"]["Enums"]["campaign_allocation_type"];
export type CampaignExpenseStatus = Database["public"]["Enums"]["campaign_expense_status"];
export type ScholarshipCoverage = Database["public"]["Enums"]["scholarship_coverage"];
export type ScholarshipProgrammeStatus = Database["public"]["Enums"]["scholarship_programme_status"];
export type ScholarshipApplicationStatus = Database["public"]["Enums"]["scholarship_application_status"];
export type ScholarshipAwardStatus = Database["public"]["Enums"]["scholarship_award_status"];

// Phase 9 subscriptions and reporting -----------------------------------------

export type SubscriptionStatus = Database["public"]["Enums"]["subscription_status"];
export type SubscriptionBillingCycle = Database["public"]["Enums"]["subscription_billing_cycle"];
export type SubscriptionEventType = Database["public"]["Enums"]["subscription_event_type"];
export type SubscriptionPaymentStatus = Database["public"]["Enums"]["subscription_payment_status"];
