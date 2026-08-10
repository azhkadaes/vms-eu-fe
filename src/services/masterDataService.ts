import { get } from "./api";

export interface OfficerResponse {
  id: string;
  name: string;
  jabatan: string;
  isVip: boolean;
  isVvip: boolean;
}

export interface RoomResponse {
  id: string;
  name: string;
  locationLabel: string;
  statusAktif: boolean;
}

export interface OfficerOption {
  id: string;
  label: string;
}

export interface RoomOption {
  id: string;
  label: string;
}

export async function fetchOfficers(): Promise<OfficerResponse[]> {
  return get<OfficerResponse[]>("/officers");
}

export async function fetchRooms(): Promise<RoomResponse[]> {
  return get<RoomResponse[]>("/rooms");
}

export function mapOfficersToOptions(
  officers: OfficerResponse[],
): OfficerOption[] {
  return officers.map((o) => ({
    id: o.id,
    label: o.jabatan?.trim() ? o.jabatan : o.name,
  }));
}

export function mapRoomsToOptions(rooms: RoomResponse[]): RoomOption[] {
  return rooms
    .filter((r) => r.statusAktif)
    .map((r) => ({
      id: r.id,
      label: r.locationLabel?.trim() ? r.locationLabel : r.name,
    }));
}

export function getOfficerLabel(
  officers: OfficerResponse[],
  officerIdOrName: string,
): string {
  const byId = officers.find((o) => o.id === officerIdOrName);
  if (byId) {
    return byId.jabatan?.trim() ? byId.jabatan : byId.name;
  }
  const byName = officers.find(
    (o) =>
      o.name === officerIdOrName ||
      o.jabatan === officerIdOrName,
  );
  if (byName) {
    return byName.jabatan?.trim() ? byName.jabatan : byName.name;
  }
  return officerIdOrName;
}
