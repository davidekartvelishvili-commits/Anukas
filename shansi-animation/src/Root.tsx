import "./index.css";
import { Composition } from "remotion";
import { ShansiIntro } from "./ShansiIntro";

export const RemotionRoot: React.FC = () => {
  return (
    <Composition
      id="ShansiIntro"
      component={ShansiIntro}
      durationInFrames={300}
      fps={30}
      width={1080}
      height={1920}
    />
  );
};
