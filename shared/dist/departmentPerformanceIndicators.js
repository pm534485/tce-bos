// Department-specific Performance Indicators (TCE Regulation 2026 / AICTE Examination Reform Policy)
import { isPgProgramme } from './constants.js';
// 1. Mechanical Engineering
export const MECHANICAL_PERFORMANCE_INDICATORS = [
    // PO 1
    { piNumber: '1.1.1', descriptor: 'Apply mathematical techniques such as calculus, linear algebra, ODE and PDE, to solve problems', tpsLevel: 3 },
    { piNumber: '1.1.2', descriptor: 'Apply advanced mathematical techniques such as ODE and PDE, Numerical methods, Operations research to model and solve mechanical engineering problems', tpsLevel: 3 },
    { piNumber: '1.2.1', descriptor: 'Apply laws of natural science such as Physics, chemistry, Engineering mechanics, thermodynamics, Material science to an engineering problem', tpsLevel: 3 },
    { piNumber: '1.3.1', descriptor: 'Apply fundamental engineering concepts such as Engineering metallurgy, Mechanics of materials, design of machine elements, manufacturing technologies, Thermal Engineering, fluid mechanics, to solve engineering problems', tpsLevel: 3 },
    { piNumber: '1.4.1', descriptor: 'Apply Mechanical engineering concepts such as kinematics and dynamics of machinery, design of transmission system, design of hydraulics and pneumatics, heat and mass transfer, Automotive engineering, thermal systems engineering, statistical Quality control, manufacturing automation, industrial engineering, robotics to solve engineering problems', tpsLevel: 3 },
    { piNumber: '1.5.1', descriptor: 'Apply computing knowledge/ information science such as AutoCAD, solid works, creo, fusion 360, CATIA, INVENTOR, master CAM, ansys, CFD, minitab, java, C++ and python, R programming industry 5.0, AR/VR, digital twins, IoT, auto inventory, Data analytics for personalized manufacturing, Machine learning, decision making to solve mechanical engineering problems', tpsLevel: 3 },
    // PO 2
    { piNumber: '2.1.1', descriptor: 'Articulate problem statements and identify objectives', tpsLevel: 2 },
    { piNumber: '2.1.2', descriptor: 'Identify engineering systems, variables, and parameters to solve the problems', tpsLevel: 2 },
    { piNumber: '2.1.3', descriptor: 'Identify the mathematical, engineering and other relevant knowledge that applies to a given problem', tpsLevel: 2 },
    { piNumber: '2.2.1', descriptor: 'Reframe complex problems into interconnected sub-problems', tpsLevel: 4 },
    { piNumber: '2.2.2', descriptor: 'Identify, assemble and evaluate information and resources', tpsLevel: 4 },
    { piNumber: '2.2.3', descriptor: 'Identify existing processes/solution methods for solving the problem, including forming justified approximations and assumptions', tpsLevel: 4 },
    { piNumber: '2.2.4', descriptor: 'Compare and contrast alternative solution processes to select the best process', tpsLevel: 4 },
    { piNumber: '2.3.1', descriptor: 'Combine scientific principles and engineering concepts to formulate model/s (mathematical and physical) of a system or process that is appropriate in terms of applicability and required accuracy', tpsLevel: 4 },
    { piNumber: '2.3.2', descriptor: 'Identify assumptions (mathematical and physical) necessary to allow modelling of a system at the level of accuracy required', tpsLevel: 4 },
    { piNumber: '2.4.1', descriptor: 'Apply engineering mathematics and computations to solve mathematical models', tpsLevel: 4 },
    { piNumber: '2.4.2', descriptor: 'Produce and validate results through skilful use of contemporary engineering tools and models', tpsLevel: 4 },
    { piNumber: '2.4.3', descriptor: 'Identify sources of error in the solution process, and limitations of the solution', tpsLevel: 4 },
    { piNumber: '2.4.4', descriptor: 'Extract desired understanding and conclusions consistent with objectives and limitations of the analysis', tpsLevel: 4 },
    // PO 3
    { piNumber: '3.1.1', descriptor: 'Recognize that need analysis is key to good problem definition', tpsLevel: 3 },
    { piNumber: '3.1.2', descriptor: 'Elicit and document, engineering requirements from stakeholders', tpsLevel: 3 },
    { piNumber: '3.1.3', descriptor: 'Synthesize engineering requirements from a review of the state-of-the-art', tpsLevel: 3 },
    { piNumber: '3.1.4', descriptor: 'Extract engineering requirements from relevant engineering Codes and Standards such as ASME, ASTM, BIS, ISO and ASHRAE/ISHRAE', tpsLevel: 3 },
    { piNumber: '3.1.5', descriptor: 'Explore and synthesize engineering requirements considering health, safety risks, environmental, cultural and societal issues', tpsLevel: 3 },
    { piNumber: '3.1.6', descriptor: 'Determine design objectives, functional requirements and arrive at specifications', tpsLevel: 3 },
    { piNumber: '3.2.1', descriptor: 'Apply formal idea generation tools to develop multiple engineering design solutions', tpsLevel: 4 },
    { piNumber: '3.2.2', descriptor: 'Build models/prototypes to develop a diverse set of design solutions', tpsLevel: 4 },
    { piNumber: '3.2.3', descriptor: 'Identify suitable criteria for the evaluation of alternate design solutions', tpsLevel: 4 },
    { piNumber: '3.3.1', descriptor: 'Apply formal decision-making tools to select optimal engineering design solutions for further development', tpsLevel: 5 },
    { piNumber: '3.3.2', descriptor: 'Consult with domain experts and stakeholders to select candidate engineering design solution for further development', tpsLevel: 5 },
    { piNumber: '3.4.1', descriptor: 'Refine a conceptual design into a detailed design within the existing constraints (of the resources)', tpsLevel: 4 },
    { piNumber: '3.4.2', descriptor: 'Generate information through appropriate tests to improve or revise the design', tpsLevel: 4 },
    // PO 4
    { piNumber: '4.1.1', descriptor: 'Define a problem, its scope and importance for purposes of investigation', tpsLevel: 3 },
    { piNumber: '4.1.2', descriptor: 'Examine the relevant methods, tools and techniques of experiment design, system calibration, data acquisition, analysis and presentation', tpsLevel: 3 },
    { piNumber: '4.1.3', descriptor: 'Apply appropriate instrumentation and/or software tools to make measurements of physical quantities', tpsLevel: 3 },
    { piNumber: '4.1.4', descriptor: 'Establish a relationship between measured data and underlying physical principles', tpsLevel: 3 },
    { piNumber: '4.2.1', descriptor: 'Design and develop an experimental approach, specify appropriate equipment and procedures', tpsLevel: 5 },
    { piNumber: '4.2.2', descriptor: 'Understand the importance of the statistical design of experiments and choose an appropriate experimental design plan based on the study objectives', tpsLevel: 5 },
    { piNumber: '4.3.1', descriptor: 'Use appropriate procedures, tools and techniques to conduct experiments and collect data', tpsLevel: 4 },
    { piNumber: '4.3.2', descriptor: 'Analyze data for trends and correlations, stating possible errors and limitations', tpsLevel: 4 },
    { piNumber: '4.3.3', descriptor: 'Represent data (in tabular and/or graphical forms) so as to facilitate analysis and explanation of the data, and drawing of conclusions', tpsLevel: 4 },
    { piNumber: '4.3.4', descriptor: 'Synthesize information and knowledge about the problem from the raw data to reach appropriate conclusions', tpsLevel: 4 },
    // PO 5
    { piNumber: '5.1.1', descriptor: 'Identify modern engineering tools such as computer-aided drafting, Computer aided engineering simulations, CAM, PLM modeling and analysis, techniques and resources for engineering activities', tpsLevel: 3 },
    { piNumber: '5.1.2', descriptor: 'Create/adapt/modify/extend tools and techniques to solve engineering problems', tpsLevel: 3 },
    { piNumber: '5.2.1', descriptor: 'Identify the strengths and limitations of tools for (i) acquiring information, (ii) modeling and simulating, (iii) monitoring system performance, and (iv) creating engineering designs', tpsLevel: 3 },
    { piNumber: '5.2.2', descriptor: 'Demonstrate proficiency in using Mechanical engineering-specific tools', tpsLevel: 3 },
    { piNumber: '5.3.1', descriptor: 'Discuss limitations and validate tools, techniques and resources', tpsLevel: 4 },
    { piNumber: '5.3.2', descriptor: 'Verify the credibility of results from tool use with reference to the accuracy and limitations, and the assumptions inherent in their use', tpsLevel: 4 },
    // PO 6
    { piNumber: '6.1.1', descriptor: 'Identify and describe various engineering roles; particularly as pertains to protection of the public and public interest at the global, regional and local level', tpsLevel: 3 },
    { piNumber: '6.2.1', descriptor: 'Interpret legislation, regulations, codes, and standards relevant to your discipline and explain its contribution to the protection of the public', tpsLevel: 3 },
    { piNumber: '6.3.1', descriptor: 'Identify risks/impacts in the life-cycle of an engineering product or activity', tpsLevel: 4 },
    { piNumber: '6.3.2', descriptor: 'Understand the relationship between the technical, socio-economic and environmental dimensions of sustainability', tpsLevel: 4 },
    { piNumber: '6.4.1', descriptor: 'Describe management techniques for sustainable development', tpsLevel: 3 },
    { piNumber: '6.4.2', descriptor: 'Apply principles of preventive engineering and sustainable development to an engineering activity or product relevant to the discipline', tpsLevel: 3 },
    // PO 7
    { piNumber: '7.1.1', descriptor: 'Identify situations of unethical professional conduct and propose ethical alternatives', tpsLevel: 3 },
    { piNumber: '7.2.1', descriptor: 'Identify tenets of the ASME professional code of ethics', tpsLevel: 3 },
    { piNumber: '7.2.2', descriptor: 'Examine and apply moral & ethical principles to known case studies', tpsLevel: 3 },
    // PO 8
    { piNumber: '8.1.1', descriptor: 'Recognize a variety of working and learning preferences; appreciate the value of diversity on a team', tpsLevel: 3 },
    { piNumber: '8.1.2', descriptor: 'Implement the norms of practice (e.g. rules, roles, charters, agendas, etc.) of effective team work, to accomplish a goal', tpsLevel: 3 },
    { piNumber: '8.2.1', descriptor: 'Demonstrate effective communication, problem-solving, conflict resolution and leadership skills', tpsLevel: 3 },
    { piNumber: '8.2.2', descriptor: 'Treat other team members respectfully', tpsLevel: 3 },
    { piNumber: '8.2.3', descriptor: 'Listen to other members', tpsLevel: 3 },
    { piNumber: '8.2.4', descriptor: 'Maintain composure in difficult situations', tpsLevel: 3 },
    { piNumber: '8.3.1', descriptor: 'Present results as a team, with smooth integration of contributions from all individual efforts', tpsLevel: 3 },
    // PO 9
    { piNumber: '9.1.1', descriptor: 'Read, understand and interpret technical and non-technical information', tpsLevel: 3 },
    { piNumber: '9.1.2', descriptor: 'Produce clear, well-constructed, and well-supported written engineering documents', tpsLevel: 3 },
    { piNumber: '9.1.3', descriptor: 'Create flow in a document or presentation - a logical progression of ideas so that the main point is clear', tpsLevel: 3 },
    { piNumber: '9.2.1', descriptor: 'Listen to and comprehend information, instructions, and viewpoints of others', tpsLevel: 3 },
    { piNumber: '9.2.2', descriptor: 'Deliver effective oral presentations to technical and non-technical audiences', tpsLevel: 3 },
    { piNumber: '9.3.1', descriptor: 'Create engineering-standard figures, reports and drawings to complement writing and presentations', tpsLevel: 3 },
    { piNumber: '9.3.2', descriptor: 'Use a variety of media effectively to convey a message in a document or a presentation', tpsLevel: 3 },
    // PO 10
    { piNumber: '10.1.1', descriptor: 'Describe various economic and financial costs/benefits of an engineering activity', tpsLevel: 4 },
    { piNumber: '10.1.2', descriptor: 'Analyze different forms of financial statements to evaluate the financial status of an engineering project', tpsLevel: 4 },
    { piNumber: '10.2.1', descriptor: 'Analyze and select the most appropriate proposal based on economic and financial considerations', tpsLevel: 5 },
    { piNumber: '10.3.1', descriptor: 'Identify the tasks required to complete an engineering activity, and the resources required to complete the tasks', tpsLevel: 3 },
    { piNumber: '10.3.2', descriptor: 'Use project management tools to schedule an engineering project, so it is completed on time and on budget', tpsLevel: 3 },
    // PO 11
    { piNumber: '11.1.1', descriptor: 'Describe the rationale for the requirement for continuing professional development', tpsLevel: 3 },
    { piNumber: '11.1.2', descriptor: 'Identify deficiencies or gaps in knowledge and demonstrate an ability to source information to close this gap', tpsLevel: 3 },
    { piNumber: '11.2.1', descriptor: 'Identify historic points of technological advance in engineering that required practitioners to seek education in order to stay current', tpsLevel: 3 },
    { piNumber: '11.2.2', descriptor: 'Recognize the need and be able to clearly explain why it is vitally important to keep current regarding new developments in your field', tpsLevel: 3 },
    { piNumber: '11.3.1', descriptor: 'Source and comprehend technical literature and other credible sources of information', tpsLevel: 4 },
    { piNumber: '11.3.2', descriptor: 'Analyze sourced technical and popular information for feasibility, viability, sustainability, etc.', tpsLevel: 4 },
];
// 2. CSE Branches (CSE, IT, CSBS, AI&ML)
// Source: Department of Information Technology (GAPC 4.0, TPS SOP v2.0)
export const CSE_BRANCHES_PERFORMANCE_INDICATORS = [
    // GA1 / PO 1
    { piNumber: '1.1.1', descriptor: 'Apply the knowledge of discrete structures, linear algebra, statistics and numerical techniques to solve problems', tpsLevel: 3 },
    { piNumber: '1.1.2', descriptor: 'Apply the concepts of probability, statistics and queuing theory in modeling of computer-based system, and network protocols', tpsLevel: 3 },
    { piNumber: '1.2.1', descriptor: 'Apply laws and principles of natural science to analyze and solve computer engineering problems', tpsLevel: 3 },
    { piNumber: '1.3.1', descriptor: 'Apply fundamental engineering concepts to solve complex computer-based engineering problems', tpsLevel: 3 },
    { piNumber: '1.4.1', descriptor: 'Apply theory and principles of relevant discipline to solve complex engineering problems across various CSE/IT specializations', tpsLevel: 3 },
    // GA2 / PO 2
    { piNumber: '2.1.1', descriptor: 'Examine problem statements to identify objectives, scope, constraints and the processes, modules, algorithms, and parameters of the computer-based system', tpsLevel: 4 },
    { piNumber: '2.1.2', descriptor: 'Infer the mathematical, algorithmic, and domain knowledge applicable to a given computer engineering problem', tpsLevel: 4 },
    { piNumber: '2.2.1', descriptor: 'Decompose a computer-based system into interconnected sub-systems by investigating relevant research literature and forming justified assumptions and approximations', tpsLevel: 4 },
    { piNumber: '2.2.2', descriptor: 'Select the optimal solution methodology for a complex computer engineering problem by examining alternative approaches and considering sustainability implications', tpsLevel: 5 },
    { piNumber: '2.3.1', descriptor: 'Evaluate modules of computer-based systems by applying engineering principles to achieve desired functionality and performance, while identifying design constraints for system modelling and implementation', tpsLevel: 5 },
    { piNumber: '2.4.1', descriptor: 'Implement the solution using engineering mathematics and computational methods, and assess results using contemporary computing tools', tpsLevel: 3 },
    { piNumber: '2.4.2', descriptor: 'Analyze results using contemporary tools, identify limitations and sources of error, and draw conclusions aligned with the objectives and sustainable development principles', tpsLevel: 4 },
    // GA3 / PO 3
    { piNumber: '3.1.1', descriptor: 'Evaluate a precise problem statement with clearly defined objectives, scope, and constraints for a complex computer engineering problem', tpsLevel: 5 },
    { piNumber: '3.1.2', descriptor: 'Examine stakeholder needs to identify and document system requirements, choosing appropriate quality attributes as defined by ISO/IEC/IEEE standards', tpsLevel: 4 },
    { piNumber: '3.1.3', descriptor: 'Investigate state-of-the-art literature to synthesize system requirements considering health, safety, sustainability, net zero carbon, and societal concerns', tpsLevel: 4 },
    { piNumber: '3.1.4', descriptor: 'Assess a Software Requirements Specification (SRS) integrating functional and non-functional requirements, constraints, and quality attributes', tpsLevel: 5 },
    { piNumber: '3.2.1', descriptor: 'Recommend diverse design alternatives to meet functional and non-functional requirements, explicitly accounting for health, safety, sustainability, net zero carbon, and environmental constraints', tpsLevel: 5 },
    { piNumber: '3.2.2', descriptor: 'Examine alternative design solutions against technical, sustainability, and socio-environmental evaluation criteria to identify the most suitable candidate', tpsLevel: 4 },
    { piNumber: '3.3.1', descriptor: 'Evaluate design alternatives against established criteria using structured decision-making tools, consulting domain experts and stakeholders to select the candidate solution for further development', tpsLevel: 5 },
    { piNumber: '3.4.1', descriptor: 'Assess a detailed design from architecture within existing constraints, implementing and integrating software modules, and validating the design against defined requirements', tpsLevel: 5 },
    // GA4 / PO 4
    { piNumber: '4.1.1', descriptor: 'Examine an emerging computer engineering problem for its scope, importance, and the research-based knowledge, procedures, and algorithms needed to conduct a rigorous investigation', tpsLevel: 4 },
    { piNumber: '4.1.2', descriptor: 'Examine and justify appropriate hardware, software tools, datasets, and procedures for the investigation, based on its objectives and constraints', tpsLevel: 4 },
    { piNumber: '4.2.1', descriptor: 'Evaluate experimental procedures and data collection strategies for complex computer engineering investigations, specifying the methodology based on study objectives', tpsLevel: 5 },
    { piNumber: '4.3.1', descriptor: 'Analyze data using appropriate tools and techniques to identify trends, correlations, errors, and limitations of the investigation', tpsLevel: 4 },
    { piNumber: '4.3.2', descriptor: 'Conclude on the validity of engineering findings by representing data in tabular or graphical forms and synthesising results into well-supported conclusions', tpsLevel: 5 },
    // GA5 / PO 5
    { piNumber: '5.1.1', descriptor: 'Apply modern engineering and IT tools, techniques, and resources to engineering activities, modifying or extending them as needed to solve complex computer engineering problems', tpsLevel: 3 },
    { piNumber: '5.2.1', descriptor: 'Operate discipline-specific engineering and IT tools proficiently, recognising their strengths and limitations for information acquisition, simulation, performance monitoring, and design creation', tpsLevel: 3 },
    { piNumber: '5.3.1', descriptor: 'Assess the suitability and credibility of results obtained using engineering tools and techniques by examining their accuracy, underlying modelling assumptions, and inherent limitations', tpsLevel: 5 },
    // GA6 / PO 6
    { piNumber: '6.1.1', descriptor: 'Analyze the roles and responsibilities of computer engineers in protecting public interest at global, regional, and local levels, including responsibilities arising from digital and cyber-physical contexts', tpsLevel: 4 },
    { piNumber: '6.2.1', descriptor: 'Examine legislation, regulations, and standards relevant to computer engineering — including data protection, cybersecurity, and software quality — and explain their contribution to public protection and professional accountability', tpsLevel: 4 },
    { piNumber: '6.3.1', descriptor: 'Evaluate the life-cycle risks and socio-economic, technical, and environmental sustainability dimensions of a computer engineering product, including software, hardware, and deployment phases', tpsLevel: 5 },
    { piNumber: '6.4.1', descriptor: 'Apply principles of preventive engineering, net zero carbon thinking, green software design, and sustainable development to computer engineering activities', tpsLevel: 3 },
    // GA7 / PO 7
    { piNumber: '7.1.1', descriptor: 'Examine situations of unethical professional conduct in computing contexts against principles of human values, diversity, inclusion, and professional norms, and recommend ethically justified alternatives', tpsLevel: 4 },
    { piNumber: '7.2.1', descriptor: 'Apply ACM/IEEE professional codes of ethics and relevant national and international laws to analyze and resolve ethical dilemmas in computer engineering case studies', tpsLevel: 3 },
    // GA8 / PO 8
    { piNumber: '8.1.1', descriptor: 'Demonstrate the value of team diversity and the norms of effective collaborative practice, and implement team roles, charters, and agendas to accomplish a goal', tpsLevel: 3 },
    { piNumber: '8.2.1', descriptor: 'Demonstrate effective communication, problem-solving, conflict management, and leadership skills as both an individual contributor and a team member in face-to-face, remote, and distributed settings', tpsLevel: 3 },
    { piNumber: '8.2.2', descriptor: 'Apply respectful and inclusive interpersonal practices by actively listening, appreciating diversity of thought, and maintaining composure in challenging team situations', tpsLevel: 3 },
    { piNumber: '8.3.1', descriptor: 'Evaluate integrated project outcomes by coordinating and synthesising contributions from all members of diverse or multidisciplinary software engineering teams', tpsLevel: 5 },
    // GA9 / PO 9
    { piNumber: '9.1.1', descriptor: 'Apply technical and non-technical information from computer engineering literature and project documentation to extract actionable understanding', tpsLevel: 3 },
    { piNumber: '9.1.2', descriptor: 'Assess clear, well-structured engineering reports and design documents with a logical flow of ideas that communicates the main point unambiguously', tpsLevel: 5 },
    { piNumber: '9.2.1', descriptor: 'Demonstrate effective oral presentation and active listening skills, adapting content and delivery to technical and non-technical audiences and to cultural, language, and learning differences', tpsLevel: 3 },
    { piNumber: '9.3.1', descriptor: 'Evaluate engineering-standard figures, reports, and multi-media materials that effectively convey information, adapting format and language to the cultural, linguistic, and learning context of the audience', tpsLevel: 5 },
    // GA10 / PO 10
    { piNumber: '10.1.1', descriptor: 'Analyze the economic and financial performance of a computer engineering project by examining costs, benefits, and financial statements', tpsLevel: 4 },
    { piNumber: '10.2.1', descriptor: 'Select the most appropriate computer engineering proposal based on a comprehensive analysis of costs, benefits, and financial implications of alternatives', tpsLevel: 5 },
    { piNumber: '10.3.1', descriptor: 'Implement project management tools to schedule, monitor, and complete a computer engineering activity within time and budget constraints, identifying the required tasks and resources', tpsLevel: 3 },
    // GA11 / PO 11
    { piNumber: '11.1.1', descriptor: 'Demonstrate the need for continuing professional development and source credible information to identify and close knowledge gaps in computer engineering practice', tpsLevel: 3 },
    { piNumber: '11.2.1', descriptor: 'Analyze historic and current technological advances in computing practice to recognise the need for continuous adaptation and professional updating in the face of emerging technologies', tpsLevel: 4 },
    { piNumber: '11.3.1', descriptor: 'Assess the feasibility, viability, sustainability, and engineering relevance of emerging computer engineering issues by critically evaluating technical literature and credible sources', tpsLevel: 5 },
];
// 3. Mechatronics Engineering
export const MECHATRONICS_PERFORMANCE_INDICATORS = [
    // PO 1
    { piNumber: '1.1.1', descriptor: 'Apply mathematical techniques such as calculus, linear algebra, differential equations, and statistics to analyze dynamic systems in mechatronics', tpsLevel: 3 },
    { piNumber: '1.1.2', descriptor: 'Apply advanced mathematical techniques including Z-transforms, Laplace transforms, and state-space representations to model and solve mechatronics engineering problems', tpsLevel: 3 },
    { piNumber: '1.2.1', descriptor: 'Apply laws of mechanics, electromagnetism, thermodynamics and natural science to analyze integrated electro-mechanical systems', tpsLevel: 3 },
    { piNumber: '1.3.1', descriptor: 'Apply fundamental engineering concepts from mechanical, electrical, and computer engineering to solve integrated mechatronics problems', tpsLevel: 3 },
    { piNumber: '1.4.1', descriptor: 'Apply Mechatronics engineering concepts including robotics, control systems, embedded systems, and sensor/actuator integration to solve complex engineering problems', tpsLevel: 3 },
    { piNumber: '1.4.2', descriptor: 'Demonstrate knowledge of microcontroller/microprocessor architecture, real-time operating systems, and embedded firmware development for mechatronics applications', tpsLevel: 3 },
    { piNumber: '1.5.1', descriptor: 'Apply programming languages and computational tools to model, simulate, and analyze mechatronics systems', tpsLevel: 3 },
    // PO 2
    { piNumber: '2.1.1', descriptor: 'Articulate problem statements and identify objectives for complex mechatronics systems involving mechanical, electrical, and software interdependencies', tpsLevel: 2 },
    { piNumber: '2.1.2', descriptor: 'Identify system variables and parameters including mechanical dynamics, electrical signals, and software states required to model and solve mechatronics problems', tpsLevel: 2 },
    { piNumber: '2.1.3', descriptor: 'Identify the relevant mathematical, control theory, signal processing, and embedded computing knowledge applicable to a given mechatronics problem', tpsLevel: 2 },
    { piNumber: '2.2.1', descriptor: 'Reframe complex mechatronics problems into interconnected sub-problems spanning mechanical, electronics, control, and software domains', tpsLevel: 4 },
    { piNumber: '2.2.2', descriptor: 'Identify, assemble, and evaluate information and resources including datasheets, control standards, and research literature relevant to mechatronics systems', tpsLevel: 4 },
    { piNumber: '2.2.3', descriptor: 'Identify existing solution methods for mechatronics problems including PID control strategies, sensor fusion techniques, and actuator drive approaches, forming justified approximations', tpsLevel: 4 },
    { piNumber: '2.2.4', descriptor: 'Compare and contrast alternative control architectures, communication protocols and hardware platforms to select the best solution for a mechatronics application', tpsLevel: 4 },
    { piNumber: '2.3.1', descriptor: 'Combine principles of dynamics, electronics, and control theory to formulate mathematical or simulation models of mechatronics systems appropriate in terms of applicability and required accuracy', tpsLevel: 4 },
    { piNumber: '2.3.2', descriptor: 'Identify physical and computational assumptions necessary to allow modelling of a mechatronics system at the level of accuracy required', tpsLevel: 4 },
    { piNumber: '2.4.1', descriptor: 'Apply engineering mathematics, model-based design tools, and computational tools to solve dynamic models of mechatronics systems', tpsLevel: 4 },
    { piNumber: '2.4.2', descriptor: 'Produce and validate results through hardware-in-the-loop (HIL) simulation, multidomain simulation modelling, and physical testing of mechatronics prototypes', tpsLevel: 4 },
    { piNumber: '2.4.3', descriptor: 'Identify sources of error such as sensor noise, quantization error, actuator nonlinearity, and timing jitter in mechatronics solutions, and recognize limitations of the solution', tpsLevel: 4 },
    { piNumber: '2.4.4', descriptor: 'Extract conclusions on system stability, dynamic response characteristics, and integration performance consistent with objectives and physical constraints of the mechatronics analysis', tpsLevel: 4 },
    // PO 3
    { piNumber: '3.1.1', descriptor: 'Recognize that need analysis is key to defining mechatronics system requirements, considering functional, safety, and real-time performance needs', tpsLevel: 3 },
    { piNumber: '3.1.2', descriptor: 'Elicit and document mechatronics system requirements from stakeholders, covering mechanical structure, actuation, sensing, software, and human-machine interface (HMI) aspects', tpsLevel: 3 },
    { piNumber: '3.1.3', descriptor: 'Synthesize mechatronics design requirements from a review of the state-of-the-art in robotics, autonomous systems, and intelligent control', tpsLevel: 3 },
    { piNumber: '3.1.4', descriptor: 'Extract engineering requirements from codes and standards relevant to mechatronics, including IEC 61508 (functional safety), ISO 10218 (industrial robots), IPC standards (electronics), and ASME/BIS/ISO where applicable', tpsLevel: 3 },
    { piNumber: '3.1.5', descriptor: 'Explore and synthesize mechatronics system requirements considering electromagnetic compatibility (EMC), functional safety, cybersecurity risks in connected systems, and the societal impact of automation', tpsLevel: 3 },
    { piNumber: '3.1.6', descriptor: 'Determine design objectives, functional requirements, and arrive at system-level specifications for an integrated mechatronics product encompassing mechanical structure, actuation, sensing, control, and communication', tpsLevel: 3 },
    { piNumber: '3.2.1', descriptor: 'Apply formal idea generation tools like morphological charts, TRIZ, QFD to develop multiple mechatronics design solutions integrating mechanical, electrical, and software sub-systems', tpsLevel: 4 },
    { piNumber: '3.2.2', descriptor: 'Build simulation models, electronic breadboard prototypes, and 3D-printed mechanical mockups to develop a diverse set of mechatronics design solutions considering public health, safety, and sustainability', tpsLevel: 4 },
    { piNumber: '3.2.3', descriptor: 'Identify suitable evaluation criteria for mechatronics designs, including response time, power consumption, payload capacity, communication latency, cost, and long-term reliability', tpsLevel: 4 },
    { piNumber: '3.3.1', descriptor: 'Apply formal decision-making tools to select the optimal mechatronics design considering integration complexity, cost, safety, net zero carbon impact, and performance', tpsLevel: 5 },
    { piNumber: '3.3.2', descriptor: 'Consult with domain experts in robotics, control, and electronics, as well as end-user stakeholders, to select the candidate mechatronics design solution for further development', tpsLevel: 5 },
    { piNumber: '3.4.1', descriptor: 'Refine a conceptual mechatronics design into a detailed design including PCB layout, mechanical CAD models, control algorithm implementation, and embedded firmware, within the existing constraints of resources', tpsLevel: 4 },
    { piNumber: '3.4.2', descriptor: 'Generate performance data through hardware testing and field trials to improve or revise the mechatronics design', tpsLevel: 4 },
    // PO 4
    { piNumber: '4.1.1', descriptor: 'Define a mechatronics problem, its scope and importance for purposes of investigation, including system boundaries across mechanical, electrical, software, and control domains', tpsLevel: 3 },
    { piNumber: '4.1.2', descriptor: 'Examine relevant methods, tools, and techniques for mechatronics experimentation including oscilloscopes, logic analysers, motion capture systems, DAQ systems, system calibration, and data presentation', tpsLevel: 3 },
    { piNumber: '4.1.3', descriptor: 'Apply appropriate sensors (encoders, IMUs, force/torque sensors, proximity sensors, etc) and software tools to make measurements of physical quantities in mechatronics systems', tpsLevel: 3 },
    { piNumber: '4.1.4', descriptor: 'Establish relationships between measured sensor signals and underlying physical principles such as kinematics, rigid body dynamics, electromagnetic induction, and heat transfer', tpsLevel: 3 },
    { piNumber: '4.2.1', descriptor: 'Design and develop an experimental approach for mechatronics systems, specifying sensor types, sampling rates, actuator interfaces, embedded platforms, and test procedures', tpsLevel: 5 },
    { piNumber: '4.2.2', descriptor: 'Understand the importance of statistical design of experiments (DoE) and apply signal processing techniques (FFT, digital filtering) to plan an appropriate experimental design for mechatronics system characterisation based on study objectives', tpsLevel: 5 },
    { piNumber: '4.3.1', descriptor: 'Use embedded data logging, model design softwares to conduct experiments, collect time-series sensor data, and monitor real-time mechatronics system states', tpsLevel: 4 },
    { piNumber: '4.3.2', descriptor: 'Analyse mechatronics system data for trends, stability margins, dynamic response, and correlations, stating possible errors including sensor noise, quantisation, and actuator nonlinearity', tpsLevel: 4 },
    { piNumber: '4.3.3', descriptor: 'Represent mechatronics data using time-domain plots, Bode plots, phase portraits, and state trajectories in tabular and graphical forms to facilitate analysis and drawing of conclusions', tpsLevel: 4 },
    { piNumber: '4.3.4', descriptor: 'Synthesise knowledge of system integration, sensor-actuator interaction, and control performance from raw experimental data to reach appropriate mechatronics engineering conclusions', tpsLevel: 4 },
    // PO 5
    { piNumber: '5.1.1', descriptor: 'Identify modern mechatronics engineering tools including model based design, ROS/ROS2, CAD/CAM software, PCB design tools, embedded IDEs, and simulation environments for prediction and modelling', tpsLevel: 3 },
    { piNumber: '5.1.2', descriptor: 'Create/adapt/modify, or extend tools such as custom ROS nodes, embedded peripheral drivers, Simulink custom blocks, or automation scripts to solve mechatronics engineering problems', tpsLevel: 3 },
    { piNumber: '5.2.1', descriptor: 'Identify the strengths and limitations of mechatronics tools for: (i) sensor data acquisition, (ii) real-time control and HIL simulation, (iii) robot motion planning and monitoring, and (iv) creating embedded system and mechanical designs', tpsLevel: 3 },
    { piNumber: '5.2.2', descriptor: 'Demonstrate proficiency in discipline-specific mechatronics tools by programming microcontrollers (ARM Cortex, Arduino, Raspberry Pi), implementing digital control loops, and integrating sensor-actuator sub-systems', tpsLevel: 3 },
    { piNumber: '5.3.1', descriptor: 'Discuss limitations of mechatronics tools including simulation fidelity gaps, real-time scheduling constraints, communication latency, and numerical precision, and validate tool outputs against physical measurements', tpsLevel: 4 },
    { piNumber: '5.3.2', descriptor: 'Verify the credibility of results from mechatronics tool use by benchmarking simulations against hardware test data and critically assessing inherent assumptions', tpsLevel: 4 },
    // PO 6
    { piNumber: '6.1.1', descriptor: 'Identify and describe various engineering roles; particularly as pertains to protection of the public and public interest at the global, regional and local level', tpsLevel: 3 },
    { piNumber: '6.2.1', descriptor: 'Interpret legislation, regulations, codes, and standards relevant to your discipline and explain its contribution to the protection of the public', tpsLevel: 3 },
    { piNumber: '6.3.1', descriptor: 'Identify risks/impacts in the life-cycle of an engineering product or activity', tpsLevel: 4 },
    { piNumber: '6.3.2', descriptor: 'Understand the relationship between the technical, socio-economic and environmental dimensions of sustainability', tpsLevel: 4 },
    { piNumber: '6.4.1', descriptor: 'Describe management techniques for sustainable development', tpsLevel: 3 },
    { piNumber: '6.4.2', descriptor: 'Apply principles of preventive engineering and sustainable development to an engineering activity or product relevant to the discipline', tpsLevel: 3 },
    // PO 7
    { piNumber: '7.1.1', descriptor: 'Identify situations of unethical professional conduct and propose ethical alternatives', tpsLevel: 3 },
    { piNumber: '7.2.1', descriptor: 'Identify tenets of the ASME professional code of ethics', tpsLevel: 3 },
    { piNumber: '7.2.2', descriptor: 'Examine and apply moral & ethical principles to known case studies', tpsLevel: 3 },
    // PO 8
    { piNumber: '8.1.1', descriptor: 'Recognize a variety of working and learning preferences; appreciate the value of diversity on a team', tpsLevel: 3 },
    { piNumber: '8.1.2', descriptor: 'Implement the norms of practice (e.g. rules, roles, charters, agendas, etc.) of effective team work, to accomplish a goal', tpsLevel: 3 },
    { piNumber: '8.2.1', descriptor: 'Demonstrate effective communication, problem-solving, conflict resolution and leadership skills', tpsLevel: 3 },
    { piNumber: '8.2.2', descriptor: 'Treat other team members respectfully', tpsLevel: 3 },
    { piNumber: '8.2.3', descriptor: 'Listen to other members', tpsLevel: 3 },
    { piNumber: '8.2.4', descriptor: 'Maintain composure in difficult situations', tpsLevel: 3 },
    { piNumber: '8.3.1', descriptor: 'Present results as a team, with smooth integration of contributions from all individual efforts', tpsLevel: 3 },
    // PO 9
    { piNumber: '9.1.1', descriptor: 'Read, understand and interpret technical and non-technical information', tpsLevel: 3 },
    { piNumber: '9.1.2', descriptor: 'Produce clear, well-constructed, and well-supported written engineering documents', tpsLevel: 3 },
    { piNumber: '9.1.3', descriptor: 'Create flow in a document or presentation - a logical progression of ideas so that the main point is clear', tpsLevel: 3 },
    { piNumber: '9.2.1', descriptor: 'Listen to and comprehend information, instructions, and viewpoints of others', tpsLevel: 3 },
    { piNumber: '9.2.2', descriptor: 'Deliver effective oral presentations to technical and non-technical audiences', tpsLevel: 3 },
    { piNumber: '9.3.1', descriptor: 'Create engineering-standard figures, reports and drawings to complement writing and presentations', tpsLevel: 3 },
    { piNumber: '9.3.2', descriptor: 'Use a variety of media effectively to convey a message in a document or a presentation', tpsLevel: 3 },
    // PO 10
    { piNumber: '10.1.1', descriptor: 'Describe various economic and financial costs/benefits of an engineering activity', tpsLevel: 4 },
    { piNumber: '10.1.2', descriptor: 'Analyze different forms of financial statements to evaluate the financial status of an engineering project', tpsLevel: 4 },
    { piNumber: '10.2.1', descriptor: 'Analyze and select the most appropriate proposal based on economic and financial considerations', tpsLevel: 5 },
    { piNumber: '10.3.1', descriptor: 'Identify the tasks required to complete an engineering activity, and the resources required to complete the tasks', tpsLevel: 3 },
    { piNumber: '10.3.2', descriptor: 'Use project management tools to schedule an engineering project, so it is completed on time and on budget', tpsLevel: 3 },
    // PO 11
    { piNumber: '11.1.1', descriptor: 'Describe the rationale for the requirement for continuing professional development', tpsLevel: 3 },
    { piNumber: '11.1.2', descriptor: 'Identify deficiencies or gaps in knowledge and demonstrate an ability to source information to close this gap', tpsLevel: 3 },
    { piNumber: '11.2.1', descriptor: 'Identify historic points of technological advance in engineering that required practitioners to seek education in order to stay current', tpsLevel: 3 },
    { piNumber: '11.2.2', descriptor: 'Recognize the need and be able to clearly explain why it is vitally important to keep current regarding new developments in your field', tpsLevel: 3 },
    { piNumber: '11.3.1', descriptor: 'Source and comprehend technical literature and other credible sources of information', tpsLevel: 4 },
    { piNumber: '11.3.2', descriptor: 'Analyze sourced technical and popular information for feasibility, viability, sustainability, etc.', tpsLevel: 4 },
];
// 4. EEE (Electrical and Electronics Engineering)
export const EEE_PERFORMANCE_INDICATORS = [
    // PO 1
    { piNumber: '1.1.1', descriptor: 'Apply mathematical techniques such as calculus, linear algebra, and statistics to solve problems', tpsLevel: 3 },
    { piNumber: '1.1.2', descriptor: 'Apply advanced mathematical techniques to model and solve electrical and electronics engineering problems', tpsLevel: 3 },
    { piNumber: '1.2.1', descriptor: 'Apply laws of natural science to an engineering problem', tpsLevel: 3 },
    { piNumber: '1.3.1', descriptor: 'Apply fundamental engineering concepts to solve engineering problems', tpsLevel: 3 },
    { piNumber: '1.4.1', descriptor: 'Apply electrical and electronics engineering concepts to solve engineering problems', tpsLevel: 3 },
    { piNumber: '1.5.1', descriptor: 'Apply computing and information science knowledge using programming languages (C, C++, Python and MATLAB), numerical and simulation tools (MATLAB/Simulink, PSCAD, ETAP and LabVIEW), data analytics, machine learning and IoT-based platforms to model, simulate, analyse and solve electrical and electronics engineering problems', tpsLevel: 3 },
    // PO 2
    { piNumber: '2.1.1', descriptor: 'Articulate problem statements and identify objectives', tpsLevel: 2 },
    { piNumber: '2.1.2', descriptor: 'Identify engineering systems, variables, and parameters to solve the problems', tpsLevel: 2 },
    { piNumber: '2.1.3', descriptor: 'Identify the mathematical, engineering and other relevant knowledge that applies to a given problem', tpsLevel: 2 },
    { piNumber: '2.2.1', descriptor: 'Reframe complex problems into interconnected sub-problems', tpsLevel: 4 },
    { piNumber: '2.2.2', descriptor: 'Identify, assemble and evaluate information and resources', tpsLevel: 4 },
    { piNumber: '2.2.3', descriptor: 'Identify existing processes/solution methods for solving the problem, including forming justified approximations and assumptions', tpsLevel: 4 },
    { piNumber: '2.2.4', descriptor: 'Compare and contrast alternative solution processes to select the best process', tpsLevel: 4 },
    { piNumber: '2.3.1', descriptor: 'Combine scientific principles and engineering concepts to formulate model/s (mathematical or otherwise) of a system or process that is appropriate in terms of applicability and required accuracy', tpsLevel: 4 },
    { piNumber: '2.3.2', descriptor: 'Identify assumptions (mathematical and physical) necessary to allow modelling of a system at the level of accuracy required', tpsLevel: 4 },
    { piNumber: '2.4.1', descriptor: 'Apply engineering mathematics and computations to solve mathematical models', tpsLevel: 4 },
    { piNumber: '2.4.2', descriptor: 'Produce and validate results through skilful use of contemporary engineering tools and models', tpsLevel: 4 },
    { piNumber: '2.4.3', descriptor: 'Identify sources of error in the solution process, and limitations of the solution', tpsLevel: 4 },
    { piNumber: '2.4.4', descriptor: 'Extract desired understanding and conclusions consistent with objectives and limitations of the analysis', tpsLevel: 4 },
    // PO 3
    { piNumber: '3.1.1', descriptor: 'Recognize that need analysis is key to good problem definition', tpsLevel: 3 },
    { piNumber: '3.1.2', descriptor: 'Elicit and document, engineering requirements from stakeholders', tpsLevel: 3 },
    { piNumber: '3.1.3', descriptor: 'Synthesize engineering requirements from a review of the state-of-the-art', tpsLevel: 3 },
    { piNumber: '3.1.4', descriptor: 'Extract engineering requirements from relevant engineering Codes and Standards such as ASME, ASTM, BIS, ISO and ASHRAE', tpsLevel: 3 },
    { piNumber: '3.1.5', descriptor: 'Explore and synthesize engineering requirements considering health, safety risks, environmental, cultural and societal issues', tpsLevel: 3 },
    { piNumber: '3.1.6', descriptor: 'Determine design objectives, functional requirements and arrive at specifications', tpsLevel: 3 },
    { piNumber: '3.2.1', descriptor: 'Apply formal idea generation tools to develop multiple engineering design solutions', tpsLevel: 4 },
    { piNumber: '3.2.2', descriptor: 'Build models/prototypes to develop a diverse set of design solutions', tpsLevel: 4 },
    { piNumber: '3.2.3', descriptor: 'Identify suitable criteria for the evaluation of alternate design solutions', tpsLevel: 4 },
    { piNumber: '3.3.1', descriptor: 'Apply formal decision-making tools to select optimal engineering design solutions for further development', tpsLevel: 5 },
    { piNumber: '3.3.2', descriptor: 'Consult with domain experts and stakeholders to select candidate engineering design solution for further development', tpsLevel: 5 },
    { piNumber: '3.4.1', descriptor: 'Refine a conceptual design into a detailed design within the existing constraints (of the resources)', tpsLevel: 4 },
    { piNumber: '3.4.2', descriptor: 'Generate information through appropriate tests to improve or revise the design', tpsLevel: 4 },
    // PO 4
    { piNumber: '4.1.1', descriptor: 'Define a problem, its scope and importance for purposes of investigation', tpsLevel: 3 },
    { piNumber: '4.1.2', descriptor: 'Examine the relevant methods, tools and techniques of experiment design, system calibration, data acquisition, analysis and presentation', tpsLevel: 3 },
    { piNumber: '4.1.3', descriptor: 'Apply appropriate instrumentation and/or software tools to make measurements of physical quantities', tpsLevel: 3 },
    { piNumber: '4.1.4', descriptor: 'Establish a relationship between measured data and underlying physical principles', tpsLevel: 3 },
    { piNumber: '4.2.1', descriptor: 'Design and develop an experimental approach, specify appropriate equipment and procedures', tpsLevel: 5 },
    { piNumber: '4.2.2', descriptor: 'Understand the importance of the statistical design of experiments and choose an appropriate experimental design plan based on the study objectives', tpsLevel: 5 },
    { piNumber: '4.3.1', descriptor: 'Use appropriate procedures, tools and techniques to conduct experiments and collect data', tpsLevel: 4 },
    { piNumber: '4.3.2', descriptor: 'Analyze data for trends and correlations, stating possible errors and limitations', tpsLevel: 4 },
    { piNumber: '4.3.3', descriptor: 'Represent data (in tabular and/or graphical forms) so as to facilitate analysis and explanation of the data, and drawing of conclusions', tpsLevel: 4 },
    { piNumber: '4.3.4', descriptor: 'Synthesize information and knowledge about the problem from the raw data to reach appropriate conclusions', tpsLevel: 4 },
    // PO 5
    { piNumber: '5.1.1', descriptor: 'Identify modern engineering tools such as computer-aided drafting, modeling and analysis; techniques and resources for engineering activities', tpsLevel: 3 },
    { piNumber: '5.1.2', descriptor: 'Create/adapt/modify/extend tools and techniques to solve engineering problems', tpsLevel: 3 },
    { piNumber: '5.2.1', descriptor: 'Identify the strengths and limitations of tools for (i) acquiring information, (ii) modeling and simulating, (iii) monitoring system performance, and (iv) creating engineering designs', tpsLevel: 3 },
    { piNumber: '5.2.2', descriptor: 'Demonstrate proficiency in using discipline-specific tools', tpsLevel: 3 },
    { piNumber: '5.3.1', descriptor: 'Discuss limitations and validate tools, techniques and resources', tpsLevel: 4 },
    { piNumber: '5.3.2', descriptor: 'Verify the credibility of results from tool use with reference to the accuracy and limitations, and the assumptions inherent in their use', tpsLevel: 4 },
    // PO 6
    { piNumber: '6.1.1', descriptor: 'Identify and describe various engineering roles; particularly as pertains to protection of the public and public interest at the global, regional and local level', tpsLevel: 3 },
    { piNumber: '6.2.1', descriptor: 'Interpret legislation, regulations, codes, and standards relevant to your discipline and explain its contribution to the protection of the public', tpsLevel: 3 },
    { piNumber: '6.3.1', descriptor: 'Identify risks/impacts in the life-cycle of an engineering product or activity', tpsLevel: 4 },
    { piNumber: '6.3.2', descriptor: 'Understand the relationship between the technical, socio-economic and environmental dimensions of sustainability', tpsLevel: 4 },
    { piNumber: '6.4.1', descriptor: 'Describe management techniques for sustainable development', tpsLevel: 3 },
    { piNumber: '6.4.2', descriptor: 'Apply principles of preventive engineering and sustainable development to an engineering activity or product relevant to the discipline', tpsLevel: 3 },
    // PO 7
    { piNumber: '7.1.1', descriptor: 'Identify situations of unethical professional conduct and propose ethical alternatives', tpsLevel: 3 },
    { piNumber: '7.2.1', descriptor: 'Identify tenets of the ASME professional code of ethics', tpsLevel: 3 },
    { piNumber: '7.2.2', descriptor: 'Examine and apply moral & ethical principles to known case studies', tpsLevel: 3 },
    // PO 8
    { piNumber: '8.1.1', descriptor: 'Recognize a variety of working and learning preferences; appreciate the value of diversity on a team', tpsLevel: 3 },
    { piNumber: '8.1.2', descriptor: 'Implement the norms of practice (e.g. rules, roles, charters, agendas, etc.) of effective team work, to accomplish a goal', tpsLevel: 3 },
    { piNumber: '8.2.1', descriptor: 'Demonstrate effective communication, problem-solving, conflict resolution and leadership skills', tpsLevel: 3 },
    { piNumber: '8.2.2', descriptor: 'Treat other team members respectfully', tpsLevel: 3 },
    { piNumber: '8.2.3', descriptor: 'Listen to other members', tpsLevel: 3 },
    { piNumber: '8.2.4', descriptor: 'Maintain composure in difficult situations', tpsLevel: 3 },
    { piNumber: '8.3.1', descriptor: 'Present results as a team, with smooth integration of contributions from all individual efforts', tpsLevel: 3 },
    // PO 9
    { piNumber: '9.1.1', descriptor: 'Read, understand and interpret technical and non-technical information', tpsLevel: 3 },
    { piNumber: '9.1.2', descriptor: 'Produce clear, well-constructed, and well-supported written engineering documents', tpsLevel: 3 },
    { piNumber: '9.1.3', descriptor: 'Create flow in a document or presentation - a logical progression of ideas so that the main point is clear', tpsLevel: 3 },
    { piNumber: '9.2.1', descriptor: 'Listen to and comprehend information, instructions, and viewpoints of others', tpsLevel: 3 },
    { piNumber: '9.2.2', descriptor: 'Deliver effective oral presentations to technical and non-technical audiences', tpsLevel: 3 },
    { piNumber: '9.3.1', descriptor: 'Create engineering-standard figures, reports and drawings to complement writing and presentations', tpsLevel: 3 },
    { piNumber: '9.3.2', descriptor: 'Use a variety of media effectively to convey a message in a document or a presentation', tpsLevel: 3 },
    // PO 10
    { piNumber: '10.1.1', descriptor: 'Describe various economic and financial costs/benefits of an engineering activity', tpsLevel: 4 },
    { piNumber: '10.1.2', descriptor: 'Analyze different forms of financial statements to evaluate the financial status of an engineering project', tpsLevel: 4 },
    { piNumber: '10.2.1', descriptor: 'Analyze and select the most appropriate proposal based on economic and financial considerations', tpsLevel: 5 },
    { piNumber: '10.3.1', descriptor: 'Identify the tasks required to complete an engineering activity, and the resources required to complete the tasks', tpsLevel: 3 },
    { piNumber: '10.3.2', descriptor: 'Use project management tools to schedule an engineering project, so it is completed on time and on budget', tpsLevel: 3 },
    // PO 11
    { piNumber: '11.1.1', descriptor: 'Describe the rationale for the requirement for continuing professional development', tpsLevel: 3 },
    { piNumber: '11.1.2', descriptor: 'Identify deficiencies or gaps in knowledge and demonstrate an ability to source information to close this gap', tpsLevel: 3 },
    { piNumber: '11.2.1', descriptor: 'Identify historic points of technological advance in engineering that required practitioners to seek education in order to stay current', tpsLevel: 3 },
    { piNumber: '11.2.2', descriptor: 'Recognize the need and be able to clearly explain why it is vitally important to keep current regarding new developments in your field', tpsLevel: 3 },
    { piNumber: '11.3.1', descriptor: 'Source and comprehend technical literature and other credible sources of information', tpsLevel: 4 },
    { piNumber: '11.3.2', descriptor: 'Analyze sourced technical and popular information for feasibility, viability, sustainability, etc.', tpsLevel: 4 },
];
// 5. ECE (Electronics and Communication Engineering)
export const ECE_PERFORMANCE_INDICATORS = [
    // PO 1
    { piNumber: '1.1.1', descriptor: 'Apply calculus, linear algebra, probability and statistics to analyse electronics and communication engineering problems', tpsLevel: 3 },
    { piNumber: '1.1.2', descriptor: 'Apply numerical methods, differential equations, transforms and optimization techniques to model and solve electronics and communication engineering problems', tpsLevel: 3 },
    { piNumber: '1.2.1', descriptor: 'Apply principles of physics, chemistry and relevant natural sciences, including electromagnetism, semiconductor materials and electronic properties, to electronics and communication engineering problems', tpsLevel: 3 },
    { piNumber: '1.3.1', descriptor: 'Apply engineering fundamentals such as circuit theory, network analysis, electronic devices, digital logic and programming to solve engineering problems', tpsLevel: 3 },
    { piNumber: '1.4.1', descriptor: 'Apply specialized electronics and communication engineering knowledge in analog and digital circuits, signals and systems, signal processing, communication systems, RF and antennas, VLSI, embedded systems and networks to solve engineering problems', tpsLevel: 3 },
    { piNumber: '1.5.1', descriptor: 'Apply computing and information science using Python, C, numerical computation, data structures, algorithms, simulation and CAD tools to analyse data, model and solve electronics and communication engineering problems', tpsLevel: 3 },
    // PO 2
    { piNumber: '2.1.1', descriptor: 'Articulate problem statements and identify objectives', tpsLevel: 2 },
    { piNumber: '2.1.2', descriptor: 'Identify engineering systems, variables, and parameters to solve the problems', tpsLevel: 2 },
    { piNumber: '2.1.3', descriptor: 'Identify the mathematical, engineering and other relevant knowledge that applies to a given problem', tpsLevel: 2 },
    { piNumber: '2.2.1', descriptor: 'Reframe complex problems into interconnected sub-problems', tpsLevel: 4 },
    { piNumber: '2.2.2', descriptor: 'Identify, assemble and evaluate information and resources', tpsLevel: 4 },
    { piNumber: '2.2.3', descriptor: 'Identify existing processes/solution methods for solving the problem, including forming justified approximations and assumptions', tpsLevel: 4 },
    { piNumber: '2.2.4', descriptor: 'Compare and contrast alternative solution processes to select the best process', tpsLevel: 4 },
    { piNumber: '2.3.1', descriptor: 'Combine scientific principles and engineering concepts to formulate model/s (mathematical or otherwise) of a system or process that is appropriate in terms of applicability and required accuracy', tpsLevel: 4 },
    { piNumber: '2.3.2', descriptor: 'Identify assumptions (mathematical and physical) necessary to allow modelling of a system at the level of accuracy required', tpsLevel: 4 },
    { piNumber: '2.4.1', descriptor: 'Apply engineering mathematics and computations to solve mathematical models', tpsLevel: 4 },
    { piNumber: '2.4.2', descriptor: 'Produce and validate results through skilful use of contemporary engineering tools and models', tpsLevel: 4 },
    { piNumber: '2.4.3', descriptor: 'Identify sources of error in the solution process, and limitations of the solution', tpsLevel: 4 },
    { piNumber: '2.4.4', descriptor: 'Extract desired understanding and conclusions consistent with objectives and limitations of the analysis', tpsLevel: 4 },
    // PO 3
    { piNumber: '3.1.1', descriptor: 'Recognize that need analysis is key to good problem definition', tpsLevel: 3 },
    { piNumber: '3.1.2', descriptor: 'Elicit and document, engineering requirements from stakeholders', tpsLevel: 3 },
    { piNumber: '3.1.3', descriptor: 'Synthesize engineering requirements from a review of the state-of-the-art', tpsLevel: 3 },
    { piNumber: '3.1.4', descriptor: 'Extract engineering requirements from relevant engineering Codes and Standards such as ASME, ASTM, BIS, ISO and ASHRAE', tpsLevel: 3 },
    { piNumber: '3.1.5', descriptor: 'Explore and synthesize engineering requirements considering health, safety risks, environmental, cultural and societal issues', tpsLevel: 3 },
    { piNumber: '3.1.6', descriptor: 'Determine design objectives, functional requirements and arrive at specifications', tpsLevel: 3 },
    { piNumber: '3.2.1', descriptor: 'Apply formal idea generation tools to develop multiple engineering design solutions', tpsLevel: 4 },
    { piNumber: '3.2.2', descriptor: 'Build models/prototypes to develop a diverse set of design solutions', tpsLevel: 4 },
    { piNumber: '3.2.3', descriptor: 'Identify suitable criteria for the evaluation of alternate design solutions', tpsLevel: 4 },
    { piNumber: '3.3.1', descriptor: 'Apply formal decision-making tools to select optimal engineering design solutions for further development', tpsLevel: 5 },
    { piNumber: '3.3.2', descriptor: 'Consult with domain experts and stakeholders to select candidate engineering design solution for further development', tpsLevel: 5 },
    { piNumber: '3.4.1', descriptor: 'Refine a conceptual design into a detailed design within the existing constraints (of the resources)', tpsLevel: 4 },
    { piNumber: '3.4.2', descriptor: 'Generate information through appropriate tests to improve or revise the design', tpsLevel: 4 },
    // PO 4
    { piNumber: '4.1.1', descriptor: 'Define a problem, its scope and importance for purposes of investigation', tpsLevel: 3 },
    { piNumber: '4.1.2', descriptor: 'Examine the relevant methods, tools and techniques of experiment design, system calibration, data acquisition, analysis and presentation', tpsLevel: 3 },
    { piNumber: '4.1.3', descriptor: 'Apply appropriate instrumentation and/or software tools to make measurements of physical quantities', tpsLevel: 3 },
    { piNumber: '4.1.4', descriptor: 'Establish a relationship between measured data and underlying physical principles', tpsLevel: 3 },
    { piNumber: '4.2.1', descriptor: 'Design and develop an experimental approach, specify appropriate equipment and procedures', tpsLevel: 5 },
    { piNumber: '4.2.2', descriptor: 'Understand the importance of the statistical design of experiments and choose an appropriate experimental design plan based on the study objectives', tpsLevel: 5 },
    { piNumber: '4.3.1', descriptor: 'Use appropriate procedures, tools and techniques to conduct experiments and collect data', tpsLevel: 4 },
    { piNumber: '4.3.2', descriptor: 'Analyze data for trends and correlations, stating possible errors and limitations', tpsLevel: 4 },
    { piNumber: '4.3.3', descriptor: 'Represent data (in tabular and/or graphical forms) so as to facilitate analysis and explanation of the data, and drawing of conclusions', tpsLevel: 4 },
    { piNumber: '4.3.4', descriptor: 'Synthesize information and knowledge about the problem from the raw data to reach appropriate conclusions', tpsLevel: 4 },
    // PO 5
    { piNumber: '5.1.1', descriptor: 'Identify modern engineering tools such as computer-aided drafting, modeling and analysis; techniques and resources for engineering activities', tpsLevel: 3 },
    { piNumber: '5.1.2', descriptor: 'Create/adapt/modify/extend tools and techniques to solve engineering problems', tpsLevel: 3 },
    { piNumber: '5.2.1', descriptor: 'Identify the strengths and limitations of tools for (i) acquiring information, (ii) modeling and simulating, (iii) monitoring system performance, and (iv) creating engineering designs', tpsLevel: 3 },
    { piNumber: '5.2.2', descriptor: 'Demonstrate proficiency in using discipline-specific tools', tpsLevel: 3 },
    { piNumber: '5.3.1', descriptor: 'Discuss limitations and validate tools, techniques and resources', tpsLevel: 4 },
    { piNumber: '5.3.2', descriptor: 'Verify the credibility of results from tool use with reference to the accuracy and limitations, and the assumptions inherent in their use', tpsLevel: 4 },
    // PO 6
    { piNumber: '6.1.1', descriptor: 'Identify and describe various engineering roles; particularly as pertains to protection of the public and public interest at the global, regional and local level', tpsLevel: 3 },
    { piNumber: '6.2.1', descriptor: 'Interpret legislation, regulations, codes, and standards relevant to your discipline and explain its contribution to the protection of the public', tpsLevel: 3 },
    { piNumber: '6.3.1', descriptor: 'Identify risks/impacts in the life-cycle of an engineering product or activity', tpsLevel: 4 },
    { piNumber: '6.3.2', descriptor: 'Understand the relationship between the technical, socio-economic and environmental dimensions of sustainability', tpsLevel: 4 },
    { piNumber: '6.4.1', descriptor: 'Describe management techniques for sustainable development', tpsLevel: 3 },
    { piNumber: '6.4.2', descriptor: 'Apply principles of preventive engineering and sustainable development to an engineering activity or product relevant to the discipline', tpsLevel: 3 },
    // PO 7
    { piNumber: '7.1.1', descriptor: 'Identify situations of unethical professional conduct and propose ethical alternatives', tpsLevel: 3 },
    { piNumber: '7.2.1', descriptor: 'Identify principles of professional ethics and relevant IEEE codes of ethics', tpsLevel: 3 },
    { piNumber: '7.2.2', descriptor: 'Examine and apply moral and ethical principles to engineering case studies', tpsLevel: 3 },
    // PO 8
    { piNumber: '8.1.1', descriptor: 'Recognize a variety of working and learning preferences; appreciate the value of diversity on a team', tpsLevel: 3 },
    { piNumber: '8.1.2', descriptor: 'Implement the norms of practice (e.g. rules, roles, charters, agendas, etc.) of effective team work, to accomplish a goal', tpsLevel: 3 },
    { piNumber: '8.2.1', descriptor: 'Demonstrate effective communication, problem-solving, conflict resolution and leadership skills', tpsLevel: 3 },
    { piNumber: '8.2.2', descriptor: 'Treat other team members respectfully', tpsLevel: 3 },
    { piNumber: '8.2.3', descriptor: 'Listen to other members', tpsLevel: 3 },
    { piNumber: '8.2.4', descriptor: 'Maintain composure in difficult situations', tpsLevel: 3 },
    { piNumber: '8.3.1', descriptor: 'Present results as a team, with smooth integration of contributions from all individual efforts', tpsLevel: 3 },
    // PO 9
    { piNumber: '9.1.1', descriptor: 'Read, understand and interpret technical and non-technical information', tpsLevel: 3 },
    { piNumber: '9.1.2', descriptor: 'Produce clear, well-constructed, and well-supported written engineering documents', tpsLevel: 3 },
    { piNumber: '9.1.3', descriptor: 'Create flow in a document or presentation - a logical progression of ideas so that the main point is clear', tpsLevel: 3 },
    { piNumber: '9.2.1', descriptor: 'Listen to and comprehend information, instructions, and viewpoints of others', tpsLevel: 3 },
    { piNumber: '9.2.2', descriptor: 'Deliver effective oral presentations to technical and non-technical audiences', tpsLevel: 3 },
    { piNumber: '9.3.1', descriptor: 'Create engineering-standard figures, reports and drawings to complement writing and presentations', tpsLevel: 3 },
    { piNumber: '9.3.2', descriptor: 'Use a variety of media effectively to convey a message in a document or a presentation', tpsLevel: 3 },
    // PO 10
    { piNumber: '10.1.1', descriptor: 'Describe various economic and financial costs/benefits of an engineering activity', tpsLevel: 4 },
    { piNumber: '10.1.2', descriptor: 'Analyze different forms of financial statements to evaluate the financial status of an engineering project', tpsLevel: 4 },
    { piNumber: '10.2.1', descriptor: 'Analyze and select the most appropriate proposal based on economic and financial considerations', tpsLevel: 5 },
    { piNumber: '10.3.1', descriptor: 'Identify the tasks required to complete an engineering activity, and the resources required to complete the tasks', tpsLevel: 3 },
    { piNumber: '10.3.2', descriptor: 'Use project management tools to schedule an engineering project, so it is completed on time and on budget', tpsLevel: 3 },
    // PO 11
    { piNumber: '11.1.1', descriptor: 'Describe the rationale for the requirement for continuing professional development', tpsLevel: 3 },
    { piNumber: '11.1.2', descriptor: 'Identify deficiencies or gaps in knowledge and demonstrate an ability to source information to close this gap', tpsLevel: 3 },
    { piNumber: '11.2.1', descriptor: 'Identify historic points of technological advance in engineering that required practitioners to seek education in order to stay current', tpsLevel: 3 },
    { piNumber: '11.2.2', descriptor: 'Recognize the need and be able to clearly explain why it is vitally important to keep current regarding new developments in your field', tpsLevel: 3 },
    { piNumber: '11.3.1', descriptor: 'Source and comprehend technical literature and other credible sources of information', tpsLevel: 4 },
    { piNumber: '11.3.2', descriptor: 'Analyze sourced technical and popular information for feasibility, viability, sustainability, etc.', tpsLevel: 4 },
];
// 6. Civil Engineering
export const CIVIL_PERFORMANCE_INDICATORS = [
    // PO 1
    { piNumber: '1.1.1', descriptor: 'Apply mathematical techniques such as calculus, Matrices and Ordinary Differential Equations, Fourier Series and Partial Differential Equations and Probability, statistics and Numerical Methods to solve problems (WK2)', tpsLevel: 3 },
    { piNumber: '1.1.2', descriptor: 'Apply advanced mathematical techniques to model and solve Civil engineering problems (WK2)', tpsLevel: 3 },
    { piNumber: '1.2.1', descriptor: 'Apply laws related to Physics and Chemistry and Environmental Science to solve Civil Engineering Problems (WK1)', tpsLevel: 3 },
    { piNumber: '1.3.1', descriptor: 'Apply fundamental concepts of Engineering Mechanics, Mechanics of Solids, Building Materials and Technology, Engineering Graphics to solve Civil engineering problems (WK3)', tpsLevel: 3 },
    { piNumber: '1.4.1', descriptor: 'Apply Civil engineering concepts of Structural, Geo-technical, Water Resources, Environmental, Transportation Engineering and Project Management for planning, analysis, designing and execution of domain specific Complex Civil engineering problems (WK4)', tpsLevel: 3 },
    { piNumber: '1.5.1', descriptor: 'Apply data information and modeling skills using programming for problem solving, drafting and modeling, analysis and design of structures, project planning, scheduling and monitoring aspects for solving complex Civil Engineering problems (WK2)', tpsLevel: 3 },
    // PO 2
    { piNumber: '2.1.1', descriptor: 'Articulate problem statements and identify objectives', tpsLevel: 2 },
    { piNumber: '2.1.2', descriptor: 'Identify engineering systems, variables, and parameters to solve the problems', tpsLevel: 2 },
    { piNumber: '2.1.3', descriptor: 'Identify the mathematical, engineering and other relevant knowledge that applies to a given problem (WK1 to WK4)', tpsLevel: 2 },
    { piNumber: '2.2.1', descriptor: 'Reframe complex problems into interconnected sub-problems', tpsLevel: 4 },
    { piNumber: '2.2.2', descriptor: 'Identify, assemble and evaluate information and resources through review research literature', tpsLevel: 4 },
    { piNumber: '2.2.3', descriptor: 'Identify existing processes/solution methods for solving the problem, including forming justified approximations and assumptions', tpsLevel: 4 },
    { piNumber: '2.2.4', descriptor: 'Compare and contrast alternative solution processes to select the best process (WK1 to WK4)', tpsLevel: 4 },
    { piNumber: '2.3.1', descriptor: 'Combine scientific principles and engineering concepts to formulate model/s (mathematical or simulated) of a system or process that is appropriate in terms of applicability and required accuracy', tpsLevel: 4 },
    { piNumber: '2.3.2', descriptor: 'Identify assumptions (mathematical and physical) necessary to allow modelling of a system at the level of accuracy required (WK1-WK4)', tpsLevel: 4 },
    { piNumber: '2.4.1', descriptor: 'Apply Engineering mathematics and computations to solve mathematical and simulated models', tpsLevel: 4 },
    { piNumber: '2.4.2', descriptor: 'Produce and validate results through skilful use of contemporary engineering tools and models', tpsLevel: 4 },
    { piNumber: '2.4.3', descriptor: 'Identify sources of error in the solution process, and limitations of the solution', tpsLevel: 4 },
    { piNumber: '2.4.4', descriptor: 'Extract desired understanding and conclusions consistent with objectives and limitations of the analysis with due consideration to sustainable development goals (WK1-WK4)', tpsLevel: 4 },
    // PO 3
    { piNumber: '3.1.1', descriptor: 'Recognize that need analysis is key to good problem definition', tpsLevel: 3 },
    { piNumber: '3.1.2', descriptor: 'Elicit and document, engineering requirements from stakeholders', tpsLevel: 3 },
    { piNumber: '3.1.3', descriptor: 'Synthesize engineering requirements from a review of the state-of-the-art', tpsLevel: 3 },
    { piNumber: '3.1.4', descriptor: 'Extract engineering requirements from relevant engineering Codes and Standards such as NBC, BIS, OSHA, ECBC, ASCE, ASTM, IRC, ISO etc.', tpsLevel: 3 },
    { piNumber: '3.1.5', descriptor: 'Explore and synthesize engineering requirements considering health, safety risks, environmental, cultural and societal issues', tpsLevel: 3 },
    { piNumber: '3.1.6', descriptor: 'Determine design objectives, functional requirements and arrive at specifications (WK5)', tpsLevel: 3 },
    { piNumber: '3.2.1', descriptor: 'Apply formal idea generation tools (such as BIM, AutoCAD 3D modeling and other simulation tools) to develop multiple engineering design solutions', tpsLevel: 4 },
    { piNumber: '3.2.2', descriptor: 'Build models/prototypes to develop a diverse set of design solutions', tpsLevel: 4 },
    { piNumber: '3.2.3', descriptor: 'Identify suitable criteria for the evaluation of alternate design solutions with consideration to public health and safety, whole-life cost, net zero carbon, culture, society and environment as required', tpsLevel: 4 },
    { piNumber: '3.3.1', descriptor: 'Apply formal decision-making tools to select optimal engineering design solutions with effective resource usage for further development', tpsLevel: 5 },
    { piNumber: '3.3.2', descriptor: 'Consult with domain experts and stakeholders to select candidate engineering design solution for further development', tpsLevel: 5 },
    { piNumber: '3.4.1', descriptor: 'Refine a conceptual design into a detailed design within the existing constraints (of the resources)', tpsLevel: 4 },
    { piNumber: '3.4.2', descriptor: 'Generate information through appropriate tests to improve or revise the design (WK5)', tpsLevel: 4 },
    // PO 4
    { piNumber: '4.1.1', descriptor: 'Define a problem, its scope and importance for purposes of investigation', tpsLevel: 3 },
    { piNumber: '4.1.2', descriptor: 'Examine the relevant methods, tools and techniques of experiment design, system calibration, data acquisition, analysis and presentation', tpsLevel: 3 },
    { piNumber: '4.1.3', descriptor: 'Apply domain specific Civil Engineering instrumentation and/or software tools to make measurements of Engineering quantities and parameters', tpsLevel: 3 },
    { piNumber: '4.1.4', descriptor: 'Establish a relationship between measured data and underlying physical principles by applying critical thinking and creative approaches', tpsLevel: 3 },
    { piNumber: '4.2.1', descriptor: 'Design and develop an experimental approach, specify appropriate equipment and procedures', tpsLevel: 5 },
    { piNumber: '4.2.2', descriptor: 'Understand the importance of the statistical design of experiments and choose an appropriate experimental design plan and modeling technique based on the study objectives', tpsLevel: 5 },
    { piNumber: '4.3.1', descriptor: 'Use appropriate procedures, tools and techniques to conduct experiments and collect data', tpsLevel: 4 },
    { piNumber: '4.3.2', descriptor: 'Analyze data for trends and correlations, stating possible errors and limitations', tpsLevel: 4 },
    { piNumber: '4.3.3', descriptor: 'Represent data (in tabular and/or graphical forms) so as to facilitate analysis and explanation of the data, and drawing of conclusions', tpsLevel: 4 },
    { piNumber: '4.3.4', descriptor: 'Synthesize information and knowledge about the problem from the raw data to reach appropriate conclusions (WK5)', tpsLevel: 4 },
    // PO 5
    { piNumber: '5.1.1', descriptor: 'Identify modern engineering tools and techniques such as Auto CAD, STAAD Pro, Revit, BIM for Civil Engineering activities', tpsLevel: 3 },
    { piNumber: '5.1.2', descriptor: 'Create/adapt/modify/extend tools and scripts to solve Civil engineering problems', tpsLevel: 3 },
    { piNumber: '5.2.1', descriptor: 'Identify the strengths and limitations of tools for (i) acquiring information, (ii) modelling and simulation, (iii) monitoring system performance, and (iv) creating engineering design', tpsLevel: 3 },
    { piNumber: '5.2.2', descriptor: 'Demonstrate proficiency in using Civil Engineering discipline-specific tools', tpsLevel: 3 },
    { piNumber: '5.3.1', descriptor: 'Discuss limitations and validate tools, techniques and resources', tpsLevel: 4 },
    { piNumber: '5.3.2', descriptor: 'Verify the credibility of simulation results with reference to the accuracy, assumptions, and limitations inherent in their use (WK2 and WK6)', tpsLevel: 4 },
    // PO 6
    { piNumber: '6.1.1', descriptor: 'Identify and describe various engineering roles; particularly as pertains to protection of the public and public interest at the global, regional and local level', tpsLevel: 3 },
    { piNumber: '6.2.1', descriptor: 'Interpret legislation, regulations, codes, and standards relevant to your discipline and explain its contribution to the protection of the public', tpsLevel: 3 },
    { piNumber: '6.3.1', descriptor: 'Identify risks/impacts in the life-cycle of an engineering product or activity', tpsLevel: 4 },
    { piNumber: '6.3.2', descriptor: 'Understand the relationship between the technical, socio-economic and environmental dimensions of sustainability', tpsLevel: 4 },
    { piNumber: '6.4.1', descriptor: 'Describe management techniques for sustainable development', tpsLevel: 3 },
    { piNumber: '6.4.2', descriptor: 'Apply principles of preventive engineering and sustainable development to an engineering activity or product relevant to the discipline', tpsLevel: 3 },
    // PO 7
    { piNumber: '7.1.1', descriptor: 'Identify situations of unethical professional conduct and propose ethical alternatives', tpsLevel: 3 },
    { piNumber: '7.2.1', descriptor: 'Identify tenets of the professional codes of ethics relevant to Civil Engineering', tpsLevel: 3 },
    { piNumber: '7.2.2', descriptor: 'Examine and apply moral & ethical principles to known case studies', tpsLevel: 3 },
    // PO 8
    { piNumber: '8.1.1', descriptor: 'Recognize a variety of working and learning preferences; appreciate the value of diversity on a team', tpsLevel: 3 },
    { piNumber: '8.1.2', descriptor: 'Implement the norms of practice (e.g. rules, roles, charters, agendas, etc.) of effective team work, to accomplish a goal', tpsLevel: 3 },
    { piNumber: '8.2.1', descriptor: 'Demonstrate effective communication, problem-solving, conflict resolution and leadership skills', tpsLevel: 3 },
    { piNumber: '8.2.2', descriptor: 'Treat other team members respectfully', tpsLevel: 3 },
    { piNumber: '8.2.3', descriptor: 'Listen to other members', tpsLevel: 3 },
    { piNumber: '8.2.4', descriptor: 'Maintain composure in difficult situations', tpsLevel: 3 },
    { piNumber: '8.3.1', descriptor: 'Present results as a team, with smooth integration of contributions from all individual efforts', tpsLevel: 3 },
    // PO 9
    { piNumber: '9.1.1', descriptor: 'Read, understand and interpret technical and non-technical information', tpsLevel: 3 },
    { piNumber: '9.1.2', descriptor: 'Produce clear, well-constructed, and well-supported written engineering documents', tpsLevel: 3 },
    { piNumber: '9.1.3', descriptor: 'Create flow in a document or presentation - a logical progression of ideas so that the main point is clear', tpsLevel: 3 },
    { piNumber: '9.2.1', descriptor: 'Listen to and comprehend information, instructions, and viewpoints of others', tpsLevel: 3 },
    { piNumber: '9.2.2', descriptor: 'Deliver effective oral presentations to technical and non-technical audiences', tpsLevel: 3 },
    { piNumber: '9.3.1', descriptor: 'Create engineering-standard figures, reports and drawings to complement writing and presentations', tpsLevel: 3 },
    { piNumber: '9.3.2', descriptor: 'Use a variety of media effectively to convey a message in a document or a presentation', tpsLevel: 3 },
    // PO 10
    { piNumber: '10.1.1', descriptor: 'Describe various economic and financial costs/benefits of an engineering activity', tpsLevel: 4 },
    { piNumber: '10.1.2', descriptor: 'Analyze different forms of financial statements to evaluate the financial status of an engineering project', tpsLevel: 4 },
    { piNumber: '10.2.1', descriptor: 'Analyze and select the most appropriate proposal based on economic and financial considerations', tpsLevel: 5 },
    { piNumber: '10.3.1', descriptor: 'Identify the tasks required to complete an engineering activity, and the resources required to complete the tasks', tpsLevel: 3 },
    { piNumber: '10.3.2', descriptor: 'Use project management tools to schedule an engineering project, so it is completed on time and on budget', tpsLevel: 3 },
    // PO 11
    { piNumber: '11.1.1', descriptor: 'Describe the rationale for the requirement for continuing professional development', tpsLevel: 3 },
    { piNumber: '11.1.2', descriptor: 'Identify deficiencies or gaps in knowledge and demonstrate an ability to source information to close this gap', tpsLevel: 3 },
    { piNumber: '11.2.1', descriptor: 'Identify historic points of technological advance in engineering that required practitioners to seek education in order to stay current', tpsLevel: 3 },
    { piNumber: '11.2.2', descriptor: 'Recognize the need and be able to clearly explain why it is vitally important to keep current regarding new developments in your field', tpsLevel: 3 },
    { piNumber: '11.3.1', descriptor: 'Source and comprehend technical literature and other credible sources of information', tpsLevel: 4 },
    { piNumber: '11.3.2', descriptor: 'Analyze sourced technical and popular information for feasibility, viability, sustainability, etc.', tpsLevel: 4 },
];
// 7. AMCS (Data Science / Applied Mathematics and Computational Sciences)
export const AMCS_PERFORMANCE_INDICATORS = [
    // PO 1
    { piNumber: '1.1.1', descriptor: 'Apply mathematical techniques such as Calculus, Linear Algebra, Abstract Algebra, and Discrete Structures to solve problems', tpsLevel: 3 },
    { piNumber: '1.1.2', descriptor: 'Apply advanced mathematical techniques from Optimization Techniques and Applied Statistics to model and solve data science problems', tpsLevel: 3 },
    { piNumber: '1.2.1', descriptor: 'Apply principles of Digital Electronics, Economics, and data ethics to real-world data science problems', tpsLevel: 3 },
    { piNumber: '1.3.1', descriptor: 'Apply foundational computing concepts from Data Structures, Algorithms, Operating Systems, and Computer Organization to build data science solutions', tpsLevel: 3 },
    { piNumber: '1.4.1', descriptor: 'Apply specialized data science knowledge from Data Analytics, Machine Learning, Deep Learning, Data Mining, Reinforcement Learning, and Natural Language Processing to solve complex problems', tpsLevel: 3 },
    { piNumber: '1.5.1', descriptor: 'Apply knowledge of Database Management, Big Data Systems, Web Technology, and Computer Networks to support large-scale data storage, retrieval, and processing', tpsLevel: 3 },
    { piNumber: '1.5.2', descriptor: 'Apply Numerical Methods and Optimization Techniques to develop computationally efficient models for data analysis and prediction', tpsLevel: 3 },
    // PO 2
    { piNumber: '2.1.1', descriptor: 'Formulate data science problem statements and necessary hypothesis and identify analytical objectives, data sources, and success metrics', tpsLevel: 2 },
    { piNumber: '2.1.2', descriptor: 'Identify key roles, datasets, variables, and parameters required for a given data science problem', tpsLevel: 2 },
    { piNumber: '2.1.3', descriptor: 'Identify the appropriate mathematical, algorithmic, and domain-specific knowledge applicable to a given data science problem', tpsLevel: 2 },
    { piNumber: '2.2.1', descriptor: 'Decompose complex data science problems into sub-tasks such as data collection, preprocessing, feature engineering, and model evaluation using Data Science and Software Engineering principles', tpsLevel: 4 },
    { piNumber: '2.2.2', descriptor: 'Identify, assemble, and evaluate relevant datasets, data repositories, and analytical resources', tpsLevel: 4 },
    { piNumber: '2.2.3', descriptor: 'Identify existing processes/solution methods (regression, classification, clustering) forming justified assumptions for the selected approach', tpsLevel: 4 },
    { piNumber: '2.2.4', descriptor: 'Compare and contrast alternative models from different data modeling approaches including Machine Learning, Deep Learning and Reinforcement learning to select the best solution', tpsLevel: 4 },
    { piNumber: '2.3.1', descriptor: 'Formulate predictive or classification models appropriate to the data science problem by combining statistical principles and algorithmic principles', tpsLevel: 4 },
    { piNumber: '2.3.2', descriptor: 'Identify assumptions necessary to allow modelling at the required level of accuracy', tpsLevel: 4 },
    { piNumber: '2.4.1', descriptor: 'Apply mathematical and statistical computations from Applied Statistics, Numerical Methods, and Optimization Techniques to train, evaluate, and interpret data science models', tpsLevel: 4 },
    { piNumber: '2.4.2', descriptor: 'Produce and validate analytical results using data science tools applied in appropriate data analytics experiments', tpsLevel: 4 },
    { piNumber: '2.4.3', descriptor: 'Identify sources of error such as overfitting, data imbalance, and model bias in Machine Learning and Deep Learning solutions and state their limitations', tpsLevel: 4 },
    { piNumber: '2.4.4', descriptor: 'Extract meaningful insights and conclusions consistent with problem objectives and sustainable development using data Analytics methodologies including Healthcare analytics, business analytics and web analytics', tpsLevel: 4 },
    // PO 3
    { piNumber: '3.1.1', descriptor: 'Explain the need of stakeholder analysis as the foundation of a well-defined data science problem', tpsLevel: 3 },
    { piNumber: '3.1.2', descriptor: 'Document analytical requirements from business users and domain experts using Software Engineering and Organizational Theory and Behaviour principles', tpsLevel: 3 },
    { piNumber: '3.1.3', descriptor: 'Justify data science solution requirements by reviewing current state-of-the-art in Machine Learning, Deep Learning, and Big Data Systems', tpsLevel: 3 },
    { piNumber: '3.1.4', descriptor: 'Identify relevant data privacy standards, ethical guidelines, and regulatory norms', tpsLevel: 3 },
    { piNumber: '3.1.5', descriptor: 'Formulate design requirements considering public health and safety, whole-life cost, net zero carbon, culture, society and environment related implications of data-driven solutions', tpsLevel: 3 },
    { piNumber: '3.1.6', descriptor: 'Determine model design objectives, performance specifications, and data pipeline requirements for solving the complex problem', tpsLevel: 3 },
    { piNumber: '3.2.1', descriptor: 'Apply model selection strategies from various algorithmic and machine learning solutions to generate multiple candidate solutions', tpsLevel: 4 },
    { piNumber: '3.2.2', descriptor: 'Build prototype models and data pipelines to develop diverse solution approaches considering public health and safety, whole-life cost, net zero carbon, culture, society and environment', tpsLevel: 4 },
    { piNumber: '3.2.3', descriptor: 'Identify suitable evaluation criteria (accuracy, precision, recall, F1-score, AUC-ROC, RMSE) from Applied Statistics and Predictive Analytics to compare alternative models', tpsLevel: 4 },
    { piNumber: '3.3.1', descriptor: 'Apply hyperparameter tuning, cross-validation, and model comparison methods from Machine Learning, Deep learning, Reinforcement learning and Optimization Techniques to select the optimal data science solution', tpsLevel: 5 },
    { piNumber: '3.3.2', descriptor: 'Consult with domain experts and business stakeholders to validate and finalise the selected model and data pipeline', tpsLevel: 5 },
    { piNumber: '3.4.1', descriptor: 'Refine a prototype data science solution into a fully operational system within constraints of data availability and computational resources, as practiced in projects', tpsLevel: 4 },
    { piNumber: '3.4.2', descriptor: 'Generate performance insights through model evaluation, cross-validation, and A/B testing to iteratively improve the data science solution', tpsLevel: 4 },
    // PO 4
    { piNumber: '4.1.1', descriptor: 'Define a data science research problem, its scope, and significance using the Data Analytics Life Cycle framework from Foundations of Data Science', tpsLevel: 3 },
    { piNumber: '4.1.2', descriptor: 'Examine relevant methods and techniques of data collection, exploratory data analysis, and model evaluation from Data Mining, Machine Learning, Deep Learning and Applied Statistics', tpsLevel: 3 },
    { piNumber: '4.1.3', descriptor: 'Apply appropriate data science software tools (Python/R/SPSS/Tableau/Power BI) to acquire, process, and analyse datasets', tpsLevel: 3 },
    { piNumber: '4.1.4', descriptor: 'Define relationships between data features and target variables using statistical principles from Theory of Probability, Applied Statistics, and Machine Learning', tpsLevel: 3 },
    { piNumber: '4.2.1', descriptor: 'Design a research experiment specifying data collection strategy, feature selection method, and model architecture using Machine Learning, Deep Learning, and Predictive Analytics concepts', tpsLevel: 5 },
    { piNumber: '4.2.2', descriptor: 'Apply the knowledge of statistics in the design of experiments and choose an appropriate experimental design plan aligned with data science study objectives', tpsLevel: 5 },
    { piNumber: '4.3.1', descriptor: 'Use appropriate data science procedures and tools from Data Structures, Database Management, and Big Data Systems to collect, clean, and structure large datasets', tpsLevel: 4 },
    { piNumber: '4.3.2', descriptor: 'Analyse datasets for trends, correlations, and anomalies using Data Mining, Machine Learning, and Applied Statistics methods, clearly stating data quality errors and model limitations', tpsLevel: 4 },
    { piNumber: '4.3.3', descriptor: 'Represent data and findings using visualization techniques from Data Visualization and Business Analytics (plots, dashboards, heatmaps) to facilitate interpretation and support conclusion drawing', tpsLevel: 4 },
    { piNumber: '4.3.4', descriptor: 'Compare data-driven insights from Data Mining, Reinforcement Learning, and Business Analytics results to reach valid and actionable conclusions', tpsLevel: 4 },
    // PO 5
    { piNumber: '5.1.1', descriptor: 'Identify modern data science tools such as Python/R/SPSS used in Applied Statistics, Machine Learning, Deep Learning, and Predictive Analytics; Big Data platforms (Hadoop, Spark) used in Big Data Systems; and visualization tools (Tableau, Power BI) for analytical activities', tpsLevel: 3 },
    { piNumber: '5.1.2', descriptor: 'Create, adapt, or extend data science models and pipelines to solve specific domain problems', tpsLevel: 3 },
    { piNumber: '5.2.1', descriptor: 'Identify the strengths and limitations of data science tools for (i) data acquisition and preprocessing, (ii) predictive modelling and simulation, (iii) model performance monitoring, and (iv) deploying analytical solutions', tpsLevel: 3 },
    { piNumber: '5.2.2', descriptor: 'Demonstrate proficiency in applying discipline-specific tools such as Python, R, SQL, TensorFlow, and Tableau to solve data science problems', tpsLevel: 3 },
    { piNumber: '5.3.1', descriptor: 'Discuss the limitations of data science tools and models and validate their applicability to the given problem', tpsLevel: 4 },
    { piNumber: '5.3.2', descriptor: 'Verify the credibility of data science results by evaluating model accuracy, bias, and built-in assumptions with an understanding of the limitation', tpsLevel: 4 },
    // PO 6
    { piNumber: '6.1.1', descriptor: 'Identify and describe various engineering roles; particularly as pertains to protection of the public and public interest at the global, regional and local level', tpsLevel: 3 },
    { piNumber: '6.2.1', descriptor: 'Interpret legislation, regulations, codes, and standards relevant to your discipline and explain its contribution to the protection of the public', tpsLevel: 3 },
    { piNumber: '6.3.1', descriptor: 'Identify risks/impacts in the life-cycle of an engineering product or activity', tpsLevel: 4 },
    { piNumber: '6.3.2', descriptor: 'Understand the relationship between the technical, socio-economic and environmental dimensions of sustainability', tpsLevel: 4 },
    { piNumber: '6.4.1', descriptor: 'Describe management techniques for sustainable development', tpsLevel: 3 },
    { piNumber: '6.4.2', descriptor: 'Apply principles of preventive engineering and sustainable development to an engineering activity or product relevant to the discipline', tpsLevel: 3 },
    // PO 7
    { piNumber: '7.1.1', descriptor: 'Identify situations of unethical professional conduct and propose ethical alternatives', tpsLevel: 3 },
    { piNumber: '7.2.1', descriptor: 'Identify tenets of the professional code of ethics applicable to data science', tpsLevel: 3 },
    { piNumber: '7.2.2', descriptor: 'Examine and apply moral & ethical principles to known case studies', tpsLevel: 3 },
    // PO 8
    { piNumber: '8.1.1', descriptor: 'Recognize a variety of working and learning preferences; appreciate the value of diversity on a team', tpsLevel: 3 },
    { piNumber: '8.1.2', descriptor: 'Implement the norms of practice (e.g. rules, roles, charters, agendas, etc.) of effective team work, to accomplish a goal', tpsLevel: 3 },
    { piNumber: '8.2.1', descriptor: 'Demonstrate effective communication, problem-solving, conflict resolution and leadership skills', tpsLevel: 3 },
    { piNumber: '8.2.2', descriptor: 'Treat other team members respectfully', tpsLevel: 3 },
    { piNumber: '8.2.3', descriptor: 'Listen to other members', tpsLevel: 3 },
    { piNumber: '8.2.4', descriptor: 'Maintain composure in difficult situations', tpsLevel: 3 },
    { piNumber: '8.3.1', descriptor: 'Present results as a team, with smooth integration of contributions from all individual efforts', tpsLevel: 3 },
    // PO 9
    { piNumber: '9.1.1', descriptor: 'Read, understand and interpret technical and non-technical information', tpsLevel: 3 },
    { piNumber: '9.1.2', descriptor: 'Produce clear, well-constructed, and well-supported written engineering documents', tpsLevel: 3 },
    { piNumber: '9.1.3', descriptor: 'Create flow in a document or presentation - a logical progression of ideas so that the main point is clear', tpsLevel: 3 },
    { piNumber: '9.2.1', descriptor: 'Listen to and comprehend information, instructions, and viewpoints of others', tpsLevel: 3 },
    { piNumber: '9.2.2', descriptor: 'Deliver effective oral presentations to technical and non-technical audiences', tpsLevel: 3 },
    { piNumber: '9.3.1', descriptor: 'Create engineering-standard figures, reports and drawings to complement writing and presentations', tpsLevel: 3 },
    { piNumber: '9.3.2', descriptor: 'Use a variety of media effectively to convey a message in a document or a presentation', tpsLevel: 3 },
    // PO 10
    { piNumber: '10.1.1', descriptor: 'Describe various economic and financial costs/benefits of an engineering activity', tpsLevel: 4 },
    { piNumber: '10.1.2', descriptor: 'Analyze different forms of financial statements to evaluate the financial status of an engineering project', tpsLevel: 4 },
    { piNumber: '10.2.1', descriptor: 'Analyze and select the most appropriate proposal based on economic and financial considerations', tpsLevel: 5 },
    { piNumber: '10.3.1', descriptor: 'Identify the tasks required to complete an engineering activity, and the resources required to complete the tasks', tpsLevel: 3 },
    { piNumber: '10.3.2', descriptor: 'Use project management tools to schedule an engineering project, so it is completed on time and on budget', tpsLevel: 3 },
    // PO 11
    { piNumber: '11.1.1', descriptor: 'Describe the rationale for the requirement for continuing professional development', tpsLevel: 3 },
    { piNumber: '11.1.2', descriptor: 'Identify deficiencies or gaps in knowledge and demonstrate an ability to source information to close this gap', tpsLevel: 3 },
    { piNumber: '11.2.1', descriptor: 'Identify historic points of technological advance in engineering that required practitioners to seek education in order to stay current', tpsLevel: 3 },
    { piNumber: '11.2.2', descriptor: 'Recognize the need and be able to clearly explain why it is vitally important to keep current regarding new developments in your field', tpsLevel: 3 },
    { piNumber: '11.3.1', descriptor: 'Source and comprehend technical literature and other credible sources of information', tpsLevel: 4 },
    { piNumber: '11.3.2', descriptor: 'Analyze sourced technical and popular information for feasibility, viability, sustainability, etc.', tpsLevel: 4 },
];
/**
 * Helper to retrieve department-specific Performance Indicators.
 * If department/programme is provided and has custom indicators, returns those.
 * Otherwise falls back to the default institutional list.
 */
export function getDepartmentPerformanceIndicators(department, programmeCode, defaultList = []) {
    const deptNorm = (department || '').trim().toLowerCase();
    const progNorm = (programmeCode || '').trim().toUpperCase();
    // PG programmes do not have Performance Indicators
    if (isPgProgramme(progNorm)) {
        return [];
    }
    // 1. Mechanical
    if (deptNorm.includes('mechanical') ||
        progNorm === 'ME') {
        return MECHANICAL_PERFORMANCE_INDICATORS;
    }
    // 2. Mechatronics
    if (deptNorm.includes('mechatronics') ||
        progNorm === 'MT') {
        return MECHATRONICS_PERFORMANCE_INDICATORS;
    }
    // 3. Civil (CE, PA, PB)
    if (deptNorm.includes('civil') ||
        ['CE', 'PA', 'PB'].includes(progNorm)) {
        return CIVIL_PERFORMANCE_INDICATORS;
    }
    // 4. EEE (EE only; ER will be added later per user request)
    if (progNorm === 'EE' ||
        (deptNorm.includes('electrical and electronics') && progNorm !== 'ER')) {
        return EEE_PERFORMANCE_INDICATORS;
    }
    // 5. ECE (EC, PC; EL will be added later per user request)
    if (['EC', 'PC'].includes(progNorm) ||
        (deptNorm.includes('electronics and communication') && progNorm !== 'EL')) {
        return ECE_PERFORMANCE_INDICATORS;
    }
    // 6. CSE branches (CSE, IT, CSBS, AI&ML)
    if (deptNorm.includes('computer science') ||
        deptNorm.includes('information technology') ||
        deptNorm.includes('business systems') ||
        deptNorm.includes('artificial intelligence') ||
        deptNorm.includes('data science and business') ||
        ['CS', 'PD', 'IT', 'CB', 'AM'].includes(progNorm)) {
        return CSE_BRANCHES_PERFORMANCE_INDICATORS;
    }
    // 7. AMCS / Data Science (DS, Mathematics)
    if (deptNorm.includes('data science') ||
        deptNorm.includes('applied mathematics') ||
        deptNorm === 'mathematics' ||
        progNorm === 'DS') {
        return AMCS_PERFORMANCE_INDICATORS;
    }
    // Fallback to default institutional list
    return defaultList;
}
//# sourceMappingURL=departmentPerformanceIndicators.js.map