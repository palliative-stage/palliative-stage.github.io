-- Catalog of placeholder pages ("הערך יעלה בקרוב!").
-- route matches events.page_route without the hash or trailing slash.
-- When a page gets its real content, set content_added_on instead of deleting the row:
--   UPDATE page_stubs SET content_added_on = '2026-10-15' WHERE route = '/Symptom_Control/Coughing';
-- Views before content_added_on (Asia/Jerusalem) count as views of the placeholder.

CREATE TABLE IF NOT EXISTS page_stubs (
  route TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  content_added_on DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO page_stubs (route, title) VALUES
  ('/Symptom_Control/Coughing', 'שיעול'),
  ('/Symptom_Control/Depression', 'דיכאון'),
  ('/Symptom_Control/Itchiness', 'גרד'),
  ('/Symptom_Control/PainSubmenu/Pain1', 'אומדן כאב'),
  ('/Symptom_Control/PainSubmenu/Pain2', 'אומדן כאב - פגיעה קוגניטיבית'),
  ('/Symptom_Control/PainSubmenu/Pain3', 'בחירה והמרת אופיואידים'),
  ('/Symptom_Control/PainSubmenu/Pain4', 'כאב עצבי'),
  ('/Symptom_Control/PainSubmenu/Pain5', 'ניהול הטיפול בכאב'),
  ('/Emergency_Situations/Hypercalcaemia', 'היפרקלצמיה'),
  ('/Emergency_Situations/Seizures', 'פרכוסים'),
  ('/EOL/MouthCare', 'טיפול פה'),
  ('/EOL/Liver', 'אי-ספיקת כבד'),
  ('/EOL/Kidney', 'אי-ספיקת כליות')
ON CONFLICT (route) DO NOTHING;
