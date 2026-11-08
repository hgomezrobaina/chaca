import { DatasetSchema } from "../../../../src";
import { BookingStatus } from "../types";
import { AIRCRAFT_SCHEMA } from "./aircraft";
import { AIRLINE_SCHEMA } from "./airline";
import { AIRPORT_SCHEMA } from "./airport";
import { BAGGAGE_SCHEMA } from "./baggage";
import { BOOKING_SCHEMA } from "./booking";
import { CHECK_IN_SCHEMA } from "./check-in";
import { CREW_MEMBER_SCHEMA } from "./crew-member";
import { FLIGHT_SCHEMA } from "./flight";
import { FLIGHT_CREW_SCHEMA } from "./flight-crew";
import { GATE_SCHEMA } from "./gate";
import { MEMBERSHIP_SCHEMA } from "./membership";
import { PASSENGER_SCHEMA } from "./passenger";
import { PAYMENT_SCHEMA } from "./payment";
import { ROUTE_SCHEMA } from "./route";

export const AIRLINE_SCHEMAS: DatasetSchema[] = [
  { documents: 8, name: "Airline", schema: AIRLINE_SCHEMA },
  { documents: 30, name: "Airport", schema: AIRPORT_SCHEMA },
  { documents: 120, name: "Gate", schema: GATE_SCHEMA },
  { documents: 40, name: "Aircraft", schema: AIRCRAFT_SCHEMA },
  { documents: 80, name: "Route", schema: ROUTE_SCHEMA },
  { documents: 150, name: "Flight", schema: FLIGHT_SCHEMA },
  { documents: 200, name: "CrewMember", schema: CREW_MEMBER_SCHEMA },
  { documents: 350, name: "FlightCrew", schema: FLIGHT_CREW_SCHEMA },
  { documents: 250, name: "Passenger", schema: PASSENGER_SCHEMA },
  {
    documents: async ({ store }) => {
      const passengers = await store.get("Passenger");

      return passengers.filter((p) => p.frequent_flyer_number !== null).length;
    },
    name: "Membership",
    schema: MEMBERSHIP_SCHEMA,
  },
  { documents: 600, name: "Booking", schema: BOOKING_SCHEMA },
  {
    documents: async ({ store }) => {
      const bookings = await store.get("Booking");

      return bookings.filter((b) => {
        return b.status === BookingStatus.CheckedIn;
      }).length;
    },
    name: "CheckIn",
    schema: CHECK_IN_SCHEMA,
  },
  { documents: 250, name: "Baggage", schema: BAGGAGE_SCHEMA },
  {
    documents: async ({ store }) => {
      const bookings = await store.get("Booking");

      return bookings.length;
    },
    name: "Payment",
    schema: PAYMENT_SCHEMA,
  },
];
