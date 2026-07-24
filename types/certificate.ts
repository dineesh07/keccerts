/**
 * Certificate Template & Generation Types
 * Strict typing for template configuration, fields, and generation status.
 */

export type TextAlign = "left" | "center" | "right";

export type TemplateField = {
  x: number;
  y: number;
  font: string;
  size: number;
  color: string;
  align: TextAlign;
};

export type TemplateConfig = {
  name: TemplateField;
  rollNo: TemplateField;
};

export type CertificateTemplate = {
  id: string;
  eventId: string;
  templateUrl: string;
  config: TemplateConfig;
  createdAt?: string;
};

export type CertificateStatus = "pending" | "generated" | "failed";

export type ParticipantRecord = {
  name: string;
  rollNo: string;
  status?: CertificateStatus;
  certificateUrl?: string;
  error?: string;
};
