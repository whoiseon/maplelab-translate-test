export interface Item {
  image: string;
  title: string;
  description: string;
  job: string;
  weaponAttack: string;
  magicAttack: string;
  effects: string;
  requiredLevel: number;
  requiredStats: string;
  upgradeSlots: number;
  sellPrice: number;
  equipGroup: string;
  category: string;
  subCategory: string;
  overallCategory: string;
}

export interface AttackStat {
  default: number;
  min: number;
  max: number;
}
