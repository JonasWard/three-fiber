import './App.css';
import {Canvas} from "@react-three/fiber";
import Box from "./Components/Box";
import ClayCurveGeo from "./Components/ClayCurveGeo";

function App() {
  return (
      <div className="App">
          <Canvas className="canvas1">
              <ambientLight />
              <pointLight position={[10, 10, 10]} />
              <Box position={[-1.2, 0, 0]} />
              <Box position={[1.2, 0, 0]} />
          </Canvas>
          <Canvas
              className="canvas2"
              style={{"position": "absolute"}}
              camera={{ fov: 100, near: 0.1, far: 1000, position: [0, 0, 5] }}
          >
              <ambientLight />
              <pointLight position={[10, 10, 10]} />
              <Box position={[-1.8, 0, 0]} />
              <ClayCurveGeo
                  radius={1.5}
                  bodyLength={2.}
                  divisionLength={.2}
                  thickness={.15}
                  divisionsV={16}
                  uvGrid={{u:4,v:1}}
              />
          </Canvas>
      </div>
  );
}

export default App;
