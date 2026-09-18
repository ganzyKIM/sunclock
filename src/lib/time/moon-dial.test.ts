import { MoonState } from "../astro/lunar";
import { readMoonDial } from "./moon-dial";

function moon(overrides: Partial<MoonState>): MoonState {
  return {
    position: { altitude: 40, azimuth: 180 },
    declination: -20,
    hourAngle: 0,
    illuminatedFraction: 1,
    daysFromFullMoon: 0,
    phaseName: "보름달",
    waxing: false,
    ...overrides,
  };
}

describe("readMoonDial", () => {
  it("보름달이 남중하면 눈금은 오정을 가리킨다", () => {
    const reading = readMoonDial(moon({ hourAngle: 0 }), 180);
    expect(reading.dialMinutes).toBeCloseTo(720, 6);
    expect(reading.dialLabel).toBe("오정 초각");
  });

  it("12시간을 뒤집으면 자정이 된다", () => {
    const reading = readMoonDial(moon({ hourAngle: 0 }), 180);
    expect(reading.flippedMinutes).toBeCloseTo(0, 6);
    expect(reading.flippedLabel).toBe("자정 초각");
  });

  it("보름달에는 보정이 거의 없다", () => {
    const reading = readMoonDial(moon({ hourAngle: 0, daysFromFullMoon: 0 }), 180);
    expect(Math.abs(reading.correctionMinutes)).toBeLessThan(1);
  });

  it("보름을 지나면 눈금이 실제보다 이르다", () => {
    const reading = readMoonDial(
      moon({ hourAngle: -37.5, daysFromFullMoon: 3 }),
      180
    );
    expect(reading.correctionMinutes).toBeCloseTo(150, 6);
  });

  it("뒤집은 값에 보정을 더하면 실제 진태양시가 된다", () => {
    const sunHourAngle = -90;
    const reading = readMoonDial(moon({ hourAngle: 75 }), sunHourAngle);
    const expected = ((sunHourAngle + 180) * 4 + 1440) % 1440;
    expect(reading.correctedMinutes).toBeCloseTo(expected, 6);
  });

  it("어림셈은 하루에 50분가량이다", () => {
    const reading = readMoonDial(moon({ daysFromFullMoon: 3 }), 180);
    expect(reading.roughCorrectionMinutes).toBeCloseTo(3 * (1440 / 29.530588853), 3);
  });

  it("달이 밝고 높으면 그림자가 생긴다고 본다", () => {
    const reading = readMoonDial(
      moon({ illuminatedFraction: 0.9, position: { altitude: 30, azimuth: 200 } }),
      180
    );
    expect(reading.shadowVisible).toBe(true);
  });

  it("달이 어두우면 그림자가 생기지 않는다고 본다", () => {
    const reading = readMoonDial(moon({ illuminatedFraction: 0.2 }), 180);
    expect(reading.shadowVisible).toBe(false);
  });

  it("달이 낮게 떠 있으면 그림자가 생기지 않는다고 본다", () => {
    const reading = readMoonDial(
      moon({ position: { altitude: 4, azimuth: 150 } }),
      180
    );
    expect(reading.shadowVisible).toBe(false);
  });

  it("적위가 태양의 한계를 넘으면 절기선 밖이라고 알린다", () => {
    expect(readMoonDial(moon({ declination: 27 }), 180).beyondSolarTermLines).toBe(true);
    expect(readMoonDial(moon({ declination: -27 }), 180).beyondSolarTermLines).toBe(true);
    expect(readMoonDial(moon({ declination: 10 }), 180).beyondSolarTermLines).toBe(false);
  });
});
