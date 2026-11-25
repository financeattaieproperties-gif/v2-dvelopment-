import { validateInventoryLayout } from "../../../packages/staff-contracts/inventory.mjs";
import type {
  ContractIssueInput,
  ContractAmendInput,
  ProjectPreparationInput,
  Customer,
  CustomerReviewRequest,
  DashboardData,
  Department,
  EngineeringDeliverable,
  Feedback,
  FinanceDeposit,
  HrContract,
  InventoryApartment,
  InventoryProject,
  Lead,
  MarketingProductionEntry,
  Role,
  Session,
  StaffUser,
  SubmissionPost,
} from "../../../packages/staff-contracts/types";
import {
  advanceMarketingProduction,
  canAssignTask,
  canViewLead,
  createLeadStageSerial,
  formatDateSuffix,
  isManagerRole,
  issueContractSnapshot,
  normalizePhone,
  processFinanceDeposit,
  resolveCustomerRegistration,
  reviewDeliverableVersion,
  submitDeliverableVersion,
  validateDealClosedSubmission,
  validateFeedback,
  validateMarketingEntryCreation,
} from "../../../packages/staff-contracts/workflow.mjs";

const iso = (hours: number) =>
  new Date(Date.now() + hours * 3600000).toISOString();
let next = 200;
const contractAmendmentHistory = new Map<number, HrContract[]>();

export const INITIAL_DEPARTMENTS: Department[] = [
  { code: "management", name: "Management" },
  { code: "hr", name: "Human Resources" },
  { code: "callcenter", name: "Call Center" },
  { code: "sales", name: "Sales Department" },
  { code: "production", name: "Marketing and Production" },
  { code: "finance", name: "Finance" },
  { code: "engineering", name: "Engineering and Graphic Department" },
];

export const INITIAL_STAFF_USERS: StaffUser[] = [
  { id: 1, name: "Fictional 7 Staff", username: "sample7@example.invalid", role: "callcenter", departmentCode: "callcenter", branchId: 1, branchName: "Central Branch", active: true },
  { id: 2, name: "Fictional 9 Staff", username: "sample9@example.invalid", role: "sales", departmentCode: "sales", teamLeaderId: 4, branchId: 1, branchName: "Central Branch", active: true },
  { id: 3, name: "Fictional 11 Staff", username: "sample11@example.invalid", role: "ceo", departmentCode: "management", branchId: null, active: true },
  { id: 4, name: "Fictional 13 Staff", username: "sample13@example.invalid", role: "sales_leader", departmentCode: "sales", branchId: 1, branchName: "Central Branch", active: true },
  { id: 5, name: "Fictional 15 Staff", username: "sample15@example.invalid", role: "manager", departmentCode: "management", branchId: 1, branchName: "Central Branch", active: true },
  { id: 6, name: "Fictional 17 Staff", username: "sample17@example.invalid", role: "marketing_manager", departmentCode: "production", branchId: 1, branchName: "Central Branch", active: true },
  { id: 7, name: "Fictional 19 Staff", username: "sample19@example.invalid", role: "editor", departmentCode: "production", branchId: 1, branchName: "Central Branch", active: true },
  { id: 8, name: "Fictional 21 Staff", username: "sample21@example.invalid", role: "videographer", departmentCode: "production", branchId: 1, branchName: "Central Branch", active: true },
  { id: 9, name: "Fictional 23 Staff", username: "sample23@example.invalid", role: "finance_manager", departmentCode: "finance", branchId: 1, branchName: "Central Branch", active: true },
  { id: 11, name: "Fictional 25 Staff", username: "sample25@example.invalid", role: "architect", departmentCode: "engineering", branchId: 1, branchName: "Central Branch", active: true },
  { id: 12, name: "Fictional 27 Staff", username: "sample27@example.invalid", role: "graphic_designer", departmentCode: "engineering", branchId: 1, branchName: "Central Branch", active: true },
  { id: 13, name: "Fictional 29 Staff", username: "sample29@example.invalid", role: "visual_designer_3d", departmentCode: "engineering", branchId: 1, branchName: "Central Branch", active: true },
  { id: 14, name: "Fictional 31 Staff", username: "sample31@example.invalid", role: "sales", departmentCode: "sales", teamLeaderId: 4, branchId: 1, branchName: "Central Branch", active: true },
];

const INITIAL_PROJECTS: InventoryProject[] = [
  {
    id: 1,
    branchId: 1,
    code: "KBL-SKY-01",
    name: "Kabul Skyline Heights",
    location: "Shahr-e Naw, Ansari Square, Kabul",
    description: "Modern 14-storey mixed commercial and luxury residential tower with panoramic views of Kabul city.",
    status: "presale",
    totalAreaSqm: 12500,
    floors: 14,
    commercialFloors: [1, 2],
    residentialFloors: [3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14],
    corridorCount: 2,
    coverPhotoUrl: "/assets/projects/kabul-skyline.jpg",
    assignedTeamLeaderId: 4,
    sellers: [
      {
        name: "Ahmadullah Attaie",
        fatherName: "Mohammad Ishaq",
        tazkiraNumber: "1401-44551",
        address: "Shahr-e Naw, Kabul",
        sharePercentage: 60,
        phone: "+93782222279",
      },
      {
        name: "Mohammad Zahir",
        fatherName: "Abdul Rahim",
        tazkiraNumber: "1399-88123",
        address: "Wazir Akbar Khan, Kabul",
        sharePercentage: 40,
        phone: "+93700112233",
      },
    ],
    constructionCompany: {
      companyName: "Kabul Construction & Engineering Co.",
      licenseNumber: "D-8921-KB",
      representativeName: "Eng. Farhad Noori",
      representativeFatherName: "Ghulam Nabi",
      representativeTazkira: "1395-55112",
      address: "Karte 4, Kabul",
      phone: "+93799445566",
    },
    apartments: [
      {
        id: 101,
        projectId: 1,
        unitNumber: "402",
        serialNumber: "KBL-SKY-01-402",
        floor: 4,
        rooms: 3,
        areaSqm: 145,
        direction: "North-East",
        boundaryNorth: "Ansari Street",
        boundarySouth: "Internal Garden",
        boundaryEast: "Apartment 403",
        boundaryWest: "Main Corridor",
        pricePerSqm: 850,
        totalPrice: 123250,
        currency: "USD",
        status: "deal_closed",
      },
      {
        id: 102,
        projectId: 1,
        unitNumber: "403",
        serialNumber: "KBL-SKY-01-403",
        floor: 4,
        rooms: 4,
        areaSqm: 180,
        direction: "South-West",
        boundaryNorth: "Apartment 402",
        boundarySouth: "Ansari Street",
        boundaryEast: "Main Corridor",
        boundaryWest: "West Elevation",
        pricePerSqm: 880,
        totalPrice: 158400,
        currency: "USD",
        status: "available",
      },
      {
        id: 103,
        projectId: 1,
        unitNumber: "501",
        serialNumber: "KBL-SKY-01-501",
        floor: 5,
        rooms: 2,
        areaSqm: 110,
        direction: "North",
        boundaryNorth: "Ansari Street",
        boundarySouth: "Corridor",
        boundaryEast: "Unit 502",
        boundaryWest: "Elevator Shaft",
        pricePerSqm: 820,
        totalPrice: 90200,
        currency: "USD",
        status: "reserved",
      },
    ],
    assignedSalesAgentIds: [2, 14],
    version: 1,
    createdAt: new Date().toISOString(),
  },
  {
    id: 2,
    branchId: 1,
    code: "KBL-PRW-02",
    name: "Karte Parwan Luxury Residences",
    location: "Karte Parwan, Square 4, Kabul",
    description: "8-storey residential community featuring high-security perimeter, underground parking, and solar backup systems.",
    status: "active",
    totalAreaSqm: 7200,
    floors: 8,
    commercialFloors: [1],
    residentialFloors: [2, 3, 4, 5, 6, 7, 8],
    corridorCount: 1,
    coverPhotoUrl: "/assets/projects/karte-parwan.jpg",
    assignedTeamLeaderId: 4,
    sellers: [
      {
        name: "Haji Abdul Rauf",
        fatherName: "Haji Mohammad Jan",
        tazkiraNumber: "1398-33112",
        address: "Karte Parwan, Kabul",
        sharePercentage: 100,
        phone: "+93777123456",
      },
    ],
    constructionCompany: {
      companyName: "Pamir Builders Kabul",
      licenseNumber: "D-5412-KB",
      representativeName: "Eng. Basir Ahmad",
      representativeFatherName: "Mohammad Sharif",
      representativeTazkira: "1400-77112",
      address: "Kolola Pushta, Kabul",
      phone: "+93788552211",
    },
    apartments: [
      {
        id: 201,
        projectId: 2,
        unitNumber: "201",
        serialNumber: "KBL-PRW-02-201",
        floor: 2,
        rooms: 3,
        areaSqm: 135,
        direction: "East",
        boundaryNorth: "Square 4 Road",
        boundarySouth: "Rear Courtyard",
        boundaryEast: "East Avenue",
        boundaryWest: "Corridor",
        pricePerSqm: 780,
        totalPrice: 105300,
        currency: "USD",
        status: "available",
      },
      {
        id: 202,
        projectId: 2,
        unitNumber: "301",
        serialNumber: "KBL-PRW-02-301",
        floor: 3,
        rooms: 4,
        areaSqm: 175,
        direction: "South",
        boundaryNorth: "Corridor",
        boundarySouth: "South Garden",
        boundaryEast: "Apt 302",
        boundaryWest: "Stairwell",
        pricePerSqm: 800,
        totalPrice: 140000,
        currency: "USD",
        status: "available",
      },
    ],
    assignedSalesAgentIds: [2],
    version: 1,
    createdAt: new Date().toISOString(),
  },
];

const INITIAL_CONTRACTS: HrContract[] = [
  {
    id: 1,
    contractSerial: "HR-CTR-2026-001",
    dealSerial: "DEAL-KBL-001",
    projectId: 1,
    projectCode: "KBL-SKY-01",
    projectName: "Kabul Skyline Heights",
    apartmentId: 101,
    apartmentNumber: "402",
    apartmentSerial: "KBL-SKY-01-402",
    floor: 4,
    rooms: 3,
    areaSqm: 145,
    direction: "North-East",
    boundaries: {
      north: "Ansari Street",
      south: "Internal Garden",
      east: "Apartment 403",
      west: "Main Corridor",
    },
    sellersSnapshot: [
      {
        name: "Ahmadullah Attaie",
        fatherName: "Mohammad Ishaq",
        tazkiraNumber: "1401-44551",
        address: "Shahr-e Naw, Kabul",
        sharePercentage: 60,
        phone: "+93782222279",
      },
      {
        name: "Mohammad Zahir",
        fatherName: "Abdul Rahim",
        tazkiraNumber: "1399-88123",
        address: "Wazir Akbar Khan, Kabul",
        sharePercentage: 40,
        phone: "+93700112233",
      },
    ],
    constructionSnapshot: {
      companyName: "Kabul Construction & Engineering Co.",
      licenseNumber: "D-8921-KB",
      representativeName: "Eng. Farhad Noori",
      representativeFatherName: "Ghulam Nabi",
      representativeTazkira: "1395-55112",
      address: "Karte 4, Kabul",
      phone: "+93799445566",
    },
    buyers: [
      {
        name: "Mohammad Qasim Wardak",
        fatherName: "Abdul Ghafoor",
        grandfatherName: "Mirza Mohammad",
        tazkiraNumber: "1402-98721",
        sharePercentage: 100,
        address: "Wazir Akbar Khan, Street 15, Kabul",
        phone: "+93799123456",
      },
    ],
    pricePerSqm: 850,
    totalPrice: 123250,
    currency: "USD",
    salesAgentName: "Fictional 9 Staff",
    gregorianDate: "2026-11-15",
    jalaliDate: "1405-08-25",
    clauses: [
      "Payment according to milestone installments approved by Attaie Properties finance department.",
      "Ownership handover occurs upon completion of 100% total contract value.",
      "Building maintenance fee of $45/month applies from date of physical key handover.",
    ],
    notes: "VIP Client - Executive contract verified by Kabul Chamber of Commerce notary.",
    installments: [
      {
        id: 1,
        number: 1,
        description: "Initial signing deposit (30%)",
        percentage: 30,
        dueDate: "2026-11-20",
        scheduledAmount: 36975,
        paidAmount: 35000,
        status: "partially_paid",
      },
      {
        id: 2,
        number: 2,
        description: "Structure completion installment (30%)",
        percentage: 30,
        dueDate: "2027-02-15",
        scheduledAmount: 36975,
        paidAmount: 0,
        status: "pending",
      },
      {
        id: 3,
        number: 3,
        description: "Finishing & plastering installment (25%)",
        percentage: 25,
        dueDate: "2027-06-30",
        scheduledAmount: 30812.5,
        paidAmount: 0,
        status: "pending",
      },
      {
        id: 4,
        number: 4,
        description: "Key handover & title transfer (15%)",
        percentage: 15,
        dueDate: "2027-09-30",
        scheduledAmount: 18487.5,
        paidAmount: 0,
        status: "pending",
      },
    ],
    status: "issued",
    verificationToken: "VERIF-KBL-CTR-001-TOKEN",
    amendmentVersion: 0,
    issuedBy: "Fictional 15 Staff",
    issuedAt: "2026-11-15T10:30:00.000Z",
    version: 1,
  },
];

const INITIAL_DEPOSITS: FinanceDeposit[] = [
  {
    id: 1,
    voucherNumber: "VCH-2026-0101",
    installmentId: 1,
    receiptNumber: "RCPT-1001",
    receiptPaidToDate: 35000,
    receiptRemainingBalance: 88250,
    paymentMethod: "Bank Transfer",
    notes: "First installment initial deposit for Apt 402 Kabul Skyline Heights",
    paymentDate: "2026-11-16",
    enteredBy: "Fictional 23 Staff",
    approvedBy: "Fictional 23 Staff",
    contractId: 1,
    contractSerial: "HR-CTR-2026-001",
    installmentNumber: 1,
    customerName: "Mohammad Qasim Wardak",
    amount: 35000,
    currency: "USD",
    status: "posted",
    createdAt: "2026-11-16T11:15:00.000Z",
    postedAt: "2026-11-16T12:00:00.000Z",
    version: 1,
  },
];

const INITIAL_MARKETING: MarketingProductionEntry[] = [
  {
    id: 1,
    customerName: "Haji Mirwais Hotak",
    address: "Wazir Akbar Khan, Street 11, Kabul",
    propertyType: "Villa",
    submittedByName: "Fictional 7 Staff",
    submittedAt: "2026-11-14T09:00:00.000Z",
    submissionId: null,
    submittedByRole: "callcenter",
    filmingDate: "2026-11-18",
    videographerId: 8,
    videographerName: "Fictional 21 Staff",
    filmingCompletedAt: "2026-11-18T17:00:00.000Z",
    editorId: 7,
    editorName: "Fictional 19 Staff",
    editingDeadlineAt: "2026-11-23",
    contentType: "YouTube 4K Cinema Tour & Reels",
    serialNumber: "MKT-2026-001",
    propertyInfoNote: "3-storey luxury villa with basement pool, 6 master suites, high security perimeter.",
    photos: [],
    platform: "YouTube",
    stage: "editing_scheduled",
    version: 1,
  },
  {
    id: 2,
    customerName: "Engineer Safiullah",
    address: "Kolola Pushta, Kabul",
    propertyType: "Apartment",
    submittedByName: "Fictional 9 Staff",
    submittedAt: "2026-11-15T11:00:00.000Z",
    submissionId: 1,
    submittedByRole: "sales",
    filmingDate: "2026-11-16",
    videographerId: 8,
    videographerName: "Fictional 21 Staff",
    filmingCompletedAt: "2026-11-16T16:00:00.000Z",
    editorId: 7,
    editorName: "Fictional 19 Staff",
    editingDeadlineAt: "2026-11-19",
    contentType: "Facebook Video & High-Res Carousel",
    serialNumber: "MKT-2026-002",
    propertyInfoNote: "Penthouse apartment 220 sqm with private rooftop garden and parking.",
    photos: [],
    platform: "Facebook",
    stage: "ready_for_post",
    version: 2,
  },
];

const INITIAL_SUBMISSIONS: SubmissionPost[] = [
  {
    id: 1,
    marketingEntryId: 2,
    serialNumber: "SUB-2026-001",
    customerName: "Engineer Safiullah",
    address: "Kolola Pushta, Kabul",
    propertyType: "Apartment",
    propertyInfoNote: "Penthouse apartment 220 sqm with private rooftop garden and parking.",
    photos: [],
    socialPlatform: "Facebook",
    publishStatus: "Submitted",
    submittedBy: "Fictional 19 Staff",
    submittedAt: "2026-11-19T10:00:00.000Z",
    version: 1,
  },
];

const INITIAL_DELIVERABLES: EngineeringDeliverable[] = [
  {
    id: 1,
    projectId: 1,
    projectCode: "KBL-SKY-01",
    projectName: "Kabul Skyline Heights",
    title: "Floor 4-8 Architectural 2D Cadastral Plans",
    category: "plan_2d",
    assigneeId: 11,
    assigneeName: "Fictional 25 Staff",
    role: "architect",
    deadlineAt: "2026-11-25T16:00:00.000Z",
    versions: [
      {
        versionNumber: 1,
        fileUrl: "/plans/kbl-sky-floor4-8.pdf",
        fileName: "kbl-sky-floor4-8.pdf",
        format: "PDF",
        notes: "Approved engineering dimensions with emergency stairwell coordinates.",
        submittedBy: "Fictional 25 Staff",
        submittedAt: "2026-11-17T12:00:00.000Z",
        status: "approved",
      },
    ],
    version: 1,
  },
  {
    id: 2,
    projectId: 1,
    projectCode: "KBL-SKY-01",
    projectName: "Kabul Skyline Heights",
    title: "3D Furnished Living Room & Terrace Render",
    category: "furnished_3d",
    assigneeId: 13,
    assigneeName: "Fictional 29 Staff",
    role: "visual_designer_3d",
    deadlineAt: "2026-11-27T18:00:00.000Z",
    versions: [
      {
        versionNumber: 1,
        fileUrl: "/renders/kbl-sky-living-render.png",
        fileName: "kbl-sky-living-render.png",
        format: "PNG",
        notes: "Photorealistic lighting with dusk backdrop over Kabul city.",
        submittedBy: "Fictional 29 Staff",
        submittedAt: "2026-11-18T14:30:00.000Z",
        status: "submitted",
      },
    ],
    version: 1,
  },
  {
    id: 3,
    projectId: 1,
    projectCode: "KBL-SKY-01",
    projectName: "Kabul Skyline Heights",
    title: "Pre-Sale Marketing Brochure & Spec Sheet",
    category: "brochure",
    assigneeId: 12,
    assigneeName: "Fictional 27 Staff",
    role: "graphic_designer",
    deadlineAt: "2026-11-28T12:00:00.000Z",
    versions: [
      {
        versionNumber: 1,
        fileUrl: "/brochures/kbl-sky-brochure.pdf",
        fileName: "kbl-sky-brochure.pdf",
        format: "PDF",
        notes: "Bilingual English/Dari presentation brochure for VIP investors.",
        submittedBy: "Fictional 27 Staff",
        submittedAt: "2026-11-19T09:00:00.000Z",
        status: "approved",
      },
    ],
    version: 1,
  },
];

const INITIAL_LEADERBOARD = [
  {
    agentId: 2,
    agentName: "Fictional 9 Staff",
    role: "sales" as Role,
    departmentCode: "sales",
    branchId: 1,
    branchName: "Central Branch",
    leadsCount: 6,
    visitsCount: 3,
    dealsCount: 2,
    leadPoints: 6,
    visitPoints: 9,
    dealPoints: 20,
    totalScore: 35,
    closedAmount: 185000,
    rank: 1,
  },
  {
    agentId: 14,
    agentName: "Fictional 31 Staff",
    role: "sales" as Role,
    departmentCode: "sales",
    branchId: 1,
    branchName: "Central Branch",
    leadsCount: 5,
    visitsCount: 4,
    dealsCount: 1,
    leadPoints: 5,
    visitPoints: 12,
    dealPoints: 10,
    totalScore: 27,
    closedAmount: 92000,
    rank: 2,
  },
  {
    agentId: 1,
    agentName: "Fictional 7 Staff",
    role: "callcenter" as Role,
    departmentCode: "callcenter",
    branchId: 1,
    branchName: "Central Branch",
    leadsCount: 11,
    visitsCount: 1,
    dealsCount: 0,
    leadPoints: 11,
    visitPoints: 3,
    dealPoints: 0,
    totalScore: 14,
    closedAmount: 0,
    rank: 3,
  },
  {
    agentId: 4,
    agentName: "Fictional 13 Staff",
    role: "sales_leader" as Role,
    departmentCode: "sales",
    branchId: 1,
    branchName: "Central Branch",
    leadsCount: 3,
    visitsCount: 2,
    dealsCount: 0,
    leadPoints: 3,
    visitPoints: 6,
    dealPoints: 0,
    totalScore: 9,
    closedAmount: 0,
    rank: 4,
  },
];

const names = ["Fictional Customer One", "Fictional Customer Two", "Fictional Customer Three", "Fictional Customer Four", "Fictional Customer Five"];

const phones = [
  "+93700000000",
  "+93700112233",
  "+93700223344",
  "+93700334455",
  "+93700445566",
];

const initialMasterCustomers: Customer[] = names.map((name, index) => ({
  id: index + 1,
  serial: `CA01-C${index + 1}-101126`,
  name,
  phone: phones[index],
  requirements: [
    "Three-bedroom apartment in Shahr-e-Naw. Family home with parking.",
    "Commercial space near a main road. Interested in a viewing.",
    "Two-bedroom apartment in Kart-e-Char. Looking for payment options.",
    "Family apartment with a balcony. Arrange a weekend visit.",
    "Four-bedroom home, ready to move in.",
  ][index],
  leadCount: 1,
  ownerAgentId: index === 4 ? 2 : 1,
  sharedAgentIds: index === 0 ? [2] : [],
}));

const initialReviewRequests: CustomerReviewRequest[] = [
  {
    id: 1,
    customerId: 2,
    phone: "+93700112233",
    requestingAgentId: 2,
    requestingAgentName: "Fictional Sales Agent",
    submittedName: "Fictional Customer Two",
    submittedRequirements: "Customer walked into Sales office asking about available properties.",
    status: "pending_review",
    createdAt: iso(-5),
    version: 1,
  },
];

let data: DashboardData = {
  leads: [],
  followups: [],
  customers: initialMasterCustomers,
  leaderboard: INITIAL_LEADERBOARD,
  customerReviewRequests: initialReviewRequests,
  tasks: [
    {
      id: 1,
      title: "Review new customer inquiries",
      instructions:
        "Check the latest inquiries and confirm that every customer has a scheduled next step.",
      priority: "high",
      assigneeId: 1,
      assignedBy: "Attaie Management",
      deadlineAt: iso(4),
      status: "todo",
      version: 1,
    },
    {
      id: 2,
      title: "Prepare weekly follow-up summary",
      instructions:
        "Summarize this week’s customer follow-ups and flag any cases needing management support.",
      priority: "normal",
      assigneeId: 1,
      assignedBy: "Attaie Management",
      deadlineAt: iso(25),
      status: "in_progress",
      version: 1,
    },
  ],
  assignees: INITIAL_STAFF_USERS,
  departments: INITIAL_DEPARTMENTS,
  projects: INITIAL_PROJECTS,
  hrContracts: INITIAL_CONTRACTS,
  financeDeposits: INITIAL_DEPOSITS,
  marketingEntries: INITIAL_MARKETING,
  submissions: INITIAL_SUBMISSIONS,
  engineeringDeliverables: INITIAL_DELIVERABLES,
  counts: {},
  page: 0,
  integration: {
    enabled: false,
    message: "Etisalat automatic capture is not connected. Manual call entries are labeled.",
  },
  serverTime: iso(0),
};

export function getSharedStaffStore() {
  return data;
}

export function previewClient(management: boolean, initialRoleOverride?: Role) {
  let activeUser: StaffUser = initialRoleOverride
    ? INITIAL_STAFF_USERS.find((u) => u.role === initialRoleOverride) || INITIAL_STAFF_USERS[management ? 2 : 0]
    : INITIAL_STAFF_USERS[management ? 2 : 0];

  const client = {
    getActiveUser() {
      return activeUser;
    },
    setActiveRole(role: Role) {
      const found = data.assignees.find((u) => u.role === role);
      if (found) {
        activeUser = found;
      } else {
        activeUser = {
          id: 99,
          name: `Attaie ${role.replace(/_/g, " ")}`,
          role,
          branchId: role === "ceo" ? null : 1,
          active: true,
        };
      }
      return activeUser;
    },
    async login(_username: string, _password: string): Promise<Session> {
      throw new Error("Preview does not accept credentials. Use the preview role selector.");
    },
    async loginWithFirebaseToken(_idToken: string): Promise<Session> {
      throw new Error("Preview does not accept credentials. Use the preview role selector.");
    },
    async loginWithGoogle(): Promise<Session> {
      throw new Error("Preview does not accept credentials. Use the preview role selector.");
    },
    async session() {
      return { user: activeUser, csrfToken: "preview-csrf", serverTime: iso(0) } as Session;
    },
    async load(_view: string, q = "", page = 0) {
      const search = q.toLowerCase();
      const result = structuredClone(data);
      result.serverTime = iso(0);
      result.page = page;

      const teamAgentIds =
        activeUser.role === "sales_leader"
          ? data.assignees
              .filter((u) => u.role === "sales" && u.teamLeaderId === activeUser.id)
              .map((u) => u.id)
          : [];

      result.leads = result.leads
        .filter((l) => {
          const visible =
            isManagerRole(activeUser.role) ||
            activeUser.role === "manager" ||
            canViewLead(activeUser, l, teamAgentIds);
          return (
            visible &&
            `${l.serial} ${l.customerName} ${l.phone} ${l.projectName || ""}`
              .toLowerCase()
              .includes(search)
          );
        })
        .slice(page * 25, (page + 1) * 25);

      result.customers = (result.customers || [])
        .filter((c) => {
          const ownedOrShared =
            isManagerRole(activeUser.role) ||
            c.ownerAgentId === activeUser.id ||
            (c.sharedAgentIds || []).includes(activeUser.id);
          return ownedOrShared && `${c.name} ${c.phone}`.toLowerCase().includes(search);
        })
        .slice(page * 25, (page + 1) * 25);

      result.followups = result.followups
        .filter(
          (f) =>
            (isManagerRole(activeUser.role) ||
              f.assigneeId === activeUser.id ||
              (activeUser.role === "sales_leader" && teamAgentIds.includes(f.assigneeId))) &&
            `${f.serial} ${f.customerName}`.toLowerCase().includes(search),
        )
        .slice(page * 25, (page + 1) * 25);

      result.tasks = result.tasks
        .filter(
          (t) =>
            (isManagerRole(activeUser.role) ||
              activeUser.role === "manager" ||
              t.assigneeId === activeUser.id ||
              (_view === "team" && t.assignedBy === activeUser.name)) &&
            t.title.toLowerCase().includes(search),
        )
        .slice(page * 25, (page + 1) * 25);

      return result;
    },
    async lead(id: number) {
      const lead = data.leads.find((l) => l.id === id);
      if (!lead) throw new Error("Lead not found.");
      return {
        ...lead,
        activities: [
          {
            id: 1,
            actorName: "Fictional Call Center Agent",
            type: "entry_submitted",
            notes: lead.requirements,
            at: lead.callAt,
          },
        ],
      };
    },
    async draft(body: unknown, _key: string) {
      const input = body as {
        phone: string;
        callAt: string;
        source?: Lead["source"];
        projectId?: number;
        apartmentId?: number;
      };
      const proj = data.projects?.find((p) => p.id === Number(input.projectId));
      const apt = proj?.apartments.find((a) => a.id === Number(input.apartmentId));
      const seq = ++next;
      const serial =
        activeUser.role === "sales"
          ? createLeadStageSerial({
              prefix: "SA",
              agentId: activeUser.id,
              sequence: seq,
              stage: "L",
              date: input.callAt || iso(0),
            })
          : `CA01-L${seq}`;
      const lead: Lead = {
        id: seq,
        serial,
        stageCode: "L",
        customerId: null,
        customerName: "",
        phone: normalizePhone(input.phone),
        requirements: "",
        status: "draft",
        originAgentId: activeUser.id,
        assigneeId: activeUser.id,
        projectId: proj?.id || null,
        projectCode: proj?.code || null,
        projectName: proj?.name || null,
        apartmentId: apt?.id || null,
        apartmentNumber: apt?.unitNumber || null,
        callAt: input.callAt || iso(0),
        source: input.source || "fixture",
        version: 1,
      };
      data.leads.unshift(lead);
      return lead;
    },
    async entry(id: number, body: unknown, _key: string) {
      const input = body as {
        customerName: string;
        requirements: string;
        nextScheduledAt: string;
        nextAssigneeId: number;
        projectId?: number;
        apartmentId?: number;
      };
      const lead = data.leads.find((l) => l.id === id)!;
      const reg = resolveCustomerRegistration(data.customers || [], {
        name: input.customerName,
        phone: lead.phone,
        requirements: input.requirements,
        agentId: activeUser.id,
        agentName: activeUser.name,
        agentPrefix: activeUser.role === "sales" ? "SA" : "CA",
        date: iso(0),
      });

      if (reg.outcome === "created" && reg.customer) {
        data.customers.unshift(reg.customer);
      } else if (reg.outcome === "duplicate_conflict" && reg.reviewRequest) {
        data.customerReviewRequests = [
          { id: ++next, version: 1, ...reg.reviewRequest, status: "pending_review" },
          ...(data.customerReviewRequests || []),
        ];
      }

      const proj = data.projects?.find((p) => p.id === Number(input.projectId || lead.projectId));
      const apt = proj?.apartments.find((a) => a.id === Number(input.apartmentId || lead.apartmentId));

      Object.assign(lead, {
        customerName: input.customerName,
        requirements: input.requirements,
        status: "active",
        customerId: reg.customer?.id || ++next,
        assigneeId: input.nextAssigneeId,
        sharedAgentIds:
          input.nextAssigneeId !== activeUser.id
            ? Array.from(new Set([...(lead.sharedAgentIds || []), input.nextAssigneeId]))
            : lead.sharedAgentIds || [],
        projectId: proj?.id || lead.projectId || null,
        projectCode: proj?.code || lead.projectCode || null,
        projectName: proj?.name || lead.projectName || null,
        apartmentId: apt?.id || lead.apartmentId || null,
        apartmentNumber: apt?.unitNumber || lead.apartmentNumber || null,
        version: lead.version + 1,
      });
      data.followups.unshift({
        id: ++next,
        leadId: id,
        serial: lead.serial,
        customerName: input.customerName,
        phone: lead.phone,
        requirements: input.requirements,
        assigneeId: input.nextAssigneeId,
        scheduledAt: input.nextScheduledAt,
        completedAt: null,
        notes: input.requirements,
        version: 1,
      });
      return { ...lead, duplicateConflict: reg.outcome === "duplicate_conflict" };
    },
    async feedback(id: number, body: Feedback, _key: string) {
      validateFeedback(body, activeUser.role);
      const task = data.followups.find((f) => f.id === id)!;
      task.completedAt = iso(0);
      task.outcome = body.outcome;
      task.version++;
      const lead = data.leads.find((l) => l.id === task.leadId)!;
      const ddmmyy = formatDateSuffix(iso(0));

      if (body.outcome === "lost") {
        lead.status = "lost";
        lead.stageCode = "DL";
        lead.serial = `SA${String(activeUser.id).padStart(2, "0")}-DL${lead.id}-${ddmmyy}`;
      } else if (body.outcome === "closed") {
        const proj =
          data.projects?.find((p) => p.id === Number(body.projectId || lead.projectId)) ||
          data.projects?.[0];
        const apt =
          proj?.apartments.find((a) => a.id === Number(body.apartmentId || lead.apartmentId)) ||
          proj?.apartments[0];
        const validated = validateDealClosedSubmission({
          actorRole: activeUser.role,
          agentId: activeUser.id,
          projectCode: proj?.code || "",
          apartmentNumber: apt?.unitNumber || "",
          areaSqm: apt?.areaSqm,
          pricePerSqm: body.pricePerSqm,
          totalAmount: body.amount,
          currency: body.currency || "USD",
          buyerPhotoUrl: body.buyerPhotoUrl || "",
          tazkiraPhotoUrl: body.tazkiraPhotoUrl || "",
          date: iso(0),
        });
        lead.status = "closed";
        lead.stageCode = "DC";
        lead.serial = validated.dealSerial;
        lead.deal = {
          dealSerial: validated.dealSerial,
          amount: String(validated.agreedAmount),
          currency: validated.currency as "AFN" | "USD",
          closedAt: iso(0),
          salesAgent: activeUser.name,
          projectId: proj?.id,
          projectCode: proj?.code,
          apartmentId: apt?.id,
          apartmentNumber: apt?.unitNumber,
          buyerPhotoUrl: validated.buyerPhotoUrl,
          tazkiraPhotoUrl: validated.tazkiraPhotoUrl,
          hrContractId: null,
        };
        if (apt) apt.status = "deal_closed";
      } else {
        const stageCode = body.outcome === "visit" ? "V" : "F";
        lead.stageCode = stageCode;
        if (activeUser.role === "sales") {
          lead.serial = createLeadStageSerial({
            prefix: "SA",
            agentId: activeUser.id,
            sequence: lead.id,
            stage: stageCode,
            date: iso(0),
          });
        }
        data.followups.unshift({
          ...task,
          id: ++next,
          serial: lead.serial,
          assigneeId: body.nextAssigneeId!,
          scheduledAt: body.nextScheduledAt!,
          completedAt: null,
          notes: body.notes || "",
          version: 1,
        });
      }
      return { success: true };
    },
    async createTask(body: unknown, _key: string) {
      const input = body as {
        title: string;
        instructions: string;
        assigneeId: number;
        priority: "low" | "normal" | "high" | "urgent";
        deadlineAt: string;
        projectId?: number;
      };
      const targetUser = data.assignees.find((u) => u.id === Number(input.assigneeId));
      if (targetUser && !canAssignTask(activeUser, targetUser)) {
        throw new Error("You do not have permission to assign tasks to this staff member.");
      }
      const proj = data.projects?.find((p) => p.id === Number(input.projectId));
      data.tasks.unshift({
        ...input,
        id: ++next,
        status: "todo",
        assigneeId: Number(input.assigneeId),
        assigneeName: targetUser?.name,
        assignedBy: activeUser.name,
        projectId: proj?.id || null,
        projectName: proj?.name || null,
        version: 1,
      });
      return { id: next };
    },
    async taskStatus(id: number, status: string, _version: number) {
      const task = data.tasks.find((t) => t.id === id)!;
      task.status = status as typeof task.status;
      task.version++;
      return { success: true };
    },
    async staff() {
      return data.assignees;
    },
    async createDepartment(body: { code: string; name: string }) {
      if (!isManagerRole(activeUser.role)) {
        throw new Error("Only CEO can create departments.");
      }
      const code = body.code.trim().toLowerCase().replace(/[^a-z0-9_]/g, "");
      const name = body.name.trim();
      if (!code || !name) throw new Error("Department code and name are required.");
      const existing = data.departments?.find((d) => d.code === code);
      if (existing) {
        existing.name = name;
      } else {
        data.departments = [...(data.departments || []), { code, name }];
      }
      return { code, name };
    },
    async createStaff(body: unknown, _key: string) {
      if (!isManagerRole(activeUser.role)) {
        throw new Error("Only CEO can create staff user accounts.");
      }
      const input = body as {
        name: string;
        username: string;
        firebaseUid: string;
        role: Role;
        departmentCode?: string;
        teamLeaderId?: number;
        branchId?: number;
      };
      if (!input.name?.trim() || !input.username?.trim() || !input.firebaseUid?.trim()) {
        throw new Error("Name, email, and Firebase UID are required.");
      }
      const newUser: StaffUser = {
        id: ++next,
        name: input.name.trim(),
        username: input.username.trim().toLowerCase(),
        role: input.role,
        departmentCode: input.departmentCode || "sales",
        teamLeaderId: input.teamLeaderId ? Number(input.teamLeaderId) : null,
        branchId: Number(input.branchId) || 1,
        active: true,
      };
      data.assignees.push(newUser);
      return { id: newUser.id, user: newUser };
    },
    async saveProject(projectInput: Partial<InventoryProject>) {
      if (!isManagerRole(activeUser.role)) throw new Error("Only CEO can save inventory.");
      const code = projectInput.code?.trim().toUpperCase();
      if (!code || !projectInput.name?.trim() || !projectInput.location?.trim() || !(Number(projectInput.totalAreaSqm) > 0)) throw new Error("Project code, name, address and positive building area are required.");
      if (data.projects?.some(p => p.code === code && p.id !== projectInput.id)) throw new Error("Project code already exists.");
      const errors = validateInventoryLayout(projectInput);
      if (errors.length) throw new Error(errors.join(" "));
      if (projectInput.status !== "draft" && (!projectInput.coverPhotoUrl || !projectInput.apartments?.length)) throw new Error("Cover photo and units are required.");
      const validated = {...projectInput, code, apartments: projectInput.apartments || []};
      if (projectInput.id) {
        const existing = data.projects?.find(p => p.id === projectInput.id);
        if (!existing || projectInput.version !== existing.version) throw new Error("Project changed. Refresh and try again.");
        validated.apartments = validated.apartments.map(a => ({...a, id: a.id || ++next, projectId: existing.id}));
        data.projects = (data.projects || []).map((p) =>
          p.id === projectInput.id
            ? ({ ...p, ...validated, version: p.version + 1 } as InventoryProject)
            : p,
        );
        return data.projects.find((p) => p.id === projectInput.id)!;
      }
      const created: InventoryProject = {
        ...(validated as InventoryProject),
        id: ++next,
        createdAt: iso(0),
        version: 1,
      };
      created.apartments = created.apartments.map(a => ({...a, id: a.id || ++next, projectId: created.id}));
      data.projects = [created, ...(data.projects || [])];
      return created;
    },
    async upload(dataUrl: string, fileName: string, _purpose: string) {
      if (!dataUrl.startsWith("data:")) throw new Error("Select a file to upload.");
      return {url: dataUrl, fileName};
    },
    async verifyContract(token: string) {
      const contract = data.hrContracts?.find(c => c.verificationToken === token);
      if (!contract) throw new Error("Agreement verification not found.");
      return {contractSerial: contract.contractSerial, status: contract.status, amendmentVersion: contract.amendmentVersion};
    },
    async saveProjectPreparation(projectId: number, body: ProjectPreparationInput) {
      if (activeUser.role !== "manager") throw new Error("Only Manager can prepare project details.");
      const project = data.projects?.find(p => p.id === projectId);
      if (!project || project.version !== body.version) throw new Error("Project changed. Refresh and try again.");
      if (body.apartments.some(b => !project.apartments.some(a => a.id === b.id))) throw new Error("Apartment not found.");
      project.sellers = structuredClone(body.sellers);
      project.constructionCompany = structuredClone(body.constructionCompany);
      for (const boundaries of body.apartments) {
        const apartment = project.apartments.find(a => a.id === boundaries.id);
        if (!apartment) throw new Error("Apartment not found.");
        Object.assign(apartment, boundaries);
      }
      project.version++;
      return project;
    },
    async resolveCustomerReview(reviewId: number, decision: "approved_shared" | "rejected", version?: number) {
      if (!isManagerRole(activeUser.role)) {
        throw new Error("Only Manager can resolve customer duplicate review requests.");
      }
      const req = data.customerReviewRequests?.find((r) => r.id === reviewId);
      if (!req) throw new Error("Review request not found.");
      if (typeof version === "number" && req.version !== version) {
        throw new Error("Review request changed. Refresh and try again.");
      }
      req.status = decision;
      req.version = (req.version || 1) + 1;
      if (decision === "approved_shared") {
        const cust = data.customers.find((c) => c.id === req.customerId);
        if (cust) {
          cust.sharedAgentIds = Array.from(
            new Set([...(cust.sharedAgentIds || []), req.requestingAgentId]),
          );
        }
      }
      return req;
    },
    async issueContract(payload: ContractIssueInput) {
      const project = data.projects?.find((p) => p.id === Number(payload.projectId));
      const apartment = project?.apartments.find((a) => a.id === Number(payload.apartmentId));
      const draft = payload.contractId ? data.hrContracts?.find(c => c.id === payload.contractId) : undefined;
      if (payload.contractId && (!draft || draft.status !== "draft" || draft.version !== payload.version)) throw new Error("Contract draft changed. Refresh and try again.");
      const snapshot = issueContractSnapshot({
        actorRole: activeUser.role,
        project,
        apartment,
        buyers: payload.buyers,
        installments: payload.installments,
        salesAgentName: payload.salesAgentName,
        clauses: payload.clauses,
        notes: payload.notes,
        existingContracts: (data.hrContracts || []).filter(c => c.status !== "draft" && c.id !== draft?.id),
        issuedBy: `${activeUser.name} (Manager)`,
        now: iso(0),
      });
      const created: HrContract = {
        ...snapshot,
        installments: snapshot.installments.map(i => ({...i, status: i.status as HrContract["installments"][number]["status"]})),
        status: payload.draft ? "draft" : "issued",
        verificationToken: Array.from(crypto.getRandomValues(new Uint8Array(32)), n => n.toString(16).padStart(2, "0")).join(""),
        id: draft?.id || ++next,
        version: (draft?.version || 0) + 1,
        issuedAt: payload.draft ? null : iso(0),
      };
      if (payload.draft) created.verificationToken = undefined;
      if (apartment && !payload.draft) apartment.status = "sold";
      data.hrContracts = [created, ...(data.hrContracts || []).filter(c => c.id !== created.id)];
      return created;
    },
    async amendContract(id: number, body: ContractAmendInput) {
      if (activeUser.role !== "manager") throw new Error("Only Manager can amend agreements.");
      const contract = data.hrContracts?.find(c => c.id === id);
      if (!contract || !["issued", "amended"].includes(contract.status) || contract.version !== body.version) throw new Error("Contract changed. Refresh and try again.");
      if (!body.reason.trim()) throw new Error("Amendment reason is required.");
      contractAmendmentHistory.set(id, [...(contractAmendmentHistory.get(id) || []), structuredClone(contract)]);
      Object.assign(contract, {clauses: [...body.clauses], notes: body.notes, status: "amended", amendmentVersion: contract.amendmentVersion + 1, version: contract.version + 1});
      return contract;
    },
    async manageDeposit(payload: {
      action: "draft" | "approve" | "return" | "reverse";
      contractId: number;
      installmentId: number;
      depositId?: number;
      version?: number;
      paymentDate?: string;
      amount?: number;
      paymentMethod?: "Cash" | "Bank Transfer" | "Cheque";
      receiptNumber?: string;
      notes?: string;
      reason?: string;
    }) {
      const contract = data.hrContracts?.find((c) => c.id === Number(payload.contractId));
      if (!contract) throw new Error("Contract not found.");
      const installment = contract.installments.find(
        (i) => i.id === Number(payload.installmentId),
      );
      if (!installment) throw new Error("Installment not found.");

      if (payload.action === "draft") {
        const res = processFinanceDeposit({
          action: "draft",
          actorRole: activeUser.role,
          deposit: {
            id: ++next,
            contractId: contract.id,
            contractSerial: contract.contractSerial,
            installmentId: installment.id,
            installmentNumber: installment.number,
            customerName: contract.buyers[0]?.name || "Buyer",
            amount: Number(payload.amount),
            currency: contract.currency,
            paymentMethod: payload.paymentMethod || "Cash",
            receiptNumber: payload.receiptNumber || `RCP-${next}`,
            notes: payload.notes || "",
            paymentDate: payload.paymentDate || iso(0).slice(0,10),
            enteredBy: activeUser.name,
            approvedBy: null,
          },
          installment,
          now: iso(0),
        });
        data.financeDeposits = [
          res.deposit as FinanceDeposit,
          ...(data.financeDeposits || []),
        ];
        return res.deposit;
      }

      const existingDep = data.financeDeposits?.find(
        (d) => d.id === Number(payload.depositId),
      );
      if (!existingDep) throw new Error("Deposit record not found.");
      if (existingDep.version !== payload.version) throw new Error("Deposit changed. Refresh and try again.");
      const res = processFinanceDeposit({
        action: payload.action,
        actorRole: activeUser.role,
        deposit: existingDep,
        installment,
        reason: payload.reason,
        now: iso(0),
      });
      Object.assign(existingDep, res.deposit, { approvedBy: activeUser.name });
      Object.assign(installment, res.installment);
      if (payload.action === "approve") {
        existingDep.receiptPaidToDate = contract.installments.reduce((sum, i) => sum + i.paidAmount, 0);
        existingDep.receiptRemainingBalance = Math.max(0, contract.totalPrice - existingDep.receiptPaidToDate);
      }
      return existingDep;
    },
    async createMarketingEntry(payload: {
      customerName: string;
      address: string;
      propertyType: "Villa" | "Block" | "Building" | "Apartment";
    }) {
      const valid = validateMarketingEntryCreation(payload, activeUser.role);
      const entry: MarketingProductionEntry = {
        id: ++next,
        customerName: valid.customerName,
        address: valid.address,
        propertyType: valid.propertyType,
        submittedByRole: activeUser.role,
        submittedByName: activeUser.name,
        submittedAt: iso(0),
        filmingDate: null,
        videographerId: null,
        videographerName: null,
        filmingCompletedAt: null,
        editingDeadlineAt: null,
        editorId: 7,
        editorName: "Fictional Editor",
        contentType: null,
        serialNumber: null,
        propertyInfoNote: null,
        photos: [],
        platform: null,
        stage: "submitted",
        submissionId: null,
        version: 1,
      };
      data.marketingEntries = [entry, ...(data.marketingEntries || [])];
      return entry;
    },
    async advanceMarketing(
      entryId: number,
      action:
        | "schedule_filming"
        | "complete_filming"
        | "schedule_editing"
        | "ready_for_post"
        | "mark_posted",
      payload: Record<string, unknown>,
    ) {
      const entry = data.marketingEntries?.find((m) => m.id === entryId);
      if (!entry) throw new Error("Marketing entry not found.");
      if (entry.version !== payload.version) throw new Error("Entry changed. Refresh and try again.");
      const res = advanceMarketingProduction(entry, action, payload, activeUser.role);
      if (action === "mark_posted" && "submission" in res) {
        const subId = ++next;
        const subRecord: SubmissionPost = {
          ...(res.submission as Omit<SubmissionPost, "id" | "submittedBy">),
          id: subId,
          submittedBy: `${activeUser.name} (Editor)`,
        };
        Object.assign(entry, res.entry, { submissionId: subId });
        data.submissions = [subRecord, ...(data.submissions || [])];
        return { entry, submission: subRecord };
      }
      if (action === "schedule_filming") {
        const vidUser = data.assignees.find((u) => u.id === Number(payload.videographerId));
        Object.assign(entry, res, { videographerName: vidUser?.name || "Fictional Videographer" });
      } else {
        Object.assign(entry, res);
      }
      return { entry };
    },
    async uploadDeliverableVersion(
      deliverableId: number,
      payload: { fileUrl: string; fileName: string; format: string; notes: string; version: number },
    ) {
      const deliv = data.engineeringDeliverables?.find((d) => d.id === deliverableId);
      if (!deliv) throw new Error("Deliverable task not found.");
      if (deliv.version !== payload.version) throw new Error("Deliverable changed. Refresh and try again.");
      const updated = submitDeliverableVersion(deliv, {
        actorRole: activeUser.role,
        actorName: activeUser.name,
        ...payload,
        submittedAt: iso(0),
      });
      Object.assign(deliv, updated);
      return deliv;
    },
    async reviewDeliverable(
      deliverableId: number,
      payload: {
        version: number;
      versionNumber: number;
        decision: "approved" | "revision_requested";
        comment: string;
      },
    ) {
      const deliv = data.engineeringDeliverables?.find((d) => d.id === deliverableId);
      if (!deliv) throw new Error("Deliverable task not found.");
      if (deliv.version !== payload.version) throw new Error("Deliverable changed. Refresh and try again.");
      const updated = reviewDeliverableVersion(deliv, {
        actorRole: activeUser.role,
        reviewerName: activeUser.name,
        ...payload,
        reviewedAt: iso(0),
      });
      Object.assign(deliv, updated);
      return deliv;
    },
    async updateProfilePhoto(photoUrl: string) {
      activeUser.photoUrl = photoUrl || null;
      return { user: { ...activeUser } };
    },
    async resetPassword(_email: string) {
      throw new Error("Passwords are not stored in sample preview.");
    },
    async logout() {
      location.href = location.pathname;
    },
  };
  return client;
}
