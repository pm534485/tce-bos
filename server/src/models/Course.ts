import mongoose, { Schema, Document } from 'mongoose';
import { Course as ICourseType } from '@syllabusforge/shared';

export interface ICourseDocument extends Omit<ICourseType, '_id' | 'id'>, Document {}

const PrerequisiteSchema = new Schema({
  courseCode: { type: String, required: false },
  courseName: { type: String, required: false },
}, { _id: false });

const CourseOutcomeSchema = new Schema({
  coNo: { type: String, required: false },
  statement: { type: String, required: false },
  tpsLevel: { type: Number, required: false },
  pi: { type: String, required: false },
  weightage: { type: Number },
  objectiveNo: { type: Number },
  objectiveName: { type: String },
  domain: { type: String, enum: ['Cognitive', 'Psychomotor', 'Affective'] },
  generalCoRef: { type: String },
  sdgNo: { type: Schema.Types.Mixed, default: 'NC' },
  sdgLevel: { type: Number, default: 0 },
  questionLevelSplit: {
    ownLevelPercent: { type: Number },
    lowerLevelPercent: { type: Number },
  },
}, { _id: false });

const AssessmentMatrixCellSchema = new Schema({
  coNo: { type: String, required: false },
  cat1: { type: Number, default: 0 },
  assignment1: { type: Number, default: 0 },
  cat2: { type: Number, default: 0 },
  assignment2: { type: Number, default: 0 },
  terminalExam: { type: Number, default: 0 },
  theoryCat1: { type: Number, default: 0 },
  theoryCat2: { type: Number, default: 0 },
  practicalCa: { type: Number, default: 0 },
  practicalModel: { type: Number, default: 0 },
  tcpTerminal: { type: Number, default: 0 },
}, { _id: false });

const SyllabusModuleSchema = new Schema({
  moduleNo: { type: Number, required: false },
  mainTopic: { type: String, required: false },
  subtopics: [{ type: String }],
  periods: { type: Number, default: 0 },
  coMapping: [{ type: String }],
}, { _id: false });

const LearningResourceSchema = new Schema({
  type: { type: String, enum: ['TEXT', 'REFERENCE', 'WEB'], required: false },
  authors: { type: String, required: false },
  title: { type: String, required: false },
  publisher: { type: String },
  edition: { type: String },
  year: { type: Schema.Types.Mixed, required: false },
  chapters: { type: String },
  url: { type: String },
  caseStudy: { type: String },
}, { _id: false });

const SdgActivitySchema = new Schema({
  sdgNo: { type: Number, required: false },
  activity: { type: String, required: false },
  linkedModuleNo: { type: Number },
  deliverable: { type: String, required: false },
}, { _id: false });

const LabExperimentSchema = new Schema({
  slNo: { type: Number, required: false },
  name: { type: String, required: false },
  level: { type: Number, enum: [1, 2, 3], required: false },
  objectiveNos: [{ type: Number }],
  coNos: [{ type: String }],
}, { _id: false });

const LabCoursePlanItemSchema = new Schema({
  experimentNo: { type: Number, required: false },
  name: { type: String, required: false },
  preLabActivity: { type: String },
  inLabActivity: { type: String },
  postLabActivity: { type: String },
  level: { type: Number, enum: [1, 2, 3], required: false },
  preMarks: { type: Number, default: 20 },
  inMarks: { type: Number, default: 35 },
  postMarks: { type: Number, default: 20 },
}, { _id: false });

const CourseDesignerSchema = new Schema({
  name: { type: String, required: false },
  designation: { type: String, required: false },
  department: { type: String, required: false },
  email: { type: String, required: false },
}, { _id: false });

const ReviewCommentSchema = new Schema({
  userId: { type: String, required: false },
  userName: { type: String, required: false },
  userRole: { type: String, required: false },
  section: { type: String, required: false },
  comment: { type: String, required: false },
  createdAt: { type: Date, default: Date.now },
  resolved: { type: Boolean, default: false },
});

const PoPsoMappingSchema = new Schema({
  coNo: { type: String, required: false },
  po1: { type: String, default: '' },
  po2: { type: String, default: '' },
  po3: { type: String, default: '' },
  po4: { type: String, default: '' },
  po5: { type: String, default: '' },
  po6: { type: String, default: '' },
  po7: { type: String, default: '' },
  po8: { type: String, default: '' },
  po9: { type: String, default: '' },
  po10: { type: String, default: '' },
  po11: { type: String, default: '' },
  po12: { type: String, default: '' },
  pso1: { type: String, default: '' },
  pso2: { type: String, default: '' },
  pso3: { type: String, default: '' },
}, { _id: false });

const CognitiveAssessmentRowSchema = new Schema({
  level: { type: String, required: false },
  cat1: { type: Number, default: 0 },
  cat2: { type: Number, default: 0 },
  cat3: { type: Number, default: 0 },
  terminalExam: { type: Number, default: 0 },
}, { _id: false });

const CourseOutcomeQuestionsSchema = new Schema({
  coNo: { type: String, required: false },
  questions: [{ type: String }],
}, { _id: false });

const LectureScheduleItemSchema = new Schema({
  moduleNo: { type: String, required: false },
  topic: { type: String, required: false },
  periods: { type: Schema.Types.Mixed, required: false },
  coMapping: { type: Schema.Types.Mixed, required: false },
}, { _id: false });

const CourseHistorySchema = new Schema({
  version: { type: Number, required: false },
  updatedBy: { type: String, required: false },
  updatedAt: { type: Date, default: Date.now },
  changesSummary: { type: String, required: false },
}, { _id: false });

const CourseSchema = new Schema<ICourseDocument>(
  {
    courseType: { type: String, enum: ['THEORY', 'PRACTICAL', 'TCP', 'AUDIT'], required: false },
    regulationYear: { type: Number, default: 2026 },
    regulationCode: { type: String, default: '26' },
    programmeCode: { type: String, required: false, uppercase: true },
    categoryLetter: { type: String, required: false, uppercase: true },
    uniqueLetter: { type: String, required: false, uppercase: true },
    version: { type: Number, default: 0 },
    courseCode: { type: String, required: false },
    courseName: { type: String, required: false },
    categoryAbbr: { type: String, required: false },
    semester: { type: Number, required: false },
    L: { type: Number, required: false, default: 0 },
    T: { type: Number, required: false, default: 0 },
    P: { type: Number, required: false, default: 0 },
    credits: { type: Number, required: false },
    teExamType: { type: String, enum: ['TCP-T', 'TCP-P'] },
    preamble: { type: String, required: false },
    isAdvanced: { type: Boolean, default: false },
    prerequisites: { type: Schema.Types.Mixed, default: 'Nil' },
    courseOutcomes: [CourseOutcomeSchema],
    assessmentMatrix: [AssessmentMatrixCellSchema],
    modules: [SyllabusModuleSchema],
    textBooks: [LearningResourceSchema],
    referenceBooks: [LearningResourceSchema],
    webResources: [LearningResourceSchema],
    sdgActivities: [SdgActivitySchema],
    experiments: [LabExperimentSchema],
    coursePlan: [LabCoursePlanItemSchema],
    poPsoMapping: [PoPsoMappingSchema],
    cognitiveAssessmentPattern: [CognitiveAssessmentRowSchema],
    courseAssessmentQuestions: [CourseOutcomeQuestionsSchema],
    lectureScheduleItems: [LectureScheduleItemSchema],
    designers: [CourseDesignerSchema],
    status: {
      type: String,
      enum: ['DRAFT', 'SUBMITTED', 'RETURNED', 'APPROVED', 'FINALIZED'],
      default: 'DRAFT',
    },
    createdBy: { type: String, required: false },
    department: { type: String, required: false },
    comments: [ReviewCommentSchema],
    revisionOf: { type: Schema.Types.ObjectId, ref: 'Course' },
    history: [CourseHistorySchema],
  },
  { timestamps: true }
);

// Compound index for courseCode uniqueness within programme/regulation
CourseSchema.index({ regulationCode: 1, programmeCode: 1, courseCode: 1, version: 1 }, { unique: true });

export const Course = mongoose.model<ICourseDocument>('Course', CourseSchema);

