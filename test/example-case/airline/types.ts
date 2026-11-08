export interface AirlineAirline {
  id: string;
  name: string;
  code: string;
  founded_at: Date;
}

export interface AirlineAirport {
  id: string;
  code: string;
  name: string;
  city: string;
  country: string;
}

export interface AirlineGate {
  id: string;
  airport_id: string;
  code: string;
}

export enum AircraftModel {
  Atr42 = "ATR-42",
  Atr72 = "ATR-72",
  Crj900 = "CRJ-900",
  E175 = "E-175",
  Dash8 = "Dash-8",
}

export enum AircraftStatus {
  Active = "active",
  Maintenance = "maintenance",
  Retired = "retired",
}

export interface AirlineAircraft {
  id: string;
  airline_id: string;
  model: AircraftModel;
  capacity_economy: number;
  capacity_business: number;
  status: AircraftStatus;
  manufactured_at: Date;
}

export interface AirlineRoute {
  id: string;
  origin_airport_id: string;
  destination_airport_id: string;
  distance_km: number;
  duration_min: number;
}

export enum FlightStatus {
  Scheduled = "scheduled",
  Boarding = "boarding",
  Cancelled = "cancelled",
  Departed = "departed",
  Landed = "landed",
}

export interface AirlineFlight {
  id: string;
  flight_number: number;
  route_id: string;
  departure: Date;
  arrival: Date;
  aircraft_id: string;
  gate_id: string | null;
  status: FlightStatus;
}

export enum CrewRole {
  Attendant = "attendant",
  Pilot = "pilot",
  Copilot = "copilot",
}

export interface AirlineCrewMember {
  id: string;
  airline_id: string;
  name: string;
  role: CrewRole;
  license_number: string | null;
  hired_at: Date;
}

export interface AirlineFlightCrew {
  id: string;
  flight_id: string;
  crew_member_id: string;
}

export interface AirlinePassenger {
  id: string;
  name: string;
  lastname: string;
  email: string;
  passport: string;
  birthdate: Date;
  country: string;
  frequent_flyer_number: string | null;
}

export enum MembershipTier {
  Bronze = "bronze",
  Silver = "silver",
  Gold = "gold",
  Platinum = "platinum",
}

export interface AirlineMembership {
  id: string;
  tier: MembershipTier;
  points: number;
  since: Date;
}

export enum SeatClass {
  Economy = "economy",
  Business = "business",
}

export enum BookingStatus {
  Confirmed = "confirmed",
  CheckedIn = "checked-in",
  Cancelled = "cancelled",
}

export interface AirlineBooking {
  id: string;
  seat_class: SeatClass;
  flight_id: string;
  passenger_id: string;
  price: number;
  booking_date: Date;
  status: BookingStatus;
}

export interface AirlineCheckIn {
  id: string;
  booking_id: string;
  seat: string;
  checkin_date: Date;
}

export interface AirlineBaggage {
  id: string;
  tag: number;
  checkin_id: string;
  weight_kg: number;
}

export enum PaymentMethod {
  CreditCard = "credit-card",
  Transfer = "transfer",
  Paypal = "paypal",
}

export enum PaymentStatus {
  Completed = "completed",
  Pending = "pending",
  Refunded = "refunded",
}

export interface AirlinePayment {
  id: string;
  booking_id: string;
  amount: number;
  method: PaymentMethod;
  status: PaymentStatus;
  created_at: Date;
}

export interface AirlineDataset {
  Airline: AirlineAirline[];
  Airport: AirlineAirport[];
  Gate: AirlineGate[];
  Aircraft: AirlineAircraft[];
  Route: AirlineRoute[];
  Flight: AirlineFlight[];
  CrewMember: AirlineCrewMember[];
  FlightCrew: AirlineFlightCrew[];
  Passenger: AirlinePassenger[];
  Membership: AirlineMembership[];
  Booking: AirlineBooking[];
  CheckIn: AirlineCheckIn[];
  Baggage: AirlineBaggage[];
  Payment: AirlinePayment[];
}
