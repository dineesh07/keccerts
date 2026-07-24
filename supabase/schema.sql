-- ==============================================================================
-- KEC CERTIFICATE PORTAL — SUPABASE / POSTGRESQL DATABASE SCHEMA
-- Matches frontend TypeScript models (Participation, EventCard, Winner, etc.)
-- ==============================================================================

-- 1. Enable UUID Extension (built into Postgres / Supabase)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ------------------------------------------------------------------------------
-- TABLE 1: students
-- Stores unique student profiles keyed by roll number.
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS students (
  roll_no TEXT PRIMARY KEY,
  student_name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for partial name searching (ILIKE '%query%')
CREATE INDEX IF NOT EXISTS idx_students_name ON students (LOWER(student_name));

-- ------------------------------------------------------------------------------
-- TABLE 2: events (Featured Contests / Hackathons)
-- Stores event cards displayed on the public portal and managed via Admin.
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS events (
  id TEXT PRIMARY KEY, -- e.g. 'code-clash-2024' or UUID
  event_name TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('Coding', 'Quiz', 'Hackathon', 'Others')),
  banner_image_url TEXT NOT NULL,
  short_description TEXT NOT NULL,
  date TEXT NOT NULL,          -- e.g. "March 15, 2024"
  location TEXT NOT NULL,      -- e.g. "CS Lab Block – A"
  participant_count INTEGER DEFAULT 0,
  winners JSONB NOT NULL DEFAULT '[]'::jsonb, -- Array of IndividualWinner / TeamWinner
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for ordering by recency
CREATE INDEX IF NOT EXISTS idx_events_created_at ON events (created_at DESC);

-- ------------------------------------------------------------------------------
-- TABLE 3: participations (Certificates Issued)
-- Link between students and certificates issued for various contests.
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS participations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  roll_no TEXT NOT NULL REFERENCES students(roll_no) ON DELETE CASCADE ON UPDATE CASCADE,
  student_name TEXT NOT NULL,
  contest_name TEXT NOT NULL,
  event_id TEXT REFERENCES events(id) ON DELETE SET NULL,
  date DATE NOT NULL,
  certificate_url TEXT NOT NULL, -- Public Cloudflare R2 / Supabase Storage URL
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Fast lookup indexes for student search query (roll_no or name)
CREATE INDEX IF NOT EXISTS idx_participations_roll_no ON participations (roll_no);
CREATE INDEX IF NOT EXISTS idx_participations_student_name ON participations (LOWER(student_name));

-- ------------------------------------------------------------------------------
-- SAMPLE SEED DATA
-- Insert initial events matching current mock data
-- ------------------------------------------------------------------------------
INSERT INTO events (id, event_name, category, banner_image_url, short_description, date, location, participant_count, winners)
VALUES
(
  'code-clash-2024',
  'Code Clash 2024',
  'Coding',
  '/event_coding.png',
  'An intense 3-hour individual coding competition testing algorithmic thinking and problem-solving speed. Students tackled 5 progressively harder challenges across data structures, dynamic programming, and graph theory.',
  'March 15, 2024',
  'CS Lab Block – A',
  142,
  '[
    {"type": "individual", "name": "Arun Kumar S", "rollNo": "21CS101", "position": "1st"},
    {"type": "individual", "name": "Priya Dharshini R", "rollNo": "22CS048", "position": "2nd"},
    {"type": "individual", "name": "Gowtham M", "rollNo": "21CS087", "position": "3rd"}
  ]'::jsonb
),
(
  'techquiz-2024',
  'Tech Trivia Showdown',
  'Quiz',
  '/event_quiz.png',
  'A fast-paced technical quiz covering CS fundamentals, current tech trends, and general engineering aptitude. Teams of two competed through rapid-fire rounds with buzzer battles and elimination stages.',
  'April 8, 2024',
  'Seminar Hall – Main Block',
  96,
  '[
    {"type": "individual", "name": "Divya Lakshmi K", "rollNo": "22EC012", "position": "1st"},
    {"type": "individual", "name": "Karthik Raj P", "rollNo": "21EC055", "position": "2nd"},
    {"type": "individual", "name": "Sneha B", "rollNo": "22IT033", "position": "3rd"}
  ]'::jsonb
),
(
  'hackfest-2024',
  'HackFest Innovation Sprint',
  'Hackathon',
  '/event_hackathon.png',
  'A 24-hour hackathon where teams of 3–4 built real-world solutions around the themes of Smart Campus, Green Tech, and AI for Good. Projects were judged on innovation, feasibility, design, and live demo impact.',
  'May 22–23, 2024',
  'Innovation Hub – KEC Campus',
  204,
  '[
    {"type": "team", "teamName": "Team Nexus", "members": ["Rahul V (22CS011)", "Sneha R (22CS023)", "Dev M (22CS034)", "Anya K (22CS045)"], "position": "1st"},
    {"type": "team", "teamName": "Team Byte Force", "members": ["Arjun P (21CS099)", "Meena S (21CS078)"], "position": "2nd"},
    {"type": "team", "teamName": "Team GreenBit", "members": ["Kavi T (22IT012)", "Raj N (22IT031)"], "position": "3rd"}
  ]'::jsonb
)
ON CONFLICT (id) DO NOTHING;

-- Seed Sample Students
INSERT INTO students (roll_no, student_name) VALUES
('23MCA001', 'Aditya Sharma'),
('23MCA002', 'Priya Nair'),
('22BCE045', 'Kiran Menon'),
('23MCB012', 'Sneha Rajesh'),
('21CSE099', 'Arjun Pillai'),
('24MCA005', 'Divya Krishna')
ON CONFLICT (roll_no) DO NOTHING;

-- Seed Sample Participations
INSERT INTO participations (roll_no, student_name, contest_name, date, certificate_url) VALUES
('23MCA001', 'Aditya Sharma', 'National Coding Championship 2024', '2024-03-15', 'https://example.com/certificates/p-001.pdf'),
('23MCA001', 'Aditya Sharma', 'Hack-A-Thon Spring 2024', '2024-04-22', 'https://example.com/certificates/p-002.pdf'),
('23MCA001', 'Aditya Sharma', 'Data Science Olympiad 2023', '2023-11-08', 'https://example.com/certificates/p-003.pdf'),
('23MCA002', 'Priya Nair', 'National Coding Championship 2024', '2024-03-15', 'https://example.com/certificates/p-004.pdf'),
('23MCA002', 'Priya Nair', 'Web Dev Sprint 2024', '2024-06-10', 'https://example.com/certificates/p-005.pdf'),
('22BCE045', 'Kiran Menon', 'Hack-A-Thon Spring 2024', '2024-04-22', 'https://example.com/certificates/p-006.pdf'),
('22BCE045', 'Kiran Menon', 'Algorithm Bowl 2023', '2023-09-20', 'https://example.com/certificates/p-007.pdf'),
('23MCB012', 'Sneha Rajesh', 'Data Science Olympiad 2023', '2023-11-08', 'https://example.com/certificates/p-008.pdf'),
('21CSE099', 'Arjun Pillai', 'National Coding Championship 2024', '2024-03-15', 'https://example.com/certificates/p-009.pdf'),
('21CSE099', 'Arjun Pillai', 'Web Dev Sprint 2024', '2024-06-10', 'https://example.com/certificates/p-010.pdf'),
-- ------------------------------------------------------------------------------
-- ALTER TABLE participations
-- Add status ('pending', 'generated', 'failed') and generated_at timestamp
-- ------------------------------------------------------------------------------
ALTER TABLE participations 
  ADD COLUMN IF NOT EXISTS status TEXT CHECK (status IN ('pending', 'generated', 'failed')) DEFAULT 'generated',
  ADD COLUMN IF NOT EXISTS generated_at TIMESTAMPTZ DEFAULT NOW();

-- ------------------------------------------------------------------------------
-- TABLE 4: certificate_templates
-- Stores visual configuration and background template URLs per event.
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS certificate_templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id TEXT NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  template_url TEXT NOT NULL,
  config JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT unique_event_template UNIQUE (event_id)
);

CREATE INDEX IF NOT EXISTS idx_certificate_templates_event_id ON certificate_templates (event_id);

-- ------------------------------------------------------------------------------
-- ROW LEVEL SECURITY (RLS) POLICIES
-- Ensures public anon key can read, insert, update, and delete rows
-- ------------------------------------------------------------------------------
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE participations ENABLE ROW LEVEL SECURITY;
ALTER TABLE certificate_templates ENABLE ROW LEVEL SECURITY;

-- Disable RLS restrictions for development/public portal access
DROP POLICY IF EXISTS "Public access on students" ON students;
CREATE POLICY "Public access on students" ON students FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public access on events" ON events;
CREATE POLICY "Public access on events" ON events FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public access on participations" ON participations;
CREATE POLICY "Public access on participations" ON participations FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public access on certificate_templates" ON certificate_templates;
CREATE POLICY "Public access on certificate_templates" ON certificate_templates FOR ALL USING (true) WITH CHECK (true);

-- ------------------------------------------------------------------------------
-- STORAGE BUCKETS SETUP: certificate-templates & certificates
-- Ensures public access for uploading and reading certificate templates & generated PNG certificates
-- ------------------------------------------------------------------------------
INSERT INTO storage.buckets (id, name, public)
VALUES ('certificate-templates', 'certificate-templates', true)
ON CONFLICT (id) DO UPDATE SET public = true;

DROP POLICY IF EXISTS "Public access on certificate-templates bucket" ON storage.objects;
CREATE POLICY "Public access on certificate-templates bucket"
  ON storage.objects FOR ALL
  USING (bucket_id = 'certificate-templates')
  WITH CHECK (bucket_id = 'certificate-templates');

INSERT INTO storage.buckets (id, name, public)
VALUES ('certificates', 'certificates', true)
ON CONFLICT (id) DO UPDATE SET public = true;

DROP POLICY IF EXISTS "Public access on certificates bucket" ON storage.objects;
CREATE POLICY "Public access on certificates bucket"
  ON storage.objects FOR ALL
  USING (bucket_id = 'certificates')
  WITH CHECK (bucket_id = 'certificates');



