import { ImageSourcePropType } from "react-native";

/**
 * 12지 짐승 그림.
 *
 * 코드로 그린 것이 아니라 그림책처럼 그린 일러스트다. 원본은 `art/zodiac`에
 * 있고, `scripts/crop_zodiac.py`가 빛나는 원반 둘레만 잘라 `assets/zodiac`에
 * 놓는다. 열둘 모두 같은 구도라서 어느 것을 오려 얹어도 한 벌로 보인다.
 */
const ART: Record<string, ImageSourcePropType> = {
  쥐: require("../../../assets/zodiac/rat.jpg"),
  소: require("../../../assets/zodiac/ox.jpg"),
  호랑이: require("../../../assets/zodiac/tiger.jpg"),
  토끼: require("../../../assets/zodiac/rabbit.jpg"),
  용: require("../../../assets/zodiac/dragon.jpg"),
  뱀: require("../../../assets/zodiac/snake.jpg"),
  말: require("../../../assets/zodiac/horse.jpg"),
  양: require("../../../assets/zodiac/sheep.jpg"),
  원숭이: require("../../../assets/zodiac/monkey.jpg"),
  닭: require("../../../assets/zodiac/rooster.jpg"),
  개: require("../../../assets/zodiac/dog.jpg"),
  돼지: require("../../../assets/zodiac/pig.jpg"),
};

/** 짐승 이름으로 그림을 찾는다. 모르는 이름이면 undefined다. */
export function zodiacArt(animal: string): ImageSourcePropType | undefined {
  return ART[animal];
}
