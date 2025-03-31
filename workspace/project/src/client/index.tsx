import { createRoot, hydrateRoot } from "react-dom/client";
import { AAA, CCC } from "@shared/src/client/test";

const Main = () => {
  return (
    <div>
      Hello! ${AAA} {CCC}{" "}
    </div>
  );
};

const container = document.querySelector("#root")!;
if (module.hot) {
  createRoot(container).render(<Main />);
} else {
  hydrateRoot(container, <Main />);
}
