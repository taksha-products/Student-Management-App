export interface AuthUser {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  role: string;
  organizationId: string | null;
  parentStudentIds?: string[];
}

export interface ParentSchoolOption {
  orgCode: string;
  orgName: string;
  organizationId: string;
  parentUserId: string;
  children: Array<{ id: string; name: string; grade: string }>;
}

export type ParentLiveState = "live" | "stopped" | "not_running" | "no_tracker";

export interface ChildTransport {
  busNumber?: string;
  routeName?: string;
  monthlyTransportFee?: number;
  pickupStop?: string;
  dropStop?: string;
  /** Org has GPS + parent portal; child can open live map when true. */
  trackingEnabled?: boolean;
  /** Coarse chip for the bus list (no coordinates). */
  liveState?: ParentLiveState | null;
}

export interface ParentChild {
  _id: string;
  name: string;
  grade: string;
  status?: string;
  academicYear?: string;
  transport?: ChildTransport | null;
}

export interface OrgThemePayload {
  logoUrl: string | null;
  brandColor: string | null;
  displayName: string | null;
  orgName: string;
}

export interface LedgerPeriod {
  periodLabel: string;
  displayLabel: string;
  amountDue: number;
  amountPaid: number;
  lateFee: number;
  balance: number;
  status: string;
  dueDate?: string;
}

export interface FeeHeadLedgerGroup {
  feeHeadName: string;
  periods: LedgerPeriod[];
  totalDue: number;
  totalPaid: number;
  balance: number;
}

export interface StudentFeeLedgerView {
  student: {
    _id: string;
    name: string;
    grade: string;
    parentName: string;
    parentPhone: string;
    bus?: ChildTransport | null;
  };
  feeHeads: FeeHeadLedgerGroup[];
  summary: {
    totalDue: number;
    totalPaid: number;
    totalLateFee: number;
    outstandingBalance: number;
    overdueAmount: number;
  };
  upcomingDues: Array<{
    feeHeadName: string;
    periodLabel: string;
    amountDue: number;
    dueDate?: string;
    balance: number;
  }>;
}

export interface FeePaymentRow {
  _id: string;
  receiptNumber: string;
  paymentDate: string;
  paymentMode?: string;
  totalAmountPaid: number;
  totalAmountDue?: number;
  notes?: string;
  studentId?: string;
}

export interface DueItem {
  feeHeadName: string;
  periodLabel: string;
  displayLabel: string;
  amountDue: number;
  balance: number;
  dueDate?: string;
  status: string;
}
