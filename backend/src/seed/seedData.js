// Demo data for seed.js. Every person, phone number and email here is fictional; .test is a
// reserved domain, so none of these addresses can ever reach a real inbox.

export const DEMO_PASSWORD = 'Demo@123';

export const departments = [
  { code: 'CSE', name: 'Computer Science and Engineering' },
  { code: 'CCE', name: 'Communication and Computer Engineering' },
  { code: 'ECE', name: 'Electronics and Communication Engineering' },
  { code: 'MME', name: 'Mechanical-Mechatronics Engineering' },
];

// The descriptions are short summaries written for this prototype, not NAAC's own wording.
export const criteria = [
  { number: 1, name: 'Curricular Aspects', description: 'Curriculum design, enrichment and stakeholder feedback.' },
  { number: 2, name: 'Teaching-Learning and Evaluation', description: 'Enrolment, teaching methods, faculty and evaluation processes.' },
  { number: 3, name: 'Research, Innovations and Extension', description: 'Research funding, publications, innovation and community outreach.' },
  { number: 4, name: 'Infrastructure and Learning Resources', description: 'Physical facilities, library and IT infrastructure.' },
  { number: 5, name: 'Student Support and Progression', description: 'Scholarships, skill development, placements and student achievements.' },
  { number: 6, name: 'Governance, Leadership and Management', description: 'Vision, e-governance, faculty support and internal quality assurance.' },
  { number: 7, name: 'Institutional Values and Best Practices', description: 'Gender equity, sustainability, best practices and distinctiveness.' },
];

// DEMO VALUES ONLY. These codes and names are invented to resemble NAAC metrics. They are NOT
// the official sub-metric taxonomy, which the SRS does not supply, and must be replaced with the
// real one before any genuine use.
export const subMetrics = [
  { criterion: 1, code: '1.1.1', name: 'Curriculum design aligned with programme outcomes' },
  { criterion: 1, code: '1.1.2', name: 'Syllabus revision carried out during the year' },
  { criterion: 1, code: '1.2.1', name: 'New courses and value-added programmes introduced' },
  { criterion: 1, code: '1.3.1', name: 'Feedback on the curriculum collected from stakeholders' },

  { criterion: 2, code: '2.1.1', name: 'Student enrolment against sanctioned seats' },
  { criterion: 2, code: '2.2.1', name: 'Student-to-teacher ratio' },
  { criterion: 2, code: '2.3.1', name: 'Experiential and participative teaching methods' },
  { criterion: 2, code: '2.5.1', name: 'Transparency of internal assessment' },

  { criterion: 3, code: '3.1.1', name: 'Research grants received from external agencies' },
  { criterion: 3, code: '3.2.1', name: 'Workshops on research methodology and IPR' },
  { criterion: 3, code: '3.3.1', name: 'Research papers published in indexed journals' },
  { criterion: 3, code: '3.4.1', name: 'Extension and outreach activities in the community' },

  { criterion: 4, code: '4.1.1', name: 'Classrooms and laboratories with ICT facilities' },
  { criterion: 4, code: '4.2.1', name: 'Library automation and e-resources' },
  { criterion: 4, code: '4.3.1', name: 'IT infrastructure and internet bandwidth' },

  { criterion: 5, code: '5.1.1', name: 'Scholarships and freeships provided to students' },
  { criterion: 5, code: '5.1.2', name: 'Capacity-building and skill-enhancement initiatives' },
  { criterion: 5, code: '5.2.1', name: 'Placement of outgoing students' },
  { criterion: 5, code: '5.3.1', name: 'Awards won by students in sports and cultural events' },

  { criterion: 6, code: '6.1.1', name: 'Institutional vision, mission and governance' },
  { criterion: 6, code: '6.2.1', name: 'Implementation of e-governance' },
  { criterion: 6, code: '6.3.1', name: 'Financial support for faculty to attend conferences' },
  { criterion: 6, code: '6.5.1', name: 'Functioning of the internal quality assurance cell' },

  { criterion: 7, code: '7.1.1', name: 'Gender equity and sensitisation programmes' },
  { criterion: 7, code: '7.1.2', name: 'Environmental sustainability initiatives' },
  { criterion: 7, code: '7.2.1', name: 'Best practices of the institution' },
  { criterion: 7, code: '7.3.1', name: 'Institutional distinctiveness' },
];

// One account per role. The faculty member and the coordinator share a department, so the
// demo can run the whole submit-review workflow between them.
export const users = [
  { name: 'Dr. Ananya Rao', email: 'ananya.rao@lnmiit.test', role: 'FACULTY', department: 'CSE', phone: '+91 90000 00001' },
  { name: 'Dr. Vikram Mehta', email: 'vikram.mehta@lnmiit.test', role: 'COORDINATOR', department: 'CSE', phone: '+91 90000 00002' },
  { name: 'Prof. Sunita Krishnan', email: 'sunita.krishnan@lnmiit.test', role: 'IQAC_LEAD', department: null, phone: '+91 90000 00003' },
  { name: 'Rahul Verma', email: 'rahul.verma@lnmiit.test', role: 'ADMIN', department: null, phone: '+91 90000 00004' },
];
