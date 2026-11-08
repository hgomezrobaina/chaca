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

## Business rules encoded in the schemas

- **Route**: destination ref excludes the already-chosen origin (`where` using `currentFields`), and the (origin, destination) pair is deduplicated against `currentDocuments`. `duration_min = round(distance_km / 13) + 30`.
- **Flight**: `arrival = departure + route.duration_min`. Only `active` aircrafts fly, and the aircraft ref rejects candidates with an overlapping flight (interval check against `currentDocuments`). `gate_id` only accepts gates of the origin airport — with `nullOnEmpty: true`, so airports without gates yield `null` instead of failing. Status is time-coherent: future departures are `scheduled`/`boarding`/`cancelled`, past ones `departed`/`landed`/`cancelled`.
- **CrewMember**: `license_number` is `null` exactly for attendants (conditional `possibleNull`).
- **FlightCaptain**: one per non-cancelled flight (`unique` ref + dynamic `documents` matching the non-cancelled count), whose crew member must be a `pilot` employed by the flight's aircraft's airline. Split out from `FlightCrew` so "every flight has a captain" is an exact bijection rather than a side effect of a shared pool.
- **FlightCrew**: the crew member must belong to the airline of the flight's aircraft (flight → aircraft → airline chain inside the `where`), cannot be assigned twice to the same flight (nor be the flight's captain), and a flight accepts at most 4 crew assignments and at most 2 pilots **counting its captain**. `flight_id`'s `where` always picks the flight with the fewest assignments so far (captain included), the same "fewest assigned so far" pattern the hospital case uses for `Room`/`Admission` — this keeps every flight staffed instead of letting the pool exhaust unevenly.
- **Membership**: dynamic count + unique filtered ref — one membership per passenger with a frequent flyer number (1:1 inheritance pattern); `points` falls within the range of its `tier` (bronze/silver/gold/platinum), and the four ranges never overlap.
- **Booking**: the flight ref rejects `cancelled` flights and enforces the per-class capacity of the flight's aircraft (counting `currentDocuments`). A passenger cannot book the same flight twice. `price = distance_km × 0.12` (×2.5 for business). `booking_date` falls in the 120 days before departure and never in the future.
- **CheckIn**: one per `checked-in` booking. The seat is generated deterministically from the number of previous check-ins on the same flight (`1A`, `1B`, … `2A`), guaranteeing uniqueness without retries. `checkin_date` sits between the booking date and the departure.
- **Baggage**: `tag` is a global sequence; `weight_kg` is capped by the booking class (23kg economy / 32kg business).
- **Payment**: exactly one per booking (unique ref + dynamic count); `amount` mirrors the booking price; `cancelled` booking ⇒ `refunded` payment.

## Validations (in [airline.test.ts](airline.test.ts))

- **Routes**: origin ≠ destination, unique (origin, destination) pair, `duration_min` derived from distance.
- **Flights**: unique flight numbers starting at 100, `arrival − departure` equals the route duration, only active aircrafts, no overlapping flights per aircraft, gate (when present) belongs to the origin airport, `departed`/`landed` only for past departures.
- **Crew**: license presence matches the role, no duplicate (flight, crew member), at most 4 crew and 2 pilots per flight counting the captain, crew airline equals the aircraft's airline, every non-cancelled flight has exactly one captain (cancelled flights have none) and that captain is a pilot of the right airline.
- **Memberships**: count and ids match passengers with frequent flyer number, bronze outnumbers every other tier, points fall within the tier's range.
- **Codes**: `Airline.code` and `Airport.code` are each unique; `Gate.code` is unique within its airport.
- **Bookings**: per-flight/class capacity never exceeded, exact price formula, no duplicate (passenger, flight), `booking_date` before departure, no bookings on cancelled flights.
- **Check-ins**: bijection with `checked-in` bookings, unique seat per flight, `checkin_date` inside the booking→departure window.
- **Baggage**: unique tags (validates `sequence`), weight within the class limit.
- **Payments**: exactly one per booking, `amount` equals the price, `cancelled` ⇒ `refunded` (otherwise `completed`/`pending`), `created_at` after the booking date.
