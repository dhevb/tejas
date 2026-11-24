import { parseIndiaAddress, UNIDENTIFIED_DISTRICT, UNIDENTIFIED_LOCATION } from "@/lib/registration/india-address";
import type { RegistrationRecord } from "@/lib/registration/store";

export function filterRegistrationsForExport(
  records: RegistrationRecord[],
  filters: { state?: string; district?: string; status?: string; q?: string },
): RegistrationRecord[] {
  const state = (filters.state ?? "").trim();
  const district = (filters.district ?? "").trim();
  const status = (filters.status ?? "").trim();
  const needle = (filters.q ?? "").trim().toLowerCase();

  return records.filter((record) => {
    const parsed = parseIndiaAddress(record.school.schoolAddress);
    const matchesState = !state || state === "all" || parsed.stateKey === state;
    const matchesDistrict =
      !district ||
      district === "all" ||
      parsed.districtKey === district ||
      (district === UNIDENTIFIED_DISTRICT &&
        (parsed.districtKey === UNIDENTIFIED_DISTRICT || parsed.districtKey === UNIDENTIFIED_LOCATION));
    const matchesStatus =
      !status ||
      status === "all" ||
      record.payment.status === status ||
      (status === "pending_group" &&
        (record.payment.status === "pending_instructions" || record.payment.status === "awaiting_payment"));
    const matchesQuery =
      !needle ||
      record.school.schoolName.toLowerCase().includes(needle) ||
      record.reference.toLowerCase().includes(needle) ||
      record.school.schoolAddress.toLowerCase().includes(needle) ||
      (record.payment.transactionReference ?? "").toLowerCase().includes(needle);
    return matchesState && matchesDistrict && matchesStatus && matchesQuery;
  });
}
