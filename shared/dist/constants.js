// Institutional constants for SyllabusForge (Regulation 2026)
export const PROGRAMME_CODES = [
    { code: 'CE', name: 'Civil Engineering', department: 'Civil Engineering' },
    { code: 'ME', name: 'Mechanical Engineering', department: 'Mechanical Engineering' },
    { code: 'EE', name: 'Electrical and Electronics Engineering', department: 'Electrical and Electronics Engineering' },
    { code: 'EC', name: 'Electronics and Communication Engineering', department: 'Electronics and Communication Engineering' },
    { code: 'CS', name: 'Computer Science Engineering', department: 'Computer Science Engineering' },
    { code: 'IT', name: 'Information Technology', department: 'Information Technology' },
    { code: 'CB', name: 'Computer Science and Business Systems', department: 'Computer Science and Business Systems' },
    { code: 'AM', name: 'Computer Science Engineering (Artificial Intelligence and Machine Learning)', department: 'Computer Science Engineering' },
    { code: 'MT', name: 'Mechatronics Engineering', department: 'Mechanical Engineering' },
    { code: 'DS', name: 'Data Science', department: 'Computer Applications' },
    { code: 'CA', name: 'Computer Applications', department: 'Computer Applications' },
    { code: 'PA', name: 'Structural Engineering', department: 'Civil Engineering' },
    { code: 'PB', name: 'Construction Engineering and Management', department: 'Civil Engineering' },
    { code: 'PC', name: 'Communication Systems', department: 'Electronics and Communication Engineering' },
    { code: 'PD', name: 'Computer Science Engineering (PG)', department: 'Computer Science Engineering' },
    { code: 'EL', name: 'ECE VLSI', department: 'Electronics and Communication Engineering' },
    { code: 'FT', name: 'Fashion Technology', department: 'Fashion Technology' },
    { code: 'ER', name: 'Electrical and Computer Engineering', department: 'Electrical and Electronics Engineering' },
    { code: 'MA', name: 'Mathematics Department', department: 'Mathematics' },
    { code: 'PH', name: 'Physics Department', department: 'Physics' },
    { code: 'CH', name: 'Chemistry Department', department: 'Chemistry' },
    { code: 'EG', name: 'English Department', department: 'English' },
    { code: 'CC', name: 'Common Course Code', department: 'First Year / Interdisciplinary' },
];
export const DEPARTMENT_OPTIONS = [
    'Civil Engineering',
    'Mechanical Engineering',
    'Electrical and Electronics Engineering',
    'Electronics and Communication Engineering',
    'Computer Science and Engineering',
    'Information Technology',
    'Computer Science and Business Systems',
    'Computer Applications',
    'Artificial Intelligence',
    'Mechatronics',
    'Fashion Technology',
    'Applied Mathematics and Computational Science',
    'Mathematics',
    'Physics',
    'Chemistry',
    'English',
    'First Year / Interdisciplinary',
];
export function getProgrammesForDepartment(dept) {
    if (!dept)
        return PROGRAMME_CODES;
    return PROGRAMME_CODES.filter(p => {
        if (p.department.toLowerCase() === dept.toLowerCase())
            return true;
        if (dept === 'Artificial Intelligence' && p.code === 'AM')
            return true;
        if (dept === 'Mechatronics' && p.code === 'MT')
            return true;
        if (dept === 'Applied Mathematics and Computational Science' && (p.code === 'DS' || p.code === 'MA'))
            return true;
        if (dept === 'Computer Science and Engineering' && (p.code === 'AM' || p.code === 'PD' || p.code === 'CS'))
            return true;
        if (dept === 'Mechanical Engineering' && (p.code === 'ME' || p.code === 'MT'))
            return true;
        if (dept === 'Civil Engineering' && (p.code === 'CE' || p.code === 'PA' || p.code === 'PB'))
            return true;
        if (dept === 'Electronics and Communication Engineering' && (p.code === 'EC' || p.code === 'PC' || p.code === 'EL'))
            return true;
        if (dept === 'Electrical and Electronics Engineering' && (p.code === 'EE' || p.code === 'ER'))
            return true;
        if (dept === 'Computer Applications' && (p.code === 'CA' || p.code === 'DS'))
            return true;
        return false;
    });
}
export function getDepartmentForProgramme(code) {
    if (!code)
        return '';
    const prog = PROGRAMME_CODES.find(p => p.code === code);
    return prog?.department || '';
}
export const CATEGORY_CODES = [
    { code: 'C', name: 'Programme Core Courses', defaultAbbr: 'PCC', allowedTypes: ['THEORY', 'PRACTICAL', 'TCP'] },
    { code: 'S', name: 'Basic Science Courses', defaultAbbr: 'BSC', allowedTypes: ['THEORY', 'PRACTICAL', 'TCP'] },
    { code: 'E', name: 'Engineering Science Courses', defaultAbbr: 'ESC', allowedTypes: ['THEORY', 'PRACTICAL', 'TCP'] },
    { code: 'L', name: 'Employment Enhancement Courses', defaultAbbr: 'EEC', allowedTypes: ['THEORY', 'PRACTICAL', 'TCP'] },
    { code: 'H', name: 'Humanities, including Management Studies/ Research methodology & IPR courses of PG', defaultAbbr: 'HSMC', allowedTypes: ['THEORY', 'PRACTICAL', 'TCP'] },
    { code: 'P', name: 'Programme Elective Courses', defaultAbbr: 'PEC', allowedTypes: ['THEORY', 'PRACTICAL', 'TCP'] },
    { code: 'Q', name: 'Programme Elective Courses', defaultAbbr: 'PEC', allowedTypes: ['THEORY', 'PRACTICAL', 'TCP'] },
    { code: 'R', name: 'Programme Elective Courses', defaultAbbr: 'PEC', allowedTypes: ['THEORY', 'PRACTICAL', 'TCP'] },
    { code: 'G', name: 'Open Electives', defaultAbbr: 'OEC', allowedTypes: ['THEORY', 'PRACTICAL', 'TCP'] },
    { code: 'F', name: 'Basic Science Electives', defaultAbbr: 'BSC', allowedTypes: ['THEORY', 'PRACTICAL', 'TCP'] },
    { code: 'K', name: 'Foundation Courses', defaultAbbr: 'ESC', allowedTypes: ['THEORY', 'PRACTICAL', 'TCP'] },
    { code: '1', name: 'Industry-Supported Course', defaultAbbr: 'PEC', allowedTypes: ['THEORY', 'PRACTICAL', 'TCP'] },
    { code: '2', name: 'Industry-Supported Course', defaultAbbr: 'PEC', allowedTypes: ['THEORY', 'PRACTICAL', 'TCP'] },
    { code: 'A', name: 'Audit Courses', defaultAbbr: 'AC', allowedTypes: ['THEORY', 'PRACTICAL', 'TCP'] },
    { code: 'V', name: 'Value-Added Course', defaultAbbr: 'AC', allowedTypes: ['THEORY', 'PRACTICAL', 'TCP'] },
    { code: 'N', name: 'NPTEL Courses', defaultAbbr: 'OEC', allowedTypes: ['THEORY', 'PRACTICAL', 'TCP'] },
    { code: 'M', name: 'TCE MOOCS Courses', defaultAbbr: 'OEC', allowedTypes: ['THEORY', 'PRACTICAL', 'TCP'] },
    { code: 'T', name: 'Internship', defaultAbbr: 'EEC', allowedTypes: ['PRACTICAL'] },
];
export const CATEGORY_ABBREVIATIONS = [
    'HSMC', // Humanities and Social Sciences including Management Courses
    'BSC', // Basic Science Courses
    'ESC', // Engineering Science Courses
    'PCC', // Program Core Courses
    'PEC', // Program Elective Courses
    'OEC', // Open Elective Courses
    'EEC', // Employability Enhancement Courses
    'AC', // Audit Courses
];
export const CATEGORY_OPTIONS = [
    { abbr: 'PCC', name: 'Programme Core Courses', fullName: 'PCC — Programme Core Courses' },
    { abbr: 'PEC', name: 'Programme Elective Courses', fullName: 'PEC — Programme Elective Courses' },
    { abbr: 'BSC', name: 'Basic Science Courses', fullName: 'BSC — Basic Science Courses' },
    { abbr: 'ESC', name: 'Engineering Science Courses', fullName: 'ESC — Engineering Science Courses' },
    { abbr: 'EEC', name: 'Employability Enhancement Courses', fullName: 'EEC — Employability Enhancement Courses' },
    { abbr: 'HSMC', name: 'Humanities, Social Sciences & Management', fullName: 'HSMC — Humanities & Management' },
    { abbr: 'OEC', name: 'Open Elective Courses', fullName: 'OEC — Open Elective Courses' },
    { abbr: 'AC', name: 'Audit Courses', fullName: 'AC — Audit Courses' },
];
export const TPS_VERBS = {
    1: ['Define', 'Identify', 'List', 'Name', 'Recall', 'Recognize', 'Record', 'Relate', 'Repeat', 'Underline'],
    2: ['Explain', 'Describe', 'Interpret', 'Classify'],
    3: ['Solve', 'Compute', 'Demonstrate', 'Use', 'Apply', 'Operate', 'Measure', 'Execute'],
    4: ['Compare', 'Differentiate', 'Examine', 'Break down', 'Analyse', 'Analyze'],
    5: ['Assess', 'Conclude', 'Critique', 'Decide', 'Evaluate', 'Justify', 'Prioritise', 'Prioritize', 'Recommend', 'Validate', 'Verify'],
    6: ['Construct', 'Design', 'Develop', 'Formulate', 'Invent', 'Create', 'Plan', 'Produce'],
};
export const LAB_OBJECTIVES = [
    { no: 1, name: 'Instrumentation', description: 'Select, calibrate, and operate instruments and sensors for engineering measurement.', domain: 'Cognitive' },
    { no: 2, name: 'Models', description: 'Connect theoretical models to real-world experimental behavior; explain and quantify deviations.', domain: 'Cognitive' },
    { no: 3, name: 'Experimentation', description: 'Design and conduct systematic experiments with appropriate controls and documentation.', domain: 'Cognitive' },
    { no: 4, name: 'Data Analysis', description: 'Apply statistical methods to interpret data, quantify uncertainty, and draw valid conclusions.', domain: 'Cognitive' },
    { no: 5, name: 'Design', description: 'Design, build, and test engineering systems using iterative experimental validation.', domain: 'Cognitive' },
    { no: 6, name: 'Psychomotor Skills', description: 'Demonstrate manual dexterity and procedural proficiency in operating laboratory equipment.', domain: 'Psychomotor' },
    { no: 7, name: 'Sensory Awareness', description: 'Use sight, hearing, touch, and other senses as diagnostic tools in engineering contexts.', domain: 'Psychomotor' },
    { no: 8, name: 'Learn from Failure', description: 'Systematically diagnose experimental failures, extract lessons, and implement improvements.', domain: 'Affective' },
    { no: 9, name: 'Creativity', description: 'Generate novel solutions, adapt to unexpected challenges, and extend experimental scope.', domain: 'Affective' },
    { no: 10, name: 'Safety', description: 'Identify hazards, follow safety protocols, and maintain a safety-first professional mindset.', domain: 'Affective' },
    { no: 11, name: 'Communication', description: 'Communicate experimental findings effectively in professional written and oral formats.', domain: 'Affective' },
    { no: 12, name: 'Teamwork', description: 'Contribute equitably to collaborative experimental work and resolve differences constructively.', domain: 'Affective' },
    { no: 13, name: 'Ethics & Integrity', description: 'Maintain honesty, accuracy, and professional integrity in all aspects of experimental conduct.', domain: 'Affective' },
];
export const GENERAL_CO_POOL = [
    // Cognitive (CO-C1 to CO-C5)
    {
        code: 'CO-C1',
        statement: 'Operate appropriate instruments and sensors to measure physical quantities aligned to experimental objectives.',
        tpsLevel: 3,
        pi: '5.2.1',
        objectiveNo: 1,
        objectiveName: 'Instrumentation',
        domain: 'Cognitive',
        firstVerb: 'Operate'
    },
    {
        code: 'CO-C2',
        statement: 'Analyse deviations between theoretical model predictions and experimentally observed behaviour, citing real-world assumptions.',
        tpsLevel: 4,
        pi: '2.3.1',
        objectiveNo: 2,
        objectiveName: 'Models',
        domain: 'Cognitive',
        firstVerb: 'Analyse'
    },
    {
        code: 'CO-C3',
        statement: 'Evaluate experimental procedures for adequacy of controls, documentation standards, and reproducibility.',
        tpsLevel: 5,
        pi: '4.2.1',
        objectiveNo: 3,
        objectiveName: 'Experimentation',
        domain: 'Cognitive',
        firstVerb: 'Evaluate'
    },
    {
        code: 'CO-C4',
        statement: 'Examine experimental data using statistical methods to quantify uncertainty and draw valid conclusions.',
        tpsLevel: 4,
        pi: '4.3.1',
        objectiveNo: 4,
        objectiveName: 'Data Analysis',
        domain: 'Cognitive',
        firstVerb: 'Examine'
    },
    {
        code: 'CO-C5',
        statement: 'Validate the performance of a designed engineering system through iterative experimental testing against defined specifications.',
        tpsLevel: 5,
        pi: '3.3.1',
        objectiveNo: 5,
        objectiveName: 'Design',
        domain: 'Cognitive',
        firstVerb: 'Validate'
    },
    // Affective (CO-A1 to CO-A7)
    {
        code: 'CO-A1',
        statement: 'Demonstrate ethical responsibility in recording observations and reporting experimental results.',
        tpsLevel: 3,
        pi: '7.2.1',
        objectiveNo: 13,
        objectiveName: 'Ethics & Integrity',
        domain: 'Affective',
        firstVerb: 'Demonstrate'
    },
    {
        code: 'CO-A2',
        statement: 'Apply safety protocols and sustainability principles consistently throughout experimentation.',
        tpsLevel: 3,
        pi: '6.4.1',
        objectiveNo: 10,
        objectiveName: 'Safety',
        domain: 'Affective',
        firstVerb: 'Apply'
    },
    {
        code: 'CO-A3',
        statement: 'Implement assigned team roles equitably across data collection, discussion, and report preparation.',
        tpsLevel: 3,
        pi: '8.2.1',
        objectiveNo: 12,
        objectiveName: 'Teamwork',
        domain: 'Affective',
        firstVerb: 'Implement'
    },
    {
        code: 'CO-A4',
        statement: 'Prepare structured laboratory reports communicating experimental methodology, results, and conclusions.',
        tpsLevel: 3,
        pi: '9.1.2',
        objectiveNo: 11,
        objectiveName: 'Communication (Written)',
        domain: 'Affective',
        firstVerb: 'Prepare'
    },
    {
        code: 'CO-A5',
        statement: 'Demonstrate clarity in communicating experimental findings during viva voce examinations.',
        tpsLevel: 3,
        pi: '9.2.1',
        objectiveNo: 11,
        objectiveName: 'Communication (Oral)',
        domain: 'Affective',
        firstVerb: 'Demonstrate'
    },
    {
        code: 'CO-A6',
        statement: 'Analyse experimental failures to determine root causes and corrective actions in reports and viva.',
        tpsLevel: 4,
        pi: '11.1.1',
        objectiveNo: 8,
        objectiveName: 'Learn from Failure',
        domain: 'Affective',
        firstVerb: 'Analyse'
    },
    {
        code: 'CO-A7',
        statement: 'Recommend alternative experimental approaches when standard methods are inadequate, with justification.',
        tpsLevel: 5,
        pi: '4.3.1',
        objectiveNo: 9,
        objectiveName: 'Creativity',
        domain: 'Affective',
        firstVerb: 'Recommend'
    },
    // Psychomotor (CO-P1 to CO-P6)
    {
        code: 'CO-P1',
        statement: 'Operate laboratory instruments with precision, systematically executing procedures and recording observations.',
        tpsLevel: 3,
        pi: '5.2.1',
        objectiveNo: 6,
        objectiveName: 'Psychomotor Skills',
        domain: 'Psychomotor',
        firstVerb: 'Operate'
    },
    {
        code: 'CO-P2',
        statement: 'Apply sensory judgment to monitor experimental progress and detect anomalies in instrument responses.',
        tpsLevel: 3,
        pi: '4.1.1',
        objectiveNo: 7,
        objectiveName: 'Sensory Awareness',
        domain: 'Psychomotor',
        firstVerb: 'Apply'
    },
    {
        code: 'CO-P3',
        statement: 'Use modern laboratory tools and software to collect and present experimental data in structured formats.',
        tpsLevel: 3,
        pi: '5.1.1',
        objectiveNo: 6,
        objectiveName: 'Psychomotor Skills',
        domain: 'Psychomotor',
        firstVerb: 'Use'
    },
    {
        code: 'CO-P4',
        statement: 'Demonstrate manual dexterity in assembling experimental setups following defined procedural protocols.',
        tpsLevel: 3,
        pi: '5.3.1',
        objectiveNo: 6,
        objectiveName: 'Psychomotor Skills',
        domain: 'Psychomotor',
        firstVerb: 'Demonstrate'
    },
    {
        code: 'CO-P5',
        statement: 'Examine experimental errors to determine and implement corrective modifications in setups and procedures.',
        tpsLevel: 4,
        pi: '4.3.1',
        objectiveNo: 6,
        objectiveName: 'Psychomotor Skills',
        domain: 'Psychomotor',
        firstVerb: 'Examine'
    },
    {
        code: 'CO-P6',
        statement: 'Execute standard operating procedures precisely in laboratory experiments.',
        tpsLevel: 3,
        pi: '5.2.1',
        objectiveNo: 6,
        objectiveName: 'Psychomotor Skills',
        domain: 'Psychomotor',
        firstVerb: 'Execute'
    },
];
export const PERFORMANCE_INDICATORS = [
    { piNumber: '1.1.1', descriptor: 'Apply fundamental concepts of mathematics and science to solve engineering problems', tpsLevel: 3 },
    { piNumber: '1.2.1', descriptor: 'Apply engineering principles to formulate mathematical models', tpsLevel: 3 },
    { piNumber: '2.1.1', descriptor: 'Identify and formulate engineering problems based on fundamental principles', tpsLevel: 2 },
    { piNumber: '2.2.1', descriptor: 'Analyze and formulate engineering problems into operational specifications', tpsLevel: 4 },
    { piNumber: '2.3.1', descriptor: 'Analyse deviations between theoretical model predictions and observed behaviour', tpsLevel: 4 },
    { piNumber: '3.1.1', descriptor: 'Formulate system specifications meeting stakeholder requirements', tpsLevel: 3 },
    { piNumber: '3.2.1', descriptor: 'Design components or processes that meet specific needs', tpsLevel: 4 },
    { piNumber: '3.3.1', descriptor: 'Validate performance of designed systems through iterative testing', tpsLevel: 5 },
    { piNumber: '4.1.1', descriptor: 'Apply sensory and procedural judgment to conduct experimental investigations', tpsLevel: 3 },
    { piNumber: '4.2.1', descriptor: 'Evaluate experimental procedures for adequacy of controls and reproducibility', tpsLevel: 5 },
    { piNumber: '4.3.1', descriptor: 'Examine and interpret experimental data using statistical tools', tpsLevel: 4 },
    { piNumber: '5.1.1', descriptor: 'Select and use modern engineering tools, resources, and IT software', tpsLevel: 3 },
    { piNumber: '5.2.1', descriptor: 'Operate and calibrate laboratory instruments and measuring devices', tpsLevel: 3 },
    { piNumber: '5.3.1', descriptor: 'Assemble and configure hardware/software experimental test setups', tpsLevel: 3 },
    { piNumber: '6.4.1', descriptor: 'Apply safety protocols, regulatory codes, and sustainability practices', tpsLevel: 3 },
    { piNumber: '7.2.1', descriptor: 'Demonstrate professional integrity, data ethics, and academic honesty', tpsLevel: 3 },
    { piNumber: '8.2.1', descriptor: 'Perform team roles equitably and collaborate constructively', tpsLevel: 3 },
    { piNumber: '9.1.2', descriptor: 'Prepare clear and structured technical reports and documentation', tpsLevel: 3 },
    { piNumber: '9.2.1', descriptor: 'Deliver effective oral presentations and defend technical choices in viva', tpsLevel: 3 },
    { piNumber: '10.1.1', descriptor: 'Assess engineering solutions within environmental and societal contexts', tpsLevel: 5 },
    { piNumber: '11.1.1', descriptor: 'Analyze failures, evaluate project risks, and formulate remedial strategies', tpsLevel: 4 },
    { piNumber: '12.1.1', descriptor: 'Identify emerging technological trends and engage in self-directed learning', tpsLevel: 2 },
];
export const SDG_LIST = [
    { no: 1, name: 'No Poverty', description: 'End poverty in all its forms everywhere.' },
    { no: 2, name: 'Zero Hunger', description: 'End hunger, achieve food security and improved nutrition.' },
    { no: 3, name: 'Good Health and Well-being', description: 'Ensure healthy lives and promote well-being for all at all ages.' },
    { no: 4, name: 'Quality Education', description: 'Ensure inclusive and equitable quality education and lifelong learning.' },
    { no: 5, name: 'Gender Equality', description: 'Achieve gender equality and empower all women and girls.' },
    { no: 6, name: 'Clean Water and Sanitation', description: 'Ensure availability and sustainable management of water and sanitation.' },
    { no: 7, name: 'Affordable and Clean Energy', description: 'Ensure access to affordable, reliable, sustainable and modern energy.' },
    { no: 8, name: 'Decent Work and Economic Growth', description: 'Promote sustained, inclusive and sustainable economic growth.' },
    { no: 9, name: 'Industry, Innovation and Infrastructure', description: 'Build resilient infrastructure, foster innovation.' },
    { no: 10, name: 'Reduced Inequalities', description: 'Reduce inequality within and among countries.' },
    { no: 11, name: 'Sustainable Cities and Communities', description: 'Make cities inclusive, safe, resilient and sustainable.' },
    { no: 12, name: 'Responsible Consumption and Production', description: 'Ensure sustainable consumption and production patterns.' },
    { no: 13, name: 'Climate Action', description: 'Take urgent action to combat climate change and its impacts.' },
    { no: 14, name: 'Life Below Water', description: 'Conserve and sustainably use the oceans, seas and marine resources.' },
    { no: 15, name: 'Life on Land', description: 'Protect, restore and promote sustainable use of terrestrial ecosystems.' },
    { no: 16, name: 'Peace, Justice and Strong Institutions', description: 'Promote peaceful and inclusive societies for sustainable development.' },
    { no: 17, name: 'Partnerships for the Goals', description: 'Strengthen means of implementation and revitalize global partnerships.' },
];
export const DOMAIN_TO_SDG_MAP = [
    { domain: 'Power Systems, Renewable Energy, Energy Efficiency', suggestedSdgs: [7, 13], rationale: 'Affordable and clean energy; climate action through low-carbon technologies' },
    { domain: 'Water Treatment, Environmental Engineering, Fluid Systems', suggestedSdgs: [6, 14], rationale: 'Clean water access; aquatic ecosystem protection' },
    { domain: 'Communication Networks, Internet of Things, Smart Systems', suggestedSdgs: [9, 11], rationale: 'Industry, innovation, infrastructure; sustainable cities and communities' },
    { domain: 'Biomedical Engineering, Healthcare Technology', suggestedSdgs: [3], rationale: 'Good health and well-being through enabling medical technologies' },
    { domain: 'Structural Engineering, Construction, Urban Planning', suggestedSdgs: [11, 9], rationale: 'Sustainable infrastructure and resilient cities' },
    { domain: 'Agriculture, Food Technology, Biosystems Engineering', suggestedSdgs: [2, 12], rationale: 'Zero hunger; responsible production and consumption' },
    { domain: 'Data Science, Machine Learning, AI', suggestedSdgs: [4, 9], rationale: 'Quality education (accessible AI tools); industry and innovation' },
    { domain: 'Thermodynamics, Heat Transfer, HVAC', suggestedSdgs: [7, 13], rationale: 'Energy efficiency; reduced carbon footprint in buildings' },
    { domain: 'Transportation Engineering, Autonomous Vehicles', suggestedSdgs: [11, 9], rationale: 'Sustainable transport systems; resilient infrastructure' },
    { domain: 'Materials Science, Waste Management, Recycling', suggestedSdgs: [12], rationale: 'Responsible consumption and production through circular economy' },
    { domain: 'Computer Science, Software Engineering (general)', suggestedSdgs: [4, 8, 9], rationale: 'Digital education access; decent work via tech; innovation infrastructure' },
    { domain: 'Environmental Science, Ecology, Climate Modelling', suggestedSdgs: [13, 15], rationale: 'Climate action; life on land' },
];
// Table 5: Weightage for Continuous Assessments in TCP Courses / End Semester (Regulation 2026, Page 22/26)
export const TCP_WEIGHTAGE_TABLE = [
    { ltp: '1-0-2', credits: 2, teType: 'TCP-T', caTheoryPercent: 15, caPracticalPercent: 35, eseTheoryPercent: 50, esePracticalPercent: 0 },
    { ltp: '1-0-2', credits: 2, teType: 'TCP-P', caTheoryPercent: 35, caPracticalPercent: 15, eseTheoryPercent: 0, esePracticalPercent: 50 },
    { ltp: '1-0-3', credits: 2.5, teType: 'TCP-P', caTheoryPercent: 35, caPracticalPercent: 15, eseTheoryPercent: 0, esePracticalPercent: 50 },
    { ltp: '2-0-2', credits: 3, teType: 'TCP-P', caTheoryPercent: 30, caPracticalPercent: 20, eseTheoryPercent: 0, esePracticalPercent: 50 },
    { ltp: '2-0-2', credits: 3, teType: 'TCP-T', caTheoryPercent: 20, caPracticalPercent: 30, eseTheoryPercent: 50, esePracticalPercent: 0 },
    { ltp: '2-0-3', credits: 3.5, teType: 'TCP-P', caTheoryPercent: 35, caPracticalPercent: 15, eseTheoryPercent: 0, esePracticalPercent: 50 },
    { ltp: '2-0-4', credits: 4, teType: 'TCP-T', caTheoryPercent: 15, caPracticalPercent: 35, eseTheoryPercent: 50, esePracticalPercent: 0 },
    { ltp: '2-0-4', credits: 4, teType: 'TCP-P', caTheoryPercent: 35, caPracticalPercent: 15, eseTheoryPercent: 0, esePracticalPercent: 50 },
    { ltp: '1-0-6', credits: 4, teType: 'TCP-P', caTheoryPercent: 15, caPracticalPercent: 35, eseTheoryPercent: 0, esePracticalPercent: 50 },
    { ltp: '3-0-2', credits: 4, teType: 'TCP-T', caTheoryPercent: 20, caPracticalPercent: 30, eseTheoryPercent: 50, esePracticalPercent: 0 },
];
export const REGULATION_ASSESSMENT_SUMMARY = [
    { category: 'Theory', continuousAssessmentPercent: 40, endSemesterExaminationPercent: 60 },
    { category: 'Theory cum practical', continuousAssessmentPercent: 50, endSemesterExaminationPercent: 50 },
    { category: 'Laboratory', continuousAssessmentPercent: 60, endSemesterExaminationPercent: 40 },
    { category: 'Project Work / Internship cum Project Work', continuousAssessmentPercent: 60, endSemesterExaminationPercent: 40 },
    { category: 'Internship / Industrial Training', continuousAssessmentPercent: 100, endSemesterExaminationPercent: 0 },
    { category: 'Industry Supported Course', continuousAssessmentPercent: 100, endSemesterExaminationPercent: 0 },
    { category: 'Employability Enhancement Courses', continuousAssessmentPercent: 60, endSemesterExaminationPercent: 40 },
    { category: 'Audit Course', continuousAssessmentPercent: 100, endSemesterExaminationPercent: 0 },
];
export const LAB_ASSESSMENT_SPLITS = {
    1: { preLab: 20, inLab: 35, postLab: 20, total: 75 },
    2: { preLab: 15, inLab: 30, postLab: 30, total: 75 },
    3: { preLab: 10, inLab: 25, postLab: 40, total: 75 },
};
export const LAB_ACTIVITY_CHIPS = {
    preLab: [
        'Concept Review Quiz',
        'Equipment Familiarization',
        'Hypothesis Formulation',
        'Safety Briefing',
        'Procedure Walk-Through',
        'Variable Identification',
    ],
    inLab: [
        'Guided Experiment',
        'Live Data Recording',
        'Observation Sketching',
        'Collaborative Roles',
        'Mid-Lab Questioning',
        'Repeat Trials',
    ],
    postLab: [
        'Data Analysis & Graphing',
        'Lab Report Writing',
        'Class Discussion',
        'Error Analysis',
        'Concept Linkage',
        'Extension Questioning',
    ],
};
export const SCHWAB_HERRON_LEVELS = [
    { level: 0, problem: 'Given', waysMeans: 'Given', answers: 'Given', description: 'Level 0 — Fully Given: All three elements provided by teacher/textbook.' },
    { level: 1, problem: 'Given', waysMeans: 'Given', answers: 'Open', description: 'Level 1 — Open Answers: Problem and methods given; students find answers.' },
    { level: 2, problem: 'Given', waysMeans: 'Open', answers: 'Open', description: 'Level 2 — Open Methods & Answers: Problem given; students choose how to investigate.' },
    { level: 3, problem: 'Open', waysMeans: 'Open', answers: 'Open', description: 'Level 3 — Fully Open: Problem, methods, and answers all student-determined inquiry.' },
];
export const DEFAULT_CONFIG_SETTINGS = {
    regulationYear: 2026,
    regulationCode: '26',
    bosDate: '01.06.2026',
    acmText: 'Passed in BoS Meeting 01.06.2026 | Approved in Academic Council meeting on 27.06.2026',
    acmDate: '27.06.2026',
    acmMeetingName: 'Academic Council Meeting',
    coShareTolerance: 3, // +/- 3 percentage points
    allowTps1: false,
    // Regulation 2026 Table 4 & Table 8: Theory CA is 40% (Test1 30%, Act1 20%, Test2 30%, Act2 20%), Terminal Exam is 60%
    assessmentComponentWeights: {
        cat1: 12, // 30% of CA (40 marks) = 12%
        assignment1: 8, // 20% of CA (40 marks) = 8%
        cat2: 12, // 30% of CA (40 marks) = 12%
        assignment2: 8, // 20% of CA (40 marks) = 8%
        terminal: 60, // End Semester Examination = 60%
    },
    labCoRanges: {
        cognitiveMin: 2,
        cognitiveMax: 4,
        affectiveMin: 2,
        affectiveMax: 3,
        psychomotorMin: 2,
        psychomotorMax: 3,
        totalMin: 6,
        totalMax: 8,
    },
};
//# sourceMappingURL=constants.js.map