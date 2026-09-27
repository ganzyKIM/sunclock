/**
 * 시험판에서 갈아 끼우는 것들.
 *
 * 저장소와 그래픽 엔진은 둘 다 기기에 붙어 있는 것이라 시험에서는 쓸 수 없다.
 * 저장소는 라이브러리가 함께 주는 가짜를 쓰고, 그래픽은 여기서 간단히 흉내 낸다.
 * 그려진 그림이 맞는지는 시험이 아니라 `npm run render-dial`로 눈으로 본다.
 */

jest.mock("@react-native-async-storage/async-storage", () =>
  require("@react-native-async-storage/async-storage/jest/async-storage-mock")
);

jest.mock("@shopify/react-native-skia", () => {
  const React = require("react");
  const { View } = require("react-native");

  const draw = (name) => {
    const Component = ({ children }) =>
      React.createElement(View, { testID: `skia-${name}` }, children);
    Component.displayName = name;
    return Component;
  };

  /** 실제로 선을 긋지는 않고 부르는 대로 받아만 준다. */
  const makePath = () => {
    const path = {};
    for (const method of ["moveTo", "lineTo", "addArc", "addCircle", "addOval", "close"]) {
      path[method] = () => path;
    }
    return path;
  };

  return {
    BlurMask: draw("blur-mask"),
    Canvas: draw("canvas"),
    Group: draw("group"),
    Path: draw("path"),
    Circle: draw("circle"),
    Line: draw("line"),
    LinearGradient: draw("linear-gradient"),
    RadialGradient: draw("radial-gradient"),
    vec: (x, y) => ({ x, y }),
    Skia: {
      Path: {
        Make: makePath,
        MakeFromSVGString: (d) => (typeof d === "string" && d.length > 0 ? makePath() : null),
      },
    },
  };
});
