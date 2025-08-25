export interface Company {
  id: string;
  name: string;
  created_at: string;
}

export interface Profile {
  id: string;
  full_name: string;
  role: string;
  created_at: string;
}

export interface CompanyRepresentative {
  id: string;
  company_id: string;
  profile_id: string;
  email: string;
}