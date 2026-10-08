import { createRoot } from "react-dom/client";
import "./styles.css";
import Overlay from "./Overlay";
import Control from "./Control";

createRoot(document.getElementById("root")!).render(
  location.hash.startsWith("#overlay") ? <Overlay /> : <Control />,
);
