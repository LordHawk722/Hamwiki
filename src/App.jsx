import "./types";
import { useView } from "./hooks";
import NavBar from "./components/NavBar.jsx";
import HomeView from "./components/HomeView.jsx";
import CollaborationView from "./components/CollaborationView.jsx";
import WikiView from "./components/WikiView.jsx";
import views from './data/views.js'

export default function App() {
  const { activeView, setActiveView } = useView();

  return (
    <div className="site-shell">
      <NavBar views={views} activeView={activeView} setActiveView={setActiveView}/>
          {activeView === "home" ? (<HomeView/>)
            : activeView === "preknowledge" ? (<WikiView category="preknowledge"/>)
              : activeView === "wiki" ? (<WikiView category="wiki"/>)
                : activeView === "collaboration" ? (<CollaborationView/>)
                  : (<div></div>)}
    </div>
  );
}
