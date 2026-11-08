export enum KycStatus {
  Verified = "verified",
  Pending = "pending",
  Rejected = "rejected",
}

export interface BankingCustomer {
  id: string;
  document_number: number;
  name: string;
  lastname: string;
  email: string;
  birthdate: Date;
  country: string;
  kyc_status: KycStatus;
  created_at: Date;
}

export enum AccountType {
  Checking = "checking",
  Savings = "savings",
  Credit = "credit",
}

export enum Currency {
  Eur = "EUR",
  Usd = "USD",
}

export enum AccountStatus {
  Active = "active",
  Frozen = "frozen",
  Closed = "closed",
}

export interface BankingAccount {
  id: string;
  customer_id: string;
  iban: string;
  type: AccountType;
  currency: Currency;
  overdraft_limit: number;
  opened_at: Date;
  status: AccountStatus;
}

export enum TransactionKind {
  Deposit = "deposit",
  Withdrawal = "withdrawal",
  Fee = "fee",
  Interest = "interest",
}

export enum MovementDirection {
  Credit = "credit",
  Debit = "debit",
}

export interface BankingTransaction {
  id: string;
  account_id: string;
  kind: TransactionKind;
  direction: MovementDirection;
  amount: number;
  posted_at: Date;
  description: string;
}

export interface BankingTransfer {
  id: string;
  source_account_id: string;
  destination_account_id: string;
  amount: number;
  created_at: Date;
  concept: string;
}

export interface BankingTransferLeg {
  id: string;
  transfer_id: string;
  kind: MovementDirection;
  account_id: string;
  amount: number;
}

export enum CardBrand {
  Visa = "visa",
  Mastercard = "mastercard",
  Amex = "amex",
}

export enum CardStatus {
  Active = "active",
  Blocked = "blocked",
  Expired = "expired",
}

export interface BankingCard {
  id: string;
  account_id: string;
  pan_last4: string;
  brand: CardBrand;
  expires_at: Date;
  status: CardStatus;
  daily_limit: number;
}

export enum LoanStatus {
  Active = "active",
  PaidOff = "paid-off",
  Defaulted = "defaulted",
}

export interface BankingLoan {
  id: string;
  customer_id: string;
  principal: number;
  annual_rate: number;
  term_months: number;
  granted_at: Date;
  status: LoanStatus;
}

export enum InstallmentStatus {
  Pending = "pending",
  Paid = "paid",
  Late = "late",
}

export interface BankingLoanInstallment {
  id: string;
  loan_id: string;
  number: number;
  due_date: Date;
  amount: number;
  status: InstallmentStatus;
}

export interface BankingAccountStatement {
  id: string;
  closed_at: Date;
  credits: number;
  debits: number;
  balance: number;
}

export interface BankingDataset {
  Customer: BankingCustomer[];
  Account: BankingAccount[];
  Transaction: BankingTransaction[];
  Transfer: BankingTransfer[];
  TransferLeg: BankingTransferLeg[];
  Card: BankingCard[];
  Loan: BankingLoan[];
  LoanInstallment: BankingLoanInstallment[];
  AccountStatement: BankingAccountStatement[];
}
