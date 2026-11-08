export enum UserRole {
  Client = "client",
  Employee = "employee",
  Admin = "admin",
}

export interface EcommerceUser {
  id: string;
  name: string;
  last_name: string;
  email: string;
  phone: string | null;
  role: UserRole;
  created_at: Date;
}

export enum ClientLevel {
  Normal = "normal",
  Premium = "premium",
  Vip = "vip",
}

export interface EcommerceClient {
  id: string;
  enterprise: string | null;
  country: string;
  zip_code: string;
  level: ClientLevel;
}

export enum EmployeeDepartment {
  Sells = "sells",
  Support = "support",
  Logistic = "logistic",
  Finance = "finance",
}

export interface EcommerceEmployee {
  id: string;
  department: EmployeeDepartment;
  charge: string;
  salary: number;
  init_date: Date;
}

export interface EcommerceProductCategory {
  id: string;
  name: string;
  description: string;
}

export interface EcommerceProduct {
  id: string;
  name: string;
  stock: number;
  cost: number;
  price: number;
  active: boolean;
  created_at: Date;
  category_id: string;
}

export enum OrderStatus {
  Pending = "pending",
  OnProcess = "on-process",
  Send = "send",
  Delivered = "delivered",
  Canceled = "canceled",
}

export interface EcommerceOrder {
  id: string;
  client_id: string;
  employee_id: string | null;
  order_date: Date;
  status: OrderStatus;
}

export interface EcommerceOrderDetail {
  id: string;
  order_id: string;
  product_id: string;
  count: number;
  unit_price: number;
  subtotal: number;
}

export enum PaymentMethod {
  CreditCard = "credit-card",
  Transfer = "transfer",
  Paypal = "paypal",
  Crypto = "crypto",
}

export enum PaymentStatus {
  Pending = "pending",
  Completed = "completed",
  Fail = "fail",
}

export interface EcommercePayment {
  id: string;
  order_id: string;
  pay_date: Date;
  amount: number;
  payment_method: PaymentMethod;
  status: PaymentStatus;
}

export interface EcommerceTransporter {
  id: string;
  name: string;
  phone: string;
  email: string;
}

export enum ShipmentStatus {
  Pending = "pending",
  InTransit = "in-transit",
  Delivered = "delivered",
  Returned = "returned",
}

export interface EcommerceShipment {
  id: string;
  order_id: string;
  transporter_id: string;
  deliver_price: number;
  status: ShipmentStatus;
  send_date: Date | null;
  deliver_date: Date | null;
}

export enum SupportTicketStatus {
  Pending = "pending",
  OnProcess = "on-process",
  Closed = "closed",
}

export interface EcommerceSupportTicket {
  id: string;
  client_id: string;
  employee_id: string;
  order_id: string;
  description: string;
  title: string;
  status: SupportTicketStatus;
  created_at: Date;
  close_date: Date | null;
}

export interface EcommerceDataset {
  User: EcommerceUser[];
  Client: EcommerceClient[];
  Employee: EcommerceEmployee[];
  ProductCategory: EcommerceProductCategory[];
  Product: EcommerceProduct[];
  Order: EcommerceOrder[];
  OrderDetail: EcommerceOrderDetail[];
  Payment: EcommercePayment[];
  Transporter: EcommerceTransporter[];
  Shipment: EcommerceShipment[];
  SupportTicket: EcommerceSupportTicket[];
}
