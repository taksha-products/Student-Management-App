import { apiRequest } from "./api";

export interface SchoolPaymentIntent {
  feePaymentId: string;
  amount: number;
  description: string;
  receiptNumber: string;
}

export interface CreateOrderResponse {
  orderId: string;
  amount: number;
  currency: string;
  keyId: string;
}

export interface VerifyPaymentResponse {
  success: boolean;
  receiptNumber: string;
}

export const createSchoolPaymentIntent = async (
  studentId: string,
  academicYear: string,
  payments: Array<{
    feeHeadName: string;
    periodLabel: string;
    amountPaid: number;
    lateFee?: number;
  }>
): Promise<SchoolPaymentIntent> => {
  const result = await apiRequest<{ data: SchoolPaymentIntent }>(
    `/api/parent/children/${studentId}/payment-intent`,
    {
      method: "POST",
      body: { academicYear, payments }
    }
  );
  return result.data;
};

export const createPaymentOrder = async (
  feePaymentId: string,
  amount: number
): Promise<CreateOrderResponse> => {
  return apiRequest<CreateOrderResponse>("/api/payments/create-order", {
    method: "POST",
    body: {
      feeType: "school",
      feePaymentId,
      amount
    }
  });
};

export const verifyPayment = async (params: {
  razorpayOrderId: string;
  razorpayPaymentId: string;
  razorpaySignature: string;
  feePaymentId: string;
}): Promise<VerifyPaymentResponse> => {
  return apiRequest<VerifyPaymentResponse>("/api/payments/verify", {
    method: "POST",
    body: {
      ...params,
      feeType: "school"
    }
  });
};
