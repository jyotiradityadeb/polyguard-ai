# Mechanistic PK sandbox

The sandbox is intentionally gated. `lib/pk-sandbox.ts` implements a transparent one-compartment oral model and requires every parameter to have a positive value, unit, source, and reviewed flag. A model must also be explicitly marked `VALIDATED` before simulation runs.

Required parameters include dose, bioavailability, absorption rate, volume of distribution, clearance, half-life, enzyme contribution fraction, and optional inhibition assumptions. The model returns baseline and mechanistic scenario points, AUC, Cmax, clearance, and derivable half-life. It labels results `SIMULATED`, `MODEL-DEPENDENT`, `NOT PATIENT-SPECIFIC`, and `NOT A CLINICAL PREDICTION`.

No complete reviewed PK parameter set is currently shipped, so the UI displays: “Insufficient validated pharmacokinetic parameters for simulation.” This is deliberate. Missing, guessed, synthetic, or unreviewed parameters cannot produce a curve.
