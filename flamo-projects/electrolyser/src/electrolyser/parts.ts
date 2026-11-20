import type { V } from './mesh';

function family(label: string, offset: V) { return { label, offset }; }

// Displacements are illustration distances in metres, applied to the assembly pose.
export const catalogue = {
  shell: family('钢壳', [0, 0, 0]),
  insulation: family('绝热层', [0, 1.45, 0]),
  collector: family('阴极导杆', [0, 2.65, 0]),
  lining: family('碳衬', [0, 3.90, 0]),
  aluminium: family('熔融铝', [0, 5.15, 0]),
  bath: family('电解质', [0, 6.55, 0]),
  ledge: family('冻结层', [0, 5.65, 0]),
  carbon: family('碳阳极', [0, 8.10, 0]),
  stem: family('阳极导杆及钢爪', [0, 9.75, 0]),
  clamp: family('阳极夹具', [0, 10.10, 0]),
  hood: family('可开启门板', [0, 0, 0]),
  sill: family('门板支座', [0, 2.65, 0]),
  bus: family('阳极电流母线', [0, 3.8, 0]),
  flex: family('叠片软连接', [0, 5.4, 0]),
  walkway: family('检修格栅', [0, 2.1, 0]),
  frame: family('端部门架', [0, 10.15, 0]),
  casing: family('集气箱体', [0, 12.95, -2.3]),
  rail: family('阳极母排', [0, 11.15, 0]),
  hopper: family('氧化铝料斗', [0, 11.75, 2.6]),
  alumina: family('氧化铝', [0, 13.2, 3.2]),
  breaker: family('破壳机', [0, 9.7, 2.65]),
  cylinder: family('气缸', [0, 12.9, 2.6]),
  services: family('气路及驱动装置', [0, 14.75, -2.75]),
  flue: family('排烟接口', [3.1, 13.3, -2.2]),
};
export type Family = keyof typeof catalogue;
export interface Piece { name: string; family: Family; offset: V }
export function piece(key: Family, suffix = '', spread: V = [0,0,0]): Piece {
  const {label, offset}=catalogue[key];
  return {family:key, name:suffix ? label+' · '+suffix : label,
    offset:[offset[0]+spread[0], offset[1]+spread[1], offset[2]+spread[2]]};
}
export function station(side:number, index:number) {
  return (side>0?'过道侧':'背侧')+' '+String(index+1).padStart(2,'0');
}
