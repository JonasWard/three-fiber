import './App.css';
import {Canvas} from "@react-three/fiber";
import Box from "./Components/Box";
import {Vector3} from "three";
import Donut from "./Components/Donut";

function App() {
  return (
      <div className="App">
          <Canvas className="canvas1">
              <ambientLight />
              <pointLight position={[10, 10, 10]} />
              <Box position={[-1.2, 0, 0]} />
              <Box position={[1.2, 0, 0]} />
          </Canvas>
          <Canvas className="canvas2" style={{"position": "absolute"}}>
              <ambientLight />
              <pointLight position={[10, 10, 10]} />
              <Box position={[-1.8, 0, 0]} />
              <Donut
                  radius={2.}
                  position={new Vector3(0,0,0)}
                  thickness={1.}
                  divisionsUV={{u:64,v:32}}
                  uvGrid={{u:4,v:1}}
              />
          </Canvas>
      </div>
  );
}

export default App;
