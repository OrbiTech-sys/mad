import { describe, expect, it } from "vitest";
import { BRANCHES } from "@/data/branches";
import { destinationPoint, formatDistance, haversineKm, isValidCoordinates, midpoint } from "../distance";

const johar = { lat: 31.4609455, lng: 74.2872183 };
const gulberg = { lat: 31.5228933, lng: 74.3415417 };
const valencia = { lat: 31.3968539, lng: 74.2559122 };

describe("haversineKm", () => {
  it("is zero for identical points", () => {
    expect(haversineKm(johar, johar)).toBe(0);
  });

  it("matches the textbook value for one degree of longitude on the equator", () => {
    // 2πR/360 with R = 6371.0088 km
    expect(haversineKm({ lat: 0, lng: 0 }, { lat: 0, lng: 1 })).toBeCloseTo(111.195, 2);
  });

  it("matches the well-known London → Paris distance (~343.5 km)", () => {
    const london = { lat: 51.5074, lng: -0.1278 };
    const paris = { lat: 48.8566, lng: 2.3522 };
    expect(haversineKm(london, paris)).toBeGreaterThan(343);
    expect(haversineKm(london, paris)).toBeLessThan(344.5);
  });

  it("is symmetric", () => {
    expect(haversineKm(johar, gulberg)).toBeCloseTo(haversineKm(gulberg, johar), 10);
  });

  it("gives sensible distances between the real MAD branches", () => {
    expect(haversineKm(johar, gulberg)).toBeGreaterThan(8);
    expect(haversineKm(johar, gulberg)).toBeLessThan(9.5);
    expect(haversineKm(johar, valencia)).toBeGreaterThan(7);
    expect(haversineKm(johar, valencia)).toBeLessThan(8.5);
  });
});

describe("destinationPoint", () => {
  it.each([0, 45, 90, 135, 180, 225, 270, 315])(
    "round-trips distance along bearing %i°",
    (bearing) => {
      for (const km of [0.5, 4.9, 5.1, 25]) {
        const p = destinationPoint(johar, bearing, km);
        expect(haversineKm(johar, p)).toBeCloseTo(km, 6);
      }
    },
  );

  it("moves north when bearing is 0", () => {
    const p = destinationPoint(johar, 0, 10);
    expect(p.lat).toBeGreaterThan(johar.lat);
    expect(p.lng).toBeCloseTo(johar.lng, 6);
  });
});

describe("midpoint", () => {
  it("is equidistant from both ends", () => {
    const m = midpoint(johar, valencia);
    expect(haversineKm(m, johar)).toBeCloseTo(haversineKm(m, valencia), 6);
  });
});

describe("isValidCoordinates", () => {
  it("accepts real branch coordinates", () => {
    for (const b of BRANCHES) {
      expect(isValidCoordinates({ lat: b.latitude, lng: b.longitude })).toBe(true);
    }
  });

  it.each([
    [null],
    [undefined],
    [{}],
    [{ lat: "31", lng: "74" }],
    [{ lat: NaN, lng: 74 }],
    [{ lat: Infinity, lng: 74 }],
    [{ lat: 91, lng: 74 }],
    [{ lat: 31, lng: 181 }],
    [{ lat: 0, lng: 0 }],
  ])("rejects %j", (value) => {
    expect(isValidCoordinates(value)).toBe(false);
  });
});

describe("formatDistance", () => {
  it("uses metres below 1 km and one decimal otherwise", () => {
    expect(formatDistance(0.85)).toBe("850 m");
    expect(formatDistance(2.34)).toBe("2.3 km");
  });

  it("never rounds an outside distance onto the limit", () => {
    expect(formatDistance(5.04, 5)).toBe("5.04 km");
    expect(formatDistance(4.96, 5)).toBe("4.96 km");
    expect(formatDistance(5, 5)).toBe("5.0 km");
  });
});
