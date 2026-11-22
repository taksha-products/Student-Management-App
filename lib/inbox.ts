import { apiRequest } from "./api";

export type NotificationType =
  | "general"
  | "announcement"
  | "fee"
  | "bus"
  | "marks"
  | "other";

export interface ParentNotification {
  id: string;
  title: string;
  body: string;
  type: NotificationType | string;
  publishedAt: string;
  read: boolean;
}

export interface SupportInfo {
  orgName: string;
  orgCode: string;
  address: string | null;
  phone: string | null;
  email: string | null;
  helpText: string;
}

export interface ParentProfile {
  id: string;
  name: string;
  phone: string | null;
  email: string;
  organizationId?: string | null;
}

export const fetchNotifications = async () => {
  const result = await apiRequest<{
    data: { items: ParentNotification[]; unreadCount: number };
  }>("/api/parent/notifications");
  return result.data;
};

export const markNotificationRead = async (id: string) => {
  await apiRequest(`/api/parent/notifications/${id}/read`, { method: "POST" });
};

export const markAllNotificationsRead = async () => {
  await apiRequest("/api/parent/notifications/read-all", { method: "POST" });
};

export const fetchSupportInfo = async () => {
  const result = await apiRequest<{ data: SupportInfo }>("/api/parent/support");
  return result.data;
};

export const fetchProfile = async () => {
  const result = await apiRequest<{ data: ParentProfile }>("/api/parent/profile");
  return result.data;
};

export const updateProfile = async (name: string) => {
  const result = await apiRequest<{ data: ParentProfile }>("/api/parent/profile", {
    method: "PATCH",
    body: { name }
  });
  return result.data;
};
