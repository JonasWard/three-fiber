import './App.css';
import {Canvas} from "@react-three/fiber";
import {OrbitControls} from "@react-three/drei";
import Box from "./Components/Box";
import ClayPatternCurveGeo from "./Components/ClayPatternCurveGeo";
import SimpleBrick from "./Components/SimpleBrick";

function App() {
  return (
      <div className="App">
          <Canvas className="canvas1"
              camera={{ fov: 50, near: 0.1, far: 2000, position: [0, 0, 1000] }}
          >
              <ambientLight />
              <pointLight position={[10, 10, 10]} />
              <Box position={[-120, 0, 0]} />
              <Box position={[120, 0, 0]} />
          </Canvas>
          <Canvas
              className="canvas2"
              style={{"position": "absolute"}}
              camera={{ fov: 50, near: 0.1, far: 2000, position: [0, 0, 1000] }}
          >
              <OrbitControls/>
              <ambientLight />
              <pointLight position={[10, 10, 10]} />
              <Box position={[-1.2, 0, 0]} />
              <Box position={[1.2, 0, 0]} />
              <SimpleBrick
                  radius={150.0}
                  baseHeight={-100.0}
                  pinHeight={250.0}
                  bodyHeight={160.0}
                  bodyLength={100.}
                  divisionLength={2.}
                  thickness={2.}
                  divisionsV={16}
                  uvGrid={{u:4,v:1}}
                  height={0.0}
              />
              {/*<ClayPatternCurveGeo*/}
              {/*    radius={150}*/}
              {/*    bodyLength={100.}*/}
              {/*    divisionLength={50.}*/}
              {/*    thickness={50.}*/}
              {/*    divisionsV={16}*/}
              {/*    uvGrid={{u:4,v:1}}*/}
              {/*    height={0.0}*/}
              {/*/>*/}
              {/*<ClayPatternCurveGeo*/}
              {/*    radius={150}*/}
              {/*    bodyLength={100.}*/}
              {/*    divisionLength={50.}*/}
              {/*    thickness={50.}*/}
              {/*    divisionsV={16}*/}
              {/*    uvGrid={{u:4,v:1}}*/}
              {/*    height={50. * 2.0}*/}
              {/*/>*/}
          </Canvas>
      </div>
  );
}

export default App;
