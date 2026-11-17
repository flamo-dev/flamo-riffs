export interface StageCamera { zoom: number; positionX: number; positionY: number; rotation: 0 }
export function containStage(width: number, height: number, stageWidth = 720, stageHeight = 1280): StageCamera {
  if (![width,height,stageWidth,stageHeight].every(v=>Number.isFinite(v)&&v>0)) throw Error('Invalid stage dimensions');
  const zoom=Math.min(width/stageWidth,height/stageHeight);
  return {zoom,positionX:(stageWidth*zoom-width)/2,positionY:(stageHeight*zoom-height)/2,rotation:0};
}
export function stagePoint(camera: StageCamera, x: number, y: number, inverse = false): {x:number;y:number} {
  if (![x,y,camera.zoom,camera.positionX,camera.positionY].every(Number.isFinite)||camera.zoom<=0) throw Error('Invalid camera point');
  return inverse ? {x:(x+camera.positionX)/camera.zoom,y:(y+camera.positionY)/camera.zoom} : {x:x*camera.zoom-camera.positionX,y:y*camera.zoom-camera.positionY};
}
/** Orthographic 2.5D layer offset. Depth is authored; no inferred video geometry. */
export function parallaxOffset(depth: number, x: number, y: number, limit=6): {x:number;y:number} {
  if (![depth,x,y,limit].every(Number.isFinite)||limit<0) throw Error('Invalid parallax');
  return {x:Math.max(-limit,Math.min(limit,depth*x)),y:Math.max(-limit,Math.min(limit,depth*y))};
}
