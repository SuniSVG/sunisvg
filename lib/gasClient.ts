// lib/gasClient.ts
export const GAS_BASE_URL = process.env.GAS_URL!;

export const GAS_ACTIONS = {

  // ════════════════════════════════════════
  // ❌ KHÔNG CACHE — mutation / write
  // ════════════════════════════════════════
  batchAddStudents:        { ttl: 0, type: "mutation" },
  createClass:             { ttl: 0, type: "mutation" },
  savePracticeSession:     { ttl: 0, type: "mutation" },
  uploadAvatar:            { ttl: 0, type: "mutation" },
  deleteAvatar:            { ttl: 0, type: "mutation" },
  joinClass:               { ttl: 0, type: "mutation" },
  saveUserQuiz:            { ttl: 0, type: "mutation" },
  submitTestResult:        { ttl: 0, type: "mutation" },
  activateVoucher:         { ttl: 0, type: "mutation" },
  assignTestToClass:       { ttl: 0, type: "mutation" },
  assignDocumentToClass:   { ttl: 0, type: "mutation" },
  exportQuizToDoc:         { ttl: 0, type: "mutation" },
  exportQuizResultsToSheet:{ ttl: 0, type: "mutation" },
  registerUser:            { ttl: 0, type: "mutation" },
  resendVerificationEmail: { ttl: 0, type: "mutation" },
  requestPasswordReset:    { ttl: 0, type: "mutation" },
  resetPasswordWithOTP:    { ttl: 0, type: "mutation" },
  updateUsername:          { ttl: 0, type: "mutation" },
  updatePassword:          { ttl: 0, type: "mutation" },
  updateQuizStats:         { ttl: 0, type: "mutation" },
  updateStudyTime:         { ttl: 0, type: "mutation" },
  updateUserLevel:         { ttl: 0, type: "mutation" },
  updateUserTitle:         { ttl: 0, type: "mutation" },
  addArticle:              { ttl: 0, type: "mutation" },
  updateArticleStatus:     { ttl: 0, type: "mutation" },
  updateArticleFeedback:   { ttl: 0, type: "mutation" },
  addForumPost:            { ttl: 0, type: "mutation" },
  addForumComment:         { ttl: 0, type: "mutation" },
  updatePostUpvote:        { ttl: 0, type: "mutation" },
  purchasePremiumCategory: { ttl: 0, type: "mutation" },
  updateOwnedCourses:      { ttl: 0, type: "mutation" },
  updateCriterion:         { ttl: 0, type: "mutation" },
  redeemVoucher:           { ttl: 0, type: "mutation" },

  // ════════════════════════════════════════
  // ✅ CACHE NGẮN — dữ liệu per-user, thay đổi thường
  // Cache theo userId để không trộn data giữa users
  // ════════════════════════════════════════
  getAccountByEmail:       { ttl: 30,  type: "user" },   // sau login/update profile
  getClassesForUser:       { ttl: 60,  type: "user" },   // sau joinClass
  getClassDetails:         { ttl: 60,  type: "user" },   // sau assignTest
  getUserQuiz:             { ttl: 60,  type: "user" },   // sau saveUserQuiz
  getScheduleForUser:      { ttl: 120, type: "user" },   // thay đổi ít hơn
  getPurchasedCategories:  { ttl: 120, type: "user" },   // sau purchase

  // ════════════════════════════════════════
  // ✅ CACHE TRUNG — dữ liệu shared, thay đổi vừa
  // ════════════════════════════════════════
  getQuestionsForSubject:  { ttl: 300,  type: "shared" }, // câu hỏi ít thay đổi
  getAllPublicQuizzes:      { ttl: 180,  type: "shared" }, // sau saveUserQuiz public
  getQuizzesByAuthor:      { ttl: 120,  type: "shared" }, // sau saveUserQuiz
  getSheetData:            { ttl: 300,  type: "shared" }, // tùy sheet

  // ════════════════════════════════════════
  // ✅ CACHE DÀI — dữ liệu tĩnh, hiếm thay đổi
  // ════════════════════════════════════════
  // (hiện chưa có action nào loại này, thêm sau nếu có config/danh mục)

} as const;

export type GASAction = keyof typeof GAS_ACTIONS;

// Sau khi mutation nào thì invalidate cache gì
export const INVALIDATE_MAP: Partial<Record<GASAction, GASAction[]>> = {
  joinClass:       ["getClassesForUser"],
  createClass:     ["getClassesForUser"],
  assignTestToClass: ["getClassDetails", "getScheduleForUser"],
  assignDocumentToClass: ["getClassDetails", "getScheduleForUser"],
  saveUserQuiz:    ["getUserQuiz", "getAllPublicQuizzes", "getQuizzesByAuthor"],
  submitTestResult:["getClassDetails"],
  uploadAvatar:    ["getAccountByEmail"],
  deleteAvatar:    ["getAccountByEmail"],
  updateUsername:  ["getAccountByEmail"],
  updatePassword:  ["getAccountByEmail"],
  updateUserLevel: ["getAccountByEmail"],
  updateUserTitle: ["getAccountByEmail"],
  purchasePremiumCategory: ["getPurchasedCategories"],
  updateOwnedCourses:      ["getPurchasedCategories"],
  redeemVoucher:   ["getPurchasedCategories", "getAccountByEmail"],
  activateVoucher: ["getAccountByEmail"],
};