import { useImperativeHandle, useLayoutEffect, useRef, type Ref } from "react";
import { Box2, Float32BufferAttribute, Mesh } from "three";
import type { ThreeElements } from "@react-three/fiber";

export type ShapeProps = Omit<React.JSX.IntrinsicElements["mesh"], "args"> & {
  ref?: Ref<Mesh>;
  args?: ThreeElements["extrudeGeometry"]["args"];
  bbox: Box2;
};

export default function ShapeBox(props: ShapeProps) {
  const { ref, args, bbox, children, ...meshProps } = props;
  const meshRef = useRef<Mesh>(null!);

  useImperativeHandle(ref, () => meshRef.current);
  // 依赖 bbox/args：只有几何体或包围盒变化时才重算 UV。
  // 缺少依赖数组会导致每次 render 都全量遍历顶点并重建 attribute。
  useLayoutEffect(() => {
    const { geometry } = meshRef.current;

    const pos = geometry.attributes.position;
    const width = bbox.max.x - bbox.min.x;
    const height = bbox.max.y - bbox.min.y;

    const uv = new Float32Array(pos.count * 2);
    for (let i = 0; i < pos.count; i++) {
      uv[i * 2] = (pos.getX(i) - bbox.min.x) / width;
      uv[i * 2 + 1] = (pos.getY(i) - bbox.min.y) / height;
    }

    geometry.deleteAttribute("uv");
    geometry.setAttribute("uv", new Float32BufferAttribute(uv, 2));
  }, [bbox, args]);

  return (
    <mesh ref={meshRef} {...meshProps}>
      <extrudeGeometry attach="geometry" args={args} />
      {children}
    </mesh>
  );
}
