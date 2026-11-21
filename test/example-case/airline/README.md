# Airline case

A flight network: airlines operate a fleet of regional aircraft on routes between airports; passengers book flights, check in, and dispatch baggage; crews are assigned to flights.

This is the most feature-dense case: besides the patterns of the other cases it exercises `chaca.sequence()`, `ref` with `nullOnEmpty`, self-exclusion refs (`origin ≠ destination`), interval-overlap constraints, capacity caps read from another entity, and deterministic unique seat generation.

## Entities

| Entity       | Documents               | Description                                                                 |
| ------------ | ----------------------- | --------------------------------------------------------------------------- |
| `Airline`    | 8                       | Operator of aircrafts and employer of crews; `code` is one of 8 literal IATA-style codes, each exactly once. |
| `Airport`    | 30                      | `code` is one of 30 literal IATA codes, each exactly once.                 |
| `Gate`       | 120                     | Boarding gate; belongs to an `Airport`; `code` is a globally unique `G<n>` sequence. |
| `Aircraft`   | 40                      | Small regional fleet (6–12 economy / 2–4 business seats) so the capacity rule actually binds. |
| `Route`      | 80                      | Origin ≠ destination; unique (origin, destination) pair; `duration_min` derived from `distance_km`. |
| `Flight`     | 150                     | `flight_number` via `chaca.sequence()`; departures within −3/+2 months.    |
| `CrewMember` | 200                     | Role via `probability`; `license_number` conditionally null for attendants. |
| `FlightCaptain` | one per non-cancelled flight | A pilot of the flight's airline; `flight_id` unique.                 |
| `FlightCrew` | 350                     | M:N flight ↔ crew with airline consistency, pilot cap and per-flight cap, both counting the flight's captain. |
| `Passenger`  | 250                     | `frequent_flyer_number` with `possibleNull: 0.6`.                          |
| `Membership` | one per frequent flyer  | 1:1 extension of `Passenger` (dynamic count + unique filtered ref).        |
| `Booking`    | 600                     | Class via `probability`; capacity-capped flight ref; derived `price`.      |
| `CheckIn`    | one per checked-in booking | Deterministic unique seat per flight; date inside the booking window.   |
| `Baggage`    | 250                     | `tag` via `chaca.sequence({ startsWith: 1000 })`; weight capped by class.  |
| `Payment`    | one per booking         | `amount` mirrors the booking price; refunds for cancelled bookings.        |

## Schema

See [schema.md](./schema.md) for the full ER diagram, a field-by-field table per entity and the rule table — generated from the schema definitions, never hand-written.

## Business rules

Every rule below has its own assertion in [rules.ts](rules.ts) (the full, field-level list is the generated "Rules" table in [schema.md](./schema.md)).

1. **Route** (`Route.origin_airport_id`, `.destination_airport_id`, `.duration_min`, `.distance_km`): destination excludes the chosen origin, and the (origin, destination) pair never repeats; `duration_min = round(distance_km / 13) + 30`.
2. **Flight** (`Flight.arrival`, `.departure`, `.aircraft_id`, `Aircraft.status`, `Flight.gate_id`, `.status`): `arrival = departure + route.duration_min`; only `active` aircraft fly, and no aircraft has two overlapping flights; `gate_id` only accepts a gate of the origin airport, `null` when none exist; `status` is time-coherent (future ⇒ `scheduled`/`boarding`/`cancelled`, past ⇒ `departed`/`landed`/`cancelled`).
3. **Codes are unique** (`Airline.code`, `Airport.code`, `Gate.code`, `Flight.flight_number`, `Baggage.tag`): `Airline.code`/`Airport.code` are each globally unique; `Gate.code` is unique within its airport; `flight_number` is a global sequence from 100; `Baggage.tag` is a global sequence from 1000.
4. **CrewMember** (`CrewMember.license_number`, `.role`): `license_number` is `null` exactly for `attendant`s.
5. **`FlightCaptain` is a 1:1 extension of non-cancelled flights** (`FlightCaptain.flight_id`, `Flight.status`, `FlightCaptain.crew_member_id`, `CrewMember.role`, `.airline_id`): a unique ref to non-cancelled flights, with a matching dynamic `documents` count; its crew member is a `pilot` employed by the flight's aircraft's airline. Split out from `FlightCrew` so "every flight has a captain" is an exact bijection, not a side effect of a shared pool.
6. **FlightCrew** (`FlightCrew.flight_id`, `.crew_member_id`, `CrewMember.airline_id`): belongs to the airline of the flight's aircraft; never assigned twice to the same flight, nor duplicating the flight's captain; a flight accepts at most 4 crew and at most 2 pilots, **counting its captain**; `flight_id` always picks the flight with the fewest assignments so far — the same "fewest assigned so far" pattern the hospital case uses for `Room`/`Admission` — so every flight ends up staffed.
7. **Membership is a 1:1 extension of frequent flyers** (`Membership.id`, `Passenger.frequent_flyer_number`, `Membership.points`, `.tier`): a passenger needs a frequent flyer number to have one; `points` falls within the range of its `tier` (bronze/silver/gold/platinum), and the four ranges never overlap.
8. **Booking** (`Booking.flight_id`, `Flight.status`, `Booking.seat_class`, `Aircraft.capacity_economy`, `.capacity_business`, `Booking.passenger_id`, `.price`, `.booking_date`): rejects `cancelled` flights, and never exceeds the aircraft's per-class capacity; a passenger never books the same flight twice; `price = distance_km × 0.12` (×2.5 for business); `booking_date` is in the 120 days before departure, never in the future.
9. **`CheckIn` is a 1:1 extension of checked-in bookings** (`CheckIn.booking_id`, `Booking.status`, `CheckIn.seat`, `.checkin_date`): one per `checked-in` booking; `seat` is a deterministic, unique-per-flight sequence (`1A`, `1B`, … `2A`); `checkin_date` is between the booking date and the departure.
10. **Baggage** (`Baggage.weight_kg`, `CheckIn.booking_id`, `Booking.seat_class`): weight is capped by the booking's class (23kg economy / 32kg business).
11. **`Payment` is a 1:1 extension of bookings** (`Payment.booking_id`, `.amount`, `.status`, `Booking.status`, `.price`, `Payment.created_at`, `Booking.booking_date`): exactly one per booking; `amount` mirrors the booking's `price`; a `cancelled` booking's payment is `refunded`, otherwise `completed`/`pending`; `created_at` is on or after the booking date.
