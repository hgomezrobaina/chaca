import { expect } from "vitest";
import { CaseRule } from "../core/case-rule";
import { FindRef } from "../core/find-ref";
import {
  AircraftStatus,
  AirlineDataset,
  BookingStatus,
  CrewRole,
  FlightStatus,
  MembershipTier,
  PaymentStatus,
  SeatClass,
} from "./types";

export const AIRLINE_RULES: CaseRule<AirlineDataset>[] = [
  {
    id: "R1",
    text: "A route's origin and destination are different airports",
    fields: ["Route.origin_airport_id", "Route.destination_airport_id"],
    check: ({ Route }) => {
      for (const route of Route) {
        expect(route.origin_airport_id).not.toBe(route.destination_airport_id);
      }
    },
  },
  {
    id: "R2",
    text: "A route's (origin, destination) pair is unique",
    fields: ["Route.origin_airport_id", "Route.destination_airport_id"],
    check: ({ Route }) => {
      for (const route of Route) {
        const samePair = Route.filter((candidate) => {
          return (
            candidate.origin_airport_id === route.origin_airport_id &&
            candidate.destination_airport_id === route.destination_airport_id
          );
        });

        expect(samePair).toHaveLength(1);
      }
    },
  },
  {
    id: "R3",
    text: "A route's duration_min is derived from distance_km",
    fields: ["Route.duration_min", "Route.distance_km"],
    check: ({ Route }) => {
      for (const route of Route) {
        expect(route.duration_min).toBe(
          Math.round(route.distance_km / 13) + 30,
        );
      }
    },
  },
  {
    id: "R4",
    text: "Flight numbers are unique and start at 100",
    fields: ["Flight.flight_number"],
    check: ({ Flight }) => {
      const numbers = new Set(
        Flight.map((flight) => {
          return flight.flight_number;
        }),
      );

      expect(numbers.size).toBe(Flight.length);

      for (const flight of Flight) {
        expect(flight.flight_number).toBeGreaterThanOrEqual(100);
      }
    },
  },
  {
    id: "R5",
    text: "A flight's arrival equals departure plus its route's duration",
    fields: [
      "Flight.arrival",
      "Flight.departure",
      "Flight.route_id",
      "Route.duration_min",
    ],
    check: ({ Flight, Route }) => {
      for (const flight of Flight) {
        const route = FindRef.execute({
          documents: Route,
          id: flight.route_id,
          from: "Flight.route_id",
        });

        expect(flight.arrival.getTime() - flight.departure.getTime()).toBe(
          route.duration_min * 60 * 1000,
        );
      }
    },
  },
  {
    id: "R6",
    text: "Flights only use active aircrafts",
    fields: ["Flight.aircraft_id", "Aircraft.status"],
    check: ({ Flight, Aircraft }) => {
      for (const flight of Flight) {
        const aircraft = FindRef.execute({
          documents: Aircraft,
          id: flight.aircraft_id,
          from: "Flight.aircraft_id",
        });

        expect(aircraft.status).toBe(AircraftStatus.Active);
      }
    },
  },
  {
    id: "R7",
    text: "An aircraft cannot have two overlapping flights",
    fields: ["Flight.aircraft_id", "Flight.departure", "Flight.arrival"],
    check: ({ Flight }) => {
      for (const flight of Flight) {
        for (const other of Flight) {
          if (other !== flight && other.aircraft_id === flight.aircraft_id) {
            const overlap =
              flight.departure.getTime() < other.arrival.getTime() &&
              flight.arrival.getTime() > other.departure.getTime();

            expect(overlap).toBe(false);
          }
        }
      }
    },
  },
  {
    id: "R8",
    text: "A flight's gate, when present, belongs to the origin airport of its route",
    fields: [
      "Flight.gate_id",
      "Flight.route_id",
      "Route.origin_airport_id",
      "Gate.airport_id",
    ],
    check: ({ Flight, Route, Gate }) => {
      for (const flight of Flight) {
        if (flight.gate_id !== null) {
          const route = FindRef.execute({
            documents: Route,
            id: flight.route_id,
            from: "Flight.route_id",
          });
          const gate = FindRef.execute({
            documents: Gate,
            id: flight.gate_id,
            from: "Flight.gate_id",
          });

          expect(gate.airport_id).toBe(route.origin_airport_id);
        }
      }
    },
  },
  {
    id: "R9",
    text: "'departed' and 'landed' flights have a past departure",
    fields: ["Flight.status", "Flight.departure"],
    check: ({ Flight }) => {
      const now = Date.now();

      for (const flight of Flight) {
        if (
          flight.status === FlightStatus.Departed ||
          flight.status === FlightStatus.Landed
        ) {
          expect(flight.departure.getTime()).toBeLessThanOrEqual(now);
        }
      }
    },
  },
  {
    id: "R10",
    text: "Pilots and copilots have a license, attendants do not",
    fields: ["CrewMember.role", "CrewMember.license_number"],
    check: ({ CrewMember }) => {
      for (const member of CrewMember) {
        if (member.role === CrewRole.Attendant) {
          expect(member.license_number).toBeNull();
        } else {
          expect(member.license_number).not.toBeNull();
        }
      }
    },
  },
  {
    id: "R11",
    text: "A crew member cannot be assigned twice to the same flight",
    fields: ["FlightCrew.flight_id", "FlightCrew.crew_member_id"],
    check: ({ FlightCrew }) => {
      for (const assignment of FlightCrew) {
        const same = FlightCrew.filter((candidate) => {
          return (
            candidate.flight_id === assignment.flight_id &&
            candidate.crew_member_id === assignment.crew_member_id
          );
        });

        expect(same).toHaveLength(1);
      }
    },
  },
  {
    id: "R12",
    text: "A flight has at most 4 crew assignments, counting its captain",
    fields: ["FlightCrew.flight_id", "FlightCaptain.flight_id"],
    check: ({ Flight, FlightCrew, FlightCaptain }) => {
      for (const flight of Flight) {
        const assigned = FlightCrew.filter((assignment) => {
          return assignment.flight_id === flight.id;
        });
        const captains = FlightCaptain.filter((captain) => {
          return captain.flight_id === flight.id;
        });

        expect(assigned.length + captains.length).toBeLessThanOrEqual(4);
      }
    },
  },
  {
    id: "R13",
    text: "A flight has at most 2 pilots, counting its captain",
    fields: [
      "FlightCrew.flight_id",
      "FlightCrew.crew_member_id",
      "FlightCaptain.flight_id",
      "CrewMember.role",
    ],
    check: ({ Flight, FlightCrew, FlightCaptain, CrewMember }) => {
      for (const flight of Flight) {
        const pilots = FlightCrew.filter((assignment) => {
          if (assignment.flight_id !== flight.id) {
            return false;
          }

          const member = FindRef.execute({
            documents: CrewMember,
            id: assignment.crew_member_id,
            from: "FlightCrew.crew_member_id",
          });

          return member.role === CrewRole.Pilot;
        });
        const captains = FlightCaptain.filter((captain) => {
          return captain.flight_id === flight.id;
        });

        expect(pilots.length + captains.length).toBeLessThanOrEqual(2);
      }
    },
  },
  {
    id: "R14",
    text: "A flight's crew members belong to the airline of its aircraft",
    fields: [
      "FlightCrew.flight_id",
      "FlightCrew.crew_member_id",
      "Flight.aircraft_id",
      "Aircraft.airline_id",
      "CrewMember.airline_id",
    ],
    check: ({ FlightCrew, Flight, Aircraft, CrewMember }) => {
      for (const assignment of FlightCrew) {
        const flight = FindRef.execute({
          documents: Flight,
          id: assignment.flight_id,
          from: "FlightCrew.flight_id",
        });
        const aircraft = FindRef.execute({
          documents: Aircraft,
          id: flight.aircraft_id,
          from: "Flight.aircraft_id",
        });
        const member = FindRef.execute({
          documents: CrewMember,
          id: assignment.crew_member_id,
          from: "FlightCrew.crew_member_id",
        });

        expect(member.airline_id).toBe(aircraft.airline_id);
      }
    },
  },
  {
    id: "R15",
    text: "The number of memberships equals the number of passengers with a frequent flyer number",
    fields: ["Membership.id", "Passenger.frequent_flyer_number"],
    check: ({ Membership, Passenger }) => {
      const withFrequentFlyerNumber = Passenger.filter((passenger) => {
        return passenger.frequent_flyer_number !== null;
      });

      expect(Membership.length).toBe(withFrequentFlyerNumber.length);
    },
  },
  {
    id: "R16",
    text: "Every membership maps to a passenger with a frequent flyer number",
    fields: ["Membership.id", "Passenger.frequent_flyer_number"],
    check: ({ Membership, Passenger }) => {
      for (const membership of Membership) {
        const passenger = FindRef.execute({
          documents: Passenger,
          id: membership.id,
          from: "Membership.id",
        });

        expect(passenger.frequent_flyer_number).not.toBeNull();
      }
    },
  },
  {
    id: "R17",
    text: "There are more 'bronze' memberships than any other tier",
    fields: ["Membership.tier"],
    check: ({ Membership }) => {
      const countOf = (tier: MembershipTier): number => {
        return Membership.filter((membership) => {
          return membership.tier === tier;
        }).length;
      };

      expect(countOf(MembershipTier.Bronze)).toBeGreaterThan(
        countOf(MembershipTier.Silver),
      );
      expect(countOf(MembershipTier.Bronze)).toBeGreaterThan(
        countOf(MembershipTier.Gold),
      );
      expect(countOf(MembershipTier.Bronze)).toBeGreaterThan(
        countOf(MembershipTier.Platinum),
      );
    },
  },
  {
    id: "R18",
    text: "A membership's points fall within its tier's range, and the ranges never overlap",
    fields: ["Membership.points", "Membership.tier"],
    check: ({ Membership }) => {
      const rangeByTier: Record<MembershipTier, { min: number; max: number }> =
        {
          [MembershipTier.Bronze]: { min: 0, max: 9999 },
          [MembershipTier.Silver]: { min: 10000, max: 49999 },
          [MembershipTier.Gold]: { min: 50000, max: 99999 },
          [MembershipTier.Platinum]: { min: 100000, max: 500000 },
        };

      for (const membership of Membership) {
        const range = rangeByTier[membership.tier];

        expect(membership.points).toBeGreaterThanOrEqual(range.min);
        expect(membership.points).toBeLessThanOrEqual(range.max);
      }
    },
  },
  {
    id: "R19",
    text: "Bookings per flight and class never exceed the aircraft's capacity",
    fields: [
      "Booking.flight_id",
      "Booking.seat_class",
      "Aircraft.capacity_economy",
      "Aircraft.capacity_business",
    ],
    check: ({ Flight, Aircraft, Booking }) => {
      for (const flight of Flight) {
        const aircraft = FindRef.execute({
          documents: Aircraft,
          id: flight.aircraft_id,
          from: "Flight.aircraft_id",
        });

        const countOf = (seatClass: SeatClass): number => {
          return Booking.filter((booking) => {
            return (
              booking.flight_id === flight.id &&
              booking.seat_class === seatClass
            );
          }).length;
        };

        expect(countOf(SeatClass.Economy)).toBeLessThanOrEqual(
          aircraft.capacity_economy,
        );
        expect(countOf(SeatClass.Business)).toBeLessThanOrEqual(
          aircraft.capacity_business,
        );
      }
    },
  },
  {
    id: "R20",
    text: "A booking's price equals distance times 0.12, with a 2.5 multiplier for business",
    fields: [
      "Booking.price",
      "Booking.seat_class",
      "Booking.flight_id",
      "Route.distance_km",
    ],
    check: ({ Booking, Flight, Route }) => {
      for (const booking of Booking) {
        const flight = FindRef.execute({
          documents: Flight,
          id: booking.flight_id,
          from: "Booking.flight_id",
        });
        const route = FindRef.execute({
          documents: Route,
          id: flight.route_id,
          from: "Flight.route_id",
        });

        const multiplier = booking.seat_class === SeatClass.Business ? 2.5 : 1;
        const price =
          Math.round(route.distance_km * 0.12 * multiplier * 100) / 100;

        expect(booking.price).toBe(price);
      }
    },
  },
  {
    id: "R21",
    text: "A passenger cannot book the same flight twice",
    fields: ["Booking.flight_id", "Booking.passenger_id"],
    check: ({ Booking }) => {
      for (const booking of Booking) {
        const same = Booking.filter((candidate) => {
          return (
            candidate.flight_id === booking.flight_id &&
            candidate.passenger_id === booking.passenger_id
          );
        });

        expect(same).toHaveLength(1);
      }
    },
  },
  {
    id: "R22",
    text: "A booking's booking_date is before its flight's departure",
    fields: ["Booking.booking_date", "Booking.flight_id", "Flight.departure"],
    check: ({ Booking, Flight }) => {
      for (const booking of Booking) {
        const flight = FindRef.execute({
          documents: Flight,
          id: booking.flight_id,
          from: "Booking.flight_id",
        });

        expect(booking.booking_date.getTime()).toBeLessThan(
          flight.departure.getTime(),
        );
      }
    },
  },
  {
    id: "R23",
    text: "There are no bookings on cancelled flights",
    fields: ["Booking.flight_id", "Flight.status"],
    check: ({ Booking, Flight }) => {
      for (const booking of Booking) {
        const flight = FindRef.execute({
          documents: Flight,
          id: booking.flight_id,
          from: "Booking.flight_id",
        });

        expect(flight.status).not.toBe(FlightStatus.Cancelled);
      }
    },
  },
  {
    id: "R24",
    text: "The number of check-ins equals the number of 'checked-in' bookings",
    fields: ["CheckIn.id", "Booking.status"],
    check: ({ CheckIn, Booking }) => {
      const checkedIn = Booking.filter((booking) => {
        return booking.status === BookingStatus.CheckedIn;
      });

      expect(CheckIn.length).toBe(checkedIn.length);
    },
  },
  {
    id: "R25",
    text: "Every check-in belongs to a distinct 'checked-in' booking",
    fields: ["CheckIn.booking_id", "Booking.status"],
    check: ({ CheckIn, Booking }) => {
      for (const checkin of CheckIn) {
        const same = CheckIn.filter((candidate) => {
          return candidate.booking_id === checkin.booking_id;
        });

        expect(same).toHaveLength(1);

        const booking = FindRef.execute({
          documents: Booking,
          id: checkin.booking_id,
          from: "CheckIn.booking_id",
        });

        expect(booking.status).toBe(BookingStatus.CheckedIn);
      }
    },
  },
  {
    id: "R26",
    text: "A seat is unique per flight",
    fields: ["CheckIn.seat", "CheckIn.booking_id", "Booking.flight_id"],
    check: ({ CheckIn, Booking }) => {
      for (const checkin of CheckIn) {
        const booking = FindRef.execute({
          documents: Booking,
          id: checkin.booking_id,
          from: "CheckIn.booking_id",
        });

        const sameSeat = CheckIn.filter((other) => {
          const otherBooking = FindRef.execute({
            documents: Booking,
            id: other.booking_id,
            from: "CheckIn.booking_id",
          });

          return (
            otherBooking.flight_id === booking.flight_id &&
            other.seat === checkin.seat
          );
        });

        expect(sameSeat).toHaveLength(1);
      }
    },
  },
  {
    id: "R27",
    text: "A check-in's checkin_date is between its booking_date and the flight's departure",
    fields: [
      "CheckIn.checkin_date",
      "CheckIn.booking_id",
      "Booking.booking_date",
      "Booking.flight_id",
      "Flight.departure",
    ],
    check: ({ CheckIn, Booking, Flight }) => {
      for (const checkin of CheckIn) {
        const booking = FindRef.execute({
          documents: Booking,
          id: checkin.booking_id,
          from: "CheckIn.booking_id",
        });
        const flight = FindRef.execute({
          documents: Flight,
          id: booking.flight_id,
          from: "Booking.flight_id",
        });

        expect(checkin.checkin_date.getTime()).toBeGreaterThanOrEqual(
          booking.booking_date.getTime(),
        );
        expect(checkin.checkin_date.getTime()).toBeLessThanOrEqual(
          flight.departure.getTime(),
        );
      }
    },
  },
  {
    id: "R28",
    text: "Baggage tags are unique",
    fields: ["Baggage.tag"],
    check: ({ Baggage }) => {
      const tags = new Set(
        Baggage.map((bag) => {
          return bag.tag;
        }),
      );

      expect(tags.size).toBe(Baggage.length);
    },
  },
  {
    id: "R29",
    text: "A baggage's weight respects its class limit (23kg economy, 32kg business)",
    fields: [
      "Baggage.weight_kg",
      "Baggage.checkin_id",
      "CheckIn.booking_id",
      "Booking.seat_class",
    ],
    check: ({ Baggage, CheckIn, Booking }) => {
      for (const bag of Baggage) {
        const checkin = FindRef.execute({
          documents: CheckIn,
          id: bag.checkin_id,
          from: "Baggage.checkin_id",
        });
        const booking = FindRef.execute({
          documents: Booking,
          id: checkin.booking_id,
          from: "CheckIn.booking_id",
        });

        const max = booking.seat_class === SeatClass.Business ? 32 : 23;

        expect(bag.weight_kg).toBeGreaterThanOrEqual(5);
        expect(bag.weight_kg).toBeLessThanOrEqual(max);
      }
    },
  },
  {
    id: "R30",
    text: "Every booking has exactly one payment",
    fields: ["Payment.booking_id"],
    check: ({ Payment, Booking }) => {
      expect(Payment.length).toBe(Booking.length);

      for (const payment of Payment) {
        const same = Payment.filter((candidate) => {
          return candidate.booking_id === payment.booking_id;
        });

        expect(same).toHaveLength(1);
      }
    },
  },
  {
    id: "R31",
    text: "A payment's amount equals its booking's price",
    fields: ["Payment.amount", "Payment.booking_id", "Booking.price"],
    check: ({ Payment, Booking }) => {
      for (const payment of Payment) {
        const booking = FindRef.execute({
          documents: Booking,
          id: payment.booking_id,
          from: "Payment.booking_id",
        });

        expect(payment.amount).toBe(booking.price);
      }
    },
  },
  {
    id: "R32",
    text: "A cancelled booking has a refunded payment; otherwise it's completed or pending",
    fields: ["Payment.status", "Payment.booking_id", "Booking.status"],
    check: ({ Payment, Booking }) => {
      for (const payment of Payment) {
        const booking = FindRef.execute({
          documents: Booking,
          id: payment.booking_id,
          from: "Payment.booking_id",
        });

        if (booking.status === BookingStatus.Cancelled) {
          expect(payment.status).toBe(PaymentStatus.Refunded);
        } else {
          expect([PaymentStatus.Completed, PaymentStatus.Pending]).toContain(
            payment.status,
          );
        }
      }
    },
  },
  {
    id: "R33",
    text: "A payment's created_at is on or after its booking's booking_date",
    fields: [
      "Payment.created_at",
      "Payment.booking_id",
      "Booking.booking_date",
    ],
    check: ({ Payment, Booking }) => {
      for (const payment of Payment) {
        const booking = FindRef.execute({
          documents: Booking,
          id: payment.booking_id,
          from: "Payment.booking_id",
        });

        expect(payment.created_at.getTime()).toBeGreaterThanOrEqual(
          booking.booking_date.getTime(),
        );
      }
    },
  },
  {
    id: "R34",
    text: "An airline's code is never empty, and every airline's code is unique",
    fields: ["Airline.code"],
    check: ({ Airline }) => {
      for (const airline of Airline) {
        expect(airline.code.length).toBeGreaterThan(0);
      }

      const codes = Airline.map((airline) => airline.code);

      expect(new Set(codes).size).toBe(codes.length);
    },
  },
  {
    id: "R35",
    text: "An airport's code is never empty, and every airport's code is unique",
    fields: ["Airport.code"],
    check: ({ Airport }) => {
      for (const airport of Airport) {
        expect(airport.code.length).toBeGreaterThan(0);
      }

      const codes = Airport.map((airport) => airport.code);

      expect(new Set(codes).size).toBe(codes.length);
    },
  },
  {
    id: "R36",
    text: "A gate's code is unique within its airport",
    fields: ["Gate.code", "Gate.airport_id"],
    check: ({ Gate }) => {
      for (const gate of Gate) {
        const sameAirportSameCode = Gate.filter((candidate) => {
          return (
            candidate.airport_id === gate.airport_id &&
            candidate.code === gate.code
          );
        });

        expect(sameAirportSameCode).toHaveLength(1);
      }
    },
  },
  {
    id: "R37",
    text: "Every non-cancelled flight has exactly one captain, and cancelled flights have none",
    fields: ["FlightCaptain.flight_id", "Flight.status"],
    check: ({ Flight, FlightCaptain }) => {
      for (const flight of Flight) {
        const captains = FlightCaptain.filter((captain) => {
          return captain.flight_id === flight.id;
        });

        if (flight.status === FlightStatus.Cancelled) {
          expect(captains).toHaveLength(0);
        } else {
          expect(captains).toHaveLength(1);
        }
      }
    },
  },
  {
    id: "R38",
    text: "A flight's captain is a pilot employed by the airline of its aircraft",
    fields: [
      "FlightCaptain.crew_member_id",
      "FlightCaptain.flight_id",
      "Flight.aircraft_id",
      "Aircraft.airline_id",
      "CrewMember.role",
      "CrewMember.airline_id",
    ],
    check: ({ FlightCaptain, Flight, Aircraft, CrewMember }) => {
      for (const captain of FlightCaptain) {
        const flight = FindRef.execute({
          documents: Flight,
          id: captain.flight_id,
          from: "FlightCaptain.flight_id",
        });
        const aircraft = FindRef.execute({
          documents: Aircraft,
          id: flight.aircraft_id,
          from: "Flight.aircraft_id",
        });
        const member = FindRef.execute({
          documents: CrewMember,
          id: captain.crew_member_id,
          from: "FlightCaptain.crew_member_id",
        });

        expect(member.role).toBe(CrewRole.Pilot);
        expect(member.airline_id).toBe(aircraft.airline_id);
      }
    },
  },
];
