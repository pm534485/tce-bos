import fs from 'fs';
import path from 'path';
import { generatePdfDocument } from '../services/pdfGenerator.js';
import { generateDocxDocument } from '../services/docxGenerator.js';
const ARTIFACT_DIR = process.env.EXPORT_DIR || path.resolve(process.cwd(), 'exports');
if (!fs.existsSync(ARTIFACT_DIR)) {
    fs.mkdirSync(ARTIFACT_DIR, { recursive: true });
}
const COURSE_26ECCA0 = {
    courseType: 'THEORY',
    regulationYear: 2026,
    regulationCode: '26',
    programmeCode: 'EC',
    categoryLetter: 'C',
    uniqueLetter: 'A',
    version: 0,
    courseCode: '26ECCA0',
    courseName: 'ELECTRIC AND MAGNETIC CIRCUITS',
    categoryAbbr: 'PCC',
    semester: 3,
    L: 2,
    T: 1,
    P: 0,
    credits: 3,
    preamble: 'This course introduces basic electrical circuit concepts, including voltage, current, power, and Kirchhoff’s laws. It covers DC and AC circuit analysis using network theorems and phasor techniques, along with time-domain analysis of first-order RL and RC circuits. The course also includes resonance and an introduction to magnetically coupled circuits and transformers.',
    prerequisites: 'NIL',
    courseOutcomes: [
        {
            coNo: 'CO1',
            statement: 'Apply fundamental electrical quantities and circuit laws (KCL, KVL) to DC circuits.',
            tpsLevel: 3,
            pi: '1.2.1',
            weightage: 10,
            sdgNo: 9,
            sdgLevel: 2,
        },
        {
            coNo: 'CO2',
            statement: 'Solve DC circuits using Node and Mesh analysis',
            tpsLevel: 3,
            pi: '1.3.1',
            weightage: 10,
            sdgNo: 9,
            sdgLevel: 2,
        },
        {
            coNo: 'CO3',
            statement: 'Apply network theorems to simplify electrical circuits.',
            tpsLevel: 3,
            pi: '1.3.2',
            weightage: 20,
            sdgNo: 9,
            sdgLevel: 2,
        },
        {
            coNo: 'CO4',
            statement: 'Demonstrate phasor representation and impedance concepts to AC circuits and compute power parameters.',
            tpsLevel: 3,
            pi: '2.1.1',
            weightage: 20,
            sdgNo: 9,
            sdgLevel: 2,
        },
        {
            coNo: 'CO5',
            statement: 'Apply transient analysis techniques to determine the response of RL and RC circuits with initial conditions.',
            tpsLevel: 3,
            pi: '3.1.2',
            weightage: 20,
            sdgNo: 9,
            sdgLevel: 2,
        },
        {
            coNo: 'CO6',
            statement: 'Apply resonance and coupled circuit concepts to analyze frequency response and magnetically coupled networks.',
            tpsLevel: 3,
            pi: '5.1.1',
            weightage: 20,
            sdgNo: 9,
            sdgLevel: 2,
        },
    ],
    assessmentMatrix: [
        { coNo: 'CO1', cat1: 30, assignment1: 30, cat2: 0, assignment2: 0, terminalExam: 10 },
        { coNo: 'CO2', cat1: 30, assignment1: 30, cat2: 0, assignment2: 0, terminalExam: 10 },
        { coNo: 'CO3', cat1: 40, assignment1: 40, cat2: 0, assignment2: 0, terminalExam: 20 },
        { coNo: 'CO4', cat1: 0, assignment1: 0, cat2: 30, assignment2: 30, terminalExam: 20 },
        { coNo: 'CO5', cat1: 0, assignment1: 0, cat2: 30, assignment2: 30, terminalExam: 20 },
        { coNo: 'CO6', cat1: 0, assignment1: 0, cat2: 40, assignment2: 40, terminalExam: 20 },
    ],
    modules: [
        {
            moduleNo: 1,
            mainTopic: 'Basic electrical quantities',
            subtopics: [
                'Charge – current – voltage – power - Independent and dependent sources - Ohm’s law - Kirchhoff’s Current Law (KCL) and Kirchhoff’s Voltage Law (KVL) - Series and parallel circuits; Voltage and current divider rules.'
            ],
            periods: 5,
            coMapping: ['CO1'],
        },
        {
            moduleNo: 2,
            mainTopic: 'Solution Methods',
            subtopics: [
                'Node voltage method - Mesh current method - Supernode and supermesh analysis - Systematic formulation and solution of circuit equations for DC networks.'
            ],
            periods: 5,
            coMapping: ['CO2'],
        },
        {
            moduleNo: 3,
            mainTopic: 'Network Theorems',
            subtopics: [
                'Source transformation - Superposition theorem - Thévenin’s and Norton’s equivalent circuits - Maximum power transfer theorem - Δ–Y and Y–Δ transformations - Simplification of complex networks using theorems.'
            ],
            periods: 6,
            coMapping: ['CO3'],
        },
        {
            moduleNo: 4,
            mainTopic: 'AC Analysis',
            subtopics: [
                'Sinusoidal signals and phasor representation - Complex impedance of R, L and C elements - Analysis of RL, RC and RLC series and parallel circuits - Active, reactive and apparent power - Power factor - Basic introduction to three-phase systems.'
            ],
            periods: 6,
            coMapping: ['CO4'],
        },
        {
            moduleNo: 5,
            mainTopic: 'Transient Analysis',
            subtopics: [
                'Analysis of first-order RL and RC circuits using differential equation approach - Determination of initial and steady-state conditions - Natural and forced responses - Time constant and transient behavior under DC excitation - Evaluation of current and voltage responses'
            ],
            periods: 7,
            coMapping: ['CO5'],
        },
        {
            moduleNo: 6,
            mainTopic: 'Resonance',
            subtopics: [
                'Series and parallel resonance - Resonant frequency - Quality factor bandwidth and half-power frequencies'
            ],
            periods: 3,
            coMapping: ['CO6'],
        },
        {
            moduleNo: 7,
            mainTopic: 'Magnetic Circuits',
            subtopics: [
                'Mutual inductance and coefficient of coupling - Dot convention - Energy considerations - Basic analysis of coupled circuits - Ideal transformer and impedance matching (introductory level).'
            ],
            periods: 4,
            coMapping: ['CO6'],
        },
    ],
    textBooks: [
        {
            type: 'TEXT',
            authors: 'William H. Hayt Jr., Jack E. Kemmerly, Steven M. Durbin',
            title: 'Engineering Circuit Analysis',
            publisher: 'McGraw Hill',
            edition: '10th Edition',
            year: 2025,
        },
        {
            type: 'TEXT',
            authors: 'Charles K. Alexander and Matthew N. O. Sadiku',
            title: 'Fundamentals of Electric Circuits',
            publisher: 'McGraw Hill',
            edition: '7th Edition',
            year: 2022,
        },
    ],
    referenceBooks: [
        {
            type: 'REFERENCE',
            authors: 'Abhijit Chakrabarthi, Sudipta Debnath, chandan kumar chanda',
            title: '“Basic Electrical Engineering”',
            publisher: 'Mcgraw Hill',
            edition: '2nd edition',
            year: 2021,
        },
        {
            type: 'REFERENCE',
            authors: 'James W. Nilsson and Susan Riedel',
            title: 'Electric Circuits',
            publisher: 'Pearson Education',
            edition: '11th Edition',
            year: 2019,
        },
        {
            type: 'REFERENCE',
            authors: 'A. Sudhakar and Shyammohan S. Palli',
            title: 'Circuits and Networks: Analysis and Synthesis',
            publisher: 'McGraw Hill',
            edition: '6th Edition',
            year: 2025,
        },
    ],
    webResources: [
        {
            type: 'WEB',
            authors: 'Prof. Ashok Kumar Pradhan; IIT Kharagpur',
            title: 'A Basic Course on Electric and Magnetic Circuits',
            year: 2024,
        },
        {
            type: 'WEB',
            authors: 'By Prof. Gajendranath Chowdary|IIT Hyderabad',
            title: 'Basic Electrical Circuits',
            year: 2024,
        },
        {
            type: 'WEB',
            authors: 'IIT Madras',
            title: 'Basic Electrical Circuits Nagendra Krishnapura',
            year: 2024,
        },
    ],
    lectureScheduleItems: [
        { moduleNo: '1', topic: 'Basic electrical quantities: charge, current, voltage, power, Independent and dependent sources', periods: 1 },
        { moduleNo: '1', topic: 'Ohm’s law; Kirchhoff’s Current Law (KCL) and Kirchhoff’s Voltage Law (KVL);', periods: 2 },
        { moduleNo: '1', topic: 'Series and parallel circuits; Voltage and current divider rules', periods: 2 },
        { moduleNo: '2', topic: 'Solution Methods: Node voltage method', periods: 1 },
        { moduleNo: '2', topic: 'Mesh current method', periods: 1 },
        { moduleNo: '2', topic: 'Supernode and supermesh analysis', periods: 2 },
        { moduleNo: '2', topic: 'Systematic formulation and solution of circuit equations for DC networks', periods: 1 },
        { moduleNo: '3', topic: 'Network Theorems: Source transformation; Superposition theorem', periods: 1 },
        { moduleNo: '3', topic: 'Thévenin’s and Norton’s equivalent circuits', periods: 2 },
        { moduleNo: '3', topic: 'Maximum power transfer theorem', periods: 1 },
        { moduleNo: '3', topic: 'Δ–Y and Y–Δ transformations', periods: 1 },
        { moduleNo: '3', topic: 'Simplification of complex networks using theorems', periods: 1 },
        { moduleNo: '4', topic: 'AC Analysis: Sinusoidal signals and phasor representation; Complex impedance of R, L and C elements', periods: 2 },
        { moduleNo: '4', topic: 'Analysis of RL, RC and RLC series and parallel circuits', periods: 2 },
        { moduleNo: '4', topic: 'Active, reactive and apparent power; Power factor', periods: 1 },
        { moduleNo: '4', topic: 'Basic introduction to three-phase systems', periods: 1 },
        { moduleNo: '5', topic: 'Transient Analysis: Analysis of first-order RL and RC circuits using differential equation approach', periods: 2 },
        { moduleNo: '5', topic: 'Determination of initial and steady-state conditions', periods: 2 },
        { moduleNo: '5', topic: 'Natural and forced responses', periods: 1 },
        { moduleNo: '5', topic: 'Time constant and transient behavior under DC excitation; Evaluation of current and voltage responses', periods: 2 },
        { moduleNo: '6', topic: 'Resonance: Series and parallel resonance', periods: 1 },
        { moduleNo: '6', topic: 'Resonant frequency; Quality factor bandwidth and half-power frequencies', periods: 2 },
        { moduleNo: '7', topic: 'Magnetic Circuits: Mutual inductance and coefficient of coupling', periods: 2 },
        { moduleNo: '7', topic: 'Dot convention; Energy considerations; Basic analysis of coupled circuits', periods: 1 },
        { moduleNo: '7', topic: 'Ideal transformer and impedance matching (introductory level).', periods: 1 },
    ],
    designers: [
        {
            name: 'Dr. B. Sathya Bama',
            designation: 'Professor',
            department: 'ECE',
            email: 'sbece@tce.edu',
        },
    ],
    status: 'APPROVED',
};
async function run() {
    console.log('Generating PDF...');
    const pdfBuf = await generatePdfDocument(COURSE_26ECCA0);
    const pdfPath = path.join(ARTIFACT_DIR, '26ECCA0_ELECTRIC_AND_MAGNETIC_CIRCUITS.pdf');
    fs.writeFileSync(pdfPath, pdfBuf);
    console.log(`✓ PDF successfully written to ${pdfPath} (${pdfBuf.length} bytes)`);
    console.log('Generating DOCX...');
    const docxBuf = await generateDocxDocument(COURSE_26ECCA0);
    const docxPath = path.join(ARTIFACT_DIR, '26ECCA0_ELECTRIC_AND_MAGNETIC_CIRCUITS.docx');
    fs.writeFileSync(docxPath, docxBuf);
    console.log(`✓ DOCX successfully written to ${docxPath} (${docxBuf.length} bytes)`);
    console.log('ALL EXPORT GENERATIONS COMPLETED SUCCESSFULLY!');
}
run().catch(err => {
    console.error('Test export failed:', err);
    process.exit(1);
});
