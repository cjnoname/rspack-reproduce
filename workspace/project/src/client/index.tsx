import { createRoot, hydrateRoot } from "react-dom/client";

const Main = () => {
  return <div>Hello!</div>;
};

const container = document.querySelector("#root")!;
if (module.hot) {
  createRoot(container).render(<Main />);
} else {
  hydrateRoot(container, <Main />);
}
